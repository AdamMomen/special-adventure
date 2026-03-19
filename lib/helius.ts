import type {
  HeliusBalancesResponse,
  HeliusHistoryResponse,
} from "./types";

const HELIUS_BASE = "https://api.helius.xyz";

function getApiKey(): string {
  const key = process.env.HELIUS_API_KEY;
  if (!key) {
    throw new Error("HELIUS_API_KEY is not set");
  }
  return key;
}

export async function getWalletBalances(
  wallet: string
): Promise<HeliusBalancesResponse> {
  const apiKey = getApiKey();
  const url = `${HELIUS_BASE}/v1/wallet/${wallet}/balances?api-key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Helius balances failed: ${res.status}`);
  }
  return res.json();
}

export async function getWalletHistory(
  wallet: string,
  options?: {
    type?: string;
    before?: string;
    limit?: number;
    tokenAccounts?: string;
  }
): Promise<HeliusHistoryResponse> {
  const apiKey = getApiKey();
  const params = new URLSearchParams({ "api-key": apiKey });
  if (options?.type) params.set("type", options.type);
  if (options?.before) params.set("before", options.before);
  if (options?.limit) params.set("limit", String(options.limit));
  if (options?.tokenAccounts) params.set("tokenAccounts", options.tokenAccounts);

  const url = `${HELIUS_BASE}/v1/wallet/${wallet}/history?${params}`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Helius history failed: ${res.status}`);
  }
  return res.json();
}

export async function getAllSwapHistory(wallet: string): Promise<HeliusHistoryResponse["data"]> {
  const all: HeliusHistoryResponse["data"] = [];
  let before: string | undefined;

  do {
    const resp = await getWalletHistory(wallet, {
      type: "SWAP",
      tokenAccounts: "balanceChanged",
      before,
      limit: 100,
    });
    all.push(...resp.data);
    before = resp.pagination.hasMore ? resp.pagination.nextCursor ?? undefined : undefined;
  } while (before);

  return all;
}
