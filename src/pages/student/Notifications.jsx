import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell, BellRing, CheckCheck, ListOrdered, Users, UtensilsCrossed, Megaphone,
  AlertOctagon, Clock, RefreshCw, Sparkles,
} from "lucide-react";
import { PageHeading } from "@/components/rr/GlassCard";
import { LoadingBlock, EmptyState } from "@/components/rr/EmptyState";
import { useMess } from "@/lib/MessContext";
import { useAuth } from "@/lib/AuthContext";
import { useStudentProfile } from "@/hooks/useStudentProfile";
import { base44 } from "@/api/base44Client";
import { pageItems } from "@/hooks/useMessData";
import { cn } from "@/lib/utils";

const TYPE_META = {
  queue: { icon: ListOrdered, tone: "text-neon", bg: "bg-neon/[0.07]", border: "border-neon/25" },
  crowd: { icon: Users, tone: "text-electric", bg: "bg-electric/[0.07]", border: "border-electric/25" },
  food: { icon: UtensilsCrossed, tone: "text-ember", bg: "bg-ember/[0.07]", border: "border-ember/25" },
  menu: { icon: Megaphone, tone: "text-neon", bg: "bg-neon/[0.07]", border: "border-neon/25" },
  timing: { icon: Clock, tone: "text-electric", bg: "bg-electric/[0.07]", border: "border-electric/25" },
  emergency: { icon: AlertOctagon, tone: "text-danger", bg: "bg-danger/[0.08]", border: "border-danger/30" },
};

export default function Notifications() {
  const { user } = useAuth();
  const mess = useMess();
  const { profile, updateProfile } = useStudentProfile(user);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [browserState, setBrowserState] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "unsupported"
  );

  const load = async () => {
    if (!user?.email) {
      setLoading(false);
      return;
    }
    const res = await base44.entities.Notification.filter(
      { user_email: user.email },
      { sort: "-created_date", limit: 100 }
    );
    setItems(pageItems(res));
    setLoading(false);
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 45000);
    return () => clearInterval(timer);
  }, [user?.email]);

  const unread = items.filter((n) => !n.is_read).length;

  const markRead = async (id) => {
    await base44.entities.Notification.update(id, { is_read: true });
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const markAll = async () => {
    const targets = items.filter((n) => !n.is_read);
    await Promise.all(targets.map((n) => base44.entities.Notification.update(n.id, { is_read: true })));
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const enableBrowserAlerts = async () => {
    if (typeof Notification === "undefined") return;
    const permission = await Notification.requestPermission();
    setBrowserState(permission);
    if (permission === "granted") {
      await updateProfile({ notify_browser: true });
      await base44.entities.Notification.create({
        user_email: user.email,
        title: "Browser alerts are on",
        message: "Rush Radar will ping this device when your mess queue drops or a favourite dish returns.",
        type: "queue",
        is_read: false,
      });
      new Notification("Rush Radar", { body: "Browser alerts enabled. You'll hear from us when the queue drops." });
      load();
    }
  };

  const prefs = useMemo(
    () => [
      { key: "notify_queue", label: "Queue gets shorter", desc: "When waiting students drop below the quiet threshold." },
      { key: "notify_crowd", label: "Crowd becomes low", desc: "When the mess drops to a low-crowd occupancy band." },
      { key: "notify_food", label: "My favourite food is back", desc: "When a dish you follow is available again." },
      { key: "notify_menu", label: "New menu published", desc: "Fresh menus and timing changes from the mess office." },
    ],
    []
  );

  if (loading) return <LoadingBlock label="Loading your alerts…" />;

  return (
    <div className="space-y-6">
      <PageHeading
        title="Notifications"
        description="Smart alerts about queues, crowd level, your favourite dishes and mess announcements."
      >
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] text-muted-foreground">
          <BellRing className="h-3.5 w-3.5 text-neon" /> {unread} unread
        </span>
        {unread > 0 && (
          <button
            type="button"
            onClick={markAll}
            className="inline-flex items-center gap-2 rounded-full border border-white/12 px-3.5 py-2 text-[11.5px] font-medium text-white hover:border-neon/40 hover:text-neon"
          >
            <CheckCheck className="h-3.5 w-3.5" /> Mark all read
          </button>
        )}
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-2 rounded-full border border-white/12 px-3.5 py-2 text-[11.5px] font-medium text-white hover:border-neon/40 hover:text-neon"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </PageHeading>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-2.5">
          {items.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="No notifications yet"
              description="You'll see queue drop alerts, favourite food availability and mess notices here."
              action={
                <Link to="/profile" className="rounded-full border border-white/15 px-4 py-2 text-[11.5px] text-white hover:border-neon/40 hover:text-neon">
                  Set your preferences
                </Link>
              }
            />
          ) : (
            items.map((n) => {
              const meta = TYPE_META[n.type] || TYPE_META.queue;
              const Icon = meta.icon;
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => !n.is_read && markRead(n.id)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-2xl border px-4 py-3.5 text-left transition-all",
                    n.is_read
                      ? "border-white/[0.06] bg-white/[0.015] opacity-70 hover:opacity-100"
                      : `${meta.border} ${meta.bg}`
                  )}
                >
                  <span className={cn("mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-black/30", meta.tone)}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[12.5px] font-semibold text-white">{n.title}</span>
                      {!n.is_read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-neon" />}
                    </div>
                    <p className="mt-0.5 text-[11.5px] leading-relaxed text-slate-300">{n.message}</p>
                    <div className="mt-1.5 font-mono text-[9.5px] uppercase tracking-wider text-muted-foreground">
                      {n.type} · {new Date(n.created_date).toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="space-y-4">
          <div className="glass p-5">
            <h3 className="text-base font-semibold text-white">Alert preferences</h3>
            <p className="mt-1 text-[11px] text-muted-foreground">Choose what reaches you in-app.</p>
            <div className="mt-4 space-y-1">
              {prefs.map((p) => (
                <label key={p.key} className="flex cursor-pointer items-start gap-3 rounded-xl px-1 py-2 transition-colors hover:bg-white/[0.03]">
                  <input
                    type="checkbox"
                    checked={!!profile?.[p.key]}
                    onChange={(e) => updateProfile({ [p.key]: e.target.checked })}
                    className="mt-0.5 h-3.5 w-3.5 accent-[#22ff9a]"
                  />
                  <span className="min-w-0">
                    <span className="block text-[12px] font-medium text-white">{p.label}</span>
                    <span className="block text-[10.5px] leading-snug text-muted-foreground">{p.desc}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="glass p-5">
            <div className="flex items-center gap-2">
              <BellRing className="h-4 w-4 text-electric" />
              <h3 className="text-base font-semibold text-white">Browser push</h3>
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
              {browserState === "granted"
                ? "Enabled on this device. Alerts appear even when Rush Radar is in a background tab."
                : browserState === "denied"
                ? "Blocked in your browser settings. Re-enable notifications for this site to receive pushes."
                : browserState === "unsupported"
                ? "This browser does not support notifications."
                : "Get a desktop ping when the queue drops or a dish returns."}
            </p>
            {browserState !== "granted" && browserState !== "unsupported" && (
              <button
                type="button"
                onClick={enableBrowserAlerts}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-electric/15 px-4 py-2.5 text-[12px] font-semibold text-electric hover:bg-electric/25"
              >
                <BellRing className="h-3.5 w-3.5" /> Enable browser alerts
              </button>
            )}
          </div>

          <div className="glass p-5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-neon" />
              <h3 className="text-sm font-semibold text-white">Following {mess.selectedMess?.name}</h3>
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Alerts are per mess. Change your mess from the selector at the top of any page.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}