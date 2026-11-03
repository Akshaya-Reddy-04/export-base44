import { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { pageItems } from "@/hooks/useMessData";

export function useMenu(messId) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!messId) {
      setItems([]);
      setLoading(false);
      return;
    }
    const res = await base44.entities.MenuItem.filter(
      { mess_id: messId },
      { sort: "name", limit: 200 }
    );
    setItems(pageItems(res));
    setLoading(false);
  }, [messId]);

  useEffect(() => {
    load();
  }, [load]);

  return { items, loading, reload: load };
}

export function useNotices(messId) {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await base44.entities.Notice.filter(
      { is_active: true },
      { sort: "-created_date", limit: 30 }
    );
    const all = pageItems(res);
    setNotices(all.filter((n) => !n.mess_id || !messId || n.mess_id === messId));
    setLoading(false);
  }, [messId]);

  useEffect(() => {
    load();
  }, [load]);

  return { notices, loading, reload: load };
}

export function useHistory(messId, limit = 400) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!messId) {
      setHistory([]);
      setLoading(false);
      return;
    }
    const res = await base44.entities.CrowdHistory.filter(
      { mess_id: messId },
      { sort: "-recorded_at", limit }
    );
    setHistory(pageItems(res));
    setLoading(false);
  }, [messId, limit]);

  useEffect(() => {
    load();
  }, [load]);

  return { history, loading, reload: load };
}

export function useReviews(messId) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await base44.entities.FoodReview.list({ sort: "-created_date", limit: 200 });
    const all = pageItems(res);
    setReviews(messId ? all.filter((r) => !r.mess_id || r.mess_id === messId) : all);
    setLoading(false);
  }, [messId]);

  useEffect(() => {
    load();
  }, [load]);

  return { reviews, loading, reload: load };
}