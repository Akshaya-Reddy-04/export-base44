import React, { useState } from "react";
import { Pencil, Save, X, Loader2 } from "lucide-react";
import { useMess } from "@/lib/MessContext";

const FIELDS = [
  { key: "full_name", label: "Full name", placeholder: "Your name" },
  { key: "roll_number", label: "Roll number", placeholder: "e.g. 21CS1043" },
  { key: "hostel", label: "Hostel / block", placeholder: "e.g. Ganga Block B" },
  { key: "phone", label: "Phone", placeholder: "Optional" },
];

export default function ProfileForm({ profile, onSave }) {
  const { messes, selectedId } = useMess();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(false);

  const start = () => {
    setDraft({
      full_name: profile?.full_name || "",
      roll_number: profile?.roll_number || "",
      hostel: profile?.hostel || "",
      phone: profile?.phone || "",
      dietary_pref: profile?.dietary_pref || "any",
      mess_id: profile?.mess_id || selectedId || "",
    });
    setEditing(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      await onSave(draft);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <button
        type="button"
        onClick={start}
        className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.03] px-3.5 py-2 text-[11.5px] font-medium text-white hover:border-neon/40 hover:text-neon"
      >
        <Pencil className="h-3 w-3" /> Edit details
      </button>
    );
  }

  return (
    <div className="mt-4 w-full rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <label key={f.key} className="block">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{f.label}</span>
            <input
              value={draft[f.key] || ""}
              onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
              className="mt-1 w-full rounded-lg border border-white/10 bg-[#070d18] px-2.5 py-2 text-[12px] text-white outline-none focus:border-neon/50"
            />
          </label>
        ))}
        <label className="block">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Diet preference</span>
          <select
            value={draft.dietary_pref || "any"}
            onChange={(e) => setDraft((d) => ({ ...d, dietary_pref: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-white/10 bg-[#070d18] px-2.5 py-2 text-[12px] text-white outline-none focus:border-neon/50"
          >
            <option value="any">No preference</option>
            <option value="veg">Vegetarian</option>
            <option value="non_veg">Non-vegetarian</option>
          </select>
        </label>
        <label className="block">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Assigned mess</span>
          <select
            value={draft.mess_id || ""}
            onChange={(e) => setDraft((d) => ({ ...d, mess_id: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-white/10 bg-[#070d18] px-2.5 py-2 text-[12px] text-white outline-none focus:border-neon/50"
          >
            <option value="">Not assigned</option>
            {messes.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-lg bg-neon px-3.5 py-2 text-[11.5px] font-semibold text-black disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Save changes
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/12 px-3.5 py-2 text-[11.5px] text-muted-foreground hover:text-white"
        >
          <X className="h-3 w-3" /> Cancel
        </button>
      </div>
    </div>
  );
}