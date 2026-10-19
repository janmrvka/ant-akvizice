import sql from "@/lib/db";
import { companyKey } from "@/lib/text";
import { syncUnwantedStatus } from "@/lib/company-status";
import { NextResponse } from "next/server";

// POST { company, tag_id, on: true/false } — přidá/odebere štítek firmě (platí pro všechny její inzeráty)
export async function POST(request) {
  try {
    const { company, tag_id, on } = await request.json();
    const key = companyKey(company);
    if (!key || !tag_id) {
      return NextResponse.json({ error: "company and tag_id required" }, { status: 400 });
    }

    if (on) {
      await sql`
        INSERT INTO company_tag_links (company_key, tag_id) VALUES (${key}, ${tag_id})
        ON CONFLICT DO NOTHING
      `;
    } else {
      await sql`DELETE FROM company_tag_links WHERE company_key = ${key} AND tag_id = ${tag_id}`;
    }

    await syncUnwantedStatus(sql, [key]);

    const rows = await sql`SELECT tag_id FROM company_tag_links WHERE company_key = ${key} ORDER BY tag_id`;
    const statuses = await sql`SELECT id, status, assignee_id FROM leads WHERE lower(btrim(company)) = ${key}`;
    return NextResponse.json({ ok: true, tag_ids: rows.map((r) => r.tag_id), statuses });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
