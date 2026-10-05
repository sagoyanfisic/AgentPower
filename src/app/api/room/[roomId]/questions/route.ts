import { NextResponse, type NextRequest } from "next/server";
import { getBank, getRoom, roomStatus } from "@/lib/rooms";
import { getPublicQuestionAtIndex, type Language } from "@/lib/questions";
import { readRoomSession } from "@/lib/room-session";
import { isRateLimited } from "@/lib/rate-limit";

export const runtime = "nodejs";
const noStore = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };

export async function GET(request: NextRequest, context: { params: Promise<{ roomId: string }> }) {
  if (await isRateLimited(request, "room-questions", 60)) return NextResponse.json({ error: "Demasiadas solicitudes" }, { status: 429, headers: { ...noStore, "Retry-After": "60" } });
  const { roomId } = await context.params;
  const redis = await (await import("@/lib/redis")).getRedisClient();
  const room = await getRoom(redis, roomId);
  if (!room) return NextResponse.json({ error: "Sala no encontrada" }, { status: 404, headers: noStore });
  const questions = await getBank(redis, room.bankId);
  if (!questions) return NextResponse.json({ error: "El set de preguntas no está disponible" }, { status: 503, headers: noStore });
  const stored = await readRoomSession(request, roomId, questions);
  if (!stored) return NextResponse.json({ error: "Completa el perfil para comenzar" }, { status: 401, headers: noStore });
  if (stored.session.finished || Date.now() >= Date.parse(stored.session.deadlineAt ?? "") || roomStatus(room) === "closed") return NextResponse.json({ error: "El tiempo de la sala terminó", expired: true }, { status: 410, headers: noStore });
  const language: Language = request.nextUrl.searchParams.get("lang") === "es" ? "es" : "en";
  const index = Number(request.nextUrl.searchParams.get("index"));
  if (!Number.isInteger(index) || index < 0 || index >= stored.session.questionOrder.length) return NextResponse.json({ error: "Pregunta inválida" }, { status: 400, headers: noStore });
  const question = await getPublicQuestionAtIndex(language, stored.session.questionOrder, index, questions);
  if (!question) return NextResponse.json({ error: "Pregunta no disponible" }, { status: 503, headers: noStore });
  return NextResponse.json({ question, index, total: stored.session.questionOrder.length, language, deadlineAt: stored.session.deadlineAt }, { headers: noStore });
}
