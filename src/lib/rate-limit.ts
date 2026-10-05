import type { NextRequest } from "next/server";
import { getRedisClient } from "@/lib/redis";

const WINDOW_SECONDS = 60;

function requestAddress(request: NextRequest) {
  if (process.env.TRUST_PROXY === "true") {
    return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? request.headers.get("x-real-ip")
      ?? "proxy-unknown";
  }
  return "direct-client";
}

export async function isRateLimited(request: NextRequest, scope: string, limit: number) {
  const redis = await getRedisClient();
  const key = `rate-limit:${scope}:${requestAddress(request)}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, WINDOW_SECONDS);
  return count > limit;
}
