import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getRedisClient } from "@/lib/redis";
import { BANK_DATA_PREFIX, BANK_META_PREFIX, ROOM_PREFIX, isRoomId, roomStatus, type Room } from "@/lib/rooms";

export const runtime = "nodejs";
const noStore = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };

export async function DELETE(request: NextRequest, context: { params: Promise<{ bankId: string }> }) {
  const denied = await requireAdmin(request); if (denied) return denied;
  const { bankId } = await context.params;
  if (!bankId || bankId.length > 128) return NextResponse.json({ error: "Set de preguntas inválido" }, { status: 400, headers: noStore });
  const redis = await getRedisClient();
  if (!(await redis.exists(`${BANK_META_PREFIX}${bankId}`))) return NextResponse.json({ error: "Set de preguntas no encontrado" }, { status: 404, headers: noStore });
  for await (const keys of redis.scanIterator({ MATCH: `${ROOM_PREFIX}*`, COUNT: 100 })) {
    for (const key of keys) {
      const raw = await redis.get(key);
      if (!raw) continue;
      try {
        const room = JSON.parse(raw) as Room;
        if (room.bankId === bankId && typeof room.roomId === "string" && isRoomId(room.roomId)) {
          return NextResponse.json({ error: `El set está asociado a la sala ${room.roomId} (${roomStatus(room)}). Elimina primero esa sala.`, roomId: room.roomId }, { status: 409, headers: noStore });
        }
      } catch { await redis.del(key); }
    }
  }
  await redis.del([`${BANK_META_PREFIX}${bankId}`, `${BANK_DATA_PREFIX}${bankId}`]);
  return NextResponse.json({ ok: true }, { headers: noStore });
}
