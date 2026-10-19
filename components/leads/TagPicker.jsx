"use client";

import { useState, useRef, useEffect } from "react";
import { Check, Plus, Loader2 } from "lucide-react";

export function TagChip({ tag, size = "sm" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium whitespace-nowrap ${
        size === "xs" ? "text-[10px] px-1.5 py-0" : "text-xs px-2 py-0.5"
      }`}
      style={{ backgroundColor: `${tag.color}1a`, borderColor: `${tag.color}55`, color: tag.color }}
    >
      {tag.name}
    </span>
  );
}

// Zobrazí vybrané štítky + tlačítko, které otevře seznam pro přidání/odebrání
export default function TagPicker({ options, selectedIds, onToggle, label, footer, size = "sm" }) {
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selected = options.filter((o) => selectedIds?.includes(o.id));

  async function toggle(option) {
    setBusyId(option.id);
    try {
      await onToggle(option.id, !selectedIds?.includes(option.id));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="relative inline-flex items-center gap-1 flex-wrap" ref={ref}>
      {selected.map((tag) => (
        <button key={tag.id} type="button" onClick={() => setOpen((v) => !v)}>
          <TagChip tag={tag} size={size} />
        </button>
      ))}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title={label}
        className={`inline-flex items-center gap-0.5 rounded-full border border-dashed border-border text-muted-foreground/60 hover:text-muted-foreground hover:border-muted-foreground/50 transition-colors ${
          size === "xs" ? "text-[10px] px-1.5 py-0" : "text-xs px-2 py-0.5"
        }`}
      >
        <Plus className="w-3 h-3" />
        {selected.length === 0 && label}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 min-w-[200px] rounded-lg border border-border bg-popover shadow-md py-1">
          {options.map((option) => {
            const isOn = selectedIds?.includes(option.id);
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => toggle(option)}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted transition-colors text-left"
              >
                <span className="w-3.5 h-3.5 flex items-center justify-center shrink-0">
                  {busyId === option.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : isOn ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : null}
                </span>
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: option.color }} />
                <span className={isOn ? "font-semibold" : ""}>{option.name}</span>
              </button>
            );
          })}
          {footer && <div className="border-t border-border mt-1 pt-1">{footer(() => setOpen(false))}</div>}
        </div>
      )}
    </div>
  );
}
