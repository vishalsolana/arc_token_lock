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

// Circle's official public mainnet launch is Sep 16, 2026 (confirmed by multiple independent
// news sources — Circle's own pressroom, The Defiant, KuCoin — reporting real founding
// validators: BlackRock, Visa, Mastercard, Fireblocks, and others). rpc.mainnet.arc.io matches
// the exact naming pattern of Circle's own endpoint (previously seen gated 401/403 pre-launch,
// per circlefin/arc-node#356) — plausible it's now open, but NOT yet independently verified by
// actually completing a deploy through it. arc-scan.org as an explorer is a different claim than
// the earlier finding that specifically rpc.arc-scan.org (a different, unofficial RPC) was
// flagged by an ISP spam blocklist — that finding doesn't contradict arc-scan.org being a real
// explorer site. Verify with a real deploy before trusting this for production use.
export const arcMainnet = defineChain({
  id: 5042,
  name: "Arc",
  nativeCurrency: { name: "USD Coin", symbol: "USDC", decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_ARC_MAINNET_RPC_URL ?? "https://rpc.mainnet.arc.io"],
    },
  },
  blockExplorers: {
    default: { name: "Arc Scan", url: "https://arc-scan.org" },
  },
});
