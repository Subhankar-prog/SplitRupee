import { NextResponse } from "next/server";
import { sseListeners } from "@/lib/eventBus";

export const dynamic = "force-dynamic";

/** GET /api/realtime/stream: Server-Sent Events stream for live real-time sync across devices */
export async function GET(req: Request) {
  let cleanup: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const listener = (data: any) => {
        try {
          const message = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(new TextEncoder().encode(message));
        } catch {
          // Closed connection
        }
      };

      sseListeners.add(listener);

      // Send initial heartbeat
      controller.enqueue(
        new TextEncoder().encode(`data: ${JSON.stringify({ type: "CONNECTED" })}\n\n`)
      );

      cleanup = () => {
        sseListeners.delete(listener);
      };
    },
    cancel() {
      if (cleanup) cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
