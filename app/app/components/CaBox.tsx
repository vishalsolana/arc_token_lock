"use client";

import { useState } from "react";

// Renders nothing until NEXT_PUBLIC_PROJECT_CA is actually set — no empty/placeholder box before
// there's a real token to show. Set it in Vercel's env vars once you have one; no code change or
// redeploy-by-hand needed beyond that.
export function CaBox() {
  const ca = process.env.NEXT_PUBLIC_PROJECT_CA;
  const ticker = process.env.NEXT_PUBLIC_PROJECT_TICKER;
  const [copied, setCopied] = useState(false);

  if (!ca) return null;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(ca!);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard API can be unavailable (insecure context, permissions) — not worth an error UI
    }
  }

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        background: "var(--panel)",
        border: "1px solid var(--border)",
        borderRadius: 999,
        padding: "8px 8px 8px 16px",
        marginBottom: 24,
      }}
    >
      <span style={{ fontSize: 12, color: "var(--text-dim)", fontWeight: 600 }}>{ticker ? `$${ticker} CA` : "CA"}</span>
      <code style={{ fontSize: 13, fontFamily: "var(--mono)" }}>
        {ca.slice(0, 6)}...{ca.slice(-4)}
      </code>
      <button
        type="button"
        onClick={handleCopy}
        style={{
          fontSize: 12,
          padding: "5px 12px",
          borderRadius: 999,
          border: "none",
          background: copied ? "var(--accent)" : "var(--panel-2)",
          color: copied ? "var(--accent-text)" : "var(--text)",
          fontWeight: 600,
        }}
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}
