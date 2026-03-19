import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { getAllSwapHistory, getWalletBalances } from "@/lib/helius";
import { getTokenPrices } from "@/lib/prices";
import { computePnL } from "@/lib/pnl";

const SOL_MINT = "So11111111111111111111111111111111111111112";

export async function GET(request: NextRequest) {
  const wallet = request.nextUrl.searchParams.get("wallet");
  if (!wallet) {
    return NextResponse.json({ error: "wallet is required" }, { status: 400 });
  }

  try {
    new PublicKey(wallet);
  } catch {
    return NextResponse.json({ error: "Invalid Solana address" }, { status: 400 });
  }

  try {
    const [historyResp, balancesResp] = await Promise.all([
      getAllSwapHistory(wallet),
      getWalletBalances(wallet),
    ]);

    const symbolByMint: Record<string, string> = {};
    const prices: Record<string, number> = {};

    for (const b of balancesResp.balances) {
      symbolByMint[b.mint] = b.symbol;
      if (b.pricePerToken != null) prices[b.mint] = b.pricePerToken;
    }

    const mintsFromHistory = new Set<string>();
    for (const tx of historyResp) {
      for (const c of tx.balanceChanges ?? []) {
        const mint = c.mint === "SOL" ? SOL_MINT : c.mint;
        mintsFromHistory.add(mint);
      }
    }

    const missingMints = [...mintsFromHistory].filter((m) => !(m in prices));
    if (missingMints.length > 0) {
      const jupiterPrices = await getTokenPrices(missingMints);
      for (const [mint, price] of Object.entries(jupiterPrices)) {
        prices[mint] = price;
      }
    }

    const pnl = computePnL(
      historyResp,
      balancesResp.balances,
      prices,
      symbolByMint
    );

    return NextResponse.json(pnl);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to compute P&L";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
