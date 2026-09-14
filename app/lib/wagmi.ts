import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { arcMainnet } from "./chains";

export const wagmiConfig = getDefaultConfig({
  appName: "Arc Token Lock",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "YOUR_WALLETCONNECT_PROJECT_ID",
  chains: [arcMainnet],
  ssr: true,
});
