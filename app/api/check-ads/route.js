import sql from "@/lib/db";
import { isAdOpen } from "@/lib/ad-status";
import { NextResponse } from "next/server";

export const maxDuration = 300;

const CONCURRENCY = 8;
const TIME_BUDGET_MS = 240_000;

// Denní kontrola, jestli jsou inzeráty ještě aktivní. Stav leadu nemění — jen ad_closed_at.
// Nejdřív rozjednané leady, pak nové; v rámci nich nejdéle nekontrolované.
export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "2000");
  const started = Date.now();

  try {
    const leads = await sql`
      SELECT id, url FROM leads
      WHERE ad_closed_at IS NULL AND status NOT IN ('lost', 'unwanted')
      ORDER BY
        CASE status WHEN 'in_progress' THEN 0 WHEN 'contacted' THEN 1 WHEN 'new' THEN 2 ELSE 3 END,
        ad_checked_at ASC NULLS FIRST
      LIMIT ${limit}
    `;

    const open = [];
    const closed = [];
    let unknown = 0;

    for (let i = 0; i < leads.length; i += CONCURRENCY) {
      if (Date.now() - started > TIME_BUDGET_MS) break;
      const batch = leads.slice(i, i + CONCURRENCY);
      const results = await Promise.all(batch.map((l) => isAdOpen(l.url)));
      results.forEach((r, j) => {
        if (r === true) open.push(batch[j].id);
        else if (r === false) closed.push(batch[j].id);
        else unknown++;
      });
    }

    if (open.length > 0) {
      await sql`UPDATE leads SET ad_checked_at = NOW() WHERE id = ANY(${open})`;
    }
    if (closed.length > 0) {
      await sql`UPDATE leads SET ad_closed_at = NOW(), ad_checked_at = NOW() WHERE id = ANY(${closed})`;
    }

    return NextResponse.json({
      ok: true,
      checked: open.length + closed.length + unknown,
      total: leads.length,
      open: open.length,
      closed: closed.length,
      unknown,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
