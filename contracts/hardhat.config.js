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
    // Circle's official public mainnet launch is Sep 16, 2026 (confirmed by multiple independent
    // news sources, real founding validators). rpc.mainnet.arc.io matches Circle's own endpoint
    // naming (previously gated 401/403 pre-launch per circlefin/arc-node#356) - plausible it's
    // now open, but not yet independently confirmed by a successful deploy. Test before trusting
    // with real funds at scale.
    arcMainnet: {
      url: process.env.ARC_MAINNET_RPC_URL || "https://rpc.mainnet.arc.io",
      chainId: 5042,
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
    },
  },
};
