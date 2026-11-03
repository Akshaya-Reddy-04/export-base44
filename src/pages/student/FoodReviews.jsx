import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Star, Send, Loader2, Quote } from "lucide-react";
import { PageHeading } from "@/components/rr/GlassCard";
import RatingStars from "@/components/rr/RatingStars";
import { LoadingBlock, EmptyState } from "@/components/rr/EmptyState";
import { useMess } from "@/lib/MessContext";
import { useMenu, useReviews } from "@/hooks/useMessContent";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { MEAL_LABEL } from "@/lib/rush";

export default function FoodReviews() {
  const mess = useMess();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { items, reload: reloadMenu } = useMenu(mess.selectedId);
  const { reviews, loading, reload } = useReviews(mess.selectedId);

  const [itemId, setItemId] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const messReviews = useMemo(
    () => reviews.filter((r) => !r.mess_id || r.mess_id === mess.selectedId),
    [reviews, mess.selectedId]
  );

  const summary = useMemo(() => {
    const total = messReviews.length;
    const avg = total ? messReviews.reduce((s, r) => s + Number(r.rating || 0), 0) / total : 0;
    const dist = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: messReviews.filter((r) => Math.round(r.rating) === star).length,
    }));
    return { total, avg, dist };
  }, [messReviews]);

  const topDishes = useMemo(
    () =>
      items
        .filter((i) => Number(i.rating_count || 0) > 0)
        .sort((a, b) => b.rating_avg - a.rating_avg)
        .slice(0, 5),
    [items]
  );

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!user) {
      navigate("/login");
      return;
    }
    if (!itemId) {
      setError("Pick the dish you are reviewing.");
      return;
    }
    if (!rating) {
      setError("Choose a star rating first.");
      return;
    }
    setSaving(true);
    try {
      await base44.functions.invoke("submitReview", { menu_item_id: itemId, rating, comment });
      setItemId("");
      setRating(0);
      setComment("");
      await Promise.all([reload(), reloadMenu()]);
    } catch (err) {
      setError(err?.response?.data?.error || "Could not save your review. Try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingBlock label="Loading student reviews…" />;

  return (
    <div className="space-y-6">
      <PageHeading
        title="Food reviews"
        description="What your messmates actually thought — and a direct line to the mess team."
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
        <div className="glass p-5 sm:p-6">
          <div className="label-xs">Overall rating</div>
          <div className="mt-2 flex items-end gap-3">
            <span className="stat-num text-5xl font-semibold text-white">{summary.avg.toFixed(1)}</span>
            <div className="mb-1.5">
              <RatingStars value={summary.avg} size={16} />
              <div className="mt-1 text-[11px] text-muted-foreground">{summary.total} reviews this mess</div>
            </div>
          </div>

          <div className="mt-5 space-y-1.5">
            {summary.dist.map((d) => {
              const pct = summary.total ? Math.round((d.count / summary.total) * 100) : 0;
              return (
                <div key={d.star} className="flex items-center gap-2">
                  <span className="w-6 font-mono text-[10.5px] text-muted-foreground">{d.star}★</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.07]">
                    <div className="h-full rounded-full bg-yellow-300/80 transition-all duration-700" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-7 text-right font-mono text-[10px] text-muted-foreground">{d.count}</span>
                </div>
              );
            })}
          </div>

          {topDishes.length > 0 && (
            <div className="mt-5 border-t border-white/[0.06] pt-4">
              <div className="label-xs mb-2">Best rated dishes</div>
              <div className="space-y-1.5">
                {topDishes.map((d) => (
                  <div key={d.id} className="flex items-center justify-between text-[11.5px]">
                    <span className="truncate text-slate-200">{d.name}</span>
                    <span className="ml-2 shrink-0 font-mono text-yellow-300">
                      ★ {Number(d.rating_avg).toFixed(1)}
                      <span className="ml-1 text-muted-foreground">({d.rating_count})</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <form onSubmit={submit} className="glass p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-neon" />
            <h3 className="text-base font-semibold text-white">Rate a dish</h3>
          </div>

          <label className="mt-4 block text-[11px] font-medium text-muted-foreground">Which dish?</label>
          <select
            value={itemId}
            onChange={(e) => setItemId(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#070d18] px-3 py-2.5 text-[12.5px] text-white outline-none focus:border-neon/50"
          >
            <option value="">Select a dish…</option>
            {items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name} — {MEAL_LABEL[i.meal]}
              </option>
            ))}
          </select>

          <div className="mt-4 flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">Your rating</span>
            <RatingStars value={rating} onChange={setRating} size={22} />
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Taste, portion, temperature, hygiene — anything the mess team should know (optional)."
            className="mt-3 w-full resize-none rounded-xl border border-white/10 bg-[#070d18] px-3 py-2.5 text-[12px] text-white outline-none placeholder:text-muted-foreground/70 focus:border-neon/50"
          />

          {error && <p className="mt-2 text-[11.5px] text-danger">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-neon px-4 py-2.5 text-[12.5px] font-semibold text-black transition-opacity disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            {saving ? "Saving…" : user ? "Submit review" : "Sign in to review"}
          </button>
          <p className="mt-2 text-[10px] text-muted-foreground">
            One review per dish per student — submitting again updates your previous rating.
          </p>
        </form>
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2">
          <Star className="h-4 w-4 text-yellow-300" />
          <h3 className="text-base font-semibold text-white">Recent feedback</h3>
          <span className="font-mono text-[10px] text-muted-foreground">{messReviews.length} entries</span>
        </div>

        {messReviews.length === 0 ? (
          <EmptyState title="No reviews yet" description="Be the first to rate a dish — the mess team reads every comment." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {messReviews.slice(0, 18).map((r) => (
              <div key={r.id} className="glass-soft p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-[12.5px] font-medium text-white">{r.item_name}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {MEAL_LABEL[r.meal] || r.meal} · {r.student_name || "Student"}
                    </div>
                  </div>
                  <RatingStars value={r.rating} size={11} />
                </div>
                {r.comment && (
                  <div className="mt-2 flex gap-1.5">
                    <Quote className="mt-0.5 h-3 w-3 shrink-0 text-neon/70" />
                    <p className="text-[11.5px] leading-relaxed text-slate-300">{r.comment}</p>
                  </div>
                )}
                <div className="mt-2 text-[9.5px] text-muted-foreground">
                  {new Date(r.created_date).toLocaleDateString([], { day: "numeric", month: "short" })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}