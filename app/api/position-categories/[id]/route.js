import sql from "@/lib/db";
import { reclassifyLeads } from "@/lib/positions";
import { NextResponse } from "next/server";

// PATCH — úprava kategorie; změna klíčových slov, pořadí nebo člověka přepočítá leady
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const allowed = ["name", "color", "keywords", "fallback", "assignee_id", "sort"];
    const updates = Object.entries(body).filter(([k]) => allowed.includes(k));
    if (updates.length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const setClauses = updates.map(([k], i) => `${k} = $${i + 2}`).join(", ");
    const values = [parseInt(id), ...updates.map(([k, v]) => (k === "assignee_id" ? v || null : v))];
    const result = await sql.query(
      `UPDATE position_categories SET ${setClauses} WHERE id = $1 RETURNING *`,
      values
    );

    const needsReclassify = updates.some(([k]) => ["keywords", "fallback", "assignee_id", "sort"].includes(k));
    const stats = needsReclassify ? await reclassifyLeads(sql) : null;
    return NextResponse.json({ ...result[0], stats });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const catId = parseInt(id);
    await sql`DELETE FROM position_categories WHERE id = ${catId}`;
    await sql`UPDATE leads SET position_ids = array_remove(position_ids, ${catId}) WHERE ${catId} = ANY(position_ids)`;
    const stats = await reclassifyLeads(sql);
    return NextResponse.json({ ok: true, stats });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
