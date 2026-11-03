import React from "react";
import { cn } from "@/lib/utils";

const TONES = {
  neon: "text-neon",
  electric: "text-electric",
  ember: "text-ember",
  danger: "text-danger",
  default: "text-white",
};

export default function StatTile({
  label,
  value,
  suffix,
  hint,
  icon: Icon,
  tone = "default",
  accent,
  className,
}) {
  return (
    <div className={cn("glass glass-hover relative overflow-hidden p-4 sm:p-5", className)}>
      {accent && (
        <span
          className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full opacity-40 blur-2xl"
          style={{ background: accent }}
        />
      )}
      <div className="flex items-start justify-between gap-3">
        <span className="label-xs">{label}</span>
        {Icon && (
          <span className={cn("grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/[0.04]", TONES[tone])}>
            <Icon className="h-4 w-4" strokeWidth={1.8} />
          </span>
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className={cn("stat-num text-[26px] font-semibold leading-none sm:text-[30px]", TONES[tone])}>
          {value}
        </span>
        {suffix && <span className="text-xs font-medium text-muted-foreground">{suffix}</span>}
      </div>
      {hint && <p className="mt-2 text-[11.5px] leading-snug text-muted-foreground">{hint}</p>}
    </div>
  );
}