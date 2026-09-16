"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export function Header() {
  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px",
        maxWidth: 1000,
        margin: "0 auto",
      }}
    >
      <nav style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <Link href="/" style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", textDecoration: "none" }}>
          Arc<span style={{ color: "var(--accent)" }}>Lock</span>
        </Link>
        <Link href="/lock/create" style={{ fontSize: 14, color: "var(--text-dim)", textDecoration: "none" }}>
          Lock tokens
        </Link>
        <Link href="/my-locks" style={{ fontSize: 14, color: "var(--text-dim)", textDecoration: "none" }}>
          My locks
        </Link>
      </nav>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <XLink />
        <ConnectButton />
      </div>
    </header>
  );
}

// Renders nothing until NEXT_PUBLIC_X_URL is set — see CaBox.tsx for the same pattern/reasoning.
function XLink() {
  const url = process.env.NEXT_PUBLIC_X_URL;
  if (!url) return null;
  return (
    <a href={url} target="_blank" rel="noreferrer" aria-label="Follow on X" style={{ color: "var(--text-dim)", display: "flex" }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.9 2H22l-7.6 8.7L23.3 22H16.8l-5.1-6.7L5.8 22H2.6l8.1-9.3L2 2h6.7l4.6 6.1L18.9 2Zm-1.1 18.1h1.7L7.3 3.8H5.5l12.3 16.3Z" />
      </svg>
    </a>
  );
}
