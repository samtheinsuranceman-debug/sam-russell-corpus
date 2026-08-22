// ============================================================
// MYTHS INDEX — /myths — the Myth Museum's collection wall:
// every documented failed therapy, filterable by verdict.
// ============================================================
import { useState } from "react";
import { Link } from "wouter";
import { PublicHeader, PublicFooter } from "@/components/PublicLayout";
import { MYTHS, MYTH_VERDICT_META, type MythVerdict } from "@/lib/mythMuseum";
import { WING_PROFILES } from "@/lib/mythWings";

const INK = "#141009";
const CREAM = "#F1EADB";
const CREAM2 = "#CFC5B0";
const MUTED = "#9C8F79";
const CHAMPAGNE = "#E0C68C";
const LINE_C = "rgba(241,234,219,0.12)";
const mono = { fontFamily: "'JetBrains Mono', monospace" } as const;
const serif = { fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 } as const;

const VERDICTS = Object.keys(MYTH_VERDICT_META) as MythVerdict[];

export default function Myths() {
  const [filter, setFilter] = useState<MythVerdict | null>(null);
  const shown = filter ? MYTHS.filter((m) => m.verdict === filter) : MYTHS;
  return (
    <div className="min-h-screen" style={{ background: INK }}>
      <PublicHeader />
      <div className="max-w-[900px] mx-auto px-6 py-16">
        <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.26em", textTransform: "uppercase", color: CHAMPAGNE, marginBottom: "12px" }}>
          The Myth Museum · {MYTHS.length} documented exhibits · every verdict sourced
        </p>
        <h1 style={{ ...serif, fontSize: "clamp(30px,5vw,48px)", color: CREAM, margin: "0 0 10px" }}>
          The therapies that failed.
        </h1>
        <p style={{ color: CREAM2, fontSize: "14.5px", lineHeight: 1.7, marginBottom: "8px" }}>
          A platform that sells honest measurement owes you its debunking shelf. Each exhibit: the claim, the sourced
          verdict, why smart people bought it anyway, and what holds up instead. The cultural story behind the whole
          collection: <Link href="/why-we-fall" style={{ color: CHAMPAGNE }}>Why We Fall for It</Link>.
        </p>
        <p style={{ ...mono, fontSize: "10.5px", color: MUTED, marginBottom: "26px" }}>
          entries never contradict our own cited library · challenge any exhibit via the Corrections Ledger
        </p>

        <div className="rounded-xl border p-4 mb-6" style={{ borderColor: LINE_C, background: "rgba(241,234,219,0.02)" }}>
          <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: CHAMPAGNE, marginBottom: "8px" }}>
            Walk the museum by wing — each family's full anatomy on its own page
          </p>
          <div className="flex gap-1.5 flex-wrap">
            {Object.entries(WING_PROFILES).map(([id, w]) => (
              <Link key={id} href={`/wing/${id}`}
                style={{ ...mono, fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", padding: "6px 11px", borderRadius: "999px", color: CREAM2, border: `1px solid ${LINE_C}` }}>
                {w.label.split(" — ")[0]}
              </Link>
            ))}
          </div>
          <p style={{ ...mono, fontSize: "10px", color: MUTED, margin: "10px 0 0" }}>
            or by verdict:{" "}
            {(["debunked","no-evidence","harmful","replication-failed","overclaimed"] as const).map((v, i) => (
              <span key={v}>{i > 0 && " · "}<Link href={`/verdict/${v}`} style={{ color: CHAMPAGNE }}>{v.replace(/-/g, " ")}</Link></span>
            ))}
          </p>
        </div>

        <div className="flex gap-1.5 flex-wrap mb-8">
          <button onClick={() => setFilter(null)}
            style={{ ...mono, fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", padding: "7px 12px", borderRadius: "999px", cursor: "pointer",
              color: !filter ? INK : CREAM2, background: !filter ? CHAMPAGNE : "transparent", border: `1px solid ${!filter ? CHAMPAGNE : LINE_C}` }}>
            all {MYTHS.length}
          </button>
          {VERDICTS.map((v) => (
            <button key={v} onClick={() => setFilter(filter === v ? null : v)}
              style={{ ...mono, fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", padding: "7px 12px", borderRadius: "999px", cursor: "pointer",
                color: filter === v ? INK : MYTH_VERDICT_META[v].color, background: filter === v ? MYTH_VERDICT_META[v].color : "transparent", border: `1px solid ${MYTH_VERDICT_META[v].color}66` }}>
              {v} · {MYTHS.filter((m) => m.verdict === v).length}
            </button>
          ))}
        </div>

        <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))" }}>
          {shown.map((m) => (
            <Link key={m.id} href={`/myth/${m.id}`} className="rounded-xl p-4 block"
              style={{ border: `1px solid ${LINE_C}`, borderLeft: `3px solid ${MYTH_VERDICT_META[m.verdict].color}`, background: "rgba(241,234,219,0.02)", textDecoration: "none" }}>
              <span style={{ ...serif, fontSize: "16.5px", color: CREAM, display: "block", marginBottom: "4px" }}>{m.name}</span>
              <span style={{ ...mono, fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", color: MYTH_VERDICT_META[m.verdict].color }}>
                {m.verdict}
              </span>
            </Link>
          ))}
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
