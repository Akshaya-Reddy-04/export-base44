import React from "react";
import { Megaphone, AlertOctagon, CalendarClock, Sparkles } from "lucide-react";

const TYPE_META = {
  emergency: { icon: AlertOctagon, tone: "text-danger", border: "border-danger/30", bg: "bg-danger/10" },
  event: { icon: Sparkles, tone: "text-electric", border: "border-electric/25", bg: "bg-electric/[0.07]" },
  holiday: { icon: CalendarClock, tone: "text-ember", border: "border-ember/25", bg: "bg-ember/[0.07]" },
  menu: { icon: Megaphone, tone: "text-neon", border: "border-neon/25", bg: "bg-neon/[0.06]" },
  general: { icon: Megaphone, tone: "text-neon", border: "border-neon/25", bg: "bg-neon/[0.06]" },
};

export default function NoticeBoard({ notices = [], limit = 4, compact = false }) {
  const shown = notices.slice(0, limit);
  return (
    <div className="glass p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="label-xs">Digital notice board</div>
          <h3 className="mt-1.5 text-base font-semibold text-white">From the mess office</h3>
        </div>
        <Megaphone className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="mt-4 space-y-2.5">
        {shown.length === 0 && (
          <p className="rounded-xl border border-dashed border-white/10 px-3 py-4 text-[11.5px] text-muted-foreground">
            No announcements right now.
          </p>
        )}
        {shown.map((n) => {
          const meta = TYPE_META[n.type] || TYPE_META.general;
          const Icon = meta.icon;
          return (
            <div
              key={n.id}
              className={`rounded-xl border ${meta.border} ${meta.bg} px-3.5 py-3`}
            >
              <div className="flex items-start gap-2.5">
                <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${meta.tone}`} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[12.5px] font-semibold text-white">{n.title}</span>
                    {n.is_emergency && (
                      <span className="rounded bg-danger/20 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-danger">
                        urgent
                      </span>
                    )}
                  </div>
                  <p className={`mt-1 text-[11.5px] leading-relaxed text-slate-300 ${compact ? "line-clamp-2" : ""}`}>
                    {n.body}
                  </p>
                  <div className="mt-1.5 text-[10px] text-muted-foreground">
                    {n.published_by ? `${n.published_by} · ` : ""}
                    {new Date(n.created_date).toLocaleDateString([], { day: "numeric", month: "short" })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}