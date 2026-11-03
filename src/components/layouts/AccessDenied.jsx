import React from "react";
import { Outlet } from "react-router-dom";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function AccessDenied({ title = "Staff access required", description }) {
  return (
    <div className="grid min-h-[calc(100vh-4rem)] place-items-center px-6">
      <div className="glass max-w-md p-8 text-center">
        <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl border border-ember/30 bg-ember-soft text-ember">
          <ShieldAlert className="h-5 w-5" />
        </span>
        <h1 className="text-lg font-semibold text-white">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {description || "This area is limited to mess staff and administrators. Ask an admin to upgrade your role from the student management panel."}
        </p>
        <Link
          to="/dashboard"
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-medium text-white transition-colors hover:border-neon/40 hover:text-neon"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to student dashboard
        </Link>
      </div>
    </div>
  );
}

export function ShellOutlet() {
  return <Outlet />;
}