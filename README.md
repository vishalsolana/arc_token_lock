# Arc Token Lock

Lock any ERC-20 token supply on Arc chain until a chosen date, and get a public, on-chain
"proof of lock" page to share — so a token creator (or anyone) can show a balance can't move
before then. Modeled on the flow at hoodlock.tech, targeting Arc chain instead of Robinhood
Chain.

## Layout

- `contracts/` — the `TokenLocker` Solidity contract and its test suite. Escrows any ERC-20,
  extend-only unlock dates (never earlier), no admin surface over locked funds at all. See
  `contracts/README.md`.
- `app/` — Next.js frontend: wallet connect, a form to pick a token/amount/unlock date, a public
  per-lock proof page, and a "my locks" dashboard. See `app/README.md`.

## Status

- **Contract**: written, unit-tested (`cd contracts && npm test`, 9/9 passing), **not yet
  audited or deployed**. Do not deploy to mainnet with real funds before a security review.
- **Frontend**: builds and typechecks cleanly; every route was checked in a browser during
  development. Not yet usable end-to-end because there's no deployed contract address to point
  it at (see below).

## Chain config

Arc is Circle's (the USDC company) USDC-native L1. Circle's official public launch is
**September 16, 2026**, but the chain is independently confirmed to already be producing real
blocks and processing real transactions ahead of that (verified via a real trade's transaction
receipt, cross-checked contract addresses, and multiple independent block explorers). Circle's
own RPC (`rpc.mainnet.arc.io` and node-provider variants) is currently gated to approved node
operators (401/403) — not publicly open yet.

| | Testnet | Mainnet |
|---|---|---|
| Chain ID | `5042002` | `5042` |
| Native currency | USDC | USDC |
| RPC | `https://rpc.testnet.arc.io` — Circle's own, confirmed via `docs.arc.io` | `https://rpc.arc-scan.org` — **third-party, unofficial, no SLA**, works without an API key |
| Block explorer | `https://testnet.arcscan.app` — Circle-affiliated | `https://arc-scan.org` — independent, not Circle-run |
| Faucet | `https://faucet.circle.com` | n/a — needs real USDC for gas |

**This means the mainnet deployment relies on infrastructure Circle doesn't run or vouch for.**
That was a deliberate, informed decision to move ahead now rather than wait for Sep 16 — worth
re-confirming you're still comfortable with before deploying real user funds through it. Swap
`ARC_MAINNET_RPC_URL` to Circle's own endpoint the moment it's public (watch
`docs.arc.io/arc/references/rpc-endpoints`).

One more thing worth double-checking yourself: Arc's docs list the gas-USDC currency symbol but
not its decimals. This repo assumes 18 decimals (an unverified early value, never independently
confirmed) — check this before relying on it for any amount math, since a wrong decimals value
causes silent off-by-10^n bugs.

## Still to build

1. **Deploy** `TokenLocker`. Testnet (`npm run deploy:testnet` in `contracts/`) needs only a
   faucet-funded wallet. Mainnet (`npm run deploy:mainnet`) needs a wallet funded with **real**
   USDC for gas — see the infrastructure caveat above first. Either way, set
   `NEXT_PUBLIC_TOKEN_LOCKER_ADDRESS_TESTNET` / `_MAINNET` in `app/` afterwards.
2. **WalletConnect Cloud project ID** for RainbowKit (`NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`) —
   free at cloud.reown.com.
3. **Confirm the USDC decimals** question above before launch.
4. **Decide on a lock fee** (optional) — `TokenLocker.setLockFee()` lets the owner charge a flat
   native-asset fee per lock; defaults to 0.
5. **Security review** of `contracts/` before real money flows through it at scale — this
   contract holds arbitrary users' tokens in escrow, so it's worth a second set of eyes.
6. A public "browse all locks" / directory page (`locksByToken` is already exposed on-chain for
   this) if you want investors to be able to look up a token's locks without knowing a lock ID.
