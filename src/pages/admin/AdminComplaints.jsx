import React, { useEffect, useMemo, useState } from "react";
import { MessageSquareWarning, Send, Loader2, CheckCircle2, Clock3, Eye, Wrench } from "lucide-react";
import { PageHeading } from "@/components/rr/GlassCard";
import { LoadingBlock, EmptyState } from "@/components/rr/EmptyState";
import { useMess } from "@/lib/MessContext";
import { base44 } from "@/api/base44Client";
import { pageItems } from "@/hooks/useMessData";
import { cn } from "@/lib/utils";

const STATUS_META = {
  submitted: { label: "Submitted", icon: Clock3, className: "border-white/15 text-slate-300" },
  under_review: { label: "Under review", icon: Eye, className: "border-electric/30 text-electric" },
  in_progress: { label: "In progress", icon: Wrench, className: "border-ember/30 text-ember" },
  resolved: { label: "Resolved", icon: CheckCircle2, className: "border-neon/30 text-neon" },
};

const FILTERS = ["all", "submitted", "under_review", "in_progress", "resolved"];

export default function AdminComplaints() {
  const mess = useMess();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [replies, setReplies] = useState({});
  const [busyId, setBusyId] = useState("");

  const load = () => {
    base44.entities.Complaint.list({ sort: "-created_date", limit: 100 }).then((res) => {
      setRows(pageItems(res).filter((c) => c.mess_id === mess.selectedId || !c.mess_id));
      setLoading(false);
    });
  };

  useEffect(load, [mess.selectedId]);

  const filtered = useMemo(
    () => (filter === "all" ? rows : rows.filter((r) => r.status === filter)),
    [rows, filter]
  );

  const counts = useMemo(
    () => ({
      all: rows.length,
      submitted: rows.filter((r) => r.status === "submitted").length,
      under_review: rows.filter((r) => r.status === "under_review").length,
      in_progress: rows.filter((r) => r.status === "in_progress").length,
      resolved: rows.filter((r) => r.status === "resolved").length,
    }),
    [rows]
  );

  const update = async (row, patch) => {
    setBusyId(row.id);
    try {
      const updated = await base44.entities.Complaint.update(row.id, patch);
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, ...updated } : r)));
      setReplies((prev) => ({ ...prev, [row.id]: "" }));
    } finally {
      setBusyId("");
    }
  };

  if (loading) return <LoadingBlock label="Loading the complaints inbox…" />;

  return (
    <div className="space-y-6">
      <PageHeading title="Complaints & feedback" description="Reply to students and move each case to resolved." />

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-[11px] font-medium capitalize transition-colors",
              filter === f ? "border-neon/40 bg-neon/10 text-neon" : "border-white/10 text-muted-foreground hover:text-white"
            )}
          >
            {f.replace("_", " ")}
            <span className="ml-1.5 font-mono text-[10px] opacity-70">{counts[f]}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={MessageSquareWarning} title="Nothing here" description="No complaints match this filter for this mess." />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((row) => {
            const meta = STATUS_META[row.status] || STATUS_META.submitted;
            const Icon = meta.icon;
            return (
              <div key={row.id} className="glass p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9.5px] uppercase tracking-wider", meta.className)}>
                        <Icon className="h-2.5 w-2.5" /> {meta.label}
                      </span>
                      <span className="rounded-full border border-white/10 px-2 py-0.5 text-[9.5px] uppercase tracking-wider text-muted-foreground">
                        {row.category.replace("_", " ")}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {row.is_anonymous ? "Anonymous" : row.student_name || "Student"} ·{" "}
                        {new Date(row.created_date).toLocaleDateString([], { day: "numeric", month: "short" })}
                      </span>
                    </div>
                    <p className="mt-2 text-[12.5px] leading-relaxed text-slate-200">{row.description}</p>
                    {row.admin_reply && (
                      <div className="mt-2 rounded-lg border border-neon/20 bg-neon/[0.06] px-3 py-2 text-[11px] text-neon">
                        <span className="font-semibold">Reply sent: </span>
                        {row.admin_reply}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start">
                  <textarea
                    value={replies[row.id] ?? ""}
                    onChange={(e) => setReplies((r) => ({ ...r, [row.id]: e.target.value }))}
                    rows={2}
                    placeholder="Write a reply the student will see…"
                    className="flex-1 resize-none rounded-lg border border-white/10 bg-[#070d18] px-2.5 py-2 text-[11.5px] text-white outline-none placeholder:text-muted-foreground/60 focus:border-neon/50"
                  />
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      disabled={busyId === row.id || !(replies[row.id] || "").trim()}
                      onClick={() => update(row, { admin_reply: replies[row.id].trim(), status: row.status === "submitted" ? "under_review" : row.status })}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-neon px-3 py-2 text-[11px] font-semibold text-black disabled:opacity-40"
                    >
                      {busyId === row.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />} Reply
                    </button>
                    {["under_review", "in_progress", "resolved"].map((s) => (
                      <button
                        key={s}
                        type="button"
                        disabled={busyId === row.id || row.status === s}
                        onClick={() => update(row, { status: s, resolved_at: s === "resolved" ? new Date().toISOString() : null })}
                        className="rounded-lg border border-white/12 px-2.5 py-2 text-[10.5px] capitalize text-slate-300 hover:border-neon/40 hover:text-neon disabled:opacity-40"
                      >
                        {s.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}