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

Arc is Circle's (the USDC company) USDC-native L1. **September 16, 2026 — today, as of this
note — is Circle's confirmed public mainnet launch date**, independently corroborated by
multiple news outlets and Circle's own pressroom (real founding validators: BlackRock, Visa,
Mastercard, Fireblocks, and others).

| | Testnet | Mainnet |
|---|---|---|
| Chain ID | `5042002` | `5042` |
| Native currency | USDC | USDC |
| RPC | `https://rpc.testnet.arc.io` — Circle's own, confirmed via `docs.arc.io` | `https://rpc.mainnet.arc.io` — Circle's own endpoint naming; was gated pre-launch, plausibly open now that launch day has arrived, but **not yet confirmed by an actual successful deploy** |
| Block explorer | `https://testnet.arcscan.app` — Circle-affiliated | `https://arc-scan.org` |
| Faucet | `https://faucet.circle.com` | n/a — needs real USDC for gas |

**Before deploying real funds through `rpc.mainnet.arc.io`, confirm it actually works** — the
most reliable way is just running `npm run deploy:mainnet` with a small amount of gas and seeing
if it succeeds. Earlier attempts at other mainnet RPC guesses (an Infura URL, `rpc.arc-scan.org`)
turned out not to work, so treat this the same way: promising and well-corroborated, but verify
with a real transaction before trusting it at scale.

One more thing worth double-checking: Arc's docs list the gas-USDC currency symbol but not its
decimals. This repo assumes 18 decimals (an unverified early value, never independently
confirmed) — check this before relying on it for any amount math, since a wrong decimals value
causes silent off-by-10^n bugs.

## Still to build

1. **Deploy `TokenLocker`.** Testnet (`npm run deploy:testnet` in `contracts/`) needs only a
   faucet-funded wallet and is known-working. Mainnet (`npm run deploy:mainnet`) needs a wallet
   funded with real USDC — try it and confirm it actually succeeds before relying on it. Either
   way, set `NEXT_PUBLIC_TOKEN_LOCKER_ADDRESS_TESTNET` / `_MAINNET` in `app/` afterwards.
2. **WalletConnect Cloud project ID** for RainbowKit (`NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`) —
   free at cloud.reown.com.
3. **Confirm the USDC decimals** question above.
4. **Decide on a lock fee** (optional) — `TokenLocker.setLockFee()` lets the owner charge a flat
   native-asset fee per lock; defaults to 0.
5. **Security review** of `contracts/` before real money flows through it at scale — this
   contract holds arbitrary users' tokens in escrow, so it's worth a second set of eyes.
6. A public "browse all locks" / directory page (`locksByToken` is already exposed on-chain for
   this) if you want investors to be able to look up a token's locks without knowing a lock ID.
