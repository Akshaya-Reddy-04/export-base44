import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UtensilsCrossed, Flame, Star, Filter, Sparkles } from "lucide-react";
import { PageHeading } from "@/components/rr/GlassCard";
import FoodCard from "@/components/student/FoodCard";
import { LoadingBlock, EmptyState } from "@/components/rr/EmptyState";
import { useMess } from "@/lib/MessContext";
import { useMenu, useReviews } from "@/hooks/useMessContent";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { pageItems } from "@/hooks/useMessData";
import { MEALS, MEAL_LABEL } from "@/lib/rush";
import { cn } from "@/lib/utils";

export default function FoodMenu() {
  const mess = useMess();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { items, loading, reload } = useMenu(mess.selectedId);
  const { reviews, reload: reloadReviews } = useReviews(mess.selectedId);
  const [meal, setMeal] = useState("all");
  const [vegOnly, setVegOnly] = useState(false);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!user) return;
    base44.entities.Favorite.list({ limit: 100 }).then((res) => setFavorites(pageItems(res)));
  }, [user?.email]);

  const visible = useMemo(() => {
    return items
      .filter((i) => i.is_active !== false)
      .filter((i) => (meal === "all" ? true : i.meal === meal))
      .filter((i) => (vegOnly ? i.food_type === "veg" : true))
      .filter((i) => (availableOnly ? i.status !== "sold_out" && Number(i.remaining_quantity || 0) > 0 : true));
  }, [items, meal, vegOnly, availableOnly]);

  const specials = items.filter((i) => i.is_special && i.status !== "sold_out");
  const popular = [...items]
    .filter((i) => Number(i.rating_count || 0) > 0)
    .sort((a, b) => b.rating_avg - a.rating_avg)
    .slice(0, 4);

  const toggleFavorite = async (item, isFav) => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (isFav) {
      const existing = favorites.find((f) => f.menu_item_id === item.id);
      if (existing) {
        await base44.entities.Favorite.delete(existing.id);
        setFavorites((prev) => prev.filter((f) => f.id !== existing.id));
      }
    } else {
      const created = await base44.entities.Favorite.create({
        user_email: user.email,
        menu_item_id: item.id,
        item_name: item.name,
        mess_id: item.mess_id,
      });
      setFavorites((prev) => [...prev, created]);
      setToast(`Following ${item.name} — you'll be alerted when it is back on the counter.`);
      setTimeout(() => setToast(""), 4000);
    }
  };

  const submitReview = async ({ item, rating, comment }) => {
    await base44.functions.invoke("submitReview", {
      menu_item_id: item.id,
      rating,
      comment,
    });
    await Promise.all([reload(), reloadReviews()]);
  };

  if (loading) return <LoadingBlock label="Loading today's menu…" />;

  return (
    <div className="space-y-6">
      <PageHeading
        title="Smart food menu"
        description={`Today's menu for ${mess.selectedMess?.name || "your mess"} — live stock, serving windows and student ratings.`}
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] text-muted-foreground">
          <UtensilsCrossed className="h-3.5 w-3.5 text-neon" /> {items.length} dishes today
        </div>
      </PageHeading>

      {toast && (
        <div className="rounded-xl border border-neon/30 bg-neon/[0.08] px-4 py-2.5 text-[12px] text-neon">{toast}</div>
      )}

      {specials.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl border border-ember/25 bg-gradient-to-r from-ember/[0.12] via-ember/[0.04] to-transparent p-5">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-ember/20 blur-3xl" />
          <div className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-ember">
            <Flame className="h-3.5 w-3.5" /> Daily special
          </div>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            {specials.map((s) => (
              <span key={s.id} className="text-lg font-semibold text-white">
                {s.name}
                <span className="ml-2 text-[11px] font-normal text-muted-foreground">
                  {MEAL_LABEL[s.meal]} · {s.remaining_quantity} plates left
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="scroll-thin -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {[{ key: "all", label: "All meals", emoji: "🍽️" }, ...MEALS].map((m) => {
            const count = m.key === "all" ? items.length : items.filter((i) => i.meal === m.key).length;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => setMeal(m.key)}
                className={cn(
                  "shrink-0 rounded-full border px-3.5 py-2 text-[11.5px] font-medium transition-all",
                  meal === m.key
                    ? "border-neon/40 bg-neon/10 text-neon"
                    : "border-white/10 bg-white/[0.02] text-slate-400 hover:border-white/20 hover:text-white"
                )}
              >
                <span className="mr-1.5">{m.emoji}</span>
                {m.label}
                <span className="ml-1.5 font-mono text-[10px] opacity-70">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setVegOnly((v) => !v)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] transition-colors",
              vegOnly ? "border-neon/40 bg-neon/10 text-neon" : "border-white/10 text-muted-foreground hover:text-white"
            )}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-neon" /> Veg only
          </button>
          <button
            type="button"
            onClick={() => setAvailableOnly((v) => !v)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] transition-colors",
              availableOnly ? "border-electric/40 bg-electric/10 text-electric" : "border-white/10 text-muted-foreground hover:text-white"
            )}
          >
            <Filter className="h-3 w-3" /> Available now
          </button>
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title="Nothing matches these filters"
          description="Try another meal or clear the filters — the mess team publishes items through their dashboard."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((item) => (
            <FoodCard
              key={item.id}
              item={item}
              threshold={mess.settings.low_stock_threshold}
              reviews={reviews}
              isFavorite={favorites.some((f) => f.menu_item_id === item.id)}
              onToggleFavorite={toggleFavorite}
              onSubmitReview={submitReview}
              canReview={!!user}
              onRequireLogin={() => navigate("/login")}
            />
          ))}
        </div>
      )}

      {popular.length > 0 && (
        <div className="glass p-5">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-300" />
            <h3 className="text-base font-semibold text-white">Most popular this week</h3>
            <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-muted-foreground">
              <Sparkles className="h-3 w-3" /> from student ratings
            </span>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {popular.map((item) => (
              <div key={item.id} className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-3">
                <div className="truncate text-[12px] font-medium text-white">{item.name}</div>
                <div className="mt-1 flex items-center justify-between">
                  <Star className="h-3 w-3 fill-yellow-300 text-yellow-300" />
                  <span className="font-mono text-[11px] text-yellow-300">{Number(item.rating_avg).toFixed(1)}</span>
                  <span className="text-[10px] text-muted-foreground">{item.rating_count} ratings</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}