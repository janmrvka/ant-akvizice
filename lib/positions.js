import { normalizeForMatch } from "./text.js";

// Klíčová slova kategorie (oddělená čárkou):
//   "seo"     — celé slovo nebo fráze
//   "brand*"  — začátek slova (brand, branding, brandový…)
//   "-slovo"  — když se najde, kategorie se nepoužije
export function parseKeywords(str) {
  const include = [];
  const exclude = [];
  for (const raw of (str || "").split(/[,\n]/)) {
    let kw = raw.trim();
    if (!kw) continue;
    const isExclude = kw.startsWith("-");
    if (isExclude) kw = kw.slice(1);
    const prefix = kw.endsWith("*");
    const phrase = normalizeForMatch(kw);
    if (!phrase) continue;
    (isExclude ? exclude : include).push({ phrase, prefix });
  }
  return { include, exclude };
}

function hit(hay, { phrase, prefix }) {
  return prefix ? hay.includes(` ${phrase}`) : hay.includes(` ${phrase} `);
}

function categoryMatches(hay, category) {
  const { include, exclude } = category._kw ?? (category._kw = parseKeywords(category.keywords));
  return include.some((k) => hit(hay, k)) && !exclude.some((k) => hit(hay, k));
}

// Vrátí id kategorií pro název pozice. Záložní kategorie (fallback) se použijí,
// jen když nesedí žádná specializovaná.
export function classifyTitle(title, categories) {
  const hay = ` ${normalizeForMatch(title)} `;
  const sorted = [...categories].sort((a, b) => a.sort - b.sort || a.id - b.id);
  const primary = sorted.filter((c) => !c.fallback && categoryMatches(hay, c));
  if (primary.length > 0) return primary.map((c) => c.id);
  return sorted.filter((c) => c.fallback && categoryMatches(hay, c)).map((c) => c.id);
}

// Předpřiřazený člověk = první kategorie (podle pořadí), která má nastaveného člověka
export function pickAssignee(positionIds, categories) {
  const sorted = [...categories].sort((a, b) => a.sort - b.sort || a.id - b.id);
  const match = sorted.find((c) => c.assignee_id && positionIds.includes(c.id));
  return match?.assignee_id ?? null;
}

// Obchodník, kterému padají leady nechtěných firem (agentury, konkurence)
export async function getUnwantedAssigneeId(sql) {
  const rows = await sql`SELECT id FROM salespeople WHERE name ILIKE 'nechceme%' ORDER BY id LIMIT 1`;
  return rows[0]?.id ?? null;
}

// Přepočítá kategorie (kromě ručně upravených) a automatické přiřazení u leadů.
// Firmy se štítkem s varováním dostanou obchodníka „Nechceme/neoslovovat“.
// Ručně přiřazené leady se nemění.
export async function reclassifyLeads(sql, { leadIds, companyKeys } = {}) {
  const categories = await sql`SELECT * FROM position_categories`;
  const unwantedId = await getUnwantedAssigneeId(sql);
  const leads = await sql`
    SELECT l.id, l.title, l.position_ids, l.positions_manual, l.assignee_id, l.assignee_auto,
      EXISTS (
        SELECT 1 FROM company_tag_links k JOIN company_tags t ON t.id = k.tag_id
        WHERE t.warning AND k.company_key = lower(btrim(l.company))
      ) AS unwanted
    FROM leads l
    WHERE (${leadIds ?? null}::int[] IS NULL OR l.id = ANY(${leadIds ?? null}::int[]))
      AND (${companyKeys ?? null}::text[] IS NULL OR lower(btrim(l.company)) = ANY(${companyKeys ?? null}::text[]))
  `;

  const changes = [];
  for (const lead of leads) {
    const current = lead.position_ids || [];
    const positions = lead.positions_manual ? current : classifyTitle(lead.title, categories);

    let assignee = lead.assignee_id;
    let auto = lead.assignee_auto;
    if (lead.assignee_id == null || lead.assignee_auto) {
      assignee = lead.unwanted && unwantedId ? unwantedId : pickAssignee(positions, categories);
      auto = assignee != null;
    }

    const samePositions =
      positions.length === current.length && positions.every((id, i) => id === current[i]);
    if (!samePositions || assignee !== lead.assignee_id || auto !== lead.assignee_auto) {
      changes.push({ id: lead.id, p: positions, a: assignee, auto });
    }
  }

  if (changes.length > 0) {
    await sql`
      UPDATE leads l SET
        position_ids = ARRAY(SELECT jsonb_array_elements_text(v.p)::int),
        assignee_id = v.a,
        assignee_auto = v.auto,
        updated_at = NOW()
      FROM jsonb_to_recordset(${JSON.stringify(changes)}::jsonb) AS v(id int, p jsonb, a int, auto boolean)
      WHERE l.id = v.id
    `;
  }

  return { checked: leads.length, changed: changes.length };
}
