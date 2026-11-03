import React, { useEffect, useState } from "react";
import { Boxes, Plus, Minus, Trash2, Utensils, Loader2, AlertTriangle } from "lucide-react";
import { PageHeading } from "@/components/rr/GlassCard";
import StatTile from "@/components/rr/StatTile";
import StockBar from "@/components/rr/StockBar";
import { LoadingBlock, EmptyState } from "@/components/rr/EmptyState";
import { useMess } from "@/lib/MessContext";
import { useAuth } from "@/lib/AuthContext";
import { useMenu } from "@/hooks/useMessContent";
import { base44 } from "@/api/base44Client";
import { pageItems } from "@/hooks/useMessData";
import { isLowStock, MEAL_LABEL } from "@/lib/rush";

// Adjust stock by preparing more, serving, wasting or restocking. Each change
// writes a FoodTransaction row so reports stay auditable.
export default function AdminInventory() {
  const { user } = useAuth();
  const mess = useMess();
  const { selectedId } = mess;
  const { items, loading, reload } = useMenu(selectedId);
  const [txns, setTxns] = useState([]);
  const [qty, setQty] = useState({});
  const [busy, setBusy] = useState("");

  const loadTxns = () => {
    base44.entities.FoodTransaction.filter({ mess_id: selectedId }, { sort: "-created_date", limit: 40 }).then((res) => {
      setTxns(pageItems(res));
    });
  };

  useEffect(() => {
    if (selectedId) loadTxns();
  }, [selectedId]);

  const adjust = async (item, type, sign) => {
    const amount = Math.max(0, Number(qty[item.id] ?? 10));
    if (!amount) return;
    setBusy(item.id + type);
    try {
      const total = Number(item.total_quantity || 0);
      const remaining = Number(item.remaining_quantity || 0);
      const served = Number(item.served_quantity || 0);
      const wasted = Number(item.wasted_quantity || 0);

      let patch = {};
      if (type === "prepared") {
        patch = {
          total_quantity: total + amount,
          prepared_quantity: Number(item.prepared_quantity || 0) + amount,
          remaining_quantity: remaining + amount,
          status: "available",
        };
      } else if (type === "served") {
        patch = { remaining_quantity: Math.max(0, remaining - amount), served_quantity: served + amount };
      } else if (type === "wasted") {
        patch = { remaining_quantity: Math.max(0, remaining - amount), wasted_quantity: wasted + amount };
      } else if (type === "restocked") {
        patch = { remaining_quantity: remaining + amount, total_quantity: total + amount };
      }

      patch.plates_remaining = patch.remaining_quantity ?? remaining;

      await base44.entities.MenuItem.update(item.id, patch);
      await base44.entities.FoodTransaction.create({
        mess_id: selectedId,
        menu_item_id: item.id,
        item_name: item.name,
        meal: item.meal,
        type,
        quantity: sign * amount,
        staff_name: user?.full_name || "Staff",
        is_demo: false,
      });
      await Promise.all([reload(), loadTxns()]);
    } finally {
      setBusy("");
    }
  };

  if (loading) return <LoadingBlock label="Loading kitchen stock…" />;

  const totalPrepared = items.reduce((s, i) => s + Number(i.total_quantity || 0), 0);
  const totalServed = items.reduce((s, i) => s + Number(i.served_quantity || 0), 0);
  const totalWasted = items.reduce((s, i) => s + Number(i.wasted_quantity || 0), 0);
  const wastePct = totalPrepared ? Math.round((totalWasted / totalPrepared) * 100) : 0;
  const lowStock = items.filter((i) => isLowStock(i, mess.settings.low_stock_threshold));

  return (
    <div className="space-y-6">
      <PageHeading title="Food inventory" description="Track what was prepared, served and wasted — every change is logged." />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Prepared" value={totalPrepared} icon={Utensils} tone="electric" hint="plates today" />
        <StatTile label="Served" value={totalServed} icon={Boxes} tone="neon" hint="handed out" />
        <StatTile label="Wasted" value={totalWasted} icon={Trash2} tone="danger" hint={`${wastePct}% of prepared`} />
        <StatTile label="Low stock" value={lowStock.length} icon={AlertTriangle} tone="ember" hint="dishes to watch" />
      </div>

      {items.length === 0 ? (
        <EmptyState title="No dishes to track" description="Add dishes from the menu management page first." />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {items.map((item) => (
            <div key={item.id} className="glass p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-medium text-white">{item.name}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {MEAL_LABEL[item.meal]} · {item.served_quantity ?? 0} served · {item.wasted_quantity ?? 0} wasted
                  </div>
                </div>
                <span className="shrink-0 font-mono text-[11px] text-white">{item.remaining_quantity ?? 0} left</span>
              </div>

              <div className="mt-2">
                <StockBar item={item} threshold={mess.settings.low_stock_threshold} />
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <input
                  type="number"
                  min={1}
                  value={qty[item.id] ?? 10}
                  onChange={(e) => setQty((q) => ({ ...q, [item.id]: Number(e.target.value) }))}
                  className="w-16 rounded-lg border border-white/10 bg-[#070d18] px-2 py-1.5 text-center font-mono text-[11px] text-white outline-none focus:border-neon/50"
                />
                {[
                  { type: "prepared", label: "Prepared", icon: Plus, cls: "hover:border-electric/40 hover:text-electric" },
                  { type: "served", label: "Served", icon: Utensils, cls: "hover:border-neon/40 hover:text-neon" },
                  { type: "wasted", label: "Wasted", icon: Trash2, cls: "hover:border-danger/40 hover:text-danger" },
                  { type: "restocked", label: "Restock", icon: Plus, cls: "hover:border-white/30 hover:text-white" },
                ].map((a) => (
                  <button
                    key={a.type}
                    type="button"
                    disabled={busy === item.id + a.type}
                    onClick={() => adjust(item, a.type, a.type === "wasted" || a.type === "served" ? -1 : 1)}
                    className={`inline-flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1.5 text-[10.5px] text-slate-300 disabled:opacity-40 ${a.cls}`}
                  >
                    {busy === item.id + a.type ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <a.icon className="h-2.5 w-2.5" />}
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="glass p-5">
        <div className="label-xs">Recent stock activity</div>
        {txns.length === 0 ? (
          <p className="mt-2 text-[11.5px] text-muted-foreground">No adjustments logged yet.</p>
        ) : (
          <div className="scroll-thin mt-3 max-h-[260px] space-y-1 overflow-y-auto pr-1">
            {txns.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 text-[11px]">
                <span className="truncate text-slate-200">
                  <span className="uppercase tracking-wider text-muted-foreground">{t.type}</span> · {t.item_name}
                </span>
                <span className="ml-2 shrink-0 font-mono text-[10px] text-white">{t.quantity > 0 ? "+" : ""}{t.quantity}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}