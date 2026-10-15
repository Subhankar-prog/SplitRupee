"use client";

import { useEffect, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";

export default function PwaRegister() {
  const [isOffline, setIsOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker reliably in production & client hydration
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const registerSW = async () => {
        try {
          const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
          console.log("[PWA] Service Worker registered. Scope:", reg.scope);

          // Force check for updates
          reg.update().catch(() => { });
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
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-300 max-w-[90vw]">
      <div className="flex items-center gap-2.5 bg-rose-950/90 border border-rose-500/40 text-rose-200 px-4 py-2 rounded-full shadow-2xl backdrop-blur-md text-xs font-medium">
        <WifiOff className="h-4 w-4 text-rose-400 animate-pulse" />
        <span>You are offline. Offline cache mode is active.</span>
      </div>
    </div>
  );
}
