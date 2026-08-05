import sql from "@/lib/db";
import { enrichLead } from "@/lib/ai";
import { NextResponse } from "next/server";

export async function POST(request, { params }) {
  try {
    const { id } = await params;

    const rows = await sql`SELECT * FROM leads WHERE id = ${parseInt(id)}`;
    if (!rows.length) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }
    const lead = rows[0];

    const enriched = await enrichLead(lead);

    const updated = await sql`
      UPDATE leads SET
        decision_maker  = ${enriched.decision_maker || null},
        contact         = ${enriched.contact || null},
        linkedin_url    = ${enriched.linkedin_url || null},
        signal          = ${enriched.signal || null},
        why_now         = ${enriched.why_now || null},
        company_info    = ${enriched.company_info || null},
        match_score     = ${enriched.match_score ?? null},
        ico             = ${enriched.ico || null},
        company_web     = ${enriched.company_web || null},
        company_summary = ${enriched.company_summary || null},
        contacts        = ${enriched.contacts ? JSON.stringify(enriched.contacts) : null},
        enriched_at     = NOW(),
        updated_at      = NOW()
      WHERE id = ${parseInt(id)}
      RETURNING *
    `;

    return NextResponse.json(updated[0]);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
