import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getRedisClient } from "@/lib/redis";
import { createRoomId, getBankMeta, ROOM_PREFIX, roomPublicData, ROOM_TTL_SECONDS, type Room } from "@/lib/rooms";
import { bodyError, readJsonBody } from "@/lib/request-body";

export const runtime = "nodejs";
const noStore = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request); if (denied) return denied;
  const redis = await getRedisClient();
  const rooms: Array<ReturnType<typeof roomPublicData> & { bankId: string; bankVersion: string }> = [];
  for await (const keys of redis.scanIterator({ MATCH: `${ROOM_PREFIX}*`, COUNT: 100 })) {
    for (const key of keys) {
      const raw = await redis.get(key);
      if (!raw) continue;
      try {
        const room = JSON.parse(raw) as Room;
        rooms.push({ ...roomPublicData(room), bankId: room.bankId, bankVersion: room.bankVersion });
      } catch { await redis.del(key); }
    }
  }
  rooms.sort((a, b) => b.startsAt.localeCompare(a.startsAt));
  return NextResponse.json({ rooms }, { headers: noStore });
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin(request); if (denied) return denied;
  const body = await readJsonBody(request);
  if (!body.ok) return NextResponse.json(bodyError(body), { status: body.reason === "too-large" ? 413 : 400, headers: noStore });
  const payload: unknown = body.value;
  if (!payload || typeof payload !== "object") return NextResponse.json({ error: "Datos inválidos" }, { status: 400, headers: noStore });
  const value = payload as Record<string, unknown>;
  const name = typeof value.name === "string" ? value.name.trim() : "";
  const certification = typeof value.certification === "string" ? value.certification.trim() : "";
  const bankId = typeof value.bankId === "string" ? value.bankId : "";
  const startsAt = typeof value.startsAt === "string" ? value.startsAt : "";
  const endsAt = typeof value.endsAt === "string" ? value.endsAt : "";
  const durationMinutes = Number(value.durationMinutes);
  const start = Date.parse(startsAt);
  const end = Date.parse(endsAt);
  if (name.length < 2 || name.length > 120 || certification.length < 2 || certification.length > 120 || !bankId || Number.isNaN(start) || Number.isNaN(end) || end <= start || !Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 1440) {
    return NextResponse.json({ error: "Sala inválida: revisa nombre, set de preguntas, ventana de acceso y duración entre 1 y 1440 minutos" }, { status: 400, headers: noStore });
  }
  const redis = await getRedisClient();
  const bank = await getBankMeta(redis, bankId);
  if (!bank) return NextResponse.json({ error: "Set de preguntas no encontrado" }, { status: 404, headers: noStore });
  const roomId = createRoomId();
  const room: Room = { roomId, name, certification, bankId, bankVersion: bank.version, startsAt: new Date(start).toISOString(), endsAt: new Date(end).toISOString(), durationMinutes, timezone: "America/Lima", createdAt: new Date().toISOString() };
  await redis.set(`${ROOM_PREFIX}${roomId}`, JSON.stringify(room), { EX: ROOM_TTL_SECONDS });
  return NextResponse.json({ room: { ...roomPublicData(room), bankId: room.bankId, bankVersion: room.bankVersion, url: `/room/${room.roomId}` } }, { status: 201, headers: noStore });
}
