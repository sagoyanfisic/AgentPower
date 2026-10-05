import { NextResponse, type NextRequest } from "next/server";
import { isAdminKey, setAdminCookie } from "@/lib/admin-auth";
import { isRateLimited } from "@/lib/rate-limit";
import { bodyError, readJsonBody } from "@/lib/request-body";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (await isRateLimited(request, "admin-auth", 5)) return NextResponse.json({ error: "Demasiados intentos" }, { status: 429, headers: { "Retry-After": "60", "Cache-Control": "no-store" } });
  const body = await readJsonBody(request);
  if (!body.ok) return NextResponse.json(bodyError(body, "Datos inválidos"), { status: body.reason === "too-large" ? 413 : 400, headers: { "Cache-Control": "no-store" } });
  const payload: unknown = body.value;
  const key = payload && typeof payload === "object" && typeof (payload as { key?: unknown }).key === "string" ? (payload as { key: string }).key : "";
  if (!(await isAdminKey(key))) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  return setAdminCookie(NextResponse.json({ ok: true }), request);
}
