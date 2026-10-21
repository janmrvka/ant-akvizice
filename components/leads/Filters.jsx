"use client";

import { Input } from "@/components/ui/input";
import { Search, X, EyeOff } from "lucide-react";

const SOURCES = ["jobs.cz", "prace.cz", "startupjobs.cz"];
const STATUSES = [
  { value: "new", label: "Nový" },
  { value: "contacted", label: "Osloven" },
  { value: "in_progress", label: "Probíhá" },
  { value: "won", label: "Uzavřen" },
  { value: "lost", label: "Zamítnut" },
  { value: "unwanted", label: "NE – neoslovovat" },
];

const REGION_GROUPS = [
  { value: "Západní Čechy", label: "Západní Čechy", color: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200" },
  { value: "Praha", label: "Praha", color: "bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200" },
  { value: "Zbytek ČR", label: "Zbytek ČR", color: "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200" },
];

const chipBase = "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium transition-all";
const chipIdle = "bg-background text-muted-foreground border-border hover:bg-muted";

export default function Filters({ filters, salespeople, companyTags, positionCategories, defaults, onChange }) {
  function set(key, value) {
    onChange({ ...filters, [key]: value, page: 1 });
  }

  function toggleRegion(value) {
    set("regionGroup", filters.regionGroup === value ? undefined : value);
  }

  function reset() {
    onChange(defaults);
  }

  // Štítek firmy: klik cyklí vše → jen tyto firmy → skrýt tyto firmy → vše
  function cycleTag(id) {
    const tags = filters.tags || [];
    const hideTags = filters.hideTags || [];
    if (tags.includes(id)) {
      onChange({ ...filters, tags: tags.filter((t) => t !== id), hideTags: [...hideTags, id], page: 1 });
    } else if (hideTags.includes(id)) {
      onChange({ ...filters, hideTags: hideTags.filter((t) => t !== id), page: 1 });
    } else {
      onChange({ ...filters, tags: [...tags, id], page: 1 });
    }
  }

  function togglePosition(id) {
    const current = Array.isArray(filters.positions) ? filters.positions : [];
    set("positions", current.includes(id) ? current.filter((p) => p !== id) : [...current, id]);
  }

  const positionsActive = filters.positions === "none" || filters.positions?.length > 0;
  const hasFilters =
    filters.search || filters.status || filters.source || filters.assignee || filters.regionGroup ||
    filters.tags?.length || filters.hideTags?.length || positionsActive || !filters.hideClosed;

  return (
    <div className="space-y-3">
      {/* Štítky firem */}
      {companyTags?.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground font-medium">Firmy:</span>
          {companyTags.map((tag) => {
            const only = filters.tags?.includes(tag.id);
            const hidden = filters.hideTags?.includes(tag.id);
            return (
              <button
                key={tag.id}
                onClick={() => cycleTag(tag.id)}
                title="Klik: jen tyto firmy → skrýt tyto firmy → vše"
                className={`${chipBase} ${only || hidden ? "" : chipIdle} ${hidden ? "line-through" : ""}`}
                style={
                  only
                    ? { backgroundColor: `${tag.color}22`, borderColor: tag.color, color: tag.color }
                    : hidden
                      ? { borderColor: `${tag.color}66`, color: `${tag.color}aa` }
                      : undefined
                }
              >
                {hidden ? (
                  <EyeOff className="w-3 h-3" />
                ) : (
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                )}
                {hidden ? `Skrýt: ${tag.name}` : tag.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Kategorie pozic */}
      {positionCategories?.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground font-medium">Pozice:</span>
          <button
            onClick={() => set("positions", [])}
            className={`${chipBase} ${
              !positionsActive ? "bg-foreground text-background border-foreground" : chipIdle
            }`}
          >
            Všechny
          </button>
          {positionCategories.map((cat) => {
            const active = Array.isArray(filters.positions) && filters.positions.includes(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => togglePosition(cat.id)}
                className={`${chipBase} ${active ? "" : chipIdle}`}
                style={active ? { backgroundColor: `${cat.color}22`, borderColor: cat.color, color: cat.color } : undefined}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                {cat.name}
              </button>
            );
          })}
          <button
            onClick={() => set("positions", filters.positions === "none" ? [] : "none")}
            className={`${chipBase} ${
              filters.positions === "none" ? "bg-foreground text-background border-foreground" : chipIdle
            }`}
          >
            Nezařazené
          </button>
        </div>
      )}

      {/* Region tlačítka */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground font-medium">Kraj:</span>
        <button
          onClick={() => set("regionGroup", undefined)}
          className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
            !filters.regionGroup
              ? "bg-foreground text-background border-foreground"
              : "bg-background text-muted-foreground border-border hover:bg-muted"
          }`}
        >
          Všechny kraje
        </button>
        {REGION_GROUPS.map((r) => (
          <button
            key={r.value}
            onClick={() => toggleRegion(r.value)}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
              filters.regionGroup === r.value
                ? r.color.replace("hover:", "") + " ring-2 ring-offset-1 ring-current"
                : r.color
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Ostatní filtry */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Hledat firmu..."
            value={filters.search || ""}
            onChange={(e) => set("search", e.target.value || undefined)}
            className="pl-8 w-52"
          />
        </div>

        <select
          value={filters.status || ""}
          onChange={(e) => set("status", e.target.value || undefined)}
          className="text-sm border border-border rounded-md px-3 py-2 bg-background text-foreground"
        >
          <option value="">Všechny stavy</option>
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        <select
          value={filters.source || ""}
          onChange={(e) => set("source", e.target.value || undefined)}
          className="text-sm border border-border rounded-md px-3 py-2 bg-background text-foreground"
        >
          <option value="">Všechny zdroje</option>
          {SOURCES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {salespeople?.length > 0 && (
          <select
            value={filters.assignee || ""}
            onChange={(e) => set("assignee", e.target.value || undefined)}
            className="text-sm border border-border rounded-md px-3 py-2 bg-background text-foreground"
          >
            <option value="">Všichni obchodníci</option>
            {salespeople.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}

        <button
          onClick={() => set("hideClosed", !filters.hideClosed)}
          title="Skryje nové leady, jejichž inzerát už na portálu není. Oslovené a rozjednané zůstávají."
          className={`${chipBase} ${filters.hideClosed ? "bg-foreground text-background border-foreground" : chipIdle}`}
        >
          Jen aktivní inzeráty
        </button>

        {hasFilters && (
          <button
            onClick={reset}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
