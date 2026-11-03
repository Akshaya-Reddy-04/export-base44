// Shared domain logic for Rush Radar — crowd levels, waiting-time maths,
// prediction, freshness and CSV export.

export const MEALS = [
  { key: "breakfast", label: "Breakfast", window: "7:30 – 9:30 AM", emoji: "🌅" },
  { key: "lunch", label: "Lunch", window: "12:00 – 2:30 PM", emoji: "☀️" },
  { key: "snacks", label: "Evening Snacks", window: "4:30 – 6:00 PM", emoji: "🍵" },
  { key: "dinner", label: "Dinner", window: "7:30 – 9:45 PM", emoji: "🌙" },
];

export const MEAL_LABEL = MEALS.reduce((acc, m) => ({ ...acc, [m.key]: m.label }), {});

export const CROWD_LEVELS = {
  low: {
    key: "low",
    label: "Low Crowd",
    headline: "Walk right in",
    tone: "text-neon",
    hex: "#22ff9a",
    chip: "bg-neon-soft text-neon border-neon/30",
    bar: "bg-neon",
    glow: "shadow-[0_0_60px_-18px_rgba(34,255,154,0.75)]",
  },
  medium: {
    key: "medium",
    label: "Medium Crowd",
    headline: "Short wait expected",
    tone: "text-yellow-300",
    hex: "#fde047",
    chip: "bg-yellow-400/10 text-yellow-300 border-yellow-300/30",
    bar: "bg-yellow-300",
    glow: "shadow-[0_0_60px_-18px_rgba(253,224,71,0.7)]",
  },
  high: {
    key: "high",
    label: "High Crowd",
    headline: "Plan for a queue",
    tone: "text-ember",
    hex: "#ff8a3d",
    chip: "bg-ember-soft text-ember border-ember/30",
    bar: "bg-ember",
    glow: "shadow-[0_0_60px_-18px_rgba(255,138,61,0.7)]",
  },
  extreme: {
    key: "extreme",
    label: "Extremely Crowded",
    headline: "Wait it out if you can",
    tone: "text-danger",
    hex: "#ff4d6d",
    chip: "bg-danger-soft text-danger border-danger/30",
    bar: "bg-danger",
    glow: "shadow-[0_0_60px_-18px_rgba(255,77,109,0.7)]",
  },
};

export function occupancyPct(people, capacity) {
  if (!capacity) return 0;
  return Math.min(100, Math.round((Number(people || 0) / Number(capacity)) * 100));
}

export function crowdLevel(pct) {
  if (pct >= 85) return CROWD_LEVELS.extreme;
  if (pct >= 60) return CROWD_LEVELS.high;
  if (pct >= 35) return CROWD_LEVELS.medium;
  return CROWD_LEVELS.low;
}

// Estimated wait = people ahead / open counters * average serving seconds.
export function waitMinutes(queue, counters, avgServingSeconds) {
  const lanes = Math.max(1, Number(counters || 1));
  const ahead = Math.max(0, Number(queue || 0));
  const perStudent = Math.max(10, Number(avgServingSeconds || 45));
  const seconds = (ahead / lanes) * perStudent;
  return Math.max(0, Math.round(seconds / 60));
}

