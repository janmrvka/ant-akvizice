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

function extractDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function parseJobs(html) {
  const leads = [];

  // Extrahuj tituly
  const titles = [...html.matchAll(/data-test-ad-title="([^"]+)"/g)].map((m) => m[1]);

  // Extrahuj URL (bez tracking parametrů)
  const urls = [...html.matchAll(/href="(https:\/\/www\.jobs\.cz\/rpd\/[^"?]+)/g)].map((m) => m[1]);

  // Extrahuj firmy — jsou v SearchResultCard__footerItem, střídají se firma + lokalita
  const footerItems = [...html.matchAll(/SearchResultCard__footerItem[^>]*>[\s\S]{0,300}?<\/li>/g)].map(
    (m) => m[0].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").replace(/SearchResultCard__footerItem[^"]*"\s*>\s*/g, "").trim()
  );

  // Firmy jsou na sudých pozicích (0, 2, 4...) v footerItems
  const companies = footerItems.filter((_, i) => i % 2 === 0);

  for (let i = 0; i < titles.length; i++) {
    const title = titles[i]?.replace(/&amp;/g, "&");
    const url = urls[i];
    const company = companies[i]?.replace(/&amp;/g, "&");

    if (!title || !url || !company) continue;

    leads.push({
      company,
      title,
      description: "",
      url,
      source: "jobs.cz",
      company_domain: extractDomain(url),
    });
  }

  return leads;
}

async function fetchPage(keyword, page = 1) {
  const encoded = encodeURIComponent(keyword);
  const url = `https://www.jobs.cz/prace/?q[]=${encoded}&pg=${page}`;
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

  for (const keyword of KEYWORDS) {
    try {
      const html = await fetchPage(keyword);
      const leads = parseJobs(html);
      for (const lead of leads) {
        if (!seen.has(lead.url)) {
          seen.add(lead.url);
          allLeads.push(lead);
        }
      }
      await new Promise((r) => setTimeout(r, 1500));
    } catch (err) {
      console.error(`[jobs.cz] "${keyword}":`, err.message);
    }
  }

  return allLeads;
}
