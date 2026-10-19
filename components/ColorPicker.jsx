"use client";

import { Pipette } from "lucide-react";

export const PRESET_COLORS = [
  "#ef4444", "#f43f5e", "#ec4899", "#d946ef", "#a855f7", "#8b5cf6",
  "#6366f1", "#3b82f6", "#0ea5e9", "#06b6d4", "#14b8a6", "#10b981",
  "#22c55e", "#84cc16", "#eab308", "#f59e0b", "#f97316", "#ea580c",
  "#b91c1c", "#9d174d", "#6d28d9", "#1e40af", "#0f766e", "#166534",
  "#a16207", "#92400e", "#78716c", "#64748b", "#334155", "#111827",
];

// Paleta přednastavených barev + libovolná vlastní barva
export default function ColorPicker({ value, onChange }) {
  const isCustom = value && !PRESET_COLORS.includes(value.toLowerCase());

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {PRESET_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          title={color}
          onClick={() => onChange(color)}
          className={`w-6 h-6 rounded-full transition-transform ${
            value?.toLowerCase() === color ? "scale-125 ring-2 ring-offset-1 ring-foreground" : ""
          }`}
          style={{ backgroundColor: color }}
        />
      ))}
      <label
        title="Vlastní barva"
        className={`relative w-6 h-6 rounded-full flex items-center justify-center cursor-pointer border border-dashed border-muted-foreground/50 overflow-hidden ${
          isCustom ? "scale-125 ring-2 ring-offset-1 ring-foreground border-none" : ""
        }`}
        style={isCustom ? { backgroundColor: value } : undefined}
      >
        {!isCustom && <Pipette className="w-3 h-3 text-muted-foreground" />}
        <input
          type="color"
          value={value || "#6366f1"}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </label>
    </div>
  );
}
