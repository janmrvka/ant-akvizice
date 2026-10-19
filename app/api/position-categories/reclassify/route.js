import sql from "@/lib/db";
import { reclassifyLeads } from "@/lib/positions";
import { NextResponse } from "next/server";

// POST — znovu zařadí všechny leady (kromě ručně upravených) a předpřiřadí lidi
export async function POST() {
  try {
    const stats = await reclassifyLeads(sql);
    return NextResponse.json({ ok: true, ...stats });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
