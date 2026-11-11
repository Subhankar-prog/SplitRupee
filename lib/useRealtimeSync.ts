"use client";

import { useEffect, useRef } from "react";
import { useUser } from "./userContext";

const SYNC_CHECK_INTERVAL_MS = 25_000;
const FOCUS_REFRESH_THROTTLE_MS = 5_000;

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

    function dispatchRefresh(force = false) {
      if (typeof window === "undefined") return;
      const now = Date.now();
      if (!force && now - lastFocusRefreshRef.current < FOCUS_REFRESH_THROTTLE_MS) {
        return;
      }
      lastFocusRefreshRef.current = now;
      window.dispatchEvent(new Event("splitrupee_refresh"));
    }

    async function checkVersion() {
      if (cancelled) return;
      if (typeof navigator !== "undefined" && !navigator.onLine) return;
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;

      if (inFlightController) {
        inFlightController.abort();
      }
      const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
      inFlightController = controller;

      try {
        const res = await fetch(
          `/api/realtime/stream?mode=version&userId=${encodeURIComponent(userId!)}&_t=${Date.now()}`,
          {
            cache: "no-store",
            signal: controller?.signal,
          }
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data?.ok && typeof data.version === "string") {
          if (lastVersionRef.current !== null && lastVersionRef.current !== data.version) {
            dispatchRefresh(true);
          }
          lastVersionRef.current = data.version;
        }
      } catch {
        // Ignore aborts / transient offline checks
      } finally {
        if (inFlightController === controller) {
          inFlightController = null;
        }
      }
    }

    const handleFocusOrVisible = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      if (typeof navigator !== "undefined" && !navigator.onLine) return;
      dispatchRefresh(false);
      checkVersion();
    };

    const handleOnline = () => {
      lastFocusRefreshRef.current = Date.now();
      window.dispatchEvent(new Event("splitrupee_refresh"));
      checkVersion();
    };

    // Capture initial server fingerprint without triggering an extra startup refresh
    checkVersion();

    const intervalId = setInterval(checkVersion, SYNC_CHECK_INTERVAL_MS);
    window.addEventListener("focus", handleFocusOrVisible);
    document.addEventListener("visibilitychange", handleFocusOrVisible);
    window.addEventListener("online", handleOnline);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
      if (inFlightController) inFlightController.abort();
      window.removeEventListener("focus", handleFocusOrVisible);
      document.removeEventListener("visibilitychange", handleFocusOrVisible);
      window.removeEventListener("online", handleOnline);
    };
  }, [userId]);
}
