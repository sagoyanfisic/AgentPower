import type { NextRequest, NextResponse } from "next/server";
import { getRedisClient } from "@/lib/redis";
import { getSessionBinding } from "@/lib/session-binding";
import { hashSessionToken, isSessionToken, createSessionToken } from "@/lib/session-id";
import { isValidPracticeSession, type PracticeSession } from "@/lib/session";
import { SESSION_COOKIE } from "@/lib/session-types";
import { ROOM_SESSION_PREFIX, shuffleQuestionIds, type Room } from "@/lib/rooms";
import type { Question } from "@/lib/questions";

export const ROOM_SESSION_TTL_SECONDS = 60 * 60 * 24 * 2;
export const ROOM_ATTEMPT_PREFIX = "exam-gcp:room-attempt:";

export function roomSessionKey(token: string) {
  return `${ROOM_SESSION_PREFIX}${hashSessionToken(token)}`;
}

export async function readRoomSession(request: NextRequest, roomId: string, questions: Question[]) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token || !isSessionToken(token)) return null;
  const redis = await getRedisClient();
  const key = roomSessionKey(token);
  // These values are independent. Read them in parallel to save one Redis round trip.
  const [raw, binding] = await Promise.all([redis.get(key), redis.get(`${key}:binding`)]);
  if (!raw || binding !== getSessionBinding(request)) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isValidPracticeSession(parsed, questions) || parsed.roomId !== roomId) return null;
    return { redis, key, token, session: parsed };
  } catch { return null; }
}

export function withRoomCookie(response: NextResponse, token: string, request: NextRequest) {
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.cookies.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "strict", secure: request.nextUrl.protocol === "https:" || request.headers.get("x-forwarded-proto") === "https", maxAge: ROOM_SESSION_TTL_SECONDS, path: "/" });
  return response;
}

function roomAttemptKey(roomId: string, request: NextRequest) {
  return `${ROOM_ATTEMPT_PREFIX}${roomId}:${getSessionBinding(request)}`;
}

export async function claimRoomAttempt(redis: Awaited<ReturnType<typeof getRedisClient>>, roomId: string, request: NextRequest) {
  return (await redis.set(roomAttemptKey(roomId, request), "1", { NX: true, EX: 60 * 60 * 24 * 90 })) === "OK";
}

export async function createRoomSession(request: NextRequest, room: Room, questions: Question[], profile: Pick<PracticeSession, "firstName" | "lastName" | "avatar">) {
  const now = Date.now();
  const token = createSessionToken();
  const startedAt = new Date(now).toISOString();
  const configuredDeadline = now + room.durationMinutes * 60_000;
  const deadlineAt = new Date(Math.min(configuredDeadline, Date.parse(room.endsAt))).toISOString();
  const session: PracticeSession = {
    started: true, profileReady: true, firstName: profile.firstName, lastName: profile.lastName, avatar: profile.avatar,
    current: 0, questionOrder: shuffleQuestionIds(questions), answers: {}, finished: false, roomId: room.roomId,
    participantId: createSessionToken(), startedAt, deadlineAt, questionBankVersion: room.bankVersion,
  };
  const redis = await getRedisClient();
  const key = roomSessionKey(token);
  await Promise.all([
    redis.set(key, JSON.stringify(session), { EX: ROOM_SESSION_TTL_SECONDS }),
    redis.set(`${key}:binding`, getSessionBinding(request), { EX: ROOM_SESSION_TTL_SECONDS }),
  ]);
  return { redis, key, token, session };
}
