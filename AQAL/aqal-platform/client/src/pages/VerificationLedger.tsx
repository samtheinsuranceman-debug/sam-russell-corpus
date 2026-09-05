import { Link } from "wouter";
import { motion } from "framer-motion";
import { ShieldCheck, XCircle, Link2, BookOpen, ExternalLink, ArrowRight } from "lucide-react";
import { PublicHeader, PublicFooter } from "@/components/PublicLayout";
import { LEDGER_STATS } from "./ResearchLibrary";

// ============================================================
// The Verification Ledger — the "0 fabricated" moat, made visible
// ============================================================
// Every consumer assessment gestures at "decades of research" and shows you
// nothing. This page does the opposite: it publishes the exact counts, the
// method that produced them, and — the part nobody else can show — the sources
// we THREW OUT because they failed verification. The rejected pile is the proof
// the accepted pile is clean.

// Last time the full library was audited against the verification gate.
// Update this date whenever a research pass is run and re-verified.
const AUDIT_DATE = "July 13, 2026";

// Real rejections from the verification passes (see RESEARCH_PIPELINE.md).
// These are not hypotheticals — each one was proposed by a research pass and
// caught by the gate before it could enter the library.
const REJECTED = [
  {
    what: "A DOI that resolved to the wrong paper",
    detail: "A centrality critique came back with a DOI (10.1037/abn0000266) that pointed to a different article than the one cited. We kept the verified one (…276) and dropped the mismatch.",
  },
  {
    what: "A psychology claim backed by an ecology paper",
    detail: "A 'Liebig's Law' citation was actually Tang & Riley in Ecological Applications — a real paper, wrong domain. Real ≠ relevant. Skipped.",
  },
  {
    what: "Volume / year / DOI that didn't agree",
    detail: "A 2021 methods paper's volume, year, and DOI contradicted each other across sources. When the metadata won't reconcile, it doesn't go in.",
  },
  {
    what: "Predatory and non-citable 'sources'",
    detail: "Substack posts, Wikipedia, lecture-note PDFs, consulting-firm blogs, and placeholder tags were all proposed as citations. None are peer-reviewed. All rejected.",
  },
  {
    what: "A journal label that didn't match the article",
    detail: "An eNeuro paper was returned mislabeled as the Journal of Experimental Psychology. Incomplete and inconsistent — left out rather than guessed.",
  },
];

function Stat({
  value,
  label,
  sub,
  accent = false,
  icon: Icon,
}: {
  value: string | number;
  label: string;
  sub?: string;
  accent?: boolean;
  icon?: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}) {
  return (
    <div
      className="rounded-2xl border px-6 py-7 text-center"
      style={{
        borderColor: accent ? "oklch(0.78 0.12 85 / 0.35)" : "rgba(241,234,219,0.12)",
        background: accent ? "oklch(0.78 0.12 85 / 0.06)" : "rgba(20,16,9,0.4)",
      }}
    >
      {Icon ? (
        <Icon className="w-5 h-5 mx-auto mb-3" style={{ color: accent ? "oklch(0.82 0.13 85)" : "#867A66" } as any} />
      ) : null}
      <div
        className="text-4xl sm:text-5xl font-bold"
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          color: accent ? "oklch(0.82 0.13 85)" : "#F1EADB",
        }}
      >
        {value}
      </div>
      <div className="text-xs uppercase tracking-[0.15em] mt-2" style={{ color: "#C4B89F" }}>
        {label}
      </div>
      {sub ? (
        <div className="text-[0.7rem] mt-1.5" style={{ color: "#867A66" }}>
          {sub}
        </div>
      ) : null}
    </div>
  );
}

