// Zjistí, jestli je inzerát na portálu ještě aktivní.
// true = aktivní, false = ukončený (404/410 i po přesměrování), null = nevíme (výpadek, blokace…)
export async function isAdOpen(url) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html",
        "Accept-Language": "cs-CZ,cs;q=0.9",
      },
      signal: AbortSignal.timeout(15000),
    });
    await res.body?.cancel();
    if (res.status === 404 || res.status === 410) return false;
    if (res.ok) return true;
    return null;
  } catch {
    return null;
  }
}
