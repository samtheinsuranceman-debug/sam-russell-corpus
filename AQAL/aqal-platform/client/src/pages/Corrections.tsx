// ============================================================
// CORRECTIONS — the asymmetric error-correction ledger.
// Every claim we've had to correct, publicly, with dates and
// what changed. Institutions hide their corrections; we count
// ours. The ledger IS the trust signal: a platform that shows
// you where it was wrong is one you can believe when it says
// it's right.
// Entries are appended, never edited or removed.
// ============================================================
import { Link } from "wouter";
import { PublicHeader, PublicFooter } from "@/components/PublicLayout";

const INK = "#141009";
const CREAM = "#F1EADB";
const CREAM2 = "#CFC5B0";
const MUTED = "#9C8F79";
const CHAMPAGNE = "#E0C68C";
const JADE = "#8FBC9F";
const EMBER = "#D08B6C";
const LINE_C = "rgba(241,234,219,0.12)";
const mono = { fontFamily: "'JetBrains Mono', monospace" } as const;
const serif = { fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 } as const;

type LedgerEntry = {
  date: string;
  status: "corrected" | "under_challenge" | "sustained";
  claim: string;
  finding: string;
  action: string;
};

// Append-only. Newest first. If a challenge is resolved, its entry's status
// changes and the resolution is written into `action` — the original claim
// and finding text stay as written.
const LEDGER: LedgerEntry[] = [
  {
    date: "2026-08-22",
    status: "under_challenge",
    claim: "The 64 protocol entries added in the August 22 library expansion (ACT, ERP, Unified Protocol, Triple P, HIIT, and 59 more) cite landmark literature.",
    finding:
      "Each entry names a real, well-known study or meta-analysis (author, year, venue), but our build environment could not machine-verify DOIs, so the batch ships with citation anchors and deliberately blank DOI fields rather than invented ones.",
    action:
      "All 64 entries are queued for the same independent citation audit as the earlier batch of 20. DOIs will be filled in only from verified records; any entry whose cited finding doesn't survive the audit will be corrected or removed here, publicly.",
  },
  {
    date: "2026-08-18",
    status: "corrected",
    claim: "“7,000 research-backed prescriptions.”",
    finding:
      "We counted. The prescription library resolves to 6,521 distinct intervention clusters drawn from 12,341 source links. 7,000 was a rounded-up estimate that the actual count doesn't support.",
    action:
      "Every “7,000” on the platform now reads “6,500+.” The “10,000+ sources” claim was audited in the same pass and stands (12,341 counted).",
  },
  {
    date: "2026-08-17",
    status: "corrected",
    claim: "“The 32 lines collapse to roughly 6.5 effective dimensions.” — stated as a point estimate.",
    finding:
      "6.5 is the conservative floor from the correlation evidence we can currently defend, not a measured value. Presenting a floor as a point estimate overstates precision.",
    action:
      "Restated everywhere as “at least ~6.5 effective dimensions” — a floor, expected to rise toward ~10 as the independent-lines citation audit completes.",
  },
  {
    date: "2026-08-17",
    status: "under_challenge",
    claim: "The 20 newest therapy-to-line protocol entries (closing the last 11 uncovered lines) cite landmark literature.",
    finding:
      "The papers are real and landmark, but our build environment could not machine-verify each DOI at doi.org. Until every DOI is independently verified, these entries carry evidence we haven't finished checking.",
    action:
      "All 20 entries are marked pending the external citation audit; five lines (Aesthetic, Seduction, Philosophical, Intuitive, Architectural) are labeled “thin evidence” on the platform itself until the audit closes.",
  },
  {
    date: "2026-08-16",
    status: "corrected",
    claim: "Internal deploy documentation: “pnpm db:push safely applies schema changes.”",
    finding:
      "The script behind that command was aliased to a migration replay, not a schema diff — a deployment partner caught it before it could corrupt a production migration journal. Wrong claim, real risk, caught by review.",
    action:
      "The script now runs a true schema diff (drizzle-kit push); migration replay moved to a separately named command. The partner's other two findings were verified and also fixed.",
  },
  {
    date: "2026-08-15",
    status: "sustained",
    claim: "“IQ tests sample only ~4 of the 32 intelligence lines.”",
    finding:
      "Challenged internally as possibly too aggressive. Re-checked against the composition of major IQ batteries (WAIS-IV, Stanford-Binet 5): their index scores map to roughly four of our 32 lines (analytical, verbal, spatial/working-memory, processing-speed clusters).",
    action: "Claim sustained as stated. The supporting mapping is published in the Sixteen Axes section.",
  },
];

