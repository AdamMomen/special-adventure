"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useQuery, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { WalletInput } from "@/components/WalletInput";
import { HomeIcon } from "@/components/HomeIcon";
import { PortfolioSummary } from "@/components/PortfolioSummary";
import { PnLChart } from "@/components/PnLChart";
import { PnLTable } from "@/components/PnLTable";
import { TradeStatsCard } from "@/components/TradeStatsCard";
import { TransactionFeed } from "@/components/TransactionFeed";
import { ErrorCard } from "@/components/ErrorCard";
import { Toast } from "@/components/Toast";
import { useHeliusWebSocket } from "@/hooks/useHeliusWebSocket";

function useWalletData(wallet: string | null) {
  const balances = useQuery({
    queryKey: ["balances", wallet],
    queryFn: async () => {
      const res = await fetch(`/api/wallet/balances?wallet=${wallet}`);
      if (!res.ok) throw new Error(await res.json().then((j) => j.error ?? "Failed"));
      return res.json();
    },
    enabled: !!wallet,
    refetchInterval: wallet ? 30_000 : false,
  });

  const history = useInfiniteQuery({
    queryKey: ["history", wallet],
    queryFn: async ({ pageParam }: { pageParam?: string }) => {
      const params = new URLSearchParams({
        wallet: wallet!,
        type: "SWAP",
        limit: "20",
        tokenAccounts: "balanceChanged",
      });
      if (pageParam) params.set("before", pageParam);
      const res = await fetch(`/api/wallet/history?${params}`);
      if (!res.ok) throw new Error(await res.json().then((j) => j.error ?? "Failed"));
      return res.json();
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.pagination?.hasMore ? lastPage.pagination.nextCursor ?? undefined : undefined,
    enabled: !!wallet,
    refetchInterval: wallet ? 30_000 : false,
  });

  const pnl = useQuery({
    queryKey: ["pnl", wallet],
    queryFn: async () => {
      const res = await fetch(`/api/wallet/pnl?wallet=${wallet}`);
      if (!res.ok) throw new Error(await res.json().then((j) => j.error ?? "Failed"));
      return res.json();
    },
    enabled: !!wallet,
    refetchInterval: wallet ? 30_000 : false,
  });

  return { balances, history, pnl };
}

function PageContent() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const wallet = searchParams.get("wallet")?.trim() || null;

  const setWallet = useCallback(
    (addr: string | null) => {
      if (addr) {
        router.replace(`/?wallet=${encodeURIComponent(addr)}`);
      } else {
        router.replace("/");
      }
    },
    [router]
  );
  const [showUpdatedToast, setShowUpdatedToast] = useState(false);
  const { publicKey } = useWallet();
  const { balances, history, pnl } = useWalletData(wallet);

  useEffect(() => {
    if (publicKey && !wallet) {
      setWallet(publicKey.toBase58());
    }
  }, [publicKey, wallet, setWallet]);
  useHeliusWebSocket(wallet, () => {
    setShowUpdatedToast(true);
  });
  const isLoading = balances.isLoading || history.isLoading || pnl.isLoading;
  const error = balances.error ?? history.error ?? pnl.error;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        document.getElementById("wallet-address")?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleRetry = () => {
    if (wallet) {
      queryClient.invalidateQueries({ queryKey: ["balances", wallet] });
      queryClient.invalidateQueries({ queryKey: ["history", wallet] });
      queryClient.invalidateQueries({ queryKey: ["pnl", wallet] });
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      {wallet ? (
        <>
          <header className="border-b border-[var(--color-border)] shrink-0" role="banner">
            <div className="max-w-2xl mx-auto px-4 py-5 flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl font-semibold text-[var(--foreground)]" id="site-title">
                  Solana Portfolio P&L Tracker
                </h1>
                <p className="text-sm text-[var(--color-muted)] mt-0.5" id="site-description">
                  Track wallet P&L across all trades — powered by Helius
                </p>
              </div>
              <div className="flex items-center gap-3">
                <WalletMultiButton className="!rounded-[var(--radius-input)] !bg-gradient-to-r !from-violet-600 !to-purple-600 hover:!from-violet-700 hover:!to-purple-700 !text-white !text-sm !font-medium !h-9 !px-4 glow-button" />
              </div>
            </div>
          </header>

          <main className="max-w-2xl mx-auto px-4 py-8 w-full flex-1" role="main" aria-label="Wallet dashboard">
            <div className="flex flex-col items-center gap-6 mb-8">
              <WalletInput
                onSearch={setWallet}
                isLoading={isLoading}
                currentWallet={wallet}
              />
              {error && (
                <div className="w-full">
                  <ErrorCard message={String(error)} onRetry={handleRetry} />
                </div>
              )}
            </div>
            <div className="space-y-8">
              <div className="flex flex-col gap-8">
                <PortfolioSummary
                  data={balances.data ?? null}
                  isLoading={balances.isLoading}
                  wallet={wallet}
                />
                <PnLChart
                  key={wallet}
                  data={pnl.data?.pnlOverTime ?? []}
                  isLoading={pnl.isLoading}
                  error={pnl.error as Error | null}
                />
                <TradeStatsCard
                  data={pnl.data?.tradeStats ?? null}
                  isLoading={pnl.isLoading}
                />
                <PnLTable data={pnl.data ?? null} isLoading={pnl.isLoading} />
                <TransactionFeed
                  data={
                    history.data
                      ? {
                          data: history.data.pages.flatMap((p) => p.data),
                          pagination: history.data.pages[history.data.pages.length - 1]?.pagination ?? {
                            hasMore: false,
                            nextCursor: null,
                          },
                        }
                      : null
                  }
                  isLoading={history.isLoading}
                  wallet={wallet}
                  fetchNextPage={history.fetchNextPage}
                  hasNextPage={history.hasNextPage}
                  isFetchingNextPage={history.isFetchingNextPage}
                />
              </div>
            </div>
          </main>
        </>
      ) : (
        <main
          className="flex-1 flex flex-col items-center justify-center px-4"
          role="main"
          aria-label="Search for wallet"
        >
          <div className="w-full max-w-xl mx-auto flex flex-col items-center">
            <HomeIcon className="w-20 h-20 mb-6" />
            <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-2">
              Solana Portfolio P&L Tracker
            </h1>
            <p className="text-sm text-[var(--color-muted)] mb-8">
              Connect your wallet or enter an address to track portfolio, P&L, and swap history
            </p>
            <div className="flex flex-col items-center gap-4 w-full mb-6">
              <WalletMultiButton className="!rounded-[var(--radius-input)] !bg-violet-600 hover:!bg-violet-700 !text-white !text-sm !font-medium !h-11 !px-6" />
              <span className="text-xs text-[var(--color-muted)]">or</span>
            </div>
            <div className="w-full mb-6">
              <WalletInput
                onSearch={setWallet}
                isLoading={isLoading}
                currentWallet={null}
              />
            </div>
            {error && (
              <div className="w-full mb-6">
                <ErrorCard message={String(error)} onRetry={handleRetry} />
              </div>
            )}
          </div>
        </main>
      )}
      <footer className="py-4 text-center shrink-0 border-t border-[var(--color-border)]">
        <a
          href="https://x.com/0xMomen"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--color-muted)] hover:text-[var(--foreground)] transition-colors"
          aria-label="Follow on X (Twitter)"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
          <span>@0xMomen</span>
        </a>
      </footer>
      <Toast
        message="Just updated"
        visible={showUpdatedToast}
        onDismiss={() => setShowUpdatedToast(false)}
      />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--background)]" />}>
      <PageContent />
    </Suspense>
  );
}