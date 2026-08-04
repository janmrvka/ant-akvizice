import sql from "@/lib/db";
import { classifyCompetitor } from "@/lib/ai";
import { NextResponse } from "next/server";

export async function POST(request, { params }) {
  try {
    const { id } = await params;

    const rows = await sql`SELECT * FROM leads WHERE id = ${parseInt(id)}`;
    if (!rows.length) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }
    const lead = rows[0];

    // Pokud už klasifikováno, vrátit rovnou
    if (lead.is_competitor !== null && lead.is_competitor !== undefined) {
      return NextResponse.json({
        id: lead.id,
        is_competitor: lead.is_competitor,
        company_type: lead.company_type,
        competitor_reason: lead.competitor_reason,
      });
    }

    const result = await classifyCompetitor(lead);

    const updated = await sql`
      UPDATE leads SET
        is_competitor     = ${result.is_competitor},
        company_type      = ${result.company_type},
        competitor_reason = ${result.competitor_reason},
        updated_at        = NOW()
      WHERE id = ${parseInt(id)}
      RETURNING id, is_competitor, company_type, competitor_reason
    `;

    return NextResponse.json(updated[0]);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
