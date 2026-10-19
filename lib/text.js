// Dekóduje běžné HTML entity a odstraní tagy + nadbytečné mezery
export function cleanHtmlText(html) {
  if (!html) return html;
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&zwj;/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(parseInt(n)))
    .replace(/\xa0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Klíč pro párování firmy napříč inzeráty (štítky firem)
export function companyKey(company) {
  return (company || "").trim().toLowerCase();
}

// Malá písmena, bez diakritiky, jen písmena/číslice oddělené mezerou
export function normalizeForMatch(text) {
  return (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
