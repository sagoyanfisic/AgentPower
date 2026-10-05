import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ error: "Usa el código de una sala para cargar una pregunta." }, { status: 410, headers: { "Cache-Control": "no-store" } });
}
