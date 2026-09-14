require("@nomicfoundation/hardhat-toolbox");

/** @type {import("hardhat/config").HardhatUserConfig} */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      viaIR: true,
    },
  },
  networks: {
    hardhat: {},
    // Confirmed from Arc's own docs (docs.arc.io/arc/references/rpc-endpoints): chain ID
    // 5042002, Circle's primary RPC https://rpc.testnet.arc.io. Usable today.
    arcTestnet: {
      url: process.env.ARC_TESTNET_RPC_URL || "https://rpc.testnet.arc.io",
      chainId: 5042002,
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
    },
    // Mainnet is technically live ahead of Circle's official Sep 16, 2026 public launch. Circle's
    // own RPC (rpc.mainnet.arc.io) is gated to approved node operators (401/403), so this
    // defaults to rpc.arc-scan.org — a third-party, unofficial public RPC, not Circle-run or
    // SLA-backed. Deploying here means real funds through infrastructure we don't control. Swap
    // ARC_MAINNET_RPC_URL to Circle's own endpoint the moment it's public.
    arcMainnet: {
      url: process.env.ARC_MAINNET_RPC_URL || "https://rpc.arc-scan.org",
      chainId: 5042,
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
    },
  },
};
