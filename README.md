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
**September 16, 2026**. The chain is very likely already producing real blocks ahead of that
(a real trade's transaction receipt checked out, with contract addresses matching a known
integrator's own docs) — but **there is currently no working public way to submit transactions
to mainnet**, through any channel checked: Circle's own RPC (`rpc.mainnet.arc.io`) is gated to
approved node operators (401/403), QuickNode's own signup UI only offers "Arc Testnet" (no
mainnet option), and the one unofficial public RPC found (`rpc.arc-scan.org`) doesn't resolve to
a real TLS certificate at all. So mainnet isn't deployable yet — not out of caution, but because
there's nowhere to actually send the transaction.

| | Testnet (usable now) | Mainnet (not deployable yet) |
|---|---|---|
| Chain ID | `5042002` | `5042` |
| Native currency | USDC | USDC |
| RPC | `https://rpc.testnet.arc.io` — Circle's own, confirmed via `docs.arc.io` | none published/working yet |
| Block explorer | `https://testnet.arcscan.app` — Circle-affiliated | independent explorers exist (`arcexplorer.org`, `arc-scan.org`) but no matching working RPC |
| Faucet | `https://faucet.circle.com` | n/a |

**Check back once mainnet is actually reachable**: either Circle's Sep 16, 2026 launch publishes
a real endpoint at `docs.arc.io/arc/references/rpc-endpoints`, or a provider like QuickNode adds
an "Arc Mainnet" option to their endpoint creation flow. Either is the signal to set
`ARC_MAINNET_RPC_URL` for real and run `npm run deploy:mainnet`.

One more thing worth double-checking once that day comes: Arc's docs list the gas-USDC currency
symbol but not its decimals. This repo assumes 18 decimals (an unverified early value, never
independently confirmed) — check this before relying on it for any amount math, since a wrong
decimals value causes silent off-by-10^n bugs.

## Still to build

1. **Deploy `TokenLocker` to testnet now** (`npm run deploy:testnet` in `contracts/`, needs only
   a faucet-funded wallet) and set `NEXT_PUBLIC_TOKEN_LOCKER_ADDRESS_TESTNET` in `app/` — this is
   fully usable today and lets you see the whole product work end-to-end. Mainnet deploy waits
   until a working RPC actually exists (see above).
2. **WalletConnect Cloud project ID** for RainbowKit (`NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`) —
   free at cloud.reown.com.
3. **Confirm the USDC decimals** question above before mainnet launch.
4. **Decide on a lock fee** (optional) — `TokenLocker.setLockFee()` lets the owner charge a flat
   native-asset fee per lock; defaults to 0.
5. **Security review** of `contracts/` before real money flows through it at scale — this
   contract holds arbitrary users' tokens in escrow, so it's worth a second set of eyes.
6. A public "browse all locks" / directory page (`locksByToken` is already exposed on-chain for
   this) if you want investors to be able to look up a token's locks without knowing a lock ID.
