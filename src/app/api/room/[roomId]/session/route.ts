import { NextResponse, type NextRequest } from "next/server";
import { getRedisClient } from "@/lib/redis";
import { getBank, getRoom, roomPublicData, roomStatus } from "@/lib/rooms";
import { claimRoomAttempt, createRoomSession, readRoomSession, withRoomCookie } from "@/lib/room-session";
import { avatars, type PracticeSession } from "@/lib/session-types";
import { isValidPracticeSession } from "@/lib/session";
import { isRateLimited } from "@/lib/rate-limit";
import { bodyError, readJsonBody } from "@/lib/request-body";

export const runtime = "nodejs";
const noStore = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };

async function contextFor(request: NextRequest, roomId: string) {
  const redis = await getRedisClient();
  const room = await getRoom(redis, roomId);
  if (!room) return null;
  const questions = await getBank(redis, room.bankId);
  if (!questions) return null;
  return { redis, room, questions };
}

function publicSession(session: PracticeSession | null) {
  if (!session) return null;
  const safe = { ...session };
  delete safe.participantId;
  return safe;
}

export async function GET(request: NextRequest, context: { params: Promise<{ roomId: string }> }) {
  if (await isRateLimited(request, "room-session-read", 60)) return NextResponse.json({ error: "Demasiadas solicitudes" }, { status: 429, headers: { ...noStore, "Retry-After": "60" } });
  const { roomId } = await context.params;
  const roomContext = await contextFor(request, roomId);
  if (!roomContext) return NextResponse.json({ error: "Sala no encontrada" }, { status: 404, headers: noStore });
  const stored = await readRoomSession(request, roomId, roomContext.questions);
  return NextResponse.json({ room: roomPublicData(roomContext.room), session: publicSession(stored?.session ?? null) }, { headers: noStore });
}

export async function POST(request: NextRequest, context: { params: Promise<{ roomId: string }> }) {
  if (await isRateLimited(request, "room-session-write", 120)) return NextResponse.json({ error: "Demasiadas solicitudes" }, { status: 429, headers: { ...noStore, "Retry-After": "60" } });
  const { roomId } = await context.params;
  const roomContext = await contextFor(request, roomId);
  if (!roomContext) return NextResponse.json({ error: "Sala no encontrada" }, { status: 404, headers: noStore });
  const body = await readJsonBody(request);
  if (!body.ok) return NextResponse.json(bodyError(body, "Datos inválidos"), { status: body.reason === "too-large" ? 413 : 400, headers: noStore });
  const payload: unknown = body.value;
  if (!payload || typeof payload !== "object") return NextResponse.json({ error: "Datos inválidos" }, { status: 400, headers: noStore });
  const value = payload as Partial<PracticeSession>;
  const stored = await readRoomSession(request, roomId, roomContext.questions);
  const status = roomStatus(roomContext.room);

  if (!stored) {
    if (status !== "active") return NextResponse.json({ error: status === "scheduled" ? "La sala aún no está abierta" : "La sala ya está cerrada" }, { status: 409, headers: noStore });
    if (typeof value.firstName !== "string" || value.firstName.trim().length === 0 || value.firstName.length > 80 || typeof value.lastName !== "string" || value.lastName.trim().length === 0 || value.lastName.length > 120 || typeof value.avatar !== "string" || !avatars.includes(value.avatar as (typeof avatars)[number])) {
      return NextResponse.json({ error: "Completa nombre, apellidos y avatar" }, { status: 400, headers: noStore });
    }
    if (!(await claimRoomAttempt(roomContext.redis, roomId, request))) return NextResponse.json({ error: "Ya existe un intento para este dispositivo en esta sala" }, { status: 409, headers: noStore });
    const created = await createRoomSession(request, roomContext.room, roomContext.questions, { firstName: value.firstName.trim(), lastName: value.lastName.trim(), avatar: value.avatar });
    return withRoomCookie(NextResponse.json({ room: roomPublicData(roomContext.room), session: publicSession(created.session) }, { headers: noStore }), created.token, request);
  }

  const now = Date.now();
  const expired = now >= Date.parse(stored.session.deadlineAt ?? "") || status === "closed";
  if (expired) {
    const finishedSession: PracticeSession = { ...stored.session, finished: true, finishedAt: stored.session.finishedAt ?? new Date().toISOString(), finishedReason: status === "closed" ? "closed" : "timeout" };
    await stored.redis.set(stored.key, JSON.stringify(finishedSession), { EX: 60 * 60 * 24 * 2 });
    return withRoomCookie(NextResponse.json({ room: roomPublicData(roomContext.room), session: publicSession(finishedSession), expired: true }, { headers: noStore }), stored.token, request);
  }
  if (stored.session.finished) return withRoomCookie(NextResponse.json({ room: roomPublicData(roomContext.room), session: publicSession(stored.session) }, { headers: noStore }), stored.token, request);
  const candidate: PracticeSession = { ...stored.session, current: value.current ?? stored.session.current, answers: value.answers ?? stored.session.answers };
  if (!isValidPracticeSession(candidate, roomContext.questions) || candidate.roomId !== roomId || candidate.questionBankVersion !== roomContext.room.bankVersion || candidate.firstName !== stored.session.firstName || candidate.lastName !== stored.session.lastName || candidate.avatar !== stored.session.avatar) {
    return NextResponse.json({ error: "Sesión inválida" }, { status: 400, headers: noStore });
  }
  await stored.redis.set(stored.key, JSON.stringify(candidate), { EX: 60 * 60 * 24 * 2 });
  return withRoomCookie(NextResponse.json({ ok: true, session: publicSession(candidate) }, { headers: noStore }), stored.token, request);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ roomId: string }> }) {
  await context.params;
  return NextResponse.json({ error: "El intento no se puede reiniciar" }, { status: 405, headers: noStore });
}
