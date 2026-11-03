import React from "react";
import { crowdLevel } from "@/lib/rush";

// Animated circular occupancy indicator.
export default function OccupancyRing({
  value = 0,
  size = 220,
  stroke = 12,
  label = "Occupancy",
  centerValue,
  centerLabel,
  sublabel,
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const level = crowdLevel(pct);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct / 100);

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <div
        className="absolute inset-4 rounded-full opacity-30 blur-2xl transition-colors duration-700"
        style={{ background: `radial-gradient(circle, ${level.hex}55 0%, transparent 70%)` }}
      />
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={level.hex}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 900ms cubic-bezier(0.22,1,0.36,1), stroke 500ms ease",
            filter: `drop-shadow(0 0 10px ${level.hex}80)`,
          }}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius - stroke * 1.35}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={1}
          strokeDasharray="2 6"
        />
      </svg>
      <div className="absolute inset-0 grid place-content-center text-center">
        <div className="stat-num text-4xl font-semibold text-white" style={{ textShadow: `0 0 30px ${level.hex}55` }}>
          {centerValue ?? `${pct}%`}
        </div>
        <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {centerLabel ?? label}
        </div>
        {sublabel && <div className="mt-2 text-xs" style={{ color: level.hex }}>{sublabel}</div>}
      </div>
    </div>
  );
}