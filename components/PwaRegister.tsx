"use client";

import { useEffect, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";

export default function PwaRegister() {
  const [isOffline, setIsOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    // 1. In development, strictly unregister all Service Workers and clear caches to prevent stale cache bugs
    if (typeof window !== "undefined") {
      const isDev =
        process.env.NODE_ENV !== "production" ||
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";

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
        return;
      }

      // 2. In production, register Service Worker and aggressively refresh on update
      if ("serviceWorker" in navigator) {
        const registerSW = async () => {
          try {
            const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });

            // Check for updates on every navigation and focus
            reg.update().catch(() => {});

            reg.onupdatefound = () => {
              const installingWorker = reg.installing;
              if (installingWorker) {
                installingWorker.onstatechange = () => {
                  if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
                    // Force the new service worker to take control immediately
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
    }

    // 2. Monitor network online/offline state
    const handleOnline = () => {
      setIsOffline(false);
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    if (typeof window !== "undefined") {
      setIsOffline(!navigator.onLine);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      }
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-14 sm:top-16 left-0 right-0 z-40 pointer-events-none transition-all duration-300">
      <div className="flex items-center justify-center gap-2 bg-rose-950/95 border-b border-rose-500/40 text-rose-200 py-1.5 px-4 shadow-lg backdrop-blur-md text-xs font-medium text-center">
        <WifiOff className="h-3.5 w-3.5 shrink-0 text-rose-400 animate-pulse" />
        <span>You are offline. Offline mode is active.</span>
      </div>
    </div>
  );
}
