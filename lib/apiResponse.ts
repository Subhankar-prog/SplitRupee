export type ApiResponseOutcome<T = Record<string, unknown>> =
  | { kind: "ok"; data: T }
  | { kind: "offline"; message: string }
  | { kind: "error"; status: number; code?: string; message: string };

export interface FetchIssueState {
  kind: "offline" | "error";
  message: string;
}

const KNOWN_ERROR_MESSAGES: Record<string, string> = {
  GROUP_NOT_FOUND: "This group could not be found or you no longer have access.",
  INVALID_GROUP_ID: "The group link appears to be invalid.",
  FETCH_FAILED: "The server could not load your data right now.",
  FETCH_ACTIVITIES_FAILED: "Could not load your activity history right now.",
  MISSING_PARAM: "Missing account context while requesting data.",
};

/**
 * Inspects a Fetch Response according to SplitRupee API route & Service Worker contracts.
 * Handles non-JSON server failures, Service Worker offline JSON envelopes (HTTP 200 with offline: true),
 * and non-ok / ok:false JSON error payloads cleanly.
 */
export async function parseApiJsonResponse<T extends { ok?: boolean } = Record<string, unknown> & { ok?: boolean }>(
  res: Response,
  fallbackMessage: string
): Promise<ApiResponseOutcome<T>> {
  let payload: any = null;
  try {
    payload = await res.json();
  } catch {
    return {
      kind: "error",
      status: res.status || 500,
      message: res.ok ? fallbackMessage : `${fallbackMessage} (HTTP ${res.status}).`,
    };
  }

  if (payload && payload.offline === true) {
    return {
      kind: "offline",
      message:
        typeof payload.message === "string" && payload.message.trim()
          ? payload.message
          : "You are currently offline. Showing cached local data.",
    };
  }

  if (!res.ok || !payload || payload.ok !== true) {
    const code = typeof payload?.error === "string" ? payload.error : undefined;
    const issueMsg =
      Array.isArray(payload?.issues) && typeof payload.issues[0] === "string"
        ? payload.issues[0]
        : undefined;
    const rawMessage = typeof payload?.message === "string" ? payload.message : undefined;
    const mapped = (code && KNOWN_ERROR_MESSAGES[code]) || issueMsg || rawMessage || fallbackMessage;

    return {
      kind: "error",
      status: res.status || 500,
      code,
      message: mapped,
    };
  }

  return { kind: "ok", data: payload as T };
}

export type DataViewMode = "loading" | "error" | "filtered-empty" | "empty" | "ready";

/**
 * Distinguishes initial loading, fatal load failure (no data & no cache),
 * filtered-to-zero matches, genuine zero items, and populated views.
 */
export function resolveDataViewMode(params: {
  isLoading: boolean;
  totalCount: number;
  visibleCount: number;
  hasFilterActive: boolean;
  fetchIssue: FetchIssueState | null;
}): DataViewMode {
  const { isLoading, totalCount, visibleCount, hasFilterActive, fetchIssue } = params;

  if (isLoading && totalCount === 0) return "loading";
  if (totalCount === 0 && fetchIssue) return "error";
  if (totalCount === 0) return "empty";
  if (visibleCount === 0 && hasFilterActive) return "filtered-empty";
  return "ready";
}

