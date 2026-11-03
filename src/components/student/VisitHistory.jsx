import React, { useEffect, useState } from "react";
import { History, LogIn, LogOut } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { pageItems } from "@/hooks/useMessData";
import { clockTime } from "@/lib/rush";

export default function VisitHistory({ studentId }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }
    base44.entities.Attendance.filter(
      { student_id: studentId },
      { sort: "-entry_time", limit: 40 }
    ).then((res) => {
      setRows(pageItems(res));
      setLoading(false);
    });
  }, [studentId]);

  const minutes = (row) => {
    if (!row.exit_time) return null;
    const diff = (new Date(row.exit_time) - new Date(row.entry_time)) / 60000;
    return Math.max(1, Math.round(diff));
  };

  return (
    <div className="glass p-5">
      <div className="flex items-center gap-2">
        <History className="h-4 w-4 text-electric" />
        <h3 className="text-base font-semibold text-white">Mess visit history</h3>
        <span className="ml-auto font-mono text-[10px] text-muted-foreground">last {rows.length}</span>
      </div>

      {loading ? (
        <p className="mt-3 text-[11.5px] text-muted-foreground">Loading gate log…</p>
      ) : rows.length === 0 ? (
        <p className="mt-3 text-[11.5px] text-muted-foreground">
          No recorded visits yet. Staff scan your QR pass at the mess entrance.
        </p>
      ) : (
        <div className="scroll-thin mt-3 max-h-[280px] space-y-1.5 overflow-y-auto pr-1">
          {rows.map((row) => {
            const spent = minutes(row);
            return (
              <div key={row.id} className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[11.5px] font-medium text-white">{row.mess_name || "Mess"}</div>
                  <div className="font-mono text-[9.5px] text-muted-foreground">
                    {new Date(row.entry_time).toLocaleDateString([], { day: "numeric", month: "short" })}
                  </div>
                </div>
                <div className="flex items-center gap-2 font-mono text-[10.5px]">
                  <span className="inline-flex items-center gap-1 text-neon">
                    <LogIn className="h-2.5 w-2.5" /> {clockTime(row.entry_time)}
                  </span>
                  <span className="inline-flex items-center gap-1 text-slate-400">
                    <LogOut className="h-2.5 w-2.5" /> {row.exit_time ? clockTime(row.exit_time) : "—"}
                  </span>
                </div>
                <span className="w-12 shrink-0 text-right font-mono text-[9.5px] text-muted-foreground">
                  {spent ? `${spent}m` : "open"}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}