"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Settings, RefreshCw, Loader2, TrendingUp } from "lucide-react";
import Link from "next/link";
import LeadCard from "./LeadCard";
import Filters from "./Filters";

const PAGE_SIZE = 20;
const DEFAULT_FILTERS = { page: 1, tags: [], hideTags: [], positions: [], hideClosed: true };

export default function Dashboard() {
  const [leads, setLeads] = useState([]);
  const [salespeople, setSalespeople] = useState([]);
  const [companyTags, setCompanyTags] = useState([]);
  const [positionCategories, setPositionCategories] = useState([]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSalespeople = useCallback(async () => {
    const [people, tags, categories] = await Promise.all([
      fetch("/api/salespeople"),
      fetch("/api/company-tags"),
      fetch("/api/position-categories"),
    ]);
    if (people.ok) setSalespeople(await people.json());
    if (tags.ok) setCompanyTags(await tags.json());
    if (categories.ok) setPositionCategories(await categories.json());
  }, []);

  const fetchLeads = useCallback(
    async (showRefreshing = false) => {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);

      const params = new URLSearchParams();
      if (filters.search) params.set("search", filters.search);
      if (filters.status) params.set("status", filters.status);
      if (filters.source) params.set("source", filters.source);
      if (filters.assignee) params.set("assignee", filters.assignee);
      if (filters.regionGroup) params.set("regionGroup", filters.regionGroup);
      if (filters.tags?.length) params.set("tags", filters.tags.join(","));
      if (filters.hideTags?.length) params.set("hideTags", filters.hideTags.join(","));
      if (filters.positions === "none") params.set("positions", "none");
      else if (filters.positions?.length) params.set("positions", filters.positions.join(","));
      if (filters.hideClosed) params.set("hideClosed", "1");
      params.set("page", filters.page || 1);
      params.set("limit", PAGE_SIZE);

      try {
        const res = await fetch(`/api/leads?${params}`);
        if (res.ok) {
          const data = await res.json();
          setLeads(data.leads || []);
          setTotal(data.total || 0);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    fetchSalespeople();
  }, [fetchSalespeople]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  function handleLeadUpdate(updated) {
    setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
  }

  // Štítky a poznámka firmy platí pro všechny její inzeráty
  function updateCompany(company, changes) {
    const key = company.trim().toLowerCase();
    setLeads((prev) => prev.map((l) => (l.company.trim().toLowerCase() === key ? { ...l, ...changes } : l)));
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const newCount = leads.filter((l) => l.status === "new").length;

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-primary" />
            <span className="font-semibold text-lg"><span className="opacity-40">(ant)</span> akvizice</span>
            {newCount > 0 && (
              <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                {newCount} nových
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchLeads(true)}
              disabled={refreshing}
            >
              {refreshing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
            <Link href="/settings">
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="mb-6">
          <Filters
            filters={filters}
            salespeople={salespeople}
            companyTags={companyTags}
            positionCategories={positionCategories}
            defaults={DEFAULT_FILTERS}
            onChange={setFilters}
          />
        </div>

        {/* Stats */}
        <div className="mb-4 text-sm text-muted-foreground">
          {loading ? "Načítám..." : `${total} leadů celkem`}
        </div>

        {/* Lead list */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-lg font-medium">Žádné leady</p>
            <p className="text-sm mt-1">
              Spusťte scraping nebo změňte filtry.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 max-w-4xl">
            <AnimatePresence mode="popLayout">
              {leads.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  salespeople={salespeople}
                  companyTags={companyTags}
                  positionCategories={positionCategories}
                  onUpdate={handleLeadUpdate}
                  onCompanyTagsChange={(company, tagIds, statuses) => {
                    updateCompany(company, { tag_ids: tagIds });
                    // Štítek s varováním mění status a obchodníka na „NE – neoslovovat“ (a zpět)
                    const byId = Object.fromEntries((statuses || []).map((s) => [s.id, s]));
                    setLeads((prev) =>
                      prev.map((l) => {
                        const s = byId[l.id];
                        if (!s) return l;
                        const person = salespeople.find((p) => p.id === s.assignee_id);
                        return {
                          ...l,
                          status: s.status,
                          assignee_id: s.assignee_id,
                          assignee_name: person?.name ?? null,
                          assignee_color: person?.color ?? null,
                          assignee_initials: person?.initials ?? null,
                        };
                      })
                    );
                  }}
                  onCompanyNoteChange={(company, note) => updateCompany(company, { company_note: note })}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={filters.page <= 1}
              onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
            >
              Předchozí
            </Button>
            <span className="text-sm text-muted-foreground">
              {filters.page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={filters.page >= totalPages}
              onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
            >
              Další
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
