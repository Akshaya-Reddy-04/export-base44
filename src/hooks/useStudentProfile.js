import { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { makeStudentCode } from "@/lib/rush";
import { pageItems } from "@/hooks/useMessData";

// One profile record per signed-in student. Created on first visit so the
// dashboard, QR pass and preferences always have a record to work with.
const pending = new Map();

export function useStudentProfile(user) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.email) {
      setLoading(false);
      return;
    }
    if (pending.has(user.email)) {
      setProfile(await pending.get(user.email));
      setLoading(false);
      return;
    }
    const task = (async () => {
      const res = await base44.entities.Student.filter({ email: user.email }, { limit: 1 });
      const existing = pageItems(res)[0];
      if (existing) return existing;
      return base44.entities.Student.create({
        full_name: user.full_name || "Student",
        email: user.email,
        student_code: makeStudentCode(user.email),
        roll_number: "",
        hostel: "",
        mess_id: "",
        dietary_pref: "any",
        notify_queue: true,
        notify_crowd: true,
        notify_food: true,
        notify_menu: true,
        notify_browser: false,
        is_demo: false,
      });
    })();
    pending.set(user.email, task);
    const created = await task;
    setProfile(created);
    setLoading(false);
  }, [user?.email, user?.full_name]);

  useEffect(() => {
    load();
  }, [load]);

  const updateProfile = useCallback(
    async (patch) => {
      if (!profile?.id) return null;
      const updated = await base44.entities.Student.update(profile.id, patch);
      setProfile((prev) => ({ ...prev, ...patch }));
      return updated;
    },
    [profile?.id]
  );

  return { profile, loading, updateProfile, reload: load };
}