export default function VerificationLedger() {
  const s = LEDGER_STATS;
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="gradient-mesh" />
      <PublicHeader />

      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-28 pb-24">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground/50 mb-5"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            <ShieldCheck className="w-4 h-4" /> Verification Ledger
          </div>
          <h1
            className="text-4xl sm:text-6xl font-bold mb-5"
            style={{ fontFamily: "'Cormorant Garamond', serif", color: "#F1EADB" }}
          >
            Every source. Checked. Published.
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            Every other assessment cites "decades of research" and shows you nothing. We show you
            the count, the method, and the sources we <span className="italic">threw out</span>.
            The rejected pile is why you can trust the rest.
          </p>
        </motion.div>

        {/* The hero number — 0 fabricated */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.15, ease: [0.23, 1, 0.32, 1] }}
          className="mt-14 rounded-3xl border text-center px-6 py-12"
          style={{ borderColor: "oklch(0.78 0.12 85 / 0.3)", background: "oklch(0.78 0.12 85 / 0.05)" }}
        >
          <div
            className="text-[6rem] sm:text-[9rem] leading-none font-bold"
            style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.82 0.13 85)" }}
          >
            {s.fabricated}
          </div>
          <div className="text-sm uppercase tracking-[0.2em] mt-1" style={{ color: "#C4B89F" }}>
            Fabricated sources
          </div>
          <p className="text-xs text-muted-foreground/50 mt-4 max-w-md mx-auto">
            Not a marketing claim — a property of the process. A source that can't be confirmed is
            never added, so the count starts and stays at zero.
          </p>
        </motion.div>

        {/* The counts */}
        <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stat value={`${s.totalSources}`} label="Total sources" sub="incl. PDF volumes" icon={BookOpen} accent />
          <Stat value={`${s.clickable}`} label="Clickable in-app" sub="each individually linked" icon={Link2} />
          <Stat value={`${s.doi}`} label="DOI-verifiable" sub="resolve to the paper" icon={ShieldCheck} />
          <Stat value={`${s.scholar}`} label="Scholar-indexed" sub="findable, no clean DOI" icon={ExternalLink} />
        </div>

        {/* How the gate works */}
        <section className="mt-20">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#F1EADB" }}>
            How a source earns its place
          </h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { n: "01", t: "Identify", d: "A research pass proposes a paper for a specific claim — a line's trainability, a bottleneck mechanism, a matching effect." },
              { n: "02", t: "Verify", d: "We confirm the DOI resolves to that exact paper, the metadata agrees with itself, the venue is peer-reviewed, and the domain actually fits the claim." },
              { n: "03", t: "Admit or reject", d: "It passes and gets linked, or it fails and is logged in the rejected pile below. Uncertainty defaults to rejection." },
            ].map((step) => (
              <div key={step.n} className="rounded-2xl border px-6 py-6" style={{ borderColor: "rgba(241,234,219,0.1)", background: "rgba(20,16,9,0.4)" }}>
                <div className="text-xs font-bold mb-3" style={{ fontFamily: "'JetBrains Mono', monospace", color: "oklch(0.78 0.12 85)" }}>{step.n}</div>
                <div className="text-lg font-semibold mb-2" style={{ color: "#F1EADB" }}>{step.t}</div>
                <p className="text-sm text-muted-foreground/70 leading-relaxed">{step.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* What we rejected — the credibility proof */}
        <section className="mt-20">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-center" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#F1EADB" }}>
            What we threw out
          </h2>
          <p className="text-center text-muted-foreground/60 text-sm max-w-xl mx-auto mb-8">
            Real rejections from real research passes. This is the part no competitor will ever show you —
            because it means admitting a source didn't make the cut.
          </p>
          <div className="space-y-3">
            {REJECTED.map((r, i) => (
              <div key={i} className="flex gap-4 rounded-xl border px-5 py-4" style={{ borderColor: "rgba(209,154,114,0.18)", background: "rgba(20,16,9,0.35)" }}>
                <XCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#D19A72" }} />
                <div>
                  <div className="text-sm font-semibold mb-1" style={{ color: "#F1EADB" }}>{r.what}</div>
                  <p className="text-sm text-muted-foreground/70 leading-relaxed">{r.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Audit line + CTA */}
        <div className="mt-16 text-center">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground/50" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            Library last audited · {AUDIT_DATE}
          </p>
          <Link href="/research-library">
            <span className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-full border cursor-pointer transition-colors hover:bg-primary/5"
              style={{ borderColor: "oklch(0.78 0.12 85 / 0.35)", color: "oklch(0.82 0.13 85)" }}>
              Browse the full library <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
