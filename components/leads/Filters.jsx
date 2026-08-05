"use client";

import { Input } from "@/components/ui/input";
import { Search, X, ShieldOff, Shield, Eye } from "lucide-react";

const SOURCES = ["jobs.cz", "prace.cz", "startupjobs.cz"];
const STATUSES = [
  { value: "new", label: "Nový" },
  { value: "contacted", label: "Osloven" },
  { value: "in_progress", label: "Probíhá" },
  { value: "won", label: "Uzavřen" },
  { value: "lost", label: "Zamítnut" },
];

const REGION_GROUPS = [
  { value: "Plzeňský kraj", label: "Plzeňský kraj", color: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200" },
  { value: "Praha", label: "Praha", color: "bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200" },
  { value: "Zbytek ČR", label: "Zbytek ČR", color: "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200" },
];

const COMPETITOR_MODES = [
  {
    value: "hide",
    label: "Skrýt konkurenci",
    icon: ShieldOff,
    active: "bg-green-100 text-green-700 border-green-300",
    inactive: "bg-background text-muted-foreground border-border hover:bg-muted",
  },
  {
    value: "only",
    label: "Jen konkurence",
    icon: Shield,
    active: "bg-red-100 text-red-700 border-red-300",
    inactive: "bg-background text-muted-foreground border-border hover:bg-muted",
  },
  {
    value: "all",
    label: "Zobrazit vše",
    icon: Eye,
    active: "bg-yellow-100 text-yellow-700 border-yellow-300",
    inactive: "bg-background text-muted-foreground border-border hover:bg-muted",
  },
];

export default function Filters({ filters, salespeople, onChange }) {
  function set(key, value) {
    onChange({ ...filters, [key]: value, page: 1 });
  }

  function toggleRegion(value) {
    set("regionGroup", filters.regionGroup === value ? undefined : value);
  }

  function reset() {
    onChange({ page: 1, competitor: "all" });
  }

  const competitor = filters.competitor || "all";
  const hasFilters = filters.search || filters.status || filters.source || filters.assignee || filters.regionGroup || competitor !== "all";

  return (
    <div className="space-y-3">
      {/* Competitor toggle */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground font-medium">Konkurence:</span>
        {COMPETITOR_MODES.map((m) => {
          const Icon = m.icon;
          const isActive = competitor === m.value;
          return (
            <button
              key={m.value}
              onClick={() => set("competitor", m.value)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                isActive ? m.active : m.inactive
              }`}
            >
              <Icon className="w-3 h-3" />
              {m.label}
            </button>
          );
        })}
      </div>

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
