import React, { useState, useMemo } from "react";
import {
  Users, ArrowRight, Shield, Zap, Target, TrendingUp,
  AlertTriangle, Sparkles, ExternalLink, RotateCcw, Heart,
} from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  complementaryMatch, resonanceMatch, matchBoth,
  growthEdges, strengths, Profile,
} from "@shared/matchEngine";

// ============================================================
// AQAL — Strength Synergy Report
// Paired-profile complementarity tool showing how two members'
// intelligence architectures complement each other.
// ============================================================

const INK = "#141009";
const INK2 = "#1B1610";
const INK3 = "#231C14";
const CREAM = "#F1EADB";
const CREAM2 = "#C4B89F";
const MUTED = "#867A66";
const LINE = "rgba(241,234,219,0.10)";
const CHAMPAGNE = "#E0C68C";
const JADE = "#9BC0B2";
const BRONZE = "#D19A72";
const RED_SOFT = "#D17272";
const VIOLET = "#B8A0D4";

const ALL_LINES = [
  "Logical","Mathematical","Spatial","Linguistic","Volitional",
  "Meta-Cognitive","Intrapersonal","Reflective","Existential","Philosophical",
  "Integrative","Interpersonal","Empathic","Intuitive","Musical",
  "Kinesthetic","Naturalistic","Strategic","Tactical","Adaptive",
  "Resilient","Systematic","Architectural","Adversarial","Interoceptive",
  "Aesthetic","Influence","Humor","Parenting","Seduction",
  "Community-Founding","Financial-Self-Management",
];

// Demo profiles for non-logged-in users to experience the tool
const DEMO_PROFILES: { name: string; scores: Record<string, number> }[] = [
  {
    name: "Profile A — Strategic Architect",
    scores: Object.fromEntries(ALL_LINES.map((l, i) => [l, [
      0.92, 0.88, 0.85, 0.78, 0.90, 0.87, 0.45, 0.42, 0.38, 0.55,
      0.50, 0.35, 0.30, 0.72, 0.25, 0.40, 0.33, 0.95, 0.88, 0.75,
      0.82, 0.93, 0.91, 0.80, 0.28, 0.30, 0.85, 0.55, 0.32, 0.45,
      0.60, 0.88,
    ][i]])),
  },
  {
    name: "Profile B — Empathic Integrator",
    scores: Object.fromEntries(ALL_LINES.map((l, i) => [l, [
      0.55, 0.48, 0.42, 0.85, 0.60, 0.52, 0.92, 0.90, 0.88, 0.85,
      0.91, 0.93, 0.95, 0.80, 0.70, 0.55, 0.72, 0.45, 0.40, 0.65,
      0.58, 0.42, 0.38, 0.30, 0.88, 0.85, 0.48, 0.82, 0.90, 0.72,
      0.88, 0.45,
    ][i]])),
  },
];

