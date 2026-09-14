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
    // Mainnet is very likely technically live but NOT publicly deployable to yet, through any
    // channel found so far: Circle's own RPC is gated to approved node operators (401/403),
    // QuickNode only offers testnet provisioning (no mainnet option in their UI as of writing),
    // and rpc.arc-scan.org doesn't resolve to a real TLS cert. Left with no default on purpose —
    // set ARC_MAINNET_RPC_URL once a real, working endpoint actually exists (Circle's Sep 16
    // launch, or a provider adding a mainnet option).
    arcMainnet: {
      url: process.env.ARC_MAINNET_RPC_URL || "",
      chainId: 5042,
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
    },
  },
};
