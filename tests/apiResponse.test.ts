import { describe, it, expect } from "vitest";
import { parseApiJsonResponse, resolveDataViewMode } from "@/lib/apiResponse";

describe("API Response Contract & State Classification (F-12)", () => {
  it("parses standard ok:true responses", async () => {
    const res = new Response(JSON.stringify({ ok: true, groups: [{ id: "g1" }] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
    const outcome = await parseApiJsonResponse<{ ok?: boolean; groups?: any[] }>(
      res,
      "Fallback error"
    );
    expect(outcome.kind).toBe("ok");
    if (outcome.kind === "ok") {
      expect(outcome.data.groups).toHaveLength(1);
    }
  });

  it("identifies Service Worker offline intercept envelope (HTTP 200 + offline:true)", async () => {
    const res = new Response(
      JSON.stringify({
        ok: false,
        offline: true,
        message: "Network unavailable. SplitRupee offline mode is active.",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
    const outcome = await parseApiJsonResponse(res, "Fallback error");
    expect(outcome).toEqual({
      kind: "offline",
      message: "Network unavailable. SplitRupee offline mode is active.",
    });
  });

  it("maps known API route error codes and issue arrays without raw internal constants", async () => {
    const notFound = new Response(JSON.stringify({ ok: false, error: "GROUP_NOT_FOUND" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
    const out1 = await parseApiJsonResponse(notFound, "Fallback");
    expect(out1.kind).toBe("error");
    if (out1.kind === "error") {
      expect(out1.status).toBe(404);
      expect(out1.message).toContain("could not be found");
    }

    const issueRes = new Response(
      JSON.stringify({ ok: false, error: "CUSTOM_ERR", issues: ["Could not load expenses"] }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
    const out2 = await parseApiJsonResponse(issueRes, "Fallback");
    expect(out2).toEqual({
      kind: "error",
      status: 500,
      code: "CUSTOM_ERR",
      message: "Could not load expenses",
    });
  });

  it("handles non-JSON 502/500 gateway responses safely", async () => {
    const htmlError = new Response("<html>Bad Gateway</html>", { status: 502 });
    const outcome = await parseApiJsonResponse(htmlError, "Could not load your groups.");
    expect(outcome).toEqual({
      kind: "error",
      status: 502,
      message: "Could not load your groups. (HTTP 502).",
    });
  });

  it("distinguishes loading, error, empty, filtered-empty, and cached-ready states", () => {
    expect(
      resolveDataViewMode({
        isLoading: true,
        totalCount: 0,
        visibleCount: 0,
        hasFilterActive: false,
        fetchIssue: null,
      })
    ).toBe("loading");

    expect(
      resolveDataViewMode({
        isLoading: false,
        totalCount: 0,
        visibleCount: 0,
        hasFilterActive: false,
        fetchIssue: { kind: "error", message: "Server down" },
      })
    ).toBe("error");

    expect(
      resolveDataViewMode({
        isLoading: false,
        totalCount: 0,
        visibleCount: 0,
        hasFilterActive: false,
        fetchIssue: null,
      })
    ).toBe("empty");

    expect(
      resolveDataViewMode({
        isLoading: false,
        totalCount: 6,
        visibleCount: 0,
        hasFilterActive: true,
        fetchIssue: null,
      })
    ).toBe("filtered-empty");

    // Stale cached data remains visible while offline/error banner renders above it
    expect(
      resolveDataViewMode({
        isLoading: false,
        totalCount: 3,
        visibleCount: 3,
        hasFilterActive: false,
        fetchIssue: { kind: "offline", message: "Offline" },
      })
    ).toBe("ready");
  });
});

