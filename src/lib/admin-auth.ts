import { createHash, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getRedisClient } from "@/lib/redis";
import { isRateLimited } from "@/lib/rate-limit";

export const ADMIN_COOKIE = "gcp_admin_session";
const ADMIN_KEY_REDIS = "exam-gcp:admin-key";

function digest(value: string) {
  return createHash("sha256").update(value.trim()).digest("hex");
}

function matches(received: string, expected: string) {
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);
  return receivedBuffer.length === expectedBuffer.length && timingSafeEqual(receivedBuffer, expectedBuffer);
}

async function configuredAdminDigest() {
  const redis = await getRedisClient();
  const stored = await redis.get(ADMIN_KEY_REDIS);
  if (stored) return stored;
  const configured = process.env.ADMIN_DASHBOARD_KEY?.trim();
  return configured ? digest(configured) : null;
}

export async function isAdminKey(value: string) {
  const expected = await configuredAdminDigest();
  return Boolean(expected && matches(digest(value), expected));
}

export async function isAdminRequest(request: NextRequest) {
  const expected = await configuredAdminDigest();
  const authorization = request.headers.get("authorization");
  const received = (request.headers.get("x-admin-key") ?? (authorization?.startsWith("Bearer ") ? authorization.slice(7) : null))?.trim();
  const cookie = request.cookies.get(ADMIN_COOKIE)?.value;
  return Boolean(expected && ((received && matches(digest(received), expected)) || cookie === expected));
}

export async function setAdminCookie(response: Response, request: NextRequest) {
  const cookieValue = await configuredAdminDigest();
  if (!cookieValue) return response;
  const secure = request.nextUrl.protocol === "https:" || request.headers.get("x-forwarded-proto") === "https";
  response.headers.append("Set-Cookie", `${ADMIN_COOKIE}=${cookieValue}; Path=/; Max-Age=3600; HttpOnly; SameSite=Strict${secure ? "; Secure" : ""}`);
  return response;
}

export async function requireAdmin(request: NextRequest) {
  if (await isAdminRequest(request)) return null;
  const limited = await isRateLimited(request, "admin-request", 5);
  return NextResponse.json(
    { error: limited ? "Demasiados intentos" : "No autorizado" },
    { status: limited ? 429 : 401, headers: { "Cache-Control": "no-store", ...(limited ? { "Retry-After": "60" } : {}) } },
  );
}
