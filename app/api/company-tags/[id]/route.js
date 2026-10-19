import sql from "@/lib/db";
import { syncUnwantedStatus } from "@/lib/company-status";
import { NextResponse } from "next/server";

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const { name, color, warning } = await request.json();
    const result = await sql`
      UPDATE company_tags SET
        name = COALESCE(${name?.trim() || null}, name),
        color = COALESCE(${color || null}, color),
        warning = COALESCE(${typeof warning === "boolean" ? warning : null}, warning)
      WHERE id = ${parseInt(id)}
      RETURNING *
    `;
    if (typeof warning === "boolean") await syncUnwantedStatus(sql);
    return NextResponse.json(result[0]);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await sql`DELETE FROM company_tags WHERE id = ${parseInt(id)}`;
    await syncUnwantedStatus(sql);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
