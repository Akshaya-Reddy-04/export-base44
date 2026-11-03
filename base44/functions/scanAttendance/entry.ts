import { createClientFromRequest } from "npm:@base44/sdk@0.8.54";
import { pageItems, isStaff, todayKey } from "../../shared/guard.ts";

// Gate scanner: one pass per student, toggles check-in / check-out, and refuses
// a second check-in while an entry is still open.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e: any) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (!isStaff(user)) return Response.json({ error: "Only mess staff can scan passes" }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
    const messId = typeof body.mess_id === "string" ? body.mess_id : "";
    if (!code) return Response.json({ error: "Scan or type a student pass code" }, { status: 400 });
    if (!messId) return Response.json({ error: "mess_id is required" }, { status: 400 });

    const studentRes = await base44.entities.Student.filter({ student_code: code }, { limit: 1 });
    const student = pageItems(studentRes)[0];
    if (!student) return Response.json({ error: "Pass not recognised" }, { status: 404 });

    const mess = await base44.entities.Mess.get(messId).catch((e: any) =>
      e.status === 404 ? null : Promise.reject(e)
    );
    if (!mess) return Response.json({ error: "Mess not found" }, { status: 404 });

    const openRes = await base44.entities.Attendance.filter(
      { student_id: student.id, mess_id: messId },
      { sort: "-entry_time", limit: 10 }
    );
    const open = pageItems(openRes).find((a: any) => !a.exit_time);

    const now = new Date().toISOString();
    let action = "checkin";
    let record;

    if (open) {
      action = "checkout";
      record = await base44.entities.Attendance.update(open.id, { exit_time: now });
    } else {
      record = await base44.entities.Attendance.create({
        student_id: student.id,
        student_name: student.full_name,
        student_code: student.student_code,
        student_email: student.email || "",
        roll_number: student.roll_number || "",
        mess_id: messId,
        mess_name: mess.name,
        entry_time: now,
        date: todayKey(),
        method: body.method === "manual" ? "manual" : "qr",
        recorded_by_name: user.full_name || user.email,
      });
    }

    // Keep the live occupancy record in step with the gate log.
    const occRes = await base44.entities.OccupancyRecord.filter(
      { mess_id: messId },
      { sort: "-updated_date", limit: 1 }
    );
    const occupancy = pageItems(occRes)[0];
    if (occupancy) {
      const delta = action === "checkin" ? 1 : -1;
      const nextInside = Math.max(0, Number(occupancy.people_inside || 0) + delta);
      await base44.entities.OccupancyRecord.update(occupancy.id, {
        people_inside: nextInside,
        entries_today:
          action === "checkin" ? Number(occupancy.entries_today || 0) + 1 : Number(occupancy.entries_today || 0),
        exits_today:
          action === "checkout" ? Number(occupancy.exits_today || 0) + 1 : Number(occupancy.exits_today || 0),
        updated_by_name: user.full_name || user.email,
      });
    }

    return Response.json({
      ok: true,
      action,
      student_name: student.full_name,
      roll_number: student.roll_number || "",
      entry_time: record?.entry_time,
      exit_time: record?.exit_time,
      people_inside: occupancy ? Math.max(0, Number(occupancy.people_inside || 0) + (action === "checkin" ? 1 : -1)) : null,
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}