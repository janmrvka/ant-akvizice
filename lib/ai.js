import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function enrichLead(lead) {
  const prompt = `Jsi expert na B2B sales research pro českou marketingovou agenturu ANT studio (antstudio.cz). ANT se specializuje na digitální marketing, PPC, SEO, content marketing a tvorbu webů/e-shopů.

Proveď důkladný research následující firmy pomocí web search. Hledej informace na firemním webu, LinkedIn, ARES (ares.gov.cz), a dalších veřejných zdrojích.

**Firma:** ${lead.company}
**Inzerát:** ${lead.title}
**Popis:** ${lead.description || "Není k dispozici"}
**Zdroj:** ${lead.source}
**URL inzerátu:** ${lead.url}

ÚKOLY:
1. Najdi IČO firmy v ARES (ares.gov.cz) - hledej podle názvu firmy
2. Najdi webové stránky firmy
3. Zjisti co firma dělá, v jakém odvětví působí, přibližnou velikost
4. Najdi vhodné kontaktní osoby pro obchodní oslovení (CEO, CMO, CSO, obchodní ředitel, marketingový ředitel, HR manažer nebo podobné vedoucí pozice). Hledej na LinkedIn, firemním webu sekci "O nás" nebo "Tým".
5. Pokud nenajdeš konkrétní osoby, najdi alespoň obecný kontakt firmy (email, telefon, kontaktní stránka)

Odpověz POUZE validním JSON objektem v tomto formátu:
{
  "ico": "12345678 nebo null",
  "company_web": "https://... nebo null",
  "company_summary": "2-3 věty: co firma dělá, odvětví, přibližná velikost",
  "signal": "Klíčový signál proč firma hledá marketing právě teď (max 100 znaků)",
  "why_now": "Proč je teď správný čas oslovit (max 150 znaků)",
  "match_score": 0-100,
  "linkedin_url": "https://linkedin.com/company/... nebo null",
  "contacts": [
    {
      "name": "Jméno Příjmení nebo null pokud neznáme",
      "role": "Pozice",
      "email": "email nebo null",
      "phone": "telefon nebo null",
      "linkedin": "https://linkedin.com/in/... nebo null",
      "source": "kde byly informace nalezeny (např. 'LinkedIn', 'firemní web', 'ARES')",
      "is_general": false
    }
  ]
}

Kritéria pro match_score:
- 80-100: E-commerce, SaaS, B2C s potřebou performance marketingu
- 60-79: B2B nebo tradiční sektor s rozumným marketingovým budgetem
- 40-59: Potenciál ale nejasný fit nebo malý budget
- 0-39: Nevhodný klient (státní instituce, very small business, nekomerční)

Pokud nenajdeš žádné konkrétní osoby, přidej do contacts jeden objekt s is_general: true a obecnými kontaktními údaji firmy.
Žádný jiný text než JSON.`;

  const response = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 4096,
    thinking: { type: "adaptive" },
    tools: [
      {
        type: "web_search_20260209",
        name: "web_search",
      },
    ],
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock) throw new Error("No text response from Claude");

  const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in response");

  const data = JSON.parse(jsonMatch[0]);

  // Zpětná kompatibilita — naplnit staré sloupce z nových dat
  const firstReal = data.contacts?.find((c) => !c.is_general);
  const firstGeneral = data.contacts?.find((c) => c.is_general);
  const primary = firstReal || firstGeneral;

  return {
    // Nové sloupce
    ico: data.ico || null,
    company_web: data.company_web || null,
    company_summary: data.company_summary || null,
    contacts: data.contacts || [],
    // Stávající sloupce
    signal: data.signal || null,
    why_now: data.why_now || null,
    company_info: data.company_summary || null,
    match_score: data.match_score ?? null,
    linkedin_url: data.linkedin_url || null,
    decision_maker: primary ? `${primary.name || ""} ${primary.role || ""}`.trim() : null,
    contact: primary?.email || null,
  };
}
