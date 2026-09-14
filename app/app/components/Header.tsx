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
      <ConnectButton />
    </header>
  );
}
