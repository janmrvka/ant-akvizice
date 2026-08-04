"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function AssigneeSelector({ salespeople, currentAssigneeId, onChange }) {
  if (!salespeople?.length) return null;

  return (
    <div className="flex items-center gap-1">
      {salespeople.map((person) => {
        const isActive = person.id === currentAssigneeId;
        return (
          <Tooltip key={person.id}>
            <TooltipTrigger asChild>
              <button
                onClick={() => onChange(isActive ? null : person.id)}
                className={`w-7 h-7 rounded-full text-xs font-bold transition-all ${
                  isActive
                    ? "ring-2 ring-offset-1 ring-foreground scale-110"
                    : "opacity-50 hover:opacity-100"
                }`}
                style={{ backgroundColor: person.color, color: "#fff" }}
              >
                {person.initials}
              </button>
            </TooltipTrigger>
            <TooltipContent>{person.name}</TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
