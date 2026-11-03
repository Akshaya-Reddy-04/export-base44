import React from "react";
import { Activity, ArrowUpRight, Clock, ListOrdered, Users, UtensilsCrossed } from "lucide-react";
import OccupancyRing from "@/components/rr/OccupancyRing";
import CrowdBadge from "@/components/rr/CrowdBadge";
import StockBar from "@/components/rr/StockBar";
import { DemoBadge } from "@/components/rr/FreshnessPill";
import { formatWait } from "@/lib/rush";

// The hero's futuristic dashboard preview, driven by the same live records the app uses.
export default function HeroPreview({ row, menu = [], loading }) {
  const mess = row?.mess;
  const pct = row?.pct || 0;
  const queue = row?.queue;
  const occupancy = row?.occupancy;
  const featured = menu.slice(0, 3);

  return (
    <div className="relative">
      <div className="pointer-events-none absolute -inset-6 rounded-[36px] bg-gradient-to-br from-neon/15 via-electric/10 to-transparent blur-2xl" />
      <div className="glass relative overflow-hidden rounded-[26px] p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="label-xs">Live mess monitor</div>
            <div className="mt-1 flex items-center gap-2">
              <h3 className="text-base font-semibold text-white">{mess?.name || "Main College Mess"}</h3>
              <DemoBadge label="DEMO DATA" />
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              {mess?.location_label || "Campus block A"} · open {mess?.open_time || "07:00"}–{mess?.close_time || "22:00"}
            </div>
          </div>
          <CrowdBadge pct={pct} />
        </div>

        <div className="mt-5 grid grid-cols-[auto_1fr] items-center gap-5">
          <OccupancyRing value={pct} size={148} stroke={10} centerValue={`${pct}%`} centerLabel="Occupancy" />
          <div className="grid grid-cols-2 gap-2.5">
            <MiniStat icon={ListOrdered} label="In queue" value={loading ? "—" : queue?.waiting_students ?? 0} tone="#22ff9a" />
            <MiniStat icon={Users} label="Inside" value={loading ? "—" : occupancy?.people_inside ?? 0} tone="#2ea8ff" />
            <MiniStat icon={Clock} label="Wait" value={loading ? "—" : formatWait(row?.wait || 0)} tone="#ff8a3d" />
            <MiniStat icon={Activity} label="Seats free" value={loading ? "—" : Math.max(0, (mess?.capacity || 0) - (occupancy?.people_inside || 0))} tone="#a78bfa" />
          </div>
        </div>

        <div className="mt-5 space-y-2.5 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-white">
              <UtensilsCrossed className="h-3.5 w-3.5 text-neon" /> Serving now
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">updated live</span>
          </div>
          {featured.length === 0 && <p className="text-[11px] text-muted-foreground">Menu publishing shortly.</p>}
          {featured.map((item) => (
            <div key={item.id}>
              <div className="mb-1 flex items-center justify-between text-[11px]">
                <span className="truncate text-slate-200">{item.name}</span>
                <span className="ml-2 shrink-0 font-mono text-[10px] text-muted-foreground">
                  {item.remaining_quantity} left
                </span>
              </div>
              <StockBar item={item} showNumbers={false} />
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl bg-neon/[0.06] px-3 py-2 text-[11px] text-neon">
          <span>Best time to visit today</span>
          <span className="font-mono font-semibold">3:40 PM</span>
        </div>
      </div>

      <div className="glass absolute -bottom-5 -left-3 hidden items-center gap-2 px-3 py-2 sm:flex animate-float">
        <span className="h-1.5 w-1.5 rounded-full bg-neon shadow-[0_0_10px_#22ff9a]" />
        <span className="text-[10.5px] font-medium text-white">Queue dropped to 4</span>
        <ArrowUpRight className="h-3 w-3 text-neon" />
      </div>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value, tone }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-2.5 py-2">
      <div className="flex items-center gap-1.5 text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground">
        <Icon className="h-3 w-3" style={{ color: tone }} /> {label}
      </div>
      <div className="stat-num mt-1 text-lg font-semibold" style={{ color: tone }}>{value}</div>
    </div>
  );
}