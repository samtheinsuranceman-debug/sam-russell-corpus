// ============================================================
// MYTH DETAIL — /myth/:id — one page per documented failed
// therapy. The claim, the verdict, why it failed (sourced), the
// cultural-appeal analysis (labeled as analysis), and the real
// alternative. The Museum exists because a platform that sells
// honest measurement owes the public its debunking shelf.
// ============================================================
import { Link, useParams } from "wouter";
import { PublicHeader, PublicFooter } from "@/components/PublicLayout";
import PageVideo from "@/components/PageVideo";
import { MYTHS, MYTH_VERDICT_META, mythById } from "@/lib/mythMuseum";
import { wingFor } from "@/lib/mythWings";
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

function Label({ children, color = CHAMPAGNE }: { children: React.ReactNode; color?: string }) {
  return <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color, margin: "0 0 8px" }}>{children}</p>;
}

export default function MythDetail() {
  const params = useParams<{ id: string }>();
  const m = mythById(params.id ?? "");
  if (!m) return <NotFound />;
  const v = MYTH_VERDICT_META[m.verdict];
  const wing = wingFor(m.id);
  const idx = MYTHS.indexOf(m);
  const prev = MYTHS[(idx + MYTHS.length - 1) % MYTHS.length];
  const next = MYTHS[(idx + 1) % MYTHS.length];

  return (
    <div className="min-h-screen" style={{ background: INK }}>
      <PublicHeader />
      <div className="max-w-[760px] mx-auto px-6 py-14">
        <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.26em", textTransform: "uppercase", color: EMBER, marginBottom: "10px" }}>
          The Myth Museum · exhibit {idx + 1} of {MYTHS.length} · <Link href="/myths" style={{ color: CHAMPAGNE }}>full collection</Link>
        </p>
        <h1 style={{ ...serif, fontSize: "clamp(30px,5.2vw,50px)", lineHeight: 1.06, color: CREAM, margin: "0 0 12px" }}>
          {m.name}
        </h1>
        <div className="flex items-center gap-2 flex-wrap mb-7">
          <span style={{ ...mono, fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", padding: "6px 12px", borderRadius: "999px", color: v.color, border: `1px solid ${v.color}66`, background: `${v.color}11` }}>
            {m.verdict} · {v.note}
          </span>
          {wing && (
            <span style={{ ...mono, fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", padding: "6px 12px", borderRadius: "999px", color: MUTED, border: `1px solid ${LINE_C}` }}>
              {wing.label.split(" — ")[0]}
            </span>
          )}
        </div>

        <PageVideo label={m.name} />

        <Label>The claim it made</Label>
        <p style={{ ...serif, fontSize: "clamp(18px,2.6vw,22px)", lineHeight: 1.5, color: CREAM, margin: "0 0 26px" }}>
          &ldquo;{m.claim}&rdquo;
        </p>

        <div className="rounded-2xl p-6 mb-6" style={{ border: `1px solid ${EMBER}44`, borderLeft: `3px solid ${EMBER}`, background: "rgba(226,96,74,0.05)" }}>
          <Label color={EMBER}>Why it failed — the record</Label>
          <p style={{ fontSize: "14.5px", lineHeight: 1.78, color: CREAM2, margin: "0 0 10px" }}>{m.why}</p>
          <p style={{ ...mono, fontSize: "10.5px", lineHeight: 1.6, color: CREAM, margin: 0 }}>Source anchor: {m.source}</p>
        </div>

        <div className="rounded-2xl p-6 mb-6" style={{ border: `1px solid ${CHAMPAGNE}33`, borderLeft: `3px solid ${CHAMPAGNE}`, background: "rgba(224,198,140,0.04)" }}>
          <Label>Why people bought it — our analysis, labeled as analysis</Label>
          <p style={{ fontSize: "14.5px", lineHeight: 1.78, color: CREAM2, margin: "0 0 8px" }}>{m.appeal}</p>
          <p style={{ ...mono, fontSize: "10px", color: MUTED, margin: 0 }}>
            Cultural interpretation, not a measured finding — the longer argument lives at{" "}
            <Link href="/why-we-fall" style={{ color: CHAMPAGNE }}>Why We Fall for It</Link>.
          </p>
        </div>

        {wing && (
          <div className="rounded-2xl p-6 mb-6" style={{ border: `1px solid ${LINE_C}`, background: "rgba(241,234,219,0.02)" }}>
            <Label color={CREAM2}>The anatomy of this family — {wing.label}</Label>
            <div className="space-y-4">
              <div>
                <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: EMBER, margin: "0 0 4px" }}>How the family claims to work</p>
                <p style={{ fontSize: "13.5px", lineHeight: 1.75, color: CREAM2, margin: 0 }}>{wing.pattern}</p>
              </div>
              <div>
                <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: CHAMPAGNE, margin: "0 0 4px" }}>Why it feels like it works — the honest psychology</p>
                <p style={{ fontSize: "13.5px", lineHeight: 1.75, color: CREAM2, margin: 0 }}>{wing.seduction}</p>
              </div>
              <div>
                <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: JADE, margin: "0 0 4px" }}>The tell-tale signs</p>
                <p style={{ fontSize: "13.5px", lineHeight: 1.75, color: CREAM2, margin: 0 }}>{wing.tell}</p>
              </div>
              <div>
                <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: MUTED, margin: "0 0 4px" }}>The American hook — our analysis, labeled as analysis</p>
                <p style={{ fontSize: "13.5px", lineHeight: 1.75, color: CREAM2, margin: 0 }}>{wing.hook}</p>
              </div>
            </div>
          </div>
        )}

        {m.instead && (
          <div className="rounded-2xl p-6 mb-8" style={{ border: `1px solid ${JADE}44`, borderLeft: `3px solid ${JADE}`, background: "rgba(155,192,178,0.05)" }}>
            <Label color={JADE}>What holds up instead</Label>
            <p style={{ fontSize: "14.5px", lineHeight: 1.75, color: CREAM2, margin: 0 }}>{m.instead}</p>
          </div>
        )}

        <p style={{ ...mono, fontSize: "10px", color: MUTED, lineHeight: 1.7, margin: "0 0 30px" }}>
          Museum standards: entries document only well-established failures; source anchors are named, checkable works
          or rulings; the standing citation audit covers this family (<Link href="/corrections" style={{ color: CHAMPAGNE }}>Corrections Ledger</Link>).
          If we're wrong about an exhibit, challenge it — that's what the ledger is for.
        </p>

        <div className="rounded-2xl p-7 mb-8 text-center" style={{ border: `1px solid ${CHAMPAGNE}44`, background: "rgba(224,198,140,0.05)" }}>
          <p style={{ ...serif, fontSize: "clamp(20px,3vw,26px)", color: CREAM, margin: "0 0 6px" }}>
            The antidote to a false map is a real one.
          </p>
          <p style={{ fontSize: "14px", lineHeight: 1.65, color: CREAM2, margin: "0 0 16px" }}>
            Every exhibit here sold a shortcut around measurement. The 32-line assessment is the long way — spoken
            evidence, eight independent AI scorers, error bars, and a public corrections trail.
          </p>
          <Link href="/assessment" className="inline-block rounded-lg"
            style={{ ...mono, fontSize: "12px", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, padding: "15px 28px", background: CHAMPAGNE, color: INK }}>
            Measure all 32 lines
          </Link>
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Link href={`/myth/${prev.id}`} style={{ ...mono, fontSize: "10.5px", letterSpacing: "0.08em", textTransform: "uppercase", color: CHAMPAGNE }}>← {prev.name}</Link>
          <Link href="/why-we-fall" style={{ ...mono, fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: MUTED }}>why we fall for it</Link>
          <Link href={`/myth/${next.id}`} style={{ ...mono, fontSize: "10.5px", letterSpacing: "0.08em", textTransform: "uppercase", color: CHAMPAGNE }}>{next.name} →</Link>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
