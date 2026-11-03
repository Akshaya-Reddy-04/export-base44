import React, { useEffect, useState } from "react";
import { Settings, Building2, Clock3, Save, Loader2, Check, UserCog, Plus, Trash2 } from "lucide-react";
import { PageHeading } from "@/components/rr/GlassCard";
import { LoadingBlock } from "@/components/rr/EmptyState";
import { useMess } from "@/lib/MessContext";
import { base44 } from "@/api/base44Client";
import { pageItems } from "@/hooks/useMessData";
import { MEALS, MEAL_LABEL } from "@/lib/rush";

const SETTING_FIELDS = [
  { key: "low_stock_threshold", label: "Low stock alert at", suffix: "plates" },
  { key: "stale_minutes", label: "Mark data stale after", suffix: "minutes" },
  { key: "auto_refresh_seconds", label: "Student auto-refresh", suffix: "seconds" },
];

export default function AdminSettings() {
  const { messes, selectedId, selectedMess, reloadMesses } = useMess();
  const [settings, setSettings] = useState([]);
  const [values, setValues] = useState({});
  const [timings, setTimings] = useState([]);
  const [staff, setStaff] = useState([]);
  const [staffDraft, setStaffDraft] = useState({ full_name: "", email: "", role_title: "Mess supervisor" });
  const [messDraft, setMessDraft] = useState({ name: "", code: "", capacity: 200, open_time: "07:00", close_time: "22:00" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [note, setNote] = useState("");

  const loadAll = async () => {
    const [settingRes, staffRes] = await Promise.all([
      base44.entities.AppSetting.list({ limit: 30 }),
      base44.entities.StaffMember.list({ sort: "full_name", limit: 100 }),
    ]);
    const rows = pageItems(settingRes);
    setSettings(rows);
    setValues(rows.reduce((acc, r) => ({ ...acc, [r.key]: r.value }), {}));
    setStaff(pageItems(staffRes));
    setLoading(false);
  };

  const loadTimings = async () => {
    if (!selectedId) return;
    const res = await base44.entities.MessTiming.filter({ mess_id: selectedId }, { limit: 10 });
    setTimings(pageItems(res));
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    loadTimings();
  }, [selectedId]);

  const saveSettings = async () => {
    setSaving("settings");
    try {
      for (const field of SETTING_FIELDS) {
        const existing = settings.find((s) => s.key === field.key);
        const value = String(values[field.key] ?? "");
        if (existing) {
          await base44.entities.AppSetting.update(existing.id, { value, label: field.label });
        } else {
          await base44.entities.AppSetting.create({ key: field.key, value, label: field.label });
        }
      }
      await loadAll();
      setNote("Platform settings saved");
    } finally {
      setSaving("");
    }
  };

  const saveMess = async (m) => {
    setSaving(m.id);
    try {
      await base44.entities.Mess.update(m.id, {
        name: m.name,
        code: m.code,
        capacity: Number(m.capacity),
        open_time: m.open_time,
        close_time: m.close_time,
        is_active: !!m.is_active,
      });
      await reloadMesses();
      setNote(`${m.name} updated`);
    } finally {
      setSaving("");
    }
  };

  const addMess = async (e) => {
    e.preventDefault();
    if (!messDraft.name.trim()) return;
    setSaving("new-mess");
    try {
      await base44.entities.Mess.create({
        name: messDraft.name.trim(),
        code: messDraft.code.trim(),
        capacity: Number(messDraft.capacity),
        open_time: messDraft.open_time,
        close_time: messDraft.close_time,
        hostel_type: "coed",
        is_active: true,
        is_demo: false,
      });
      setMessDraft({ name: "", code: "", capacity: 200, open_time: "07:00", close_time: "22:00" });
      await reloadMesses();
      setNote("New mess created");
    } finally {
      setSaving("");
    }
  };

  const saveTiming = async (meal, patch) => {
    const existing = timings.find((t) => t.meal === meal);
    if (existing) {
      const updated = await base44.entities.MessTiming.update(existing.id, patch);
      setTimings((prev) => prev.map((t) => (t.id === existing.id ? { ...t, ...updated } : t)));
    } else {
      const created = await base44.entities.MessTiming.create({
        mess_id: selectedId,
        meal,
        start_time: patch.start_time || "12:00",
        end_time: patch.end_time || "14:30",
        is_active: true,
        is_demo: false,
      });
      setTimings((prev) => [...prev, created]);
    }
  };

  const addStaff = async (e) => {
    e.preventDefault();
    if (!staffDraft.full_name.trim() || !staffDraft.email.trim()) return;
    setSaving("staff");
    try {
      const created = await base44.entities.StaffMember.create({
        full_name: staffDraft.full_name.trim(),
        email: staffDraft.email.trim(),
        role_title: staffDraft.role_title,
        mess_id: selectedId,
        shift: "morning",
        is_active: true,
        is_demo: false,
      });
      setStaff((prev) => [created, ...prev]);
      setStaffDraft({ full_name: "", email: "", role_title: "Mess supervisor" });
      setNote("Staff member added");
    } finally {
      setSaving("");
    }
  };

  const removeStaff = async (member) => {
    await base44.entities.StaffMember.delete(member.id);
    setStaff((prev) => prev.filter((s) => s.id !== member.id));
  };

  if (loading) return <LoadingBlock label="Loading settings…" />;

  return (
    <div className="space-y-6">
      <PageHeading title="Settings" description="Thresholds, mess locations, meal timings and staff records." />

      {note && <div className="rounded-xl border border-neon/25 bg-neon/[0.07] px-4 py-2.5 text-[11.5px] text-neon">{note}</div>}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass p-5">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-neon" />
            <h3 className="text-base font-semibold text-white">Live data thresholds</h3>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {SETTING_FIELDS.map((f) => (
              <label key={f.key} className="block">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{f.label}</span>
                <div className="mt-1 flex items-center gap-1.5">
                  <input
                    value={values[f.key] ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                    className="w-full rounded-lg border border-white/10 bg-[#070d18] px-2.5 py-2 font-mono text-[12px] text-white outline-none focus:border-neon/50"
                  />
                  <span className="shrink-0 text-[9.5px] text-muted-foreground">{f.suffix}</span>
                </div>
              </label>
            ))}
          </div>
          <button
            type="button"
            onClick={saveSettings}
            disabled={saving === "settings"}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-neon px-3.5 py-2 text-[11.5px] font-semibold text-black disabled:opacity-50"
          >
            {saving === "settings" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Save thresholds
          </button>
        </div>

        <div className="glass p-5">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-electric" />
            <h3 className="text-base font-semibold text-white">Mess locations</h3>
            <span className="ml-auto font-mono text-[10px] text-muted-foreground">{messes.length}</span>
          </div>
          <div className="mt-3 space-y-2">
            {messes.map((m) => (
              <MessRow key={m.id} mess={m} saving={saving === m.id} onSave={saveMess} />
            ))}
          </div>
          <form onSubmit={addMess} className="mt-3 grid gap-2 border-t border-white/[0.06] pt-3 sm:grid-cols-2">
            <input
              value={messDraft.name}
              onChange={(e) => setMessDraft((d) => ({ ...d, name: e.target.value }))}
              placeholder="New mess name"
              className="rounded-lg border border-white/10 bg-[#070d18] px-2.5 py-2 text-[11.5px] text-white outline-none focus:border-neon/50"
            />
            <input
              value={messDraft.code}
              onChange={(e) => setMessDraft((d) => ({ ...d, code: e.target.value }))}
              placeholder="Code e.g. BH-04"
              className="rounded-lg border border-white/10 bg-[#070d18] px-2.5 py-2 text-[11.5px] text-white outline-none focus:border-neon/50"
            />
            <input
              type="number"
              min={1}
              value={messDraft.capacity}
              onChange={(e) => setMessDraft((d) => ({ ...d, capacity: e.target.value }))}
              placeholder="Capacity"
              className="rounded-lg border border-white/10 bg-[#070d18] px-2.5 py-2 text-[11.5px] text-white outline-none focus:border-neon/50"
            />
            <button
              type="submit"
              disabled={saving === "new-mess"}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-neon/30 bg-neon/10 px-3 py-2 text-[11.5px] font-semibold text-neon disabled:opacity-50"
            >
              <Plus className="h-3 w-3" /> Add mess
            </button>
          </form>
        </div>

        <div className="glass p-5">
          <div className="flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-ember" />
            <h3 className="text-base font-semibold text-white">Meal timings</h3>
            <span className="ml-auto truncate text-[10px] text-muted-foreground">{selectedMess?.name}</span>
          </div>
          <div className="mt-3 space-y-2">
            {MEALS.map((meal) => {
              const existing = timings.find((t) => t.meal === meal.key);
              return (
                <div key={meal.key} className="flex flex-wrap items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.02] px-2.5 py-2">
                  <span className="w-28 shrink-0 text-[11.5px] text-white">
                    {meal.emoji} {MEAL_LABEL[meal.key]}
                  </span>
                  <input
                    type="time"
                    defaultValue={existing?.start_time || "12:00"}
                    onBlur={(e) => saveTiming(meal.key, { start_time: e.target.value })}
                    className="rounded-lg border border-white/10 bg-[#070d18] px-2 py-1.5 font-mono text-[11px] text-white"
                  />
                  <span className="text-[10px] text-muted-foreground">to</span>
                  <input
                    type="time"
                    defaultValue={existing?.end_time || "14:30"}
                    onBlur={(e) => saveTiming(meal.key, { end_time: e.target.value })}
                    className="rounded-lg border border-white/10 bg-[#070d18] px-2 py-1.5 font-mono text-[11px] text-white"
                  />
                  {existing && <Check className="h-3 w-3 text-neon" />}
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">Changes save when you leave a time field.</p>
        </div>

        <div className="glass p-5">
          <div className="flex items-center gap-2">
            <UserCog className="h-4 w-4 text-neon" />
            <h3 className="text-base font-semibold text-white">Mess staff</h3>
          </div>
          <form onSubmit={addStaff} className="mt-3 grid gap-2 sm:grid-cols-2">
            <input
              value={staffDraft.full_name}
              onChange={(e) => setStaffDraft((d) => ({ ...d, full_name: e.target.value }))}
              placeholder="Staff name"
              className="rounded-lg border border-white/10 bg-[#070d18] px-2.5 py-2 text-[11.5px] text-white outline-none focus:border-neon/50"
            />
            <input
              value={staffDraft.email}
              onChange={(e) => setStaffDraft((d) => ({ ...d, email: e.target.value }))}
              placeholder="Email"
              className="rounded-lg border border-white/10 bg-[#070d18] px-2.5 py-2 text-[11.5px] text-white outline-none focus:border-neon/50"
            />
            <button
              type="submit"
              disabled={saving === "staff"}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-neon/30 bg-neon/10 px-3 py-2 text-[11.5px] font-semibold text-neon disabled:opacity-50 sm:col-span-2"
            >
              <Plus className="h-3 w-3" /> Add staff member
            </button>
          </form>
          <div className="mt-3 space-y-1.5">
            {staff.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">No staff records yet.</p>
            ) : (
              staff.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2">
                  <div className="min-w-0">
                    <div className="truncate text-[11.5px] text-white">{s.full_name}</div>
                    <div className="truncate font-mono text-[9px] text-muted-foreground">{s.role_title} · {s.email}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeStaff(s)}
                    aria-label={`Remove ${s.full_name}`}
                    className="ml-2 shrink-0 text-muted-foreground hover:text-danger"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MessRow({ mess, saving, onSave }) {
  const [draft, setDraft] = useState({
    name: mess.name,
    code: mess.code || "",
    capacity: mess.capacity,
    open_time: mess.open_time || "07:00",
    close_time: mess.close_time || "22:00",
    is_active: mess.is_active !== false,
  });

  return (
    <div className="rounded-lg border border-white/[0.07] bg-white/[0.02] p-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={draft.name}
          onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          className="min-w-[120px] flex-1 rounded-lg border border-white/10 bg-[#070d18] px-2 py-1.5 text-[11.5px] text-white outline-none focus:border-neon/50"
        />
        <input
          value={draft.code}
          onChange={(e) => setDraft((d) => ({ ...d, code: e.target.value }))}
          placeholder="Code"
          className="w-20 rounded-lg border border-white/10 bg-[#070d18] px-2 py-1.5 font-mono text-[10.5px] text-white outline-none focus:border-neon/50"
        />
        <input
          type="number"
          min={1}
          value={draft.capacity}
          onChange={(e) => setDraft((d) => ({ ...d, capacity: e.target.value }))}
          className="w-20 rounded-lg border border-white/10 bg-[#070d18] px-2 py-1.5 font-mono text-[10.5px] text-white outline-none focus:border-neon/50"
        />
        <input
          type="time"
          value={draft.open_time}
          onChange={(e) => setDraft((d) => ({ ...d, open_time: e.target.value }))}
          className="rounded-lg border border-white/10 bg-[#070d18] px-1.5 py-1.5 font-mono text-[10px] text-white"
        />
        <input
          type="time"
          value={draft.close_time}
          onChange={(e) => setDraft((d) => ({ ...d, close_time: e.target.value }))}
          className="rounded-lg border border-white/10 bg-[#070d18] px-1.5 py-1.5 font-mono text-[10px] text-white"
        />
        <label className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <input
            type="checkbox"
            checked={draft.is_active}
            onChange={(e) => setDraft((d) => ({ ...d, is_active: e.target.checked }))}
            className="h-3 w-3 accent-[#22ff9a]"
          />
          Active
        </label>
        <button
          type="button"
          onClick={() => onSave({ ...mess, ...draft })}
          disabled={saving}
          className="ml-auto inline-flex items-center gap-1 rounded-lg bg-neon/15 px-2.5 py-1.5 text-[10.5px] font-semibold text-neon disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Save className="h-2.5 w-2.5" />} Save
        </button>
      </div>
    </div>
  );
}