import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getRedisClient } from "@/lib/redis";
import { calculateResult, getQuestionBank } from "@/lib/questions";
import { PRESENCE_PREFIX, PRESENCE_TTL_SECONDS, publishPresenceEvent, readPresenceConnections } from "@/lib/presence";
import { getSessionBinding } from "@/lib/session-binding";
import { hashSessionToken, isSessionToken } from "@/lib/session-id";
import { isValidPracticeSession } from "@/lib/session";
import { SESSION_COOKIE } from "@/lib/session-types";
import { bodyError, readJsonBody } from "@/lib/request-body";

export const runtime = "nodejs";

const SESSION_PREFIX = "practice-session:";
const BINDING_SUFFIX = ":binding";
const noStore = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };

async function getBoundSession(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token || !isSessionToken(token)) return null;
  const redis = await getRedisClient();
  const key = `${SESSION_PREFIX}${hashSessionToken(token)}`;
  const value = await redis.get(key);
  const binding = await redis.get(`${key}${BINDING_SUFFIX}`);
  if (!value || binding !== getSessionBinding(request)) return null;
  const parsed: unknown = JSON.parse(value);
  if (!isValidPracticeSession(parsed, await getQuestionBank())) return null;
  return { redis, key, session: parsed };
}

export async function POST(request: NextRequest) {
  const context = await getBoundSession(request);
  if (!context) return NextResponse.json({ error: "Sesión no encontrada" }, { status: 401, headers: noStore });
  const body = await readJsonBody(request);
  if (!body.ok) return NextResponse.json(bodyError(body, "Presencia inválida"), { status: body.reason === "too-large" ? 413 : 400, headers: noStore });
  const payload: unknown = body.value;
  if (!payload || typeof payload !== "object" || typeof (payload as { visible?: unknown }).visible !== "boolean" || typeof (payload as { focused?: unknown }).focused !== "boolean") {
    return NextResponse.json({ error: "Presencia inválida" }, { status: 400, headers: noStore });
  }
  const state = payload as { visible: boolean; focused: boolean };
  const result = await calculateResult(context.session.answers);
  const answered = Object.keys(context.session.answers).length;
  const id = context.key.slice(SESSION_PREFIX.length, SESSION_PREFIX.length + 8);
  const connection = {
    name: `${context.session.firstName} ${context.session.lastName}`.trim(),
    avatar: context.session.avatar,
    visible: state.visible,
    focused: state.focused,
    score: result.score,
    answered,
    total: result.total,
    finished: context.session.finished,
    lastSeen: new Date().toISOString(),
  };
  await context.redis.set(`${PRESENCE_PREFIX}${context.key.slice(SESSION_PREFIX.length)}`, JSON.stringify(connection), { EX: PRESENCE_TTL_SECONDS });
  await publishPresenceEvent(context.redis, { type: "upsert", id, connection });
  return NextResponse.json({ ok: true }, { headers: noStore });
}

export async function DELETE(request: NextRequest) {
  const context = await getBoundSession(request);
  if (context) {
    const id = context.key.slice(SESSION_PREFIX.length, SESSION_PREFIX.length + 8);
    await context.redis.del(`${PRESENCE_PREFIX}${context.key.slice(SESSION_PREFIX.length)}`);
    await publishPresenceEvent(context.redis, { type: "delete", id });
  }
  return NextResponse.json({ ok: true }, { headers: noStore });
}

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request); if (denied) return denied;
  const redis = await getRedisClient();
  return NextResponse.json({ connections: await readPresenceConnections(redis) }, { headers: noStore });
}
