#!/usr/bin/env node
/**
 * Debug script to understand P&L data flow and sorting.
 * Run: node scripts/debug-pnl-data.mjs [wallet]
 *
 * Requires either:
 *   - npm run dev (then fetches from localhost:3000)
 *   - Or set FETCH_DIRECT=1 to call Helius directly (uses .env.local)
 */

import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnv() {
  const envPath = resolve(root, ".env.local");
  if (!existsSync(envPath)) {
    console.error("No .env.local found. Create it with HELIUS_API_KEY=...");
    process.exit(1);
  }
  const content = readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) {
      const key = m[1].trim();
      const val = m[2].trim().replace(/^["']|["']$/g, "");
      process.env[key] = val;
    }
  }
}

loadEnv();

const DEFAULT_WALLET = "86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY";
const WALLET = process.argv[2] || DEFAULT_WALLET;

const INTERVALS = [
  { label: "1D", seconds: 24 * 60 * 60 },
  { label: "7D", seconds: 7 * 24 * 60 * 60 },
  { label: "30D", seconds: 30 * 24 * 60 * 60 },
  { label: "All", seconds: Infinity },
];

function fmtTs(ts) {
  return new Date(ts * 1000).toISOString();
}

async function fetchFromApi() {
  const url = `http://localhost:3000/api/wallet/pnl?wallet=${WALLET}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`API ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

async function fetchDirect() {
  const apiKey = process.env.HELIUS_API_KEY;
  if (!apiKey) throw new Error("HELIUS_API_KEY not set in .env.local");

  const all = [];
  let before;
  do {
    const params = new URLSearchParams({ "api-key": apiKey, type: "SWAP", tokenAccounts: "balanceChanged", limit: "100" });
    if (before) params.set("before", before);
    const url = `https://api.helius.xyz/v1/wallet/${WALLET}/history?${params}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Helius ${res.status}: ${await res.text()}`);
    const data = await res.json();
    all.push(...data.data);
    before = data.pagination?.hasMore ? data.pagination?.nextCursor : null;
  } while (before);

  const balancesUrl = `https://api.helius.xyz/v1/wallet/${WALLET}/balances?api-key=${apiKey}`;
  const balRes = await fetch(balancesUrl);
  if (!balRes.ok) throw new Error(`Helius balances ${balRes.status}`);
  const balances = await balRes.json();

  const prices = {};
  for (const b of balances.balances || []) {
    if (b.pricePerToken != null) prices[b.mint] = b.pricePerToken;
  }

  const sorted = [...all].sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));
  const pnlOverTime = [];
  let runningPnl = 0;
  const SOL = "So11111111111111111111111111111111111111112";

  for (const tx of sorted) {
    if (tx.error) continue;
    const sold = (tx.balanceChanges || []).filter((c) => c.amount < 0);
    const received = (tx.balanceChanges || []).filter((c) => c.amount > 0);
    const getVal = (c) => Math.abs(c.amount) * (prices[c.mint === "SOL" ? SOL : c.mint] ?? 0);
    const cost = sold.reduce((s, c) => s + getVal(c), 0);
    const proceeds = received.reduce((s, c) => s + getVal(c), 0);
    runningPnl += proceeds - cost;
    const ts = tx.timestamp ?? 0;
    if (ts > 0) pnlOverTime.push({ timestamp: ts, cumulativePnl: runningPnl });
  }

  pnlOverTime.sort((a, b) => a.timestamp - b.timestamp);

  return {
    pnlOverTime,
    totalRealizedPnl: 0,
    totalUnrealizedPnl: 0,
    totalPnl: 0,
    totalVolume: 0,
    positions: [],
  };
}

