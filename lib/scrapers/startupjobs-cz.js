import * as cheerio from "cheerio";

const SEARCH_URLS = [
  "https://www.startupjobs.cz/nabidky?field=marketing",
  "https://www.startupjobs.cz/nabidky?q=marketing+specialist",
  "https://www.startupjobs.cz/nabidky?q=digital+marketing",
  "https://www.startupjobs.cz/nabidky?q=PPC",
];

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
      Accept: "text/html",
      "Accept-Language": "cs-CZ,cs;q=0.9",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

export async function scrapeStartupjobs() {
  const allLeads = [];
  const seen = new Set();

  for (const searchUrl of SEARCH_URLS) {
    try {
      const html = await fetchPage(searchUrl);
      const $ = cheerio.load(html);

      $(".job-offer, [class*='JobOfferCard'], [class*='offer-card']").each((_, el) => {
        const $el = $(el);
        const title = $el.find("h2, h3, [class*='title'], [class*='position']").first().text().trim();
        const company = $el.find("[class*='company'], [class*='employer']").first().text().trim();
        const href = $el.find("a").first().attr("href");
        const jobUrl = href?.startsWith("http")
          ? href
          : `https://www.startupjobs.cz${href}`;
        const description = $el.find("p, [class*='description'], [class*='perex']").first().text().trim();

        if (!title || !company || !href) return;

        if (!seen.has(jobUrl)) {
          seen.add(jobUrl);
          allLeads.push({
            company,
            title,
            description: description.slice(0, 500),
            url: jobUrl,
            source: "startupjobs.cz",
            company_domain: extractDomain(jobUrl),
          });
        }
      });

      await new Promise((r) => setTimeout(r, 2000));
    } catch (err) {
      console.error(`[startupjobs.cz] Error for ${searchUrl}:`, err.message);
    }
  }

  return allLeads;
}
