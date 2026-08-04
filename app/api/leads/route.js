import sql from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const assignee = searchParams.get("assignee");
  const status = searchParams.get("status");
  const age = searchParams.get("age"); // days
  const source = searchParams.get("source");
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;

  try {
    let conditions = ["1=1"];
    let params = [];
    let idx = 1;

    if (assignee && assignee !== "all") {
      if (assignee === "unassigned") {
        conditions.push(`l.assignee_id IS NULL`);
      } else {
        conditions.push(`l.assignee_id = $${idx++}`);
        params.push(parseInt(assignee));
      }
    }

    if (status && status !== "all") {
      conditions.push(`l.status = $${idx++}`);
      params.push(status);
    }

    if (source && source !== "all") {
      conditions.push(`l.source = $${idx++}`);
      params.push(source);
    }

    if (age) {
      conditions.push(`l.found_at >= NOW() - INTERVAL '${parseInt(age)} days'`);
    }

    if (search) {
      conditions.push(`(l.company ILIKE $${idx++} OR l.title ILIKE $${idx++} OR l.description ILIKE $${idx++})`);
      const q = `%${search}%`;
      params.push(q, q, q);
      idx += 2;
    }

    const where = conditions.join(" AND ");

    const leads = await sql.query(
      `SELECT
        l.*,
        s.name AS assignee_name,
        s.color AS assignee_color,
        s.initials AS assignee_initials
       FROM leads l
       LEFT JOIN salespeople s ON l.assignee_id = s.id
       WHERE ${where}
       ORDER BY l.found_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    const countResult = await sql.query(
      `SELECT COUNT(*) as total FROM leads l WHERE ${where}`,
      params
    );

    return NextResponse.json({
      leads: Array.isArray(leads) ? leads : leads.rows ?? [],
      total: parseInt((Array.isArray(countResult) ? countResult[0] : countResult.rows[0]).total),
      page,
      limit,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { company, title, description, url, source, company_domain } = body;

    // deduplication — stejná doména nebo stejné URL
    if (company_domain) {
      const existing = await sql`
        SELECT id FROM leads
        WHERE company_domain = ${company_domain}
        AND found_at >= NOW() - INTERVAL '30 days'
        LIMIT 1
      `;
      if (existing.length > 0) {
        return NextResponse.json({ duplicate: true, existing_id: existing[0].id });
      }
    }

    const existing_url = await sql`
      SELECT id FROM leads WHERE url = ${url} LIMIT 1
    `;
    if (existing_url.length > 0) {
      return NextResponse.json({ duplicate: true, existing_id: existing_url[0].id });
    }

    const result = await sql`
      INSERT INTO leads (company, title, description, url, source, company_domain)
      VALUES (${company}, ${title}, ${description || null}, ${url}, ${source}, ${company_domain || null})
      RETURNING *
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
