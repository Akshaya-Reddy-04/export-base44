import React from "react";
import {
  ListOrdered, Users, Sparkles, QrCode, UtensilsCrossed, Boxes,
  BellRing, LineChart, ShieldCheck,
} from "lucide-react";

const FEATURES = [
  { icon: ListOrdered, title: "Live queue tracking", body: "See how many students are waiting right now and the estimated wait before you step out.", tone: "text-neon" },
  { icon: Users, title: "Real occupancy counts", body: "Capacity, people inside and free seats per mess, refreshed as staff record entries and exits.", tone: "text-electric" },
  { icon: UtensilsCrossed, title: "Smart food menu", body: "Today's menu with veg/non-veg marks, remaining plates, allergens and student ratings.", tone: "text-ember" },
  { icon: Boxes, title: "Inventory control", body: "Staff log plates prepared, served and wasted — stock drops automatically and alerts fire early.", tone: "text-neon" },
  { icon: Sparkles, title: "Crowd prediction", body: "Historical snapshots project the next 15, 30 and 60 minutes and the quietest window to eat.", tone: "text-electric" },
  { icon: QrCode, title: "QR smart entry", body: "One pass per student, validated at the gate with duplicate check-in protection.", tone: "text-ember" },
  { icon: BellRing, title: "Smart notifications", body: "Alerts when the queue shortens, your favourite dish is back, or the menu changes.", tone: "text-neon" },
  { icon: LineChart, title: "Analytics for staff", body: "Peak hours, average wait, consumption and wastage — exportable as CSV in one click.", tone: "text-electric" },
  { icon: ShieldCheck, title: "Role-based access", body: "Students read. Staff update operations. Only admins manage roles and settings.", tone: "text-ember" },
];

export default function FeatureGrid() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {FEATURES.map((f, i) => (
        <div
          key={f.title}
          className="glass glass-hover group p-5"
          style={{ animation: `fade-up 0.6s cubic-bezier(0.22,1,0.36,1) ${i * 40}ms both` }}
        >
          <span className={`grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] ${f.tone}`}>
            <f.icon className="h-4.5 w-4.5" strokeWidth={1.7} />
          </span>
          <h3 className="mt-4 text-sm font-semibold text-white">{f.title}</h3>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">{f.body}</p>
        </div>
      ))}
    </div>
  );
}