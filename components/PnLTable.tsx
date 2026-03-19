"use client";

import type { PnLSummary } from "@/lib/types";
import { EmptyState } from "@/components/EmptyState";
import { TokenLogo } from "@/components/TokenLogo";

interface PnLTableProps {
  data: PnLSummary | null;
  isLoading: boolean;
}

function formatPnl(value: number | null): string {
  if (value == null) return "—";
  const sign = value >= 0 ? "+" : "";
  return `${sign}$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function PnlCell({ value }: { value: number | null }) {
  if (value == null) return <span className="text-[var(--color-muted)]">—</span>;
  const isPositive = value >= 0;
  return (
    <span
      className={
        isPositive
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-red-600 dark:text-red-400"
      }
    >
      {formatPnl(value)}
    </span>
  );
}

export function PnLTable({ data, isLoading }: PnLTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] dark:bg-zinc-900 overflow-hidden animate-pulse shadow-sm">
        <div className="p-4 border-b border-[var(--color-border)]">
          <div className="h-6 w-24 bg-zinc-200 dark:bg-zinc-700 rounded" />
        </div>
        <div className="p-4 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 bg-zinc-200 dark:bg-zinc-700 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] dark:bg-zinc-900 overflow-hidden shadow-sm">
      <div className="p-4 border-b border-[var(--color-border)] flex flex-wrap gap-6">
        <div>
          <p className="text-xs text-[var(--color-muted)]">Total Realized P&L</p>
          <p className="text-lg font-semibold tabular-nums">
            <PnlCell value={data.totalRealizedPnl} />
          </p>
        </div>
        <div>
          <p className="text-xs text-[var(--color-muted)]">Total Unrealized P&L</p>
          <p className="text-lg font-semibold tabular-nums">
            <PnlCell value={data.totalUnrealizedPnl} />
          </p>
        </div>
        <div>
          <p className="text-xs text-[var(--color-muted)]">Total P&L</p>
          <p className="text-lg font-semibold tabular-nums">
            <PnlCell value={data.totalPnl} />
          </p>
        </div>
        {"totalVolume" in data && data.totalVolume != null && data.totalVolume > 0 && (
          <div>
            <p className="text-xs text-[var(--color-muted)]">Swap Volume</p>
            <p className="text-lg font-semibold text-[var(--foreground)] tabular-nums">
              ${data.totalVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)]">
              <th className="text-left py-3 px-4 font-medium text-[var(--color-muted)]">
                Token
              </th>
              <th className="text-right py-3 px-4 font-medium text-[var(--color-muted)]">
                Balance
              </th>
              <th className="text-right py-3 px-4 font-medium text-[var(--color-muted)]">
                Avg Entry
              </th>
              <th className="text-right py-3 px-4 font-medium text-[var(--color-muted)]">
                Current
              </th>
              <th className="text-right py-3 px-4 font-medium text-[var(--color-muted)]">
                Unrealized P&L
              </th>
            </tr>
          </thead>
          <tbody>
            {data.positions.map((p) => (
              <tr
                key={p.mint}
                className="border-b border-[var(--color-border)] hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors duration-[var(--transition-fast)]"
              >
                <td className="py-3 px-4 font-medium text-[var(--foreground)]">
                  <span className="flex items-center gap-2">
                    <TokenLogo logoUri={p.logoUri} symbol={p.symbol} size="sm" />
                    {p.symbol}
                  </span>
                </td>
                <td className="py-3 px-4 text-right text-[var(--color-muted)] tabular-nums">
                  {p.remainingAmount.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                </td>
                <td className="py-3 px-4 text-right text-[var(--color-muted)] tabular-nums">
                  {p.avgEntryPrice > 0
                    ? `$${p.avgEntryPrice.toFixed(6)}`
                    : "—"}
                </td>
                <td className="py-3 px-4 text-right text-[var(--color-muted)] tabular-nums">
                  {p.currentPrice != null
                    ? `$${p.currentPrice.toFixed(6)}`
                    : "N/A"}
                </td>
                <td className="py-3 px-4 text-right tabular-nums">
                  <PnlCell value={p.unrealizedPnl} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.positions.length === 0 && (
        <EmptyState
          title="No positions with P&L data."
          description="Try a wallet with swap history."
        />
      )}
    </div>
  );
}
