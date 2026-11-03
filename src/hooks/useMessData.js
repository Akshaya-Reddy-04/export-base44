import { useCallback, useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";

export function pageItems(response) {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  return response.items ?? [];
}

export const SELECTED_MESS_KEY = "rr.selectedMess";

// All active messes + the student's selected mess (persisted per browser).
export function useMesses() {
  const [messes, setMesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedIdState] = useState(
    () => localStorage.getItem(SELECTED_MESS_KEY) || ""
  );

  const load = useCallback(async () => {
    const list = await base44.entities.Mess.filter(
      { is_active: true },
      { sort: "name", limit: 50 }
    );
    const items = pageItems(list);
    setMesses(items);
    setSelectedIdState((current) => {
      if (current && items.some((m) => m.id === current)) return current;
      return items[0]?.id || "";
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setSelectedId = useCallback((id) => {
    localStorage.setItem(SELECTED_MESS_KEY, id);
    setSelectedIdState(id);
  }, []);

  const selectedMess = messes.find((m) => m.id === selectedId) || messes[0] || null;

  return { messes, selectedMess, selectedId: selectedMess?.id || "", setSelectedId, loading, reload: load };
}

// Live queue + occupancy + meal timings for one mess, refreshed on an interval
// and instantly whenever staff save a change (entity subscription).
export function useMessLive(messId, refreshSeconds = 20) {
  const [queue, setQueue] = useState(null);
  const [occupancy, setOccupancy] = useState(null);
  const [timings, setTimings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const mounted = useRef(true);

  const load = useCallback(async () => {
    if (!messId) {
      setLoading(false);
      return;
    }
    const [queueRes, occRes, timingRes] = await Promise.all([
      base44.entities.QueueStatus.filter({ mess_id: messId }, { sort: "-updated_date", limit: 1 }),
      base44.entities.OccupancyRecord.filter({ mess_id: messId }, { sort: "-updated_date", limit: 1 }),
      base44.entities.MessTiming.filter({ mess_id: messId }, { limit: 10 }),
    ]);
    if (!mounted.current) return;
    setQueue(pageItems(queueRes)[0] || null);
    setOccupancy(pageItems(occRes)[0] || null);
    setTimings(pageItems(timingRes));
    setLoading(false);
    setRefreshing(false);
  }, [messId]);

  useEffect(() => {
    mounted.current = true;
    if (!messId) {
      setLoading(false);
      return undefined;
    }
    load();
    const timer = setInterval(load, Math.max(8, refreshSeconds) * 1000);
    const unsubQueue = base44.entities.QueueStatus.subscribe((event) => {
      if (!event?.data?.mess_id || event.data.mess_id === messId) load();
    });
    const unsubOcc = base44.entities.OccupancyRecord.subscribe((event) => {
      if (!event?.data?.mess_id || event.data.mess_id === messId) load();
    });
    return () => {
      mounted.current = false;
      clearInterval(timer);
      unsubQueue?.();
      unsubOcc?.();
    };
  }, [messId, refreshSeconds, load]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    return load();
  }, [load]);

  const updatedAt = [queue?.updated_date, occupancy?.updated_date]
    .filter(Boolean)
    .sort()
    .pop() || null;

  return { queue, occupancy, timings, loading, refreshing, refresh, updatedAt };
}

export function useAppSettings() {
  const [settings, setSettings] = useState({
    low_stock_threshold: 15,
    stale_minutes: 15,
    auto_refresh_seconds: 20,
  });

  useEffect(() => {
    let alive = true;
    base44.entities.AppSetting.list({ limit: 20 }).then((res) => {
      if (!alive) return;
      const next = { low_stock_threshold: 15, stale_minutes: 15, auto_refresh_seconds: 20 };
      pageItems(res).forEach((row) => {
        if (row.key) next[row.key] = Number.isNaN(Number(row.value)) ? row.value : Number(row.value);
      });
      setSettings(next);
    });
    return () => {
      alive = false;
    };
  }, []);

  return settings;
}