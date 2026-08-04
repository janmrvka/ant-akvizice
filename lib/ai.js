import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

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