// Friction-Point Coaching prescriptions
function getFrictionPoints(profileA: Profile, profileB: Profile): { zone: string; risk: string; prescription: string }[] {
  const aStr = strengths(profileA.scores);
  const bStr = strengths(profileB.scores);
  const aEdges = growthEdges(profileA.scores);
  const bEdges = growthEdges(profileB.scores);

  const frictions: { zone: string; risk: string; prescription: string }[] = [];

  // Collision: both strong in adversarial/influence = power struggles
  if (aStr.includes("Adversarial") && bStr.includes("Adversarial")) {
    frictions.push({
      zone: "Adversarial × Adversarial",
      risk: "Both profiles are high-dominance. Expect power struggles in decision-making.",
      prescription: "Establish explicit decision domains. Alternate final-call authority by topic. Use structured disagreement protocols.",
    });
  }
  if (aStr.includes("Influence") && bStr.includes("Influence")) {
    frictions.push({
      zone: "Influence × Influence",
      risk: "Both want to persuade. Conversations may become competitive rather than collaborative.",
      prescription: "Designate listening rounds. Practice 'steel-manning' each other's positions before responding.",
    });
  }
  // Asymmetry: one high volitional, other low = pace mismatch
  if (aStr.includes("Volitional") && bEdges.includes("Volitional")) {
    frictions.push({
      zone: "Volitional Asymmetry",
      risk: "One partner drives relentlessly while the other needs recovery time. Resentment builds.",
      prescription: "Negotiate explicit sprint/rest cycles. The high-Volitional partner channels drive into solo projects during rest periods.",
    });
  }
  if (bStr.includes("Volitional") && aEdges.includes("Volitional")) {
    frictions.push({
      zone: "Volitional Asymmetry",
      risk: "One partner drives relentlessly while the other needs recovery time. Resentment builds.",
      prescription: "Negotiate explicit sprint/rest cycles. The high-Volitional partner channels drive into solo projects during rest periods.",
    });
  }
  // Emotional asymmetry
  if (aStr.includes("Empathic") && bEdges.includes("Empathic")) {
    frictions.push({
      zone: "Empathic × Low-Empathic",
      risk: "The high-empathy partner feels unheard. The low-empathy partner feels overwhelmed by emotional demands.",
      prescription: "Schedule explicit emotional check-ins (brief, structured). The high-empathy partner learns to request rather than expect attunement.",
    });
  }
  if (bStr.includes("Empathic") && aEdges.includes("Empathic")) {
    frictions.push({
      zone: "Empathic × Low-Empathic",
      risk: "The high-empathy partner feels unheard. The low-empathy partner feels overwhelmed by emotional demands.",
      prescription: "Schedule explicit emotional check-ins (brief, structured). The high-empathy partner learns to request rather than expect attunement.",
    });
  }
  // Financial asymmetry
  if (aStr.includes("Financial-Self-Management") && bEdges.includes("Financial-Self-Management")) {
    frictions.push({
      zone: "Financial × Volitional",
      risk: "One partner is financially disciplined while the other is not. Money becomes a control lever.",
      prescription: "Separate discretionary accounts. Agree on shared-expense thresholds. Never use financial competence as moral authority.",
    });
  }
  if (bStr.includes("Financial-Self-Management") && aEdges.includes("Financial-Self-Management")) {
    frictions.push({
      zone: "Financial × Volitional",
      risk: "One partner is financially disciplined while the other is not. Money becomes a control lever.",
      prescription: "Separate discretionary accounts. Agree on shared-expense thresholds. Never use financial competence as moral authority.",
    });
  }

  // Generic fallback if no specific frictions detected
  if (frictions.length === 0) {
    frictions.push({
      zone: "Low Friction Profile",
      risk: "No major collision points detected. The primary risk is complacency — complementary pairs may avoid necessary confrontation.",
      prescription: "Schedule quarterly 'honest audit' conversations. Assign one partner to play devil's advocate on major decisions.",
    });
  }

  return frictions.slice(0, 4);
}

