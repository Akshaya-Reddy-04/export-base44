import React, { useState } from "react";
import { QrCode, Copy, Check, ShieldCheck, LogIn, LogOut, Loader2 } from "lucide-react";
import { qrImageUrl } from "@/lib/rush";
import { DemoBadge } from "@/components/rr/FreshnessPill";

export default function StudentPass({ profile, attendance, compact = false }) {
  const [copied, setCopied] = useState(false);
  const code = profile?.student_code;
  const inside = attendance && !attendance.exit_time;

  const copy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  if (!profile) {
    return (
      <div className="glass grid place-items-center p-8 text-sm text-muted-foreground">
        <Loader2 className="mb-2 h-4 w-4 animate-spin text-neon" /> Preparing your mess pass…
      </div>
    );
  }

  return (
    <div className="glass relative overflow-hidden p-5 sm:p-6">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-neon/10 blur-3xl" />
      <div className="flex items-center justify-between">
        <div>
          <div className="label-xs">Your mess pass</div>
          <h3 className="mt-1.5 flex items-center gap-2 text-base font-semibold text-white">
            <QrCode className="h-4 w-4 text-neon" /> Smart entry QR
          </h3>
        </div>
        {profile.is_demo && <DemoBadge label="DEMO" />}
      </div>

      <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row">
        <div className="rounded-2xl border border-neon/25 bg-[#070d18] p-2.5 shadow-[0_0_40px_-16px_rgba(34,255,154,0.7)]">
          <img
            src={qrImageUrl(code, compact ? 180 : 220)}
            alt="Your personal mess entry QR code"
            width={compact ? 180 : 220}
            height={compact ? 180 : 220}
            className="rounded-lg"
          />
        </div>
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <div className="text-sm font-semibold text-white">{profile.full_name}</div>
          <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">
            {profile.roll_number || "Roll number not set"}
          </div>
          <button
            type="button"
            onClick={copy}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/12 px-3 py-1.5 font-mono text-[10.5px] text-white transition-colors hover:border-neon/40 hover:text-neon"
          >
            {copied ? <Check className="h-3 w-3 text-neon" /> : <Copy className="h-3 w-3" />}
            {code}
          </button>

          <div
            className={`mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] ${
              inside
                ? "border-neon/30 bg-neon-soft text-neon"
                : "border-white/10 bg-white/[0.03] text-muted-foreground"
            }`}
          >
            {inside ? <LogIn className="h-3 w-3" /> : <LogOut className="h-3 w-3" />}
            {inside ? "Checked in — inside the mess" : "Not checked in yet"}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2.5">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neon" />
        <p className="text-[10.5px] leading-relaxed text-muted-foreground">
          Show this at the gate. Staff scan it to record your entry and exit — a second scan toggles you out, and the
          same pass cannot be checked in twice.
        </p>
      </div>
    </div>
  );
}