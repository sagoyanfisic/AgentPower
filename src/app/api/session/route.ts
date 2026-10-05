import { NextResponse } from "next/server";

export const runtime = "nodejs";

function disabled() {
  return NextResponse.json({ error: "Usa el código de una sala para comenzar." }, { status: 410, headers: { "Cache-Control": "no-store" } });
}

export async function GET() { return disabled(); }
export async function POST() { return disabled(); }
export async function DELETE() { return disabled(); }
