import sql from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const { name, color, initials } = await request.json();
    const result = await sql`
      UPDATE salespeople SET
        name = COALESCE(${name}, name),
        color = COALESCE(${color}, color),
        initials = COALESCE(${initials}, initials)
      WHERE id = ${parseInt(id)}
      RETURNING *
    `;
    return NextResponse.json(result[0]);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await sql`DELETE FROM salespeople WHERE id = ${parseInt(id)}`;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
