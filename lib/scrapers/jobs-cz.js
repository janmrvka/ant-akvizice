import { cityToRegion } from "../regions.js";
import { cleanHtmlText } from "../text.js";

const KEYWORDS = [
  "marketing specialist",
  "marketing manager",
  "digital marketing",
  "PPC specialista",
  "SEO specialista",
  "performance marketing",
  "online marketing",
  "marketingový specialista",
  "social media",
  "content marketing",
  "content creator",
  "brand manager",
  "e-commerce marketing",
  "growth hacker",
  // jobs.cz nespáruje anglický dotaz s českým názvem pozice — proto i české a placené varianty
  "digitální marketing",
  "výkonnostní marketing",
  "paid media",
  "paid social",
  "meta ads",
  "sociální sítě",
];

// Kolik stránek výsledků (po 30) brát u každého dotazu
const KEYWORD_PAGES = 3;

function parseJobs(html) {
  const leads = [];

  // Parsovat každou kartu zvlášť — zabrání rozjeté indexaci mezi tituly/URL/firmami
  const cardPattern = /<article[^>]*class="SearchResultCard"[^>]*>[\s\S]*?<\/article>/g;
  const cards = [...html.matchAll(cardPattern)].map((m) => m[0]);

  for (const card of cards) {
    const titleMatch = card.match(/data-test-ad-title="([^"]+)"/);
    const urlMatch = card.match(/href="(https:\/\/www\.jobs\.cz\/rpd\/[^"?]+)/);

    // Obsah <li class="SearchResultCard__footerItem">…</li> — bez zbytků otevíracího tagu
    const footerItems = [
      ...card.matchAll(/<li[^>]*class="SearchResultCard__footerItem"[^>]*>([\s\S]*?)<\/li>/g),
    ].map((m) => cleanHtmlText(m[1]));

    const title = cleanHtmlText(titleMatch?.[1]);
    const url = urlMatch?.[1];
    const company = footerItems[0] || null;
    const cityRaw = footerItems[1] || null;
    const city = cityRaw?.split("–")[0].split("-")[0].trim() || null;
    const region = cityToRegion(cityRaw);

    if (!title || !url || !company) continue;

    leads.push({
      company,
      title,
      description: "",
      url,
      source: "jobs.cz",
      company_domain: null,
      city,
      region,
    });
  }

  return leads;
}

// Celostátní rubrika Marketing — zachytí vše v marketingu bez ohledu na keyword (projde se stránkováním)
const CATEGORY_URL = "https://www.jobs.cz/prace/marketing/";
const CATEGORY_MAX_PAGES = 40;

async function fetchUrl(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html",
      "Accept-Language": "cs-CZ,cs;q=0.9",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

async function fetchPage(keyword, page = 1) {
  const encoded = encodeURIComponent(keyword);
  return fetchUrl(`https://www.jobs.cz/prace/?q[]=${encoded}${page > 1 ? `&page=${page}` : ""}`);
}

export async function fetchJobDetail(url) {
  try {
    const html = await fetchUrl(url);

    // Extrahuj mzdu z data-test="jd-salary" bloku
    // SVG uvnitř bloku obsahuje > v path datech — přeskočíme ho přes </svg>
    let salaryPrefix = "";
    const salaryBlockIdx = html.indexOf('data-test="jd-salary"');
    if (salaryBlockIdx !== -1) {
      const svgEnd = html.indexOf("</svg>", salaryBlockIdx);
      if (svgEnd !== -1) {
        const afterSvg = html.slice(svgEnd, svgEnd + 400);
        const pMatch = afterSvg.match(/<p[^>]*>([\s\S]*?)<\/p>/);
        if (pMatch) {
          const salary = cleanHtmlText(pMatch[1]);
          if (salary) salaryPrefix = `Mzda: ${salary}\n\n`;
        }
      }
    }

    // Extrahuj text z RichContent sekce
    const richMatch = html.match(/<div[^>]*class="[^"]*RichContent[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/);
    let text = "";
    if (richMatch) {
      text = cleanHtmlText(richMatch[1]);
    }

    // Alternativa: celý main content pokud RichContent chybí
    if (!text) {
      const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/);
      if (mainMatch) {
        text = mainMatch[1]
          .replace(/<script[\s\S]*?<\/script>/gi, "")
          .replace(/<style[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 10000);
      }
    }

    return (salaryPrefix + text) || null;
  } catch {
    return null;
  }
}

export async function scrapeJobsCz() {
  const allLeads = [];
  const seen = new Set();

  // Přidá nové leady, vrátí kolik jich bylo nových
  const add = (leads) => {
    let added = 0;
    for (const lead of leads) {
      if (!seen.has(lead.url)) {
        seen.add(lead.url);
        allLeads.push(lead);
        added++;
      }
    }
    return added;
  };

  // 1. Celostátní rubrika Marketing — stránkovat, dokud přicházejí nové inzeráty
  for (let page = 1; page <= CATEGORY_MAX_PAGES; page++) {
    let leads;
    try {
      leads = parseJobs(await fetchUrl(page > 1 ? `${CATEGORY_URL}?page=${page}` : CATEGORY_URL));
    } catch {
      break;
    }
    if (leads.length === 0 || add(leads) === 0) break;
  }

  // 2. Keywords scraping — doplní pozice zařazené mimo rubriku Marketing
  const tasks = KEYWORDS.flatMap((kw) =>
    Array.from({ length: KEYWORD_PAGES }, (_, i) => () => fetchPage(kw, i + 1).then(parseJobs))
  );
  for (let i = 0; i < tasks.length; i += 3) {
    const results = await Promise.allSettled(tasks.slice(i, i + 3).map((t) => t()));
    for (const result of results) {
      if (result.status === "fulfilled") add(result.value);
    }
  }

  return allLeads;
}
