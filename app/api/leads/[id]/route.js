import sql from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const result = await sql`
      SELECT
        l.*,
        s.name AS assignee_name,
        s.color AS assignee_color,
        s.initials AS assignee_initials
      FROM leads l
      LEFT JOIN salespeople s ON l.assignee_id = s.id
      WHERE l.id = ${parseInt(id)}
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const allowed = [
      "status", "assignee_id", "decision_maker", "contact",
      "linkedin_url", "signal", "why_now", "company_info", "match_score",
    ];

    const updates = Object.entries(body)
      .filter(([key]) => allowed.includes(key))
      .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const setClauses = Object.keys(updates)
      .map((key, i) => `${key} = $${i + 2}`)
      .join(", ");
    const values = [parseInt(id), ...Object.values(updates)];

    const result = await sql(
      `UPDATE leads SET ${setClauses}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      values
    );

    if (result.length === 0) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await sql`DELETE FROM leads WHERE id = ${parseInt(id)}`;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
