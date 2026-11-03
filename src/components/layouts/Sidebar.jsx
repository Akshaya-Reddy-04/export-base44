import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, ListOrdered, UtensilsCrossed, Users, Sparkles, Star,
  Bell, User, Gauge, Boxes, QrCode, MessageSquareWarning, LineChart,
  FileBarChart, Settings, MapPinned, ShieldCheck, X,
} from "lucide-react";
import RadarLogo from "@/components/rr/RadarLogo";
import { cn } from "@/lib/utils";

const STUDENT_NAV = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Live Queue", to: "/queue", icon: ListOrdered },
  { label: "Food Menu", to: "/menu", icon: UtensilsCrossed },
  { label: "Mess Occupancy", to: "/occupancy", icon: Users },
  { label: "Crowd Prediction", to: "/predictions", icon: Sparkles },
  { label: "Food Reviews", to: "/reviews", icon: Star },
  { label: "Notifications", to: "/notifications", icon: Bell },
  { label: "My Profile", to: "/profile", icon: User },
];

const ADMIN_NAV = [
  { label: "Overview", to: "/admin", icon: Gauge, end: true },
  { label: "Queue Management", to: "/admin/queue", icon: ListOrdered },
  { label: "Occupancy", to: "/admin/occupancy", icon: Users },
  { label: "Food Menu Management", to: "/admin/menu", icon: UtensilsCrossed },
  { label: "Inventory", to: "/admin/inventory", icon: Boxes },
  { label: "QR Scanner", to: "/admin/scanner", icon: QrCode },
  { label: "Students", to: "/admin/students", icon: ShieldCheck, roles: ["admin"] },
  { label: "Complaints", to: "/admin/complaints", icon: MessageSquareWarning },
  { label: "Analytics", to: "/admin/analytics", icon: LineChart },
  { label: "Reports", to: "/admin/reports", icon: FileBarChart },
  { label: "Settings", to: "/admin/settings", icon: Settings, roles: ["admin"] },
];

export default function Sidebar({ variant = "student", role = "user", open, onClose }) {
  const items = (variant === "student" ? STUDENT_NAV : ADMIN_NAV).filter(
    (item) => !item.roles || item.roles.includes(role)
  );

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col border-r border-white/[0.07] bg-[#070c16]/95 px-4 py-5 backdrop-blur-2xl transition-transform duration-300 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between">
          <NavLink to="/" onClick={onClose}>
            <RadarLogo size={34} showWordmark />
          </NavLink>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-muted-foreground lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
          <div className="label-xs">{variant === "student" ? "Student platform" : "Control room"}</div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            {variant === "student" ? "Live mess intelligence" : role === "admin" ? "Admin access" : "Staff access"}
          </div>
        </div>

        <nav className="scroll-thin mt-5 flex-1 space-y-0.5 overflow-y-auto pr-1">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] transition-all duration-200",
                  isActive
                    ? "bg-neon/10 text-neon shadow-[inset_0_0_0_1px_rgba(34,255,154,0.22)]"
                    : "text-slate-400 hover:bg-white/[0.045] hover:text-white"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-neon" : "text-slate-500 group-hover:text-white")} strokeWidth={1.8} />
                  <span className="truncate">{item.label}</span>
                  {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-neon shadow-[0_0_10px_#22ff9a]" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mt-4 rounded-xl border border-white/[0.07] bg-gradient-to-br from-neon/[0.07] to-transparent p-3">
          <div className="text-[11px] font-semibold text-white">Beat the Queue.</div>
          <p className="mt-1 text-[10.5px] leading-relaxed text-muted-foreground">
            Track live mess data before you leave your room.
          </p>
        </div>
      </aside>
    </>
  );
}