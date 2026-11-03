import React from "react";
import { ScanLine, Activity, Utensils } from "lucide-react";

const STEPS = [
  {
    icon: ScanLine,
    step: "01",
    title: "Check the radar",
    body: "Open Rush Radar, pick your mess and read the live queue, seats and crowd level — updated by mess staff.",
  },
  {
    icon: Activity,
    step: "02",
    title: "Plan your window",
    body: "Use predictions from historical snapshots to choose a quieter slot, or wait for a low-crowd alert.",
  },
  {
    icon: Utensils,
    step: "03",
    title: "Scan in, eat well",
    body: "Show your QR pass at the gate, check what is still on the counter, then rate the dish and tell the mess team.",
  },
];

export default function HowItWorks() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {STEPS.map((s, i) => (
        <div key={s.step} className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
          <span className="pointer-events-none absolute -right-4 -top-6 font-display text-[86px] font-bold leading-none text-white/[0.04]">
            {s.step}
          </span>
          <s.icon className="h-5 w-5 text-neon" strokeWidth={1.7} />
          <h3 className="mt-4 text-base font-semibold text-white">{s.title}</h3>
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{s.body}</p>
          {i < STEPS.length - 1 && (
            <span className="absolute right-5 top-1/2 hidden h-px w-8 bg-gradient-to-r from-white/20 to-transparent md:block" />
          )}
        </div>
      ))}
    </div>
  );
}