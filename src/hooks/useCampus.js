import { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { pageItems } from "@/hooks/useMessData";
import { crowdLevel, occupancyPct, waitMinutes } from "@/lib/rush";

// Campus-wide snapshot: every active mess with its latest queue + occupancy.
export function useCampus() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState(null);

  const load = useCallback(async () => {
    const [messRes, queueRes, occRes] = await Promise.all([
      base44.entities.Mess.filter({ is_active: true }, { sort: "name", limit: 50 }),
      base44.entities.QueueStatus.list({ limit: 100, sort: "-updated_date" }),
      base44.entities.OccupancyRecord.list({ limit: 100, sort: "-updated_date" }),
    ]);
    const messes = pageItems(messRes);
    const queues = pageItems(queueRes);
    const occs = pageItems(occRes);

    const snapshot = messes.map((mess) => {
      const queue = queues.find((q) => q.mess_id === mess.id) || null;
      const occupancy = occs.find((o) => o.mess_id === mess.id) || null;
      const pct = occupancyPct(occupancy?.people_inside || 0, mess.capacity || 1);
      return {
        mess,
        queue,
        occupancy,
        pct,
        level: crowdLevel(pct),
        wait: waitMinutes(queue?.waiting_students || 0, queue?.counters_open || 1, queue?.avg_serving_seconds || 45),
        updatedAt: [queue?.updated_date, occupancy?.updated_date].filter(Boolean).sort().pop() || null,
      };
    });

    setRows(snapshot);
    setUpdatedAt(snapshot.map((r) => r.updatedAt).filter(Boolean).sort().pop() || null);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, [load]);

  return { rows, loading, updatedAt, reload: load };
}