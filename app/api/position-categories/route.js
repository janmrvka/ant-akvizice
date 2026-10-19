import sql from "@/lib/db";
import { reclassifyLeads } from "@/lib/positions";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const result = await sql`
      SELECT c.*, (SELECT COUNT(*)::int FROM leads l WHERE c.id = ANY(l.position_ids)) AS leads
      FROM position_categories c
      ORDER BY c.sort, c.id
    `;
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { name, color, keywords, fallback, assignee_id } = await request.json();
    if (!name?.trim()) return NextResponse.json({ error: "name required" }, { status: 400 });
    const result = await sql`
      INSERT INTO position_categories (name, color, keywords, fallback, assignee_id, sort)
      VALUES (
        ${name.trim()}, ${color || "#64748b"}, ${keywords || ""}, ${!!fallback}, ${assignee_id || null},
        (SELECT COALESCE(MAX(sort), 0) + 1 FROM position_categories)
      )
      RETURNING *
    `;
    const stats = await reclassifyLeads(sql);
    return NextResponse.json({ ...result[0], stats }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
