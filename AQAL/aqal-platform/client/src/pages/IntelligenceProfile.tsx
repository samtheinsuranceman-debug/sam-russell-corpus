import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  AXIS_MODE, MODE_META, STAGE_LABELS, STANCE_AXES, RARITY_AXES,
  INDEPENDENT_COUNT, ALL_AXES, TOTAL_LINES,
  axisMode, axisIndep, modeColor, modeLabel, modeVerb,
  type AxisMode,
} from "@shared/axisModes";

// ============================================================
// AQAL — Observatory Direction (Atelier palette)
// 32-line model: 27 scored + 5 stance (developmental)
// Engraved medallion ring + 4-column breakdown + Network tab
// ============================================================

// Demo data — in production this comes from the user's assessment via tRPC
interface LineData {
  label: string;
  mode: AxisMode;
  plot: number; // 0-100 for radar
  read: string;
  ev: string;
  indep: boolean;
  feedsRarity: boolean;
  stageNum?: number; // for stance lines
}

const SCORED_LINES: LineData[] = [
  { label: "Logical", mode: "measured", plot: 95, read: "95th pct", ev: "LSAT 172", indep: false, feedsRarity: true },
  { label: "Mathematical", mode: "measured", plot: 93, read: "93rd pct", ev: "SAT-M 790", indep: false, feedsRarity: true },
  { label: "Spatial", mode: "measured", plot: 88, read: "88th pct", ev: "Raven's 92", indep: false, feedsRarity: true },
  { label: "Linguistic", mode: "measured", plot: 97, read: "97th pct", ev: "GRE-V 168", indep: false, feedsRarity: true },
  { label: "Volitional", mode: "measured", plot: 90, read: "90th pct", ev: "Conscientiousness inv.", indep: true, feedsRarity: true },
  { label: "Meta-Cognitive", mode: "calibration", plot: 84, read: "84 / 100", ev: "Calibration test", indep: true, feedsRarity: true },
  { label: "Intrapersonal", mode: "altitude", plot: 78, read: "Self-authoring", ev: "Reflective writing", indep: false, feedsRarity: true },
  { label: "Reflective", mode: "altitude", plot: 80, read: "Systemic", ev: "Interview probes", indep: false, feedsRarity: true },
  { label: "Existential", mode: "altitude", plot: 82, read: "Integrative", ev: "Structured probes", indep: false, feedsRarity: true },
  { label: "Philosophical", mode: "altitude", plot: 79, read: "Systemic", ev: "Written analysis", indep: false, feedsRarity: true },
  { label: "Integrative", mode: "altitude", plot: 85, read: "Integral", ev: "Cross-domain synthesis", indep: false, feedsRarity: true },
  { label: "Interpersonal", mode: "demonstrated", plot: 74, read: "Developing", ev: "Led 40-person team", indep: false, feedsRarity: true },
  { label: "Empathic", mode: "demonstrated", plot: 72, read: "Developing", ev: "360 review", indep: false, feedsRarity: true },
  { label: "Intuitive", mode: "demonstrated", plot: 86, read: "Strong", ev: "Decision record", indep: false, feedsRarity: true },
  { label: "Musical", mode: "demonstrated", plot: 70, read: "Proficient", ev: "Conservatory yr 2", indep: false, feedsRarity: true },
  { label: "Kinesthetic", mode: "demonstrated", plot: 79, read: "Strong", ev: "Sub-3:30 marathon", indep: false, feedsRarity: true },
  { label: "Naturalistic", mode: "demonstrated", plot: 68, read: "Proficient", ev: "Field research", indep: false, feedsRarity: true },
  { label: "Strategic", mode: "demonstrated", plot: 91, read: "Elite", ev: "Two ventures built", indep: false, feedsRarity: true },
  { label: "Tactical", mode: "demonstrated", plot: 84, read: "Professional", ev: "Ops track record", indep: false, feedsRarity: true },
  { label: "Adaptive", mode: "demonstrated", plot: 82, read: "Professional", ev: "3 career pivots", indep: false, feedsRarity: true },
  { label: "Resilient", mode: "demonstrated", plot: 85, read: "Strong", ev: "Documented recovery", indep: false, feedsRarity: true },
  { label: "Systematic", mode: "demonstrated", plot: 84, read: "Professional", ev: "Platform architecture", indep: false, feedsRarity: true },
  { label: "Architectural", mode: "demonstrated", plot: 83, read: "Professional", ev: "3 patents", indep: false, feedsRarity: true },
  { label: "Adversarial", mode: "demonstrated", plot: 82, read: "Professional", ev: "Tournament chess 2050", indep: true, feedsRarity: true },
  { label: "Interoceptive", mode: "demonstrated", plot: 80, read: "Strong", ev: "10-yr meditation", indep: true, feedsRarity: true },
  { label: "Aesthetic", mode: "demonstrated", plot: 83, read: "Recognized", ev: "Exhibited work", indep: true, feedsRarity: true },
  { label: "Influence", mode: "demonstrated", plot: 90, read: "Elite", ev: "$40M raised", indep: false, feedsRarity: true },
  { label: "Humor", mode: "demonstrated", plot: 87, read: "Strong", ev: "Audience response data", indep: true, feedsRarity: true },
];

