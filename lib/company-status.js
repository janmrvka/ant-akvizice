// Firma se štítkem s varováním (personální agentura, konkurence…) = nechceme oslovovat.
// Nové leady takové firmy dostanou status "unwanted"; po odebrání štítku se vrátí na "new".
// Leady, se kterými už se pracuje (osloven, probíhá…), se nemění.
import { reclassifyLeads } from "./positions.js";

export async function syncUnwantedStatus(sql, companyKeys) {
  const keys = companyKeys ?? null;
  await sql`
    UPDATE leads l SET status = 'unwanted', updated_at = NOW()
    WHERE l.status = 'new'
      AND (${keys}::text[] IS NULL OR lower(btrim(l.company)) = ANY(${keys}::text[]))
      AND EXISTS (
        SELECT 1 FROM company_tag_links k JOIN company_tags t ON t.id = k.tag_id
        WHERE t.warning AND k.company_key = lower(btrim(l.company))
      )
  `;
  await sql`
    UPDATE leads l SET status = 'new', updated_at = NOW()
    WHERE l.status = 'unwanted'
      AND (${keys}::text[] IS NULL OR lower(btrim(l.company)) = ANY(${keys}::text[]))
      AND NOT EXISTS (
        SELECT 1 FROM company_tag_links k JOIN company_tags t ON t.id = k.tag_id
        WHERE t.warning AND k.company_key = lower(btrim(l.company))
      )
  `;

  // Přiřazení obchodníkovi „Nechceme/neoslovovat“ (a zpět podle kategorie pozice)
  await reclassifyLeads(sql, companyKeys ? { companyKeys } : {});
}
