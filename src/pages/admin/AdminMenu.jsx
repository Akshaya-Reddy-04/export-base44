import React, { useState } from "react";
import { Plus, Pencil, Trash2, UtensilsCrossed, Flame, ToggleLeft, ToggleRight } from "lucide-react";
import { PageHeading } from "@/components/rr/GlassCard";
import MenuItemForm from "@/components/admin/MenuItemForm";
import { LoadingBlock, EmptyState } from "@/components/rr/EmptyState";
import { useMess } from "@/lib/MessContext";
import { useMenu } from "@/hooks/useMessContent";
import { base44 } from "@/api/base44Client";
import { MEALS, MEAL_LABEL, FOOD_TYPE_STYLES, stockPct } from "@/lib/rush";

export default function AdminMenu() {
  const mess = useMess();
  const { selectedId, selectedMess } = mess;
  const { items, loading, reload } = useMenu(selectedId);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [busyId, setBusyId] = useState("");

  const save = async (data) => {
    const payload = { ...data, mess_id: selectedId, mess_name: selectedMess?.name || "", is_demo: false };
    if (editing?.id) {
      await base44.entities.MenuItem.update(editing.id, payload);
    } else {
      await base44.entities.MenuItem.create(payload);
    }
    await reload();
  };

  const remove = async (item) => {
    setBusyId(item.id);
    try {
      await base44.entities.MenuItem.delete(item.id);
      await reload();
    } finally {
      setBusyId("");
    }
  };

  const toggleSoldOut = async (item) => {
    setBusyId(item.id);
    try {
      await base44.entities.MenuItem.update(item.id, {
        status: item.status === "sold_out" ? "available" : "sold_out",
      });
      await reload();
    } finally {
      setBusyId("");
    }
  };

  if (loading) return <LoadingBlock label="Loading menu…" />;

  return (
    <div className="space-y-6">
      <PageHeading title="Menu management" description="Publish dishes, set quantities and serving windows for this mess.">
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
          className="inline-flex items-center gap-1.5 rounded-full bg-neon px-4 py-2 text-[12px] font-semibold text-black"
        >
          <Plus className="h-3.5 w-3.5" /> Add dish
        </button>
      </PageHeading>

      {items.length === 0 ? (
        <EmptyState icon={UtensilsCrossed} title="No dishes yet" description="Add today's menu so students know what's cooking." />
      ) : (
        MEALS.map((meal) => {
          const mealItems = items.filter((i) => i.meal === meal.key);
          if (mealItems.length === 0) return null;
          return (
            <div key={meal.key}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-base">{meal.emoji}</span>
                <h3 className="text-sm font-semibold text-white">{MEAL_LABEL[meal.key]}</h3>
                <span className="font-mono text-[10px] text-muted-foreground">{mealItems.length} dishes · {meal.window}</span>
              </div>
              <div className="space-y-1.5">
                {mealItems.map((item) => {
                  const type = FOOD_TYPE_STYLES[item.food_type] || FOOD_TYPE_STYLES.veg;
                  const pct = stockPct(item);
                  return (
                    <div key={item.id} className="glass flex flex-wrap items-center gap-3 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`h-1.5 w-1.5 rounded-full ${type.dot}`} />
                          <span className="truncate text-[13px] font-medium text-white">{item.name}</span>
                          {item.is_special && <Flame className="h-3 w-3 shrink-0 text-ember" />}
                          {item.status === "sold_out" && (
                            <span className="rounded-full border border-danger/30 bg-danger/10 px-2 py-0.5 text-[9px] uppercase tracking-wider text-danger">sold out</span>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-3 font-mono text-[10px] text-muted-foreground">
                          <span>{item.remaining_quantity ?? 0}/{item.total_quantity ?? 0} left</span>
                          <span>{pct}%</span>
                          <span>{item.serving_start}–{item.serving_end}</span>
                          <span>★ {Number(item.rating_avg || 0).toFixed(1)} ({item.rating_count || 0})</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={busyId === item.id}
                          onClick={() => toggleSoldOut(item)}
                          className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-[10.5px] text-slate-300 hover:border-white/25 hover:text-white disabled:opacity-40"
                        >
                          {item.status === "sold_out" ? <ToggleLeft className="h-3 w-3" /> : <ToggleRight className="h-3 w-3 text-neon" />}
                          {item.status === "sold_out" ? "Mark available" : "Mark sold out"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(item);
                            setOpen(true);
                          }}
                          className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 text-slate-300 hover:border-neon/40 hover:text-neon"
                          aria-label={`Edit ${item.name}`}
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          disabled={busyId === item.id}
                          onClick={() => remove(item)}
                          className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 text-slate-300 hover:border-danger/40 hover:text-danger disabled:opacity-40"
                          aria-label={`Delete ${item.name}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}

      <MenuItemForm open={open} item={editing} onClose={() => setOpen(false)} onSave={save} />
    </div>
  );
}