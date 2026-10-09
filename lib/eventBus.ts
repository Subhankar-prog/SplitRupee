// Global in-memory event bus for Server-Sent Events (SSE) live updates across all connected clients

type Listener = (data: any) => void;

// Maintain persistent global listeners set across Next.js API reloads
const globalForBus = global as unknown as { sseListeners?: Set<Listener> };
export const sseListeners = globalForBus.sseListeners || new Set<Listener>();
if (process.env.NODE_ENV !== "production") globalForBus.sseListeners = sseListeners;

export function broadcastEvent(event: { type: string; payload: any }) {
  sseListeners.forEach((listener) => {
    try {
      listener(event);
    } catch (e) {
      console.error("SSE broadcast error", e);
    }
  });
}
