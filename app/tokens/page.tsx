"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { TokenLogo } from "@/components/TokenLogo";

function BackIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
    </svg>
  );
}

function TokensContent() {
  const searchParams = useSearchParams();
  const wallet = searchParams.get("wallet");

  const { data, isLoading, error } = useQuery({
    queryKey: ["balances", wallet],
    queryFn: async () => {
      const res = await fetch(`/api/wallet/balances?wallet=${wallet}`);
      if (!res.ok) throw new Error(await res.json().then((j) => j.error ?? "Failed"));
      return res.json();
    },
    enabled: !!wallet,
  });

  if (!wallet) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-muted)] hover:text-[var(--foreground)] transition-colors mb-6"
          >
            <BackIcon />
            Back
          </Link>
          <p className="text-[var(--color-muted)]">No wallet specified.</p>
        </div>
      </div>
    );
  }

  const sortedBalances = data?.balances
    ? [...data.balances].sort((a, b) => {
        const aVal = a.usdValue ?? a.balance * (a.pricePerToken ?? 0);
        const bVal = b.usdValue ?? b.balance * (b.pricePerToken ?? 0);
        return bVal - aVal;
      })
    : [];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--color-border)]">
        <div className="max-w-2xl mx-auto px-4 py-5">
          <Link
            href={`/?wallet=${encodeURIComponent(wallet)}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-muted)] hover:text-[var(--foreground)] transition-colors mb-4"
          >
            <BackIcon />
            Back to dashboard
          </Link>
          <h1 className="text-xl font-semibold text-[var(--foreground)]">
            All Tokens
          </h1>
          <p className="text-sm text-[var(--color-muted)] mt-0.5">
            {wallet.slice(0, 8)}…{wallet.slice(-8)}
          </p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {isLoading && (
          <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] dark:bg-zinc-900 p-6 animate-pulse">
            <div className="space-y-3">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="h-12 bg-zinc-200 dark:bg-zinc-700 rounded" />
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-[var(--radius-card)] border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-4">
            <p className="text-sm text-red-700 dark:text-red-300">{String(error)}</p>
            <Link
              href={`/?wallet=${encodeURIComponent(wallet)}`}
              className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-red-700 dark:text-red-300 hover:underline"
            >
              <BackIcon />
              Back to dashboard
            </Link>
          </div>
        )}

        {!isLoading && !error && (
          <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] dark:bg-zinc-900 overflow-hidden shadow-sm">
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-[var(--color-surface)] dark:bg-zinc-900 z-10">
                  <tr className="border-b border-[var(--color-border)]">
                    <th className="text-left py-3 px-4 font-medium text-[var(--color-muted)]">
                      Token
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-[var(--color-muted)]">
                      Name
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-[var(--color-muted)]">
                      Balance
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-[var(--color-muted)]">
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedBalances.map((b) => (
                    <tr
                      key={b.mint}
                      className="border-b border-[var(--color-border)] hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                    >
                      <td className="py-3 px-4 font-medium text-[var(--foreground)]">
                        <span className="flex items-center gap-2">
                          <TokenLogo logoUri={b.logoUri} symbol={b.symbol} />
                          {b.symbol}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[var(--color-muted)]">
                        {b.name}
                      </td>
                      <td className="py-3 px-4 text-right text-[var(--color-muted)] tabular-nums">
                        {b.balance.toLocaleString(undefined, { maximumFractionDigits: 4 })} {b.symbol}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums">
                        {b.usdValue != null
                          ? `$${b.usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {sortedBalances.length === 0 && (
              <div className="p-8 text-center text-[var(--color-muted)]">
                No tokens in this wallet.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function TokensPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
          <div className="text-[var(--color-muted)]">Loading…</div>
        </div>
      }
    >
      <TokensContent />
    </Suspense>
  );
}
