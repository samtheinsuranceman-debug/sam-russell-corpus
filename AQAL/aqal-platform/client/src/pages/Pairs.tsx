// ============================================================
// PAIRS INDEX — /pairs — the map of all 496 line combinations.
// Pick a line, see its 31 pairings; every pair links to its page.
// ============================================================
import { useState } from "react";
import { Link } from "wouter";
import { PublicHeader, PublicFooter } from "@/components/PublicLayout";
import { LINE_NAMES, pairSlug } from "@shared/seo";
import { LINE_ROLE } from "@/lib/linePairs";

const INK = "#141009";
const CREAM = "#F1EADB";
const CREAM2 = "#CFC5B0";
const MUTED = "#9C8F79";
const CHAMPAGNE = "#E0C68C";
const LINE_C = "rgba(241,234,219,0.12)";
const mono = { fontFamily: "'JetBrains Mono', monospace" } as const;
const serif = { fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 } as const;

export default function Pairs() {
  const [sel, setSel] = useState<string>(LINE_NAMES[0]);
  const partners = LINE_NAMES.filter((n) => n !== sel);
  return (
    <div className="min-h-screen" style={{ background: INK }}>
      <PublicHeader />
      <div className="max-w-[900px] mx-auto px-6 py-16">
        <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.26em", textTransform: "uppercase", color: CHAMPAGNE, marginBottom: "12px" }}>
          Power Combinations · 496 mapped pairings
        </p>
        <h1 style={{ ...serif, fontSize: "clamp(30px,5vw,48px)", color: CREAM, margin: "0 0 10px" }}>
          Lines don&rsquo;t add. They multiply.
        </h1>
        <p style={{ color: CREAM2, fontSize: "14.5px", lineHeight: 1.7, marginBottom: "26px" }}>
          Every combination of two intelligence lines has its own chemistry — what each gives the other, what the
          multiplication unlocks, and what half-a-pair quietly costs. Pick a line to see its 31 pairings.
        </p>

        <div className="flex gap-1.5 flex-wrap mb-8">
          {LINE_NAMES.map((n) => (
            <button key={n} onClick={() => setSel(n)}
              style={{ ...mono, fontSize: "10px", letterSpacing: "0.06em", textTransform: "uppercase", padding: "7px 11px", borderRadius: "999px", cursor: "pointer",
                color: sel === n ? INK : CREAM2, background: sel === n ? CHAMPAGNE : "transparent", border: `1px solid ${sel === n ? CHAMPAGNE : LINE_C}` }}>
              {n}
            </button>
          ))}
        </div>

        <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: CHAMPAGNE, marginBottom: "10px" }}>
          {sel} — the {LINE_ROLE[sel]?.noun} — paired with…
        </p>
        <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
          {partners.map((n) => (
            <Link key={n} href={`/pair/${pairSlug(sel, n)}`} className="rounded-xl p-4 block"
              style={{ border: `1px solid ${LINE_C}`, background: "rgba(241,234,219,0.02)", textDecoration: "none" }}>
              <span style={{ ...serif, fontSize: "16px", color: CREAM, display: "block", marginBottom: "3px" }}>
                {sel} × {n}
              </span>
              <span style={{ ...mono, fontSize: "9.5px", color: MUTED }}>
                the {LINE_ROLE[sel]?.adj.toLowerCase()} {LINE_ROLE[n]?.noun.toLowerCase()}
              </span>
            </Link>
          ))}
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
