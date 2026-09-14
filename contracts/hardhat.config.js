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
    // Mainnet launches September 16, 2026 — Arc's docs explicitly say mainnet endpoints are
    // "published separately when available" and are not live as of writing. Do not deploy here
    // until you've confirmed a real RPC URL from docs.arc.io yourself.
    arcMainnet: {
      url: process.env.ARC_MAINNET_RPC_URL || "",
      chainId: 5042,
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
    },
  },
};
