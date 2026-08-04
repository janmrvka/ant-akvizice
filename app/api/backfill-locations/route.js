import sql from "@/lib/db";
import { scrapeAll } from "@/lib/scrapers/index.js";
import { NextResponse } from "next/server";

// Jednorázový endpoint — doplní city/region do existujících leadů
export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { leads } = await scrapeAll();
    let updated = 0;

    for (const lead of leads) {
      if (!lead.city && !lead.region) continue;
      const result = await sql`
        UPDATE leads SET city = ${lead.city}, region = ${lead.region}
        WHERE url = ${lead.url} AND city IS NULL
        RETURNING id
      `;
      updated += result.length;
    }

    return NextResponse.json({ ok: true, updated });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
