/**
 * Fetch token prices for arbitrary mints.
 * Uses Helius DAS getAsset (price_info for top 10k tokens by volume).
 */

function getRpcUrl(): string {
  const rpc = process.env.NEXT_PUBLIC_HELIUS_RPC ?? process.env.HELIUS_RPC;
  if (rpc?.startsWith("https://")) return rpc;
  const key = process.env.HELIUS_API_KEY;
  if (key) return `https://mainnet.helius-rpc.com/?api-key=${key}`;
  throw new Error("HELIUS_API_KEY or NEXT_PUBLIC_HELIUS_RPC required for price lookup");
}

export async function getTokenPrices(mints: string[]): Promise<Record<string, number>> {
  const result: Record<string, number> = {};
  const unique = [...new Set(mints)].filter(Boolean);
  if (unique.length === 0) return result;

  const rpcUrl = getRpcUrl();
  const CONCURRENCY = 5;

  async function fetchOne(id: string): Promise<{ id: string; price?: number }> {
    const res = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id,
        method: "getAsset",
        params: { id },
      }),
    });
    const data = (await res.json()) as {
      result?: { token_info?: { price_info?: { price_per_token?: number } } };
    };
    const price = data?.result?.token_info?.price_info?.price_per_token;
    return { id, price };
  }

  const responses: { id: string; price?: number }[] = [];
  for (let i = 0; i < unique.length; i += CONCURRENCY) {
    const batch = unique.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(batch.map(fetchOne));
    responses.push(...batchResults);
  }

  for (const { id, price } of responses) {
    if (typeof price === "number" && price > 0) {
      result[id] = price;
    }
  }

  return result;
}
