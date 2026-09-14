import type { Abi } from "viem";
import TokenLockerAbiJson from "./abis/TokenLocker.json";
import { arcMainnet, arcTestnet } from "./chains";

// Cast from the generated JSON's widened `type: string` to viem's literal-typed Abi so it can be
// passed to wagmi hooks that expect a properly narrowed ABI (e.g. useReadContracts' tuple args).
export const TokenLockerAbi = TokenLockerAbiJson as Abi;

// Filled in after each deploy — see contracts/README.md. Left blank rather than guessed.
export const TOKEN_LOCKER_ADDRESS: Record<number, `0x${string}` | undefined> = {
  [arcTestnet.id]: process.env.NEXT_PUBLIC_TOKEN_LOCKER_ADDRESS_TESTNET as `0x${string}` | undefined,
  [arcMainnet.id]: process.env.NEXT_PUBLIC_TOKEN_LOCKER_ADDRESS_MAINNET as `0x${string}` | undefined,
};

export type Lock = {
  token: `0x${string}`;
  owner: `0x${string}`;
  amount: bigint;
  unlockTime: bigint;
  createdAt: bigint;
  withdrawn: boolean;
};
