"use client";

import { use, useState } from "react";
import { useAccount, useReadContract, useReadContracts, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { formatUnits } from "viem";
import { TOKEN_LOCKER_ADDRESS, TokenLockerAbi, type Lock } from "@/lib/contracts";
import { Erc20Abi } from "@/lib/erc20";
import { arcMainnet } from "@/lib/chains";

export default function LockProofPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const lockId = BigInt(id);
  const { address: account, chainId } = useAccount();
  const lockerAddress = TOKEN_LOCKER_ADDRESS[chainId ?? arcMainnet.id];

  const { data: lock, isLoading, refetch } = useReadContract({
    address: lockerAddress,
    abi: TokenLockerAbi,
    functionName: "getLock",
    args: [lockId],
    query: { enabled: Boolean(lockerAddress), refetchInterval: 10000 },
  });

  const l = lock as Lock | undefined;

  const { data: tokenData } = useReadContracts({
    contracts: l
      ? [
          { address: l.token, abi: Erc20Abi, functionName: "name" },
          { address: l.token, abi: Erc20Abi, functionName: "symbol" },
          { address: l.token, abi: Erc20Abi, functionName: "decimals" },
        ]
      : [],
    query: { enabled: Boolean(l) },
  });
  const [tokenName, tokenSymbol, tokenDecimals] = (tokenData?.map((r) => r.result) ?? []) as [string?, string?, number?];

  if (!lockerAddress) return <Main>No TokenLocker address configured for this network.</Main>;
  if (isLoading) return <Main>Loading…</Main>;
  if (!l || l.owner === "0x0000000000000000000000000000000000000000") return <Main>Lock #{id} not found.</Main>;

  const unlockDate = new Date(Number(l.unlockTime) * 1000);
  const isUnlocked = Date.now() >= unlockDate.getTime();
  const isOwner = account?.toLowerCase() === l.owner.toLowerCase();
  const explorer = arcMainnet.blockExplorers?.default.url;

  return (
    <Main>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 12, color: "var(--text-dim)", fontFamily: "var(--mono)" }}>LOCK #{id}</div>
          <h1 style={{ margin: "4px 0 0", fontSize: 24 }}>
            {formatUnits(l.amount, tokenDecimals ?? 18)} {tokenSymbol ?? "tokens"}
          </h1>
          {tokenName && <p style={{ margin: "2px 0 0", color: "var(--text-dim)", fontSize: 14 }}>{tokenName}</p>}
        </div>
        <StatusBadge withdrawn={l.withdrawn} unlocked={isUnlocked} />
      </div>

      <div style={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 12, padding: 24, display: "flex", flexDirection: "column", gap: 4 }}>
        <Row label="Token contract" value={<AddressLink address={l.token} explorer={explorer} />} />
        <Row label="Locked by" value={<AddressLink address={l.owner} explorer={explorer} />} />
        <Row label="Locked on" value={new Date(Number(l.createdAt) * 1000).toLocaleString()} />
        <Row label="Unlocks" value={unlockDate.toLocaleString()} />
        <Row label="Locker contract" value={<AddressLink address={lockerAddress} explorer={explorer} />} />
      </div>

      {explorer && (
        <p style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 12 }}>
          Verify independently on{" "}
          <a href={`${explorer}/address/${lockerAddress}`} target="_blank" rel="noreferrer">
            Arc Scan
          </a>
          .
        </p>
      )}

      {isOwner && !l.withdrawn && (
        <OwnerActions lockId={lockId} lockerAddress={lockerAddress} currentUnlockTime={l.unlockTime} isUnlocked={isUnlocked} onChanged={refetch} />
      )}
    </Main>
  );
}

function Main({ children }: { children: React.ReactNode }) {
  return <main style={{ maxWidth: 640, margin: "0 auto", padding: "24px 16px 40px" }}>{children}</main>;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
      <span style={{ color: "var(--text-dim)" }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function AddressLink({ address, explorer }: { address: string; explorer?: string }) {
  const short = `${address.slice(0, 6)}...${address.slice(-4)}`;
  if (!explorer) return <code>{short}</code>;
  return (
    <a href={`${explorer}/address/${address}`} target="_blank" rel="noreferrer">
      <code>{short}</code>
    </a>
  );
}

function StatusBadge({ withdrawn, unlocked }: { withdrawn: boolean; unlocked: boolean }) {
  const label = withdrawn ? "Withdrawn" : unlocked ? "Unlocked" : "Locked";
  const color = withdrawn ? "var(--text-dim)" : unlocked ? "var(--accent)" : "#f5c26b";
  return (
    <span style={{ fontSize: 12, fontWeight: 700, color, border: `1px solid ${color}`, borderRadius: 999, padding: "4px 12px" }}>
      {label}
    </span>
  );
}

function OwnerActions({
  lockId,
  lockerAddress,
  currentUnlockTime,
  isUnlocked,
  onChanged,
}: {
  lockId: bigint;
  lockerAddress: `0x${string}`;
  currentUnlockTime: bigint;
  isUnlocked: boolean;
  onChanged: () => void;
}) {
  const [extendDate, setExtendDate] = useState("");
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash, query: { enabled: Boolean(hash) } });

  if (isSuccess) onChanged();

  const extendTimestamp = extendDate ? Math.floor(new Date(extendDate).getTime() / 1000) : 0;
  const canExtend = extendTimestamp > Number(currentUnlockTime);

  return (
    <div style={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 12, padding: 20, marginTop: 16, display: "flex", flexDirection: "column", gap: 16 }}>
      <h3 style={{ margin: 0, fontSize: 15 }}>Manage this lock</h3>

      {isUnlocked ? (
        <button
          onClick={() => writeContract({ address: lockerAddress, abi: TokenLockerAbi, functionName: "withdraw", args: [lockId] })}
          disabled={isPending || isConfirming}
          style={{ padding: "10px 0", borderRadius: 8, border: "none", background: "var(--accent)", color: "var(--accent-text)", fontWeight: 600 }}
        >
          {isPending || isConfirming ? "Withdrawing…" : "Withdraw"}
        </button>
      ) : (
        <div>
          <label>Push unlock date later (never earlier)</label>
          <input type="datetime-local" value={extendDate} onChange={(e) => setExtendDate(e.target.value)} />
          <button
            onClick={() =>
              writeContract({ address: lockerAddress, abi: TokenLockerAbi, functionName: "extendLock", args: [lockId, BigInt(extendTimestamp)] })
            }
            disabled={!canExtend || isPending || isConfirming}
            style={{ width: "100%", marginTop: 10, padding: "10px 0", borderRadius: 8, border: "1px solid var(--border)", background: "var(--panel-2)", color: "var(--text)" }}
          >
            {isPending || isConfirming ? "Extending…" : "Extend lock"}
          </button>
        </div>
      )}

      {error && <p style={{ color: "var(--danger)", fontSize: 12, margin: 0 }}>{error.message}</p>}
    </div>
  );
}
