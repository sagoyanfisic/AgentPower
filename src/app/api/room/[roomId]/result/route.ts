import { NextResponse, type NextRequest } from "next/server";
import { getBank, getRoom, roomStatus } from "@/lib/rooms";
import { getRedisClient } from "@/lib/redis";
import { calculateResult, isPracticeComplete, type Language } from "@/lib/questions";
import { readRoomSession } from "@/lib/room-session";
import { recordRoomPracticeResult } from "@/lib/learning-stats";
import type { PracticeSession } from "@/lib/session-types";
import { isRateLimited } from "@/lib/rate-limit";
import { bodyError, readJsonBody } from "@/lib/request-body";

export const runtime = "nodejs";
const noStore = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };
const languageOf = (value: string | null): Language => value === "es" ? "es" : "en";
const positive = (value: string | null, fallback: number) => { const parsed = Number(value); return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback; };

async function readContext(request: NextRequest, roomId: string) {
  const redis = await getRedisClient();
  const room = await getRoom(redis, roomId);
  if (!room) return null;
  const questions = await getBank(redis, room.bankId);
  if (!questions) return null;
  const stored = await readRoomSession(request, roomId, questions);
  return stored ? { redis, room, questions, stored } : null;
}

function isExpired(context: Awaited<ReturnType<typeof readContext>>) {
  if (!context) return false;
  return Date.now() >= Date.parse(context.stored.session.deadlineAt ?? "") || roomStatus(context.room) === "closed";
}

async function finalize(context: NonNullable<Awaited<ReturnType<typeof readContext>>>, language: Language) {
  const { stored, questions, room, redis } = context;
  const complete = await isPracticeComplete(stored.session.answers, questions);
  if (!complete && !isExpired(context)) return null;
  const reason = complete ? "completed" : roomStatus(room) === "closed" ? "closed" : "timeout";
  const session: PracticeSession = { ...stored.session, finished: true, finishedAt: stored.session.finishedAt ?? new Date().toISOString(), finishedReason: stored.session.finishedReason ?? reason };
  await redis.set(stored.key, JSON.stringify(session), { EX: 60 * 60 * 24 * 2 });
  await recordRoomPracticeResult(redis, room.roomId, stored.token, session.answers, questions);
  return { session, result: await calculateResult(session.answers, language, 1, 5, session.questionOrder, questions) };
}

export async function GET(request: NextRequest, context: { params: Promise<{ roomId: string }> }) {
  if (await isRateLimited(request, "room-result-read", 30)) return NextResponse.json({ error: "Demasiadas solicitudes" }, { status: 429, headers: { ...noStore, "Retry-After": "60" } });
  const { roomId } = await context.params;
  const stored = await readContext(request, roomId);
  if (!stored) return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404, headers: noStore });
  const language = languageOf(request.nextUrl.searchParams.get("lang"));
  const completed = stored.stored.session.finished ? { session: stored.stored.session, result: await calculateResult(stored.stored.session.answers, language, positive(request.nextUrl.searchParams.get("page"), 1), positive(request.nextUrl.searchParams.get("pageSize"), 5), stored.stored.session.questionOrder, stored.questions) } : await finalize(stored, language);
  if (!completed) return NextResponse.json({ error: "La sesión aún no finaliza" }, { status: 409, headers: noStore });
  return NextResponse.json(completed.result, { headers: noStore });
}

export async function POST(request: NextRequest, context: { params: Promise<{ roomId: string }> }) {
  if (await isRateLimited(request, "room-result-write", 30)) return NextResponse.json({ error: "Demasiadas solicitudes" }, { status: 429, headers: { ...noStore, "Retry-After": "60" } });
  const { roomId } = await context.params;
  const stored = await readContext(request, roomId);
  if (!stored) return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404, headers: noStore });
  const body = await readJsonBody(request);
  if (!body.ok) return NextResponse.json(bodyError(body, "Datos inválidos"), { status: body.reason === "too-large" ? 413 : 400, headers: noStore });
  const payload = (body.value ?? {}) as { language?: string };
  const language = languageOf(payload.language ?? null);
  const completed = stored.stored.session.finished ? { session: stored.stored.session, result: await calculateResult(stored.stored.session.answers, language, 1, 5, stored.stored.session.questionOrder, stored.questions) } : await finalize(stored, language);
  if (!completed) return NextResponse.json({ error: "La sesión no está completa y aún tiene tiempo" }, { status: 409, headers: noStore });
  return NextResponse.json(completed.result, { headers: noStore });
}
