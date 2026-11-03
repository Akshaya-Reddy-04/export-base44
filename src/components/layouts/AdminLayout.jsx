import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "@/components/layouts/Sidebar";
import TopBar from "@/components/layouts/TopBar";
import AccessDenied from "@/components/layouts/AccessDenied";
import { MessProvider, useMess } from "@/lib/MessContext";
import { useAuth } from "@/lib/AuthContext";

function AdminShell({ role }) {
  const [open, setOpen] = useState(false);
  const mess = useMess();

  return (
    <div className="min-h-screen">
      <Sidebar variant="admin" role={role} open={open} onClose={() => setOpen(false)} />
      <div className="lg:pl-[264px]">
        <TopBar
          onOpenMenu={() => setOpen(true)}
          messes={mess.messes}
          selectedId={mess.selectedId}
          onSelectMess={mess.setSelectedId}
          updatedAt={mess.updatedAt}
          staleMinutes={mess.settings.stale_minutes}
          refreshing={mess.refreshing}
          onRefresh={mess.refreshLive}
          showNotifications={false}
        />
        <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const { user } = useAuth();
  const role = user?.role || "user";

  if (role !== "admin" && role !== "staff") {
    return <AccessDenied />;
  }

  return (
    <MessProvider>
      <AdminShell role={role} />
    </MessProvider>
  );
}