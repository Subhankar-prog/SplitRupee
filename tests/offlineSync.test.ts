import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  resolveOfflineActionType,
  saveCachedGroup,
  getCachedGroup,
  saveCachedGroupsList,
  getCachedGroupsList,
  saveCachedAllExpenses,
  getCachedAllExpenses,
  saveCachedActivities,
  getCachedActivities,
  saveCachedItineraries,
  getCachedItineraries,
  saveCachedItineraryDraft,
  getCachedItineraryDraft,
  getOfflineQueue,
  addOfflineExpense,
  addOfflineDeleteExpense,
  addOfflinePayment,
  clearOfflineQueue,
  syncOfflineQueue,
} from "@/lib/offlineSync";

function createMemoryStorage() {
  const store = new Map<string, string>();
  return {
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
    removeItem(key: string) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
  };
}

describe("Offline Sync & Caching Engine (lib/offlineSync.ts)", () => {
  const origWindow = globalThis.window;
  const origLocalStorage = (globalThis as any).localStorage;
  const origFetch = globalThis.fetch;
  const origEvent = globalThis.Event;

  let dispatchedEvents: string[] = [];

  beforeEach(() => {
    dispatchedEvents = [];
    const memoryStorage = createMemoryStorage();

    class MockEvent {
      type: string;
      constructor(type: string) {
        this.type = type;
      }
    }

    (globalThis as any).Event = MockEvent;
    (globalThis as any).localStorage = memoryStorage;
    (globalThis as any).window = {
      dispatchEvent: (ev: { type?: string }) => {
        if (ev?.type) dispatchedEvents.push(ev.type);
        return true;
      },
    };
  });

  afterEach(() => {
    clearOfflineQueue();
    (globalThis as any).window = origWindow;
    (globalThis as any).localStorage = origLocalStorage;
    globalThis.fetch = origFetch;
    (globalThis as any).Event = origEvent;
    vi.restoreAllMocks();
  });

  const sampleGroup = {
    id: "g1",
    name: "Goa Trip",
    creatorId: "u1",
    members: [
      { id: "u1", name: "Aarav", avatarColor: "#10b981", role: "ADMIN" },
      { id: "u2", name: "Rohan", avatarColor: "#0ea5e9", role: "MEMBER" },
    ],
    expenses: [
      {
        id: "exp_srv_1",
        groupId: "g1",
        title: "Airport Cab",
        totalAmount: 400,
        currency: "INR",
        paidById: "u1",
        paidBy: { id: "u1", name: "Aarav", avatarColor: "#10b981" },
        category: "Transport",
        splitType: "EQUAL",
        date: "2026-11-10T10:00:00.000Z",
        splits: [
          { id: "s1", userId: "u1", amount: 200, user: { id: "u1", name: "Aarav" } },
          { id: "s2", userId: "u2", amount: 200, user: { id: "u2", name: "Rohan" } },
        ],
      },
    ],
    payments: [],
  };

  it("queues offline expenses, overlays caches, and updates unsynced offline_ items in-place", () => {
    saveCachedGroup("g1", sampleGroup);
    saveCachedAllExpenses([
      {
        ...sampleGroup.expenses[0],
        groupName: "Goa Trip",
      },
    ]);
    saveCachedActivities("u1", []);

    const created = addOfflineExpense({
      isEdit: false,
      groupId: "g1",
      groupName: "Goa Trip",
      title: "Beach Dinner",
      totalAmount: 600,
      payload: {
        groupId: "g1",
        title: "Beach Dinner",
        totalAmount: 600,
        paidById: "u2",
        category: "Food",
        splitType: "EQUAL",
        splits: [
          { userId: "u1", amount: 300 },
          { userId: "u2", amount: 300 },
        ],
      },
    });

    expect(created.id.startsWith("offline_")).toBe(true);
    expect(resolveOfflineActionType(created)).toBe("CREATE_EXPENSE");
    expect(getOfflineQueue()).toHaveLength(1);
    expect(dispatchedEvents).toContain("splitrupee_offline_queue_changed");

    const cachedGroup = getCachedGroup("g1");
    expect(cachedGroup.expenses).toHaveLength(2);
    expect(cachedGroup.expenses[0].isOfflinePending).toBe(true);
    expect(cachedGroup.expenses[0].title).toBe("Beach Dinner");

    // Edit the unsynced offline_ expense before reconnection
    const editedOffline = addOfflineExpense({
      isEdit: true,
      expenseId: created.id,
      groupId: "g1",
      groupName: "Goa Trip",
      title: "Beach Dinner Updated",
      totalAmount: 800,
      payload: {
        groupId: "g1",
        title: "Beach Dinner Updated",
        totalAmount: 800,
        paidById: "u2",
        category: "Food",
        splitType: "EQUAL",
        splits: [
          { userId: "u1", amount: 400 },
          { userId: "u2", amount: 400 },
        ],
      },
    });

    // Must still remain a single CREATE_EXPENSE item with same id
    expect(editedOffline.id).toBe(created.id);
    expect(resolveOfflineActionType(editedOffline)).toBe("CREATE_EXPENSE");
    expect(getOfflineQueue()).toHaveLength(1);

    const updatedAllExpenses = getCachedAllExpenses();
    expect(updatedAllExpenses).toHaveLength(2);
    expect(updatedAllExpenses[0].title).toBe("Beach Dinner Updated");
    expect(updatedAllExpenses[0].totalAmount).toBe(800);

    const activities = getCachedActivities("u1");
    expect(activities).toHaveLength(1);
    expect(activities[0].action).toBe("EXPENSE_CREATED");
    expect(activities[0].isOfflinePending).toBe(true);

    // Deleting an unsynced offline_ item removes it locally without queuing DELETE
    const delRes = addOfflineDeleteExpense({
      expenseId: created.id,
      groupId: "g1",
      title: "Beach Dinner Updated",
      totalAmount: 800,
    });
    expect(delRes.removedLocal).toBe(true);
    expect(getOfflineQueue()).toHaveLength(0);
    expect(getCachedGroup("g1").expenses).toHaveLength(1);
  });

  it("queues server expense edits/deletes and drops superseded UPDATE when DELETED", () => {
    saveCachedGroup("g1", sampleGroup);
    saveCachedAllExpenses([{ ...sampleGroup.expenses[0], groupName: "Goa Trip" }]);

    addOfflineExpense({
      isEdit: true,
      expenseId: "exp_srv_1",
      groupId: "g1",
      groupName: "Goa Trip",
      title: "Airport Taxi",
      totalAmount: 500,
      payload: {
        groupId: "g1",
        title: "Airport Taxi",
        totalAmount: 500,
        paidById: "u1",
        category: "Transport",
        splitType: "EQUAL",
        splits: [
          { userId: "u1", amount: 250 },
          { userId: "u2", amount: 250 },
        ],
      },
    });

    expect(getOfflineQueue()).toHaveLength(1);
    expect(getCachedGroup("g1").expenses[0].title).toBe("Airport Taxi");
    expect(getCachedAllExpenses()[0].totalAmount).toBe(500);

    // Deleting server expense drops the pending UPDATE and queues DELETE_EXPENSE
    const delRes = addOfflineDeleteExpense({
      expenseId: "exp_srv_1",
      groupId: "g1",
      groupName: "Goa Trip",
      title: "Airport Taxi",
      totalAmount: 500,
      deletedById: "u1",
    });

    expect(delRes.removedLocal).toBe(false);
    const queue = getOfflineQueue();
    expect(queue).toHaveLength(1);
    expect(resolveOfflineActionType(queue[0])).toBe("DELETE_EXPENSE");
    expect(getCachedGroup("g1").expenses).toHaveLength(0);
    expect(getCachedAllExpenses()).toHaveLength(0);
  });

  it("queues offline cash settlements and injects pending payments + activity log", () => {
    saveCachedGroup("g1", sampleGroup);
    saveCachedActivities("u1", []);

    const pay = addOfflinePayment({
      groupId: "g1",
      groupName: "Goa Trip",
      payerId: "u2",
      payerName: "Rohan",
      receiverId: "u1",
      receiverName: "Aarav",
      amount: 200,
      notes: "Cash handover",
      callerId: "u2",
      idempotencyKey: "pay_idem_1",
    });

    expect(resolveOfflineActionType(pay)).toBe("CREATE_PAYMENT");
    const cachedGroup = getCachedGroup("g1");
    expect(cachedGroup.payments).toHaveLength(1);
    expect(cachedGroup.payments[0].amount).toBe(200);
    expect(cachedGroup.payments[0].isOfflinePending).toBe(true);

    const acts = getCachedActivities("u1");
    expect(acts[0].action).toBe("PAYMENT_SETTLED");
    expect(acts[0].isOfflinePending).toBe(true);
  });

  it("caches groups list and itineraries + drafts offline", () => {
    saveCachedGroupsList([{ id: "g1", name: "Goa Trip" }]);
    expect(getCachedGroupsList()).toHaveLength(1);

    saveCachedItineraries("u1", [{ id: "it1", title: "Trip: Delhi -> Manali" }]);
    expect(getCachedItineraries("u1")[0].title).toBe("Trip: Delhi -> Manali");

    saveCachedItineraryDraft({
      form: { origin: "Delhi", destination: "Manali", nights: 4 },
      result: { days: [{ day: 1, title: "Arrival" }] },
      savedItineraryId: "it1",
    });
    const draft = getCachedItineraryDraft();
    expect(draft?.form?.destination).toBe("Manali");
    expect(draft?.savedItineraryId).toBe("it1");
  });

  it("keeps items queued on SW { offline: true } response and replays all 4 action types online", async () => {
    addOfflineExpense({
      isEdit: false,
      groupId: "g1",
      title: "Create Item",
      totalAmount: 100,
      payload: { groupId: "g1", title: "Create Item", totalAmount: 100 },
    });
    addOfflineExpense({
      isEdit: true,
      expenseId: "exp_srv_2",
      groupId: "g1",
      title: "Update Item",
      totalAmount: 200,
      payload: { groupId: "g1", title: "Update Item", totalAmount: 200 },
    });
    addOfflineDeleteExpense({
      expenseId: "exp_srv_3",
      groupId: "g1",
      title: "Delete Item",
      totalAmount: 300,
      deletedById: "u1",
    });
    addOfflinePayment({
      groupId: "g1",
      payerId: "u2",
      payerName: "Rohan",
      receiverId: "u1",
      receiverName: "Aarav",
      amount: 150,
      callerId: "u2",
      idempotencyKey: "idem_sync_1",
    });

    // 1. Simulate offline SW JSON fallback -> must keep all 4 items
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: false, offline: true }),
    }) as any;

    const offlineResult = await syncOfflineQueue();
    expect(offlineResult.syncedCount).toBe(0);
    expect(offlineResult.errors).toHaveLength(4);
    expect(getOfflineQueue()).toHaveLength(4);

    // 2. Simulate online replay -> all 4 actions succeed with right endpoints & methods
    const calls: Array<{ url: string; method: string }> = [];
    globalThis.fetch = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
      calls.push({ url, method: init?.method || "GET" });
      return {
        ok: true,
        status: 200,
        json: async () => ({ ok: true }),
      };
    }) as any;

    const onlineResult = await syncOfflineQueue();
    expect(onlineResult.syncedCount).toBe(4);
    expect(onlineResult.errors).toEqual([]);
    expect(getOfflineQueue()).toHaveLength(0);
    expect(calls).toEqual([
      { url: "/api/expenses", method: "POST" },
      { url: "/api/expenses/exp_srv_2", method: "PUT" },
      { url: "/api/expenses/exp_srv_3?deletedById=u1", method: "DELETE" },
      { url: "/api/payments", method: "POST" },
    ]);
  });
});

