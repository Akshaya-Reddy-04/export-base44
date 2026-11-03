import React from "react";
import { ChevronDown, Building2 } from "lucide-react";

export default function MessSwitcher({ messes = [], selectedId, onChange, className = "" }) {
  return (
    <div className={`relative ${className}`}>
      <Building2 className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
      <select
        value={selectedId || ""}
        onChange={(e) => onChange?.(e.target.value)}
        aria-label="Select mess"
        className="h-9 w-full appearance-none rounded-full border border-white/10 bg-white/[0.04] pl-8 pr-8 text-xs font-medium text-white outline-none transition-colors hover:border-white/20 focus:border-neon/50"
      >
        {messes.length === 0 && <option value="">No mess available</option>}
        {messes.map((m) => (
          <option key={m.id} value={m.id} className="bg-[#0b1220] text-white">
            {m.name}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}