import React from "react";

export function RadarMark({ size = 40, spin = true, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="Rush Radar mark"
    >
      <defs>
        <radialGradient id="rr-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#22ff9a" />
          <stop offset="100%" stopColor="#22ff9a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="rr-sweep" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#22ff9a" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#22ff9a" stopOpacity="0" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="none" stroke="#22ff9a" strokeOpacity="0.15" />
      <circle cx="32" cy="32" r="21" fill="none" stroke="#22ff9a" strokeOpacity="0.22" />
      <circle cx="32" cy="32" r="11" fill="none" stroke="#22ff9a" strokeOpacity="0.3" />
      <path d="M32 4 V60 M4 32 H60" stroke="#22ff9a" strokeOpacity="0.12" strokeWidth="1" />
      <g className={spin ? "animate-radar" : ""} style={{ transformOrigin: "32px 32px" }}>
        <path d="M32 32 L32 6 A26 26 0 0 1 56.5 19 Z" fill="url(#rr-sweep)" opacity="0.55" />
        <line x1="32" y1="32" x2="32" y2="7" stroke="#22ff9a" strokeWidth="1.6" strokeLinecap="round" />
      </g>
      <circle cx="44" cy="24" r="2.4" fill="#2ea8ff">
        <animate attributeName="opacity" values="0.25;1;0.25" dur="2.4s" repeatCount="indefinite" />
      </circle>
      <circle cx="22" cy="41" r="2" fill="#ff8a3d">
        <animate attributeName="opacity" values="1;0.25;1" dur="3.1s" repeatCount="indefinite" />
      </circle>
      <circle cx="32" cy="32" r="4" fill="url(#rr-core)" />
      <circle cx="32" cy="32" r="2.2" fill="#eafff5" />
    </svg>
  );
}

export default function RadarLogo({ size = 36, showWordmark = false, tagline = false, spin = true, className = "" }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative shrink-0">
        <div className="absolute inset-0 rounded-full bg-neon/10 blur-xl" />
        <RadarMark size={size} spin={spin} className="relative" />
      </div>
      {showWordmark && (
        <div className="leading-none">
          <div className="font-display text-[17px] font-semibold uppercase tracking-[0.22em] text-white">
            Rush<span className="text-neon">Radar</span>
          </div>
          {tagline && (
            <div className="mt-1.5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Beat the queue. Eat smarter.
            </div>
          )}
        </div>
      )}
    </div>
  );
}