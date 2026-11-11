"use client";

import { useEffect } from "react";

export function useRealtimeSync() {
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: any = null;

    function connect() {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        return;
      }
      try {
        eventSource = new EventSource("/api/realtime/stream");

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type && data.type !== "CONNECTED") {
              window.dispatchEvent(new Event("splitrupee_refresh"));
            }
          } catch {}
        };

        eventSource.onerror = () => {
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          if (typeof navigator === "undefined" || navigator.onLine) {
            // Reconnect after 3s only when online
            reconnectTimeout = setTimeout(connect, 3000);
          }
        };
      } catch (e) {
        console.error("Realtime sync error", e);
      }
    }

    const handleOffline = () => {
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }
    };

    const handleOnline = () => {
      connect();
      window.dispatchEvent(new Event("splitrupee_refresh"));
    };

    connect();
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      if (eventSource) eventSource.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);
}
