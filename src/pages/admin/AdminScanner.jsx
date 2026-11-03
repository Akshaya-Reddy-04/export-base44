import React, { useCallback, useEffect, useRef, useState } from "react";
import { QrCode, Keyboard, Loader2, CheckCircle2, LogOut, LogIn, AlertTriangle, Users } from "lucide-react";
import { PageHeading } from "@/components/rr/GlassCard";
import QrCamera from "@/components/admin/QrCamera";
import { useMess } from "@/lib/MessContext";
import { base44 } from "@/api/base44Client";
import { loadStudentsForMess } from "@/lib/liveOps";
import { clockTime } from "@/lib/rush";

export default function AdminScanner() {
  const mess = useMess();
  const { selectedId, selectedMess, refreshLive } = mess;
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [log, setLog] = useState([]);
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const inputRef = useRef(null);
  const lastScan = useRef({ code: "", at: 0 });

  useEffect(() => {
    if (!selectedId) return;
    loadStudentsForMess(selectedId).then(setStudents);
  }, [selectedId]);

  const submit = useCallback(
    async (raw) => {
      const value = String(raw || "").trim().toUpperCase();
      if (!value || sending) return;
      const now = Date.now();
      if (lastScan.current.code === value && now - lastScan.current.at < 2500) return;
      lastScan.current = { code: value, at: now };

      setSending(true);
      setError("");
      try {
        const res = await base44.functions.invoke("scanAttendance", { code: value, mess_id: selectedId });
        setResult(res.data);
        setLog((prev) => [{ ...res.data, at: new Date().toISOString() }, ...prev].slice(0, 12));
        setCode("");
        refreshLive();
      } catch (err) {
        setResult(null);
        setError(err?.response?.data?.error || "Could not record this pass.");
      } finally {
        setSending(false);
        inputRef.current?.focus();
      }
    },
    [selectedId, sending, refreshLive]
  );

  const filtered = students
    .filter((s) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        (s.full_name || "").toLowerCase().includes(q) ||
        (s.roll_number || "").toLowerCase().includes(q) ||
        (s.student_code || "").toLowerCase().includes(q)
      );
    })
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <PageHeading title="QR attendance scanner" description={`Check students in and out of ${selectedMess?.name || "this mess"}. One pass toggles entry and exit.`} />

      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <div className="glass p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <QrCode className="h-4 w-4 text-neon" />
            <h3 className="text-base font-semibold text-white">Scan a student pass</h3>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit(code);
            }}
            className="mt-4"
          >
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Pass code</label>
            <div className="mt-1.5 flex gap-2">
              <div className="relative flex-1">
                <Keyboard className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  ref={inputRef}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="RR-XXXXXX-XXXX"
                  autoFocus
                  className="w-full rounded-xl border border-white/10 bg-[#070d18] py-2.5 pl-9 pr-3 font-mono text-[13px] text-white outline-none placeholder:text-muted-foreground/60 focus:border-neon/50"
                />
              </div>
              <button
                type="submit"
                disabled={sending || !code.trim()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-neon px-4 py-2.5 text-[12px] font-semibold text-black disabled:opacity-40"
              >
                {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                Record
              </button>
            </div>
          </form>

          <div className="mt-4">
            <QrCamera onDetect={submit} active={!sending} />
          </div>

          {result && (
            <div className={`mt-4 rounded-xl border px-4 py-3 ${result.action === "checkin" ? "border-neon/30 bg-neon/[0.08]" : "border-electric/30 bg-electric/[0.08]"}`}>
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider">
                {result.action === "checkin" ? <LogIn className="h-3.5 w-3.5 text-neon" /> : <LogOut className="h-3.5 w-3.5 text-electric" />}
                <span className={result.action === "checkin" ? "text-neon" : "text-electric"}>
                  {result.action === "checkin" ? "Checked in" : "Checked out"}
                </span>
              </div>
              <div className="mt-1 text-[14px] font-semibold text-white">{result.student_name}</div>
              <div className="font-mono text-[10.5px] text-muted-foreground">{result.roll_number || "no roll number"}</div>
              <div className="mt-1.5 font-mono text-[10.5px] text-slate-300">
                {clockTime(result.entry_time)} → {result.exit_time ? clockTime(result.exit_time) : "still inside"}
                {result.people_inside !== null && ` · ${result.people_inside} inside now`}
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/[0.08] px-3 py-2.5">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger" />
              <p className="text-[11.5px] text-danger">{error}</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="glass p-5">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-electric" />
              <h3 className="text-sm font-semibold text-white">No QR? Find the student</h3>
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, roll number or code"
              className="mt-2 w-full rounded-lg border border-white/10 bg-[#070d18] px-2.5 py-2 text-[12px] text-white outline-none placeholder:text-muted-foreground/60 focus:border-neon/50"
            />
            <div className="mt-2 space-y-1">
              {filtered.length === 0 ? (
                <p className="text-[11px] text-muted-foreground">
                  No students assigned to this mess yet. Add them from the Students page.
                </p>
              ) : (
                filtered.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => submit(s.student_code)}
                    className="flex w-full items-center justify-between rounded-lg border border-white/[0.07] bg-white/[0.02] px-2.5 py-2 text-left hover:border-neon/30"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[11.5px] text-white">{s.full_name}</span>
                      <span className="block font-mono text-[9px] text-muted-foreground">{s.student_code}</span>
                    </span>
                    <span className="ml-2 shrink-0 font-mono text-[9.5px] text-neon">tap to scan</span>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="glass p-5">
            <div className="label-xs">This session</div>
            {log.length === 0 ? (
              <p className="mt-2 text-[11.5px] text-muted-foreground">Scans you record will be listed here.</p>
            ) : (
              <div className="mt-2 space-y-1">
                {log.map((l, i) => (
                  <div key={`${l.student_name}-${i}`} className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5">
                    <span className="truncate text-[11px] text-white">{l.student_name}</span>
                    <span className={`ml-2 shrink-0 font-mono text-[9.5px] ${l.action === "checkin" ? "text-neon" : "text-electric"}`}>
                      {l.action === "checkin" ? "in" : "out"} · {clockTime(l.at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}