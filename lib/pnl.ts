import type {
  HeliusTransaction,
  BalanceChange,
  Position,
  PnLSummary,
  HeliusBalance,
  TradeStats,
} from "./types";

const SOL_MINT = "So11111111111111111111111111111111111111112";

function getUsdValue(amount: number, mint: string, prices: Record<string, number>): number {
  const m = mint === "SOL" ? SOL_MINT : mint;
    return Math.abs(amount) * (prices[m] ?? 0);
}

export function computeTradeStats(
  transactions: HeliusTransaction[],
  prices: Record<string, number>
): TradeStats {
  const pnls: number[] = [];
  for (const tx of transactions) {
    if (tx.error) continue;
    const costUsd = tx.balanceChanges
      .filter((c) => c.amount < 0)
      .reduce((s, c) => s + getUsdValue(c.amount, c.mint === "SOL" ? SOL_MINT : c.mint, prices), 0);
    const proceedsUsd = tx.balanceChanges
      .filter((c) => c.amount > 0)
      .reduce((s, c) => s + getUsdValue(c.amount, c.mint === "SOL" ? SOL_MINT : c.mint, prices), 0);
    pnls.push(proceedsUsd - costUsd);
  }
  const wins = pnls.filter((p) => p > 0);
  const losses = pnls.filter((p) => p < 0);
  const totalTrades = pnls.length;
  return {
    totalTrades,
    wins: wins.length,
    losses: losses.length,
    winRate: totalTrades > 0 ? wins.length / totalTrades : 0,
    avgWin: wins.length > 0 ? wins.reduce((a, b) => a + b, 0) / wins.length : 0,
    avgLoss: losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / losses.length : 0,
    bestTrade: pnls.length > 0 ? Math.max(...pnls) : 0,
    worstTrade: pnls.length > 0 ? Math.min(...pnls) : 0,
  };
}

export function computePnL(
  transactions: HeliusTransaction[],
  balances: HeliusBalance[],
  prices: Record<string, number>,
  symbolByMint: Record<string, string>
): PnLSummary {
  const positionCost = new Map<string, number>();
  const positionAmount = new Map<string, number>();
  let totalRealizedPnl = 0;

  const sorted = [...transactions].sort((a, b) => {
    const ta = a.timestamp ?? 0;
    const tb = b.timestamp ?? 0;
    return ta - tb;
  });

  for (const tx of sorted) {
    if (tx.error) continue;

    const sold: BalanceChange[] = [];
    const received: BalanceChange[] = [];

    for (const c of tx.balanceChanges) {
      const mint = c.mint === "SOL" ? SOL_MINT : c.mint;
      const change = { ...c, mint };
      if (c.amount < 0) sold.push(change);
      else if (c.amount > 0) received.push(change);
    }

    const costUsd = sold.reduce((s, c) => s + getUsdValue(c.amount, c.mint, prices), 0);
    const proceedsUsd = received.reduce((s, c) => s + getUsdValue(c.amount, c.mint, prices), 0);

    const txRealizedPnl = proceedsUsd - costUsd;
    totalRealizedPnl += txRealizedPnl;

    for (const s of sold) {
      const soldMint = s.mint;
      const soldAmount = Math.abs(s.amount);
      const totalCost = positionCost.get(soldMint) ?? 0;
      const totalAmount = positionAmount.get(soldMint) ?? 0;
      const avgCost = totalAmount > 0 ? totalCost / totalAmount : 0;
      const costBasis = avgCost * Math.min(soldAmount, totalAmount);
      positionCost.set(soldMint, totalCost - costBasis);
      positionAmount.set(soldMint, totalAmount - soldAmount);
    }

    for (const r of received) {
      const recMint = r.mint;
      const recAmount = Math.abs(r.amount);
      const share = costUsd / (received.length || 1);
      const prevCost = positionCost.get(recMint) ?? 0;
      const prevAmount = positionAmount.get(recMint) ?? 0;
      positionCost.set(recMint, prevCost + share);
      positionAmount.set(recMint, prevAmount + recAmount);
    }
  }

  const positions: Position[] = [];
  let totalUnrealizedPnl = 0;

  const allMints = new Set<string>([
    ...positionCost.keys(),
    ...balances.map((b) => b.mint),
  ]);

  for (const mint of allMints) {
    const totalCost = positionCost.get(mint) ?? 0;
    const totalAmount = positionAmount.get(mint) ?? 0;
    const balance = balances.find((b) => b.mint === mint);
    const remainingAmount = balance?.balance ?? 0;
    const symbol = balance?.symbol ?? symbolByMint[mint] ?? mint.slice(0, 8);
    const currentPrice = balance?.pricePerToken ?? prices[mint] ?? null;
    const usdValue = balance?.usdValue ?? (currentPrice ? remainingAmount * currentPrice : null);

    const avgEntryPrice = totalAmount > 0 ? totalCost / totalAmount : 0;

    let unrealizedPnl: number | null = null;
    if (currentPrice != null && remainingAmount > 0 && avgEntryPrice > 0) {
      unrealizedPnl = (currentPrice - avgEntryPrice) * remainingAmount;
      totalUnrealizedPnl += unrealizedPnl;
    }

    positions.push({
      mint,
      symbol,
      logoUri: balance?.logoUri,
      totalCost,
      totalAmount,
      avgEntryPrice,
      remainingAmount,
      realizedPnl: 0,
      unrealizedPnl,
      currentPrice,
      usdValue,
    });
  }

  let totalVolume = 0;
  const pnlOverTime: { timestamp: number; cumulativePnl: number }[] = [];
  let runningPnl = 0;

  for (const tx of sorted) {
    if (tx.error) continue;
    const costUsd = tx.balanceChanges
      .filter((c) => c.amount < 0)
      .reduce((s, c) => s + getUsdValue(c.amount, c.mint === "SOL" ? SOL_MINT : c.mint, prices), 0);
    const proceedsUsd = tx.balanceChanges
      .filter((c) => c.amount > 0)
      .reduce((s, c) => s + getUsdValue(c.amount, c.mint === "SOL" ? SOL_MINT : c.mint, prices), 0);
    totalVolume += costUsd + proceedsUsd;

    const sold: BalanceChange[] = tx.balanceChanges.filter((c) => c.amount < 0);
    const received: BalanceChange[] = tx.balanceChanges.filter((c) => c.amount > 0);
    const costForTx = sold.reduce((s, c) => s + getUsdValue(c.amount, c.mint === "SOL" ? SOL_MINT : c.mint, prices), 0);
    const proceedsForTx = received.reduce((s, c) => s + getUsdValue(c.amount, c.mint === "SOL" ? SOL_MINT : c.mint, prices), 0);
    runningPnl += proceedsForTx - costForTx;
    const ts = tx.timestamp ?? 0;
    if (ts > 0) pnlOverTime.push({ timestamp: ts, cumulativePnl: runningPnl });
  }

  pnlOverTime.sort((a, b) => a.timestamp - b.timestamp);

  const tradeStats = computeTradeStats(sorted, prices);

  return {
    totalRealizedPnl,
    totalUnrealizedPnl,
    totalPnl: totalRealizedPnl + totalUnrealizedPnl,
    totalVolume,
    tradeStats,
    pnlOverTime,
    positions: positions.filter(
      (p) => p.remainingAmount > 0 || p.totalAmount > 0
    ),
  };
}
