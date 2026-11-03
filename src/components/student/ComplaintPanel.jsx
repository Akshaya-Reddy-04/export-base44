import React, { useEffect, useState } from "react";
import { MessageSquareWarning, Send, Loader2, CheckCircle2, Clock3, Eye, Wrench } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { pageItems } from "@/hooks/useMessData";
import { useMess } from "@/lib/MessContext";
import { useAuth } from "@/lib/AuthContext";

const CATEGORIES = [
  { key: "food_quality", label: "Food quality" },
  { key: "hygiene", label: "Hygiene" },
  { key: "service", label: "Service" },
  { key: "suggestion", label: "Suggestion" },
  { key: "general", label: "General feedback" },
];

const STATUS = {
  submitted: { label: "Submitted", icon: Clock3, className: "border-white/15 bg-white/[0.04] text-slate-300" },
  under_review: { label: "Under review", icon: Eye, className: "border-electric/30 bg-electric/10 text-electric" },
  in_progress: { label: "In progress", icon: Wrench, className: "border-ember/30 bg-ember/10 text-ember" },
  resolved: { label: "Resolved", icon: CheckCircle2, className: "border-neon/30 bg-neon/10 text-neon" },
};

export default function ComplaintPanel() {
  const { user } = useAuth();
  const mess = useMess();
  const [category, setCategory] = useState("food_quality");
  const [description, setDescription] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mine, setMine] = useState([]);
  const [done, setDone] = useState(false);

  const load = async () => {
    const res = await base44.entities.Complaint.list({ sort: "-created_date", limit: 30 });
    setMine(pageItems(res));
  };

  useEffect(() => {
    if (user) load();
  }, [user?.email]);

  const submit = async (e) => {
    e.preventDefault();
    if (!description.trim()) return;
    setSaving(true);
    try {
      await base44.entities.Complaint.create({
        mess_id: mess.selectedId,
        mess_name: mess.selectedMess?.name || "",
        category,
        description: description.trim(),
        is_anonymous: anonymous,
        student_name: anonymous ? "Anonymous" : user?.full_name || "Student",
        student_email: anonymous ? "" : user?.email || "",
        status: "submitted",
        is_demo: false,
      });
      setDescription("");
      setDone(true);
      setTimeout(() => setDone(false), 4000);
      await load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="glass p-5">
        <div className="flex items-center gap-2">
          <MessageSquareWarning className="h-4 w-4 text-ember" />
          <h3 className="text-base font-semibold text-white">Feedback & complaints</h3>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Goes straight to the mess team for {mess.selectedMess?.name || "your mess"}.
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setCategory(c.key)}
              className={`rounded-full border px-2.5 py-1 text-[10.5px] transition-colors ${
                category === c.key
                  ? "border-neon/40 bg-neon/10 text-neon"
                  : "border-white/10 text-muted-foreground hover:text-white"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          maxLength={600}
          placeholder="Tell the mess team what happened…"
          className="mt-3 w-full resize-none rounded-xl border border-white/10 bg-[#070d18] px-3 py-2.5 text-[12px] text-white outline-none placeholder:text-muted-foreground/70 focus:border-neon/50"
        />

        <div className="mt-2 flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2 text-[11px] text-muted-foreground">
            <input
              type="checkbox"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
              className="h-3.5 w-3.5 accent-[#22ff9a]"
            />
            Submit anonymously
          </label>
          <button
            type="submit"
            disabled={saving || !description.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-neon px-3.5 py-2 text-[11.5px] font-semibold text-black disabled:opacity-40"
          >
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
            {saving ? "Sending…" : "Submit"}
          </button>
        </div>
        {done && <p className="mt-2 text-[11px] text-neon">Received — the mess team will review this.</p>}
      </form>

      {mine.length > 0 && (
        <div className="glass p-5">
          <div className="label-xs mb-3">My submissions</div>
          <div className="space-y-2">
            {mine.slice(0, 6).map((c) => {
              const meta = STATUS[c.status] || STATUS.submitted;
              const Icon = meta.icon;
              return (
                <div key={c.id} className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-2 text-[11.5px] text-slate-200">{c.description}</p>
                    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[9.5px] ${meta.className}`}>
                      <Icon className="h-2.5 w-2.5" /> {meta.label}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[9.5px] text-muted-foreground">
                    <span className="uppercase tracking-wider">{c.category.replace("_", " ")}</span>
                    <span>{new Date(c.created_date).toLocaleDateString([], { day: "numeric", month: "short" })}</span>
                  </div>
                  {c.admin_reply && (
                    <div className="mt-2 rounded-lg border border-neon/20 bg-neon/[0.06] px-2.5 py-2 text-[10.5px] text-neon">
                      <span className="font-semibold">Mess office: </span>
                      {c.admin_reply}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}