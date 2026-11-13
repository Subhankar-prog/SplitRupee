"use client";

import { useEffect, useRef } from "react";
import { useUser } from "./userContext";

const SYNC_CHECK_INTERVAL_MS = 25_000;
const FOCUS_REFRESH_THROTTLE_MS = 5_000;
const FOCUS_CHECK_DEDUPE_MS = 1_000;
const VERSION_CHECK_TIMEOUT_MS = 10_000;

type FollowUpPolicy = "none" | "after-window" | "always";

function isAbortError(err: unknown): boolean {
  if (typeof DOMException !== "undefined" && err instanceof DOMException && err.name === "AbortError") {
    return true;
  }
  return typeof err === "object" && err !== null && (err as { name?: unknown }).name === "AbortError";
}

function createAbortReason(message: string): Error {
  if (typeof DOMException !== "undefined") {
    return new DOMException(message, "AbortError");
  }
  const err = new Error(message);
  err.name = "AbortError";
  return err;
}

/**
 * Lightweight, serverless-safe synchronization hook for signed-in users:
 * - Refreshes immediately on window focus, tab visibility resume, and online recovery.
 * - While signed in, online, and active in the foreground, polls a fast version
 *   endpoint and triggers `splitrupee_refresh` only when data actually changes.
 */
export function useRealtimeSync() {
  const { currentUser } = useUser();
  const userId = currentUser?.id;
  const lastVersionRef = useRef<string | null>(null);
  const lastFocusRefreshRef = useRef<number>(0);

  useEffect(() => {
    lastVersionRef.current = null;
    if (!userId) return;

    let cancelled = false;
    let inFlightController: AbortController | null = null;
    let activeTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let isChecking = false;
    let pendingFollowUp = false;
    let inFlightStartedAt = 0;

    function dispatchRefresh(force = false) {
      if (typeof window === "undefined") return;
      const now = Date.now();
      if (!force && now - lastFocusRefreshRef.current < FOCUS_REFRESH_THROTTLE_MS) {
        return;
      }
      lastFocusRefreshRef.current = now;
      window.dispatchEvent(new Event("splitrupee_refresh"));
    }

    async function checkVersion(followUpPolicy: FollowUpPolicy = "none") {
      if (cancelled) return;
      if (typeof navigator !== "undefined" && !navigator.onLine) return;
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;

      // Coalesce concurrent triggers instead of aborting a healthy in-flight poll
      if (isChecking) {
        if (
          followUpPolicy === "always" ||
          (followUpPolicy === "after-window" && Date.now() - inFlightStartedAt >= FOCUS_CHECK_DEDUPE_MS)
        ) {
          pendingFollowUp = true;
        }
        return;
      }

      isChecking = true;
      inFlightStartedAt = Date.now();
      const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
      inFlightController = controller;

      if (controller) {
        activeTimeoutId = setTimeout(() => {
          if (!controller.signal.aborted) {
            controller.abort(createAbortReason("Realtime version check timed out"));
          }
        }, VERSION_CHECK_TIMEOUT_MS);
      }

      try {
        const res = await fetch(
          `/api/realtime/stream?mode=version&userId=${encodeURIComponent(userId!)}&_t=${Date.now()}`,
          {
            cache: "no-store",
            signal: controller?.signal,
          }
        );
        if (cancelled || !res.ok) return;
        const data = await res.json();
        if (!cancelled && data?.ok && typeof data.version === "string") {
          if (lastVersionRef.current !== null && lastVersionRef.current !== data.version) {
            dispatchRefresh(true);
          }
          lastVersionRef.current = data.version;
        }
      } catch (err) {
        if (isAbortError(err) || cancelled) {
          return;
        }
        // Transient network / offline failures are expected during background checks
      } finally {
        if (activeTimeoutId !== null) {
          clearTimeout(activeTimeoutId);
          activeTimeoutId = null;
        }
        if (inFlightController === controller) {
          inFlightController = null;
        }
        isChecking = false;

        const shouldFollowUp = pendingFollowUp && !cancelled;
        pendingFollowUp = false;
        if (shouldFollowUp) {
          void checkVersion("none");
        }
      }
    }

    const handleFocusOrVisible = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      if (typeof navigator !== "undefined" && !navigator.onLine) return;
      dispatchRefresh(false);
      void checkVersion("after-window");
    };

    const handleOnline = () => {
      lastFocusRefreshRef.current = Date.now();
      window.dispatchEvent(new Event("splitrupee_refresh"));
      void checkVersion("always");
    };

    // Capture initial server fingerprint without triggering an extra startup refresh
    void checkVersion("none");

    const intervalId = setInterval(() => {
      void checkVersion("none");
    }, SYNC_CHECK_INTERVAL_MS);
    window.addEventListener("focus", handleFocusOrVisible);
    document.addEventListener("visibilitychange", handleFocusOrVisible);
    window.addEventListener("online", handleOnline);

    return () => {
      cancelled = true;
      pendingFollowUp = false;
      clearInterval(intervalId);
      if (activeTimeoutId !== null) {
        clearTimeout(activeTimeoutId);
        activeTimeoutId = null;
      }
      if (inFlightController && !inFlightController.signal.aborted) {
        inFlightController.abort(createAbortReason("Realtime sync cancelled on cleanup"));
      }
      window.removeEventListener("focus", handleFocusOrVisible);
      document.removeEventListener("visibilitychange", handleFocusOrVisible);
      window.removeEventListener("online", handleOnline);
    };
  }, [userId]);
}
