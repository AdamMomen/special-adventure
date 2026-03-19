"use client";

import Link from "next/link";
import type { HeliusBalancesResponse } from "@/lib/types";

interface PortfolioSummaryProps {
  data: HeliusBalancesResponse | null;
  isLoading: boolean;
  wallet: string | null;
}

export function PortfolioSummary({ data, isLoading, wallet }: PortfolioSummaryProps) {
  if (isLoading) {
    return (
      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] dark:bg-zinc-900 p-6 animate-pulse">
        <div className="h-8 w-32 bg-zinc-200 dark:bg-zinc-700 rounded mb-4" />
        <div className="h-12 w-48 bg-zinc-200 dark:bg-zinc-700 rounded" />
      </div>
    );
  }

  if (!data) return null;

  const sortedByBalance = [...data.balances].sort((a, b) => {
    const aVal = a.usdValue ?? a.balance * (a.pricePerToken ?? 0);
    const bVal = b.usdValue ?? b.balance * (b.pricePerToken ?? 0);
    return bVal - aVal;
  });
  const topHoldings = sortedByBalance.slice(0, 5);
  const hasMore = sortedByBalance.length > 5;

  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] dark:bg-zinc-900 p-6 shadow-sm">
      <h2 className="text-sm font-medium text-[var(--color-muted)] mb-1">
        Portfolio Value
      </h2>
      <p className="text-3xl font-bold text-[var(--foreground)] tabular-nums">
        ${data.totalUsdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
      <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
        <h3 className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-2">
          Top Holdings
        </h3>
        <ul className="space-y-2">
          {topHoldings.map((b) => (
            <li key={b.mint} className="flex justify-between items-center text-sm">
              <span className="font-medium text-[var(--foreground)]">
                {b.symbol}
              </span>
              <span className="text-[var(--color-muted)] tabular-nums">
                {b.balance.toLocaleString(undefined, { maximumFractionDigits: 4 })} {b.symbol}
                {b.usdValue != null && (
                  <span className="ml-2 text-zinc-500">
                    (${b.usdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })})
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
        {hasMore && wallet && (
          <Link
            href={`/tokens?wallet=${wallet}`}
            className="mt-3 block text-sm font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors duration-[var(--transition-fast)]"
          >
            Show all tokens ({sortedByBalance.length})
          </Link>
        )}
      </div>
    </div>
  );
}
