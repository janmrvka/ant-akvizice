import sql from "@/lib/db";
import { scrapeAll } from "@/lib/scrapers/index.js";
import { fetchJobDetail } from "@/lib/scrapers/jobs-cz.js";
import { classifyTitle, pickAssignee, getUnwantedAssigneeId } from "@/lib/positions.js";
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
    const categories = await sql`SELECT * FROM position_categories`;
    const unwantedAssigneeId = await getUnwantedAssigneeId(sql);

    let newCount = 0;
    for (const lead of leads) {
      if (!lead.company || !lead.url) continue;

      const existing = await sql`
        SELECT id FROM leads WHERE url = ${lead.url} LIMIT 1
      `;
      if (existing.length > 0) continue;

      // Firma se štítkem s varováním (agentura, konkurence) = rovnou "nechceme"
      const unwanted = await sql`
        SELECT 1 FROM company_tag_links k JOIN company_tags t ON t.id = k.tag_id
        WHERE t.warning AND k.company_key = lower(btrim(${lead.company})) LIMIT 1
      `;

      // Kategorie pozice + předpřiřazení člověka podle kategorie
      const positionIds = classifyTitle(lead.title, categories);
      const assigneeId =
        unwanted.length > 0 && unwantedAssigneeId ? unwantedAssigneeId : pickAssignee(positionIds, categories);

      // Stáhni detail inzerátu (text) pro archivaci — inzeráty expirují
      const jobDetail = lead.source === "jobs.cz" ? await fetchJobDetail(lead.url) : null;

      await sql`
        INSERT INTO leads (company, title, description, url, source, city, region, status, position_ids, assignee_id, assignee_auto, job_detail, detail_fetched_at)
        VALUES (
          ${lead.company},
          ${lead.title},
          ${lead.description || null},
          ${lead.url},
          ${lead.source},
          ${lead.city || null},
          ${lead.region || null},
          ${unwanted.length > 0 ? "unwanted" : "new"},
          ${positionIds},
          ${assigneeId},
          ${assigneeId != null},
          ${jobDetail},
          ${jobDetail ? new Date().toISOString() : null}
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
