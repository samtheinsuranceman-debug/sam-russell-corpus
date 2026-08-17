// ============================================================
// PANEL TRUST — the three-sentence "why trust 8 AIs?" argument,
// placed at decision points. Same copy everywhere: repetition is
// how an argument becomes a fact in a reader's head.
// ============================================================
export default function PanelTrust({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`rounded-xl border ${compact ? "px-4 py-3" : "px-5 py-4"}`}
      style={{ borderColor: "rgba(155,192,178,0.3)", background: "rgba(155,192,178,0.05)" }}>
      <p className="mb-1" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9.5px", letterSpacing: "0.16em", textTransform: "uppercase", color: "#9BC0B2" }}>
        Why trust eight AIs?
      </p>
      <p style={{ fontSize: compact ? "12.5px" : "13.5px", lineHeight: 1.6, color: "#CFC5B0", margin: 0 }}>
        Eight models from eight independent labs in five countries score every answer <b style={{ color: "#F1EADB" }}>separately</b> —
        different training, different biases, uncorrelated errors. No single model&rsquo;s opinion survives; only the
        consensus does, and the disagreement between them becomes your error bars.{" "}
        <b style={{ color: "#F1EADB" }}>A panel can be wrong; it cannot be quietly wrong</b> — which is more than any
        single test, examiner, or algorithm can claim.
      </p>
    </div>
  );
}
