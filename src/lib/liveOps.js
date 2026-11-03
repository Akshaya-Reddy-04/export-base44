import { base44 } from "@/api/base44Client";
import { pageItems } from "@/hooks/useMessData";

// Writes made by mess staff: live counters plus the history snapshot that
// predictions are built from. Keeping them together means every staff save
// leaves the same trail of records.

export async function saveQueueStatus({ messId, messName, current, patch, staffName }) {
  const payload = {
    mess_id: messId,
    mess_name: messName || current?.mess_name || "",
    waiting_students: Math.max(0, Number(patch.waiting_students ?? current?.waiting_students ?? 0)),
    counters_open: Math.max(0, Number(patch.counters_open ?? current?.counters_open ?? 1)),
    total_counters: Math.max(1, Number(patch.total_counters ?? current?.total_counters ?? 3)),
    avg_serving_seconds: Math.max(10, Number(patch.avg_serving_seconds ?? current?.avg_serving_seconds ?? 45)),
    status_note: patch.status_note ?? current?.status_note ?? "",
    updated_by_name: staffName || "Staff",
    is_demo: false,
  };
  const saved = current?.id
    ? await base44.entities.QueueStatus.update(current.id, payload)
    : await base44.entities.QueueStatus.create(payload);
  return saved;
}

export async function saveOccupancy({ messId, messName, current, patch, staffName }) {
  const payload = {
    mess_id: messId,
    mess_name: messName || current?.mess_name || "",
    people_inside: Math.max(0, Number(patch.people_inside ?? current?.people_inside ?? 0)),
    students_eating: Math.max(0, Number(patch.students_eating ?? current?.students_eating ?? 0)),
    entries_today: Math.max(0, Number(patch.entries_today ?? current?.entries_today ?? 0)),
    exits_today: Math.max(0, Number(patch.exits_today ?? current?.exits_today ?? 0)),
    seats_blocked: Math.max(0, Number(patch.seats_blocked ?? current?.seats_blocked ?? 0)),
    updated_by_name: staffName || "Staff",
    is_demo: false,
  };
  const saved = current?.id
    ? await base44.entities.OccupancyRecord.update(current.id, payload)
    : await base44.entities.OccupancyRecord.create(payload);
  return saved;
}

export async function recordSnapshot({ messId, occupancy, queue, capacity }) {
  if (!messId) return null;
  const now = new Date();
  const people = Number(occupancy?.people_inside || 0);
  const pct = capacity ? Math.min(100, Math.round((people / Number(capacity)) * 100)) : 0;
  return base44.entities.CrowdHistory.create({
    mess_id: messId,
    people_inside: people,
    queue_length: Number(queue?.waiting_students || 0),
    occupancy_pct: pct,
    recorded_at: now.toISOString(),
    hour_of_day: now.getHours(),
    day_of_week: now.getDay(),
    is_demo: false,
  });
}

export async function sendMessAlert({ messId, title, message, type = "queue" }) {
  const res = await base44.functions.invoke("broadcastNotification", { mess_id: messId, title, message, type });
  return res.data;
}

export async function loadStudentsForMess(messId) {
  const res = await base44.entities.Student.filter(messId ? { mess_id: messId } : {}, { limit: 300 });
  return pageItems(res);
}