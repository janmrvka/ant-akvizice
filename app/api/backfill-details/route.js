import sql from "@/lib/db";
import { fetchJobDetail } from "@/lib/scrapers/jobs-cz.js";
import { NextResponse } from "next/server";

// Doplní job_detail pro všechny leady, které ho nemají (inzeráty expirují)
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "50");
  const dryRun = searchParams.get("dry") === "1";

  try {
    // Najdi leady bez detailu — pouze jobs.cz (ostatní nemají detail stránku)
    const rows = await sql`
      SELECT id, url, company, source
      FROM leads
      WHERE job_detail IS NULL
        AND source = 'jobs.cz'
      ORDER BY found_at DESC
      LIMIT ${limit}
    `;

    const leads = Array.isArray(rows) ? rows : rows.rows ?? [];

    if (dryRun) {
      return NextResponse.json({ total_without_detail: leads.length, leads: leads.map((l) => ({ id: l.id, company: l.company, url: l.url })) });
    }

    let updated = 0;
    let failed = 0;
    const errors = [];

    for (const lead of leads) {
      const detail = await fetchJobDetail(lead.url);
      if (detail) {
        await sql`
          UPDATE leads
          SET job_detail = ${detail}, detail_fetched_at = NOW()
          WHERE id = ${lead.id}
        `;
        updated++;
      } else {
        failed++;
        errors.push(`${lead.id}: ${lead.url}`);
      }
      // Krátká pauza aby se nezablokoval jobs.cz
      await new Promise((r) => setTimeout(r, 300));
    }

    return NextResponse.json({ ok: true, processed: leads.length, updated, failed, errors });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
