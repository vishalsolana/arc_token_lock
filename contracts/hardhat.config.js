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
    // Chain ID 5042 and the USDC-gas currency come from the user, not from Arc's own docs —
    // double check both against https://arc-scan.org (or Arc's official docs) before deploying
    // anything that spends real funds. No testnet network is configured yet; add one here once
    // its chain ID/RPC are confirmed.
    arcMainnet: {
      url: process.env.ARC_MAINNET_RPC_URL || "",
      chainId: 5042,
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
    },
  },
};
