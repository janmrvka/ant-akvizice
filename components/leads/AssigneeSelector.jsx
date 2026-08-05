"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";

export default function AssigneeSelector({ salespeople, currentAssigneeId, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const people = salespeople?.filter((p) => p.name !== "Nepřiřazeno") || [];
  const current = salespeople?.find((p) => p.id === currentAssigneeId && p.name !== "Nepřiřazeno");

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function select(id) {
    onChange(id);
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full border border-border px-2 py-1 text-xs font-medium transition-colors hover:bg-muted"
      >
        {current ? (
          <>
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
              style={{ backgroundColor: current.color }}
            >
              {current.initials}
            </span>
            <span className="max-w-[80px] truncate">{current.name}</span>
          </>
        ) : (
          <span className="text-muted-foreground">Nepřiřazeno</span>
        )}
        <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 min-w-[160px] rounded-lg border border-border bg-popover shadow-md py-1">
          {current && (
            <button
              onClick={() => select(null)}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Zrušit přiřazení
            </button>
          )}
          {people.map((person) => (
            <button
              key={person.id}
              onClick={() => select(person.id)}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted transition-colors ${
                person.id === currentAssigneeId ? "font-semibold" : ""
              }`}
            >
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                style={{ backgroundColor: person.color }}
              >
                {person.initials}
              </span>
              {person.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
