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

// Mainnet launches September 16, 2026 (per Circle's own announcements) — as of writing, Arc's
// docs explicitly state mainnet endpoints/parameters are "published separately when available"
// and are NOT live yet. Nothing below is confirmed; do not deploy real funds against it. Once
// docs.arc.io publishes the real mainnet RPC/explorer, replace the placeholders here.
export const arcMainnet = defineChain({
  id: 5042,
  name: "Arc",
  nativeCurrency: { name: "USD Coin", symbol: "USDC", decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_ARC_MAINNET_RPC_URL ?? ""],
    },
  },
});
