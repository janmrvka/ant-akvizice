import { scrapeJobsCz } from "./jobs-cz.js";
import { scrapePraceCz } from "./prace-cz.js";
import { scrapeStartupjobs } from "./startupjobs-cz.js";

export async function scrapeAll() {
  const results = await Promise.allSettled([
    scrapeJobsCz(),
    scrapePraceCz(),
    scrapeStartupjobs(),
  ]);

  const leads = [];
  const errors = [];

  for (const result of results) {
    if (result.status === "fulfilled") {
      leads.push(...result.value);
    } else {
      errors.push(result.reason?.message || String(result.reason));
    }
  }

  return { leads, errors };
}
