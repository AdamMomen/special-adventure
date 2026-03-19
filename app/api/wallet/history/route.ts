import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { getWalletHistory } from "@/lib/helius";

export async function GET(request: NextRequest) {
  const wallet = request.nextUrl.searchParams.get("wallet");
  const type = request.nextUrl.searchParams.get("type") ?? undefined;
  const before = request.nextUrl.searchParams.get("before") ?? undefined;
  const limit = request.nextUrl.searchParams.get("limit");
  const tokenAccounts = request.nextUrl.searchParams.get("tokenAccounts") ?? "balanceChanged";

  if (!wallet) {
    return NextResponse.json({ error: "wallet is required" }, { status: 400 });
  }

  try {
    new PublicKey(wallet);
  } catch {
    return NextResponse.json({ error: "Invalid Solana address" }, { status: 400 });
  }

  try {
    const data = await getWalletHistory(wallet, {
      type: type || "SWAP",
      before,
      limit: limit ? parseInt(limit, 10) : 100,
      tokenAccounts,
    });
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch history";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
