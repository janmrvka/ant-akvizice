import * as cheerio from "cheerio";

const KEYWORDS = [
  "marketing specialist",
  "marketing manager",
  "digital marketing",
  "PPC specialista",
  "SEO specialista",
  "content marketing",
  "performance marketing",
  "online marketing",
  "marketingový specialista",
  "marketingový manažer",
];

function buildSearchUrl(keyword, page = 1) {
  const encoded = encodeURIComponent(keyword);
  return `https://www.jobs.cz/prace/?q[]=${encoded}&pg=${page}`;
}

function extractDomain(url) {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

async function fetchPage(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xhtml+xml",
      "Accept-Language": "cs-CZ,cs;q=0.9",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

async function scrapeKeyword(keyword) {
  const leads = [];
  const html = await fetchPage(buildSearchUrl(keyword));
  const $ = cheerio.load(html);

  $("[data-jobad-id]").each((_, el) => {
    const $el = $(el);
    const title = $el.find("[data-link]").first().text().trim();
    const company = $el.find(".SearchResultCard__footerItem").first().text().trim();
    const href = $el.find("a[data-link]").attr("href");
    const jobUrl = href?.startsWith("http") ? href : `https://www.jobs.cz${href}`;
    const description = $el.find(".SearchResultCard__perex").text().trim();

    if (!title || !company || !jobUrl) return;

    leads.push({
      company,
      title,
      description: description.slice(0, 500),
      url: jobUrl,
      source: "jobs.cz",
      company_domain: extractDomain(jobUrl),
    });
  });

  return leads;
}

export async function scrapeJobsCz() {
  const allLeads = [];
  const seen = new Set();

  for (const keyword of KEYWORDS) {
    try {
      const leads = await scrapeKeyword(keyword);
      for (const lead of leads) {
        if (!seen.has(lead.url)) {
          seen.add(lead.url);
          allLeads.push(lead);
        }
      }
      await new Promise((r) => setTimeout(r, 1500));
    } catch (err) {
      console.error(`[jobs.cz] Error for keyword "${keyword}":`, err.message);
    }
  }

  return allLeads;
}
