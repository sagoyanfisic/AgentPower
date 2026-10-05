import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getRedisClient } from "@/lib/redis";
import { getRoom, ROOM_PREFIX, ROOM_SESSION_PREFIX } from "@/lib/rooms";
import { ROOM_ATTEMPT_PREFIX } from "@/lib/room-session";

export const runtime = "nodejs";
const noStore = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };

export async function DELETE(request: NextRequest, context: { params: Promise<{ roomId: string }> }) {
  const denied = await requireAdmin(request); if (denied) return denied;
  const { roomId } = await context.params;
  const redis = await getRedisClient();
  const room = await getRoom(redis, roomId);
  if (!room) return NextResponse.json({ error: "Sala no encontrada" }, { status: 404, headers: noStore });
  await redis.del([`${ROOM_PREFIX}${roomId}`, `practice-stats:room:${roomId}:questions`, `practice-stats:room:${roomId}:topics`]);
  for await (const keys of redis.scanIterator({ MATCH: `${ROOM_ATTEMPT_PREFIX}${roomId}:*`, COUNT: 100 })) {
    if (keys.length > 0) await redis.del(keys);
  }
  for await (const keys of redis.scanIterator({ MATCH: `${ROOM_SESSION_PREFIX}*`, COUNT: 100 })) {
    for (const key of keys) {
      const raw = await redis.get(key);
      if (!raw) continue;
      try { if ((JSON.parse(raw) as { roomId?: string }).roomId === roomId) await redis.del([key, `${key}:binding`]); } catch { await redis.del([key, `${key}:binding`]); }
    }
  }
  return NextResponse.json({ ok: true }, { headers: noStore });
}
