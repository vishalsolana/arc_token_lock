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

// Mainnet is very likely technically live (a real trade's transaction receipt showed real blocks
// and contract addresses matching a known integrator's own docs) ahead of Circle's official
// public launch (Sep 16, 2026) — but there is currently NO working public way to submit
// transactions to it. Circle's own RPC (rpc.mainnet.arc.io) is gated to approved node operators
// (401/403, per circlefin/arc-node#356). QuickNode, a real infra provider, only lists "Arc
// Testnet" as an option to provision — no mainnet. rpc.arc-scan.org (tried directly) doesn't
// resolve to a real TLS cert at all. So: not deployable yet, by anyone, through any channel we've
// found. Revisit once Circle's Sep 16 launch publishes a real endpoint, or a provider like
// QuickNode adds a mainnet option. Left blank rather than pointing at a dead domain.
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
