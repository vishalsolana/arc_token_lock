import { defineChain } from "viem";

// Chain ID, native currency, and RPC host pattern were provided by the user in chat, not
// pulled from Arc's own docs — double check all of it (especially the block explorer, below)
// before deploying anything that spends real funds.
export const arcMainnet = defineChain({
  id: 5042,
  name: "Arc",
  nativeCurrency: { name: "USD Coin", symbol: "USDC", decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_ARC_RPC_URL ?? "https://arc-mainnet.infura.io"],
    },
  },
  blockExplorers: {
    // Given as https://arc-scan.org/ — this session's network proxy couldn't reach it to
    // confirm it's the real, official explorer. Verify it yourself before shipping; a wrong
    // explorer link here undermines the entire point of a "public proof of lock" page.
    default: { name: "Arc Scan", url: "https://arc-scan.org" },
  },
});
