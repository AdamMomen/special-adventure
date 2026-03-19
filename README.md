# Solana Memecoin P&L Tracker

A proof-of-work mini trading dashboard that aggregates on-chain Solana data and tracks a specific wallet's P&L across memecoin trades—inspired by [Axiom](https://axiom.trade).

## Features

- **Portfolio Summary**: Total USD value and top holdings from Helius Wallet API
- **P&L Tracker**: Realized and unrealized P&L per token with average entry price
- **Transaction Feed**: Recent swap history with balance changes
- **Token Prices**: Helius DAS (top 10k tokens, hourly)

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Solana web3.js
- Helius API (Wallet API)
- TanStack Query

## Setup

1. Use Node 20+ (required for Next.js 16 and Tailwind v4):

```bash
nvm use    # uses .nvmrc (Node 20)
# or: nvm install 20 && nvm use 20
```

2. Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

3. Add your Helius API key to `.env.local`:

```
HELIUS_API_KEY=your_helius_api_key
NEXT_PUBLIC_HELIUS_RPC=https://mainnet.helius-rpc.com/?api-key=your_helius_api_key
```

4. Install and run:

```bash
npm install
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) and enter a Solana wallet address.

## API Routes

- `GET /api/wallet/balances?wallet=<address>` — Wallet balances with USD values
- `GET /api/wallet/history?wallet=<address>&type=SWAP` — Swap transaction history
- `GET /api/wallet/pnl?wallet=<address>` — Computed P&L summary