const STANCE_LINES: LineData[] = [
  { label: "Parenting", mode: "stance", plot: 0, read: "Green", ev: "Communitarian approach", indep: false, feedsRarity: false, stageNum: 6 },
  { label: "Seduction", mode: "stance", plot: 0, read: "Orange", ev: "Achievement-oriented", indep: false, feedsRarity: false, stageNum: 5 },
  { label: "Community-Founding", mode: "stance", plot: 0, read: "Teal", ev: "Integral organizing", indep: false, feedsRarity: false, stageNum: 7 },
  { label: "Financial-Self-Management", mode: "stance", plot: 0, read: "Orange", ev: "Achievement-oriented", indep: false, feedsRarity: false, stageNum: 5 },
];

const ALL_LINES = [...SCORED_LINES, ...STANCE_LINES];

const ORDER: AxisMode[] = ["measured", "calibration", "altitude", "demonstrated", "stance"];

const GROWTH = ["Interpersonal", "Empathic", "Naturalistic"];

interface Match {
  initial: string;
  role: string;
  city: string;
  region: string;
  covers: string;
  comp: number;
  tier: string;
  strengths: string[];
}

const MATCHES: Match[] = [
  { initial: "R", role: "Physician", city: "Boston, MA", region: "East", covers: "Interpersonal \u00b7 Empathic", comp: 91, tier: "Gold", strengths: ["Empathic (elite)", "Interpersonal (elite)"] },
  { initial: "D", role: "Diplomat", city: "New York, NY", region: "East", covers: "Interpersonal \u00b7 Empathic", comp: 88, tier: "Gold", strengths: ["Interpersonal (elite)", "Empathic (elite)"] },
  { initial: "A", role: "Litigator", city: "Chicago, IL", region: "Central", covers: "Interpersonal", comp: 86, tier: "Gold", strengths: ["Interpersonal (elite)", "Adversarial (elite)"] },
  { initial: "S", role: "Surgeon", city: "Seattle, WA", region: "West", covers: "Empathic", comp: 84, tier: "Gold", strengths: ["Empathic (strong)", "Volitional (elite)"] },
  { initial: "M", role: "Neuroscientist", city: "Austin, TX", region: "Central", covers: "Naturalistic \u00b7 Empathic", comp: 82, tier: "Silver", strengths: ["Naturalistic (elite)", "Empathic (strong)"] },
  { initial: "J", role: "Architect", city: "San Francisco, CA", region: "West", covers: "Aesthetic \u00b7 Interpersonal", comp: 80, tier: "Gold", strengths: ["Aesthetic (recognized)", "Interpersonal (strong)"] },
];

// ---- SVG helpers ----
function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const a = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

// ---- Spiral Dynamics stage colors ----
const STAGE_COLORS: Record<number, string> = {
  3: "#CC3333", 4: "#3366AA", 5: "#E87D2F", 6: "#4CAF50", 7: "#008B8B", 8: "#40E0D0", 9: "#FF6B6B",
};

