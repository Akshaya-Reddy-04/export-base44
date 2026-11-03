import React from "react";
import { freshness, agoLabel } from "@/lib/rush";
import { cn } from "@/lib/utils";
import { Radio } from "lucide-react";

export default function FreshnessPill({ updatedAt, staleMinutes = 15, className }) {
  const state = freshness(updatedAt, staleMinutes);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.14em]",
        state.live
          ? "border-neon/30 bg-neon-soft text-neon"
          : "border-ember/30 bg-ember-soft text-ember",
        className
      )}
      title={`Last staff update: ${agoLabel(updatedAt)}`}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span
          className={cn(
            "absolute inline-flex h-full w-full rounded-full opacity-75",
            state.live ? "animate-ping bg-neon" : "bg-ember"
          )}
        />
        <span className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", state.live ? "bg-neon" : "bg-ember")} />
      </span>
      {state.label}
      <span className="font-mono text-[10px] font-normal normal-case tracking-normal text-muted-foreground">
        {agoLabel(updatedAt)}
      </span>
    </span>
  );
}

export function DemoBadge({ className, label = "DEMO" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-white/15 bg-white/[0.06] px-1.5 py-0.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.16em] text-white/70",
        className
      )}
    >
      <Radio className="h-2.5 w-2.5" />
      {label}
    </span>
  );
}