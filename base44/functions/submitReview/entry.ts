import { createClientFromRequest } from "npm:@base44/sdk@0.8.54";
import { pageItems } from "../../shared/guard.ts";

// Records a student's food rating and keeps the menu item's average honest.
// Students cannot edit official menu records, so the aggregate is recalculated
// here with the service role after the review itself is saved as the user.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e: any) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: "Sign in to rate food" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const menuItemId = typeof body.menu_item_id === "string" ? body.menu_item_id : "";
    const rating = Number(body.rating);
    const comment = typeof body.comment === "string" ? body.comment.trim().slice(0, 500) : "";

    if (!menuItemId) return Response.json({ error: "menu_item_id is required" }, { status: 400 });
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return Response.json({ error: "rating must be a whole number from 1 to 5" }, { status: 400 });
    }

    const item = await base44.entities.MenuItem.get(menuItemId).catch((e: any) =>
      e.status === 404 ? null : Promise.reject(e)
    );
    if (!item) return Response.json({ error: "Menu item not found" }, { status: 404 });

    const existing = await base44.entities.FoodReview.filter(
      { menu_item_id: menuItemId, created_by_id: user.id },
      { limit: 1 }
    );
    const mine = pageItems(existing)[0];

    if (mine) {
      await base44.entities.FoodReview.update(mine.id, { rating, comment });
    } else {
      await base44.entities.FoodReview.create({
        mess_id: item.mess_id,
        menu_item_id: menuItemId,
        item_name: item.name,
        meal: item.meal,
        rating,
        comment,
        student_name: user.full_name || "Student",
        is_demo: false,
      });
    }

    const all = await base44.asServiceRole.entities.FoodReview.filter(
      { menu_item_id: menuItemId },
      { limit: 1000 }
    );
    const rows = pageItems(all);
    const total = rows.reduce((sum: number, r: any) => sum + Number(r.rating || 0), 0);
    const avg = rows.length ? Math.round((total / rows.length) * 10) / 10 : 0;

    await base44.asServiceRole.entities.MenuItem.update(menuItemId, {
      rating_avg: avg,
      rating_count: rows.length,
    });

    return Response.json({ ok: true, rating_avg: avg, rating_count: rows.length });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}