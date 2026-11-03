import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, Bell, LogOut, RefreshCw, UserCircle2 } from "lucide-react";
import MessSwitcher from "@/components/rr/MessSwitcher";
import FreshnessPill from "@/components/rr/FreshnessPill";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";

export default function TopBar({
  onOpenMenu,
  messes,
  selectedId,
  onSelectMess,
  updatedAt,
  staleMinutes = 15,
  refreshing,
  onRefresh,
  showMess = true,
  showNotifications = true,
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user?.email || !showNotifications) return undefined;
    let alive = true;
    const load = () =>
      base44.entities.Notification.filter({ user_email: user.email, is_read: false }, { limit: 1 })
        .then((res) => {
          if (alive) setUnread(Array.isArray(res) ? res.length : res?.items?.length || 0);
        })
        .catch(() => {});
    load();
    const unsub = base44.entities.Notification.subscribe(() => load());
    return () => {
      alive = false;
      unsub?.();
    };
  }, [user?.email, showNotifications]);

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#060a12]/80 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <button
          type="button"
          onClick={onOpenMenu}
          className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-slate-300 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="hidden items-center gap-2 md:flex">
          <span className="label-xs">Mess</span>
        </div>
        {showMess && (
          <MessSwitcher messes={messes} selectedId={selectedId} onChange={onSelectMess} className="w-[190px] shrink-0 sm:w-[220px]" />
        )}

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {updatedAt !== undefined && <FreshnessPill updatedAt={updatedAt} staleMinutes={staleMinutes} className="hidden sm:inline-flex" />}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-slate-300 transition-colors hover:border-neon/40 hover:text-neon"
              aria-label="Refresh live data"
              title="Refresh live data"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          )}
          {showNotifications && (
            <Link
              to="/notifications"
              className="relative grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-slate-300 transition-colors hover:border-neon/40 hover:text-neon"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-neon px-1 font-mono text-[9px] font-bold text-black">
                  {unread}
                </span>
              )}
            </Link>
          )}

          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] py-1 pl-1 pr-3 sm:flex">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-neon/15 text-neon">
              <UserCircle2 className="h-4 w-4" />
            </span>
            <div className="leading-tight">
              <div className="max-w-[130px] truncate text-[11.5px] font-medium text-white">
                {user?.full_name || user?.email || "Guest"}
              </div>
              <div className="text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">{user?.role || "visitor"}</div>
            </div>
          </div>

          {user ? (
            <button
              type="button"
              onClick={() => logout()}
              className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-slate-300 transition-colors hover:border-danger/40 hover:text-danger"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-white hover:border-neon/40 hover:text-neon"
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  );
}