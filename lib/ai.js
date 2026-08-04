import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Signály pro rychlé pravidlové předfiltrování před voláním AI
const COMPETITOR_NAME_SIGNALS = [
  "agentura", "agency", "studio", "media", "marketing", "digital", "kreativní",
  "reklamní", "komunikace", "pr ", " pr,", "social", "influencer", "content",
  "seo", "ppc", "sem ", "ads ", "performance", "growth", "brand", "design",
  "webdesign", "webstudio", "grafické", "komunikační",
];
const COMPETITOR_TITLE_SIGNALS = [
  "account manager", "account executive", "client service", "project manager pro klienty",
  "media planner", "media buyer", "social media manager", "community manager",
  "ppc specialista", "seo specialista", "content manager", "copywriter pro agenturu",
  "grafik pro agenturu", "art director", "kreativní ředitel", "brand manager pro agenturu",
];

function quickRuleCheck(lead) {
  const nameLower = (lead.company || "").toLowerCase();
  const titleLower = (lead.title || "").toLowerCase();
  const descLower = (lead.description || "").toLowerCase();

  for (const sig of COMPETITOR_NAME_SIGNALS) {
    if (nameLower.includes(sig)) return { hit: true, reason: `Název firmy obsahuje '${sig}'` };
  }
  for (const sig of COMPETITOR_TITLE_SIGNALS) {
    if (titleLower.includes(sig) || descLower.includes(sig)) {
      return { hit: true, reason: `Inzerát obsahuje '${sig}'` };
    }
  }
  return { hit: false };
}

export async function classifyCompetitor(lead) {
  // Rychlá pravidlová kontrola — pokud jasný hit, AI potvrdí s vysokou pravděpodobností
  const ruleHit = quickRuleCheck(lead);

  const prompt = `Jsi klasifikátor leadů pro marketingovou agenturu ANT studio (antstudio.cz). ANT dělá: digitální marketing, PPC, SEO, content, weby a e-shopy pro koncové firmy.

Rozhodni, zda je níže uvedená firma KONKURENCE (jiná marketingová/kreativní agentura, PR studio, mediální agentura, web studio) nebo KONCOVÁ FIRMA (firma, která marketing nakupuje, ne prodává).

Firma: ${lead.company}
Inzerát: ${lead.title}
Popis: ${(lead.description || "").substring(0, 400)}
${ruleHit.hit ? `Poznámka: Automatická kontrola odhalila signál: ${ruleHit.reason}` : ""}

Odpověz POUZE validním JSON:
{
  "is_competitor": true nebo false,
  "company_type": "Marketingová agentura" | "PR agentura" | "Mediální agentura" | "Web studio" | "Kreativní studio" | "E-commerce firma" | "B2B firma" | "B2C firma" | "SaaS/Tech" | "Retail" | "Výrobní firma" | "Finanční služby" | "Zdravotnictví" | "Vzdělávání" | "Nezisková org." | "Státní instituce" | "Jiné",
  "confidence": 0-100,
  "reason": "max 120 znaků — konkrétní důvod rozhodnutí"
}`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content.find((b) => b.type === "text")?.text || "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON in classify response");

  const result = JSON.parse(match[0]);
  return {
    is_competitor: Boolean(result.is_competitor),
    company_type: result.company_type || "Jiné",
    confidence: result.confidence ?? 50,
    competitor_reason: result.reason || null,
  };
}

export async function enrichLead(lead) {
  const prompt = `Jsi expert na B2B sales research pro marketingovou agenturu ANT studio (antstudio.cz). ANT se specializuje na digitální marketing, výkonnostní reklamu (PPC), SEO, content marketing a tvorbu webů/e-shopů pro české firmy.

Analyzuj tohoto potenciálního klienta a poskytni strukturované informace:

**Firma:** ${lead.company}
**Inzerát:** ${lead.title}
**Popis:** ${lead.description || "Není k dispozici"}
**Zdroj inzerátu:** ${lead.source}
**URL:** ${lead.url}

Poskytni analýzu v JSON formátu s těmito poli:
- decision_maker: Jméno a pozice pravděpodobného rozhodovatele (CMO, marketingový ředitel, CEO u menších firem). Pokud neznáš konkrétní jméno, napiš pravděpodobnou pozici.
- contact: Nejpravděpodobnější kontaktní email nebo způsob kontaktu (odhadni formát emailu z domény firmy)
- linkedin_url: Odhadované LinkedIn URL firmy (https://www.linkedin.com/company/nazev-firmy/)
- signal: Klíčový signál proč firma hledá marketing nyní (max 100 znaků, konkrétní a actionable)
- why_now: Proč je právě teď správný čas oslovit tuto firmu (max 150 znaků, business důvod)
- company_info: Stručné info o firmě - odvětví, velikost, co dělají (max 200 znaků)
- match_score: Číslo 0-100 jak dobře firma sedí na ANT jako klient (100 = ideální fit)

Kritéria pro match_score:
- 80-100: Firma v e-commerce, SaaS, nebo B2C s jasnou potřebou performance marketingu, hledá PPC/SEO/content
- 60-79: Firma v B2B nebo tradičním sektoru s rozumným marketingovým budgetem
- 40-59: Firma s potenciálem ale nejasným fit nebo malým budgetem
- 0-39: Nevhodný klient (státní instituce, very small business, nekomerční)

Odpověz POUZE validním JSON objektem, žádný jiný text.`;

  const stream = await client.messages.stream({
    model: "claude-opus-4-8",
    max_tokens: 1024,
    thinking: { type: "adaptive" },
    messages: [{ role: "user", content: prompt }],
  });

  const message = await stream.finalMessage();

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock) throw new Error("No text response from Claude");

  const jsonText = textBlock.text.trim();
  const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in response");

  return JSON.parse(jsonMatch[0]);
}
