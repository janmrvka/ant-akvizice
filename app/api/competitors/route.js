import sql from "@/lib/db";
import { NextResponse } from "next/server";

// GET — seznam všech firem označených jako konkurence
export async function GET() {
  const rows = await sql`SELECT company FROM competitor_companies ORDER BY company`;
  return NextResponse.json(rows.map((r) => r.company));
}

// POST { company, is_competitor: true/false } — toggle + propagace na všechny leady
export async function POST(request) {
  const { company, is_competitor } = await request.json();
  if (!company) return NextResponse.json({ error: "company required" }, { status: 400 });

  if (is_competitor) {
    await sql`
      INSERT INTO competitor_companies (company) VALUES (${company})
      ON CONFLICT (company) DO NOTHING
    `;
  } else {
    await sql`DELETE FROM competitor_companies WHERE company = ${company}`;
  }

  // Propagovat na všechny leady od stejné firmy
  await sql`
    UPDATE leads SET
      is_competitor = ${is_competitor},
      competitor_reason = ${is_competitor ? "Ručně označeno jako konkurence" : null},
      updated_at = NOW()
    WHERE company = ${company}
  `;

  const affected = await sql`SELECT COUNT(*) as count FROM leads WHERE company = ${company}`;

  return NextResponse.json({
    ok: true,
    company,
    is_competitor,
    affected: parseInt(affected[0].count),
  });
}
