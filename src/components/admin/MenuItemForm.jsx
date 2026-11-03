import React, { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MEALS } from "@/lib/rush";

const BLANK = {
  name: "",
  meal: "lunch",
  description: "",
  image_url: "",
  food_type: "veg",
  status: "available",
  total_quantity: 0,
  remaining_quantity: 0,
  prepared_quantity: 0,
  served_quantity: 0,
  wasted_quantity: 0,
  plates_remaining: 0,
  low_stock_threshold: 15,
  serving_start: "12:00",
  serving_end: "14:30",
  allergens: "",
  is_special: false,
  price: 0,
};

export default function MenuItemForm({ open, item, onClose, onSave }) {
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(item ? { ...BLANK, ...item } : { ...BLANK });
  }, [open, item?.id]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await onSave({ ...form, name: form.name.trim() });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-[#080e18] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-base text-white">{item ? "Edit dish" : "Add a dish"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Dish name</span>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-[#070d18] px-2.5 py-2 text-[12.5px] text-white outline-none focus:border-neon/50"
            />
          </label>

          <label className="block">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Meal</span>
            <select value={form.meal} onChange={(e) => set("meal", e.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-[#070d18] px-2.5 py-2 text-[12px] text-white">
              {MEALS.map((m) => (
                <option key={m.key} value={m.key}>{m.label}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Food type</span>
            <select value={form.food_type} onChange={(e) => set("food_type", e.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-[#070d18] px-2.5 py-2 text-[12px] text-white">
              <option value="veg">Veg</option>
              <option value="egg">Egg</option>
              <option value="non_veg">Non-veg</option>
            </select>
          </label>

          <label className="block sm:col-span-2">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Description</span>
            <input
              value={form.description || ""}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Short description students will read"
              className="mt-1 w-full rounded-lg border border-white/10 bg-[#070d18] px-2.5 py-2 text-[12px] text-white outline-none focus:border-neon/50"
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Image URL (optional)</span>
            <input
              value={form.image_url || ""}
              onChange={(e) => set("image_url", e.target.value)}
              placeholder="https://…"
              className="mt-1 w-full rounded-lg border border-white/10 bg-[#070d18] px-2.5 py-2 text-[12px] text-white outline-none focus:border-neon/50"
            />
          </label>

          <label className="block">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Serving start</span>
            <input type="time" value={form.serving_start || ""} onChange={(e) => set("serving_start", e.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-[#070d18] px-2.5 py-2 text-[12px] text-white" />
          </label>
          <label className="block">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Serving end</span>
            <input type="time" value={form.serving_end || ""} onChange={(e) => set("serving_end", e.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-[#070d18] px-2.5 py-2 text-[12px] text-white" />
          </label>

          {[
            { key: "total_quantity", label: "Total prepared" },
            { key: "remaining_quantity", label: "Remaining" },
            { key: "served_quantity", label: "Served" },
            { key: "wasted_quantity", label: "Wasted" },
            { key: "low_stock_threshold", label: "Low stock alert at" },
          ].map((f) => (
            <label key={f.key} className="block">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{f.label}</span>
              <input
                type="number"
                min={0}
                value={form[f.key] ?? 0}
                onChange={(e) => set(f.key, Math.max(0, Number(e.target.value)))}
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#070d18] px-2.5 py-2 font-mono text-[12px] text-white"
              />
            </label>
          ))}

          <label className="block sm:col-span-2">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Allergens (optional)</span>
            <input
              value={form.allergens || ""}
              onChange={(e) => set("allergens", e.target.value)}
              placeholder="e.g. Contains peanuts"
              className="mt-1 w-full rounded-lg border border-white/10 bg-[#070d18] px-2.5 py-2 text-[12px] text-white outline-none focus:border-neon/50"
            />
          </label>

          <label className="flex items-center gap-2 text-[11.5px] text-muted-foreground">
            <input type="checkbox" checked={!!form.is_special} onChange={(e) => set("is_special", e.target.checked)} className="h-3.5 w-3.5 accent-[#22ff9a]" />
            Mark as today's special
          </label>
          <label className="flex items-center gap-2 text-[11.5px] text-muted-foreground">
            <input type="checkbox" checked={form.status === "sold_out"} onChange={(e) => set("status", e.target.checked ? "sold_out" : "available")} className="h-3.5 w-3.5 accent-[#ff4d6d]" />
            Sold out
          </label>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={save}
            disabled={saving || !form.name.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-neon px-4 py-2 text-[12px] font-semibold text-black disabled:opacity-40"
          >
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} {item ? "Save changes" : "Add dish"}
          </button>
          <button type="button" onClick={onClose} className="rounded-lg border border-white/12 px-4 py-2 text-[12px] text-muted-foreground hover:text-white">
            Cancel
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}