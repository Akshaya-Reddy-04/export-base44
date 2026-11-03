import React, { useEffect, useMemo, useState } from "react";
import { UserPlus, Search, Trash2, Mail, ShieldCheck, Loader2, Check, QrCode } from "lucide-react";
import { PageHeading } from "@/components/rr/GlassCard";
import StatTile from "@/components/rr/StatTile";
import { LoadingBlock } from "@/components/rr/EmptyState";
import { useMess } from "@/lib/MessContext";
import { base44 } from "@/api/base44Client";
import { pageItems } from "@/hooks/useMessData";
import { makeStudentCode } from "@/lib/rush";

const BLANK = { full_name: "", roll_number: "", email: "", hostel: "" };

export default function AdminStudents() {
  const { messes } = useMess();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState(BLANK);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState("");
  const [busyId, setBusyId] = useState("");

  const load = () => {
    base44.entities.Student.list({ sort: "-created_date", limit: 300 }).then((res) => {
      setStudents(pageItems(res));
      setLoading(false);
    });
  };

  useEffect(load, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        (s.full_name || "").toLowerCase().includes(q) ||
        (s.roll_number || "").toLowerCase().includes(q) ||
        (s.email || "").toLowerCase().includes(q) ||
        (s.student_code || "").toLowerCase().includes(q)
    );
  }, [students, search]);

  const assigned = students.filter((s) => s.mess_id).length;

  const addStudent = async (e) => {
    e.preventDefault();
    if (!draft.full_name.trim() || !draft.email.trim()) return;
    setSaving(true);
    try {
      const created = await base44.entities.Student.create({
        full_name: draft.full_name.trim(),
        roll_number: draft.roll_number.trim(),
        email: draft.email.trim(),
        hostel: draft.hostel.trim(),
        student_code: makeStudentCode(draft.email),
        dietary_pref: "any",
        is_demo: false,
      });
      setStudents((prev) => [created, ...prev]);
      setNote(`${created.full_name} added with pass ${created.student_code}`);
      setDraft(BLANK);
      setAdding(false);
    } finally {
      setSaving(false);
    }
  };

  const setMess = async (student, messId) => {
    setBusyId(student.id);
    try {
      const mess = messes.find((m) => m.id === messId);
      const updated = await base44.entities.Student.update(student.id, { mess_id: messId });
      setStudents((prev) => prev.map((s) => (s.id === student.id ? { ...s, mess_id: updated.mess_id } : s)));
      setNote(`${student.full_name} assigned to ${mess?.name || "no mess"}`);
    } finally {
      setBusyId("");
    }
  };

  const remove = async (student) => {
    setBusyId(student.id);
    try {
      await base44.entities.Student.delete(student.id);
      setStudents((prev) => prev.filter((s) => s.id !== student.id));
    } finally {
      setBusyId("");
    }
  };

  const invite = async (student) => {
    setBusyId(student.id);
    try {
      await base44.users.inviteUser(student.email, "user");
      setNote(`Invite sent to ${student.email}`);
    } catch (err) {
      setNote(err?.message || "Could not send the invite.");
    } finally {
      setBusyId("");
    }
  };

  if (loading) return <LoadingBlock label="Loading student records…" />;

  return (
    <div className="space-y-6">
      <PageHeading title="Student management" description="Assign students to a mess, issue passes and invite them to the app.">
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-full bg-neon px-4 py-2 text-[12px] font-semibold text-black"
        >
          <UserPlus className="h-3.5 w-3.5" /> Add student
        </button>
      </PageHeading>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Students" value={students.length} icon={ShieldCheck} tone="neon" hint="total records" />
        <StatTile label="Assigned" value={assigned} icon={QrCode} tone="electric" hint="have a mess" />
        <StatTile label="Unassigned" value={students.length - assigned} icon={UserPlus} tone="ember" hint="need a mess" />
        <StatTile label="Messes" value={messes.length} icon={ShieldCheck} hint="active locations" />
      </div>

      {adding && (
        <form onSubmit={addStudent} className="glass p-5">
          <h3 className="text-sm font-semibold text-white">New student record</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { key: "full_name", label: "Full name" },
              { key: "roll_number", label: "Roll number" },
              { key: "email", label: "Email" },
              { key: "hostel", label: "Hostel" },
            ].map((f) => (
              <label key={f.key} className="block">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{f.label}</span>
                <input
                  value={draft[f.key]}
                  onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-[#070d18] px-2.5 py-2 text-[12px] text-white outline-none focus:border-neon/50"
                />
              </label>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-neon px-4 py-2 text-[12px] font-semibold text-black disabled:opacity-40">
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} Save student
            </button>
            <button type="button" onClick={() => setAdding(false)} className="rounded-lg border border-white/12 px-4 py-2 text-[12px] text-muted-foreground hover:text-white">
              Cancel
            </button>
          </div>
        </form>
      )}

      {note && <div className="rounded-xl border border-neon/25 bg-neon/[0.07] px-4 py-2.5 text-[11.5px] text-neon">{note}</div>}

      <div className="glass p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, roll number, email or pass code"
            className="w-full rounded-xl border border-white/10 bg-[#070d18] py-2.5 pl-9 pr-3 text-[12.5px] text-white outline-none placeholder:text-muted-foreground/60 focus:border-neon/50"
          />
        </div>

        <div className="mt-3 divide-y divide-white/[0.05]">
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-[11.5px] text-muted-foreground">No students match this search.</p>
          ) : (
            filtered.slice(0, 60).map((s) => (
              <div key={s.id} className="flex flex-wrap items-center gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12.5px] font-medium text-white">{s.full_name}</div>
                  <div className="truncate font-mono text-[9.5px] text-muted-foreground">
                    {s.roll_number || "no roll"} · {s.student_code} · {s.email || "no email"}
                  </div>
                </div>
                <select
                  value={s.mess_id || ""}
                  disabled={busyId === s.id}
                  onChange={(e) => setMess(s, e.target.value)}
                  className="w-[160px] rounded-lg border border-white/10 bg-[#070d18] px-2 py-1.5 text-[11px] text-white outline-none focus:border-neon/50"
                >
                  <option value="">No mess</option>
                  {messes.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => invite(s)}
                  disabled={!s.email || busyId === s.id}
                  className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-[10.5px] text-slate-300 hover:border-electric/40 hover:text-electric disabled:opacity-40"
                >
                  <Mail className="h-3 w-3" /> Invite
                </button>
                <button
                  type="button"
                  onClick={() => remove(s)}
                  disabled={busyId === s.id}
                  aria-label={`Delete ${s.full_name}`}
                  className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 text-slate-300 hover:border-danger/40 hover:text-danger disabled:opacity-40"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}