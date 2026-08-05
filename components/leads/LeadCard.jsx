"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ExternalLink,
  Sparkles,
  Mail,
  Link2,
  Zap,
  Clock,
  MapPin,
  Loader2,
  ChevronDown,
  ChevronUp,
  Globe,
  Phone,
  User,
  Building2,
  FileText,
} from "lucide-react";
import AssigneeSelector from "./AssigneeSelector";

const STATUS_LABELS = {
  new: "Nový",
  contacted: "Osloven",
  in_progress: "Probíhá",
  won: "Uzavřen",
  lost: "Zamítnut",
};

const STATUS_COLORS = {
  new: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  contacted: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  in_progress: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  won: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  lost: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500",
};

const SOURCE_COLORS = {
  "jobs.cz": "bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400",
  "prace.cz": "bg-teal-50 text-teal-600 border-teal-200 dark:bg-teal-900/20 dark:text-teal-400",
  "startupjobs.cz": "bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400",
};

function ScoreBadge({ score }) {
  if (score == null) return null;
  const color =
    score >= 80 ? "bg-emerald-500" :
    score >= 60 ? "bg-yellow-500" :
    score >= 40 ? "bg-orange-400" :
    "bg-gray-400";
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold text-white tabular-nums ${color}`}>
          <Sparkles className="w-2.5 h-2.5" />
          {score}
        </span>
      </TooltipTrigger>
      <TooltipContent>Shoda s ANT portfoliem (0–100)</TooltipContent>
    </Tooltip>
  );
}

function DaysAgo({ date }) {
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  if (days === 0) return <span className="text-xs text-emerald-600 font-medium">dnes</span>;
  if (days === 1) return <span className="text-xs text-muted-foreground">včera</span>;
  if (days <= 7) return <span className="text-xs text-muted-foreground">před {days}d</span>;
  return <span className="text-xs text-muted-foreground">{new Date(date).toLocaleDateString("cs-CZ", { day: "numeric", month: "short" })}</span>;
}

function ContactCard({ contact }) {
  return (
    <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <div>
          {contact.name && (
            <p className="font-medium text-sm">{contact.name}</p>
          )}
          {contact.role && (
            <p className="text-xs text-muted-foreground">{contact.role}</p>
          )}
        </div>
        {contact.linkedin && (
          <a href={contact.linkedin} target="_blank" rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700 shrink-0">
            <Link2 className="w-4 h-4" />
          </a>
        )}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {contact.email && (
          <a href={`mailto:${contact.email}`}
            className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
            <Mail className="w-3 h-3" />
            {contact.email}
          </a>
        )}
        {contact.phone && (
          <a href={`tel:${contact.phone}`}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <Phone className="w-3 h-3" />
            {contact.phone}
          </a>
        )}
      </div>
      {contact.source && (
        <p className="text-xs text-muted-foreground/70">Zdroj: {contact.source}</p>
      )}
    </div>
  );
}

export default function LeadCard({ lead, salespeople, onUpdate }) {
  const [enriching, setEnriching] = useState(false);
  const [marking, setMarking] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [localLead, setLocalLead] = useState(lead);

  async function handleEnrich() {
    setEnriching(true);
    try {
      const res = await fetch(`/api/enrich/${localLead.id}`, { method: "POST" });
      if (res.ok) {
        const updated = await res.json();
        setLocalLead(updated);
        onUpdate?.(updated);
        setExpanded(true);
      }
    } finally {
      setEnriching(false);
    }
  }

  async function handleStatusChange(status) {
    const res = await fetch(`/api/leads/${localLead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      const merged = { ...localLead, ...updated };
      setLocalLead(merged);
      onUpdate?.(merged);
    }
  }

  async function handleAssigneeChange(assignee_id) {
    const res = await fetch(`/api/leads/${localLead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignee_id }),
    });
    if (res.ok) {
      const updated = await res.json();
      // PATCH nevrací JOIN na salespeople — doplnit ručně z props
      const assignee = salespeople?.find((p) => p.id === assignee_id);
      const merged = {
        ...localLead,
        ...updated,
        assignee_id: assignee_id ?? null,
        assignee_name: assignee?.name ?? null,
        assignee_color: assignee?.color ?? null,
        assignee_initials: assignee?.initials ?? null,
      };
      setLocalLead(merged);
      onUpdate?.(merged);
    }
  }

  async function handleToggleCompetitor() {
    setMarking(true);
    try {
      const newVal = !localLead.is_competitor;
      const res = await fetch("/api/competitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company: localLead.company, is_competitor: newVal }),
      });
      if (res.ok) {
        setLocalLead((prev) => ({ ...prev, is_competitor: newVal }));
        onUpdate?.({ ...localLead, is_competitor: newVal });
      }
    } finally {
      setMarking(false);
    }
  }

  const isEnriched = !!localLead.enriched_at;
  const isOld = Math.floor((Date.now() - new Date(localLead.found_at).getTime()) / 86400000) > 30;

  // Kontakty — parsovat z JSON nebo prázdné pole
  const contacts = (() => {
    if (!localLead.contacts) return [];
    if (Array.isArray(localLead.contacts)) return localLead.contacts;
    try { return JSON.parse(localLead.contacts); } catch { return []; }
  })();
  const realContacts = contacts.filter((c) => !c.is_general);
  const generalContacts = contacts.filter((c) => c.is_general);
  const hasContacts = contacts.length > 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className={`bg-card border rounded-xl transition-shadow hover:shadow-md ${
        isOld ? "border-border opacity-75" : "border-border"
      } ${localLead.status === "lost" ? "opacity-60" : ""}`}
    >
      {/* ── Základní karta ── */}
      <div className="p-5">
        <div className="flex items-start gap-5">

          {/* Score + datum */}
          <div className="shrink-0 flex flex-col items-center gap-1.5 pt-0.5">
            <ScoreBadge score={localLead.match_score} />
            <DaysAgo date={localLead.found_at} />
          </div>

          {/* Hlavní obsah */}
          <div className="flex-1 min-w-0">

            {/* Řádek 1: Firma + badges + externí odkaz */}
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-base">{localLead.company}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${SOURCE_COLORS[localLead.source] || "bg-gray-50 text-gray-600 border-gray-200"}`}>
                  {localLead.source}
                </span>
              </div>
              <a href={localLead.url} target="_blank" rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors shrink-0 mt-0.5">
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {/* Řádek 2: Pozice + lokace */}
            <p className="text-sm text-muted-foreground mt-0.5">{localLead.title}</p>
            {localLead.city && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <MapPin className="w-3 h-3" />
                {localLead.city}
              </p>
            )}

            {/* Řádek 3: IČO + web + kontakt indikátor */}
            {isEnriched && (
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {localLead.ico && (
                  <a
                    href={`https://ares.gov.cz/ekonomicke-subjekty?ico=${localLead.ico}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <FileText className="w-3 h-3" />
                    IČO {localLead.ico}
                  </a>
                )}
                {localLead.company_web && (
                  <a
                    href={localLead.company_web}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Globe className="w-3 h-3" />
                    {localLead.company_web.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                  </a>
                )}
                {hasContacts && (
                  <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                    <User className="w-3 h-3" />
                    {realContacts.length > 0
                      ? `${realContacts.length} kontakt${realContacts.length > 1 ? "y" : ""} nalezen${realContacts.length > 1 ? "y" : ""}`
                      : "Obecný kontakt"}
                  </span>
                )}
              </div>
            )}

            {/* Řádek 4: Signál + summary */}
            {isEnriched && (localLead.signal || localLead.company_summary) && (
              <div className="mt-2 space-y-1">
                {localLead.company_summary && (
                  <p className="text-sm text-muted-foreground">{localLead.company_summary}</p>
                )}
                {localLead.signal && (
                  <div className="flex items-start gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-yellow-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">{localLead.signal}</span>
                  </div>
                )}
              </div>
            )}

            {!isEnriched && localLead.description && (
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{localLead.description}</p>
            )}

            {/* Řádek 5: Akce */}
            <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
              <AssigneeSelector
                salespeople={salespeople}
                currentAssigneeId={localLead.assignee_id}
                onChange={handleAssigneeChange}
              />
              <div className="flex items-center gap-2">
                {!isEnriched && (
                  <Button variant="outline" size="sm" onClick={handleEnrich} disabled={enriching} className="text-xs h-7">
                    {enriching ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    {enriching ? "Analyzuji..." : "AI analýza"}
                  </Button>
                )}
                <Tooltip>
                  <TooltipTrigger>
                    <span
                      role="button"
                      onClick={handleToggleCompetitor}
                      className={`inline-flex items-center gap-1 h-7 px-2 rounded-md border text-xs font-medium transition-colors cursor-pointer ${
                        localLead.is_competitor
                          ? "bg-red-100 text-red-700 border-red-300 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"
                          : "border-dashed border-border text-muted-foreground/40 hover:text-muted-foreground hover:border-border"
                      }`}
                    >
                      {marking
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : localLead.is_competitor
                          ? "Konkurence"
                          : "Konkurence?"}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    {localLead.is_competitor ? "Klikni pro odznačení" : "Klikni pro označení jako konkurence"}
                  </TooltipContent>
                </Tooltip>
                <select
                  value={localLead.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="text-xs border border-border rounded-md px-2 py-1.5 bg-background text-foreground h-7"
                >
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                {isEnriched && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpanded((v) => !v)}
                    className="text-xs h-7 gap-1"
                  >
                    {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    {expanded ? "Skrýt" : "Detail"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Rozbalovací detail ── */}
      <AnimatePresence initial={false}>
        {expanded && isEnriched && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border px-5 py-4 space-y-4">

              {/* Proč teď */}
              {localLead.why_now && (
                <div className="flex items-start gap-2">
                  <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-0.5">Proč teď</p>
                    <p className="text-sm">{localLead.why_now}</p>
                  </div>
                </div>
              )}

              {/* LinkedIn firmy */}
              {localLead.linkedin_url && (
                <div className="flex items-center gap-2">
                  <Link2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <a href={localLead.linkedin_url} target="_blank" rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline">
                    LinkedIn profil firmy
                  </a>
                </div>
              )}

              {/* Kontaktní osoby */}
              {realContacts.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    Kontaktní osoby
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {realContacts.map((c, i) => <ContactCard key={i} contact={c} />)}
                  </div>
                </div>
              )}

              {/* Obecný kontakt (fallback) */}
              {realContacts.length === 0 && generalContacts.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    Obecný kontakt firmy
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {generalContacts.map((c, i) => <ContactCard key={i} contact={c} />)}
                  </div>
                </div>
              )}

              {/* Žádné kontakty */}
              {contacts.length === 0 && (
                <p className="text-sm text-muted-foreground italic">Kontaktní osoby nebyly nalezeny.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
