import { createClientFromRequest } from "npm:@base44/sdk@0.8.54";
import { pageItems, isStaff } from "../../shared/guard.ts";

// Fans a mess announcement out to every student assigned to that mess.
// Used for "queue just got shorter" style alerts from staff screens.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e: any) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (!isStaff(user)) return Response.json({ error: "Only mess staff can send alerts" }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const messId = typeof body.mess_id === "string" ? body.mess_id : "";
    const title = typeof body.title === "string" ? body.title.trim().slice(0, 90) : "";
    const message = typeof body.message === "string" ? body.message.trim().slice(0, 280) : "";
    const type = ["queue", "crowd", "food", "menu", "timing", "emergency"].includes(body.type)
      ? body.type
      : "queue";

    if (!title || !message) return Response.json({ error: "title and message are required" }, { status: 400 });

    const studentRes = await base44.entities.Student.filter(
      messId ? { mess_id: messId } : {},
      { limit: 400 }
    );
    const students = pageItems(studentRes).filter((s: any) => s.email);

    if (students.length === 0) {
      return Response.json({ ok: true, sent: 0, message: "No students are assigned to this mess yet" });
    }

    const payload = students.map((s: any) => ({
      mess_id: messId,
      user_email: s.email,
      title,
      message,
      type,
      is_read: false,
      is_global: false,
    }));

    await base44.entities.Notification.bulkCreate(payload);

    return Response.json({ ok: true, sent: payload.length });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}