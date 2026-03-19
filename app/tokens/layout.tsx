import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Tokens",
  description: "View all tokens in this Solana wallet portfolio.",
};

export default function TokensLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
