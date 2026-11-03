import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LogOut, Heart, Star, History, UserRound, Trash2 } from "lucide-react";
import { PageHeading } from "@/components/rr/GlassCard";
import StudentPass from "@/components/student/StudentPass";
import ProfileForm from "@/components/student/ProfileForm";
import VisitHistory from "@/components/student/VisitHistory";
import ComplaintPanel from "@/components/student/ComplaintPanel";
import { LoadingBlock } from "@/components/rr/EmptyState";
import { useAuth } from "@/lib/AuthContext";
import { useStudentProfile } from "@/hooks/useStudentProfile";
import { useMess } from "@/lib/MessContext";
import { base44 } from "@/api/base44Client";
import { pageItems } from "@/hooks/useMessData";
import { todayKey } from "@/lib/rush";

const initials = (name) =>
  String(name || "S")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");

export default function Profile() {
  const { user, logout } = useAuth();
  const { profile, loading, updateProfile } = useStudentProfile(user);
  const { messes, selectedMess } = useMess();
  const [favorites, setFavorites] = useState([]);
  const [stats, setStats] = useState({ visits: 0, reviews: 0 });
  const [attendance, setAttendance] = useState(null);

  useEffect(() => {
    if (!profile?.id) return;
    Promise.all([
      base44.entities.Favorite.list({ limit: 100 }),
      base44.entities.Attendance.filter({ student_id: profile.id }, { limit: 200 }),
      base44.entities.FoodReview.filter({ created_by_id: user?.id }, { limit: 200 }),
    ]).then(([favRes, attRes, revRes]) => {
      setFavorites(pageItems(favRes));
      const visits = pageItems(attRes);
      setAttendance(visits.find((v) => v.date === todayKey()) || null);
      setStats({ visits: visits.length, reviews: pageItems(revRes).length });
    });
  }, [profile?.id, user?.id]);

  const removeFavorite = async (fav) => {
    await base44.entities.Favorite.delete(fav.id);
    setFavorites((prev) => prev.filter((f) => f.id !== fav.id));
  };

  if (loading) return <LoadingBlock label="Loading your profile…" />;

  const messName = messes.find((m) => m.id === profile?.mess_id)?.name || selectedMess?.name || "Not assigned";
  const dietLabel = { veg: "Vegetarian", non_veg: "Non-vegetarian", any: "No preference" }[profile?.dietary_pref] || "No preference";

  return (
    <div className="space-y-6">
      <PageHeading title="My profile" description="Your mess pass, preferences and everything Rush Radar remembers for you." />

      <div className="glass relative overflow-hidden p-5 sm:p-6">
        <div className="pointer-events-none absolute -left-16 -top-20 h-52 w-52 rounded-full bg-electric/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-neon/30 bg-neon/10 font-display text-xl font-semibold text-neon">
            {initials(profile?.full_name || user?.full_name)}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold text-white">{profile?.full_name || user?.full_name || "Student"}</h2>
            <p className="truncate text-[12px] text-muted-foreground">
              {profile?.roll_number || "No roll number"} · {profile?.hostel || "No hostel set"}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[10.5px]">
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-slate-300">{messName}</span>
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-slate-300">{dietLabel}</span>
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-slate-300">{user?.email}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ProfileForm profile={profile} onSave={updateProfile} />
            <button
              type="button"
              onClick={() => logout()}
              className="inline-flex items-center gap-1.5 rounded-full border border-danger/30 bg-danger/[0.08] px-3.5 py-2 text-[11.5px] font-medium text-danger hover:bg-danger/15"
            >
              <LogOut className="h-3 w-3" /> Sign out
            </button>
          </div>
        </div>

        <div className="relative mt-5 grid grid-cols-3 gap-2.5">
          {[
            { label: "Mess visits", value: stats.visits, icon: History },
            { label: "Reviews written", value: stats.reviews, icon: Star },
            { label: "Dishes saved", value: favorites.length, icon: Heart },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2.5 text-center">
              <s.icon className="mx-auto h-3.5 w-3.5 text-muted-foreground" />
              <div className="stat-num mt-1 text-xl font-semibold text-white">{s.value}</div>
              <div className="text-[9.5px] uppercase tracking-wider text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <StudentPass profile={profile} attendance={attendance} compact />
        <VisitHistory studentId={profile?.id} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass p-5">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-danger" />
            <h3 className="text-base font-semibold text-white">Saved dishes</h3>
            <Link to="/menu" className="ml-auto text-[10.5px] text-neon hover:underline">Browse menu</Link>
          </div>
          {favorites.length === 0 ? (
            <p className="mt-3 text-[11.5px] text-muted-foreground">
              Tap the heart on any dish to follow it — you'll be alerted when it returns.
            </p>
          ) : (
            <div className="mt-3 space-y-1.5">
              {favorites.map((f) => (
                <div key={f.id} className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                  <UserRound className="h-3 w-3 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate text-[12px] text-white">{f.item_name}</span>
                  <button
                    type="button"
                    onClick={() => removeFavorite(f)}
                    aria-label={`Remove ${f.item_name}`}
                    className="text-muted-foreground transition-colors hover:text-danger"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <ComplaintPanel />
      </div>
    </div>
  );
}