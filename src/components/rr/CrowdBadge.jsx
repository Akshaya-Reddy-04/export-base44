import React from "react";
import { cn } from "@/lib/utils";
import { CROWD_LEVELS, crowdLevel, occupancyPct } from "@/lib/rush";

export default function CrowdBadge({ level, pct, className, showDot = true }) {
  const resolved = level || crowdLevel(pct ?? 0);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]",
        resolved.chip,
        className
      )}
    >
      {showDot && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-70" style={{ background: resolved.hex }} />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: resolved.hex }} />
        </span>
      )}
      {resolved.label}
    </span>
  );
}

// Large four-segment crowd indicator: GREEN → YELLOW → ORANGE → RED.
export function CrowdMeter({ pct = 0, people, capacity, compact = false }) {
  const level = crowdLevel(pct);
  const segments = Object.values(CROWD_LEVELS);
  return (
    <div className="w-full">
      <div className={cn("flex items-end justify-between gap-3", compact ? "mb-2" : "mb-4")}>
        <div>
          <div className="label-xs">Current crowd status</div>
          <div className={cn("mt-1 font-display font-semibold", compact ? "text-lg" : "text-2xl", level.tone)}>
            {level.label}
          </div>
        </div>
        <div className="text-right">
          <div className={cn("stat-num font-semibold", compact ? "text-xl" : "text-3xl", level.tone)}>{pct}%</div>
          <div className="text-[11px] text-muted-foreground">occupancy</div>
        </div>
      </div>

      <div className="relative h-3 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className={cn("h-full rounded-full transition-all duration-700 ease-out", level.bar)}
          style={{ width: `${Math.max(3, pct)}%`, boxShadow: `0 0 22px ${level.hex}66` }}
        />
      </div>

      <div className="mt-3 grid grid-cols-4 gap-1.5">
        {segments.map((seg, i) => {
          const active = seg.key === level.key;
          const bounds = ["<35%", "35–59%", "60–84%", "85%+"];
          return (
            <div
              key={seg.key}
              className={cn(
                "rounded-lg border px-1.5 py-1.5 text-center transition-all duration-500",
                active ? "opacity-100" : "border-white/5 bg-white/[0.015] opacity-45"
              )}
              style={active ? { borderColor: `${seg.hex}55`, background: `${seg.hex}14` } : undefined}
            >
              <div className="mx-auto mb-1 h-1 w-6 rounded-full" style={{ background: seg.hex }} />
              <div className="text-[9.5px] font-semibold uppercase tracking-wide" style={{ color: active ? seg.hex : "#94a3b8" }}>
                {seg.label.split(" ")[0]}
              </div>
              <div className="text-[9px] text-muted-foreground">{bounds[i]}</div>
            </div>
          );
        })}
      </div>

      {!compact && people !== undefined && capacity ? (
        <p className="mt-3 text-xs text-muted-foreground">
          <span className={cn("font-semibold", level.tone)}>{people}</span> people inside ·{" "}
          {Math.max(0, capacity - people)} seats free of {capacity}
        </p>
      ) : null}
    </div>
  );
}

export function CrowdLegendRow({ mess, queue, occupancy }) {
  const pct = occupancyPct(occupancy?.people_inside || 0, mess?.capacity || 1);
  const level = crowdLevel(pct);
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5">
      <div className="min-w-0">
        <div className="truncate text-sm font-medium text-white">{mess?.name}</div>
        <div className="text-[11px] text-muted-foreground">
          {queue?.waiting_students ?? 0} in queue · {occupancy?.people_inside ?? 0} inside
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-semibold tabular-nums" style={{ color: level.hex }}>{pct}%</span>
        <CrowdBadge level={level} showDot={false} className="px-2 py-0.5 text-[10px]" />
      </div>
    </div>
  );
}