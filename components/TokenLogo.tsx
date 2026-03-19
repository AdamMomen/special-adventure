"use client";

import { useState } from "react";

interface TokenLogoProps {
  logoUri?: string | null;
  symbol: string;
  size?: "sm" | "md";
}

const sizeClasses = {
  sm: "w-5 h-5 text-xs",
  md: "w-6 h-6 text-sm",
};

export function TokenLogo({ logoUri, symbol, size = "md" }: TokenLogoProps) {
  const [failed, setFailed] = useState(false);
  const showFallback = !logoUri || failed;
  const fallbackLetter = symbol?.slice(0, 1).toUpperCase() || "?";

  if (showFallback) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700 text-[var(--color-muted)] font-medium shrink-0 ${sizeClasses[size]}`}
        aria-hidden
      >
        {fallbackLetter}
      </span>
    );
  }

  return (
    <img
      src={logoUri}
      alt=""
      className={`rounded-full shrink-0 object-cover ${sizeClasses[size]}`}
      onError={() => setFailed(true)}
    />
  );
}
