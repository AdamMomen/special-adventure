"use client";

import { useState } from "react";

interface WalletInputProps {
  onSearch: (wallet: string) => void;
  isLoading?: boolean;
  currentWallet?: string | null;
}

export function WalletInput({ onSearch, isLoading, currentWallet }: WalletInputProps) {
  const [value, setValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed) onSearch(trimmed);
  };

  const placeholder = currentWallet
    ? `${currentWallet.slice(0, 8)}...${currentWallet.slice(-8)} — Change wallet`
    : "Enter Solana wallet address...";

  return (
    <form
      onSubmit={handleSubmit}
      className="flex gap-2 w-full"
      role="search"
      aria-label="Track wallet by address"
    >
      <label htmlFor="wallet-address" className="sr-only">
        Solana wallet address
      </label>
      <input
        id="wallet-address"
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label="Solana wallet address"
        className="flex-1 px-3 py-2 text-sm rounded-[var(--radius-input)] border border-[var(--color-border)] bg-[var(--color-surface)] dark:bg-zinc-900/50 text-[var(--foreground)] placeholder-[var(--color-muted)] focus:outline-none glow-input disabled:opacity-60"
        disabled={isLoading}
      />
      <button
        type="submit"
        disabled={isLoading || !value.trim()}
        aria-label="Track wallet"
        className="px-4 py-2 text-sm rounded-[var(--radius-input)] bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium glow-button shrink-0"
      >
        {isLoading ? "..." : "Track"}
      </button>
    </form>
  );
}