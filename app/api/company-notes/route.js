import sql from "@/lib/db";
import { companyKey } from "@/lib/text";
import { NextResponse } from "next/server";

// POST { company, note } — uloží poznámku k firmě (prázdná poznámka = smazat)
export async function POST(request) {
  try {
    const { company, note } = await request.json();
    const key = companyKey(company);
    if (!key) return NextResponse.json({ error: "company required" }, { status: 400 });

    const text = (note || "").trim();
    if (text) {
      await sql`
        INSERT INTO company_notes (company_key, note) VALUES (${key}, ${text})
        ON CONFLICT (company_key) DO UPDATE SET note = EXCLUDED.note, updated_at = NOW()
      `;
    } else {
      await sql`DELETE FROM company_notes WHERE company_key = ${key}`;
    }
    return NextResponse.json({ ok: true, note: text || null });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
