"use client";

import { useState } from "react";
import type { HeliusHistoryResponse } from "@/lib/types";
import { EmptyState } from "@/components/EmptyState";
import { ExportTradesButton } from "@/components/ExportTradesButton";

const SOL_MINT = "So11111111111111111111111111111111111111112";

interface TransactionFeedProps {
  data: HeliusHistoryResponse | null;
  isLoading: boolean;
  wallet: string | null;
  fetchNextPage?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
}

function formatChange(c: { mint: string; amount: number; decimals: number }): string {
  const m = c.mint === SOL_MINT ? "SOL" : c.mint.slice(0, 8) + "…";
  const sign = c.amount >= 0 ? "+" : "";
  return `${sign}${c.amount.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${m}`;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? "Copied to clipboard" : "Copy signature"}
      className="px-2 py-1 rounded text-xs font-medium text-[var(--color-muted)] hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-[var(--foreground)] transition-colors duration-[var(--transition-fast)] focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-1"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function TransactionFeed({
  data,
  isLoading,
  wallet,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
}: TransactionFeedProps) {
  if (isLoading) {
    return (
      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] dark:bg-zinc-900 p-6 animate-pulse shadow-sm">
        <div className="h-6 w-32 bg-zinc-200 dark:bg-zinc-700 rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-zinc-200 dark:bg-zinc-700 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const txs = data.data;

  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] dark:bg-zinc-900 shadow-sm">
      <div className="px-4 pt-5 pb-4 border-b border-[var(--color-border)] flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          Recent Swaps
        </h2>
        <ExportTradesButton
          data={{ data: txs, pagination: data.pagination }}
          wallet={wallet}
        />
      </div>
      <div className="divide-y divide-[var(--color-border)] max-h-96 overflow-y-auto overflow-x-hidden rounded-b-[var(--radius-card)]">
        {txs.map((tx) => (
          <a
            key={tx.signature}
            href={`https://solscan.io/tx/${tx.signature}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors duration-[var(--transition-fast)]"
          >
            <div className="flex justify-between items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-mono text-[var(--color-muted)] truncate">
                    {tx.signature}
                  </p>
                  <CopyButton text={tx.signature} />
                </div>
                <p className="text-xs text-[var(--color-muted)] mt-1">
                  {tx.timestamp
                    ? new Date(tx.timestamp * 1000).toLocaleString()
                    : "—"}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {tx.balanceChanges.map((c, i) => (
                    <span
                      key={i}
                      className={
                        c.amount >= 0
                          ? "text-emerald-600 dark:text-emerald-400 text-sm"
                          : "text-red-600 dark:text-red-400 text-sm"
                      }
                    >
                      {formatChange(c)}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={
                    tx.error
                      ? "text-red-500 text-xs font-medium"
                      : "text-emerald-500 text-xs font-medium"
                  }
                >
                  {tx.error ? "Failed" : "Success"}
                </span>
                <span className="text-zinc-400 dark:text-zinc-500 text-xs">↗</span>
              </div>
            </div>
          </a>
        ))}
      </div>
      {hasNextPage && fetchNextPage && (
        <div className="p-4 border-t border-[var(--color-border)]">
          <button
            type="button"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="w-full py-2 text-sm font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 disabled:opacity-50 transition-colors"
          >
            {isFetchingNextPage ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
      {txs.length === 0 && (
        <EmptyState
          title="No swap transactions found."
          description="Swaps will appear here once the wallet has trading activity."
        />
      )}
    </div>
  );
}
