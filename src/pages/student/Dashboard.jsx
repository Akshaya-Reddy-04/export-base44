import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Users, ListOrdered, Utensils, Armchair, Building2, DoorOpen, Timer,
  RefreshCw, Sparkles, ArrowRight, Star, Flame,
} from "lucide-react";
import { PageHeading } from "@/components/rr/GlassCard";
import StatTile from "@/components/rr/StatTile";
import OccupancyRing from "@/components/rr/OccupancyRing";
import FreshnessPill, { DemoBadge } from "@/components/rr/FreshnessPill";
import CrowdHero from "@/components/student/CrowdHero";
import QuickInfo from "@/components/student/QuickInfo";
import NoticeBoard from "@/components/student/NoticeBoard";
import { LoadingBlock } from "@/components/rr/EmptyState";
import { useMess } from "@/lib/MessContext";
import { useMenu, useNotices, useHistory } from "@/hooks/useMessContent";
import {
  crowdLevel, currentMeal, MEAL_LABEL, occupancyPct, predictCrowd, waitMinutes,
} from "@/lib/rush";

export default function Dashboard() {
  const mess = useMess();
  const { items } = useMenu(mess.selectedId);
  const { notices } = useNotices(mess.selectedId);
  const { history } = useHistory(mess.selectedId);

  const { queue, occupancy, timings, selectedMess, settings, liveLoading: loading } = mess;
  const capacity = selectedMess?.capacity || 0;
  const people = occupancy?.people_inside || 0;
  const pct = occupancyPct(people, capacity);
  const level = crowdLevel(pct);
  const wait = waitMinutes(queue?.waiting_students || 0, queue?.counters_open || 1, queue?.avg_serving_seconds || 45);
  const meal = currentMeal(timings);
  const seatsFree = Math.max(0, capacity - people - (occupancy?.seats_blocked || 0));

  const prediction = useMemo(
    () => predictCrowd(history, capacity),
    [history, capacity]
  );

  const specials = items.filter((i) => i.is_special && i.status === "available");
  const rated = items.filter((i) => Number(i.rating_count || 0) > 0);

  if (loading && !queue) {
    return <LoadingBlock label="Syncing live mess data…" />;
  }

  return (
    <div className="space-y-6">
      <PageHeading
        title="Live mess dashboard"
        description="Everything you need before walking to the mess — pulled from the mess team's latest update."
      >
        <FreshnessPill updatedAt={mess.updatedAt} staleMinutes={settings.stale_minutes} />
        <button
          type="button"
          onClick={mess.refreshLive}
          className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.03] px-3.5 py-2 text-[11.5px] font-medium text-white transition-colors hover:border-neon/40 hover:text-neon"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${mess.refreshing ? "animate-spin" : ""}`} /> Refresh now
        </button>
        <span className="hidden rounded-full border border-white/10 px-3 py-2 text-[10.5px] text-muted-foreground sm:inline-flex">
          Auto every {settings.auto_refresh_seconds}s
        </span>
      </PageHeading>

      {!selectedMess && (
        <div className="glass p-6 text-sm text-muted-foreground">
          No mess is available yet. An administrator needs to create a mess location first.
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.45fr_1fr]">
        <CrowdHero mess={selectedMess} queue={queue} occupancy={occupancy} pct={pct} wait={wait} />

        <div className="glass flex flex-col items-center justify-center p-5 sm:p-6">
          <div className="mb-1 flex w-full items-center justify-between">
            <span className="label-xs">Live occupancy</span>
            {(selectedMess?.is_demo || occupancy?.is_demo) && <DemoBadge label="DEMO" />}
          </div>
          <OccupancyRing
            value={pct}
            size={214}
            centerValue={`${pct}%`}
            centerLabel="Full"
            sublabel={level.headline}
          />
          <div className="mt-5 grid w-full grid-cols-3 gap-2 text-center">
            <div className="rounded-lg border border-white/[0.07] bg-white/[0.02] py-2">
              <div className="stat-num text-base font-semibold text-white">{people}</div>
              <div className="text-[9.5px] uppercase tracking-wider text-muted-foreground">Inside</div>
            </div>
            <div className="rounded-lg border border-white/[0.07] bg-white/[0.02] py-2">
              <div className="stat-num text-base font-semibold text-neon">{seatsFree}</div>
              <div className="text-[9.5px] uppercase tracking-wider text-muted-foreground">Seats free</div>
            </div>
            <div className="rounded-lg border border-white/[0.07] bg-white/[0.02] py-2">
              <div className="stat-num text-base font-semibold text-white">{capacity}</div>
              <div className="text-[9.5px] uppercase tracking-wider text-muted-foreground">Capacity</div>
            </div>
          </div>
          <p className="mt-3 text-center text-[10.5px] text-muted-foreground">
            Occupancy is recorded by staff at the gate {occupancy?.updated_by_name ? `· ${occupancy.updated_by_name}` : ""}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        <StatTile label="Inside now" value={people} icon={Users} tone="electric" hint={`of ${capacity} seats`} accent="rgba(46,168,255,0.5)" />
        <StatTile label="In queue" value={queue?.waiting_students ?? 0} icon={ListOrdered} tone="neon" hint="students waiting" accent="rgba(34,255,154,0.5)" />
        <StatTile label="Eating" value={occupancy?.students_eating ?? 0} icon={Utensils} tone="ember" hint="at the tables" accent="rgba(255,138,61,0.5)" />
        <StatTile label="Seats free" value={seatsFree} icon={Armchair} tone="default" hint="available right now" />
        <StatTile label="Capacity" value={capacity} icon={Building2} hint="total seats" />
        <StatTile label="Counters open" value={`${queue?.counters_open ?? 0}/${queue?.total_counters ?? 0}`} icon={DoorOpen} tone="electric" hint="serving lanes" />
        <StatTile label="Est. waiting" value={wait} suffix="min" icon={Timer} tone="ember" hint="estimate, not exact" accent="rgba(255,138,61,0.5)" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <QuickInfo
          meal={meal.meal}
          mealLabel={MEAL_LABEL[meal.meal]}
          items={items}
          timings={timings}
          mess={selectedMess}
          threshold={settings.low_stock_threshold}
        />
        <div className="space-y-4">
          <NoticeBoard notices={notices} limit={3} compact />

          <div className="glass p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="label-xs">Smart recommendation</div>
                <h3 className="mt-1.5 flex items-center gap-2 text-base font-semibold text-white">
                  <Sparkles className="h-4 w-4 text-electric" /> Best time to visit
                </h3>
              </div>
              <Link to="/predictions" className="text-[11px] font-medium text-neon hover:underline">
                Predictions
              </Link>
            </div>
            {prediction.hasHistory ? (
              <>
                <div className="mt-4 flex items-end gap-2">
                  <span className="stat-num text-3xl font-semibold text-neon">{prediction.bestTime}</span>
                  <span className="mb-1 text-[11px] text-muted-foreground">
                    ≈ {prediction.bestCrowd} people expected
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[
                    { label: "in 15 min", value: prediction.next15 },
                    { label: "in 30 min", value: prediction.next30 },
                    { label: "in 1 hour", value: prediction.next60 },
                  ].map((p) => (
                    <div key={p.label} className="rounded-lg border border-white/[0.07] bg-white/[0.02] px-2 py-2 text-center">
                      <div className="stat-num text-base font-semibold text-white">{p.value}</div>
                      <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{p.label}</div>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-[10px] text-muted-foreground">
                  Estimates from {history.length} historical snapshots — not a guaranteed live count.
                </p>
              </>
            ) : (
              <p className="mt-3 text-[11.5px] text-muted-foreground">
                Predictions unlock once staff have recorded a few days of occupancy updates.
              </p>
            )}
          </div>
        </div>
      </div>

      {(specials.length > 0 || rated.length > 0) && (
        <div className="grid gap-4 lg:grid-cols-2">
          {specials.length > 0 && (
            <div className="glass p-5">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-base font-semibold text-white">
                  <Flame className="h-4 w-4 text-ember" /> Today's specials
                </h3>
                <Link to="/menu" className="text-[11px] text-neon hover:underline">Menu</Link>
              </div>
              <div className="mt-3 space-y-2">
                {specials.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-xl border border-ember/20 bg-ember/[0.06] px-3 py-2.5">
                    <div className="min-w-0">
                      <div className="truncate text-[12.5px] font-medium text-white">{item.name}</div>
                      <div className="text-[10.5px] text-muted-foreground">{MEAL_LABEL[item.meal]} · {item.remaining_quantity} plates left</div>
                    </div>
                    <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-ember">special</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {rated.length > 0 && (
            <div className="glass p-5">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-base font-semibold text-white">
                  <Star className="h-4 w-4 text-yellow-300" /> Top rated today
                </h3>
                <Link to="/reviews" className="text-[11px] text-neon hover:underline">Reviews</Link>
              </div>
              <div className="mt-3 space-y-2">
                {[...rated].sort((a, b) => b.rating_avg - a.rating_avg).slice(0, 3).map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2.5">
                    <span className="truncate text-[12.5px] text-white">{item.name}</span>
                    <span className="ml-2 shrink-0 font-mono text-[11px] text-yellow-300">
                      ★ {Number(item.rating_avg).toFixed(1)} <span className="text-muted-foreground">({item.rating_count})</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
        <p className="text-[11px] text-muted-foreground">
          Numbers come from staff updates, not simulations. If the badge above reads DATA OUTDATED, the mess team has not
          refreshed the counts recently.
        </p>
        <Link to="/queue" className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-neon hover:underline">
          Live queue <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}