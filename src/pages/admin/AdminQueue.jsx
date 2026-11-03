import React, { useEffect, useState } from "react";
import { ListOrdered, Timer, Save, Loader2, Check, BellRing, DoorOpen, History } from "lucide-react";
import { PageHeading } from "@/components/rr/GlassCard";
import StatTile from "@/components/rr/StatTile";
import FreshnessPill from "@/components/rr/FreshnessPill";
import TrendChart from "@/components/rr/TrendChart";
import { useMess } from "@/lib/MessContext";
import { useAuth } from "@/lib/AuthContext";
import { useHistory } from "@/hooks/useMessContent";
import { saveQueueStatus, recordSnapshot, sendMessAlert } from "@/lib/liveOps";
import { waitMinutes, formatWait, agoLabel } from "@/lib/rush";

export default function AdminQueue() {
  const { user } = useAuth();
  const mess = useMess();
  const { queue, occupancy, selectedMess, selectedId, settings, updatedAt, refreshLive } = mess;
  const { history, reload: reloadHistory } = useHistory(selectedId, 400);

  const [form, setForm] = useState({ waiting_students: 0, counters_open: 1, total_counters: 3, avg_serving_seconds: 45, status_note: "" });
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [alerting, setAlerting] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");

  useEffect(() => {
    if (!queue) return;
    setForm({
      waiting_students: queue.waiting_students ?? 0,
      counters_open: queue.counters_open ?? 1,
      total_counters: queue.total_counters ?? 3,
      avg_serving_seconds: queue.avg_serving_seconds ?? 45,
      status_note: queue.status_note || "",
    });
  }, [queue?.id, queue?.updated_date]);

  const wait = waitMinutes(form.waiting_students, form.counters_open, form.avg_serving_seconds);
  const chart = [...history]
    .filter((h) => h.queue_length !== undefined)
    .slice(0, 24)
    .reverse()
    .map((h) => ({ label: new Date(h.recorded_at || h.created_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), value: Number(h.queue_length || 0) }));

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const bump = (delta) => setForm((f) => ({ ...f, waiting_students: Math.max(0, Number(f.waiting_students || 0) + delta) }));

  const save = async () => {
    setSaving(true);
    setAlertMsg("");
    try {
      const saved = await saveQueueStatus({
        messId: selectedId,
        messName: selectedMess?.name,
        current: queue,
        patch: form,
        staffName: user?.full_name,
      });
      await recordSnapshot({ messId: selectedId, occupancy, queue: saved, capacity: selectedMess?.capacity });
      await Promise.all([refreshLive(), reloadHistory()]);
      setSavedAt(new Date().toISOString());
    } finally {
      setSaving(false);
    }
  };

  const notifyDrop = async () => {
    setAlerting(true);
    try {
      const res = await sendMessAlert({
        messId: selectedId,
        title: `${selectedMess?.name || "Mess"} queue just dropped`,
        message: `Only ${form.waiting_students} students waiting right now — about ${formatWait(wait)}. Good time to walk over.`,
        type: "queue",
      });
      setAlertMsg(`Alert sent to ${res?.sent || 0} students`);
    } catch {
      setAlertMsg("Could not send the alert.");
    } finally {
      setAlerting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeading
        title="Queue management"
        description="Publish the counter status students see in their app. Every save also records a snapshot for crowd prediction."
      >
        <FreshnessPill updatedAt={updatedAt} staleMinutes={settings.stale_minutes} />
      </PageHeading>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Waiting now" value={queue?.waiting_students ?? 0} icon={ListOrdered} tone="neon" hint="students in line" />
        <StatTile label="Estimated wait" value={wait} suffix="min" icon={Timer} tone="ember" hint="people ÷ open counters" />
        <StatTile label="Counters open" value={`${form.counters_open}/${form.total_counters}`} icon={DoorOpen} tone="electric" hint="serving lanes" />
        <StatTile label="Last update" value={agoLabel(updatedAt)} icon={History} hint={queue?.updated_by_name || "no staff update yet"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
        <div className="glass p-5 sm:p-6">
          <h3 className="text-base font-semibold text-white">Publish live queue</h3>
          <p className="mt-1 text-[11.5px] text-muted-foreground">Count the students in line and save — students see it instantly.</p>

          <div className="mt-4">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Students waiting</label>
            <div className="mt-1.5 flex items-center gap-2">
              {[-10, -5, -1].map((d) => (
                <button key={d} type="button" onClick={() => bump(d)} className="rounded-lg border border-white/10 px-2.5 py-2 font-mono text-[11px] text-slate-300 hover:border-white/25 hover:text-white">
                  {d}
                </button>
              ))}
              <input
                type="number"
                min={0}
                value={form.waiting_students}
                onChange={(e) => set("waiting_students", Math.max(0, Number(e.target.value)))}
                className="w-24 rounded-xl border border-white/10 bg-[#070d18] px-3 py-2 text-center font-mono text-lg text-white outline-none focus:border-neon/50"
              />
              {[1, 5, 10].map((d) => (
                <button key={d} type="button" onClick={() => bump(d)} className="rounded-lg border border-white/10 px-2.5 py-2 font-mono text-[11px] text-slate-300 hover:border-white/25 hover:text-white">
                  +{d}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Counters open</span>
              <input
                type="number"
                min={0}
                value={form.counters_open}
                onChange={(e) => set("counters_open", Math.max(0, Number(e.target.value)))}
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#070d18] px-2.5 py-2 font-mono text-[12px] text-white outline-none focus:border-neon/50"
              />
            </label>
            <label className="block">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Total counters</span>
              <input
                type="number"
                min={1}
                value={form.total_counters}
                onChange={(e) => set("total_counters", Math.max(1, Number(e.target.value)))}
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#070d18] px-2.5 py-2 font-mono text-[12px] text-white outline-none focus:border-neon/50"
              />
            </label>
            <label className="block">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Avg serving (seconds)</span>
              <input
                type="number"
                min={10}
                value={form.avg_serving_seconds}
                onChange={(e) => set("avg_serving_seconds", Math.max(10, Number(e.target.value)))}
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#070d18] px-2.5 py-2 font-mono text-[12px] text-white outline-none focus:border-neon/50"
              />
            </label>
            <label className="block">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Note for students</span>
              <input
                value={form.status_note}
                onChange={(e) => set("status_note", e.target.value)}
                placeholder="e.g. Counter 2 under repair"
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#070d18] px-2.5 py-2 text-[12px] text-white outline-none placeholder:text-muted-foreground/60 focus:border-neon/50"
              />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-neon px-4 py-2.5 text-[12.5px] font-semibold text-black disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {saving ? "Publishing…" : "Publish update"}
            </button>
            <button
              type="button"
              onClick={notifyDrop}
              disabled={alerting}
              className="inline-flex items-center gap-2 rounded-xl border border-electric/30 bg-electric/10 px-4 py-2.5 text-[12px] font-semibold text-electric disabled:opacity-50"
            >
              {alerting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BellRing className="h-3.5 w-3.5" />}
              Tell students the queue is short
            </button>
          </div>
          {savedAt && (
            <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-neon">
              <Check className="h-3 w-3" /> Published — snapshot saved at {new Date(savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
          {alertMsg && <p className="mt-2 text-[11px] text-electric">{alertMsg}</p>}
        </div>

        <div className="space-y-4">
          <div className="glass p-5">
            <div className="label-xs">Queue trend</div>
            <h3 className="mt-1.5 text-sm font-semibold text-white">Recorded snapshots</h3>
            {chart.length > 1 ? (
              <div className="mt-3">
                <TrendChart data={chart} label="Queue" color="#22ff9a" unit="students" height={200} />
              </div>
            ) : (
              <p className="mt-3 text-[11.5px] text-muted-foreground">
                Publish a few updates through the day and the queue trend will appear here.
              </p>
            )}
          </div>

          <div className="glass p-5">
            <div className="label-xs">What students see</div>
            <div className="mt-3 flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-3">
              <div>
                <div className="text-[11px] text-muted-foreground">Waiting students</div>
                <div className="stat-num text-2xl font-semibold text-neon">{form.waiting_students}</div>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-muted-foreground">Est. wait</div>
                <div className="stat-num text-2xl font-semibold text-ember">{formatWait(wait)}</div>
              </div>
            </div>
            {form.status_note && (
              <p className="mt-2 rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2 text-[11px] text-slate-300">
                “{form.status_note}”
              </p>
            )}
            <p className="mt-3 text-[10px] text-muted-foreground">
              Waiting time is people in line ÷ open counters × average serving time. It is an estimate, not a guarantee.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}