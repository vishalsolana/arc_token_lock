# app

Next.js + wagmi/RainbowKit frontend for Arc Token Lock.

## Pages

- `/` — landing page (connect & choose → set unlock date → share the proof).
- `/lock/create` — the lock-creation form: paste a token address, amount, unlock date/preset,
  approve + lock.
- `/lock/[id]` — public, no-wallet-required proof page for a single lock; if the connected
  wallet is the lock's owner, also shows extend/withdraw actions.
- `/my-locks` — dashboard of the connected wallet's own locks.

## Setup

```
npm install
cp .env.example .env.local   # fill in the values, see comments in the file
npm run sync-abis            # after `npm test` in ../contracts, pulls in TokenLocker's ABI
npm run dev
```

`NEXT_PUBLIC_TOKEN_LOCKER_ADDRESS_TESTNET` (or `_MAINNET`) must point at a deployed `TokenLocker`
(see `../contracts/README.md`) for the matching network, or the create/proof/my-locks pages will
show a "not configured" message instead of working. Testnet (chain 5042002) is usable today;
mainnet (chain 5042) launches September 16, 2026.
