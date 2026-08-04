"use client";

import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";

const SOURCES = ["jobs.cz", "prace.cz", "startupjobs.cz"];
const STATUSES = [
  { value: "new", label: "Nový" },
  { value: "contacted", label: "Osloven" },
  { value: "in_progress", label: "Probíhá" },
  { value: "won", label: "Uzavřen" },
  { value: "lost", label: "Zamítnut" },
];

export default function Filters({ filters, salespeople, onChange }) {
  function set(key, value) {
    onChange({ ...filters, [key]: value, page: 1 });
  }

  function reset() {
    onChange({ page: 1 });
  }

  const hasFilters =
    filters.search || filters.status || filters.source || filters.assignee;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Hledat firmu..."
          value={filters.search || ""}
          onChange={(e) => set("search", e.target.value)}
          className="pl-8 w-52"
        />
      </div>

      {/* Status */}
      <select
        value={filters.status || ""}
        onChange={(e) => set("status", e.target.value || undefined)}
        className="text-sm border border-border rounded-md px-3 py-2 bg-background text-foreground"
      >
        <option value="">Všechny stavy</option>
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      {/* Source */}
      <select
        value={filters.source || ""}
        onChange={(e) => set("source", e.target.value || undefined)}
        className="text-sm border border-border rounded-md px-3 py-2 bg-background text-foreground"
      >
        <option value="">Všechny zdroje</option>
        {SOURCES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      {/* Assignee */}
      {salespeople?.length > 0 && (
        <select
          value={filters.assignee || ""}
          onChange={(e) => set("assignee", e.target.value || undefined)}
          className="text-sm border border-border rounded-md px-3 py-2 bg-background text-foreground"
        >
          <option value="">Všichni obchodníci</option>
          {salespeople.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      )}

      {/* Reset */}
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
  );
}
