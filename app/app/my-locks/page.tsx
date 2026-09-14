"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAccount, useReadContract, useReadContracts } from "wagmi";
import { formatUnits } from "viem";
import { TOKEN_LOCKER_ADDRESS, TokenLockerAbi, type Lock } from "@/lib/contracts";
import { Erc20Abi } from "@/lib/erc20";
import { arcMainnet } from "@/lib/chains";

export default function MyLocksPage() {
  const { address: account, isConnected, chainId } = useAccount();
  const lockerAddress = TOKEN_LOCKER_ADDRESS[chainId ?? arcMainnet.id];

  const { data: lockIds, isLoading: isLoadingIds } = useReadContract({
    address: lockerAddress,
    abi: TokenLockerAbi,
    functionName: "locksByOwner",
    args: account ? [account] : undefined,
    query: { enabled: Boolean(lockerAddress && account), refetchInterval: 10000 },
  });

  const ids = (lockIds as bigint[] | undefined) ?? [];

  const { data: lockData, isLoading: isLoadingLocks } = useReadContracts({
    contracts: ids.map((id) => ({ address: lockerAddress, abi: TokenLockerAbi, functionName: "getLock", args: [id] })),
    query: { enabled: ids.length > 0 && Boolean(lockerAddress) },
  });

  const locks = useMemo(
    () => ids.map((id, i) => ({ id, lock: lockData?.[i]?.result as Lock | undefined })).filter((l): l is { id: bigint; lock: Lock } => Boolean(l.lock)),
    [ids, lockData]
  );

  const uniqueTokens = useMemo(() => Array.from(new Set(locks.map((l) => l.lock.token))), [locks]);
  const { data: symbolData } = useReadContracts({
    contracts: uniqueTokens.map((t) => ({ address: t, abi: Erc20Abi, functionName: "symbol" })),
    query: { enabled: uniqueTokens.length > 0 },
  });
  const { data: decimalsData } = useReadContracts({
    contracts: uniqueTokens.map((t) => ({ address: t, abi: Erc20Abi, functionName: "decimals" })),
    query: { enabled: uniqueTokens.length > 0 },
  });
  const symbolOf = (token: string) => symbolData?.[uniqueTokens.indexOf(token as `0x${string}`)]?.result as string | undefined;
  const decimalsOf = (token: string) => (decimalsData?.[uniqueTokens.indexOf(token as `0x${string}`)]?.result as number | undefined) ?? 18;

  if (!isConnected) {
    return <Main>Connect your wallet to see your locks.</Main>;
  }
  if (!lockerAddress) {
    return <Main>No TokenLocker address configured for this network.</Main>;
  }

  return (
    <Main>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, margin: 0 }}>My locks</h2>
        <Link href="/lock/create" style={{ fontSize: 13 }}>
          + New lock
        </Link>
      </div>

      {(isLoadingIds || isLoadingLocks) && <p style={{ color: "var(--text-dim)", fontSize: 13 }}>Loading…</p>}
      {!isLoadingIds && ids.length === 0 && <p style={{ color: "var(--text-dim)", fontSize: 13 }}>No locks yet.</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {locks.map(({ id, lock }) => {
          const unlockDate = new Date(Number(lock.unlockTime) * 1000);
          const isUnlocked = Date.now() >= unlockDate.getTime();
          const status = lock.withdrawn ? "Withdrawn" : isUnlocked ? "Unlocked" : "Locked";
          return (
            <Link
              key={id.toString()}
              href={`/lock/${id.toString()}`}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "var(--panel)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: "14px 18px",
                textDecoration: "none",
                color: "var(--text)",
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  {formatUnits(lock.amount, decimalsOf(lock.token))} {symbolOf(lock.token) ?? "…"}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-dim)" }}>Unlocks {unlockDate.toLocaleDateString()}</div>
              </div>
              <span style={{ fontSize: 12, color: status === "Locked" ? "#f5c26b" : "var(--accent)" }}>{status}</span>
            </Link>
          );
        })}
      </div>
    </Main>
  );
}

function Main({ children }: { children: React.ReactNode }) {
  return <main style={{ maxWidth: 640, margin: "0 auto", padding: "24px 16px 40px" }}>{children}</main>;
}
