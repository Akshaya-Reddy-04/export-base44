import React from "react";
import { stockPct, isLowStock } from "@/lib/rush";
import { cn } from "@/lib/utils";

export default function StockBar({ item, threshold, showNumbers = true, className }) {
  const pct = stockPct(item);
  const soldOut = item?.status === "sold_out" || Number(item?.remaining_quantity || 0) <= 0;
  const low = !soldOut && isLowStock(item, threshold);
  const color = soldOut ? "#64748b" : low ? "#ff8a3d" : pct < 60 ? "#fde047" : "#22ff9a";

  return (
    <div className={cn("w-full", className)}>
      {showNumbers && (
        <div className="mb-1.5 flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground">
            {soldOut ? "Sold out" : low ? "Low stock" : "In stock"}
          </span>
          <span className="font-mono tabular-nums" style={{ color }}>
            {item?.remaining_quantity ?? 0} / {item?.total_quantity ?? 0} plates
          </span>
        </div>
      )}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${soldOut ? 100 : Math.max(2, pct)}%`, background: color, boxShadow: `0 0 12px ${color}66` }}
        />
      </div>
    </div>
  );
}