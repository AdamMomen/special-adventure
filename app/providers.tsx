"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { SolanaProvider } from "@/components/SolanaProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
          },
        },
      })
  );
  return (
    <QueryClientProvider client={client}>
      <SolanaProvider>{children}</SolanaProvider>
    </QueryClientProvider>
  );
}
