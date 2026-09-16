import Link from "next/link";
import { CaBox } from "./components/CaBox";

export default function HomePage() {
  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "48px 16px 24px" }}>
      <section style={{ marginBottom: 56 }}>
        <CaBox />
        <h1 style={{ fontSize: 48, lineHeight: 1.15, margin: "0 0 16px", fontWeight: 800 }}>
          Instantly <em style={{ color: "var(--accent)", fontStyle: "italic" }}>on-chain trust.</em>
        </h1>
        <p style={{ fontSize: 16, color: "var(--text-dim)", maxWidth: 560, margin: "0 0 28px" }}>
          Lock any ERC-20 token supply on Arc chain until a date you set. No dumping before then —
          provably, on-chain, for anyone to check.
        </p>
        <Link
          href="/lock/create"
          style={{
            display: "inline-block",
            padding: "12px 24px",
            borderRadius: 8,
            background: "var(--accent)",
            color: "var(--accent-text)",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Lock your tokens
        </Link>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
        <StepCard
          step="01"
          title="Connect & choose"
          body="Connect your wallet, paste any token contract on Arc chain, set the amount."
        />
        <StepCard step="02" title="Set the unlock date" body="Pick a date or a preset, 7 days to 1 year. Extend-only: dates move later, never earlier." />
        <StepCard
          step="03"
          title="Share the proof"
          body="A public proof page, verifiable on Arc Scan. Post the link and let the contract do the talking."
        />
      </section>

      <section style={{ marginTop: 56, display: "flex", flexDirection: "column", gap: 8 }}>
        <h2 style={{ fontSize: 18, margin: "0 0 4px" }}>Why this matters</h2>
        <p style={{ fontSize: 14, color: "var(--text-dim)", maxWidth: 640, margin: 0 }}>
          Locked tokens sit in an escrow contract that has no admin backdoor — not even the
          contract owner can move or withdraw a lock. Once it's locked, it's locked until the
          unlock time, full stop.
        </p>
      </section>
    </main>
  );
}

function StepCard({ step, title, body }: { step: string; title: string; body: string }) {
  return (
    <div style={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 12, padding: 24, position: "relative", overflow: "hidden" }}>
      <span
        style={{
          position: "absolute",
          top: 8,
          right: 16,
          fontSize: 64,
          fontWeight: 800,
          color: "var(--panel-2)",
          lineHeight: 1,
        }}
      >
        {step.replace(/^0/, "")}
      </span>
      <div style={{ fontSize: 12, color: "var(--accent)", fontFamily: "var(--mono)", letterSpacing: 1, marginBottom: 16 }}>
        STEP / {step}
      </div>
      <h3 style={{ margin: "0 0 8px", fontSize: 17 }}>{title}</h3>
      <p style={{ margin: 0, fontSize: 14, color: "var(--text-dim)" }}>{body}</p>
    </div>
  );
}
