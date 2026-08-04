import sql from "@/lib/db";
import { NextResponse } from "next/server";

const MOCK_LEADS = [
  {
    company: "Rohlík.cz",
    title: "Senior Performance Marketing Specialist",
    description: "Hledáme zkušeného performance marketéra pro řízení PPC kampaní na Google Ads a Meta. Budete zodpovědný za správu rozpočtu 5M+ Kč měsíčně, optimalizaci ROAS a škálování akvizičních kampaní.",
    url: "https://www.jobs.cz/rpd/1234567890/",
    source: "jobs.cz",
    company_domain: "rohlik.cz",
    found_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    decision_maker: "CMO / Marketingový ředitel",
    contact: "marketing@rohlik.cz",
    linkedin_url: "https://www.linkedin.com/company/rohlik-cz/",
    signal: "Rychlá expanze do Německa a Maďarska, potřeba škálovat akvizici",
    why_now: "Spouštějí nové trhy Q1 2025, hledají parťáka pro growth",
    company_info: "Největší český online supermarket, 2000+ zaměstnanců, roční obrat 8 mld. Kč",
    match_score: 92,
    status: "new",
  },
  {
    company: "Alza.cz",
    title: "Online Marketing Manager — SEO & Content",
    description: "Hledáme manažera pro řízení SEO strategie a content marketingu. Spolupráce s agenturami, správa interního týmu 3 lidí, zodpovědnost za organickou návštěvnost.",
    url: "https://www.jobs.cz/rpd/2345678901/",
    source: "jobs.cz",
    company_domain: "alza.cz",
    found_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    decision_maker: "Head of Digital Marketing",
    contact: "hr@alza.cz",
    linkedin_url: "https://www.linkedin.com/company/alza-cz/",
    signal: "Interní SEO tým nestačí, přechod na hybridní model agentura+inhouse",
    why_now: "Ztráta pozic po Google update, urgentní potřeba SEO auditu",
    company_info: "Největší e-shop v ČR, elektronika a spotřební zboží, 3500 zaměstnanců",
    match_score: 85,
    status: "new",
  },
  {
    company: "Kiwi.com",
    title: "Digital Marketing Specialist — Paid Social",
    description: "Join our growth team as a Paid Social specialist. You'll manage Meta, TikTok and Pinterest campaigns for our travel platform across 15 markets.",
    url: "https://www.startupjobs.cz/nabidka/345678/",
    source: "startupjobs.cz",
    company_domain: "kiwi.com",
    found_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    decision_maker: "VP of Growth",
    contact: "careers@kiwi.com",
    linkedin_url: "https://www.linkedin.com/company/kiwi-com/",
    signal: "Expanze na asijské trhy, hledají support pro paid social 15 trhů",
    why_now: "Cestovní sezona Q2, budget na paid social 3x vyšší než loni",
    company_info: "Globální travel-tech platforma, 2000 zaměstnanců, Brno HQ",
    match_score: 78,
    status: "contacted",
  },
  {
    company: "Mall.cz",
    title: "PPC Specialista — Google & Heureka",
    description: "Hledáme PPC specialistu pro správu kampaní v Google Ads, Heurece a Zboží.cz. Zkušenosti s feed managementem a Shopping kampaněmi jsou nutností.",
    url: "https://www.jobs.cz/rpd/3456789012/",
    source: "jobs.cz",
    company_domain: "mall.cz",
    found_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    decision_maker: "Marketingový ředitel",
    contact: "marketing@mall.cz",
    linkedin_url: "https://www.linkedin.com/company/mall-group/",
    signal: "Odchod interního PPC specialisty, akutní potřeba náhrady",
    why_now: "Vánoční sezóna za rohem, PPC kampaně bez správce = ztráta obratu",
    company_info: "Druhý největší český e-shop, součást Mall Group, 1200 zaměstnanců",
    match_score: 88,
    status: "new",
  },
  {
    company: "Czechitas",
    title: "Marketing & Communications Manager",
    description: "Hledáme marketingového manažera pro rozvoj brand awareness a komunikaci programů. Zkušenosti s social media, PR a event marketingem.",
    url: "https://www.prace.cz/nabidky/123456/",
    source: "prace.cz",
    company_domain: "czechitas.cz",
    found_at: new Date(Date.now() - 12 * 86400000).toISOString(),
    decision_maker: "CEO / Dita Přikrylová",
    contact: "info@czechitas.cz",
    linkedin_url: "https://www.linkedin.com/company/czechitas/",
    signal: "Rapid growth neziskovky, potřeba profesionalizovat marketing",
    why_now: "Nové granty = budget na marketing, rozšiřují tým",
    company_info: "Nezisková organizace vzdělávající ženy v IT, 50+ zaměstnanců",
    match_score: 35,
    status: "lost",
  },
  {
    company: "Liftago",
    title: "Growth Marketing Manager",
    description: "Hledáme Growth Marketing Managera pro řízení user acquisition a retention kampaní. Budete pracovat s daty, A/B testovat a škálovat kanály.",
    url: "https://www.startupjobs.cz/nabidka/456789/",
    source: "startupjobs.cz",
    company_domain: "liftago.cz",
    found_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    decision_maker: "CEO / Ondřej Krátký",
    contact: "jobs@liftago.cz",
    linkedin_url: "https://www.linkedin.com/company/liftago/",
    signal: "Spouštění B2B produktu, potřeba growth strategie od nuly",
    why_now: "Nové investiční kolo, skalují tým i marketing budget",
    company_info: "Česká alternativa Uberu, mobility startup, 100 zaměstnanců",
    match_score: 82,
    status: "in_progress",
  },
  {
    company: "Pilulka.cz",
    title: "SEO Specialista",
    description: "Hledáme SEO specialistu pro správu organické návštěvnosti největší české online lékárny. Zkušenosti s technickým SEO, link buildingem a content strategií.",
    url: "https://www.jobs.cz/rpd/4567890123/",
    source: "jobs.cz",
    company_domain: "pilulka.cz",
    found_at: new Date(Date.now() - 18 * 86400000).toISOString(),
    decision_maker: "Head of Marketing",
    contact: "marketing@pilulka.cz",
    linkedin_url: "https://www.linkedin.com/company/pilulka-cz/",
    signal: "Vstup na slovenský a rumunský trh, potřeba multilingual SEO",
    why_now: "Mezinárodní expanze 2025, SEO jako klíčový akvizční kanál",
    company_info: "Největší česká online lékárna, 350 zaměstnanců, rychlý mezinárodní růst",
    match_score: 80,
    status: "new",
  },
  {
    company: "Footshop",
    title: "Digital Marketing Specialist — Sneakers",
    description: "We're looking for a Digital Marketing Specialist to manage our paid channels. You'll handle Google Ads, Meta Ads, and influencer collaborations for our sneaker community.",
    url: "https://www.startupjobs.cz/nabidka/567890/",
    source: "startupjobs.cz",
    company_domain: "footshop.eu",
    found_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    decision_maker: "CMO",
    contact: "marketing@footshop.eu",
    linkedin_url: "https://www.linkedin.com/company/footshop/",
    signal: "Expanduje do 8 nových evropských zemí, hledá performance parťáka",
    why_now: "Nike & Adidas partnerství = nový budget, Q2 launch",
    company_info: "Prémiový sneaker e-shop, Střední a Východní Evropa, 200 zaměstnanců",
    match_score: 87,
    status: "new",
  },
  {
    company: "STRV",
    title: "Marketing Manager — Tech Agency",
    description: "Hledáme Marketing Managera pro rozvoj brand awareness české tech agentury na americkém trhu. Zkušenosti s B2B marketingem a content strategií.",
    url: "https://www.startupjobs.cz/nabidka/678901/",
    source: "startupjobs.cz",
    company_domain: "strv.com",
    found_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    decision_maker: "CEO / Lubo Smid",
    contact: "hr@strv.com",
    linkedin_url: "https://www.linkedin.com/company/strv/",
    signal: "Cílí na US klienty, potřeba B2B lead gen a thought leadership",
    why_now: "Otevřeli Miami office, agresivní US expansion plan",
    company_info: "Přední česká tech agentura, 300 zaměstnanců, klienti jako BMW, NFL",
    match_score: 65,
    status: "new",
  },
  {
    company: "Multisport",
    title: "Online Marketing Specialist",
    description: "Hledáme online marketéra pro správu B2C i B2B kampaní. Správa PPC, sociálních sítí a emailového marketingu pro benefitní program.",
    url: "https://www.prace.cz/nabidky/234567/",
    source: "prace.cz",
    company_domain: "multisport.cz",
    found_at: new Date(Date.now() - 28 * 86400000).toISOString(),
    decision_maker: "Marketing Director",
    contact: "info@multisport.cz",
    linkedin_url: "https://www.linkedin.com/company/multisport-benefit-club/",
    signal: "Rebranding + nový produkt pro SMB firmy",
    why_now: "Post-covid boom sportu, škálují B2B akvizici firemních klientů",
    company_info: "Největší benefitní sportovní program v ČR, 120 zaměstnanců",
    match_score: 72,
    status: "new",
  },
];

export async function GET() {
  try {
    let inserted = 0;
    let skipped = 0;

    for (const lead of MOCK_LEADS) {
      const existing = await sql`
        SELECT id FROM leads WHERE url = ${lead.url} LIMIT 1
      `;
      if (existing.length > 0) { skipped++; continue; }

      await sql`
        INSERT INTO leads (
          company, title, description, url, source, company_domain,
          found_at, status,
          decision_maker, contact, linkedin_url,
          signal, why_now, company_info, match_score,
          enriched_at
        ) VALUES (
          ${lead.company}, ${lead.title}, ${lead.description}, ${lead.url},
          ${lead.source}, ${lead.company_domain},
          ${lead.found_at}::timestamptz, ${lead.status},
          ${lead.decision_maker}, ${lead.contact}, ${lead.linkedin_url},
          ${lead.signal}, ${lead.why_now}, ${lead.company_info}, ${lead.match_score},
          NOW()
        )
      `;
      inserted++;
    }

    return NextResponse.json({ ok: true, inserted, skipped });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
