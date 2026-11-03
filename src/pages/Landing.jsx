import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, Sparkles, ShieldCheck, MapPin, Mail, Phone, Clock, ChevronRight,
} from "lucide-react";
import RadarLogo from "@/components/rr/RadarLogo";
import HeroPreview from "@/components/landing/HeroPreview";
import MessLiveGrid from "@/components/landing/MessLiveGrid";
import FeatureGrid from "@/components/landing/FeatureGrid";
import HowItWorks from "@/components/landing/HowItWorks";
import { DemoBadge } from "@/components/rr/FreshnessPill";
import { useCampus } from "@/hooks/useCampus";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { pageItems } from "@/hooks/useMessData";
import { roleHome } from "@/lib/rush";

const NAV_LINKS = [
  { label: "Live messes", href: "#live-messes" },
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Contact", href: "#contact" },
];

export default function Landing() {
  const { rows, loading } = useCampus();
  const { user } = useAuth();
  const [menu, setMenu] = useState([]);

  useEffect(() => {
    base44.entities.MenuItem.filter({ status: "available" }, { sort: "-is_special", limit: 3 })
      .then((res) => setMenu(pageItems(res)))
      .catch(() => setMenu([]));
  }, []);

  const featured = rows[0] || null;

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[620px] grid-lines opacity-70" />

      {/* NAV */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#05080f]/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Link to="/" className="shrink-0">
            <RadarLogo size={34} showWordmark />
          </Link>
          <nav className="ml-6 hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="rounded-full px-3 py-1.5 text-[12.5px] text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {user ? (
              <Link
                to={roleHome(user.role)}
                className="inline-flex items-center gap-2 rounded-full bg-neon px-4 py-2 text-[12.5px] font-semibold text-black transition-transform hover:scale-[1.03]"
              >
                Open dashboard <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden rounded-full border border-white/12 px-3.5 py-2 text-[12.5px] font-medium text-white transition-colors hover:border-neon/40 hover:text-neon sm:inline-flex"
                >
                  Student Login
                </Link>
                <Link
                  to="/login"
                  className="rounded-full border border-electric/30 bg-electric/10 px-3.5 py-2 text-[12.5px] font-medium text-electric transition-colors hover:bg-electric/20"
                >
                  Staff Login
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 rounded-full bg-neon px-4 py-2 text-[12.5px] font-semibold text-black transition-transform hover:scale-[1.03]"
                >
                  Get Started <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-6 sm:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          <div className="animate-fade-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-neon/25 bg-neon/[0.07] px-3 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-neon">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neon opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-neon" />
              </span>
              Live campus mess intelligence
            </div>

            <h1 className="mt-5 font-display text-[38px] font-semibold leading-[1.05] tracking-tight text-white sm:text-[54px] lg:text-[60px]">
              Never Stand in a
              <br />
              Long Food Queue
              <span className="text-neon neon-text"> Again.</span>
            </h1>

            <p className="mt-5 max-w-xl text-[14.5px] leading-relaxed text-slate-400">
              Rush Radar gives every hostel mess a live pulse — queue length, seats free, plates left and
              the estimated wait — updated by mess staff and refreshed on your phone before you leave the room.
              Beat the rush, not the food.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                to="/register"
                className="group inline-flex items-center gap-2 rounded-full bg-neon px-5 py-3 text-[13px] font-semibold text-black shadow-[0_0_40px_-10px_rgba(34,255,154,0.8)] transition-transform hover:scale-[1.03]"
              >
                Get Started <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.03] px-5 py-3 text-[13px] font-medium text-white transition-colors hover:border-neon/40 hover:text-neon"
              >
                Student Login
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-full border border-electric/25 bg-electric/[0.07] px-5 py-3 text-[13px] font-medium text-electric transition-colors hover:border-electric/50"
              >
                Staff Login
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[11.5px] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-neon" /> Role-based access</span>
              <span className="inline-flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-electric" /> Crowd predictions</span>
              <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-ember" /> Updates every 20 seconds</span>
            </div>
          </div>

          <div className="animate-fade-up" style={{ animationDelay: "120ms" }}>
            <HeroPreview row={featured} menu={menu} loading={loading} />
          </div>
        </div>
      </section>

      {/* LIVE MESSES */}
      <section id="live-messes" className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="label-xs mb-2">Campus radar</div>
            <h2 className="text-2xl font-semibold text-white sm:text-3xl">Every mess, one glance</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Live crowd levels pulled from staff updates across all mess locations.
            </p>
          </div>
          <DemoBadge label="DEMO DATA UNTIL STAFF CONNECT" />
        </div>
        <MessLiveGrid rows={rows} loading={loading} />
      </section>

      {/* FEATURES */}
      <section id="features" className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-6 max-w-2xl">
          <div className="label-xs mb-2">Platform</div>
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">Built for how a mess actually runs</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Students get clarity. Staff get controls. Admins get the whole picture — with real records behind every number.
          </p>
        </div>
        <FeatureGrid />
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-6 max-w-2xl">
          <div className="label-xs mb-2">How it works</div>
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">Three steps to a calmer meal</h2>
        </div>
        <HowItWorks />
      </section>

      {/* CONTACT */}
      <section id="contact" className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="glass relative overflow-hidden p-7 sm:p-10">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-neon/10 blur-3xl" />
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="label-xs mb-2">Contact</div>
              <h2 className="text-2xl font-semibold text-white">Want Rush Radar in your mess?</h2>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
                Roll it out across hostel messes in a day. Mess managers get the update panel, students get the radar,
                and your mess office keeps ownership of every record.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/register" className="inline-flex items-center gap-2 rounded-full bg-neon px-4 py-2.5 text-[12.5px] font-semibold text-black">
                  Create a student account <ChevronRight className="h-3.5 w-3.5" />
                </Link>
                <Link to="/login" className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-[12.5px] font-medium text-white hover:border-neon/40 hover:text-neon">
                  Staff sign in
                </Link>
              </div>
            </div>
            <div className="grid gap-2.5">
              {[
                { icon: Mail, label: "Mess office", value: "mess.office@rushradar.app" },
                { icon: Phone, label: "Helpdesk", value: "+91 00000 00000" },
                { icon: MapPin, label: "Office", value: "Block A, Ground Floor, Campus" },
              ].map((c) => (
                <div key={c.label} className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-neon">
                    <c.icon className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{c.label}</div>
                    <div className="text-[12.5px] text-white">{c.value}</div>
                  </div>
                </div>
              ))}
              <p className="px-1 text-[10.5px] text-muted-foreground">
                Sample contact details — replace them with your mess office's real details.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/[0.06] bg-[#05080f]/70">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <RadarLogo size={32} showWordmark tagline />
            <p className="mt-3 max-w-xs text-[12px] leading-relaxed text-muted-foreground">
              Beat the Queue. Track Your Food. Eat Smarter. A live mess monitoring platform for hostel and college campuses.
            </p>
          </div>
          <div>
            <div className="label-xs mb-3">Students</div>
            <ul className="space-y-2 text-[12px] text-slate-400">
              <li><Link to="/dashboard" className="hover:text-neon">Live dashboard</Link></li>
              <li><Link to="/queue" className="hover:text-neon">Queue tracking</Link></li>
              <li><Link to="/menu" className="hover:text-neon">Today's menu</Link></li>
              <li><Link to="/predictions" className="hover:text-neon">Crowd prediction</Link></li>
            </ul>
          </div>
          <div>
            <div className="label-xs mb-3">Mess team</div>
            <ul className="space-y-2 text-[12px] text-slate-400">
              <li><Link to="/admin" className="hover:text-neon">Admin overview</Link></li>
              <li><Link to="/admin/scanner" className="hover:text-neon">QR gate scanner</Link></li>
              <li><Link to="/admin/inventory" className="hover:text-neon">Stock & wastage</Link></li>
              <li><Link to="/admin/reports" className="hover:text-neon">CSV reports</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/[0.06] px-4 py-4 text-center text-[11px] text-muted-foreground sm:px-6">
          © {new Date().getFullYear()} Rush Radar · Demo data is clearly labelled until your mess team starts updating live.
        </div>
      </footer>
    </div>
  );
}