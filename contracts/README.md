# contracts

`TokenLocker.sol` — a permissionless escrow for locking any ERC-20 supply until a chosen unlock
time.

## Design

- **Anyone can lock any ERC-20.** `lock(token, amount, unlockTime)` pulls `amount` via
  `transferFrom` and credits the lock with the balance actually received (so fee-on-transfer /
  deflationary tokens are handled correctly instead of over-crediting).
- **Extend-only unlock dates.** `extendLock(lockId, newUnlockTime)` reverts if the new time
  isn't later than the current one — a lock can only ever get stricter.
- **No admin surface over locked funds.** The contract owner can only call `setLockFee()` to
  change the flat native-asset fee charged per lock (default 0) and where it's sent. There is no
  owner-only withdraw, sweep, or pause function of any kind — not even the deployer can touch a
  lock before its unlock time.
- **Lock ownership is transferable** independently of the tokens (`transferLockOwnership`), e.g.
  to hand a lock created from an EOA over to a multisig.
- Reentrancy-guarded (`lock`/`withdraw`) since the contract calls into arbitrary, un-trusted
  ERC-20 contracts.

## Commands

```
npm install
npm test                # compiles + runs the test suite (9 tests)
npm run compile          # compile only -> build/contracts.json
npm run deploy:testnet    # deploy to Arc testnet (usable today, see env vars below)
npm run deploy:mainnet    # deploy to Arc mainnet (launches Sep 16, 2026 — not usable yet)
```

## Deploying

Requires:

- `DEPLOYER_PRIVATE_KEY` — a wallet funded with testnet USDC for gas. Get testnet USDC free from
  `https://faucet.circle.com`. **Never paste a real private key into a chat session** — set it as
  a local environment variable only.
- `FEE_TREASURY_ADDRESS` — where the per-lock fee (if any) is sent; just a wallet address you
  control, no funds need to be in it. Required even if you leave the fee at 0, since the
  constructor takes it.
- `ARC_TESTNET_RPC_URL` (optional) — defaults to Circle's own `https://rpc.testnet.arc.io` in
  `hardhat.config.js`; override only if you want to use a different provider (Alchemy,
  Blockdaemon, dRPC, QuickNode all support Arc testnet per `docs.arc.io`).
- For mainnet: `ARC_MAINNET_RPC_URL`, once Arc actually publishes one after Sep 16, 2026 launch.
