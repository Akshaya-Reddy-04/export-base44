import React from "react";
import { Loader2, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({ icon: Icon = Inbox, title, description, action, className }) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 px-6 py-12 text-center", className)}>
      <span className="mb-3 grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-muted-foreground">
        <Icon className="h-5 w-5" strokeWidth={1.6} />
      </span>
      <p className="text-sm font-medium text-white">{title}</p>
      {description && <p className="mt-1 max-w-sm text-xs text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function LoadingBlock({ label = "Loading live data…", className }) {
  return (
    <div className={cn("flex items-center justify-center gap-3 py-14 text-sm text-muted-foreground", className)}>
      <Loader2 className="h-4 w-4 animate-spin text-neon" />
      {label}
    </div>
  );
}

export function LiveDot({ live = true }) {
  return (
    <span className="relative flex h-2 w-2">
      <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-70", live ? "bg-neon" : "bg-ember")} />
      <span className={cn("relative inline-flex h-2 w-2 rounded-full", live ? "bg-neon" : "bg-ember")} />
    </span>
  );
}