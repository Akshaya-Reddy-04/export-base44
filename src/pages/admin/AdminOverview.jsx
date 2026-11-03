import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users, ListOrdered, Armchair, Timer, Utensils, DoorOpen, AlertTriangle,
  MessageSquareWarning, QrCode, ArrowRight,
} from "lucide-react";
import { PageHeading } from "@/components/rr/GlassCard";
import StatTile from "@/components/rr/StatTile";
import FreshnessPill from "@/components/rr/FreshnessPill";
import QuickUpdate from "@/components/admin/QuickUpdate";
import AlertComposer from "@/components/admin/AlertComposer";
import { LoadingBlock } from "@/components/rr/EmptyState";
import { useMess } from "@/lib/MessContext";
import { useMenu } from "@/hooks/useMessContent";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { pageItems } from "@/hooks/useMessData";
import { saveQueueStatus, saveOccupancy, recordSnapshot } from "@/lib/liveOps";
import {
  waitMinutes, occupancyPct, crowdLevel, isLowStock, todayKey, clockTime,
} from "@/lib/rush";

const COMPLAINT_STATUS = {
  submitted: "text-slate-300",
  under_review: "text-electric",
  in_progress: "text-ember",
  resolved: "text-neon",
};

export default function AdminOverview() {
  const { user } = useAuth();
  const mess = useMess();
  const { queue, occupancy, selectedMess, selectedId, settings, liveLoading, updatedAt, refreshLive } = mess;
  const { items } = useMenu(selectedId);
  const [complaints, setComplaints] = useState([]);
  const [checkIns, setCheckIns] = useState([]);
  const [saving, setSaving] = useState("");

  const capacity = selectedMess?.capacity || 0;
  const people = occupancy?.people_inside || 0;
  const pct = occupancyPct(people, capacity);
  const level = crowdLevel(pct);
  const wait = waitMinutes(queue?.waiting_students || 0, queue?.counters_open || 1, queue?.avg_serving_seconds || 45);
  const lowStock = items.filter((i) => isLowStock(i, settings.low_stock_threshold));

  const loadSide = () => {
    base44.entities.Complaint.list({ sort: "-created_date", limit: 40 }).then((res) => {
      setComplaints(pageItems(res).filter((c) => c.mess_id === selectedId || !c.mess_id));
    });
    base44.entities.Attendance.filter({ mess_id: selectedId }, { sort: "-entry_time", limit: 6 }).then((res) => {
      setCheckIns(pageItems(res));
    });
  };

  useEffect(() => {
    if (!selectedId) return;
    loadSide();
  }, [selectedId]);

  const updateQueue = async (value) => {
    setSaving("queue");
    try {
      const saved = await saveQueueStatus({
        messId: selectedId,
        messName: selectedMess?.name,
        current: queue,
        patch: { waiting_students: value },
        staffName: user?.full_name,
      });
      await recordSnapshot({ messId: selectedId, occupancy, queue: saved, capacity });
      await refreshLive();
    } finally {
      setSaving("");
    }
  };

  const updateOccupancy = async (value) => {
    setSaving("occupancy");
    try {
      const saved = await saveOccupancy({
        messId: selectedId,
        messName: selectedMess?.name,
        current: occupancy,
        patch: { people_inside: value },
        staffName: user?.full_name,
      });
      await recordSnapshot({ messId: selectedId, occupancy: saved, queue, capacity });
      await refreshLive();
    } finally {
      setSaving("");
    }
  };

  if (liveLoading && !queue) return <LoadingBlock label="Loading the control room…" />;

  const openComplaints = complaints.filter((c) => c.status !== "resolved");
  const todayVisits = checkIns.filter((c) => c.date === todayKey()).length;

  return (
    <div className="space-y-6">
      <PageHeading
        title="Control room"
        description={`Live operation of ${selectedMess?.name || "your mess"} — update the counters, keep students informed.`}
      >
        <FreshnessPill updatedAt={updatedAt} staleMinutes={settings.stale_minutes} />
      </PageHeading>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label="Inside now" value={people} icon={Users} tone="electric" hint={`of ${capacity} seats`} />
        <StatTile label="In queue" value={queue?.waiting_students ?? 0} icon={ListOrdered} tone="neon" hint="students waiting" />
        <StatTile label="Est. wait" value={wait} suffix="min" icon={Timer} tone="ember" hint="from open counters" />
        <StatTile label="Eating" value={occupancy?.students_eating ?? 0} icon={Utensils} hint="at the tables" />
        <StatTile label="Seats free" value={Math.max(0, capacity - people - (occupancy?.seats_blocked || 0))} icon={Armchair} hint="available" />
        <StatTile label="Counters" value={`${queue?.counters_open ?? 0}/${queue?.total_counters ?? 0}`} icon={DoorOpen} tone="electric" hint="open now" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="glass p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="label-xs">Quick update</div>
              <h3 className="mt-1.5 text-base font-semibold text-white">Change the live numbers</h3>
            </div>
            <span className="rounded-full px-2.5 py-1 text-[10px] font-semibold" style={{ color: level.hex, background: `${level.hex}14` }}>
              {pct}% full
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <QuickUpdate label="In queue" value={queue?.waiting_students || 0} step={5} saving={saving === "queue"} onSave={updateQueue} suffix="students" />
            <QuickUpdate label="Inside" value={people} step={5} saving={saving === "occupancy"} onSave={updateOccupancy} suffix="people" />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/admin/queue" className="inline-flex items-center gap-1.5 rounded-full border border-white/12 px-3 py-1.5 text-[11px] text-white hover:border-neon/40 hover:text-neon">
              Full queue panel <ArrowRight className="h-3 w-3" />
            </Link>
            <Link to="/admin/occupancy" className="inline-flex items-center gap-1.5 rounded-full border border-white/12 px-3 py-1.5 text-[11px] text-white hover:border-neon/40 hover:text-neon">
              Occupancy panel <ArrowRight className="h-3 w-3" />
            </Link>
            <Link to="/admin/scanner" className="inline-flex items-center gap-1.5 rounded-full border border-white/12 px-3 py-1.5 text-[11px] text-white hover:border-neon/40 hover:text-neon">
              <QrCode className="h-3 w-3" /> Scan a pass
            </Link>
          </div>
        </div>

        <AlertComposer messId={selectedId} messName={selectedMess?.name} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-ember" />
            <h3 className="text-sm font-semibold text-white">Low stock</h3>
            <Link to="/admin/inventory" className="ml-auto text-[10.5px] text-neon hover:underline">Inventory</Link>
          </div>
          {lowStock.length === 0 ? (
            <p className="mt-3 text-[11.5px] text-muted-foreground">Every dish is above the low-stock threshold.</p>
          ) : (
            <div className="mt-3 space-y-1.5">
              {lowStock.slice(0, 5).map((i) => (
                <div key={i.id} className="flex items-center justify-between rounded-lg border border-ember/25 bg-ember/[0.06] px-2.5 py-2">
                  <span className="truncate text-[11.5px] text-white">{i.name}</span>
                  <span className="ml-2 shrink-0 font-mono text-[10px] text-ember">{i.remaining_quantity} left</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass p-5">
          <div className="flex items-center gap-2">
            <MessageSquareWarning className="h-4 w-4 text-electric" />
            <h3 className="text-sm font-semibold text-white">Open complaints</h3>
            <Link to="/admin/complaints" className="ml-auto text-[10.5px] text-neon hover:underline">All</Link>
          </div>
          {openComplaints.length === 0 ? (
            <p className="mt-3 text-[11.5px] text-muted-foreground">Nothing pending — the inbox is clear.</p>
          ) : (
            <div className="mt-3 space-y-1.5">
              {openComplaints.slice(0, 3).map((c) => (
                <div key={c.id} className="rounded-lg border border-white/[0.07] bg-white/[0.02] px-2.5 py-2">
                  <p className="line-clamp-2 text-[11px] text-slate-200">{c.description}</p>
                  <div className="mt-1 flex items-center justify-between text-[9.5px]">
                    <span className="uppercase tracking-wider text-muted-foreground">{c.category.replace("_", " ")}</span>
                    <span className={COMPLAINT_STATUS[c.status]}>{c.status.replace("_", " ")}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass p-5">
          <div className="flex items-center gap-2">
            <QrCode className="h-4 w-4 text-neon" />
            <h3 className="text-sm font-semibold text-white">Latest gate scans</h3>
            <span className="ml-auto font-mono text-[10px] text-muted-foreground">{todayVisits} today</span>
          </div>
          {checkIns.length === 0 ? (
            <p className="mt-3 text-[11.5px] text-muted-foreground">No gate activity recorded yet.</p>
          ) : (
            <div className="mt-3 space-y-1.5">
              {checkIns.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2">
                  <div className="min-w-0">
                    <div className="truncate text-[11.5px] text-white">{c.student_name}</div>
                    <div className="font-mono text-[9px] text-muted-foreground">{c.roll_number || c.student_code}</div>
                  </div>
                  <span className="ml-2 shrink-0 font-mono text-[10px] text-neon">{clockTime(c.entry_time)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}