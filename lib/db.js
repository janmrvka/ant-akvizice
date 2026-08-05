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
}
