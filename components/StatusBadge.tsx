"use client";

import { Tooltip } from "@/components/Tooltip";

interface StatusBadgeProps {
  isLive: boolean;
}

function LiveIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" />
      <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" />
      <circle cx="12" cy="12" r="2" />
      <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" />
      <path d="M19.1 4.9C23 8.8 23 15.1 19.1 19" />
    </svg>
  );
}

function PollingIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}

export function StatusBadge({ isLive }: StatusBadgeProps) {
  const tooltip = isLive
    ? "WebSocket connected — data updates in real time when the wallet has activity"
    : "Polling mode — data refreshes every 30 seconds (WebSocket unavailable)";

  return (
    <Tooltip content={tooltip}>
      <span
        className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
          isLive
            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
        }`}
        aria-label={isLive ? "Live data" : "Polling"}
      >
        {isLive ? <LiveIcon /> : <PollingIcon />}
      </span>
    </Tooltip>
  );
}
