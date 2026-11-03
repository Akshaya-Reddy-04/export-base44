import React from "react";
import { Link } from "react-router-dom";
import { UtensilsCrossed, AlertTriangle, ArrowRight, Salad } from "lucide-react";
import StockBar from "@/components/rr/StockBar";
import { MEAL_LABEL, stockPct } from "@/lib/rush";

export default function QuickInfo({ meal, mealLabel, items = [], timings = [], mess, threshold = 15 }) {
  const mealItems = items.filter((i) => i.meal === meal && i.is_active !== false);
  const remaining = mealItems.reduce((sum, i) => sum + Number(i.remaining_quantity || 0), 0);
  const lowCount = mealItems.filter((i) => stockPct(i) <= 25 || i.status === "sold_out").length;
  const timing = timings.find((t) => t.meal === meal);

  return (
    <div className="glass p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="label-xs">Quick information</div>
          <h3 className="mt-1.5 flex items-center gap-2 text-base font-semibold text-white">
            <UtensilsCrossed className="h-4 w-4 text-neon" />
            {mealLabel || MEAL_LABEL[meal] || "Meal"} service
          </h3>
        </div>
        <Link to="/menu" className="text-[11px] font-medium text-neon hover:underline">
          Full menu
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2.5">
          <div className="label-xs">Serving window</div>
          <div className="mt-1 font-mono text-[12.5px] text-white">
            {timing ? `${timing.start_time} – ${timing.end_time}` : "—"}
          </div>
        </div>
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2.5">
          <div className="label-xs">Plates left</div>
          <div className="mt-1 font-mono text-[12.5px] text-white">{remaining} plates</div>
        </div>
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2.5">
          <div className="label-xs">Mess hours</div>
          <div className="mt-1 font-mono text-[12.5px] text-white">
            {mess?.open_time || "07:00"} – {mess?.close_time || "22:00"}
          </div>
        </div>
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2.5">
          <div className="label-xs">Low stock</div>
          <div className="mt-1 flex items-center gap-1.5 font-mono text-[12.5px]" style={{ color: lowCount ? "#ff8a3d" : "#22ff9a" }}>
            {lowCount > 0 && <AlertTriangle className="h-3 w-3" />}
            {lowCount ? `${lowCount} item${lowCount > 1 ? "s" : ""}` : "All good"}
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="label-xs">On the counter</span>
          <span className="font-mono text-[10px] text-muted-foreground">{mealItems.length} items</span>
        </div>
        {mealItems.length === 0 && (
          <div className="flex items-center gap-2 rounded-xl border border-dashed border-white/10 px-3 py-4 text-[11.5px] text-muted-foreground">
            <Salad className="h-3.5 w-3.5" /> Menu for this meal is not published yet.
          </div>
        )}
        {mealItems.slice(0, 4).map((item) => (
          <div key={item.id}>
            <div className="mb-1 flex items-center justify-between gap-2 text-[12px]">
              <span className="flex min-w-0 items-center gap-1.5">
                <span
                  className="h-2 w-2 shrink-0 rounded-sm"
                  style={{ background: item.food_type === "veg" ? "#22ff9a" : item.food_type === "egg" ? "#fde047" : "#ff4d6d" }}
                />
                <span className="truncate text-slate-200">{item.name}</span>
              </span>
              <span className="shrink-0 font-mono text-[10.5px] text-muted-foreground">
                {item.status === "sold_out" ? "sold out" : `${item.remaining_quantity} left`}
              </span>
            </div>
            <StockBar item={item} showNumbers={false} threshold={threshold} />
          </div>
        ))}
        {mealItems.length > 4 && (
          <Link to="/menu" className="inline-flex items-center gap-1 text-[11px] text-neon hover:underline">
            +{mealItems.length - 4} more items <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>
    </div>
  );
}