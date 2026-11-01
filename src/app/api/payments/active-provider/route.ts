import { NextResponse } from "next/server";
import { activeProvider } from "@/lib/payments";

/** Provider aktif untuk order baru (dipakai label checkout). */
export async function GET() {
  const p = activeProvider();
  return NextResponse.json({ provider: p.id, label: p.label });
}
