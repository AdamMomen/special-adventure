"use client";

import type { HeliusHistoryResponse } from "@/lib/types";
import { Tooltip } from "@/components/Tooltip";

interface ExportTradesButtonProps {
  data: HeliusHistoryResponse | null;
  wallet: string | null;
}

function DownloadIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

export function ExportTradesButton({ data, wallet }: ExportTradesButtonProps) {
  if (!data?.data?.length || !wallet) return null;

  const exportCsv = () => {
    const rows = data.data.map((tx) => {
      const date = tx.timestamp ? new Date(tx.timestamp * 1000).toISOString() : "";
      const changes = tx.balanceChanges
        .map((c) => `${c.amount} ${c.mint.slice(0, 8)}`)
        .join("; ");
      return [date, tx.signature, tx.fee, changes, tx.error ? "Failed" : "Success"].join(",");
    });
    const header = "Date,Signature,Fee (SOL),Balance Changes,Status";
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trades-${wallet.slice(0, 8)}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Tooltip content="Download swap history as a CSV file for spreadsheet analysis">
      <button
        onClick={exportCsv}
        aria-label="Export trades as CSV"
        className="inline-flex items-center justify-center w-8 h-8 rounded-full text-[var(--color-muted)] hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-[var(--foreground)] transition-colors duration-[var(--transition-fast)]"
      >
        <DownloadIcon />
      </button>
    </Tooltip>
  );
}
