// ============================================================
// GOAL DETAIL — /goal/:keyword — one page per goal keyword
// carried by 2+ keystone practices (96 pages). "The evidence-
// tiered practices for focus/stress/discipline/…" — each with
// its prescription, tier, and horizon, straight from the
// keystone library.
// ============================================================
import { Link, useParams } from "wouter";
import { GoDeeper } from "@/components/DeepPage";
import { PublicHeader, PublicFooter } from "@/components/PublicLayout";
import PageVideo from "@/components/PageVideo";
import { KEYSTONE_PRACTICES } from "@shared/keystonePractices";
import { goalFromSlug, GOAL_KEYWORDS, GOAL_SUBPAGES, goalSlug, LINE_NAMES, lineSlug } from "@shared/seo";
import NotFound from "@/pages/NotFound";

const INK = "#141009";
const CREAM = "#F1EADB";
const CREAM2 = "#CFC5B0";
const MUTED = "#9C8F79";
const CHAMPAGNE = "#E0C68C";
const JADE = "#9BC0B2";
const EMBER = "#E2604A";
const LINE_C = "rgba(241,234,219,0.12)";
const mono = { fontFamily: "'JetBrains Mono', monospace" } as const;
const serif = { fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 } as const;

const EVIDENCE_COLOR: Record<string, string> = { Strong: JADE, Moderate: CHAMPAGNE, Emerging: EMBER };
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function GoalDetail() {
  const params = useParams<{ keyword: string }>();
  const kw = goalFromSlug(params.keyword ?? "");
  if (!kw) return <NotFound />;
  const practices = KEYSTONE_PRACTICES.filter((p) => (p.goalKeywords ?? []).includes(kw));
  if (practices.length < 2) return <NotFound />;
  // Order: Strong evidence first.
  const order = { Strong: 0, Moderate: 1, Emerging: 2 } as Record<string, number>;
  const sorted = [...practices].sort((a, b) => (order[a.evidence] ?? 3) - (order[b.evidence] ?? 3));
  const liftedLines = Array.from(new Set(sorted.flatMap((p) => p.lifts)))
    .map((t) => LINE_NAMES.find((n) => n.toLowerCase() === t.toLowerCase()))
    .filter(Boolean) as string[];
  const related = GOAL_KEYWORDS.filter((k) => k !== kw).slice(
    Math.max(0, GOAL_KEYWORDS.indexOf(kw) - 2), Math.max(4, GOAL_KEYWORDS.indexOf(kw) + 2)).filter((k) => k !== kw).slice(0, 4);

  return (
    <div className="min-h-screen" style={{ background: INK }}>
      <PublicHeader />
      <div className="max-w-[800px] mx-auto px-6 py-14">
        <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.26em", textTransform: "uppercase", color: CHAMPAGNE, marginBottom: "10px" }}>
          Goal-matched practices · from the keystone library
        </p>
        <h1 style={{ ...serif, fontSize: "clamp(32px,5.5vw,52px)", lineHeight: 1.05, color: CREAM, margin: "0 0 12px" }}>
          {cap(kw)}: the practices with evidence behind them.
        </h1>
        <PageVideo label="this goal" />
        <p style={{ fontSize: "15px", lineHeight: 1.7, color: CREAM2, margin: "0 0 8px" }}>
          {sorted.length} keystone practices in our library are mapped to <b style={{ color: CREAM }}>{kw}</b> — each with
          a concrete prescription, an honest evidence tier, and the time horizon before you should expect to feel it.
          No hacks, no thirty-day miracles: doses and timelines as the research actually reports them.
        </p>
        <p style={{ ...mono, fontSize: "10px", color: MUTED, marginBottom: "28px" }}>
          evidence tiers shown even when unflattering · estimates, never guarantees
        </p>

        <div className="space-y-3 mb-9">
          {sorted.map((p) => (
            <div key={p.id} className="rounded-xl p-5" style={{ border: `1px solid ${LINE_C}`, borderLeft: `3px solid ${EVIDENCE_COLOR[p.evidence] ?? MUTED}`, background: "rgba(241,234,219,0.02)" }}>
              <div className="flex items-baseline justify-between gap-3 flex-wrap mb-1">
                <p style={{ ...serif, fontSize: "19px", margin: 0 }}>
                  <Link href={`/practice/${p.id}`} style={{ color: CREAM }}>{p.name} →</Link>
                </p>
                <span style={{ ...mono, fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", color: EVIDENCE_COLOR[p.evidence] ?? MUTED }}>
                  {p.evidence} evidence · {p.horizon}
                </span>
              </div>
              <p style={{ fontSize: "13.5px", lineHeight: 1.65, color: CREAM2, margin: 0 }}>{p.prescription}</p>
            </div>
          ))}
        </div>

        {liftedLines.length > 0 && (
          <>
            <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: CHAMPAGNE, margin: "0 0 8px" }}>
              The intelligence lines doing the real work
            </p>
            <p style={{ fontSize: "14px", lineHeight: 1.7, color: CREAM2, margin: "0 0 10px" }}>
              &ldquo;{cap(kw)}&rdquo; isn&rsquo;t a thing you have — it&rsquo;s the output of specific measurable lines. These practices work
              because they build the lines underneath:
            </p>
            <div className="flex items-center gap-2 flex-wrap mb-9">
              {liftedLines.map((n) => (
                <Link key={n} href={`/line/${lineSlug(n)}`}
                  style={{ ...mono, fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", padding: "5px 10px", borderRadius: "999px", color: CHAMPAGNE, border: `1px solid ${CHAMPAGNE}55` }}>
                  {n}
                </Link>
              ))}
            </div>
          </>
        )}

        <div className="rounded-2xl p-7 mb-8 text-center" style={{ border: `1px solid ${CHAMPAGNE}44`, background: "rgba(224,198,140,0.05)" }}>
          <p style={{ ...serif, fontSize: "clamp(20px,3vw,26px)", color: CREAM, margin: "0 0 6px" }}>
            Which of these is YOUR first move?
          </p>
          <p style={{ fontSize: "14px", lineHeight: 1.65, color: CREAM2, margin: "0 0 16px" }}>
            Generic lists help; a measured profile decides. The assessment finds which line is actually gating your {kw} —
            then prescribes in order. Free for the first 10,000 founding members.
          </p>
          <Link href="/assessment" className="inline-block rounded-lg"
            style={{ ...mono, fontSize: "12px", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, padding: "15px 28px", background: CHAMPAGNE, color: INK }}>
            Measure all 32 lines
          </Link>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <span style={{ ...mono, fontSize: "9.5px", letterSpacing: "0.12em", textTransform: "uppercase", color: MUTED }}>related goals:</span>
          {related.map((k) => (
            <Link key={k} href={`/goal/${goalSlug(k)}`} style={{ ...mono, fontSize: "10.5px", color: CHAMPAGNE }}>{k}</Link>
          ))}
          <Link href="/practices" style={{ ...mono, fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: MUTED }}>all 54 practices</Link>
        </div>
      </div>
      <GoDeeper base={`/goal/${params.keyword}`} subs={GOAL_SUBPAGES} labels={{ plan: "The 30-day plan", mistakes: "The mistakes" }} />
      <PublicFooter />
    </div>
  );
}
