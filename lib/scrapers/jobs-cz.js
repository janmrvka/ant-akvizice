import { cityToRegion } from "../regions.js";

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
];

function parseJobs(html) {
  const leads = [];

  // Parsovat každou kartu zvlášť — zabrání rozjeté indexaci mezi tituly/URL/firmami
  const cardPattern = /<article[^>]*class="SearchResultCard"[^>]*>[\s\S]*?<\/article>/g;
  const cards = [...html.matchAll(cardPattern)].map((m) => m[0]);

  for (const card of cards) {
    const titleMatch = card.match(/data-test-ad-title="([^"]+)"/);
    const urlMatch = card.match(/href="(https:\/\/www\.jobs\.cz\/rpd\/[^"?]+)/);

    const footerItems = [...card.matchAll(/class="SearchResultCard__footerItem"[\s\S]*?<\/li>/g)].map((m) => {
      return m[0].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    });

    const title = titleMatch?.[1]?.replace(/&amp;/g, "&");
    const url = urlMatch?.[1];
    const company = footerItems[0]
      ?.replace(/^class="SearchResultCard__footerItem"\s*/, "")
      .replace(/&amp;/g, "&")
      .trim();
    const cityRaw = footerItems[1]
      ?.replace(/^class="SearchResultCard__footerItem"\s*/, "")
      .replace(/&amp;/g, "&")
      .trim() || null;
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

async function fetchPage(keyword) {
  const encoded = encodeURIComponent(keyword);
  const url = `https://www.jobs.cz/prace/?q[]=${encoded}`;
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

export async function scrapeJobsCz() {
  const allLeads = [];
  const seen = new Set();

  const chunks = [];
  for (let i = 0; i < KEYWORDS.length; i += 3) chunks.push(KEYWORDS.slice(i, i + 3));

  for (const chunk of chunks) {
    const results = await Promise.allSettled(chunk.map((kw) => fetchPage(kw).then(parseJobs)));
    for (const result of results) {
      if (result.status !== "fulfilled") continue;
      for (const lead of result.value) {
        if (!seen.has(lead.url)) {
          seen.add(lead.url);
          allLeads.push(lead);
        }
      }
    }
  }

  return allLeads;
}
