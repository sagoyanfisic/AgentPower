import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getRedisClient } from "@/lib/redis";
import { createOpaqueId, BANK_DATA_PREFIX, BANK_META_PREFIX, isValidImportedBank, type BankMeta } from "@/lib/rooms";
import { bodyError, readJsonBody } from "@/lib/request-body";

export const runtime = "nodejs";
const noStore = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };
const MAX_JSON_BYTES = 5 * 1024 * 1024;

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request); if (denied) return denied;
  const redis = await getRedisClient();
  const banks: BankMeta[] = [];
  for await (const keys of redis.scanIterator({ MATCH: `${BANK_META_PREFIX}*`, COUNT: 100 })) {
    for (const key of keys) {
      const raw = await redis.get(key);
      if (!raw) continue;
      try { banks.push(JSON.parse(raw) as BankMeta); } catch { await redis.del(key); }
    }
  }
  banks.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return NextResponse.json({ banks }, { headers: noStore });
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin(request); if (denied) return denied;
  const body = await readJsonBody(request);
  if (!body.ok) return NextResponse.json(bodyError(body, "JSON inválido"), { status: body.reason === "too-large" ? 413 : 400, headers: noStore });
  const payload: unknown = body.value;
  if (!payload || typeof payload !== "object") return NextResponse.json({ error: "JSON inválido" }, { status: 400, headers: noStore });
  const value = payload as { name?: unknown; certification?: unknown; content?: unknown; questions?: unknown };
  if (typeof value.name !== "string" || value.name.trim().length < 2 || value.name.length > 120 || typeof value.certification !== "string" || value.certification.trim().length < 2 || value.certification.length > 120) {
    return NextResponse.json({ error: "Nombre o certificación inválidos" }, { status: 400, headers: noStore });
  }
  let questions: unknown = value.questions;
  if (typeof value.content === "string") {
    if (Buffer.byteLength(value.content, "utf8") > MAX_JSON_BYTES) return NextResponse.json({ error: "El JSON supera el límite permitido" }, { status: 413, headers: noStore });
    try { questions = JSON.parse(value.content); } catch { return NextResponse.json({ error: "El contenido no es JSON válido" }, { status: 400, headers: noStore }); }
  }
  if (questions && typeof questions === "object" && !Array.isArray(questions) && "questions" in questions) questions = (questions as { questions: unknown }).questions;
  if (Buffer.byteLength(JSON.stringify(questions ?? null), "utf8") > MAX_JSON_BYTES) return NextResponse.json({ error: "El JSON supera el límite permitido" }, { status: 413, headers: noStore });
  if (!isValidImportedBank(questions)) return NextResponse.json({ error: "El set de preguntas no cumple el esquema bilingüe requerido" }, { status: 400, headers: noStore });
  const redis = await getRedisClient();
  const bankId = createOpaqueId(9);
  const createdAt = new Date().toISOString();
  const meta: BankMeta = { bankId, name: value.name.trim(), certification: value.certification.trim(), version: `bank-${createdAt.replace(/[^0-9]/g, "").slice(0, 14)}`, questionCount: questions.length, createdAt };
  await redis.set(`${BANK_META_PREFIX}${bankId}`, JSON.stringify(meta));
  await redis.set(`${BANK_DATA_PREFIX}${bankId}`, JSON.stringify(questions));
  return NextResponse.json({ bank: meta }, { status: 201, headers: noStore });
}
