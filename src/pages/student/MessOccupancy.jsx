import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users, Armchair, LogIn, LogOut, Building2, RefreshCw, ArrowRight, Utensils, ShieldCheck,
} from "lucide-react";
import { PageHeading } from "@/components/rr/GlassCard";
import StatTile from "@/components/rr/StatTile";
import OccupancyRing from "@/components/rr/OccupancyRing";
import FreshnessPill from "@/components/rr/FreshnessPill";
import StudentPass from "@/components/student/StudentPass";
import { LoadingBlock } from "@/components/rr/EmptyState";
import { useMess } from "@/lib/MessContext";
import { useCampus } from "@/hooks/useCampus";
import { useStudentProfile } from "@/hooks/useStudentProfile";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { pageItems } from "@/hooks/useMessData";
import { todayKey, crowdLevel, occupancyPct, formatWait, clockTime } from "@/lib/rush";

export default function MessOccupancy() {
  const mess = useMess();
  const { user } = useAuth();
  const { profile } = useStudentProfile(user);
  const { rows } = useCampus();
  const [attendance, setAttendance] = useState(null);

  const { occupancy, queue, selectedMess, liveLoading, settings, refreshLive, refreshing } = mess;
  const capacity = selectedMess?.capacity || 0;
  const people = occupancy?.people_inside || 0;
  const pct = occupancyPct(people, capacity);
  const level = crowdLevel(pct);
  const free = Math.max(0, capacity - people - (occupancy?.seats_blocked || 0));

  useEffect(() => {
    if (!profile?.id) return;
    base44.entities.Attendance.filter(
      { student_id: profile.id, date: todayKey() },
      { sort: "-entry_time", limit: 5 }
    ).then((res) => setAttendance(pageItems(res)[0] || null));
  }, [profile?.id]);

  if (liveLoading && !occupancy) return <LoadingBlock label="Reading live occupancy…" />;

  return (
    <div className="space-y-6">
      <PageHeading
        title="Live mess occupancy"
        description={`Seat-by-seat view of ${selectedMess?.name || "your mess"}, updated as staff record entries and exits at the gate.`}
      >
        <FreshnessPill updatedAt={mess.updatedAt} staleMinutes={settings.stale_minutes} />
        <button
          type="button"
          onClick={refreshLive}
          className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.03] px-3.5 py-2 text-[11.5px] font-medium text-white hover:border-neon/40 hover:text-neon"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} /> Refresh
        </button>
      </PageHeading>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="glass flex flex-col items-center p-6">
          <div className="mb-2 flex w-full items-center justify-between">
            <span className="label-xs">Occupancy</span>
            <span className="font-mono text-[10px] text-muted-foreground">
              {people} / {capacity} seats
            </span>
          </div>
          <OccupancyRing value={pct} size={250} centerValue={`${pct}%`} centerLabel="Occupied" sublabel={level.headline} />
          <div className="mt-6 grid w-full grid-cols-2 gap-2.5">
            <div className="rounded-xl border border-neon/25 bg-neon/[0.06] px-3 py-3 text-center">
              <div className="stat-num text-2xl font-semibold text-neon">{free}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Seats available</div>
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-3 text-center">
              <div className="stat-num text-2xl font-semibold text-white">{capacity}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total capacity</div>
            </div>
          </div>
          <p className="mt-3 text-center text-[10.5px] text-muted-foreground">
            {occupancy?.seats_blocked ? `${occupancy.seats_blocked} seats blocked for maintenance · ` : ""}
            Recorded at {clockTime(occupancy?.updated_date)}
          </p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Inside" value={people} icon={Users} tone="electric" hint="people in mess" />
            <StatTile label="Eating" value={occupancy?.students_eating ?? 0} icon={Utensils} tone="ember" hint="at tables" />
            <StatTile label="Entries" value={occupancy?.entries_today ?? 0} icon={LogIn} tone="neon" hint="today" />
            <StatTile label="Exits" value={occupancy?.exits_today ?? 0} icon={LogOut} hint="today" />
          </div>

          <StudentPass profile={profile} attendance={attendance} compact />

          <div className="glass p-5">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                <ShieldCheck className="h-4 w-4 text-neon" /> Entry & exit tracking
              </h3>
              <span className="font-mono text-[10px] text-muted-foreground">gate log</span>
            </div>
            {attendance ? (
              <div className="mt-3 grid grid-cols-2 gap-2.5 text-[11.5px]">
                <div className="rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2">
                  <div className="label-xs">Entry</div>
                  <div className="mt-0.5 font-mono text-white">{clockTime(attendance.entry_time)}</div>
                </div>
                <div className="rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2">
                  <div className="label-xs">Exit</div>
                  <div className="mt-0.5 font-mono text-white">
                    {attendance.exit_time ? clockTime(attendance.exit_time) : "still inside"}
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-[11.5px] text-muted-foreground">
                No gate record for you today. Staff scan your QR at the entrance to check you in.
              </p>
            )}
            <p className="mt-3 text-[10px] text-muted-foreground">
              Duplicate check-ins are blocked: one open entry per student, per mess.
            </p>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <div className="label-xs">Mess comparison</div>
            <h3 className="mt-1 text-base font-semibold text-white">Where is it quietest right now?</h3>
          </div>
          <Link to="/predictions" className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-neon hover:underline">
            Predictions <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row) => (
            <div key={row.mess.id} className="glass glass-hover p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-semibold text-white">{row.mess.name}</div>
                  <div className="text-[10.5px] text-muted-foreground">
                    {row.occupancy?.people_inside ?? 0}/{row.mess.capacity} seats · {formatWait(row.wait)}
                  </div>
                </div>
                <span className="stat-num text-sm font-semibold" style={{ color: row.level.hex }}>{row.pct}%</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.max(3, row.pct)}%`, background: row.level.hex }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider" style={{ color: row.level.hex }}>
                  {row.level.label}
                </span>
                <span className="text-[10px] text-muted-foreground">{row.queue?.waiting_students ?? 0} in queue</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}