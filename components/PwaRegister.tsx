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
      <div className="fixed top-14 sm:top-16 left-0 right-0 z-40 pointer-events-none transition-all duration-200">
        <div className="flex items-center justify-center gap-2 bg-[var(--status-warning-bg)] border-b border-[var(--status-warning-border)] text-[var(--text-primary)] py-1.5 px-4 shadow-sm backdrop-blur-sm text-xs font-medium text-center">
          <WifiOff className="h-3.5 w-3.5 shrink-0 text-[var(--status-warning)]" />
          <span>
            You are offline. Offline mode is active
            {pendingCount > 0 ? ` (${pendingCount} change${pendingCount > 1 ? "s" : ""} queued for sync)` : ""}.
          </span>
        </div>
      </div>
    );
  }

  if (showReconnected) {
    return (
      <div className="fixed top-14 sm:top-16 left-0 right-0 z-40 pointer-events-none transition-all duration-200">
        <div className="flex items-center justify-center gap-2 bg-[var(--status-positive-bg)] border-b border-[var(--status-positive-border)] text-[var(--text-primary)] py-1.5 px-4 shadow-sm backdrop-blur-sm text-xs font-medium text-center">
          <Wifi className="h-3.5 w-3.5 shrink-0 text-[var(--status-positive)]" />
          <span>Back online! Connection restored.</span>
        </div>
      </div>
    );
  }

  return null;
}
