// ============================================================
// VERDICT DETAIL — /verdict/:slug — one page per museum verdict
// category: what the verdict means, the standard it applies,
// and every exhibit that earned it.
// ============================================================
import { Link, useParams } from "wouter";
import { PublicHeader, PublicFooter } from "@/components/PublicLayout";
import { MYTHS, MYTH_VERDICT_META, type MythVerdict } from "@/lib/mythMuseum";
import { VERDICT_SLUGS } from "@shared/seo";
import NotFound from "@/pages/NotFound";

const INK = "#141009";
const CREAM = "#F1EADB";
const CREAM2 = "#CFC5B0";
const MUTED = "#9C8F79";
const CHAMPAGNE = "#E0C68C";
const LINE_C = "rgba(241,234,219,0.12)";
const mono = { fontFamily: "'JetBrains Mono', monospace" } as const;
const serif = { fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 } as const;

// What each verdict means as a standard — the museum's rubric, spelled out.
const VERDICT_ESSAY: Record<string, { title: string; standard: string; means: string }> = {
  DEBUNKED: {
    title: "Debunked",
    standard: "The claim was tested properly — controlled conditions, honest measurement, adequate power — and failed decisively. Not 'unproven': disproven.",
    means: "This is the strongest verdict the museum issues, and the rarest privilege a false claim can receive: someone took it seriously enough to test it well. A debunked therapy had its day in court and lost on the evidence. Continuing to sell it after that verdict isn't optimism — it's the business model.",
  },
  "NO EVIDENCE": {
    title: "No Evidence",
    standard: "The claim has never produced controlled evidence in its favor — no trials, or trials so weak they measure nothing. The burden of proof was never met, sometimes never attempted.",
    means: "Absence of evidence, after decades of commercial success and zero controlled wins, stops being neutral. A therapy that earns millions but never funds one rigorous trial of itself has told you what it expects that trial to say. 'It's never been disproven' describes the strategy, not the science.",
  },
  HARMFUL: {
    title: "Harmful",
    standard: "Documented harm — deaths, injuries, poisonings, or the measured cost of the real treatment it displaced. Worse than doing nothing, on the record.",
    means: "These are the exhibits the museum exists for. The gentlest-sounding claims in this collection carry the heaviest documented costs — most often not through the treatment's direct toxicity, but through the effective care it convinced someone to refuse while a treatable window closed.",
  },
  "REPLICATION FAILED": {
    title: "Replication Failed",
    standard: "A real finding, from real scientists, published in real journals — that would not reproduce when independent labs ran it again, preregistered and properly powered.",
    means: "This verdict is science working, not science failing: the system caught its own error, which is the one thing pseudoscience never does. The scandal isn't that these findings fell — it's the keynote-and-curriculum economy that kept selling them for years after they did.",
  },
  OVERCLAIMED: {
    title: "Overclaimed",
    standard: "A real kernel — a genuine effect, a legitimate narrow use — sold far beyond what its evidence supports. The kernel is cited on the box; the catalog around it is not.",
    means: "The most instructive verdict in the museum, because the deception is structural: every marketing claim traces back to something true, stretched. Overclaimed therapies are hardest to warn people about — defenders can always point at the kernel. The honest question is never 'is there evidence?' but 'evidence for which claim, at which dose, for whom?'",
  },
};

export default function VerdictDetail() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? "";
  if (!VERDICT_SLUGS.includes(slug)) return <NotFound />;
  const verdict = slug.replace(/-/g, " ").toUpperCase() as MythVerdict;
  const meta = MYTH_VERDICT_META[verdict];
  const essay = VERDICT_ESSAY[verdict];
  if (!meta || !essay) return <NotFound />;
  const exhibits = MYTHS.filter((m) => m.verdict === verdict);
  const idx = VERDICT_SLUGS.indexOf(slug);
  const prev = VERDICT_SLUGS[(idx + VERDICT_SLUGS.length - 1) % VERDICT_SLUGS.length];
  const next = VERDICT_SLUGS[(idx + 1) % VERDICT_SLUGS.length];

  return (
    <div className="min-h-screen" style={{ background: INK }}>
      <PublicHeader />
      <div className="max-w-[760px] mx-auto px-6 py-14">
        <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.26em", textTransform: "uppercase", color: meta.color, marginBottom: "10px" }}>
          The Myth Museum · verdict {idx + 1} of {VERDICT_SLUGS.length} · <Link href="/myths" style={{ color: CHAMPAGNE }}>full collection</Link>
        </p>
        <h1 style={{ ...serif, fontSize: "clamp(30px,5.2vw,50px)", lineHeight: 1.06, color: CREAM, margin: "0 0 8px" }}>
          Verdict: {essay.title}
        </h1>
        <p style={{ ...mono, fontSize: "11px", letterSpacing: "0.1em", color: meta.color, margin: "0 0 22px" }}>{meta.note}</p>

        <div className="rounded-2xl p-6 mb-4" style={{ border: `1px solid ${meta.color}44`, borderLeft: `3px solid ${meta.color}`, background: `${meta.color}0d` }}>
          <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: meta.color, margin: "0 0 8px" }}>The standard this verdict applies</p>
          <p style={{ fontSize: "14.5px", lineHeight: 1.78, color: CREAM2, margin: 0 }}>{essay.standard}</p>
        </div>
        <div className="rounded-2xl p-6 mb-8" style={{ border: `1px solid ${LINE_C}`, background: "rgba(241,234,219,0.02)" }}>
          <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: CHAMPAGNE, margin: "0 0 8px" }}>What it means when you meet one</p>
          <p style={{ fontSize: "14.5px", lineHeight: 1.78, color: CREAM2, margin: 0 }}>{essay.means}</p>
        </div>

        <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: CHAMPAGNE, margin: "0 0 10px" }}>
          Every exhibit that earned it — {exhibits.length} of {MYTHS.length}
        </p>
        <div className="grid sm:grid-cols-2 gap-3 mb-8">
          {exhibits.map((m) => (
            <Link key={m.id} href={`/myth/${m.id}`}
              className="rounded-xl border p-4 block"
              style={{ borderColor: LINE_C, background: "rgba(241,234,219,0.02)" }}>
              <p style={{ ...serif, fontSize: "15.5px", color: CREAM, margin: "0 0 4px" }}>{m.name}</p>
              <p style={{ fontSize: "12px", lineHeight: 1.55, color: MUTED, margin: 0 }}>&ldquo;{m.claim}&rdquo;</p>
            </Link>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Link href={`/verdict/${prev}`} style={{ ...mono, fontSize: "10.5px", letterSpacing: "0.08em", textTransform: "uppercase", color: CHAMPAGNE }}>← {VERDICT_ESSAY[prev.replace(/-/g, " ").toUpperCase()]?.title}</Link>
          <Link href="/myths" style={{ ...mono, fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: MUTED }}>all exhibits</Link>
          <Link href={`/verdict/${next}`} style={{ ...mono, fontSize: "10.5px", letterSpacing: "0.08em", textTransform: "uppercase", color: CHAMPAGNE }}>{VERDICT_ESSAY[next.replace(/-/g, " ").toUpperCase()]?.title} →</Link>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
