import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle, ListOrdered, Timer, DoorOpen, Gauge, RefreshCw, Users, ArrowRight,
} from "lucide-react";
import { PageHeading } from "@/components/rr/GlassCard";
import StatTile from "@/components/rr/StatTile";
import TrendChart from "@/components/rr/TrendChart";
import QueueIcons from "@/components/rr/QueueIcons";
import FreshnessPill from "@/components/rr/FreshnessPill";
import { LoadingBlock, EmptyState } from "@/components/rr/EmptyState";
import { useMess } from "@/lib/MessContext";
import { useHistory } from "@/hooks/useMessContent";
import { crowdLevel, formatWait, freshness, waitMinutes } from "@/lib/rush";

export default function LiveQueue() {
  const mess = useMess();
  const { history } = useHistory(mess.selectedId);
  const { queue, occupancy, selectedMess, settings, liveLoading: loading } = mess;

  const wait = waitMinutes(queue?.waiting_students || 0, queue?.counters_open || 1, queue?.avg_serving_seconds || 45);
  const state = freshness(mess.updatedAt, settings.stale_minutes);
  const pct = selectedMess?.capacity
    ? Math.round(((occupancy?.people_inside || 0) / selectedMess.capacity) * 100)
    : 0;
  const level = crowdLevel(pct);

  const trend = useMemo(
    () =>
      [...history]
        .filter((h) => h.queue_length !== undefined && h.queue_length !== null)
        .sort((a, b) => new Date(a.recorded_at || a.created_date) - new Date(b.recorded_at || b.created_date))
        .slice(-24)
        .map((h) => ({
          label: new Date(h.recorded_at || h.created_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          value: h.queue_length,
        })),
    [history]
  );

  if (loading && !queue) return <LoadingBlock label="Reading the live queue…" />;

  return (
    <div className="space-y-6">
      <PageHeading
        title="Live queue tracking"
        description={`Real-time queue data for ${selectedMess?.name || "your mess"} — recorded by the serving staff.`}
      >
        <FreshnessPill updatedAt={mess.updatedAt} staleMinutes={settings.stale_minutes} />
        <button
          type="button"
          onClick={mess.refreshLive}
          className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.03] px-3.5 py-2 text-[11.5px] font-medium text-white hover:border-neon/40 hover:text-neon"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${mess.refreshing ? "animate-spin" : ""}`} /> Refresh
        </button>
      </PageHeading>

      {state.stale && (
        <div className="flex items-start gap-3 rounded-2xl border border-ember/30 bg-ember/[0.08] px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-ember" />
          <div>
            <div className="text-[12.5px] font-semibold text-ember">This data has not been updated recently</div>
            <p className="mt-0.5 text-[11.5px] text-ember/80">
              The last staff update was {state.minutes === null ? "unknown" : `${state.minutes} minutes ago`}. Queue numbers may
              have changed — treat this as a rough guide.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
        <div className="glass relative overflow-hidden p-6">
          <div
            className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full opacity-20 blur-3xl"
            style={{ background: level.hex }}
          />
          <div className="label-xs">Students waiting in line</div>
          <div className="mt-2 flex items-end gap-3">
            <span className="stat-num text-[64px] font-semibold leading-none text-white">
              {queue?.waiting_students ?? 0}
            </span>
            <span className="mb-2 text-sm text-muted-foreground">in the food queue</span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <MiniStat label="Est. wait" value={formatWait(wait)} tone="text-ember" icon={Timer} />
            <MiniStat label="Counters" value={`${queue?.counters_open ?? 0}/${queue?.total_counters ?? 0}`} tone="text-electric" icon={DoorOpen} />
            <MiniStat label="Serving time" value={`${queue?.avg_serving_seconds ?? 45}s`} tone="text-white" icon={Gauge} />
            <MiniStat label="Inside mess" value={occupancy?.people_inside ?? 0} tone="text-neon" icon={Users} />
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="label-xs">Queue snapshot</span>
              <span className="font-mono text-[10px] text-muted-foreground">{queue?.status_note || "live service"}</span>
            </div>
            <QueueIcons count={queue?.waiting_students ?? 0} max={56} tone={level.hex} />
          </div>

          <div className="mt-6 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-3">
            <div className="flex items-center gap-2 text-[11.5px] text-slate-300">
              <Timer className="h-3.5 w-3.5 text-neon" />
              Estimated waiting time:
              <span className="font-semibold text-neon">{formatWait(wait)}</span>
            </div>
            <p className="mt-1 text-[10.5px] text-muted-foreground">
              Estimate = {queue?.waiting_students ?? 0} students ÷ {queue?.counters_open ?? 1} counters ×{" "}
              {queue?.avg_serving_seconds ?? 45}s average serving time. Actual times vary.
            </p>
          </div>
        </div>

        <div className="glass p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="label-xs">Queue trend</div>
              <h3 className="mt-1.5 text-base font-semibold text-white">Last {trend.length || 0} snapshots</h3>
            </div>
            <ListOrdered className="h-4 w-4 text-neon" />
          </div>
          {trend.length > 1 ? (
            <TrendChart data={trend} color="#22ff9a" unit="waiting" height={230} />
          ) : (
            <EmptyState
              className="mt-5"
              title="Not enough history yet"
              description="The trend appears once staff record a few queue updates."
            />
          )}
          <p className="mt-2 text-[10px] text-muted-foreground">
            Each point is a staff-recorded queue count, not a continuous sensor feed.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Queue length" value={queue?.waiting_students ?? 0} icon={ListOrdered} tone="neon" hint="students waiting" />
        <StatTile label="Avg serving time" value={`${queue?.avg_serving_seconds ?? 45}s`} icon={Gauge} hint="per student, measured by staff" />
        <StatTile label="Active counters" value={queue?.counters_open ?? 0} icon={DoorOpen} tone="electric" hint={`of ${queue?.total_counters ?? 0} total`} />
        <StatTile label="Estimated wait" value={wait} suffix="min" icon={Timer} tone="ember" hint="estimate only" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
        <p className="text-[11px] text-muted-foreground">
          Queue numbers are entered by mess staff. Students cannot change official counts.
        </p>
        <Link to="/occupancy" className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-neon hover:underline">
          Check seats instead <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

function MiniStat({ label, value, tone, icon: Icon }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-2.5 py-2">
      <div className="flex items-center gap-1 label-xs">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className={`stat-num mt-1 text-base font-semibold ${tone}`}>{value}</div>
    </div>
  );
}