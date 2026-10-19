import sql from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const result = await sql`
      SELECT t.*, (SELECT COUNT(*)::int FROM company_tag_links l WHERE l.tag_id = t.id) AS companies
      FROM company_tags t
      ORDER BY t.sort, t.id
    `;
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { name, color, warning } = await request.json();
    if (!name?.trim()) return NextResponse.json({ error: "name required" }, { status: 400 });
    const result = await sql`
      INSERT INTO company_tags (name, color, warning, sort)
      VALUES (${name.trim()}, ${color || "#64748b"}, ${!!warning}, (SELECT COALESCE(MAX(sort), 0) + 1 FROM company_tags))
      RETURNING *
    `;
    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
