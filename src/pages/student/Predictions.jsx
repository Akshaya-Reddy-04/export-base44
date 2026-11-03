import React, { useMemo } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Sparkles, Clock, TrendingUp, Info, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeading } from "@/components/rr/GlassCard";
import { LoadingBlock, EmptyState } from "@/components/rr/EmptyState";
import { useMess } from "@/lib/MessContext";
import { useHistory } from "@/hooks/useMessContent";
import { crowdLevel, predictCrowd } from "@/lib/rush";

export default function Predictions() {
  const mess = useMess();
  const { history, loading } = useHistory(mess.selectedId);
  const capacity = mess.selectedMess?.capacity || 0;
  const prediction = useMemo(() => predictCrowd(history, capacity), [history, capacity]);

  const chartData = prediction.points.map((p) => ({
    ...p,
    pct: capacity ? Math.round((p.crowd / capacity) * 100) : 0,
  }));

  if (loading) return <LoadingBlock label="Crunching historical snapshots…" />;

  return (
    <div className="space-y-6">
      <PageHeading
        title="Smart crowd prediction"
        description={`Projected crowd for ${mess.selectedMess?.name || "your mess"} from historical staff-recorded snapshots.`}
      >
        <span className="inline-flex items-center gap-2 rounded-full border border-ember/30 bg-ember-soft px-3 py-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ember">
          <Info className="h-3 w-3" /> Estimates, not live counts
        </span>
      </PageHeading>

      {!prediction.hasHistory ? (
        <EmptyState
          title="Predictions need history first"
          description="Once mess staff record live queue and occupancy updates for a few sessions, Rush Radar can project the next 15, 30 and 60 minutes."
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "Next 15 minutes", value: prediction.next15, sub: "people expected" },
              { label: "Next 30 minutes", value: prediction.next30, sub: "people expected" },
              { label: "Next hour", value: prediction.next60, sub: "people expected" },
            ].map((card) => {
              const pct = capacity ? Math.round((card.value / capacity) * 100) : 0;
              const level = crowdLevel(pct);
              return (
                <div key={card.label} className="glass relative overflow-hidden p-5">
                  <div
                    className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-20 blur-2xl"
                    style={{ background: level.hex }}
                  />
                  <div className="label-xs">{card.label}</div>
                  <div className="mt-2 flex items-end gap-2">
                    <span className="stat-num text-4xl font-semibold" style={{ color: level.hex }}>{card.value}</span>
                    <span className="mb-1.5 text-[11px] text-muted-foreground">{card.sub}</span>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(100, Math.max(3, pct))}%`, background: level.hex }}
                    />
                  </div>
                  <div className="mt-2 text-[10.5px]" style={{ color: level.hex }}>
                    {level.label} · ~{pct}% capacity
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
            <div className="glass p-5 sm:p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="label-xs">Expected crowd by hour</div>
                  <h3 className="mt-1.5 text-base font-semibold text-white">Next 12 hours, from history</h3>
                </div>
                <TrendingUp className="h-4 w-4 text-electric" />
              </div>
              <div className="mt-4 h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 6, right: 6, left: -24, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} width={44} />
                    <Tooltip
                      cursor={{ fill: "rgba(255,255,255,0.04)" }}
                      contentStyle={{ background: "#0a111d", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontSize: 11 }}
                    />
                    <Bar dataKey="crowd" radius={[6, 6, 0, 0]}>
                      {chartData.map((entry) => (
                        <Cell key={entry.label} fill={crowdLevel(entry.pct).hex} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-4">
              <div className="glass p-5">
                <div className="label-xs">Recommended window</div>
                <div className="mt-2 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-neon" />
                  <span className="stat-num text-3xl font-semibold text-neon">{prediction.bestTime}</span>
                </div>
                <p className="mt-2 text-[11.5px] text-muted-foreground">
                  Quietest stretch in the next 12 hours — around {prediction.bestCrowd} people expected
                  {capacity ? ` (${Math.round((prediction.bestCrowd / capacity) * 100)}% capacity)` : ""}.
                </p>
                <Link
                  to="/queue"
                  className="mt-4 inline-flex items-center gap-1.5 text-[11.5px] font-medium text-neon hover:underline"
                >
                  Check the live queue <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="glass p-5">
                <div className="label-xs">Predicted peak hours</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {prediction.peaks.map((p) => (
                    <span key={p} className="inline-flex items-center gap-1.5 rounded-full border border-danger/30 bg-danger/10 px-3 py-1.5 font-mono text-[11.5px] text-danger">
                      <Clock className="h-3 w-3" /> {p}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-[10.5px] text-muted-foreground">
                  Based on {history.length} recorded snapshots. Meal timings, holidays and specials can shift these.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-2xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              These figures are statistical estimates from past staff updates for this mess. They are not sensor readings and
              can be wrong on holidays, exam days or when a special is served.
            </p>
          </div>
        </>
      )}
    </div>
  );
}