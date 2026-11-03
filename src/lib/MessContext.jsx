import React, { createContext, useContext } from "react";
import { useMesses, useMessLive, useAppSettings } from "@/hooks/useMessData";

const MessContext = createContext(null);

// One shared source of truth for the selected mess and its live status, so the
// shell (top bar) and the page below it poll and subscribe only once.
export function MessProvider({ children }) {
  const messApi = useMesses();
  const settings = useAppSettings();
  const live = useMessLive(messApi.selectedId, settings.auto_refresh_seconds || 20);

  const value = {
    messes: messApi.messes,
    messesLoading: messApi.loading,
    selectedMess: messApi.selectedMess,
    selectedId: messApi.selectedId,
    setSelectedId: messApi.setSelectedId,
    reloadMesses: messApi.reload,
    queue: live.queue,
    occupancy: live.occupancy,
    timings: live.timings,
    liveLoading: live.loading,
    refreshing: live.refreshing,
    refreshLive: live.refresh,
    updatedAt: live.updatedAt,
    settings,
  };

  return <MessContext.Provider value={value}>{children}</MessContext.Provider>;
}

export function useMess() {
  const ctx = useContext(MessContext);
  if (!ctx) throw new Error("useMess must be used inside MessProvider");
  return ctx;
}