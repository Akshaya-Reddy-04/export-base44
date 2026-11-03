import React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export default function RatingStars({ value = 0, onChange, size = 16, className, showValue = false }) {
  const interactive = typeof onChange === "function";
  const countLabel = Number(value || 0).toFixed(1);
  return (
    <div className={cn("inline-flex items-center gap-1", className)}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = value >= star - 0.25;
        return interactive ? (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
            className="rounded p-0.5 transition-transform hover:scale-125 focus:outline-none focus-visible:ring-2 focus-visible:ring-neon/60"
          >
            <Star
              style={{ width: size, height: size }}
              className={filled ? "fill-yellow-300 text-yellow-300" : "text-white/25"}
            />
          </button>
        ) : (
          <Star
            key={star}
            style={{ width: size, height: size }}
            className={filled ? "fill-yellow-300 text-yellow-300" : "text-white/20"}
          />
        );
      })}
      {showValue && <span className="ml-1 font-mono text-[11px] text-muted-foreground">{countLabel}</span>}
    </div>
  );
}