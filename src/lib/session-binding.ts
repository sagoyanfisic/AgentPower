import { createHmac } from "node:crypto";
import type { NextRequest } from "next/server";

export function getSessionBinding(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address = forwardedFor ?? request.headers.get("x-real-ip") ?? "unknown";
  const rawUserAgent = request.headers.get("user-agent") ?? "unknown";
  const userAgent = rawUserAgent.match(/(Edg|OPR|Chrome|Firefox|Safari|CriOS|FxiOS|SamsungBrowser|Android|Mobile)/i)?.[1]?.toLowerCase() ?? "other";
  const secret = process.env.SESSION_BINDING_SECRET ?? "development-binding-secret";
  return createHmac("sha256", secret).update(`${address}|${userAgent}`).digest("hex");
}
