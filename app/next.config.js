/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // wagmi's Coinbase/Base connector pulls in @coinbase/cdp-sdk's x402 payment support,
    // whose optional @x402/* submodules aren't installed and aren't used by this app (we
    // don't use x402 payments) — stub them out instead of installing dead weight.
    config.resolve.alias = {
      ...config.resolve.alias,
      "@x402/evm/upto/client": false,
      "@x402/evm/exact/client": false,
      "@x402/core/client": false,
      "@x402/svm/exact/client": false,
      "@x402/evm": false,
      // Optional peer deps: React Native storage (MetaMask SDK's RN support, unused on web)
      // and pretty-printing for WalletConnect's server-side logger.
      "@react-native-async-storage/async-storage": false,
      "pino-pretty": false,
    };
    return config;
  },
};

module.exports = nextConfig;
