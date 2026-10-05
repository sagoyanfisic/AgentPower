import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getRedisClient } from "@/lib/redis";
import { getBank, getRoom } from "@/lib/rooms";
import { readRoomSession } from "@/lib/room-session";
import { calculateResult } from "@/lib/questions";
import { hashSessionToken, isSessionToken } from "@/lib/session-id";
import { SESSION_COOKIE } from "@/lib/session-types";
import { readRoomPresence, ROOM_PRESENCE_PREFIX, ROOM_PRESENCE_TTL_SECONDS } from "@/lib/room-presence";
import { bodyError, readJsonBody } from "@/lib/request-body";

export const runtime = "nodejs";
const noStore = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };

async function context(request: NextRequest, roomId: string) {
  const redis = await getRedisClient();
  const room = await getRoom(redis, roomId);
  if (!room) return null;
  const questions = await getBank(redis, room.bankId);
  if (!questions) return null;
  const session = await readRoomSession(request, roomId, questions);
  return session ? { redis, room, questions, session } : null;
}

export async function POST(request: NextRequest, routeContext: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await routeContext.params;
  const current = await context(request, roomId);
  if (!current) return NextResponse.json({ error: "Sesión de sala no encontrada" }, { status: 401, headers: noStore });
  const body = await readJsonBody(request);
  if (!body.ok) return NextResponse.json(bodyError(body, "Presencia inválida"), { status: body.reason === "too-large" ? 413 : 400, headers: noStore });
  const payload = body.value as { visible?: unknown; focused?: unknown } | null;
  if (typeof payload?.visible !== "boolean" || typeof payload.focused !== "boolean") return NextResponse.json({ error: "Presencia inválida" }, { status: 400, headers: noStore });
  const result = await calculateResult(current.session.session.answers, "en", 1, 5, current.session.session.questionOrder, current.questions);
  const tokenId = hashSessionToken(current.session.token);
  await current.redis.set(`${ROOM_PRESENCE_PREFIX}${roomId}:${tokenId}`, JSON.stringify({ name: `${current.session.session.firstName} ${current.session.session.lastName}`.trim(), avatar: current.session.session.avatar, visible: payload.visible, focused: payload.focused, score: result.score, answered: Object.keys(current.session.session.answers).length, total: result.total, finished: current.session.session.finished, lastSeen: new Date().toISOString() }), { EX: ROOM_PRESENCE_TTL_SECONDS });
  return NextResponse.json({ ok: true }, { headers: noStore });
}

export async function DELETE(request: NextRequest, routeContext: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await routeContext.params;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const redis = await getRedisClient();
  if (token && isSessionToken(token)) await redis.del(`${ROOM_PRESENCE_PREFIX}${roomId}:${hashSessionToken(token)}`);
  return NextResponse.json({ ok: true }, { headers: noStore });
}

export async function GET(request: NextRequest, routeContext: { params: Promise<{ roomId: string }> }) {
  const denied = await requireAdmin(request); if (denied) return denied;
  const { roomId } = await routeContext.params;
  const redis = await getRedisClient();
  if (!(await getRoom(redis, roomId))) return NextResponse.json({ error: "Sala no encontrada" }, { status: 404, headers: noStore });
  return NextResponse.json({ connections: await readRoomPresence(redis, roomId) }, { headers: noStore });
}
