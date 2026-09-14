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

## Chain config — verify before going live

Everything below came from a chat message, not Arc's own docs. Confirm each value independently
before deploying or launching:

- **Chain ID**: `5042`
- **Native currency**: `USDC`
- **RPC**: `arc-mainnet.infura.io` (needs your own Infura project ID appended)
- **Block explorer**: `https://arc-scan.org` — this session's network proxy blocked outbound
  requests to this domain, so it could not be independently verified as the real, official Arc
  explorer. A prior value given for this ("megaeth-pump-ok-moon.poptyedev.com") did not even
  resolve in DNS and was rejected rather than wired in. Since this explorer link is the whole
  point of the "share the proof" feature, look it up yourself before shipping.

## Still to build

1. **Deploy** `TokenLocker` to Arc chain (see `contracts/README.md`) and set
   `NEXT_PUBLIC_TOKEN_LOCKER_ADDRESS` in `app/`.
2. **WalletConnect Cloud project ID** for RainbowKit (`NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`).
3. **Decide on a lock fee** (optional) — `TokenLocker.setLockFee()` lets the owner charge a flat
   native-asset fee per lock; defaults to 0.
4. **Security review** of `contracts/` before mainnet — this contract holds arbitrary users'
   tokens in escrow, so it's worth a second set of eyes.
5. A public "browse all locks" / directory page (`locksByToken` is already exposed on-chain for
   this) if you want investors to be able to look up a token's locks without knowing a lock ID.
