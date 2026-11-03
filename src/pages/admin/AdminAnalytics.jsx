import React, { useEffect, useMemo, useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
} from "recharts";
import { TrendingUp, Users, Star, Utensils, Clock3 } from "lucide-react";
import { PageHeading } from "@/components/rr/GlassCard";
import StatTile from "@/components/rr/StatTile";
import { LoadingBlock } from "@/components/rr/EmptyState";
import { useMess } from "@/lib/MessContext";
import { base44 } from "@/api/base44Client";
import { pageItems } from "@/hooks/useMessData";
import { crowdLevel, MEAL_LABEL } from "@/lib/rush";

const CHART_TEXT = { fill: "#64748b", fontSize: 10 };
const TOOLTIP = { background: "#0a111d", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontSize: 11 };

export default function AdminAnalytics() {
  const mess = useMess();
  const { selectedId, selectedMess } = mess;
  const [history, setHistory] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [txns, setTxns] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    Promise.all([
      base44.entities.CrowdHistory.filter({ mess_id: selectedId }, { sort: "-recorded_at", limit: 400 }),
      base44.entities.Attendance.filter({ mess_id: selectedId }, { sort: "-entry_time", limit: 400 }),
      base44.entities.FoodTransaction.filter({ mess_id: selectedId }, { sort: "-created_date", limit: 300 }),
      base44.entities.FoodReview.filter({ mess_id: selectedId }, { sort: "-created_date", limit: 200 }),
    ]).then(([h, a, t, r]) => {
      setHistory(pageItems(h));
      setAttendance(pageItems(a));
      setTxns(pageItems(t));
      setReviews(pageItems(r));
      setLoading(false);
    });
  }, [selectedId]);

  const hourly = useMemo(() => {
    const buckets = Array.from({ length: 24 }, (_, hour) => ({ hour, label: `${String(hour).padStart(2, "0")}:00`, sum: 0, count: 0 }));
    history.forEach((h) => {
      const hour = Number(h.hour_of_day ?? new Date(h.recorded_at || h.created_date).getHours());
      if (hour >= 0 && hour < 24) {
        buckets[hour].sum += Number(h.people_inside || 0);
        buckets[hour].count += 1;
      }
    });
    return buckets
      .filter((b) => b.count > 0)
      .map((b) => ({ label: b.label, crowd: Math.round(b.sum / b.count), pct: Math.round(b.sum / b.count / (selectedMess?.capacity || 1) * 100) }));
  }, [history, selectedMess?.capacity]);

  const dailyTrend = useMemo(() => {
    const map = new Map();
    attendance.forEach((a) => {
      const day = a.date || new Date(a.entry_time).toISOString().slice(0, 10);
      map.set(day, (map.get(day) || 0) + 1);
    });
    return [...map.entries()]
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .slice(-14)
      .map(([day, count]) => ({ label: day.slice(5), visits: count }));
  }, [attendance]);

  const perMeal = useMemo(() => {
    const served = {};
    const wasted = {};
    txns.forEach((t) => {
      const key = t.meal || "other";
      if (t.type === "served") served[key] = (served[key] || 0) + Math.abs(Number(t.quantity || 0));
      if (t.type === "wasted") wasted[key] = (wasted[key] || 0) + Math.abs(Number(t.quantity || 0));
    });
    return Object.keys({ ...served, ...wasted }).map((key) => ({
      label: MEAL_LABEL[key] || key,
      served: served[key] || 0,
      wasted: wasted[key] || 0,
    }));
  }, [txns]);

  const ratingSplit = useMemo(() => {
    const buckets = [5, 4, 3, 2, 1].map((star) => ({
      name: `${star}★`,
      value: reviews.filter((r) => Math.round(r.rating) === star).length,
      star,
    }));
    const colors = ["#22ff9a", "#7ee787", "#fde047", "#ff8a3d", "#ff4d6d"];
    return buckets.map((b, i) => ({ ...b, fill: colors[i] }));
  }, [reviews]);

  if (loading) return <LoadingBlock label="Building analytics…" />;

  const totalVisits = attendance.length;
  const avgRating = reviews.length ? reviews.reduce((s, r) => s + Number(r.rating || 0), 0) / reviews.length : 0;
  const peak = [...hourly].sort((a, b) => b.crowd - a.crowd)[0];

  return (
    <div className="space-y-6">
      <PageHeading title="Analytics" description={`Peak hours, footfall, meals and satisfaction for ${selectedMess?.name || "this mess"}.`} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Recorded visits" value={totalVisits} icon={Users} tone="electric" hint="gate log entries" />
        <StatTile label="Peak hour" value={peak?.label || "—"} icon={Clock3} tone="ember" hint={peak ? `${peak.crowd} people avg` : "no data yet"} />
        <StatTile label="Avg rating" value={avgRating ? avgRating.toFixed(1) : "—"} icon={Star} tone="neon" hint={`${reviews.length} reviews`} />
        <StatTile label="Stock updates" value={txns.length} icon={Utensils} hint="kitchen transactions" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass p-5">
          <div className="label-xs">Crowd by hour</div>
          <h3 className="mt-1.5 text-sm font-semibold text-white">Average people inside</h3>
          {hourly.length === 0 ? (
            <p className="mt-3 text-[11.5px] text-muted-foreground">No snapshots yet — staff updates build this chart.</p>
          ) : (
            <div className="mt-3 h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourly} margin={{ top: 4, right: 4, left: -26, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="label" tick={CHART_TEXT} tickLine={false} axisLine={false} />
                  <YAxis tick={CHART_TEXT} tickLine={false} axisLine={false} width={40} />
                  <Tooltip contentStyle={TOOLTIP} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                  <Bar dataKey="crowd" radius={[5, 5, 0, 0]}>
                    {hourly.map((h) => (
                      <Cell key={h.label} fill={crowdLevel(h.pct).hex} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="glass p-5">
          <div className="label-xs">Footfall trend</div>
          <h3 className="mt-1.5 text-sm font-semibold text-white">Daily gate entries</h3>
          {dailyTrend.length < 2 ? (
            <p className="mt-3 text-[11.5px] text-muted-foreground">Two or more days of scans are needed for a trend.</p>
          ) : (
            <div className="mt-3 h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyTrend} margin={{ top: 4, right: 8, left: -26, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="label" tick={CHART_TEXT} tickLine={false} axisLine={false} />
                  <YAxis tick={CHART_TEXT} tickLine={false} axisLine={false} width={40} />
                  <Tooltip contentStyle={TOOLTIP} />
                  <Line type="monotone" dataKey="visits" stroke="#2ea8ff" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="glass p-5">
          <div className="label-xs">Meal performance</div>
          <h3 className="mt-1.5 text-sm font-semibold text-white">Served vs wasted</h3>
          {perMeal.length === 0 ? (
            <p className="mt-3 text-[11.5px] text-muted-foreground">Log served and wasted plates in Inventory to see this.</p>
          ) : (
            <div className="mt-3 h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={perMeal} margin={{ top: 4, right: 4, left: -26, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="label" tick={CHART_TEXT} tickLine={false} axisLine={false} />
                  <YAxis tick={CHART_TEXT} tickLine={false} axisLine={false} width={40} />
                  <Tooltip contentStyle={TOOLTIP} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                  <Legend wrapperStyle={{ fontSize: 10, color: "#94a3b8" }} />
                  <Bar dataKey="served" fill="#22ff9a" radius={[5, 5, 0, 0]} />
                  <Bar dataKey="wasted" fill="#ff4d6d" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="glass p-5">
          <div className="label-xs">Satisfaction</div>
          <h3 className="mt-1.5 text-sm font-semibold text-white">Rating distribution</h3>
          {reviews.length === 0 ? (
            <p className="mt-3 text-[11.5px] text-muted-foreground">No student reviews yet.</p>
          ) : (
            <div className="mt-3 flex items-center gap-4">
              <div className="h-[200px] flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={ratingSplit} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={3} stroke="none">
                      {ratingSplit.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1">
                {ratingSplit.map((r) => (
                  <div key={r.name} className="flex items-center gap-2 text-[10.5px]">
                    <span className="h-2 w-2 rounded-full" style={{ background: r.fill }} />
                    <span className="text-muted-foreground">{r.name}</span>
                    <span className="font-mono text-white">{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-start gap-2.5 rounded-2xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
        <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Charts use the last {history.length} crowd snapshots, {attendance.length} gate records and {txns.length} kitchen
          transactions recorded by staff for this mess.
        </p>
      </div>
    </div>
  );
}