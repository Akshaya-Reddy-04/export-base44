import React, { useEffect, useState } from "react";
import { Users, Save, Loader2, Check, Armchair, LogIn, LogOut, DoorOpen } from "lucide-react";
import { PageHeading } from "@/components/rr/GlassCard";
import StatTile from "@/components/rr/StatTile";
import OccupancyRing from "@/components/rr/OccupancyRing";
import FreshnessPill from "@/components/rr/FreshnessPill";
import TrendChart from "@/components/rr/TrendChart";
import { useMess } from "@/lib/MessContext";
import { useAuth } from "@/lib/AuthContext";
import { useHistory } from "@/hooks/useMessContent";
import { base44 } from "@/api/base44Client";
import { pageItems } from "@/hooks/useMessData";
import { saveOccupancy, recordSnapshot } from "@/lib/liveOps";
import { occupancyPct, crowdLevel, clockTime, todayKey } from "@/lib/rush";

export default function AdminOccupancy() {
  const { user } = useAuth();
  const mess = useMess();
  const { occupancy, queue, selectedMess, selectedId, settings, updatedAt, refreshLive } = mess;
  const { history, reload: reloadHistory } = useHistory(selectedId, 400);
  const [gate, setGate] = useState([]);
  const [form, setForm] = useState({ people_inside: 0, students_eating: 0, entries_today: 0, exits_today: 0, seats_blocked: 0 });
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  useEffect(() => {
    if (!occupancy) return;
    setForm({
      people_inside: occupancy.people_inside ?? 0,
      students_eating: occupancy.students_eating ?? 0,
      entries_today: occupancy.entries_today ?? 0,
      exits_today: occupancy.exits_today ?? 0,
      seats_blocked: occupancy.seats_blocked ?? 0,
    });
  }, [occupancy?.id, occupancy?.updated_date]);

  const loadGate = () => {
    base44.entities.Attendance.filter({ mess_id: selectedId }, { sort: "-entry_time", limit: 8 }).then((res) => {
      setGate(pageItems(res));
    });
  };

  useEffect(() => {
    if (selectedId) loadGate();
  }, [selectedId]);

  const capacity = selectedMess?.capacity || 0;
  const pct = occupancyPct(form.people_inside, capacity);
  const level = crowdLevel(pct);
  const set = (key, value) => setForm((f) => ({ ...f, [key]: Math.max(0, Number(value)) }));

  const chart = [...history].reverse().slice(-30).map((h) => ({
    label: new Date(h.recorded_at || h.created_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    value: Number(h.occupancy_pct || 0),
  }));

  const save = async () => {
    setSaving(true);
    try {
      const saved = await saveOccupancy({
        messId: selectedId,
        messName: selectedMess?.name,
        current: occupancy,
        patch: form,
        staffName: user?.full_name,
      });
      await recordSnapshot({ messId: selectedId, occupancy: saved, queue, capacity });
      await Promise.all([refreshLive(), reloadHistory()]);
      setSavedAt(new Date().toISOString());
    } finally {
      setSaving(false);
    }
  };

  const today = todayKey();
  const insideVisits = gate.filter((g) => g.date === today && !g.exit_time).length;

  return (
    <div className="space-y-6">
      <PageHeading
        title="Occupancy control"
        description="Record how full the hall is. Students see the ring, seats free and crowd level on their dashboard."
      >
        <FreshnessPill updatedAt={updatedAt} staleMinutes={settings.stale_minutes} />
      </PageHeading>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Inside now" value={form.people_inside} icon={Users} tone="electric" hint={`of ${capacity} seats`} />
        <StatTile label="Seats free" value={Math.max(0, capacity - form.people_inside - form.seats_blocked)} icon={Armchair} tone="neon" hint="available" />
        <StatTile label="Entries today" value={form.entries_today} icon={LogIn} hint="gate check-ins" />
        <StatTile label="Exits today" value={form.exits_today} icon={LogOut} hint="gate check-outs" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <div className="glass flex flex-col items-center p-6">
          <OccupancyRing value={pct} size={210} centerValue={`${pct}%`} centerLabel="Occupied" sublabel={level.headline} />
          <div className="mt-4 flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold" style={{ color: level.hex, background: `${level.hex}14` }}>
            <DoorOpen className="h-3 w-3" /> {level.label}
          </div>
          {occupancy?.updated_by_name && (
            <p className="mt-3 text-center text-[10.5px] text-muted-foreground">
              Last set by {occupancy.updated_by_name} at {clockTime(occupancy.updated_date)}
            </p>
          )}
        </div>

        <div className="glass p-5 sm:p-6">
          <h3 className="text-base font-semibold text-white">Publish occupancy</h3>
          <p className="mt-1 text-[11.5px] text-muted-foreground">
            Count heads in the hall (or read them off the gate log) and save.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {[
              { key: "people_inside", label: "People inside" },
              { key: "students_eating", label: "Currently eating" },
              { key: "entries_today", label: "Entries today" },
              { key: "exits_today", label: "Exits today" },
              { key: "seats_blocked", label: "Seats blocked" },
            ].map((f) => (
              <label key={f.key} className="block">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{f.label}</span>
                <input
                  type="number"
                  min={0}
                  value={form[f.key]}
                  onChange={(e) => set(f.key, e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-[#070d18] px-2.5 py-2 font-mono text-[13px] text-white outline-none focus:border-neon/50"
                />
              </label>
            ))}
            <div className="rounded-lg border border-white/[0.07] bg-white/[0.02] px-2.5 py-2">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Open gate sessions</span>
              <div className="stat-num text-[15px] font-semibold text-neon">{insideVisits}</div>
            </div>
          </div>

          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-neon px-4 py-2.5 text-[12.5px] font-semibold text-black disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {saving ? "Publishing…" : "Publish occupancy"}
          </button>
          {savedAt && (
            <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-neon">
              <Check className="h-3 w-3" /> Saved at {new Date(savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="glass p-5">
          <div className="label-xs">Occupancy trend</div>
          <h3 className="mt-1.5 text-sm font-semibold text-white">Recorded fill %</h3>
          {chart.length > 1 ? (
            <div className="mt-3">
              <TrendChart data={chart} label="Occupancy" color="#2ea8ff" unit="%" height={220} />
            </div>
          ) : (
            <p className="mt-3 text-[11.5px] text-muted-foreground">Trend appears after a few published updates.</p>
          )}
        </div>

        <div className="glass p-5">
          <div className="flex items-center gap-2">
            <LogIn className="h-4 w-4 text-neon" />
            <h3 className="text-sm font-semibold text-white">Recent gate log</h3>
          </div>
          {gate.length === 0 ? (
            <p className="mt-3 text-[11.5px] text-muted-foreground">No scans yet — use the QR scanner to check students in.</p>
          ) : (
            <div className="mt-3 space-y-1.5">
              {gate.map((g) => (
                <div key={g.id} className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2">
                  <div className="min-w-0">
                    <div className="truncate text-[11.5px] text-white">{g.student_name}</div>
                    <div className="font-mono text-[9px] text-muted-foreground">{g.method === "qr" ? "QR scan" : "manual"}</div>
                  </div>
                  <div className="ml-2 shrink-0 text-right font-mono text-[9.5px]">
                    <div className="text-neon">{clockTime(g.entry_time)}</div>
                    <div className="text-muted-foreground">{g.exit_time ? clockTime(g.exit_time) : "inside"}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}