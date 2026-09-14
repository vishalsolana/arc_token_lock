import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { arcMainnet, arcTestnet } from "./chains";

export const wagmiConfig = getDefaultConfig({
  appName: "Arc Token Lock",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "YOUR_WALLETCONNECT_PROJECT_ID",
  // Testnet first since it's the only one actually usable right now — mainnet doesn't launch
  // until September 16, 2026.
  chains: [arcTestnet, arcMainnet],
  ssr: true,
});
