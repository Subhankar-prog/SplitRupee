"use client";

import { useEffect } from "react";

export function useRealtimeSync() {
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: any = null;

    function connect() {
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
          // Reconnect after 3s
          reconnectTimeout = setTimeout(connect, 3000);
        };
      } catch (e) {
        console.error("Realtime sync error", e);
      }
    }

    connect();

    return () => {
      if (eventSource) eventSource.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);
}
