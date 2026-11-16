"use client";

import { useEffect, useState, useRef } from "react";
import { WifiOff, Wifi } from "lucide-react";
import { getOfflineQueue } from "@/lib/offlineSync";

export default function PwaRegister() {
  const [isOffline, setIsOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const refreshQueueCount = () => {
      try {
        setPendingCount(getOfflineQueue().length);
      } catch {
        setPendingCount(0);
      }
    };

    refreshQueueCount();

    // 1. In development (`next dev`), unregister Service Workers to prevent HMR stale cache bugs;
    //    in production (`next build && next start` or Vercel), register `/sw.js`.
    const isDev = process.env.NODE_ENV !== "production";

    if (isDev) {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) {
            registration.unregister().catch(() => {});
          }
        });
      }
      if ("caches" in window) {
        caches.keys().then((names) => {
          for (const name of names) {
            caches.delete(name).catch(() => {});
          }
        });
      }
    } else if ("serviceWorker" in navigator) {
      const registerSW = async () => {
        try {
          const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
          reg.update().catch(() => {});

          reg.onupdatefound = () => {
            const installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
                  installingWorker.postMessage({ type: "SKIP_WAITING" });
                }
              };
            }
          };
        } catch (err) {
          console.warn("[PWA] ServiceWorker registration failed:", err);
        }
      };

      if (document.readyState === "complete" || document.readyState === "interactive") {
        registerSW();
      } else {
        window.addEventListener("load", registerSW, { once: true });
      }
    }

    // 2. Always monitor network online/offline state & queued items across both dev and prod
    const handleOnline = () => {
      setIsOffline(false);
      setShowReconnected(true);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = setTimeout(() => setShowReconnected(false), 3500);
    };

    const handleOffline = () => {
      setShowReconnected(false);
      setIsOffline(true);
    };

    setIsOffline(!navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("splitrupee_offline_queue_changed", refreshQueueCount);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("splitrupee_offline_queue_changed", refreshQueueCount);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    };
  }, []);

  if (isOffline) {
    return (
      <div className="fixed bottom-20 md:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-40 pointer-events-auto transition-all duration-200">
        <div className="flex items-center justify-between gap-3 bg-[var(--bg-surface)] dark:bg-[var(--bg-surface-secondary)] border border-[var(--status-warning-border)] text-[var(--text-primary)] py-2 px-3.5 rounded-2xl shadow-[var(--shadow-popover)] text-xs font-medium">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-2 w-2 rounded-full bg-[var(--status-warning)] shrink-0 animate-pulse" />
            <WifiOff className="h-3.5 w-3.5 shrink-0 text-[var(--status-warning)]" />
            <span className="truncate">
              Offline Mode • Saved locally
              {pendingCount > 0 ? ` (${pendingCount} queued)` : ""}
            </span>
          </div>
          <a
            href="/offline"
            className="shrink-0 text-[11px] font-semibold text-[var(--brand-dark)] dark:text-[var(--brand-primary)] underline hover:opacity-80"
          >
            Details
          </a>
        </div>
      </div>
    );
  }

  if (showReconnected) {
    return (
      <div className="fixed bottom-20 md:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-40 pointer-events-auto transition-all duration-200">
        <div className="flex items-center gap-2.5 bg-[var(--bg-surface)] dark:bg-[var(--bg-surface-secondary)] border border-[var(--status-positive-border)] text-[var(--text-primary)] py-2 px-3.5 rounded-2xl shadow-[var(--shadow-popover)] text-xs font-medium">
          <span className="flex h-2 w-2 rounded-full bg-[var(--status-positive)] shrink-0" />
          <Wifi className="h-3.5 w-3.5 shrink-0 text-[var(--status-positive)]" />
          <span>Back online! Connection restored.</span>
        </div>
      </div>
    );
  }

  return null;
}
