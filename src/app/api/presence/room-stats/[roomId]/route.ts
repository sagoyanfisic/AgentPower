import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getRedisClient } from "@/lib/redis";
import { getBank, getRoom } from "@/lib/rooms";
import { readRoomLearningStats } from "@/lib/learning-stats";

export const runtime = "nodejs";
const noStore = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };

export async function GET(request: NextRequest, context: { params: Promise<{ roomId: string }> }) {
  const denied = await requireAdmin(request); if (denied) return denied;
  const { roomId } = await context.params;
  const redis = await getRedisClient();
  const room = await getRoom(redis, roomId);
  if (!room) return NextResponse.json({ error: "Sala no encontrada" }, { status: 404, headers: noStore });
  const questions = await getBank(redis, room.bankId);
  if (!questions) return NextResponse.json({ error: "Set de preguntas no disponible" }, { status: 503, headers: noStore });
  return NextResponse.json({ room, stats: await readRoomLearningStats(redis, roomId, questions) }, { headers: noStore });
}
