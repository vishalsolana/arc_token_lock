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

Arc is Circle's (the USDC company) USDC-native L1. Mainnet launches **September 16, 2026**; until
then only testnet is usable. Values below are confirmed from Arc's own docs
(`docs.arc.io/arc/references/rpc-endpoints`), not guessed:

| | Testnet (usable now) | Mainnet (launches Sep 16, 2026) |
|---|---|---|
| Chain ID | `5042002` | `5042` |
| Native currency | USDC | USDC |
| RPC (Circle's own) | `https://rpc.testnet.arc.io` | not yet published |
| Block explorer | `https://testnet.arcscan.app` | not yet published |
| Faucet | `https://faucet.circle.com` | n/a |

Earlier drafts of this project pointed at `arc-mainnet.infura.io` and `arc-scan.org` — both were
unverified guesses from a chat message. `arc-scan.org` in particular turned out to be different,
unofficial infrastructure, not Circle's real explorer (`arcscan.app`). Those have been replaced
with the confirmed testnet values above; don't reintroduce the old ones.

One more thing worth double-checking yourself: Arc's docs list the gas-USDC currency symbol but
not its decimals on the RPC-endpoints page. This repo currently assumes 18 decimals (carried over
from an earlier unverified value) — confirm against `docs.arc.io/arc-network/gas-and-fees` before
relying on it for any amount math, since a wrong decimals value causes silent off-by-10^n bugs.

## Still to build

1. **Deploy** `TokenLocker` to Arc testnet now (`npm run deploy:testnet` in `contracts/`, see
   `contracts/README.md`) and set `NEXT_PUBLIC_TOKEN_LOCKER_ADDRESS_TESTNET` in `app/` — this is
   fully doable today. Mainnet deploy waits for Arc's real launch on Sep 16.
2. **WalletConnect Cloud project ID** for RainbowKit (`NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`) —
   free at cloud.reown.com.
3. **Confirm the USDC decimals** question above before launch.
4. **Decide on a lock fee** (optional) — `TokenLocker.setLockFee()` lets the owner charge a flat
   native-asset fee per lock; defaults to 0.
5. **Security review** of `contracts/` before mainnet — this contract holds arbitrary users'
   tokens in escrow, so it's worth a second set of eyes.
6. A public "browse all locks" / directory page (`locksByToken` is already exposed on-chain for
   this) if you want investors to be able to look up a token's locks without knowing a lock ID.
