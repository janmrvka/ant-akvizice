import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

export default sql;

export async function initDb() {
  await sql`
    CREATE TABLE IF NOT EXISTS salespeople (
      id        SERIAL PRIMARY KEY,
      name      TEXT NOT NULL,
      color     TEXT NOT NULL DEFAULT '#6366f1',
      initials  TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS leads (
      id            SERIAL PRIMARY KEY,
      company       TEXT NOT NULL,
      title         TEXT NOT NULL,
      description   TEXT,
      url           TEXT NOT NULL,
      source        TEXT NOT NULL,
      found_at      TIMESTAMPTZ DEFAULT NOW(),
      status        TEXT NOT NULL DEFAULT 'new',
      assignee_id   INT REFERENCES salespeople(id) ON DELETE SET NULL,

      -- AI enrichment
      decision_maker      TEXT,
      contact             TEXT,
      linkedin_url        TEXT,
      signal              TEXT,
      why_now             TEXT,
      company_info        TEXT,
      match_score         INT,
      enriched_at         TIMESTAMPTZ,

      -- lokace
      city                TEXT,
      region              TEXT,

      -- deduplication
      company_domain      TEXT,

      created_at    TIMESTAMPTZ DEFAULT NOW(),
      updated_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS leads_status_idx ON leads(status)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS leads_found_at_idx ON leads(found_at DESC)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS leads_assignee_idx ON leads(assignee_id)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS leads_domain_idx ON leads(company_domain)
  `;

  // migrace — přidej sloupce pokud chybí
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS city TEXT`;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS region TEXT`;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS is_competitor BOOLEAN`;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS competitor_reason TEXT`;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS company_type TEXT`;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS contacts JSONB`;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS company_web TEXT`;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS ico TEXT`;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS company_summary TEXT`;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS job_detail TEXT`;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS detail_fetched_at TIMESTAMPTZ`;

  await sql`
    CREATE TABLE IF NOT EXISTS competitor_companies (
      id         SERIAL PRIMARY KEY,
      company    TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  // Reset AI klasifikačních dat — nahrazeno manuálním označováním
  await sql`
    UPDATE leads SET is_competitor = NULL, competitor_reason = NULL, company_type = NULL
    WHERE competitor_reason = 'Ručně označeno jako konkurence'
       OR (is_competitor IS NOT NULL AND NOT EXISTS (
         SELECT 1 FROM competitor_companies WHERE company = leads.company
       ))
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS leads_region_idx ON leads(region)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS leads_competitor_idx ON leads(is_competitor)
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS scrape_runs (
      id              SERIAL PRIMARY KEY,
      ran_at          TIMESTAMPTZ DEFAULT NOW(),
      status          TEXT NOT NULL DEFAULT 'running',
      new_leads_count INT DEFAULT 0,
      error           TEXT
    )
  `;

  await sql`
    INSERT INTO salespeople (name, color, initials)
    SELECT 'Nepřiřazeno', '#94a3b8', 'N/A'
    WHERE NOT EXISTS (SELECT 1 FROM salespeople WHERE name = 'Nepřiřazeno')
  `;

  // ── Štítky firem (Personální agentura, Konkurence…) ──
  // Párují se přes company_key = lower(trim(company)), platí pro všechny inzeráty firmy
  await sql`
    CREATE TABLE IF NOT EXISTS company_tags (
      id         SERIAL PRIMARY KEY,
      name       TEXT NOT NULL UNIQUE,
      color      TEXT NOT NULL DEFAULT '#64748b',
      sort       INT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS company_tag_links (
      company_key TEXT NOT NULL,
      tag_id      INT NOT NULL REFERENCES company_tags(id) ON DELETE CASCADE,
      created_at  TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (company_key, tag_id)
    )
  `;
  await sql`
    INSERT INTO company_tags (name, color, sort) VALUES
      ('Personální agentura', '#f59e0b', 1),
      ('Konkurence antstudio.cz', '#ef4444', 2)
    ON CONFLICT (name) DO NOTHING
  `;
  // Přenést původní ruční označení konkurence
  await sql`
    INSERT INTO company_tag_links (company_key, tag_id)
    SELECT lower(btrim(c.company)), t.id
    FROM competitor_companies c, company_tags t
    WHERE t.name = 'Konkurence antstudio.cz'
    ON CONFLICT DO NOTHING
  `;
  // Jednorázový přenos — jinak by každá inicializace vrátila odebrané štítky
  await sql`DELETE FROM competitor_companies`;

  // Štítek s varováním = firmy, které nechceme oslovovat (karta je výrazně označená)
  const [{ has_warning }] = await sql`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'company_tags' AND column_name = 'warning'
    ) AS has_warning
  `;
  if (!has_warning) {
    await sql`ALTER TABLE company_tags ADD COLUMN warning BOOLEAN NOT NULL DEFAULT false`;
    await sql`
      UPDATE company_tags SET warning = true
      WHERE name IN ('Personální agentura', 'Konkurence antstudio.cz')
    `;
  }

  // ── Poznámka k firmě — sdílená pro všechny inzeráty firmy ──
  await sql`
    CREATE TABLE IF NOT EXISTS company_notes (
      company_key TEXT PRIMARY KEY,
      note        TEXT NOT NULL,
      updated_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  // ── Kategorie pozic ──
  await sql`
    CREATE TABLE IF NOT EXISTS position_categories (
      id          SERIAL PRIMARY KEY,
      name        TEXT NOT NULL UNIQUE,
      color       TEXT NOT NULL DEFAULT '#64748b',
      keywords    TEXT NOT NULL DEFAULT '',
      fallback    BOOLEAN NOT NULL DEFAULT false,
      assignee_id INT REFERENCES salespeople(id) ON DELETE SET NULL,
      sort        INT NOT NULL DEFAULT 0,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS position_ids INT[] NOT NULL DEFAULT '{}'`;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS positions_manual BOOLEAN NOT NULL DEFAULT false`;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS assignee_auto BOOLEAN NOT NULL DEFAULT false`;
  await sql`CREATE INDEX IF NOT EXISTS leads_position_ids_idx ON leads USING GIN (position_ids)`;

  const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM position_categories`;
  if (count === 0) {
    for (const [i, c] of DEFAULT_POSITION_CATEGORIES.entries()) {
      await sql`
        INSERT INTO position_categories (name, color, keywords, fallback, sort, assignee_id)
        VALUES (
          ${c.name}, ${c.color}, ${c.keywords}, ${c.fallback ?? false}, ${i + 1},
          (SELECT id FROM salespeople WHERE name = ${c.assignee ?? ""} LIMIT 1)
        )
      `;
    }
  }
}

// Výchozí kategorie — pořadí určuje i prioritu předpřiřazení člověka
export const DEFAULT_POSITION_CATEGORIES = [
  {
    name: "Marketingový specialista", color: "#ec4899", fallback: true, assignee: "Jan Mrvka",
    keywords: "market*, cmo, head of marketing",
  },
  {
    name: "Brand", color: "#8b5cf6", assignee: "Tomáš Lupínek",
    keywords: "brand*, -brand ambassador*, -brand retail store*, -employer brand*",
  },
  {
    name: "Social performance / Paid social", color: "#0ea5e9", assignee: "Miloš Zlesa",
    keywords: "social performance, performance market*, performance spec*, performance digital, performance lead, performance manager, performance executive, b2b2c performance, paid social, paid media, social ads, meta ads, facebook ads, instagram ads, tiktok ads, linkedin ads, vykonnost*, -ppc, -google ads, -sem, -amazon ads, -marketplace ads",
  },
  {
    name: "Sociální sítě", color: "#3b82f6", assignee: "Jan Polák",
    keywords: "social*, socialni*, some, influencer*, community, comunity, instagram, tiktok, facebook, creator*, ugc, reels, video*, videomaker*, -social ads, -paid social, -social performance",
  },
  {
    name: "PPC / Performance", color: "#f97316", assignee: "Martin Ulrich",
    keywords: "ppc, performance growth, sem, search engine marketing, google ads, paid*, ads specialist, media planner, media plan*, media buy*, media spec*, media consult*, digital media, medialniho planovani, rtb, growth*, demand gen*, affiliate*, amazon ads, marketplace ads, retail media",
  },
  {
    name: "Copy / Content", color: "#14b8a6",
    keywords: "copy*, content*, obsah*, redaktor*, editor*, textar*, blog*",
  },
  {
    name: "SEO / GEO", color: "#22c55e", assignee: "Pavel Strousek",
    keywords: "seo, aio, geo, aeo, search engine optim*, ai search",
  },
  {
    name: "E-mailing / CRM", color: "#06b6d4",
    keywords: "email*, e mail*, crm, retention, loyalty, marketing automation, newsletter*, deliverability",
  },
  {
    name: "E-commerce", color: "#eab308",
    keywords: "e commerce, ecommerce, e shop*, eshop*, marketplace*, omnichannel, d2c",
  },
  {
    name: "PR / Komunikace", color: "#a855f7",
    keywords: "pr, public relations, komunikac*, communication*, tiskov*, corporate affairs, csr, marcom",
  },
  {
    name: "Eventy", color: "#f43f5e",
    keywords: "event*, eventov*, veletrh*, ticketing",
  },
  {
    name: "Trade marketing", color: "#84cc16",
    keywords: "trade*, shopper, pos, pop, in store, instore, category*, merchandis*, btl, lokalniho marketing*",
  },
  {
    name: "Grafika / Design", color: "#d946ef",
    keywords: "grafik*, graphic*, design*, art director, motion*, ux, ui",
  },
  {
    name: "Web / Vývoj", color: "#0ea5e9",
    keywords: "web*, vyvojar*, web developer*, frontend*, backend*, full stack*, fullstack*, wordpress, cms, php, javascript, -webinar*",
  },
  {
    name: "Data / Analytika", color: "#6366f1",
    keywords: "analy*, data, datov*, insight*, bi, tracking, measurement",
  },
  {
    name: "Produkt", color: "#78716c", fallback: true,
    keywords: "product manager, produktov*, product owner, product marketing*, product portfolio",
  },
  {
    name: "Obchod", color: "#64748b", fallback: true,
    keywords: "obchod*, sales, business development, account manager, account executive, key account, prodej*, telesales",
  },
];
