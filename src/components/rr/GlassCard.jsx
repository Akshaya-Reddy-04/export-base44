import React from "react";
import { cn } from "@/lib/utils";

export default function GlassCard({ className, children, hover = false, padding = "p-5 sm:p-6", ...rest }) {
  return (
    <div
      className={cn("glass", padding, hover && "glass-hover", className)}
      {...rest}
    >
      {children}
    </div>
  );
}

export function SectionHeader({ eyebrow, title, description, action, className }) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      <div>
        {eyebrow && <div className="label-xs mb-2">{eyebrow}</div>}
        <h2 className="text-xl font-semibold text-white sm:text-2xl">{title}</h2>
        {description && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeading({ title, description, children }) {
  return (
    <div className="flex flex-col gap-4 border-b border-white/5 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-white sm:text-[28px]">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}