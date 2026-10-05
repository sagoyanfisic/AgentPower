import { NextResponse } from "next/server";

export const runtime = "nodejs";

function disabled() {
  return NextResponse.json({ error: "El resultado pertenece a una sala." }, { status: 410, headers: { "Cache-Control": "no-store" } });
}

export async function GET() { return disabled(); }
export async function POST() { return disabled(); }
