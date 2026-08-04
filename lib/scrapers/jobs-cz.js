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
];

function parseJobs(html) {
  const leads = [];

  const titles = [...html.matchAll(/data-test-ad-title="([^"]+)"/g)].map((m) => m[1]);
  const urls = [...html.matchAll(/href="(https:\/\/www\.jobs\.cz\/rpd\/[^"?]+)/g)].map((m) => m[1]);

  const footerItems = [...html.matchAll(/SearchResultCard__footerItem[^>]*>[\s\S]{0,300}?<\/li>/g)].map(
    (m) => m[0].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
      .replace(/^SearchResultCard__footerItem[^>]*>\s*/, "")
      .replace(/[""]\s*>\s*/g, "")
      .trim()
  );

  const companies = footerItems.filter((_, i) => i % 2 === 0);
  const locations = footerItems.filter((_, i) => i % 2 === 1);

  for (let i = 0; i < titles.length; i++) {
    const title = titles[i]?.replace(/&amp;/g, "&");
    const url = urls[i];
    const company = companies[i]?.replace(/&amp;/g, "&");
    const cityRaw = locations[i]?.replace(/&amp;/g, "&") || null;
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
