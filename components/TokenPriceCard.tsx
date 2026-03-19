"use client";

interface TokenPriceCardProps {
  symbol: string;
  price: number | null;
  change24h?: number | null;
}

export function TokenPriceCard({ symbol, price, change24h }: TokenPriceCardProps) {
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4">
      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{symbol}</p>
      <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
        {price != null ? `$${price.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 6 })}` : "N/A"}
      </p>
      {change24h != null && (
        <p
          className={`text-sm mt-1 ${
            change24h >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
          }`}
        >
          {change24h >= 0 ? "+" : ""}
          {(change24h * 100).toFixed(2)}% 24h
        </p>
      )}
    </div>
  );
}
