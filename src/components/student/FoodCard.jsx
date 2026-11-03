import React, { useState } from "react";
import { Heart, Clock, AlertCircle, Leaf, Check, Send, Loader2, Flame } from "lucide-react";
import StockBar from "@/components/rr/StockBar";
import RatingStars from "@/components/rr/RatingStars";
import { DemoBadge } from "@/components/rr/FreshnessPill";
import { FOOD_TYPE_STYLES, MEAL_LABEL } from "@/lib/rush";

export default function FoodCard({
  item,
  threshold = 15,
  isFavorite = false,
  onToggleFavorite,
  onSubmitReview,
  reviews = [],
  onRequireLogin,
  canReview = true,
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const type = FOOD_TYPE_STYLES[item.food_type] || FOOD_TYPE_STYLES.veg;
  const soldOut = item.status === "sold_out" || Number(item.remaining_quantity || 0) <= 0;
  const itemReviews = reviews.filter((r) => r.menu_item_id === item.id).slice(0, 2);
  const platesRemaining = item.plates_remaining ?? item.remaining_quantity ?? 0;

  const submit = async () => {
    if (!canReview) {
      onRequireLogin?.();
      return;
    }
    if (!rating) return;
    setSaving(true);
    try {
      await onSubmitReview?.({ item, rating, comment });
      setRating(0);
      setComment("");
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass glass-hover group flex flex-col overflow-hidden">
      <div className="relative h-36 w-full overflow-hidden bg-gradient-to-br from-[#0d1a2b] via-[#0a1421] to-[#101c14]">
        {item.image_url && !imageFailed ? (
          <img
            src={item.image_url}
            alt={item.name}
            loading="lazy"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-4xl opacity-60">
            {item.meal === "breakfast" ? "🥣" : item.meal === "lunch" ? "🍛" : item.meal === "snacks" ? "🍵" : "🍽️"}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050810] via-transparent to-transparent" />
        <div className="absolute left-2.5 top-2.5 flex flex-wrap items-center gap-1.5">
          <span className={`inline-flex items-center gap-1 rounded-full border bg-black/50 px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider backdrop-blur ${type.ring} ${type.text}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${type.dot}`} /> {type.label}
          </span>
          {item.is_special && (
            <span className="inline-flex items-center gap-1 rounded-full border border-ember/40 bg-black/50 px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider text-ember backdrop-blur">
              <Flame className="h-2.5 w-2.5" /> Special
            </span>
          )}
          {item.is_demo && <DemoBadge label="DEMO" className="bg-black/50" />}
        </div>
        <button
          type="button"
          onClick={() => onToggleFavorite?.(item, isFavorite)}
          aria-label={isFavorite ? "Remove from favourites" : "Save to favourites"}
          className={`absolute right-2.5 top-2.5 grid h-7 w-7 place-items-center rounded-full border backdrop-blur transition-colors ${
            isFavorite ? "border-danger/50 bg-danger/25 text-danger" : "border-white/20 bg-black/40 text-white/80 hover:text-danger"
          }`}
        >
          <Heart className={`h-3.5 w-3.5 ${isFavorite ? "fill-current" : ""}`} />
        </button>
        <div className="absolute bottom-2.5 left-3 right-3">
          <div className="flex items-end justify-between gap-2">
            <h3 className="truncate text-[13.5px] font-semibold text-white">{item.name}</h3>
            <span className="shrink-0 font-mono text-[10px] text-white/70">{MEAL_LABEL[item.meal]}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        {item.description && (
          <p className="line-clamp-2 text-[11.5px] leading-relaxed text-muted-foreground">{item.description}</p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" /> {item.serving_start}–{item.serving_end}
          </span>
          {item.allergens && (
            <span className="inline-flex items-center gap-1 text-ember">
              <AlertCircle className="h-3 w-3" /> {item.allergens}
            </span>
          )}
        </div>

        <div className="mt-3">
          <StockBar item={item} threshold={threshold} />
          <div className="mt-1.5 flex items-center justify-between text-[10px]">
            <span className={soldOut ? "text-muted-foreground" : "text-neon"}>
              {soldOut ? "Sold out for today" : `${platesRemaining} plates remaining`}
            </span>
            <span className="text-muted-foreground">{item.served_quantity ?? 0} served</span>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <RatingStars value={Number(item.rating_avg || 0)} size={12} showValue />
            <span className="text-[10px] text-muted-foreground">({item.rating_count ?? 0})</span>
          </div>
          <button
            type="button"
            onClick={() => (canReview ? setOpen((v) => !v) : onRequireLogin?.())}
            className="text-[10.5px] font-medium text-neon hover:underline"
          >
            {open ? "Cancel" : "Rate this"}
          </button>
        </div>

        {itemReviews.length > 0 && !open && (
          <div className="mt-2 space-y-1 border-t border-white/[0.06] pt-2">
            {itemReviews.map((r) => (
              <div key={r.id} className="text-[10.5px] leading-snug text-muted-foreground">
                <span className="text-yellow-300">★ {r.rating}</span>{" "}
                {r.comment ? `“${r.comment}”` : ""}{" "}
                <span className="text-white/40">— {r.student_name || "Student"}</span>
              </div>
            ))}
          </div>
        )}

        {open && (
          <div className="mt-3 rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] text-muted-foreground">Your rating</span>
              <RatingStars value={rating} onChange={setRating} size={16} />
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How was it? (optional)"
              rows={2}
              className="mt-2 w-full resize-none rounded-lg border border-white/10 bg-[#070d18] px-2.5 py-2 text-[11.5px] text-white outline-none placeholder:text-muted-foreground/70 focus:border-neon/50"
            />
            <button
              type="button"
              onClick={submit}
              disabled={!rating || saving}
              className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-neon px-3 py-2 text-[11.5px] font-semibold text-black transition-opacity disabled:opacity-40"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : rating ? <Send className="h-3 w-3" /> : <Check className="h-3 w-3" />}
              {saving ? "Saving…" : "Submit rating"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}