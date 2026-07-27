import { Link } from "wouter";
import { useMemo, useState } from "react";
import { ARCHETYPES, archetypeProfiles, isolationFindings, starvationCards, integratedProfiles, type Archetype, type ArchetypeSource } from "./archetypesData";

// ============================================================
// Intelligence Archetype Profiles — the evidence "before/after"
// ============================================================
// Not prescriptions. This page documents, with real citations, what happens when
// one line runs high and the others are starved — and the science case for
// connecting with peers who share your high lines (the matching network's rationale).

function scholarUrl(ref: string) {
  return ref.startsWith("http")
    ? ref
    : `https://scholar.google.com/scholar?q=${encodeURIComponent(ref)}`;
}

function Sources({ sources }: { sources: ArchetypeSource[] }) {
  const [open, setOpen] = useState(false);
  if (!sources?.length) return null;
  return (
    <div className="mt-4">
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-[0.62rem] uppercase tracking-[0.14em] text-accent/70 hover:text-accent transition-colors"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        {open ? "▾" : "▸"} {sources.length} source{sources.length !== 1 ? "s" : ""}
      </button>
      {open && (
        <ul className="mt-2 space-y-2">
          {sources.map((s, i) => (
            <li key={i} className="text-xs text-muted-foreground/70 leading-snug border-l border-border/40 pl-3">
              <a href={scholarUrl(s.ref)} target="_blank" rel="noopener noreferrer" className="text-foreground/80 hover:text-accent transition-colors">
                {s.cite}
              </a>
              <div className="text-muted-foreground/55 mt-0.5">{s.finding}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Honest, graded summary of what the whole dossier actually supports. Grounded
// in the collected literature; the tiers are deliberately conservative.
type EvidenceTier = "Strong" | "Moderate" | "Mixed" | "Contested";
const TIER_STYLE: Record<EvidenceTier, string> = {
  Strong: "border-emerald-500/30 text-emerald-300/90 bg-emerald-500/[0.07]",
  Moderate: "border-accent/30 text-accent/90 bg-accent/[0.06]",
  Mixed: "border-amber-500/30 text-amber-300/90 bg-amber-500/[0.06]",
  Contested: "border-red-500/30 text-red-300/85 bg-red-500/[0.06]",
};
const EVIDENCE_CLAIMS: { tier: EvidenceTier; claim: string; detail: string }[] = [
  {
    tier: "Strong",
    claim: "Social connection predicts health and longevity.",
    detail: "Multiple large meta-analyses (Holt-Lunstad 2010, 2015) find isolation raises mortality risk on the order of smoking. Mostly observational and vulnerable to reverse causation — but the direction and size are highly consistent.",
  },
  {
    tier: "Strong",
    claim: "Human ability is uneven, so one-number testing misses most of the person.",
    detail: "Tilt and twice-exceptional research (SMPY; 2e literature) show a person can be extraordinary on one line and starved on another. A single g/IQ score cannot represent that.",
  },
  {
    tier: "Moderate",
    claim: "Connecting people to fitting peers, mentors, and environments helps — modestly.",
    detail: "Mentoring (DuBois g≈0.21), belonging interventions, ability grouping (g≈0.37 for gifted), and person-environment fit are real but usually small-to-moderate, heterogeneous, and sometimes fade. We do not oversell this.",
  },
  {
    tier: "Moderate",
    claim: "Being identified — finally named — changes the trajectory.",
    detail: "Late ADHD/autism diagnosis and affect-labeling research show naming a pattern brings relief and direction. Labeling also carries documented downsides (stigma, self-limiting beliefs); both are real.",
  },
  {
    tier: "Mixed",
    claim: "Similarity/same-line matching is a benefit AND a cost.",
    detail: "Homophily builds trust and support but narrows information and can cap the top tier (McPherson 2001; Gompers 2017). Matching works best when strengths are complementary, not merely alike.",
  },
  {
    tier: "Contested",
    claim: "The neural and hormonal 'why' is not settled.",
    detail: "The social-pain/physical-pain overlap (Eisenberger 2003) has been challenged (Woo 2014); much oxytocin research does not replicate (Nave 2015). We cite these as suggestive mechanism, not proof.",
  },
  {
    tier: "Contested",
    claim: "Most of this evidence is WEIRD-sampled.",
    detail: "Findings lean on Western, educated samples (Henrich 2010). The isolation→mortality link replicates in direction but attenuates in Asia and is barely tested in Africa or South America. Generalization is a genuine open question.",
  },
];

function EvidenceSynthesis() {
  return (
    <section id="evidence" className="mt-14 scroll-mt-28 rounded-2xl border border-border/50 bg-card/30 p-6 sm:p-8">
      <h2 className="text-2xl sm:text-3xl text-foreground mb-2" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400 }}>
        State of the evidence — read this first
      </h2>
      <p className="text-sm text-muted-foreground/70 mb-6 max-w-2xl">
        Below are hundreds of real citations. They do not all carry the same weight, and we refuse to pretend
        they do. Here is the honest grade on what this body of work actually supports — strongest to shakiest.
      </p>
      <div className="space-y-3">
        {EVIDENCE_CLAIMS.map((c, i) => (
          <div key={i} className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4 border-l border-border/40 pl-4">
            <span className={`shrink-0 mt-0.5 px-2.5 py-0.5 rounded-full text-[0.6rem] uppercase tracking-[0.12em] border ${TIER_STYLE[c.tier]}`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {c.tier}
            </span>
            <div>
              <p className="text-sm text-foreground/90 font-medium leading-snug">{c.claim}</p>
              <p className="text-xs text-muted-foreground/65 leading-relaxed mt-0.5">{c.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function LineChips({ label, lines, tone }: { label: string; lines: string[]; tone: "high" | "low" }) {
  if (!lines?.length) return null;
  const cls = tone === "high"
    ? "border-accent/30 text-accent/90 bg-accent/[0.06]"
    : "border-red-500/25 text-red-300/80 bg-red-500/[0.05]";
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[0.6rem] uppercase tracking-[0.14em] text-muted-foreground/50" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{label}</span>
      {lines.map((l) => (
        <span key={l} className={`px-2 py-0.5 rounded-full text-[0.65rem] border ${cls}`}>{l}</span>
      ))}
    </div>
  );
}

function ArchetypeCard({ a }: { a: Archetype }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card/40 p-6 sm:p-7">
      <h3 className="text-2xl sm:text-3xl text-foreground mb-3" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400 }}>
        {a.name}
      </h3>
      <div className="space-y-1.5 mb-4">
        <LineChips label="High" lines={a.highLines} tone="high" />
        <LineChips label="Starved" lines={a.lowLines} tone="low" />
      </div>
      <p className="text-sm text-foreground/80 leading-relaxed mb-5">{a.pattern}</p>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-red-500/20 bg-red-500/[0.04] p-4">
          <p className="text-[0.6rem] uppercase tracking-[0.15em] text-red-300/70 mb-1.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            Left unidentified
          </p>
          <p className="text-sm text-foreground/75 leading-relaxed">{a.untreatedTrajectory}</p>
        </div>
        <div className="rounded-xl border border-accent/25 bg-accent/[0.05] p-4">
          <p className="text-[0.6rem] uppercase tracking-[0.15em] text-accent/80 mb-1.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            With the right connection &amp; development
          </p>
          <p className="text-sm text-foreground/75 leading-relaxed">{a.connectionCase}</p>
          {a.growthMeasures && (
            <p className="text-xs text-accent/70 mt-2 leading-snug"><span className="uppercase tracking-wide text-[0.58rem]">Measured:</span> {a.growthMeasures}</p>
          )}
        </div>
      </div>
      <Sources sources={a.sources} />
    </div>
  );
}

function FindingCard({ a }: { a: Archetype }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card/30 p-5">
      <h4 className="text-lg text-foreground mb-2" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500 }}>{a.name}</h4>
      <p className="text-sm text-foreground/75 leading-relaxed mb-2">
        <span className="text-red-300/70">Isolated: </span>{a.untreatedTrajectory}
      </p>
      <p className="text-sm text-foreground/75 leading-relaxed">
        <span className="text-accent/80">Connected: </span>{a.connectionCase}
        {a.growthMeasures ? <span className="text-accent/70"> — {a.growthMeasures}</span> : null}
      </p>
      <Sources sources={a.sources} />
    </div>
  );
}

function StarvationCard({ a }: { a: Archetype }) {
  const line = a.lowLines?.[0] || "";
  return (
    <div className="rounded-xl border border-border/50 bg-card/30 p-5">
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <h4 className="text-lg text-foreground" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500 }}>{a.name}</h4>
        <span className="shrink-0 px-2 py-0.5 rounded-full text-[0.6rem] border border-red-500/25 text-red-300/80 bg-red-500/[0.05]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          low {line}
        </span>
      </div>
      <p className="text-sm text-foreground/75 leading-relaxed mb-2">
        <span className="text-red-300/70">The cost: </span>{a.untreatedTrajectory}
      </p>
      <p className="text-sm text-foreground/75 leading-relaxed">
        <span className="text-accent/80">The lift: </span>{a.connectionCase}
        {a.growthMeasures ? <span className="text-accent/70"> — {a.growthMeasures}</span> : null}
      </p>
      <Sources sources={a.sources} />
    </div>
  );
}

function IntegratedCard({ a }: { a: Archetype }) {
  return (
    <div className="rounded-2xl border border-accent/30 bg-accent/[0.05] p-6 sm:p-7">
      <h3 className="text-2xl sm:text-3xl text-foreground mb-3" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400 }}>{a.name}</h3>
      <div className="mb-4"><LineChips label="Developed together" lines={a.highLines} tone="high" /></div>
      <p className="text-sm text-foreground/80 leading-relaxed mb-4">{a.pattern}</p>
      <p className="text-sm text-foreground/75 leading-relaxed mb-2">
        <span className="text-accent/80">What it produces: </span>{a.connectionCase}
        {a.growthMeasures ? <span className="text-accent/70"> — {a.growthMeasures}</span> : null}
      </p>
      {a.untreatedTrajectory && (
        <p className="text-xs text-muted-foreground/60 leading-relaxed">
          <span className="uppercase tracking-wide text-[0.58rem] text-muted-foreground/50">Without the integration:</span> {a.untreatedTrajectory}
        </p>
      )}
      <Sources sources={a.sources} />
    </div>
  );
}

export default function Archetypes() {
  const profiles = useMemo(archetypeProfiles, []);
  const findings = useMemo(isolationFindings, []);
  const starved = useMemo(starvationCards, []);
  const integrated = useMemo(integratedProfiles, []);
  const sourceCount = useMemo(() => ARCHETYPES.reduce((n, a) => n + (a.sources?.length || 0), 0), []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-16 sm:py-24">
        {/* Hero */}
        <p className="text-[0.62rem] uppercase tracking-[0.2em] text-accent/70 mb-3" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          Intelligence Archetype Profiles
        </p>
        <h1 className="text-4xl sm:text-5xl leading-tight text-foreground mb-5" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300 }}>
          Every other test measures one thing: <em>g</em>.<br />Here's what the other 31 lines actually do.
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground/80 leading-relaxed max-w-3xl">
          A high IQ tells you almost nothing about how a life goes. The research is clear that when
          someone is brilliant on one line and starved on the others — or brilliant and <em>isolated</em>
          {" "}from anyone who shares that line — specific, documented things go wrong. These aren't
          personality types. They're patterns that have been studied for a century. We show you the
          road each one is on, and the exit — because the exit is the whole point of what we build.
        </p>
        {sourceCount > 0 && (
          <p className="text-xs text-muted-foreground/50 mt-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {profiles.length} archetype profiles · {starved.length} per-line studies · {findings.length} on isolation &amp; connection · {integrated.length} integrated · {sourceCount} cited sources
          </p>
        )}

        {/* Sticky section jump-nav — the dossier is long; let people skip to the part they need */}
        {sourceCount > 0 && (
          <nav className="sticky top-14 z-30 -mx-5 sm:-mx-8 px-5 sm:px-8 py-2.5 mt-8 bg-background/85 backdrop-blur-md border-y border-border/30 flex flex-wrap gap-x-5 gap-y-1.5 text-xs"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {[
              { href: "#evidence", label: "Evidence grade" },
              profiles.length > 0 && { href: "#profiles", label: `Profiles (${profiles.length})` },
              starved.length > 0 && { href: "#per-line", label: `Per-line (${starved.length})` },
              findings.length > 0 && { href: "#connection", label: `Connection (${findings.length})` },
              integrated.length > 0 && { href: "#integrated", label: `Integrated (${integrated.length})` },
            ].filter(Boolean).map((item) => {
              const it = item as { href: string; label: string };
              return (
                <a key={it.href} href={it.href} className="text-muted-foreground/60 hover:text-accent transition-colors uppercase tracking-[0.1em]">
                  {it.label}
                </a>
              );
            })}
          </nav>
        )}

        {/* State-of-evidence synthesis — the honest thesis before the card dump */}
        {sourceCount > 0 && <EvidenceSynthesis />}

        {/* Archetype profiles */}
        {profiles.length > 0 && (
          <section id="profiles" className="mt-16 scroll-mt-28">
            <h2 className="text-2xl sm:text-3xl text-foreground mb-2" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400 }}>
              The Profiles
            </h2>
            <p className="text-sm text-muted-foreground/70 mb-8 max-w-2xl">
              High on one line, starved on another. Left: where the research says the road leads
              unidentified. Right: what changes with the right people and the right work.
            </p>
            <div className="space-y-6">
              {profiles.map((a) => <ArchetypeCard key={a.id} a={a} />)}
            </div>
          </section>
        )}

        {/* Per-line starvation — what your LOWEST axis costs you */}
        {starved.length > 0 && (
          <section id="per-line" className="mt-20 scroll-mt-28">
            <h2 className="text-2xl sm:text-3xl text-foreground mb-2" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400 }}>
              When a line runs empty
            </h2>
            <p className="text-sm text-muted-foreground/70 mb-8 max-w-2xl">
              You don't have to be low on many lines for it to bite — one starved line, especially
              your <em>lowest</em>, has documented costs of its own. Here's what the research says
              each one does when it's the weakest link, and what lifts it.
            </p>
            <div className="grid sm:grid-cols-2 gap-5">
              {starved.map((a) => <StarvationCard key={a.id} a={a} />)}
            </div>
          </section>
        )}

        {/* The isolation / connection science — the matching case */}
        {findings.length > 0 && (
          <section id="connection" className="mt-20 scroll-mt-28">
            <h2 className="text-2xl sm:text-3xl text-foreground mb-2" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400 }}>
              Why connection isn't optional
            </h2>
            <p className="text-sm text-muted-foreground/70 mb-8 max-w-2xl">
              The case, from the evidence, for finding the people on your wave-band. Isolation from
              your own kind is not neutral — it has a measured cost. Connection has a measured return.
            </p>
            <div className="grid sm:grid-cols-2 gap-5">
              {findings.map((a) => <FindingCard key={a.id} a={a} />)}
            </div>
          </section>
        )}

        {/* Empty state (before research is populated) */}
        {profiles.length === 0 && findings.length === 0 && (
          <p className="mt-16 text-sm text-muted-foreground/60 italic">
            The evidence dossier is being assembled.
          </p>
        )}

        {/* The integrated profiles — the "after" the platform engineers toward */}
        {integrated.length > 0 && (
          <section id="integrated" className="mt-20 scroll-mt-28">
            <h2 className="text-2xl sm:text-3xl text-foreground mb-2" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400 }}>
              When the lines work together
            </h2>
            <p className="text-sm text-muted-foreground/70 mb-8 max-w-2xl">
              The other side of the evidence: what the research shows is possible when the lines
              are developed <em>together</em> — the profile the whole platform is built to help you become.
            </p>
            <div className="space-y-6">
              {integrated.map((a) => <IntegratedCard key={a.id} a={a} />)}
            </div>
          </section>
        )}

        {/* Close */}
        <section className="mt-20 rounded-2xl border border-accent/20 bg-accent/[0.04] p-7 text-center">
          <h2 className="text-2xl sm:text-3xl text-foreground mb-3" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400 }}>
            Find out which road you're on — and take the exit.
          </h2>
          <p className="text-sm text-muted-foreground/75 max-w-xl mx-auto mb-5">
            The assessment maps all 32 of your lines, not just g. Then it prescribes the work,
            and points you toward the people who share your highest lines.
          </p>
          <Link href="/assessment">
            <a className="inline-block px-8 py-3 rounded-full bg-primary text-white text-sm font-medium hover:translate-y-[-1px] transition-transform">
              Map my 32 lines
            </a>
          </Link>
        </section>
      </div>
    </div>
  );
}
