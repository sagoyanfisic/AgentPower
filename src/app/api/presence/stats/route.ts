import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getRedisClient } from "@/lib/redis";
import { getQuestionBank } from "@/lib/questions";
import { readLearningStats } from "@/lib/learning-stats";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const headers = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };
  const denied = await requireAdmin(request); if (denied) return denied;
  try {
    return NextResponse.json(await readLearningStats(await getRedisClient(), await getQuestionBank()), { headers });
  } catch {
    return NextResponse.json({ error: "No se pudieron leer las métricas" }, { status: 503, headers });
  }
}