// ---- THE OBSERVATORY: 28-line radar inside engraved medallion ----
function ObservatoryRing({ selected, setSelected }: { selected: number; setSelected: (i: number) => void }) {
  const size = 560, cx = size / 2, cy = size / 2;
  const Rring = 220, Rrad = 176, ticks = 72, n = SCORED_LINES.length;
  const pts = SCORED_LINES.map((l, i) => {
    const deg = (i * 360) / n, r = (l.plot / 100) * Rrad;
    const [x, y] = polar(cx, cy, r, deg);
    const [lx, ly] = polar(cx, cy, Rring + 18, deg);
    const anchor = (deg > 6 && deg < 174 ? "start" : deg > 186 && deg < 354 ? "end" : "middle") as "start" | "end" | "middle";
    return { ...l, i, x, y, lx, ly, deg, anchor };
  });
  const poly = pts.map((p, k) => `${k === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") + " Z";
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-auto block overflow-visible" role="img" aria-label={`${n} intelligences plotted inside engraved medallion`}>
      {/* engraved outer ring */}
      <circle cx={cx} cy={cy} r={Rring} fill="none" stroke="var(--accent)" strokeOpacity="0.42" />
      <circle cx={cx} cy={cy} r={Rring - 9} fill="none" stroke="hsl(var(--border))" />
      {Array.from({ length: ticks }).map((_, i) => {
        const deg = (i * 360) / ticks;
        const [x1, y1] = polar(cx, cy, Rring, deg);
        const [x2, y2] = polar(cx, cy, Rring - (i % 6 === 0 ? 13 : 6), deg);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--accent)" strokeOpacity={i % 6 === 0 ? 0.5 : 0.2} />;
      })}
      {/* radar grid */}
      {[0.25, 0.5, 0.75, 1].map((f, i) => <circle key={i} cx={cx} cy={cy} r={Rrad * f} fill="none" stroke="hsl(var(--border))" strokeOpacity="0.5" />)}
      {/* spokes */}
      {pts.map((p) => { const [ex, ey] = polar(cx, cy, Rrad, p.deg); return <line key={"s" + p.i} x1={cx} y1={cy} x2={ex} y2={ey} stroke={selected === p.i ? "rgba(216,192,138,0.28)" : "hsl(var(--border))"} strokeOpacity="0.5" />; })}
      {/* filled polygon */}
      <path d={poly} fill="rgba(216,192,138,0.06)" stroke="hsl(var(--foreground) / 0.5)" strokeWidth="1.15" pathLength={1} style={{ strokeDasharray: 1, strokeDashoffset: 1, animation: "draw 2.3s cubic-bezier(.7,0,.2,1) .15s forwards" }} />
      {/* dots */}
      {pts.map((p) => (
        <g key={p.i} tabIndex={0} role="button" aria-label={`${p.label}: ${p.read}`}
           onMouseEnter={() => setSelected(p.i)} onFocus={() => setSelected(p.i)} onClick={() => setSelected(p.i)} style={{ cursor: "pointer", outline: "none" }}>
          {p.indep && <circle cx={p.x} cy={p.y} r={selected === p.i ? 11 : 8} fill="none" stroke={MODE_META[p.mode].color} strokeOpacity="0.45" strokeDasharray="2 2" />}
          <circle cx={p.x} cy={p.y} r={selected === p.i ? 7 : 4.4} fill={MODE_META[p.mode].color} style={{ filter: `drop-shadow(0 0 5px ${MODE_META[p.mode].color})`, transition: "r .2s" }} />
          <circle cx={p.x} cy={p.y} r={selected === p.i ? 2.8 : 1.9} fill="hsl(var(--background))" />
        </g>
      ))}
      {/* labels outside ring */}
      {pts.map((p) => (
        <text key={"t" + p.i} x={p.lx} y={p.ly} textAnchor={p.anchor} dominantBaseline="middle"
              className="font-mono" style={{ fontSize: 8, cursor: "pointer", fontWeight: selected === p.i ? 600 : 400, letterSpacing: "0.02em" }}
              fill={selected === p.i ? MODE_META[p.mode].color : "hsl(var(--muted-foreground))"} onMouseEnter={() => setSelected(p.i)} onClick={() => setSelected(p.i)}>{p.label}</text>
      ))}
    </svg>
  );
}

// ---- Composite panel ----
function CompositePanel() {
  return (
    <div className="space-y-4">
      <div className="font-mono text-[11px] tracking-[0.28em] uppercase text-muted-foreground">Composite assessment</div>
      <div className="font-display font-medium text-[clamp(32px,5.5vw,52px)] leading-none text-foreground">Rarer than 99.6%</div>
      <div className="font-mono text-[15px] text-accent tracking-[0.05em]">{"\u2248"}1 in 4,200 {"\u00b7"} estimated</div>
      <div className="inline-flex items-center gap-2 mt-4 font-mono text-[10.5px] tracking-[0.12em] text-muted-foreground">
        <i className="w-1.5 h-1.5 rounded-full bg-[#9FB98C]" style={{ boxShadow: "0 0 8px #9FB98C" }} /> HIGH CONFIDENCE {"\u00b7"} EVIDENCE-VERIFIED
      </div>
      <p className="text-[12.5px] leading-relaxed text-muted-foreground max-w-[40ch] mt-3">Covariance-adjusted estimate across effective dimensions — not a product of the {SCORED_LINES.length} lines, which would double-count shared variance. A research-based estimate, not an exact measurement.</p>
      <div className="mt-4 p-4 bg-secondary border border-border rounded">
        <div className="font-mono text-[9.5px] tracking-[0.14em] uppercase text-muted-foreground">Effective dimensions</div>
        <div className="font-display text-[30px] text-foreground my-1">{"\u223C"}6.5</div>
        <div className="text-[11.5px] leading-relaxed text-muted-foreground">The {SCORED_LINES.length} aren't {SCORED_LINES.length} independent draws — the cognitive lines share g and collapse toward one factor. <b className="text-foreground">{INDEPENDENT_COUNT} independent lines</b> (ringed on the medallion) widen the base to {"\u223C"}6.5, which the composite is computed on.</div>
      </div>
    </div>
  );
}

// ---- Developmental Band component for stance lines ----
function DevelopmentalBand({ line }: { line: LineData }) {
  const stageNum = line.stageNum ?? 5;
  const stageInfo = STAGE_LABELS[stageNum];
  const stageColor = STAGE_COLORS[stageNum] ?? "#888";
  return (
    <div className="p-4 bg-secondary border border-border rounded hover:border-accent/40 transition-colors cursor-default">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[13px] text-foreground font-medium">{line.label}</div>
          <div className="font-mono text-[9.5px] tracking-[0.1em] uppercase text-muted-foreground mt-1">
            <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: MODE_META.stance.color }} />
            Developmental stance
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[13px] font-medium" style={{ color: stageColor }}>{stageInfo?.short ?? "—"}</div>
          <div className="font-mono text-[9px] text-muted-foreground">{stageInfo?.name ?? "Unknown"}</div>
        </div>
      </div>
      {/* Stage ladder visualization */}
      <div className="flex gap-0.5 mt-3">
        {[3, 4, 5, 6, 7, 8, 9].map((s) => (
          <div key={s} className="flex-1 h-1.5 rounded-sm transition-all" style={{
            background: s <= stageNum ? (STAGE_COLORS[s] ?? "#888") : "hsl(var(--border))",
            opacity: s <= stageNum ? 1 : 0.3,
          }} />
        ))}
      </div>
      <div className="flex justify-between mt-1.5 font-mono text-[8px] text-muted-foreground">
        <span>Red</span><span>Coral</span>
      </div>
      <div className="text-[11px] text-muted-foreground mt-2">Evidence: {line.ev}</div>
    </div>
  );
}

// ---- Profile Page ----
function ProfilePage() {
  const [selected, setSelected] = useState(4);
  const sel = SCORED_LINES[selected];
  const counts: Record<string, number> = {};
  ORDER.forEach((m) => (counts[m] = ALL_LINES.filter((l) => l.mode === m).length));

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-[clamp(20px,4vw,52px)] items-center mt-8">
        <ObservatoryRing selected={selected} setSelected={setSelected} />
        <CompositePanel />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-6 font-mono text-[10.5px] text-muted-foreground tracking-[0.03em]">
        {ORDER.filter(m => m !== "stance").map((m) => (
          <span key={m} className="inline-flex items-center gap-2">
            <i className="w-2 h-2 rounded-full" style={{ background: MODE_META[m].color }} />
            <b className="text-foreground font-medium">{MODE_META[m].label}</b> — {MODE_META[m].verb.split(" ").slice(0, 3).join(" ")}
          </span>
        ))}
        <span className="inline-flex items-center gap-2">
          <i className="w-2.5 h-2.5 rounded-full border border-dashed border-muted-foreground" />
          <b className="text-foreground font-medium">Ringed</b> — independent (widens base)
        </span>
      </div>

      {/* Selected detail panel */}
      <div className="bg-secondary border rounded p-5 mt-5 flex flex-wrap items-baseline gap-x-5 gap-y-1.5" style={{ borderColor: `${MODE_META[sel.mode].color}55` }}>
        <span className="font-display text-2xl text-foreground">{sel.label}</span>
        <span className="font-mono text-[10px] tracking-[0.14em] uppercase px-2.5 py-1 rounded" style={{ background: `${MODE_META[sel.mode].color}1f`, color: MODE_META[sel.mode].color }}>{MODE_META[sel.mode].label}</span>
        {sel.indep && <span className="font-mono text-[9px] tracking-[0.1em] text-muted-foreground border border-dashed border-muted-foreground/50 rounded px-2 py-0.5">independent dimension</span>}
        <span className="font-mono text-[15px] ml-auto" style={{ color: MODE_META[sel.mode].color }}>{sel.read}</span>
        <span className="text-[12.5px] text-muted-foreground w-full">{modeVerb(sel.label)}</span>
        <span className="font-mono text-[11px] text-muted-foreground w-full pt-2.5 mt-1 border-t border-border">Evidence — <b className="text-foreground">{sel.ev}</b></span>
      </div>

      {/* 4-column breakdown (scored lines) */}
      <div className="h-px bg-border my-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[clamp(14px,2.4vw,30px)]">
        {ORDER.filter(m => m !== "stance").map((mode) => (
          <div key={mode}>
            <div className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-muted-foreground mb-3 flex items-center gap-2">
              <i className="w-2 h-2 rounded-full" style={{ background: MODE_META[mode].color }} />{MODE_META[mode].label} <span className="opacity-60">{"\u00b7"} {counts[mode]}</span>
            </div>
            {SCORED_LINES.filter((l) => l.mode === mode).map((l, idx) => {
              const globalIdx = SCORED_LINES.findIndex(s => s.label === l.label);
              return (
                <div key={l.label} className="grid grid-cols-[1fr_auto] gap-x-2.5 py-2.5 border-b border-border cursor-pointer hover:pl-1 transition-[padding]"
                     onMouseEnter={() => setSelected(globalIdx)} onClick={() => setSelected(globalIdx)}>
                  <span className="text-[13px] text-foreground flex items-center gap-1.5">
                    {l.indep && <i className="w-2 h-2 rounded-full border border-dashed" style={{ borderColor: MODE_META[mode].color }} />}
                    {l.label}
                  </span>
                  <span className="font-mono text-[11.5px] text-right" style={{ color: MODE_META[mode].color }}>{l.read}</span>
                  <span className="font-mono text-[9px] text-muted-foreground col-span-1">{l.ev}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Developmental Stances section */}
      {STANCE_LINES.length > 0 && (
        <>
          <div className="h-px bg-border my-8" />
          <div className="mb-4">
            <div className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-muted-foreground mb-1 flex items-center gap-2">
              <i className="w-2 h-2 rounded-full" style={{ background: MODE_META.stance.color }} />
              Developmental Stances <span className="opacity-60">{"\u00b7"} {STANCE_LINES.length}</span>
            </div>
            <p className="text-[12px] text-muted-foreground max-w-[60ch] mt-2">These are capacities graded by your relationship to the capacity, not by amount. Scored on the Spiral Dynamics nine-stage ladder. They do not feed into the rarity composite.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {STANCE_LINES.map((l) => <DevelopmentalBand key={l.label} line={l} />)}
          </div>
        </>
      )}
    </>
  );
}

// ---- Network Page ----
function NetworkPage() {
  const { user } = useAuth();
  const [mode, setMode] = useState<"complementary" | "resonance">("complementary");

  // Real tRPC query — falls back to demo data when user has no assessment or no network
  const matchQuery = trpc.network.matches.useQuery(
    { mode, limit: 10 },
    { enabled: !!user, retry: false }
  );

  const liveMatches = matchQuery.data?.matches ?? [];
  const useLive = liveMatches.length > 0;

  // Render live matches or demo fallback
  const displayMatches = useLive
    ? liveMatches.map((m) => ({
        initial: (m.candidateName || "?")[0].toUpperCase(),
        role: m.candidateName || "Anonymous",
        city: "",
        region: "All",
        covers: m.basis,
        comp: m.score,
        tier: "Network",
        strengths: (m as any).coversYourEdges ?? (m as any).sharedPeaks ?? [],
      }))
    : MATCHES;

  const [region, setRegion] = useState("All");
  const shown = displayMatches.filter((m) => region === "All" || m.region === region);

  return (
    <div className="mt-8">
      <div className="font-mono text-[11px] tracking-[0.28em] uppercase text-muted-foreground">Your complementary network — nationwide</div>
      <h2 className="font-display font-medium text-[clamp(28px,4.5vw,42px)] leading-tight mt-2 mb-3 text-foreground max-w-[22ch]">People across the country whose strengths cover your growth edges</h2>
      <p className="text-[14px] leading-relaxed text-muted-foreground max-w-[64ch]">Matched on profile shape, not rarity. Each pairing covers one of your growth edges with someone's demonstrated strength — and complements theirs with yours. Identities are revealed only after a mutual request.</p>

      {/* Mode toggle */}
      <div className="flex items-center gap-2 mt-6">
        <button onClick={() => setMode("complementary")}
          className={`font-mono text-[11px] tracking-[0.08em] px-4 py-2 rounded border cursor-pointer transition-colors ${mode === "complementary" ? "bg-accent/10 border-accent/50 text-foreground" : "bg-secondary border-border text-muted-foreground hover:border-accent/30"}`}>Complementary</button>
        <button onClick={() => setMode("resonance")}
          className={`font-mono text-[11px] tracking-[0.08em] px-4 py-2 rounded border cursor-pointer transition-colors ${mode === "resonance" ? "bg-accent/10 border-accent/50 text-foreground" : "bg-secondary border-border text-muted-foreground hover:border-accent/30"}`}>Resonance</button>
        {!useLive && <span className="font-mono text-[9px] text-muted-foreground/50 ml-2">demo data — complete assessment to see real matches</span>}
      </div>

      <div className="flex items-center flex-wrap gap-2.5 mt-6">
        <span className="font-mono text-[11px] tracking-[0.1em] text-muted-foreground mr-1.5">Your growth edges:</span>
        {GROWTH.map((g) => <span key={g} className="font-mono text-[11px] text-accent border border-accent/35 rounded px-3 py-1.5 tracking-[0.04em]">{g}</span>)}
      </div>

      {!useLive && (
        <div className="flex items-center gap-2 mt-6 mb-4 flex-wrap">
          {["All", "East", "Central", "West"].map((r) => (
            <button key={r} onClick={() => setRegion(r)}
              className={`font-mono text-[11px] tracking-[0.08em] px-4 py-2 rounded border cursor-pointer transition-colors ${region === r ? "bg-accent/10 border-accent/50 text-foreground" : "bg-secondary border-border text-muted-foreground hover:border-accent/30"}`}>{r}</button>
          ))}
          <span className="font-mono text-[10.5px] text-muted-foreground ml-auto">{shown.length} profiles across your tier</span>
        </div>
      )}

      {matchQuery.isLoading && <div className="mt-6 font-mono text-[11px] text-muted-foreground animate-pulse">Computing matches…</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {shown.map((m, i) => (
          <div key={i} className="bg-secondary border border-border rounded p-6 hover:border-accent/40 transition-colors">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-full border border-accent/30 grid place-items-center font-display text-xl text-accent flex-shrink-0 bg-background">{m.initial}</div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] text-foreground">{m.role}</div>
                {m.city && <div className="font-mono text-[10.5px] text-muted-foreground mt-0.5 tracking-[0.04em]">{m.city} {"\u00b7"} {m.tier}</div>}
              </div>
              <div className="text-right">
                <span className="font-display text-[28px]" style={{ color: MODE_META.altitude.color }}>{m.comp}%</span>
                <small className="block font-mono text-[8.5px] tracking-[0.08em] text-muted-foreground uppercase">{mode}</small>
              </div>
            </div>
            <div className="text-[12.5px] text-muted-foreground mt-4 mb-3">{m.covers}</div>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {m.strengths.map((s: string) => <span key={s} className="font-mono text-[10px] text-muted-foreground bg-background border border-border rounded px-2.5 py-1">{s}</span>)}
            </div>
            <div className="flex gap-2">
              <button className="flex-1 bg-transparent border border-accent/40 text-accent font-mono text-[11px] tracking-[0.1em] uppercase py-3 rounded cursor-pointer hover:bg-accent/5 transition-colors">Request introduction</button>
              <a href={`/synergy-report`} className="flex-1 bg-accent/10 border border-accent/30 text-accent font-mono text-[11px] tracking-[0.1em] uppercase py-3 rounded cursor-pointer hover:bg-accent/15 transition-colors text-center no-underline">Synergy Report</a>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-6 font-mono text-[10.5px] tracking-[0.06em] text-muted-foreground">
        <i className="w-1.5 h-1.5 rounded-full bg-[#9FB98C] flex-shrink-0" style={{ boxShadow: "0 0 8px #9FB98C" }} /> Introductions require mutual consent. No contact details are shared until both parties accept.
      </div>
    </div>
  );
}

// ---- Main export ----
export default function IntelligenceProfile() {
  const [page, setPage] = useState<"profile" | "network">("profile");
  return (
    <div className="min-h-screen w-full bg-background text-foreground font-sans">
      <style>{`@keyframes draw{to{stroke-dashoffset:0;}}
        @media(prefers-reduced-motion:reduce){path{animation:none!important;stroke-dashoffset:0!important;}}
      `}</style>
      <div className="max-w-[1120px] mx-auto px-[clamp(20px,4vw,52px)] py-[clamp(20px,4vw,52px)]">
        <div className="flex items-center justify-between gap-4 flex-wrap pb-5 border-b border-border">
          <span className="font-display text-2xl font-medium text-foreground">AQAL <span className="text-muted-foreground font-normal">{"\u00b7"} Intelligence Assessment</span></span>
          <span className="font-mono text-[10.5px] tracking-[0.12em] text-muted-foreground inline-flex items-center gap-2"><i className="w-1.5 h-1.5 rounded-full bg-[#9FB98C]" style={{ boxShadow: "0 0 8px #9FB98C" }} /> {TOTAL_LINES} LINES {"\u00b7"} EVIDENCE-VERIFIED</span>
        </div>
        <div className="flex gap-1 mt-5">
          <button onClick={() => setPage("profile")} className={`font-mono text-[10.5px] tracking-[0.12em] uppercase px-5 py-2 rounded border cursor-pointer transition-colors ${page === "profile" ? "bg-secondary border-border text-foreground" : "bg-transparent border-border text-muted-foreground hover:text-foreground"}`}>Profile {"\u00b7"} {SCORED_LINES.length} lines</button>
          <button onClick={() => setPage("network")} className={`font-mono text-[10.5px] tracking-[0.12em] uppercase px-5 py-2 rounded border cursor-pointer transition-colors ${page === "network" ? "bg-secondary border-border text-foreground" : "bg-transparent border-border text-muted-foreground hover:text-foreground"}`}>Network {"\u00b7"} nationwide</button>
        </div>
        {page === "profile" ? <ProfilePage /> : <NetworkPage />}
      </div>
    </div>
  );
}
