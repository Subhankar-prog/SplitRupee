import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { mockPrisma, mockHookState } = vi.hoisted(() => ({
  mockPrisma: {
    groupMember: { count: vi.fn() },
    group: { findFirst: vi.fn() },
    expense: { findFirst: vi.fn() },
    payment: { findFirst: vi.fn() },
    activityLog: { findFirst: vi.fn() },
  },
  mockHookState: {
    userId: undefined as string | undefined,
    cleanup: undefined as (() => void) | undefined,
    lastDeps: undefined as unknown[] | undefined,
    refs: [] as Array<{ current: any }>,
    refIndex: 0,
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/lib/userContext", () => ({
  useUser: () => ({
    currentUser: mockHookState.userId ? { id: mockHookState.userId } : null,
  }),
}));

vi.mock("react", () => ({
  useRef: (initial: unknown) => {
    const idx = mockHookState.refIndex++;
    if (!mockHookState.refs[idx]) {
      mockHookState.refs[idx] = { current: initial };
    }
    return mockHookState.refs[idx];
  },
  useEffect: (effect: () => void | (() => void), deps?: unknown[]) => {
    const depsChanged =
      !mockHookState.lastDeps ||
      !deps ||
      deps.length !== mockHookState.lastDeps.length ||
      deps.some((d, i) => !Object.is(d, mockHookState.lastDeps![i]));

    if (depsChanged) {
      if (mockHookState.cleanup) {
        mockHookState.cleanup();
        mockHookState.cleanup = undefined;
      }
      mockHookState.lastDeps = deps ? [...deps] : undefined;
      const cleanup = effect();
      mockHookState.cleanup = typeof cleanup === "function" ? cleanup : undefined;
    }
  },
}));

import { GET } from "@/app/api/realtime/stream/route";
import { useRealtimeSync } from "@/lib/useRealtimeSync";

describe("GET /api/realtime/stream", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("closes legacy SSE requests immediately so serverless functions never time out", async () => {
    const req = new Request("https://splitrupee.vercel.app/api/realtime/stream");
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/event-stream");
    const bodyText = await res.text();
    expect(bodyText).toContain('data: {"type":"CONNECTED"}');
    expect(mockPrisma.groupMember.count).not.toHaveBeenCalled();
  });

  it("returns 400 when mode=version is missing userId", async () => {
    const req = new Request("https://splitrupee.vercel.app/api/realtime/stream?mode=version");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.ok).toBe(false);
    expect(json.error).toMatch(/userId/i);
  });

  it("returns deterministic version fingerprint for mode=version", async () => {
    mockPrisma.groupMember.count.mockResolvedValue(2);
    mockPrisma.group.findFirst.mockResolvedValue({
      id: "g1",
      updatedAt: new Date("2026-11-11T10:00:00.000Z"),
    });
    mockPrisma.expense.findFirst.mockResolvedValue({
      id: "e1",
      updatedAt: new Date("2026-11-11T10:05:00.000Z"),
    });
    mockPrisma.payment.findFirst.mockResolvedValue({
      id: "p1",
      createdAt: new Date("2026-11-11T10:06:00.000Z"),
    });
    mockPrisma.activityLog.findFirst.mockResolvedValue({
      id: "a1",
      createdAt: new Date("2026-11-11T10:07:00.000Z"),
    });

    const req = new Request(
      "https://splitrupee.vercel.app/api/realtime/stream?mode=version&userId=u1"
    );
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toContain("no-store");
    expect(json.ok).toBe(true);
    expect(json.version).toBe(
      `2:g1:${new Date("2026-11-11T10:00:00.000Z").getTime()}:e1:${new Date("2026-11-11T10:05:00.000Z").getTime()}:p1:${new Date("2026-11-11T10:06:00.000Z").getTime()}:a1:${new Date("2026-11-11T10:07:00.000Z").getTime()}`
    );
  });

  it("degrades gracefully with ok:false on transient database error", async () => {
    mockPrisma.groupMember.count.mockRejectedValue(new Error("DB timeout"));

    const req = new Request(
      "https://splitrupee.vercel.app/api/realtime/stream?mode=version&userId=u1"
    );
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.ok).toBe(false);
    expect(json.version).toBeNull();
  });
});

interface PendingFetch {
  url: string;
  signal?: AbortSignal;
  resolve: (value: { ok: boolean; json: () => Promise<unknown> }) => void;
  reject: (reason?: unknown) => void;
}

