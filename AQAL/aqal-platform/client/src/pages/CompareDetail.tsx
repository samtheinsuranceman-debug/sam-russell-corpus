// ============================================================
// COMPARE DETAIL — /compare/:a--vs--:b — one page per pair of
// protocols that are both PRIMARY on a shared line (225 pages).
// Side-by-side kinds, doses, durability; each one's capacity and
// finding on the shared line; honest "choose which, when" logic
// derived from real structural differences. Never medical advice.
// ============================================================
import { Link, useParams } from "wouter";
import { PublicHeader, PublicFooter } from "@/components/PublicLayout";
import { THERAPY_LINE_MAP } from "@shared/therapyLineMap";
import { compareFromSlug, therapySlug, therapyDisplay, engineLineSlug, LINE_NAMES, lineSlug } from "@shared/seo";
import { kindFor, KIND_PROFILES, THERAPY_KIND } from "@/lib/therapyKinds";
import NotFound from "@/pages/NotFound";

const INK = "#141009";
const CREAM = "#F1EADB";
const CREAM2 = "#CFC5B0";
const MUTED = "#9C8F79";
const CHAMPAGNE = "#E0C68C";
const JADE = "#9BC0B2";
const LINE_C = "rgba(241,234,219,0.12)";
const mono = { fontFamily: "'JetBrains Mono', monospace" } as const;
const serif = { fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 } as const;

const PRACTITIONER_KINDS = new Set(["psychotherapy", "psychedelic", "neuromodulation", "relational"]);

function Label({ children, color = CHAMPAGNE }: { children: React.ReactNode; color?: string }) {
  return <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color, margin: "0 0 8px" }}>{children}</p>;
}