const STATUS_META: Record<LedgerEntry["status"], { label: string; color: string }> = {
  corrected: { label: "CORRECTED", color: EMBER },
  under_challenge: { label: "UNDER CHALLENGE", color: CHAMPAGNE },
  sustained: { label: "CHALLENGED · SUSTAINED", color: JADE },
};

export default function Corrections() {
  const counts = {
    total: LEDGER.length,
    corrected: LEDGER.filter((e) => e.status === "corrected").length,
    open: LEDGER.filter((e) => e.status === "under_challenge").length,
  };
  return (
    <div className="min-h-screen" style={{ background: INK }}>
      <PublicHeader />
      <div className="max-w-[760px] mx-auto px-6 py-16">
        <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.26em", textTransform: "uppercase", color: CHAMPAGNE, marginBottom: "12px" }}>
          The Corrections Ledger · append-only
        </p>
        <h1 style={{ ...serif, fontSize: "clamp(30px,5vw,46px)", color: CREAM, margin: "0 0 10px" }}>
          Where we were wrong.
        </h1>
        <p style={{ color: CREAM2, fontSize: "14.5px", lineHeight: 1.7, marginBottom: "8px" }}>
          Every claim on this platform is challengeable, and this page is what happens to the challenges. Entries are
          added, never deleted. A measurement company that hides its corrections is asking for faith; we'd rather show
          you the trail.
        </p>
        <p style={{ ...mono, fontSize: "11px", color: MUTED, marginBottom: "28px" }}>
          {counts.total} challenges logged · {counts.corrected} corrected · {counts.open} open
        </p>

        <div className="space-y-3">
          {LEDGER.map((e, i) => {
            const meta = STATUS_META[e.status];
            return (
              <div key={i} className="rounded-xl border p-5" style={{ borderColor: LINE_C, background: "rgba(241,234,219,0.02)" }}>
                <div className="flex items-baseline justify-between gap-3 flex-wrap mb-2">
                  <span style={{ ...mono, fontSize: "10px", letterSpacing: "0.18em", color: meta.color }}>{meta.label}</span>
                  <span style={{ ...mono, fontSize: "10px", color: MUTED }}>{e.date}</span>
                </div>
                <p style={{ ...serif, fontSize: "18px", color: CREAM, margin: "0 0 8px" }}>{e.claim}</p>
                <p style={{ fontSize: "13.5px", lineHeight: 1.7, color: CREAM2, margin: "0 0 8px" }}>{e.finding}</p>
                <p style={{ fontSize: "13.5px", lineHeight: 1.7, color: CREAM2, margin: 0 }}>
                  <b style={{ color: meta.color }}>What changed:</b> {e.action}
                </p>
              </div>
            );
          })}
        </div>

        <div className="rounded-xl border p-5 mt-8" style={{ borderColor: `${CHAMPAGNE}33`, background: "rgba(224,198,140,0.04)" }}>
          <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: CHAMPAGNE, marginBottom: "8px" }}>
            Challenge a claim
          </p>
          <p style={{ fontSize: "13.5px", lineHeight: 1.7, color: CREAM2, margin: 0 }}>
            Found a number, citation, or statement you think is wrong? Send it through the <b style={{ color: CREAM }}>? Support</b>{" "}
            button — it goes straight to Sam. Every serious challenge gets investigated, and the outcome lands on this
            page whichever way it goes. External research audits currently in progress (independent citation
            verification of the therapy library) will post their results here too.
          </p>
        </div>

        <p style={{ ...mono, fontSize: "10.5px", color: MUTED, marginTop: "24px" }}>
          Related: <Link href="/science" style={{ color: CHAMPAGNE }}>the science</Link> ·{" "}
          <Link href="/evidence" style={{ color: CHAMPAGNE }}>the evidence</Link> ·{" "}
          <Link href="/sample-report" style={{ color: CHAMPAGNE }}>a sample report</Link>
        </p>
      </div>
      <PublicFooter />
    </div>
  );
}