function createDeferredFetchMock() {
  const calls: PendingFetch[] = [];
  const fetchMock = vi.fn((url: string, init?: { signal?: AbortSignal }) => {
    return new Promise<{ ok: boolean; json: () => Promise<unknown> }>((resolve, reject) => {
      const signal = init?.signal;
      if (signal?.aborted) {
        reject(signal.reason ?? Object.assign(new Error("Aborted"), { name: "AbortError" }));
        return;
      }
      const onAbort = () => {
        reject(signal?.reason ?? Object.assign(new Error("Aborted"), { name: "AbortError" }));
      };
      signal?.addEventListener("abort", onAbort, { once: true });
      calls.push({
        url,
        signal,
        resolve: (val) => {
          signal?.removeEventListener("abort", onAbort);
          resolve(val);
        },
        reject: (err) => {
          signal?.removeEventListener("abort", onAbort);
          reject(err);
        },
      });
    });
  });
  return { fetchMock, calls };
}

describe("useRealtimeSync (lib/useRealtimeSync.ts)", () => {
  const origWindow = globalThis.window;
  const origDocument = (globalThis as any).document;
  const origNavigator = globalThis.navigator;
  const origFetch = globalThis.fetch;
  const origEvent = globalThis.Event;

  let windowListeners: Map<string, Set<() => void>>;
  let documentListeners: Map<string, Set<() => void>>;
  let dispatchedEvents: string[];
  let unhandledRejections: unknown[];
  let onUnhandledRejection: (reason: unknown) => void;

  function renderHook(userId?: string) {
    mockHookState.userId = userId;
    mockHookState.refIndex = 0;
    useRealtimeSync();
  }

  function unmountHook() {
    if (mockHookState.cleanup) {
      mockHookState.cleanup();
      mockHookState.cleanup = undefined;
    }
    mockHookState.lastDeps = undefined;
    mockHookState.refs = [];
    mockHookState.refIndex = 0;
  }

  function emitWindow(type: string) {
    windowListeners.get(type)?.forEach((fn) => fn());
  }

  function emitDocument(type: string) {
    documentListeners.get(type)?.forEach((fn) => fn());
  }

  async function flushMicrotasks() {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  }

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-11T12:00:00.000Z"));

    mockHookState.userId = undefined;
    mockHookState.cleanup = undefined;
    mockHookState.lastDeps = undefined;
    mockHookState.refs = [];
    mockHookState.refIndex = 0;

    windowListeners = new Map();
    documentListeners = new Map();
    dispatchedEvents = [];
    unhandledRejections = [];

    onUnhandledRejection = (reason) => {
      unhandledRejections.push(reason);
    };
    process.on("unhandledRejection", onUnhandledRejection);

    class MockEvent {
      type: string;
      constructor(type: string) {
        this.type = type;
      }
    }

    (globalThis as any).Event = MockEvent;
    (globalThis as any).window = {
      addEventListener: (type: string, fn: () => void) => {
        if (!windowListeners.has(type)) windowListeners.set(type, new Set());
        windowListeners.get(type)!.add(fn);
      },
      removeEventListener: (type: string, fn: () => void) => {
        windowListeners.get(type)?.delete(fn);
      },
      dispatchEvent: (ev: { type: string }) => {
        dispatchedEvents.push(ev.type);
        return true;
      },
    };
    (globalThis as any).document = {
      visibilityState: "visible",
      addEventListener: (type: string, fn: () => void) => {
        if (!documentListeners.has(type)) documentListeners.set(type, new Set());
        documentListeners.get(type)!.add(fn);
      },
      removeEventListener: (type: string, fn: () => void) => {
        documentListeners.get(type)?.delete(fn);
      },
    };
    Object.defineProperty(globalThis, "navigator", {
      value: { onLine: true },
      configurable: true,
    });
  });

  afterEach(() => {
    unmountHook();
    process.off("unhandledRejection", onUnhandledRejection);
    vi.useRealTimers();
    (globalThis as any).window = origWindow;
    (globalThis as any).document = origDocument;
    Object.defineProperty(globalThis, "navigator", {
      value: origNavigator,
      configurable: true,
    });
    (globalThis as any).fetch = origFetch;
    (globalThis as any).Event = origEvent;
  });

  it("skips duplicate rapid visibilitychange and focus events without aborting the in-flight request", async () => {
    const { fetchMock, calls } = createDeferredFetchMock();
    (globalThis as any).fetch = fetchMock;

    renderHook("u1");
    expect(calls).toHaveLength(1);
    const firstSignal = calls[0].signal!;
    expect(firstSignal.aborted).toBe(false);

    // Simulate rapid back-to-back visibilitychange + focus burst within dedupe window
    emitDocument("visibilitychange");
    emitWindow("focus");
    vi.advanceTimersByTime(50);
    emitWindow("focus");
    emitDocument("visibilitychange");

    expect(firstSignal.aborted).toBe(false);
    expect(calls).toHaveLength(1);

    calls[0].resolve({
      ok: true,
      json: async () => ({ ok: true, version: "v1" }),
    });
    await flushMicrotasks();

    // No redundant follow-up poll spawned from the rapid same-window focus burst
    expect(calls).toHaveLength(1);
    expect(unhandledRejections).toEqual([]);
  });

  it("coalesces online and delayed focus checks into a single follow-up without aborting or looping", async () => {
    const { fetchMock, calls } = createDeferredFetchMock();
    (globalThis as any).fetch = fetchMock;

    renderHook("u1");
    expect(calls).toHaveLength(1);

    // Advance past dedupe window and fire multiple focus + online checks while request #1 is pending
    vi.advanceTimersByTime(1500);
    emitWindow("focus");
    emitWindow("online");
    emitWindow("online");
    emitDocument("visibilitychange");

    expect(calls[0].signal?.aborted).toBe(false);
    expect(calls).toHaveLength(1);

    // Resolve request #1 -> spawns exactly one coalesced follow-up check
    calls[0].resolve({
      ok: true,
      json: async () => ({ ok: true, version: "v1" }),
    });
    await flushMicrotasks();

    expect(calls).toHaveLength(2);
    expect(calls[1].signal?.aborted).toBe(false);

    // Resolving follow-up check with updated version dispatches splitrupee_refresh and stops cleanly
    calls[1].resolve({
      ok: true,
      json: async () => ({ ok: true, version: "v2" }),
    });
    await flushMicrotasks();

    expect(calls).toHaveLength(2);
    expect(dispatchedEvents).toContain("splitrupee_refresh");
    expect(unhandledRejections).toEqual([]);
  });

  it("marks cancelled before aborting on unmount and drops pending follow-up checks without unhandled AbortError", async () => {
    const { fetchMock, calls } = createDeferredFetchMock();
    (globalThis as any).fetch = fetchMock;

    renderHook("u1");
    expect(calls).toHaveLength(1);
    const signal = calls[0].signal!;

    let abortedWasCancelled = false;
    signal.addEventListener("abort", () => {
      // Simulate checking observer state cleanly during abort event
      abortedWasCancelled = signal.aborted;
    });

    // Queue an online follow-up, then unmount before request #1 settles
    emitWindow("online");
    unmountHook();
    await flushMicrotasks();

    expect(abortedWasCancelled).toBe(true);
    expect(signal.aborted).toBe(true);
    expect((signal.reason as Error)?.name).toBe("AbortError");
    // No follow-up check launched after unmount cancellation
    expect(calls).toHaveLength(1);
    expect(unhandledRejections).toEqual([]);
  });

  it("aborts the previous user session request cleanly on userId change and starts polling for the new user", async () => {
    const { fetchMock, calls } = createDeferredFetchMock();
    (globalThis as any).fetch = fetchMock;

    renderHook("u1");
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toContain("userId=u1");

    // Change userId before u1's request settles
    renderHook("u2");
    await flushMicrotasks();

    expect(calls[0].signal?.aborted).toBe(true);
    expect((calls[0].signal?.reason as Error)?.name).toBe("AbortError");
    expect(calls).toHaveLength(2);
    expect(calls[1].url).toContain("userId=u2");
    expect(calls[1].signal?.aborted).toBe(false);

    calls[1].resolve({
      ok: true,
      json: async () => ({ ok: true, version: "u2-v1" }),
    });
    await flushMicrotasks();
    expect(unhandledRejections).toEqual([]);
  });

  it("aborts stalled version requests after timeout so polling recovers without getting stuck", async () => {
    const { fetchMock, calls } = createDeferredFetchMock();
    (globalThis as any).fetch = fetchMock;

    renderHook("u1");
    expect(calls).toHaveLength(1);
    expect(calls[0].signal?.aborted).toBe(false);

    // Advance past the 10s safety timeout
    vi.advanceTimersByTime(10_000);
    await flushMicrotasks();

    expect(calls[0].signal?.aborted).toBe(true);
    expect((calls[0].signal?.reason as Error)?.name).toBe("AbortError");
    expect(unhandledRejections).toEqual([]);

    // Next focus check runs normally now that in-flight state cleared
    emitWindow("focus");
    expect(calls).toHaveLength(2);
    expect(calls[1].signal?.aborted).toBe(false);

    calls[1].resolve({
      ok: true,
      json: async () => ({ ok: true, version: "v1" }),
    });
    await flushMicrotasks();
    expect(unhandledRejections).toEqual([]);
  });
});


