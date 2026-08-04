"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ExternalLink,
  Sparkles,
  User,
  Mail,
  Link2,
  Zap,
  Clock,
  Building2,
  Loader2,
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

export default function LeadCard({ lead, salespeople, onUpdate }) {
  const [enriching, setEnriching] = useState(false);
  const [localLead, setLocalLead] = useState(lead);

  async function handleEnrich() {
    setEnriching(true);
    try {
      const res = await fetch(`/api/enrich/${localLead.id}`, { method: "POST" });
      if (res.ok) {
        const updated = await res.json();
        setLocalLead(updated);
        onUpdate?.(updated);
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
      setLocalLead(updated);
      onUpdate?.(updated);
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
      setLocalLead(updated);
      onUpdate?.(updated);
    }
  }

  const isEnriched = !!localLead.enriched_at;
  const isOld = Math.floor((Date.now() - new Date(localLead.found_at).getTime()) / 86400000) > 30;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className={`bg-card border rounded-xl p-5 transition-shadow hover:shadow-md ${
        isOld ? "border-border opacity-75" : "border-border"
      } ${localLead.status === "lost" ? "opacity-60" : ""}`}
    >
      <div className="flex items-start gap-5">

        {/* Score column */}
        <div className="shrink-0 flex flex-col items-center gap-1.5 pt-0.5">
          <ScoreBadge score={localLead.match_score} />
          <DaysAgo date={localLead.found_at} />
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">

          {/* Row 1: Company + title + badges */}
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-base">{localLead.company}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${SOURCE_COLORS[localLead.source] || "bg-gray-50 text-gray-600 border-gray-200"}`}>
                  {localLead.source}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{localLead.title}</p>
            </div>
            <a
              href={localLead.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0 mt-0.5"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          {/* Row 2: AI signals */}
          {isEnriched ? (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
              {localLead.signal && (
                <div className="flex items-start gap-2">
                  <Zap className="w-3.5 h-3.5 text-yellow-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground">{localLead.signal}</span>
                </div>
              )}
              {localLead.why_now && (
                <div className="flex items-start gap-2">
                  <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground">{localLead.why_now}</span>
                </div>
              )}
              {localLead.decision_maker && (
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="text-sm text-muted-foreground">{localLead.decision_maker}</span>
                </div>
              )}
              {localLead.company_info && (
                <div className="flex items-start gap-2">
                  <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground">{localLead.company_info}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{localLead.description}</p>
          )}

          {/* Row 3: Contact + LinkedIn (inline, only if enriched) */}
          {isEnriched && (localLead.contact || localLead.linkedin_url) && (
            <div className="mt-2 flex items-center gap-4">
              {localLead.contact && (
                <a href={`mailto:${localLead.contact}`} className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
                  <Mail className="w-3.5 h-3.5" />
                  {localLead.contact}
                </a>
              )}
              {localLead.linkedin_url && (
                <a href={localLead.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
                  <Link2 className="w-3.5 h-3.5" />
                  LinkedIn
                </a>
              )}
            </div>
          )}

          {/* Row 4: Actions */}
          <div className="mt-3 flex items-center justify-between gap-3">
            <AssigneeSelector
              salespeople={salespeople}
              currentAssigneeId={localLead.assignee_id}
              onChange={handleAssigneeChange}
            />
            <div className="flex items-center gap-2">
              {!isEnriched && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEnrich}
                  disabled={enriching}
                  className="text-xs h-7"
                >
                  {enriching ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  {enriching ? "Analyzuji..." : "AI analýza"}
                </Button>
              )}
              <select
                value={localLead.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="text-xs border border-border rounded-md px-2 py-1.5 bg-background text-foreground h-7"
              >
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
