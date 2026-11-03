import React, { useState } from "react";
import { Minus, Plus, Check, Loader2 } from "lucide-react";

export default function QuickUpdate({ label, value, step = 1, min = 0, saving, onSave, suffix }) {
  const [draft, setDraft] = useState(null);
  const current = draft === null ? Number(value || 0) : draft;
  const dirty = draft !== null && draft !== Number(value || 0);

  const bump = (delta) => setDraft(Math.max(min, current + delta));

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-3">
      <div className="flex items-center justify-between">
        <span className="label-xs">{label}</span>
        {suffix && <span className="font-mono text-[9.5px] text-muted-foreground">{suffix}</span>}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() => bump(-step)}
          aria-label={`Decrease ${label}`}
          className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-slate-300 hover:border-white/25 hover:text-white"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="stat-num min-w-10 flex-1 text-center text-2xl font-semibold text-white">{current}</span>
        <button
          type="button"
          onClick={() => bump(step)}
          aria-label={`Increase ${label}`}
          className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-slate-300 hover:border-white/25 hover:text-white"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      <button
        type="button"
        disabled={!dirty || saving}
        onClick={async () => {
          await onSave(current);
          setDraft(null);
        }}
        className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-neon/15 px-3 py-1.5 text-[11px] font-semibold text-neon disabled:opacity-35"
      >
        {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
        {saving ? "Saving…" : dirty ? "Save" : "Up to date"}
      </button>
    </div>
  );
}