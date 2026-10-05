import { requireAdmin } from "@/lib/admin-auth";
import { PRESENCE_STREAM, readPresenceConnections, type PresenceEvent } from "@/lib/presence";
import { getRedisClient, getRedisStreamClient } from "@/lib/redis";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

const headers = {
  "Cache-Control": "no-cache, no-store, must-revalidate",
  "Content-Type": "text/event-stream; charset=utf-8",
  Connection: "keep-alive",
  "X-Robots-Tag": "noindex, nofollow",
};

function eventBlock(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request); if (denied) return denied;

  let redis: Awaited<ReturnType<typeof getRedisClient>>;
  let stream: Awaited<ReturnType<typeof getRedisStreamClient>>;
  let initialConnections: Awaited<ReturnType<typeof readPresenceConnections>>;
  try {
    redis = await getRedisClient();
    stream = await getRedisStreamClient();
    initialConnections = await readPresenceConnections(redis);
  } catch (error) {
    console.error("Presence stream initialization failed", error);
    return new Response("No se pudo abrir el stream", { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  const encoder = new TextEncoder();
  let lastId = "$";

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) => controller.enqueue(encoder.encode(eventBlock(event, data)));
      send("snapshot", { connections: initialConnections });
      try {
        while (!request.signal.aborted) {
          const result = await stream.xRead([{ key: PRESENCE_STREAM, id: lastId }], { BLOCK: 10000, COUNT: 100 });
          if (!result) {
            const connections = await readPresenceConnections(redis);
            send("snapshot", { connections });
            continue;
          }
          for (const streamResult of result) {
            for (const message of streamResult.messages) {
              lastId = message.id;
              try {
                const event = JSON.parse(message.message.payload) as PresenceEvent;
                if (event.type === "upsert" || event.type === "delete") send("presence", event);
              } catch {
                // Ignore malformed stream entries and keep the connection alive.
              }
            }
          }
        }
      } catch {
        if (!request.signal.aborted) controller.error(new Error("El stream de presencia se cerró"));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(body, { headers });
}