export default function CompareDetail() {
  const params = useParams<{ slug: string }>();
  const pair = compareFromSlug(params.slug ?? "");
  if (!pair) return <NotFound />;
  const [a, b] = pair;
  const da = therapyDisplay(a).split(" (")[0], db = therapyDisplay(b).split(" (")[0];
  const ka = kindFor(a), kb = kindFor(b);
  const kindA = THERAPY_KIND[a] ?? "skill", kindB = THERAPY_KIND[b] ?? "skill";
  const linesA = new Set(THERAPY_LINE_MAP.filter((e) => e.therapy === a).map((e) => e.line));
  const sharedLines = Array.from(new Set(THERAPY_LINE_MAP.filter((e) => e.therapy === b).map((e) => e.line)))
    .filter((l) => linesA.has(l))
    .filter((l) => THERAPY_LINE_MAP.some((e) => e.line === l && e.role === "PRIMARY" && (e.therapy === a || e.therapy === b)))
    .sort((x, y) => {
      const primaries = (l: string) => THERAPY_LINE_MAP.filter((e) => e.line === l && e.role === "PRIMARY" && (e.therapy === a || e.therapy === b)).length;
      return primaries(y) - primaries(x);
    });
  if (sharedLines.length === 0) return <NotFound />;
  const entryA = THERAPY_LINE_MAP.find((e) => e.therapy === a && e.line === sharedLines[0])!;
  const entryB = THERAPY_LINE_MAP.find((e) => e.therapy === b && e.line === sharedLines[0])!;
  const bothPrimary = entryA.role === "PRIMARY" && entryB.role === "PRIMARY";
  const roleWord = (r: string) => (r === "PRIMARY" ? "PRIMARY — targets it directly" : r === "SECONDARY" ? "SECONDARY — lifts it as a side effect" : "ADJUNCT — supportive alongside a primary");

  const practA = PRACTITIONER_KINDS.has(kindA), practB = PRACTITIONER_KINDS.has(kindB);
  const chooseLogic: string[] = [];
  if (practA && !practB) {
    chooseLogic.push(`${da} runs through a trained practitioner; ${db} you can start on your own this week. If access, cost, or waitlists are the constraint, ${db} starts the work now — and the two are not mutually exclusive.`);
  } else if (practB && !practA) {
    chooseLogic.push(`${db} runs through a trained practitioner; ${da} you can start on your own this week. If access, cost, or waitlists are the constraint, ${da} starts the work now — and the two are not mutually exclusive.`);
  } else if (practA && practB) {
    chooseLogic.push(`Both run through qualified practitioners — availability and personal fit with the clinician often decide more than the modality does, which the outcome literature keeps confirming.`);
  } else {
    chooseLogic.push(`Both are self-run protocols — the honest tiebreaker is adherence: the one you will actually still be doing in week six is the better protocol for you, whatever the effect sizes say.`);
  }
  if (!bothPrimary) {
    const [prim, sec] = entryA.role === "PRIMARY" ? [da, db] : [db, da];
    chooseLogic.push(`On this specific capacity the mapping is asymmetric: ${prim} treats it as the direct target; ${sec} lifts it as a documented side effect. If this line is your gating weakness, the direct road usually earns first position — the supporting road stacks beautifully on top, or stands in when the primary isn't accessible.`);
  }
  if (kindA !== kindB) {
    chooseLogic.push(`They work through different channels — ${KIND_PROFILES[kindA].label.toLowerCase()} versus ${KIND_PROFILES[kindB].label.toLowerCase()}. Different channel, same target capacity: when one has failed you before, the other is the rational next attempt, not more of the same.`);
  } else {
    chooseLogic.push(`Both belong to the same protocol family (${KIND_PROFILES[kindA].label.toLowerCase()}), so expect similar demands — the differentiators are the specific mechanism and which evidence base speaks to a situation like yours.`);
  }

  const lineName = (engine: string) => {
    const map: Record<string, string> = { Kinesthetic: "Bodily-Kinesthetic", Naturalistic: "Naturalist", Systematic: "Systemic", "Financial-Self-Management": "Financial", Empathic: "Emotional", Influence: "Rhetorical" };
    const display = map[engine] ?? (LINE_NAMES.includes(engine) ? engine : undefined);
    return display ? <Link href={`/line/${lineSlug(display)}`} style={{ color: CHAMPAGNE }}>{engine}</Link> : <span style={{ color: CREAM }}>{engine}</span>;
  };

  return (
    <div className="min-h-screen" style={{ background: INK }}>
      <PublicHeader />
      <div className="max-w-[880px] mx-auto px-6 py-14">
        <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.26em", textTransform: "uppercase", color: CHAMPAGNE, marginBottom: "10px" }}>
          Protocol comparison · same target capacity, two roads
        </p>
        <h1 style={{ ...serif, fontSize: "clamp(30px,5vw,50px)", lineHeight: 1.05, color: CREAM, margin: "0 0 12px" }}>
          {da} vs {db}
        </h1>
        <p style={{ fontSize: "15px", lineHeight: 1.7, color: CREAM2, margin: "0 0 8px" }}>
          {bothPrimary
            ? <>Both are mapped PRIMARY for the same capacity — </>
            : <>Two roads to one capacity — {da}: {roleWord(entryA.role).toLowerCase()}; {db}: {roleWord(entryB.role).toLowerCase()} — </>}
          <b style={{ color: CREAM }}>{entryA.capacity.charAt(0).toLowerCase() + entryA.capacity.slice(1)}</b>
          {" "}on the {lineName(sharedLines[0])} line{sharedLines.length > 1 ? <> (and they overlap on {sharedLines.length - 1} more)</> : null}.
          Which road fits you is a real question with a real answer — here is the honest comparison.
        </p>
        <p style={{ ...mono, fontSize: "10px", color: MUTED, marginBottom: "28px" }}>
          full pages: <Link href={`/protocol/${therapySlug(a)}`} style={{ color: CHAMPAGNE }}>{da}</Link> · <Link href={`/protocol/${therapySlug(b)}`} style={{ color: CHAMPAGNE }}>{db}</Link>
        </p>

        {/* Side by side */}
        <div className="grid gap-3 mb-9" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
          {[{ n: da, full: a, k: ka, kid: kindA, e: entryA }, { n: db, full: b, k: kb, kid: kindB, e: entryB }].map(({ n, full, k, kid, e }) => (
            <div key={n} className="rounded-2xl p-5" style={{ border: `1px solid ${LINE_C}`, background: "rgba(241,234,219,0.02)" }}>
              <p style={{ ...mono, fontSize: "9.5px", letterSpacing: "0.16em", textTransform: "uppercase", color: JADE, margin: "0 0 4px" }}>
                {KIND_PROFILES[kid].label}
              </p>
              <p style={{ ...serif, fontSize: "21px", margin: "0 0 10px" }}>
                <Link href={`/protocol/${therapySlug(full)}`} style={{ color: CREAM }}>{n} →</Link>
              </p>
              <Label>Dose</Label>
              <p style={{ fontSize: "13px", lineHeight: 1.6, color: CREAM2, margin: "0 0 10px" }}>{k.dose}</p>
              <Label>Durability</Label>
              <p style={{ fontSize: "13px", lineHeight: 1.6, color: CREAM2, margin: "0 0 10px" }}>{k.durability}</p>
              <Label>Its evidence on the shared capacity</Label>
              <p style={{ fontSize: "13px", lineHeight: 1.6, color: CREAM2, margin: 0 }}>{e.finding}</p>
              <p style={{ ...mono, fontSize: "9.5px", color: MUTED, marginTop: "8px" }}>{e.cite.slice(0, 140)}{e.cite.length > 140 ? "…" : ""}</p>
            </div>
          ))}
        </div>

        {/* Choose which, when */}
        <div className="rounded-2xl p-6 mb-9" style={{ border: `1px solid ${CHAMPAGNE}44`, borderLeft: `3px solid ${CHAMPAGNE}`, background: "rgba(224,198,140,0.05)" }}>
          <Label>Choosing between them — honestly</Label>
          {chooseLogic.map((t, i) => (
            <p key={i} style={{ fontSize: "14.5px", lineHeight: 1.75, color: CREAM2, margin: i === 0 ? "0 0 10px" : 0 }}>{t}</p>
          ))}
          <p style={{ ...mono, fontSize: "10px", color: MUTED, marginTop: "12px", lineHeight: 1.6 }}>
            Not medical advice, not a guarantee. Clinical protocols require qualified practitioners; your own profile —
            and a clinician where one is involved — makes the call. Citations pending the open audit
            (<Link href="/corrections" style={{ color: CHAMPAGNE }}>Corrections Ledger</Link>).
          </p>
        </div>

        {/* CTA */}
        <div className="rounded-2xl p-7 text-center" style={{ border: `1px solid ${CHAMPAGNE}44`, background: "rgba(224,198,140,0.05)" }}>
          <p style={{ ...serif, fontSize: "clamp(20px,3vw,26px)", color: CREAM, margin: "0 0 6px" }}>
            The real question: do you even need this capacity built?
          </p>
          <p style={{ fontSize: "14px", lineHeight: 1.65, color: CREAM2, margin: "0 0 16px" }}>
            The 32-line assessment finds whether this line is your master weakness, a minor gap, or already a strength —
            before you spend months on either road. Free for the first 10,000 founding members.
          </p>
          <Link href="/assessment" className="inline-block rounded-lg"
            style={{ ...mono, fontSize: "12px", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, padding: "15px 28px", background: CHAMPAGNE, color: INK }}>
            Measure all 32 lines
          </Link>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