async function main() {
  console.log("=".repeat(60));
  console.log("P&L Data Debug Script");
  console.log("=".repeat(60));
  console.log(`Wallet: ${WALLET}\n`);

  let pnl;
  if (process.env.FETCH_DIRECT === "1") {
    console.log("Fetching directly from Helius...\n");
    pnl = await fetchDirect();
  } else {
    try {
      console.log("Fetching from local API (http://localhost:3000)...");
      console.log("  (Run 'npm run dev' if not already)\n");
      pnl = await fetchFromApi();
    } catch (e) {
      console.error("API fetch failed:", e.message);
      console.log("\nTo fetch directly from Helius instead, run:");
      console.log("  FETCH_DIRECT=1 node scripts/debug-pnl-data.mjs", WALLET);
      process.exit(1);
    }
  }

  const data = pnl.pnlOverTime || [];
  console.log("1. RAW pnlOverTime FROM API");
  console.log("-".repeat(40));
  console.log(`Total points: ${data.length}`);

  if (data.length === 0) {
    console.log("No data. Wallet may have no swap history.");
    process.exit(0);
  }

  const sorted = [...data].sort((a, b) => a.timestamp - b.timestamp);
  const isAscending = sorted.every((p, i) => i === 0 || p.timestamp >= sorted[i - 1].timestamp);
  console.log(`Sort order: ${isAscending ? "ascending (oldest first)" : "DESCENDING or mixed"}`);

  console.log("\nFirst 5 points:");
  sorted.slice(0, 5).forEach((p, i) => {
    console.log(`  ${i + 1}. ${fmtTs(p.timestamp)}  PnL: $${p.cumulativePnl?.toFixed(2) ?? "?"}`);
  });

  console.log("\nLast 5 points:");
  sorted.slice(-5).forEach((p, i) => {
    console.log(`  ${sorted.length - 5 + i + 1}. ${fmtTs(p.timestamp)}  PnL: $${p.cumulativePnl?.toFixed(2) ?? "?"}`);
  });

  const now = Math.floor(Date.now() / 1000);
  console.log("\n2. FILTERING BY INTERVAL (as chart does)");
  console.log("-".repeat(40));
  console.log(`Now (UTC): ${fmtTs(now)}\n`);

  for (const { label, seconds } of INTERVALS) {
    const cutoff = seconds === Infinity ? 0 : now - seconds;
    const filtered = sorted.filter((d) => d.timestamp >= cutoff);
    const lastBefore = sorted.filter((d) => d.timestamp < cutoff).pop();

    console.log(`${label}:`);
    console.log(`  Cutoff: ${cutoff === 0 ? "none" : fmtTs(cutoff)}`);
    console.log(`  Points in range: ${filtered.length}`);
    if (lastBefore && cutoff > 0 && filtered.length > 0) {
      console.log(`  Baseline (last before cutoff): ${fmtTs(lastBefore.timestamp)} PnL=$${lastBefore.cumulativePnl?.toFixed(2)}`);
    }
    if (filtered.length > 0) {
      console.log(`  First: ${fmtTs(filtered[0].timestamp)} PnL=$${filtered[0].cumulativePnl?.toFixed(2)}`);
      console.log(`  Last:  ${fmtTs(filtered[filtered.length - 1].timestamp)} PnL=$${filtered[filtered.length - 1].cumulativePnl?.toFixed(2)}`);
    }
    console.log();
  }

  const counts = INTERVALS.map(({ label, seconds }) => {
    const cutoff = seconds === Infinity ? 0 : now - seconds;
    return sorted.filter((d) => d.timestamp >= cutoff).length;
  });
  const allSame = counts.every((c) => c === counts[0]);
  if (allSame && data.length > 0) {
    console.log("NOTE: All intervals show the SAME number of points.");
    console.log("      This means all trades are within the 1D window.");
    console.log("      The chart will look identical for 1D/7D/30D/All.");
    console.log("      Try a wallet with older trades to see interval differences.\n");
  }

  console.log("3. DOWNLOAD FULL DATA (optional)");
  console.log("-".repeat(40));
  const outPath = resolve(root, "pnl-debug-output.json");
  const output = {
    wallet: WALLET,
    fetchedAt: new Date().toISOString(),
    totalPoints: data.length,
    pnlOverTime: sorted,
    intervals: INTERVALS.map(({ label, seconds }) => {
      const cutoff = seconds === Infinity ? 0 : now - seconds;
      const filtered = sorted.filter((d) => d.timestamp >= cutoff);
      return { label, cutoff: cutoff || null, points: filtered.length, first: filtered[0], last: filtered[filtered.length - 1] };
    }),
  };
  const fs = await import("fs");
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`Written to ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
