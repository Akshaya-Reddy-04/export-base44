import React, { useEffect, useMemo, useState } from "react";
import { FileBarChart, Download, Loader2, Users, Utensils, Recycle } from "lucide-react";
import { PageHeading } from "@/components/rr/GlassCard";
import StatTile from "@/components/rr/StatTile";
import { LoadingBlock } from "@/components/rr/EmptyState";
import { useMess } from "@/lib/MessContext";
import { base44 } from "@/api/base44Client";
import { pageItems } from "@/hooks/useMessData";
import { downloadCsv, todayKey, clockTime } from "@/lib/rush";

const RANGES = [
  { key: "7", label: "Last 7 days" },
  { key: "30", label: "Last 30 days" },
  { key: "all", label: "All time" },
];

export default function AdminReports() {
  const { messes, selectedId } = useMess();
  const [range, setRange] = useState("7");
  const [attendance, setAttendance] = useState([]);
  const [txns, setTxns] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Attendance.list({ sort: "-entry_time", limit: 800 }),
      base44.entities.FoodTransaction.list({ sort: "-created_date", limit: 800 }),
      base44.entities.MenuItem.list({ limit: 300 }),
    ]).then(([a, t, i]) => {
      setAttendance(pageItems(a));
      setTxns(pageItems(t));
      setItems(pageItems(i));
      setLoading(false);
    });
  }, []);

  const cutoff = useMemo(() => {
    if (range === "all") return null;
    const d = new Date();
    d.setDate(d.getDate() - Number(range));
    return d.toISOString().slice(0, 10);
  }, [range]);

  const inRange = (dateStr) => (cutoff ? String(dateStr || "").slice(0, 10) >= cutoff : true);

  const visits = attendance.filter((a) => inRange(a.date || a.entry_time));
  const food = txns.filter((t) => inRange(t.created_date));

  const byMess = useMemo(
    () =>
      messes.map((m) => {
        const messVisits = visits.filter((v) => v.mess_id === m.id);
        const messFood = food.filter((f) => f.mess_id === m.id);
        const served = messFood.filter((f) => f.type === "served").reduce((s, f) => s + Math.abs(Number(f.quantity || 0)), 0);
        const wasted = messFood.filter((f) => f.type === "wasted").reduce((s, f) => s + Math.abs(Number(f.quantity || 0)), 0);
        const messItems = items.filter((i) => i.mess_id === m.id && Number(i.rating_count || 0) > 0);
        const avgRating = messItems.length
          ? messItems.reduce((s, i) => s + Number(i.rating_avg || 0) * Number(i.rating_count || 0), 0) /
            messItems.reduce((s, i) => s + Number(i.rating_count || 0), 0)
          : 0;
        return {
          ...m,
          visits: messVisits.length,
          served,
          wasted,
          wastePct: served + wasted ? Math.round((wasted / (served + wasted)) * 100) : 0,
          avgRating,
        };
      }),
    [messes, visits, food, items]
  );

  const totals = byMess.reduce(
    (acc, m) => ({
      visits: acc.visits + m.visits,
      served: acc.served + m.served,
      wasted: acc.wasted + m.wasted,
    }),
    { visits: 0, served: 0, wasted: 0 }
  );

  const exportVisits = () => {
    downloadCsv(
      `rush-radar-attendance-${todayKey()}.csv`,
      [
        { label: "Date", value: (r) => r.date || String(r.entry_time).slice(0, 10) },
        { label: "Student", key: "student_name" },
        { label: "Roll", key: "roll_number" },
        { label: "Mess", key: "mess_name" },
        { label: "Entry", value: (r) => clockTime(r.entry_time) },
        { label: "Exit", value: (r) => (r.exit_time ? clockTime(r.exit_time) : "") },
        { label: "Method", key: "method" },
      ],
      visits
    );
  };

  const exportFood = () => {
    downloadCsv(
      `rush-radar-food-${todayKey()}.csv`,
      [
        { label: "Item", key: "item_name" },
        { label: "Meal", key: "meal" },
        { label: "Type", key: "type" },
        { label: "Quantity", key: "quantity" },
        { label: "Staff", key: "staff_name" },
        { label: "Logged", value: (r) => String(r.created_date).slice(0, 16).replace("T", " ") },
      ],
      food
    );
  };

  if (loading) return <LoadingBlock label="Gathering records…" />;

  return (
    <div className="space-y-6">
      <PageHeading title="Reports" description="Download attendance and kitchen data as CSV for records or audits.">
        <div className="flex flex-wrap gap-1.5">
          {RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setRange(r.key)}
              className={`rounded-full border px-3 py-1.5 text-[11px] ${
                range === r.key ? "border-neon/40 bg-neon/10 text-neon" : "border-white/10 text-muted-foreground hover:text-white"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </PageHeading>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile label="Gate visits" value={totals.visits} icon={Users} tone="neon" hint={range === "all" ? "all recorded" : `last ${range} days`} />
        <StatTile label="Plates served" value={totals.served} icon={Utensils} tone="electric" hint="logged by staff" />
        <StatTile label="Plates wasted" value={totals.wasted} icon={Recycle} tone="danger" hint="logged waste" />
      </div>

      <div className="glass overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
            <FileBarChart className="h-4 w-4 text-neon" /> Summary by mess
          </h3>
          <span className="font-mono text-[10px] text-muted-foreground">{range === "all" ? "all time" : `last ${range} days`}</span>
        </div>
        <div className="scroll-thin overflow-x-auto">
          <table className="w-full min-w-[620px] text-left">
            <thead>
              <tr className="border-b border-white/[0.06] text-[9.5px] uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-2.5">Mess</th>
                <th className="px-3 py-2.5">Visits</th>
                <th className="px-3 py-2.5">Served</th>
                <th className="px-3 py-2.5">Wasted</th>
                <th className="px-3 py-2.5">Waste %</th>
                <th className="px-3 py-2.5">Rating</th>
              </tr>
            </thead>
            <tbody>
              {byMess.map((m) => (
                <tr key={m.id} className={`border-b border-white/[0.04] text-[11.5px] ${m.id === selectedId ? "bg-neon/[0.04]" : ""}`}>
                  <td className="px-5 py-2.5 text-white">{m.name}</td>
                  <td className="px-3 py-2.5 font-mono text-slate-300">{m.visits}</td>
                  <td className="px-3 py-2.5 font-mono text-neon">{m.served}</td>
                  <td className="px-3 py-2.5 font-mono text-danger">{m.wasted}</td>
                  <td className="px-3 py-2.5 font-mono text-slate-300">{m.wastePct}%</td>
                  <td className="px-3 py-2.5 font-mono text-yellow-300">{m.avgRating ? m.avgRating.toFixed(1) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="glass flex items-center justify-between p-4">
          <div>
            <div className="text-[12.5px] font-medium text-white">Attendance CSV</div>
            <div className="text-[10.5px] text-muted-foreground">{visits.length} gate records</div>
          </div>
          <button
            type="button"
            onClick={exportVisits}
            disabled={visits.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-neon/30 bg-neon/10 px-3 py-2 text-[11px] font-semibold text-neon disabled:opacity-40"
          >
            <Download className="h-3 w-3" /> Export
          </button>
        </div>
        <div className="glass flex items-center justify-between p-4">
          <div>
            <div className="text-[12.5px] font-medium text-white">Food transactions CSV</div>
            <div className="text-[10.5px] text-muted-foreground">{food.length} kitchen records</div>
          </div>
          <button
            type="button"
            onClick={exportFood}
            disabled={food.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-electric/30 bg-electric/10 px-3 py-2 text-[11px] font-semibold text-electric disabled:opacity-40"
          >
            <Download className="h-3 w-3" /> Export
          </button>
        </div>
      </div>

      <div className="flex items-start gap-2.5 rounded-2xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
        <Download className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Exports contain only the {RANGES.find((r) => r.key === range)?.label.toLowerCase()} window and open in Excel or
          Google Sheets.
        </p>
      </div>
    </div>
  );
}