// Helius Wallet API types
export interface HeliusBalance {
  mint: string;
  symbol: string;
  name: string;
  balance: number;
  decimals: number;
  pricePerToken: number | null;
  usdValue: number | null;
  logoUri?: string;
  tokenProgram?: string;
}

export interface HeliusBalancesResponse {
  balances: HeliusBalance[];
  nfts?: unknown[];
  totalUsdValue: number;
  pagination: {
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

export interface BalanceChange {
  mint: string;
  amount: number;
  decimals: number;
}

export interface HeliusTransaction {
  signature: string;
  timestamp: number | null;
  slot?: number;
  fee: number;
  feePayer?: string;
  error: string | null;
  balanceChanges: BalanceChange[];
}

export interface HeliusHistoryResponse {
  data: HeliusTransaction[];
  pagination: {
    hasMore: boolean;
    nextCursor: string | null;
  };
}

// P&L types
export interface Position {
  mint: string;
  symbol: string;
  logoUri?: string;
  totalCost: number;
  totalAmount: number;
  avgEntryPrice: number;
  remainingAmount: number;
  realizedPnl: number;
  unrealizedPnl: number | null;
  currentPrice: number | null;
  usdValue: number | null;
}

export interface PnLSummary {
  totalRealizedPnl: number;
  totalUnrealizedPnl: number;
  totalPnl: number;
  totalVolume: number;
  positions: Position[];
  pnlOverTime: { timestamp: number; cumulativePnl: number }[];
}