export function formatWait(minutes) {
  if (minutes <= 0) return "No wait";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

export function minutesSince(dateString) {
  if (!dateString) return null;
  const then = new Date(dateString).getTime();
  if (Number.isNaN(then)) return null;
  return Math.max(0, Math.round((Date.now() - then) / 60000));
}

export function freshness(dateString, staleAfterMinutes = 15) {
  const mins = minutesSince(dateString);
  if (mins === null) return { live: false, minutes: null, label: "NO UPDATE YET", stale: true };
  const stale = mins > staleAfterMinutes;
  return {
    live: !stale,
    minutes: mins,
    stale,
    label: stale ? "DATA OUTDATED" : "LIVE",
  };
}

export function agoLabel(dateString) {
  const mins = minutesSince(dateString);
  if (mins === null) return "never";
  if (mins < 1) return "just now";
  if (mins === 1) return "1 min ago";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function clockTime(dateString) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Average occupancy by hour-of-day from crowd snapshots, then project forward.
export function predictCrowd(history, capacity, now = new Date()) {
  const buckets = Array.from({ length: 24 }, () => ({ sum: 0, count: 0 }));
  (history || []).forEach((row) => {
    const hour = Number.isFinite(row.hour_of_day)
      ? row.hour_of_day
      : new Date(row.recorded_at || row.created_date).getHours();
    if (hour >= 0 && hour < 24) {
      buckets[hour].sum += Number(row.people_inside || 0);
      buckets[hour].count += 1;
    }
  });

  const avgAt = (hour) => {
    const b = buckets[(hour + 24) % 24];
    if (b.count) return b.sum / b.count;
    // fall back to the nearest hour that has data
    for (let step = 1; step < 24; step += 1) {
      const prev = buckets[(hour - step + 24) % 24];
      if (prev.count) return prev.sum / prev.count;
      const next = buckets[(hour + step) % 24];
      if (next.count) return next.sum / next.count;
    }
    return 0;
  };

  const smoothAt = (offsetMin) => {
    const rawHour = now.getHours() + now.getMinutes() / 60 + offsetMin / 60;
    const h = Math.floor(rawHour);
    const frac = rawHour - h;
    return Math.round(avgAt(h) * (1 - frac) + avgAt(h + 1) * frac);
  };

  const points = Array.from({ length: 13 }, (_, i) => {
    const hour = (now.getHours() + i) % 24;
    return { hour, label: `${String(hour).padStart(2, "0")}:00`, crowd: Math.round(avgAt(hour)) };
  });

  const sorted = [...points].sort((a, b) => b.crowd - a.crowd);
  const peak = sorted.slice(0, 2).map((p) => p.label);
  const quietest = [...points].sort((a, b) => a.crowd - b.crowd)[0];
  const hasHistory = buckets.some((b) => b.count > 0);

  return {
    hasHistory,
    next15: smoothAt(15),
    next30: smoothAt(30),
    next60: smoothAt(60),
    points,
    peaks: peak,
    bestTime: quietest?.label || "—",
    bestCrowd: quietest?.crowd || 0,
    capacity: capacity || 0,
  };
}

export function currentMeal(timings, now = new Date()) {
  const minutes = now.getHours() * 60 + now.getMinutes();
  const toMin = (t) => {
    const [h, m] = String(t || "0:0").split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  };
  const active = (timings || []).find(
    (t) => t.is_active !== false && minutes >= toMin(t.start_time) && minutes <= toMin(t.end_time)
  );
  if (active) return { meal: active.meal, live: true, start: active.start_time, end: active.end_time };
  const upcoming = [...(timings || [])]
    .filter((t) => toMin(t.start_time) > minutes)
    .sort((a, b) => toMin(a.start_time) - toMin(b.start_time))[0];
  if (upcoming) return { meal: upcoming.meal, live: false, start: upcoming.start_time, end: upcoming.end_time };
  return { meal: "lunch", live: false, start: "", end: "" };
}

export function stockPct(item) {
  const total = Number(item.total_quantity || 0);
  const remaining = Number(item.remaining_quantity || 0);
  if (!total) return remaining > 0 ? 100 : 0;
  return Math.max(0, Math.min(100, Math.round((remaining / total) * 100)));
}

export function isLowStock(item, threshold) {
  const limit = Number(threshold ?? item.low_stock_threshold ?? 15);
  return Number(item.remaining_quantity || 0) <= limit && item.status !== "sold_out";
}

export function makeStudentCode(seed) {
  const base = String(seed || Math.random()).replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase();
  return `RR-${base}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export function qrImageUrl(code, size = 260) {
  const data = encodeURIComponent(code || "RR-DEMO");
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=8&bgcolor=070d18&color=22ff9a&data=${data}`;
}

export function csvEscape(value) {
  const str = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export function downloadCsv(filename, columns, rows) {
  const header = columns.map((c) => csvEscape(c.label)).join(",");
  const body = rows
    .map((row) => columns.map((c) => csvEscape(typeof c.value === "function" ? c.value(row) : row[c.key])).join(","))
    .join("\n");
  const blob = new Blob([`${header}\n${body}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function roleHome(role) {
  if (role === "admin") return "/admin";
  if (role === "staff") return "/staff";
  return "/dashboard";
}

export const LOW_STOCK_DEFAULT = 15;
export const STALE_MINUTES_DEFAULT = 15;
export const REFRESH_SECONDS_DEFAULT = 20;

export const FOOD_TYPE_STYLES = {
  veg: { label: "Veg", dot: "bg-neon", text: "text-neon", ring: "border-neon/40" },
  non_veg: { label: "Non-Veg", dot: "bg-danger", text: "text-danger", ring: "border-danger/40" },
  egg: { label: "Egg", dot: "bg-yellow-300", text: "text-yellow-300", ring: "border-yellow-300/40" },
};