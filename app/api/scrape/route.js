import sql from "@/lib/db";
import { scrapeAll } from "@/lib/scrapers/index.js";
import { NextResponse } from "next/server";

export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const runRow = await sql`
    INSERT INTO scrape_runs (status) VALUES ('running') RETURNING id
  `;
  const runId = runRow[0].id;

  try {
    const { leads, errors } = await scrapeAll();

    let newCount = 0;
    for (const lead of leads) {
      if (!lead.company || !lead.url) continue;

      const existing = await sql`
        SELECT id FROM leads WHERE url = ${lead.url} LIMIT 1
      `;
      if (existing.length > 0) continue;

      const competitorRow = await sql`
        SELECT 1 FROM competitor_companies WHERE company = ${lead.company} LIMIT 1
      `;
      const isCompetitor = competitorRow.length > 0;

      await sql`
        INSERT INTO leads (company, title, description, url, source, city, region, status, is_competitor, competitor_reason)
        VALUES (
          ${lead.company},
          ${lead.title},
          ${lead.description || null},
          ${lead.url},
          ${lead.source},
          ${lead.city || null},
          ${lead.region || null},
          'new',
          ${isCompetitor || null},
          ${isCompetitor ? "Ručně označeno jako konkurence" : null}
        )
      `;
      newCount++;
    }

    await sql`
      UPDATE scrape_runs SET
        status = 'ok',
        new_leads_count = ${newCount},
        error = ${errors.length > 0 ? errors.join("; ") : null}
      WHERE id = ${runId}
    `;

    return NextResponse.json({ ok: true, new_leads: newCount, total_found: leads.length, errors });
  } catch (error) {
    await sql`
      UPDATE scrape_runs SET status = 'error', error = ${error.message}
      WHERE id = ${runId}
    `;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
