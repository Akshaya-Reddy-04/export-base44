import React from "react";
import { Clock, ListOrdered, Timer, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { CrowdMeter } from "@/components/rr/CrowdBadge";
import QueueIcons from "@/components/rr/QueueIcons";
import { DemoBadge } from "@/components/rr/FreshnessPill";
import { formatWait, crowdLevel } from "@/lib/rush";

export default function CrowdHero({ mess, queue, occupancy, pct, wait }) {
  const level = crowdLevel(pct);
  return (
    <div className="glass relative overflow-hidden p-5 sm:p-6">
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-25 blur-3xl"
        style={{ background: level.hex }}
      />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-white">{mess?.name || "Select a mess"}</h2>
            {(mess?.is_demo || queue?.is_demo) && <DemoBadge label="DEMO" />}
          </div>
          <p className="mt-1 text-[11.5px] text-muted-foreground">
            {mess?.location_label || "Campus"} · {mess?.hostel_type === "boys" ? "Boys hostel" : mess?.hostel_type === "girls" ? "Girls hostel" : "Co-ed mess"}
          </p>
        </div>
        <Link
          to="/queue"
          className="inline-flex items-center gap-1.5 rounded-full border border-white/12 px-3 py-1.5 text-[11px] font-medium text-white transition-colors hover:border-neon/40 hover:text-neon"
        >
          Queue detail <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="mt-5">
        <CrowdMeter pct={pct} people={occupancy?.people_inside ?? 0} capacity={mess?.capacity ?? 0} />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3.5">
          <div className="flex items-center gap-1.5 label-xs">
            <ListOrdered className="h-3 w-3 text-neon" /> Queue now
          </div>
          <div className="stat-num mt-1.5 text-2xl font-semibold text-white">{queue?.waiting_students ?? 0}</div>
          <div className="text-[10.5px] text-muted-foreground">students waiting</div>
        </div>
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3.5">
          <div className="flex items-center gap-1.5 label-xs">
            <Timer className="h-3 w-3 text-ember" /> Est. wait
          </div>
          <div className="stat-num mt-1.5 text-2xl font-semibold text-ember">{formatWait(wait)}</div>
          <div className="text-[10.5px] text-muted-foreground">{queue?.counters_open ?? 1} counters open</div>
        </div>
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3.5">
          <div className="flex items-center gap-1.5 label-xs">
            <Clock className="h-3 w-3 text-electric" /> Serving
          </div>
          <div className="mt-1.5 text-base font-semibold capitalize text-white">{queue?.status_note || "Active service"}</div>
          <div className="text-[10.5px] text-muted-foreground">
            avg {queue?.avg_serving_seconds ?? 45}s per student
          </div>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="label-xs">People in the queue</span>
          <span className="font-mono text-[10.5px] text-muted-foreground">
            {queue?.waiting_students ?? 0} waiting
          </span>
        </div>
        <QueueIcons count={queue?.waiting_students ?? 0} tone={level.hex} />
      </div>
    </div>
  );
}