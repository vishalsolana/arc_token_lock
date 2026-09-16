"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useReadContracts, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { decodeEventLog, isAddress, maxUint256, parseUnits, formatUnits } from "viem";
import { TOKEN_LOCKER_ADDRESS, TokenLockerAbi } from "@/lib/contracts";
import { Erc20Abi } from "@/lib/erc20";
import { arcMainnet } from "@/lib/chains";
import { addRecentToken, getRecentTokens, type RecentToken } from "@/lib/recentTokens";
import { toDateValue, endOfDayTimestamp } from "@/lib/dates";

const PERCENT_OPTIONS = [25, 50, 100];

const DAY = 24 * 60 * 60;
const PRESETS = [
  { label: "7 days", seconds: 7 * DAY },
  { label: "30 days", seconds: 30 * DAY },
  { label: "90 days", seconds: 90 * DAY },
  { label: "180 days", seconds: 180 * DAY },
  { label: "1 year", seconds: 365 * DAY },
];

export default function CreateLockPage() {
  const router = useRouter();
  const { address: account, isConnected, chainId } = useAccount();
  const effectiveChainId = chainId ?? arcMainnet.id;
  const lockerAddress = TOKEN_LOCKER_ADDRESS[effectiveChainId];

  const [tokenAddress, setTokenAddress] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [unlockDate, setUnlockDate] = useState("");
  const [recentTokens, setRecentTokens] = useState<RecentToken[]>([]);

  useEffect(() => {
    setRecentTokens(getRecentTokens(effectiveChainId));
  }, [effectiveChainId]);

  const isValidToken = isAddress(tokenAddress);

  const { data: tokenData, isLoading: isLoadingToken } = useReadContracts({
    contracts: isValidToken
      ? [
          { address: tokenAddress as `0x${string}`, abi: Erc20Abi, functionName: "name" },
          { address: tokenAddress as `0x${string}`, abi: Erc20Abi, functionName: "symbol" },
          { address: tokenAddress as `0x${string}`, abi: Erc20Abi, functionName: "decimals" },
          { address: tokenAddress as `0x${string}`, abi: Erc20Abi, functionName: "balanceOf", args: account ? [account] : undefined },
        ]
      : [],
    query: { enabled: isValidToken },
  });

  const [name, symbol, decimals, balance] = (tokenData?.map((r) => r.result) ?? []) as [
    string?,
    string?,
    number?,
    bigint?,
  ];
  const tokenFound = isValidToken && !isLoadingToken && symbol !== undefined;

  const parsedAmount = useMemo(() => {
    if (!amountInput || decimals === undefined) return 0n;
    try {
      return parseUnits(amountInput, decimals);
    } catch {
      return 0n;
    }
  }, [amountInput, decimals]);

  const unlockTimestamp = unlockDate ? endOfDayTimestamp(unlockDate) : 0;
  const isFutureUnlock = unlockTimestamp > Math.floor(Date.now() / 1000);

  const { data: allowance, refetch: refetchAllowance } = useReadContracts({
    contracts:
      isValidToken && account && lockerAddress
        ? [{ address: tokenAddress as `0x${string}`, abi: Erc20Abi, functionName: "allowance", args: [account, lockerAddress] }]
        : [],
    query: { enabled: Boolean(isValidToken && account && lockerAddress) },
  });
  const currentAllowance = (allowance?.[0]?.result as bigint | undefined) ?? 0n;
  const needsApproval = parsedAmount > 0n && currentAllowance < parsedAmount;

  const { writeContract: approve, data: approveHash, isPending: isApproving } = useWriteContract();
  const { isLoading: isApprovingConfirm, isSuccess: approveSucceeded } = useWaitForTransactionReceipt({
    hash: approveHash,
    query: { enabled: Boolean(approveHash) },
  });

  useEffect(() => {
    if (approveSucceeded) refetchAllowance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approveSucceeded]);

  const { writeContract: lock, data: lockHash, isPending: isLocking, error: lockError } = useWriteContract();
  const { data: receipt, isLoading: isLockConfirming, isSuccess: lockConfirmed } = useWaitForTransactionReceipt({
    hash: lockHash,
    query: { enabled: Boolean(lockHash) },
  });

  useEffect(() => {
    if (!receipt) return;
    for (const log of receipt.logs) {
      try {
        const decoded = decodeEventLog({ abi: TokenLockerAbi, data: log.data, topics: log.topics });
        if (decoded.eventName === "Locked") {
          const lockId = (decoded.args as unknown as { lockId: bigint }).lockId;
          if (symbol) addRecentToken(effectiveChainId, { address: tokenAddress as `0x${string}`, symbol });
          router.push(`/lock/${lockId.toString()}`);
          return;
        }
      } catch {
        // not the event we're looking for
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receipt, router]);

  async function handleAddToWallet() {
    if (!tokenFound || typeof window === "undefined" || !window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_watchAsset",
        params: { type: "ERC20", options: { address: tokenAddress, symbol: symbol?.slice(0, 11), decimals: decimals ?? 18 } },
      });
    } catch {
      // user declined or wallet doesn't support it — not worth surfacing an error for
    }
  }

  const canSubmit =
    isConnected && Boolean(lockerAddress) && tokenFound && parsedAmount > 0n && (balance ?? 0n) >= parsedAmount && isFutureUnlock;

  function handleApprove() {
    if (!lockerAddress) return;
    approve({ address: tokenAddress as `0x${string}`, abi: Erc20Abi, functionName: "approve", args: [lockerAddress, maxUint256] });
  }

  function handleLock() {
    if (!lockerAddress) return;
    lock({
      address: lockerAddress,
      abi: TokenLockerAbi,
      functionName: "lock",
      args: [tokenAddress as `0x${string}`, parsedAmount, BigInt(unlockTimestamp)],
    });
  }

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "0 16px 40px" }}>
      <h2 style={{ fontSize: 20, marginBottom: 4 }}>Lock tokens</h2>
      <p style={{ fontSize: 13, color: "var(--text-dim)", marginTop: 0, marginBottom: 24 }}>
        Escrows a fixed supply until the date you choose. The date can only be pushed later, never
        earlier.
      </p>

      {!lockerAddress && (
        <Banner>
          No TokenLocker address configured for this network. Set
          NEXT_PUBLIC_TOKEN_LOCKER_ADDRESS_TESTNET (or _MAINNET) after deploying (see
          contracts/README.md).
        </Banner>
      )}

      <div style={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 12, padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <label>Token contract address</label>
          {recentTokens.length > 0 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
              {recentTokens.map((t) => (
                <button
                  key={t.address}
                  type="button"
                  onClick={() => setTokenAddress(t.address)}
                  style={{
                    padding: "5px 10px",
                    borderRadius: 999,
                    border: "1px solid var(--border)",
                    background: t.address.toLowerCase() === tokenAddress.toLowerCase() ? "var(--accent)" : "var(--panel-2)",
                    color: t.address.toLowerCase() === tokenAddress.toLowerCase() ? "var(--accent-text)" : "var(--text)",
                    fontSize: 12,
                  }}
                  title={t.address}
                >
                  {t.symbol}
                </button>
              ))}
            </div>
          )}
          <input value={tokenAddress} onChange={(e) => setTokenAddress(e.target.value.trim())} placeholder="0x..." />
          {tokenAddress && !isValidToken && <Hint danger>Not a valid address.</Hint>}
          {isValidToken && isLoadingToken && <Hint>Reading token…</Hint>}
          {isValidToken && !isLoadingToken && !tokenFound && (
            <Hint danger>Couldn't read this as an ERC-20 — check the address and network.</Hint>
          )}
          {tokenFound && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: 12, color: "var(--text-dim)" }}>
                {name} ({symbol}) — your balance: {formatUnits(balance ?? 0n, decimals ?? 18)}
              </span>
              <button
                type="button"
                onClick={handleAddToWallet}
                style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, border: "1px solid var(--border)", background: "none", color: "var(--text-dim)" }}
              >
                + Add to wallet
              </button>
            </div>
          )}
        </div>

        <div>
          <label>Amount to lock</label>
          {tokenFound && (
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              {PERCENT_OPTIONS.map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setAmountInput(formatUnits(((balance ?? 0n) * BigInt(pct)) / 100n, decimals ?? 18))}
                  style={{ padding: "5px 12px", borderRadius: 999, border: "1px solid var(--border)", background: "var(--panel-2)", color: "var(--text)", fontSize: 12 }}
                >
                  {pct === 100 ? "Max" : `${pct}%`}
                </button>
              ))}
            </div>
          )}
          <input value={amountInput} onChange={(e) => setAmountInput(e.target.value)} placeholder="0.0" disabled={!tokenFound} />
          {tokenFound && parsedAmount > 0n && (balance ?? 0n) < parsedAmount && <Hint danger>Exceeds your balance.</Hint>}
        </div>

        <div>
          <label>Unlock date</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setUnlockDate(toDateValue(new Date(Date.now() + p.seconds * 1000)))}
                style={{
                  padding: "6px 12px",
                  borderRadius: 999,
                  border: "1px solid var(--border)",
                  background: "var(--panel-2)",
                  color: "var(--text)",
                  fontSize: 13,
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
          <input type="date" value={unlockDate} min={toDateValue(new Date())} onChange={(e) => setUnlockDate(e.target.value)} />
          <Hint>Locks through the end of the day you pick (23:59:59 your local time).</Hint>
          {unlockDate && !isFutureUnlock && <Hint danger>Unlock date must be in the future.</Hint>}
        </div>

        {lockConfirmed && (
          <div style={{ background: "#12251a", border: "1px solid #235a34", borderRadius: 8, padding: 12, fontSize: 13 }}>
            ✓ Tokens locked. Opening your lock's proof page… if it doesn't redirect,{" "}
            <a href="/my-locks" style={{ color: "var(--accent)" }}>
              view it in My locks
            </a>
            .
          </div>
        )}

        {!isConnected ? (
          <p style={{ fontSize: 13, color: "var(--text-dim)" }}>Connect your wallet to lock tokens.</p>
        ) : needsApproval ? (
          <button
            onClick={handleApprove}
            disabled={isApproving || isApprovingConfirm}
            style={buttonStyle("var(--panel-2)", "var(--text)")}
          >
            {isApproving || isApprovingConfirm ? "Approving…" : `Approve ${symbol ?? "token"}`}
          </button>
        ) : (
          <button
            onClick={handleLock}
            disabled={!canSubmit || isLocking || isLockConfirming || lockConfirmed}
            style={buttonStyle("var(--accent)", "var(--accent-text)")}
          >
            {isLocking || isLockConfirming ? "Locking…" : lockConfirmed ? "Locked ✓" : "Lock tokens"}
          </button>
        )}

        {lockError && <Hint danger>{lockError.message}</Hint>}
      </div>
    </main>
  );
}

function buttonStyle(background: string, color: string): React.CSSProperties {
  return { width: "100%", padding: "12px 0", borderRadius: 8, border: "none", background, color, fontWeight: 600 };
}

function Banner({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "#2a1f1f", border: "1px solid #5a2a2a", borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13 }}>
      {children}
    </div>
  );
}

function Hint({ children, danger }: { children: React.ReactNode; danger?: boolean }) {
  return <p style={{ fontSize: 12, color: danger ? "var(--danger)" : "var(--text-dim)", marginTop: 4 }}>{children}</p>;
}
