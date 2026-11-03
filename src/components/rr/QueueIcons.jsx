import React from "react";
import { Users } from "lucide-react";

// Visual queue: one little student icon per waiting student (capped for sanity).
export default function QueueIcons({ count = 0, max = 40, tone = "#22ff9a" }) {
  const shown = Math.min(count, max);
  const overflow = Math.max(0, count - max);
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {shown === 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-neon/25 bg-neon-soft px-3 py-2 text-xs text-neon">
            <Users className="h-3.5 w-3.5" /> Queue is empty — walk straight in
          </div>
        )}
        {Array.from({ length: shown }).map((_, i) => (
          <span
            key={i}
            className="grid h-7 w-7 place-items-center rounded-md border transition-transform duration-300 hover:scale-110"
            style={{
              borderColor: `${tone}33`,
              background: `${tone}12`,
              color: tone,
              animation: `fade-up 400ms cubic-bezier(0.22,1,0.36,1) ${Math.min(i * 18, 700)}ms both`,
            }}
            title="Student in queue"
          >
            <Users className="h-3.5 w-3.5" strokeWidth={2} />
          </span>
        ))}
        {overflow > 0 && (
          <span className="grid h-7 min-w-7 place-items-center rounded-md border border-white/10 bg-white/[0.05] px-1.5 font-mono text-[10px] text-muted-foreground">
            +{overflow}
          </span>
        )}
      </div>
    </div>
  );
}