export default function SynergyReport() {
  const { user } = useAuth();
  const [selectedA, setSelectedA] = useState(0);
  const [selectedB, setSelectedB] = useState(1);
  const [showReport, setShowReport] = useState(false);

  // For logged-in users with real matches, fetch their network
  const matchQuery = trpc.network.matches.useQuery(
    { mode: "complementary", limit: 10 },
    { enabled: !!user, retry: false }
  );

  const liveMatches = matchQuery.data?.matches ?? [];
  const useLive = liveMatches.length > 0;

  // Build profiles from demo or live data
  const profileA: Profile = useMemo(() => DEMO_PROFILES[selectedA], [selectedA]);
  const profileB: Profile = useMemo(() => DEMO_PROFILES[selectedB], [selectedB]);

  // Compute synergy
  const synergy = useMemo(() => {
    if (!showReport) return null;
    return matchBoth(profileA, profileB);
  }, [showReport, profileA, profileB]);

  // Combined coverage
  const combinedCoverage = useMemo(() => {
    if (!showReport) return [];
    return ALL_LINES.map((line) => {
      const a = profileA.scores[line] ?? 0;
      const b = profileB.scores[line] ?? 0;
      const combined = Math.max(a, b);
      const source = a >= b ? "A" : "B";
      const aboveAvg = combined >= 0.65;
      return { line, a, b, combined, source, aboveAvg };
    });
  }, [showReport, profileA, profileB]);

  const aboveAvgCount = combinedCoverage.filter((c) => c.aboveAvg).length;

  // Friction points
  const frictions = useMemo(() => {
    if (!showReport) return [];
    return getFrictionPoints(profileA, profileB);
  }, [showReport, profileA, profileB]);

  const handleGenerate = () => setShowReport(true);
  const handleReset = () => setShowReport(false);

  return (
    <div className="sr-page">
      <style>{`
        .sr-page{background:${INK}; background-image:radial-gradient(ellipse 800px 400px at 20% -5%, rgba(184,160,212,0.06), transparent 60%);
          min-height:100vh; color:${CREAM}; font-family:'Inter',system-ui,-apple-system,sans-serif; letter-spacing:0.01em; padding-bottom:80px;}
        .sr-page a{color:inherit;}
        .sr-page button{font:inherit; color:inherit; background:none; border:none; cursor:pointer;}
        @media (prefers-reduced-motion: reduce){ .sr-page *{animation:none !important; transition:none !important;} }
        @keyframes srFadeUp{from{opacity:0; transform:translateY(10px);} to{opacity:1; transform:translateY(0);}}

        .sr-nav{position:sticky; top:0; z-index:30; backdrop-filter:blur(10px);
          background:rgba(20,16,9,0.80); border-bottom:1px solid ${LINE};}
        .sr-nav-in{max-width:960px; margin:0 auto; display:flex; align-items:center; gap:28px; height:60px; padding:0 22px;}
        .sr-logo{font-family:'Cormorant Garamond',serif; font-weight:600; font-size:21px; letter-spacing:0.02em; text-decoration:none;}
        .sr-logo b{color:${VIOLET};}
        .sr-back{display:flex; align-items:center; gap:6px; font-family:'JetBrains Mono',monospace; font-size:10.5px;
          letter-spacing:0.10em; text-transform:uppercase; color:${CREAM2}; text-decoration:none; transition:color .18s;}
        .sr-back:hover{color:${CREAM};}

        .sr-wrap{max-width:960px; margin:0 auto; padding:0 22px;}

        .sr-header{padding:50px 0 36px; animation:srFadeUp .6s ease both;}
        .sr-eyebrow{font-family:'JetBrains Mono',monospace; font-size:10px; letter-spacing:0.30em; color:${VIOLET}; margin-bottom:14px; text-transform:uppercase;}
        .sr-h1{font-family:'Cormorant Garamond',serif; font-weight:600; font-size:clamp(30px,4.2vw,44px); line-height:1.08; margin:0 0 14px;}
        .sr-sub{font-size:15px; line-height:1.65; color:${CREAM2}; max-width:640px; margin:0 0 28px;}
        .sr-sub strong{color:${CREAM};}

        /* ---- profile selector ---- */
        .sr-selector{background:${INK2}; border:1px solid ${LINE}; border-radius:12px; padding:26px; margin-bottom:28px;
          animation:srFadeUp .5s ease .1s both;}
        .sr-selector-label{font-family:'JetBrains Mono',monospace; font-size:10px; letter-spacing:0.14em; text-transform:uppercase;
          color:${MUTED}; margin-bottom:14px;}
        .sr-selector-row{display:flex; gap:16px; align-items:center; flex-wrap:wrap;}
        .sr-profile-pick{flex:1; min-width:200px;}
        .sr-profile-pick label{display:block; font-family:'JetBrains Mono',monospace; font-size:9.5px; letter-spacing:0.10em;
          text-transform:uppercase; color:${MUTED}; margin-bottom:8px;}
        .sr-select{background:${INK3}; border:1px solid ${LINE}; border-radius:8px; padding:12px 16px;
          color:${CREAM}; font-size:14px; width:100%; appearance:none; cursor:pointer;}
        .sr-select:focus{outline:none; border-color:${VIOLET};}
        .sr-vs{font-family:'Cormorant Garamond',serif; font-size:24px; color:${MUTED}; flex-shrink:0;}

        /* ---- generate button ---- */
        .sr-gen-btn{display:inline-flex; align-items:center; gap:10px; font-family:'JetBrains Mono',monospace;
          font-size:11px; letter-spacing:0.10em; text-transform:uppercase; padding:14px 28px; border-radius:8px;
          background:${VIOLET}; color:${INK}; font-weight:600; transition:all .18s; animation:srFadeUp .5s ease .15s both;}
        .sr-gen-btn:hover{background:#c8b4e0; transform:translateY(-1px);}
        .sr-gen-btn:active{transform:scale(0.97);}

        /* ---- report sections ---- */
        .sr-report{animation:srFadeUp .5s ease both;}
        .sr-report-header{display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom:28px; flex-wrap:wrap;}
        .sr-report-title{font-family:'Cormorant Garamond',serif; font-weight:600; font-size:28px;}
        .sr-reset-btn{display:flex; align-items:center; gap:6px; font-family:'JetBrains Mono',monospace; font-size:10px;
          letter-spacing:0.08em; text-transform:uppercase; color:${CREAM2}; padding:8px 14px; border:1px solid ${LINE};
          border-radius:6px; transition:all .18s;}
        .sr-reset-btn:hover{border-color:${CREAM2}; color:${CREAM};}

        /* scores row */
        .sr-scores{display:grid; grid-template-columns:repeat(auto-fit, minmax(140px, 1fr)); gap:12px; margin-bottom:32px;}
        .sr-score-card{background:${INK2}; border:1px solid ${LINE}; border-radius:10px; padding:18px 20px; text-align:center;}
        .sr-score-num{font-family:'Cormorant Garamond',serif; font-size:36px; font-weight:600; line-height:1;}
        .sr-score-label{font-family:'JetBrains Mono',monospace; font-size:9px; letter-spacing:0.14em; text-transform:uppercase; color:${MUTED}; margin-top:6px;}

        /* combined coverage */
        .sr-section-title{font-family:'Cormorant Garamond',serif; font-weight:600; font-size:22px; margin:36px 0 16px;}
        .sr-section-desc{font-size:13px; color:${CREAM2}; line-height:1.6; margin-bottom:20px; max-width:600px;}
        .sr-coverage-grid{display:grid; grid-template-columns:repeat(auto-fill, minmax(155px, 1fr)); gap:8px; margin-bottom:32px;}
        .sr-cov-cell{padding:12px 14px; border-radius:8px; border:1px solid ${LINE}; transition:border-color .18s;}
        .sr-cov-cell.above{border-color:rgba(155,192,178,0.35); background:rgba(155,192,178,0.04);}
        .sr-cov-cell.below{border-color:rgba(209,114,114,0.25); background:rgba(209,114,114,0.03);}
        .sr-cov-line{font-size:12px; font-weight:500; margin-bottom:4px;}
        .sr-cov-cell.above .sr-cov-line{color:${JADE};}
        .sr-cov-cell.below .sr-cov-line{color:${RED_SOFT};}
        .sr-cov-bar{height:4px; border-radius:2px; background:rgba(241,234,219,0.08); margin-top:6px; overflow:hidden; position:relative;}
        .sr-cov-fill-a{position:absolute; top:0; left:0; height:100%; background:${CHAMPAGNE}; opacity:0.7; border-radius:2px;}
        .sr-cov-fill-b{position:absolute; top:0; left:0; height:100%; background:${VIOLET}; opacity:0.7; border-radius:2px;}
        .sr-cov-source{font-family:'JetBrains Mono',monospace; font-size:9px; letter-spacing:0.06em; color:${MUTED}; margin-top:4px;}

        /* friction points */
        .sr-friction-card{background:${INK2}; border:1px solid rgba(209,114,114,0.25); border-radius:10px; padding:22px; margin-bottom:12px;}
        .sr-friction-zone{font-family:'JetBrains Mono',monospace; font-size:10px; letter-spacing:0.10em; text-transform:uppercase; color:${RED_SOFT}; margin-bottom:8px; display:flex; align-items:center; gap:8px;}
        .sr-friction-risk{font-size:13px; color:${CREAM2}; line-height:1.55; margin-bottom:12px;}
        .sr-friction-rx{font-size:13px; color:${JADE}; line-height:1.55; padding-left:14px; border-left:2px solid rgba(155,192,178,0.3);}

        /* CTA */
        .sr-cta{background:${INK2}; border:1px solid rgba(184,160,212,0.25); border-radius:12px; padding:30px; margin-top:36px;}
        .sr-cta-title{font-family:'Cormorant Garamond',serif; font-weight:600; font-size:22px; margin-bottom:10px;}
        .sr-cta-desc{font-size:13.5px; line-height:1.6; color:${CREAM2}; margin-bottom:20px; max-width:560px;}
        .sr-cta-links{display:flex; flex-wrap:wrap; gap:12px;}
        .sr-cta-link{display:inline-flex; align-items:center; gap:8px; font-family:'JetBrains Mono',monospace;
          font-size:10.5px; letter-spacing:0.08em; text-transform:uppercase; padding:12px 20px; border-radius:7px;
          border:1px solid rgba(184,160,212,0.4); color:${VIOLET}; text-decoration:none; transition:all .18s;}
        .sr-cta-link:hover{background:rgba(184,160,212,0.08); border-color:${VIOLET};}
        .sr-cta-link.primary{background:${VIOLET}; color:${INK}; border-color:${VIOLET}; font-weight:600;}
        .sr-cta-link.primary:hover{background:#c8b4e0;}

        /* edges list */
        .sr-edges{display:flex; flex-wrap:wrap; gap:8px; margin:12px 0;}
        .sr-edge-chip{font-family:'JetBrains Mono',monospace; font-size:10.5px; padding:6px 12px; border-radius:6px; border:1px solid ${LINE};}
        .sr-edge-chip.covers{border-color:rgba(155,192,178,0.4); color:${JADE}; background:rgba(155,192,178,0.06);}
        .sr-edge-chip.needs{border-color:rgba(224,198,140,0.4); color:${CHAMPAGNE}; background:rgba(224,198,140,0.06);}
        .sr-edge-chip.shared{border-color:rgba(184,160,212,0.4); color:${VIOLET}; background:rgba(184,160,212,0.06);}

        /* disclaimer */
        .sr-disclaimer{margin-top:36px; padding:18px 22px; background:${INK2}; border:1px solid ${LINE}; border-radius:10px;
          font-size:11.5px; color:${MUTED}; line-height:1.6;}
        .sr-disclaimer strong{color:${CREAM2};}

        @media (max-width:640px){
          .sr-nav-in{gap:16px; padding:0 16px;}
          .sr-wrap{padding:0 16px;}
          .sr-selector-row{flex-direction:column; gap:12px;}
          .sr-vs{display:none;}
          .sr-coverage-grid{grid-template-columns:repeat(auto-fill, minmax(130px, 1fr));}
          .sr-scores{grid-template-columns:repeat(2, 1fr);}
        }
      `}</style>

      {/* NAV */}
      <div className="sr-nav">
        <div className="sr-nav-in">
          <Link href="/" className="sr-logo">AQAL<b>.</b></Link>
          <Link href="/" className="sr-back">← Home</Link>
        </div>
      </div>

      <div className="sr-wrap">
        {/* HEADER */}
        <div className="sr-header">
          <div className="sr-eyebrow">STRENGTH SYNERGY REPORT</div>
          <h1 className="sr-h1">How Two Minds Complete Each Other</h1>
          <p className="sr-sub">
            Select two intelligence profiles and see how their combined architecture covers the 32-line framework.
            Discover <strong>complementary zones</strong> where one partner's strength shields the other's growth edge,
            <strong> shared peaks</strong> where you'll click instantly, and <strong>friction points</strong> where
            collision is predictable — with prescriptions for navigating each one.
          </p>
        </div>

        {!showReport ? (
          <>
            {/* PROFILE SELECTOR */}
            <div className="sr-selector">
              <div className="sr-selector-label">Select two profiles to compare</div>
              {!useLive && (
                <p style={{ fontSize: "12px", color: MUTED, marginBottom: "16px" }}>
                  Demo mode — complete your assessment and match with other members to generate real synergy reports.
                </p>
              )}
              <div className="sr-selector-row">
                <div className="sr-profile-pick">
                  <label>Profile A</label>
                  <select
                    className="sr-select"
                    value={selectedA}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedA(Number(e.target.value))}
                  >
                    {DEMO_PROFILES.map((p, i) => (
                      <option key={i} value={i}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="sr-vs">×</div>
                <div className="sr-profile-pick">
                  <label>Profile B</label>
                  <select
                    className="sr-select"
                    value={selectedB}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedB(Number(e.target.value))}
                  >
                    {DEMO_PROFILES.map((p, i) => (
                      <option key={i} value={i}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* GENERATE */}
            <button type="button" className="sr-gen-btn" onClick={handleGenerate}>
              Generate Synergy Report <Sparkles size={14} />
            </button>
          </>
        ) : synergy && (
          <div className="sr-report">
            <div className="sr-report-header">
              <h2 className="sr-report-title">Synergy Analysis</h2>
              <button type="button" className="sr-reset-btn" onClick={handleReset}>
                <RotateCcw size={12} /> New Comparison
              </button>
            </div>

            {/* SCORE CARDS */}
            <div className="sr-scores">
              <div className="sr-score-card">
                <div className="sr-score-num" style={{ color: JADE }}>{synergy.complementary.score}%</div>
                <div className="sr-score-label">Complementary Fit</div>
              </div>
              <div className="sr-score-card">
                <div className="sr-score-num" style={{ color: VIOLET }}>{synergy.resonance.score}%</div>
                <div className="sr-score-label">Resonance / Click</div>
              </div>
              <div className="sr-score-card">
                <div className="sr-score-num" style={{ color: CHAMPAGNE }}>{aboveAvgCount}/32</div>
                <div className="sr-score-label">Combined Coverage</div>
              </div>
              <div className="sr-score-card">
                <div className="sr-score-num" style={{ color: CREAM2 }}>{Math.round((aboveAvgCount / 32) * 100)}%</div>
                <div className="sr-score-label">Lines Above Avg</div>
              </div>
            </div>

            {/* WHAT THEY COVER FOR YOU */}
            <h3 className="sr-section-title">
              <Shield size={20} style={{ display: "inline", marginRight: "10px", color: JADE }} />
              What Profile B Covers for Profile A
            </h3>
            <p className="sr-section-desc">
              These are Profile A's growth edges that Profile B's strengths can shield and develop through proximity.
            </p>
            <div className="sr-edges">
              {synergy.complementary.coversYourEdges.length > 0
                ? synergy.complementary.coversYourEdges.map((e) => (
                    <span key={e} className="sr-edge-chip covers">{e}</span>
                  ))
                : <span style={{ fontSize: "12px", color: MUTED }}>No direct edge coverage detected at threshold</span>
              }
            </div>

            {/* WHAT YOU COVER FOR THEM */}
            <h3 className="sr-section-title">
              <Heart size={20} style={{ display: "inline", marginRight: "10px", color: CHAMPAGNE }} />
              What Profile A Covers for Profile B
            </h3>
            <p className="sr-section-desc">
              These are Profile B's growth edges that Profile A's strengths can shield and develop.
            </p>
            <div className="sr-edges">
              {synergy.complementary.theyNeedFromYou.length > 0
                ? synergy.complementary.theyNeedFromYou.map((e) => (
                    <span key={e} className="sr-edge-chip needs">{e}</span>
                  ))
                : <span style={{ fontSize: "12px", color: MUTED }}>No direct edge coverage detected at threshold</span>
              }
            </div>

            {/* SHARED PEAKS */}
            {synergy.resonance.sharedPeaks.length > 0 && (
              <>
                <h3 className="sr-section-title">
                  <Zap size={20} style={{ display: "inline", marginRight: "10px", color: VIOLET }} />
                  Shared Peaks — Where You'll Click
                </h3>
                <p className="sr-section-desc">
                  Both profiles are elite on these lines. Expect instant rapport, deep conversation, and mutual respect in these domains.
                </p>
                <div className="sr-edges">
                  {synergy.resonance.sharedPeaks.map((p: string) => (
                    <span key={p} className="sr-edge-chip shared">{p}</span>
                  ))}
                </div>
              </>
            )}

            {/* COMBINED COVERAGE MAP */}
            <h3 className="sr-section-title">
              <Target size={20} style={{ display: "inline", marginRight: "10px", color: CREAM }} />
              Combined Intelligence Coverage
            </h3>
            <p className="sr-section-desc">
              Together, your combined profile covers <strong>{aboveAvgCount} of 32</strong> dimensions at above-average levels.
              Gold bars = Profile A's contribution. Purple bars = Profile B's contribution.
            </p>
            <div className="sr-coverage-grid">
              {combinedCoverage.map((c) => (
                <div key={c.line} className={`sr-cov-cell ${c.aboveAvg ? "above" : "below"}`}>
                  <div className="sr-cov-line">{c.line}</div>
                  <div className="sr-cov-bar">
                    <div className="sr-cov-fill-a" style={{ width: `${c.a * 100}%` }} />
                    <div className="sr-cov-fill-b" style={{ width: `${c.b * 100}%`, opacity: 0.5 }} />
                  </div>
                  <div className="sr-cov-source">
                    Best: {c.source === "A" ? "Profile A" : "Profile B"} ({Math.round(c.combined * 100)}%)
                  </div>
                </div>
              ))}
            </div>

            {/* FRICTION POINTS */}
            <h3 className="sr-section-title">
              <AlertTriangle size={20} style={{ display: "inline", marginRight: "10px", color: RED_SOFT }} />
              Predicted Friction Points
            </h3>
            <p className="sr-section-desc">
              Where your combined architecture creates predictable collision. Each includes a coaching prescription for navigation.
            </p>
            {frictions.map((f, i) => (
              <div key={i} className="sr-friction-card">
                <div className="sr-friction-zone">
                  <AlertTriangle size={12} /> {f.zone}
                </div>
                <div className="sr-friction-risk">{f.risk}</div>
                <div className="sr-friction-rx"><strong>Rx:</strong> {f.prescription}</div>
              </div>
            ))}

            {/* CTA */}
            <div className="sr-cta">
              <div className="sr-cta-title">Want a real synergy report with your actual profile?</div>
              <p className="sr-cta-desc">
                Complete the AQAL assessment to generate your 32-line intelligence architecture.
                Then match with other members and generate real synergy reports showing exactly how
                your combined profiles complement, resonate, and where to watch for friction.
              </p>
              <div className="sr-cta-links">
                <Link href="/assessment" className="sr-cta-link primary">
                  Take the Assessment <ArrowRight size={12} />
                </Link>
                <Link href="/weakness-finder" className="sr-cta-link">
                  Explore Weakness Clusters <ExternalLink size={12} />
                </Link>
              </div>
            </div>

            {/* DISCLAIMER */}
            <div className="sr-disclaimer">
              <strong>Honest framing:</strong> This report uses transparent heuristics for surfacing complementary and resonant profile shapes.
              It is NOT a validated predictor of relationship or partnership success — no such validated model exists.
              Treat these as suggested starting points for conversation, not deterministic compatibility scores.
              All introductions require mutual consent.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
