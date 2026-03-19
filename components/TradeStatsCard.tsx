"use client";

import type { TradeStats } from "@/lib/types";

interface TradeStatsCardProps {
  data: TradeStats | null;
  isLoading: boolean;
}

function formatUsd(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function TradeStatsCard({ data, isLoading }: TradeStatsCardProps) {
  if (isLoading) {
    return (
      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] dark:bg-zinc-900 p-4 animate-pulse">
        <div className="flex flex-wrap gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-8 w-20 bg-zinc-200 dark:bg-zinc-700 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.totalTrades === 0) return null;

  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] dark:bg-zinc-900 p-4 shadow-sm">
      <div className="flex flex-wrap gap-6 text-sm">
        <div>
          <p className="text-xs text-[var(--color-muted)]">Win rate</p>
          <p className="font-semibold tabular-nums">
            {(data.winRate * 100).toFixed(0)}%
          </p>
        </div>
        <div>
          <p className="text-xs text-[var(--color-muted)]">W / L</p>
          <p className="font-semibold tabular-nums">
            {data.wins}W / {data.losses}L
          </p>
        </div>
        <div>
          <p className="text-xs text-[var(--color-muted)]">Avg win</p>
          <p className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
            {formatUsd(data.avgWin)}
          </p>
        </div>
        <div>
          <p className="text-xs text-[var(--color-muted)]">Avg loss</p>
          <p className="font-semibold tabular-nums text-red-600 dark:text-red-400">
            {formatUsd(data.avgLoss)}
          </p>
        </div>
        <div>
          <p className="text-xs text-[var(--color-muted)]">Best trade</p>
          <p className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
            {formatUsd(data.bestTrade)}
          </p>
        </div>
        <div>
          <p className="text-xs text-[var(--color-muted)]">Worst trade</p>
          <p className="font-semibold tabular-nums text-red-600 dark:text-red-400">
            {formatUsd(data.worstTrade)}
          </p>
        </div>
      </div>
    </div>
  );
}
