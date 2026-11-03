import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, MapPin } from "lucide-react";
import CrowdBadge from "@/components/rr/CrowdBadge";
import { formatWait } from "@/lib/rush";

// Rush Radar live map: every mess plotted with its crowd level.
export default function MessLiveGrid({ rows, loading }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {(loading ? Array.from({ length: 3 }) : rows).map((row, i) =>
        loading ? (
          <div key={i} className="glass h-[132px] animate-pulse opacity-60" />
        ) : (
          <Link
            key={row.mess.id}
            to="/dashboard"
            className="glass glass-hover group relative overflow-hidden p-5"
          >
            <span
              className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-25 blur-2xl transition-opacity group-hover:opacity-45"
              style={{ background: row.level.hex }}
            />
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  <MapPin className="h-3 w-3" /> {row.mess.location_label || "Campus"}
                </div>
                <h3 className="mt-1.5 truncate text-[15px] font-semibold text-white">{row.mess.name}</h3>
              </div>
              <CrowdBadge level={row.level} showDot={false} className="shrink-0 px-2 py-0.5 text-[9.5px]" />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="stat-num text-base font-semibold" style={{ color: row.level.hex }}>{row.pct}%</div>
                <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Occupied</div>
              </div>
              <div>
                <div className="stat-num text-base font-semibold text-white">{row.queue?.waiting_students ?? 0}</div>
                <div className="text-[9px] uppercase tracking-wider text-muted-foreground">In queue</div>
              </div>
              <div>
                <div className="stat-num text-base font-semibold text-white">{formatWait(row.wait)}</div>
                <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Wait</div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-[11px] text-neon opacity-0 transition-opacity group-hover:opacity-100">
              Open live view <ArrowRight className="h-3 w-3" />
            </div>
          </Link>
        )
      )}
    </div>
  );
}