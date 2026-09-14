import { defineChain } from "viem";

// Confirmed from Arc's own official docs (docs.arc.io/arc/references/rpc-endpoints) — chain ID,
// Circle's primary RPC, and the official Arcscan explorer. Decimals for the gas-USDC currency
// aren't stated on that page; 18 is carried over from an earlier, unverified chat-provided
// value — double check against docs.arc.io/arc-network/gas-and-fees before relying on it for
// any amount math.
export const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USD Coin", symbol: "USDC", decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_ARC_TESTNET_RPC_URL ?? "https://rpc.testnet.arc.io"],
    },
  },
  blockExplorers: {
    default: { name: "Arcscan", url: "https://testnet.arcscan.app" },
  },
  testnet: true,
});

// Mainnet is technically live (real blocks, real transactions confirmed independently) ahead of
// Circle's official public launch (Sep 16, 2026). Circle's own RPC endpoints
// (rpc.mainnet.arc.io and its node-provider variants, per circlefin/arc-node#356) are gated to
// approved node operators (401/403) — NOT publicly open yet. rpc.arc-scan.org is a third-party,
// unofficial public RPC that works without a key; arc-scan.org is that same operator's block
// explorer. Neither is Circle-run or SLA-backed — a contract deployed through it holds real user
// funds via infrastructure we don't control. Swap to Circle's own endpoint the moment it's
// public. Decimals: unconfirmed, see the note on arcTestnet above.
export const arcMainnet = defineChain({
  id: 5042,
  name: "Arc",
  nativeCurrency: { name: "USD Coin", symbol: "USDC", decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_ARC_MAINNET_RPC_URL ?? "https://rpc.arc-scan.org"],
    },
  },
  blockExplorers: {
    default: { name: "Arc Scan (independent)", url: "https://arc-scan.org" },
  },
});
