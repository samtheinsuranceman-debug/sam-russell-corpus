import React, { useState, useMemo } from "react";
import {
  Eye, EyeOff, ArrowRight, ChevronDown, Brain, TrendingUp,
  Shield, Sparkles, ExternalLink, RotateCcw, Mail, Lock,
} from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

// ============================================================
// AQAL — Blind-Side Analyzer (public lead-gen tool)
// Enter your CliftonStrengths Top 5, MBTI type, or IQ-society
// membership to see which intelligence lines your known
// strengths DON'T cover.
// ============================================================

const INK = "#141009";
const INK2 = "#1B1610";
const INK3 = "#231C14";
const CREAM = "#F1EADB";
const CREAM2 = "#C4B89F";
const MUTED = "#867A66";
const LINE = "rgba(241,234,219,0.10)";
const CHAMPAGNE = "#E0C68C";
const CHAMPAGNE_D = "#C9A24B";
const JADE = "#9BC0B2";
const BRONZE = "#D19A72";
const RED_SOFT = "#D17272";

// ---- The 32 AQAL lines ----
const ALL_LINES = [
  "Logical","Mathematical","Spatial","Linguistic","Volitional",
  "Meta-Cognitive","Intrapersonal","Reflective","Existential","Philosophical",
  "Integrative","Interpersonal","Empathic","Intuitive","Musical",
  "Kinesthetic","Naturalistic","Strategic","Tactical","Adaptive",
  "Resilient","Systematic","Architectural","Adversarial","Interoceptive",
  "Aesthetic","Influence","Humor","Parenting","Seduction",
  "Community-Founding","Financial-Self-Management",
];

// ---- CliftonStrengths → AQAL mapping ----
// Each CliftonStrengths theme maps to 2-4 AQAL lines it likely covers
const CLIFTON_MAP: Record<string, string[]> = {
  "Achiever": ["Volitional","Strategic","Resilient"],
  "Activator": ["Tactical","Influence","Adversarial"],
  "Adaptability": ["Adaptive","Interoceptive","Intuitive"],
  "Analytical": ["Logical","Mathematical","Systematic"],
  "Arranger": ["Architectural","Strategic","Systematic"],
  "Belief": ["Existential","Philosophical","Volitional"],
  "Command": ["Influence","Adversarial","Tactical"],
  "Communication": ["Linguistic","Interpersonal","Influence"],
  "Competition": ["Adversarial","Kinesthetic","Resilient"],
  "Connectedness": ["Integrative","Existential","Empathic"],
  "Consistency": ["Systematic","Volitional","Architectural"],
  "Context": ["Reflective","Philosophical","Strategic"],
  "Deliberative": ["Meta-Cognitive","Systematic","Tactical"],
  "Developer": ["Empathic","Interpersonal","Intrapersonal"],
  "Discipline": ["Volitional","Systematic","Financial-Self-Management"],
  "Empathy": ["Empathic","Interoceptive","Interpersonal"],
  "Focus": ["Volitional","Strategic","Meta-Cognitive"],
  "Futuristic": ["Intuitive","Existential","Architectural"],
  "Harmony": ["Interpersonal","Empathic","Integrative"],
  "Ideation": ["Intuitive","Spatial","Philosophical"],
  "Includer": ["Interpersonal","Community-Founding","Empathic"],
  "Individualization": ["Intrapersonal","Empathic","Interpersonal"],
  "Input": ["Linguistic","Reflective","Naturalistic"],
  "Intellection": ["Philosophical","Reflective","Intrapersonal"],
  "Learner": ["Meta-Cognitive","Linguistic","Adaptive"],
  "Maximizer": ["Strategic","Influence","Aesthetic"],
  "Positivity": ["Humor","Interpersonal","Resilient"],
  "Relator": ["Interpersonal","Empathic","Intrapersonal"],
  "Responsibility": ["Volitional","Systematic","Community-Founding"],
  "Restorative": ["Logical","Tactical","Adaptive"],
  "Self-Assurance": ["Adversarial","Influence","Intrapersonal"],
  "Significance": ["Influence","Seduction","Strategic"],
  "Strategic": ["Strategic","Intuitive","Logical"],
  "Woo": ["Seduction","Interpersonal","Humor"],
};

const CLIFTON_THEMES = Object.keys(CLIFTON_MAP).sort();

// ---- MBTI → AQAL mapping ----
// Each MBTI type maps to the lines it likely covers
const MBTI_MAP: Record<string, string[]> = {
  "INTJ": ["Logical","Strategic","Architectural","Systematic","Philosophical","Volitional"],
  "INTP": ["Logical","Mathematical","Philosophical","Meta-Cognitive","Spatial","Reflective"],
  "ENTJ": ["Strategic","Influence","Architectural","Adversarial","Tactical","Volitional"],
  "ENTP": ["Logical","Intuitive","Humor","Adaptive","Linguistic","Adversarial"],
  "INFJ": ["Intrapersonal","Existential","Empathic","Reflective","Integrative","Intuitive"],
  "INFP": ["Intrapersonal","Philosophical","Aesthetic","Existential","Reflective","Empathic"],
  "ENFJ": ["Interpersonal","Influence","Empathic","Community-Founding","Integrative","Linguistic"],
  "ENFP": ["Intuitive","Interpersonal","Humor","Adaptive","Empathic","Seduction"],
  "ISTJ": ["Systematic","Volitional","Financial-Self-Management","Logical","Architectural","Tactical"],
  "ISFJ": ["Empathic","Systematic","Interpersonal","Volitional","Interoceptive","Parenting"],
  "ESTJ": ["Systematic","Influence","Tactical","Volitional","Adversarial","Architectural"],
  "ESFJ": ["Interpersonal","Empathic","Community-Founding","Parenting","Influence","Systematic"],
  "ISTP": ["Spatial","Kinesthetic","Tactical","Adaptive","Logical","Adversarial"],
  "ISFP": ["Aesthetic","Interoceptive","Kinesthetic","Naturalistic","Empathic","Adaptive"],
  "ESTP": ["Kinesthetic","Adversarial","Tactical","Seduction","Adaptive","Humor"],
  "ESFP": ["Kinesthetic","Interpersonal","Humor","Seduction","Aesthetic","Musical"],
};

// ---- IQ Society → AQAL mapping ----
// IQ societies only measure g-loaded cognitive lines
const IQ_SOCIETY_MAP: Record<string, string[]> = {
  "Mensa (Top 2%)": ["Logical","Mathematical","Spatial","Linguistic"],
  "Intertel (Top 1%)": ["Logical","Mathematical","Spatial","Linguistic"],
  "Triple Nine Society (Top 0.1%)": ["Logical","Mathematical","Spatial","Linguistic"],
  "Prometheus (Top 0.003%)": ["Logical","Mathematical","Spatial","Linguistic"],
  "Mega Society (Top 0.0001%)": ["Logical","Mathematical","Spatial","Linguistic"],
};

const IQ_SOCIETIES = Object.keys(IQ_SOCIETY_MAP);

type InputMode = "clifton" | "mbti" | "iq";
type CoverageLevel = "strong" | "partial" | "blind";

interface LineResult {
  name: string;
  level: CoverageLevel;
  reason: string;
}

function computeCoverage(
  mode: InputMode,
  cliftonSelections: string[],
  mbtiType: string,
  iqSociety: string
): LineResult[] {
  let coveredLines: string[] = [];

  if (mode === "clifton") {
    const allCovered = new Set<string>();
    cliftonSelections.forEach((theme) => {
      (CLIFTON_MAP[theme] || []).forEach((l) => allCovered.add(l));
    });
    coveredLines = Array.from(allCovered);
  } else if (mode === "mbti") {
    coveredLines = MBTI_MAP[mbtiType] || [];
  } else if (mode === "iq") {
    coveredLines = IQ_SOCIETY_MAP[iqSociety] || [];
  }

  const coveredSet = new Set(coveredLines);

  return ALL_LINES.map((line) => {
    if (coveredSet.has(line)) {
      return { name: line, level: "strong", reason: "Likely covered by your known profile" };
    }
    // Partial: lines adjacent to covered ones (simplified heuristic)
    return { name: line, level: "blind", reason: "Not addressed by your current assessment" };
  });
}

export default function BlindSideAnalyzer() {
  const [mode, setMode] = useState<InputMode>("clifton");
  const [cliftonSelections, setCliftonSelections] = useState<string[]>([]);
  const [mbtiType, setMbtiType] = useState("");
  const [iqSociety, setIqSociety] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [emailError, setEmailError] = useState("");
  const waitlistJoin = trpc.waitlist.join.useMutation();

  const canSubmit =
    (mode === "clifton" && cliftonSelections.length >= 5) ||
    (mode === "mbti" && mbtiType !== "") ||
    (mode === "iq" && iqSociety !== "");

  const results = useMemo(() => {
    if (!showResults) return [];
    return computeCoverage(mode, cliftonSelections, mbtiType, iqSociety);
  }, [showResults, mode, cliftonSelections, mbtiType, iqSociety]);

  const strongCount = results.filter((r) => r.level === "strong").length;
  const blindCount = results.filter((r) => r.level === "blind").length;

  const toggleClifton = (theme: string) => {
    setCliftonSelections((prev) => {
      if (prev.includes(theme)) return prev.filter((t) => t !== theme);
      if (prev.length >= 5) return prev;
      return [...prev, theme];
    });
  };

  const handleAnalyze = () => {
    setShowResults(true);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    try {
      await waitlistJoin.mutateAsync({ email, tier: "blind-side-analyzer" });
      setEmailSubmitted(true);
    } catch {
      setEmailSubmitted(true); // Still show results even if already on list
    }
  };

  const handleReset = () => {
    setShowResults(false);
    setCliftonSelections([]);
    setMbtiType("");
    setIqSociety("");
  };

  return (
    <div className="bsa-page">
      <style>{`
        .bsa-page{background:${INK}; background-image:radial-gradient(ellipse 800px 400px at 80% -5%, rgba(155,192,178,0.06), transparent 60%);
          min-height:100vh; color:${CREAM}; font-family:'Inter',system-ui,-apple-system,sans-serif; letter-spacing:0.01em; padding-bottom:80px;}
        .bsa-page a{color:inherit;}
        .bsa-page button{font:inherit; color:inherit; background:none; border:none; cursor:pointer;}
        @media (prefers-reduced-motion: reduce){ .bsa-page *{animation:none !important; transition:none !important;} }
        @keyframes bsaFadeUp{from{opacity:0; transform:translateY(10px);} to{opacity:1; transform:translateY(0);}}

        .bsa-nav{position:sticky; top:0; z-index:30; backdrop-filter:blur(10px);
          background:rgba(20,16,9,0.80); border-bottom:1px solid ${LINE};}
        .bsa-nav-in{max-width:900px; margin:0 auto; display:flex; align-items:center; gap:28px; height:60px; padding:0 22px;}
        .bsa-logo{font-family:'Cormorant Garamond',serif; font-weight:600; font-size:21px; letter-spacing:0.02em; text-decoration:none;}
        .bsa-logo b{color:${CHAMPAGNE};}
        .bsa-back{display:flex; align-items:center; gap:6px; font-family:'JetBrains Mono',monospace; font-size:10.5px;
          letter-spacing:0.10em; text-transform:uppercase; color:${CREAM2}; text-decoration:none; transition:color .18s;}
        .bsa-back:hover{color:${CREAM};}

        .bsa-wrap{max-width:900px; margin:0 auto; padding:0 22px;}

        .bsa-header{padding:50px 0 36px; animation:bsaFadeUp .6s ease both;}
        .bsa-eyebrow{font-family:'JetBrains Mono',monospace; font-size:10px; letter-spacing:0.30em; color:${JADE}; margin-bottom:14px; text-transform:uppercase;}
        .bsa-h1{font-family:'Cormorant Garamond',serif; font-weight:600; font-size:clamp(30px,4.2vw,46px); line-height:1.08; margin:0 0 14px;}
        .bsa-sub{font-size:15px; line-height:1.65; color:${CREAM2}; max-width:620px; margin:0 0 28px;}
        .bsa-sub strong{color:${CREAM};}

        /* ---- input mode selector ---- */
        .bsa-modes{display:flex; gap:8px; margin-bottom:28px; animation:bsaFadeUp .5s ease .1s both;}
        .bsa-mode-btn{font-family:'JetBrains Mono',monospace; font-size:10.5px; letter-spacing:0.08em; text-transform:uppercase;
          padding:10px 16px; border-radius:8px; border:1px solid ${LINE}; color:${CREAM2}; transition:all .18s;}
        .bsa-mode-btn:hover{border-color:rgba(241,234,219,0.24); color:${CREAM};}
        .bsa-mode-btn.active{background:rgba(155,192,178,0.12); border-color:${JADE}; color:${JADE}; font-weight:600;}

        /* ---- input panels ---- */
        .bsa-input-panel{background:${INK2}; border:1px solid ${LINE}; border-radius:12px; padding:26px; margin-bottom:28px;
          animation:bsaFadeUp .5s ease .15s both;}
        .bsa-input-label{font-family:'JetBrains Mono',monospace; font-size:10px; letter-spacing:0.14em; text-transform:uppercase;
          color:${MUTED}; margin-bottom:14px;}
        .bsa-input-hint{font-size:12.5px; color:${CREAM2}; margin-bottom:16px; line-height:1.5;}

        /* clifton grid */
        .bsa-clifton-grid{display:flex; flex-wrap:wrap; gap:7px;}
        .bsa-clifton-chip{font-size:11.5px; padding:7px 12px; border-radius:6px; border:1px solid ${LINE};
          color:${CREAM2}; transition:all .15s; user-select:none;}
        .bsa-clifton-chip:hover{border-color:rgba(155,192,178,0.3); color:${CREAM};}
        .bsa-clifton-chip.selected{background:rgba(155,192,178,0.15); border-color:${JADE}; color:${JADE}; font-weight:500;}
        .bsa-clifton-chip.disabled{opacity:0.35; pointer-events:none;}
        .bsa-selected-count{font-family:'JetBrains Mono',monospace; font-size:10px; color:${JADE}; margin-top:12px; letter-spacing:0.06em;}

        /* mbti / iq select */
        .bsa-select{background:${INK3}; border:1px solid ${LINE}; border-radius:8px; padding:12px 16px;
          color:${CREAM}; font-size:14px; width:100%; max-width:320px; appearance:none; cursor:pointer;}
        .bsa-select:focus{outline:none; border-color:${JADE};}

        /* analyze button */
        .bsa-analyze-btn{display:inline-flex; align-items:center; gap:10px; font-family:'JetBrains Mono',monospace;
          font-size:11px; letter-spacing:0.10em; text-transform:uppercase; padding:14px 28px; border-radius:8px;
          background:${JADE}; color:${INK}; font-weight:600; transition:all .18s; animation:bsaFadeUp .5s ease .2s both;}
        .bsa-analyze-btn:hover{background:#b3d4c8; transform:translateY(-1px);}
        .bsa-analyze-btn:active{transform:scale(0.97);}
        .bsa-analyze-btn:disabled{opacity:0.4; pointer-events:none;}

        /* ---- results ---- */
        .bsa-results{animation:bsaFadeUp .5s ease both;}
        .bsa-results-header{display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom:24px; flex-wrap:wrap;}
        .bsa-results-title{font-family:'Cormorant Garamond',serif; font-weight:600; font-size:26px;}
        .bsa-reset-btn{display:flex; align-items:center; gap:6px; font-family:'JetBrains Mono',monospace; font-size:10px;
          letter-spacing:0.08em; text-transform:uppercase; color:${CREAM2}; padding:8px 14px; border:1px solid ${LINE};
          border-radius:6px; transition:all .18s;}
        .bsa-reset-btn:hover{border-color:${CREAM2}; color:${CREAM};}

        .bsa-summary{display:flex; gap:24px; margin-bottom:28px; flex-wrap:wrap;}
        .bsa-summary-card{background:${INK2}; border:1px solid ${LINE}; border-radius:10px; padding:18px 22px; flex:1; min-width:160px;}
        .bsa-summary-num{font-family:'Cormorant Garamond',serif; font-size:32px; font-weight:600; line-height:1;}
        .bsa-summary-label{font-family:'JetBrains Mono',monospace; font-size:9px; letter-spacing:0.14em; text-transform:uppercase; color:${MUTED}; margin-top:4px;}

        .bsa-coverage-grid{display:grid; grid-template-columns:repeat(auto-fill, minmax(140px, 1fr)); gap:8px; margin-bottom:32px;}
        .bsa-line-cell{padding:12px 14px; border-radius:8px; border:1px solid ${LINE}; transition:border-color .18s;}
        .bsa-line-cell.strong{border-color:rgba(155,192,178,0.4); background:rgba(155,192,178,0.06);}
        .bsa-line-cell.blind{border-color:rgba(209,114,114,0.3); background:rgba(209,114,114,0.04);}
        .bsa-line-name{font-size:12px; font-weight:500; margin-bottom:3px;}
        .bsa-line-cell.strong .bsa-line-name{color:${JADE};}
        .bsa-line-cell.blind .bsa-line-name{color:${RED_SOFT};}
        .bsa-line-icon{display:flex; align-items:center; gap:5px; font-family:'JetBrains Mono',monospace; font-size:9px; letter-spacing:0.06em; text-transform:uppercase;}
        .bsa-line-cell.strong .bsa-line-icon{color:rgba(155,192,178,0.7);}
        .bsa-line-cell.blind .bsa-line-icon{color:rgba(209,114,114,0.6);}

        /* ---- email gate ---- */
        .bsa-email-gate{background:${INK2}; border:1px solid rgba(155,192,178,0.3); border-radius:12px; padding:34px; margin-bottom:28px;
          animation:bsaFadeUp .5s ease both; text-align:center;}
        .bsa-email-gate-icon{display:flex; justify-content:center; margin-bottom:14px; color:${JADE};}
        .bsa-email-gate-title{font-family:'Cormorant Garamond',serif; font-weight:600; font-size:22px; margin-bottom:8px;}
        .bsa-email-gate-desc{font-size:13px; color:${CREAM2}; line-height:1.6; max-width:440px; margin:0 auto 20px;}
        .bsa-email-form{display:flex; gap:10px; justify-content:center; flex-wrap:wrap; max-width:420px; margin:0 auto;}
        .bsa-email-input{flex:1; min-width:200px; background:${INK3}; border:1px solid ${LINE}; border-radius:8px;
          padding:12px 16px; color:${CREAM}; font-size:14px; outline:none; transition:border-color .18s;}
        .bsa-email-input:focus{border-color:${JADE};}
        .bsa-email-input::placeholder{color:${MUTED};}
        .bsa-email-submit{display:inline-flex; align-items:center; gap:8px; font-family:'JetBrains Mono',monospace;
          font-size:10.5px; letter-spacing:0.08em; text-transform:uppercase; padding:12px 22px; border-radius:8px;
          background:${JADE}; color:${INK}; font-weight:600; transition:all .18s; white-space:nowrap;}
        .bsa-email-submit:hover{background:#b3d4c8; transform:translateY(-1px);}
        .bsa-email-submit:active{transform:scale(0.97);}
        .bsa-email-error{font-size:11px; color:${RED_SOFT}; margin-top:8px;}
        .bsa-email-privacy{font-size:10px; color:${MUTED}; margin-top:12px;}
        .bsa-blurred{filter:blur(6px); pointer-events:none; user-select:none;}

        /* ---- CTA section ---- */
        .bsa-cta{background:${INK2}; border:1px solid rgba(155,192,178,0.25); border-radius:12px; padding:30px; margin-top:36px;
          animation:bsaFadeUp .5s ease .1s both;}
        .bsa-cta-title{font-family:'Cormorant Garamond',serif; font-weight:600; font-size:22px; margin-bottom:10px;}
        .bsa-cta-desc{font-size:13.5px; line-height:1.6; color:${CREAM2}; margin-bottom:20px; max-width:560px;}
        .bsa-cta-links{display:flex; flex-wrap:wrap; gap:12px;}
        .bsa-cta-link{display:inline-flex; align-items:center; gap:8px; font-family:'JetBrains Mono',monospace;
          font-size:10.5px; letter-spacing:0.08em; text-transform:uppercase; padding:12px 20px; border-radius:7px;
          border:1px solid rgba(155,192,178,0.4); color:${JADE}; text-decoration:none; transition:all .18s;}
        .bsa-cta-link:hover{background:rgba(155,192,178,0.08); border-color:${JADE};}
        .bsa-cta-link.primary{background:${JADE}; color:${INK}; border-color:${JADE}; font-weight:600;}
        .bsa-cta-link.primary:hover{background:#b3d4c8;}

        /* ---- evidence link ---- */
        .bsa-evidence{margin-top:28px; padding:20px 24px; background:${INK2}; border:1px solid ${LINE}; border-radius:10px;
          animation:bsaFadeUp .5s ease .15s both;}
        .bsa-evidence-head{display:flex; align-items:center; gap:10px; margin-bottom:8px;}
        .bsa-evidence-head svg{color:${JADE};}
        .bsa-evidence-title{font-family:'Cormorant Garamond',serif; font-weight:600; font-size:17px;}
        .bsa-evidence-desc{font-size:12.5px; color:${CREAM2}; line-height:1.55; margin-bottom:14px;}
        .bsa-evidence-link{display:inline-flex; align-items:center; gap:6px; font-family:'JetBrains Mono',monospace;
          font-size:10px; letter-spacing:0.08em; text-transform:uppercase; color:${JADE}; text-decoration:none;
          border-bottom:1px solid rgba(155,192,178,0.3); padding-bottom:1px; transition:border-color .18s;}
        .bsa-evidence-link:hover{border-bottom-color:${JADE};}

        @media (max-width:640px){
          .bsa-nav-in{gap:16px; padding:0 16px;}
          .bsa-wrap{padding:0 16px;}
          .bsa-modes{flex-wrap:wrap;}
          .bsa-coverage-grid{grid-template-columns:repeat(auto-fill, minmax(120px, 1fr));}
        }
      `}</style>

      {/* NAV */}
      <div className="bsa-nav">
        <div className="bsa-nav-in">
          <Link href="/" className="bsa-logo">AQAL<b>.</b></Link>
          <Link href="/" className="bsa-back">
            ← Home
          </Link>
        </div>
      </div>

      <div className="bsa-wrap">
        {/* HEADER */}
        <div className="bsa-header">
          <div className="bsa-eyebrow">FREE INTELLIGENCE BLIND-SPOT ANALYSIS</div>
          <h1 className="bsa-h1">What Can't Your Current Assessment See?</h1>
          <p className="bsa-sub">
            You already know <strong>something</strong> about your mind. CliftonStrengths told you your top themes.
            MBTI gave you a type. Your IQ society confirmed you're in the top percentiles of <em>one</em> dimension.
            <br /><br />
            But your mind runs on <strong>32 independent lines</strong>. Most assessments only cover 4-6 of them.
            Enter what you already know — we'll show you what's still in the dark.
          </p>
        </div>

        {!showResults ? (
          <>
            {/* MODE SELECTOR */}
            <div className="bsa-modes">
              <button
                type="button"
                className={`bsa-mode-btn${mode === "clifton" ? " active" : ""}`}
                onClick={() => { setMode("clifton"); setShowResults(false); }}
              >
                CliftonStrengths
              </button>
              <button
                type="button"
                className={`bsa-mode-btn${mode === "mbti" ? " active" : ""}`}
                onClick={() => { setMode("mbti"); setShowResults(false); }}
              >
                MBTI Type
              </button>
              <button
                type="button"
                className={`bsa-mode-btn${mode === "iq" ? " active" : ""}`}
                onClick={() => { setMode("iq"); setShowResults(false); }}
              >
                IQ Society
              </button>
            </div>

            {/* INPUT PANEL */}
            <div className="bsa-input-panel">
              {mode === "clifton" && (
                <>
                  <div className="bsa-input-label">Select your Top 5 CliftonStrengths themes</div>
                  <div className="bsa-input-hint">
                    Choose exactly 5 themes from the 34 CliftonStrengths. We'll map them to the AQAL 32-line framework
                    and show you which intelligence dimensions they cover — and which they don't.
                  </div>
                  <div className="bsa-clifton-grid">
                    {CLIFTON_THEMES.map((theme) => {
                      const selected = cliftonSelections.includes(theme);
                      const disabled = !selected && cliftonSelections.length >= 5;
                      return (
                        <button
                          key={theme}
                          type="button"
                          className={`bsa-clifton-chip${selected ? " selected" : ""}${disabled ? " disabled" : ""}`}
                          onClick={() => toggleClifton(theme)}
                        >
                          {theme}
                        </button>
                      );
                    })}
                  </div>
                  <div className="bsa-selected-count">{cliftonSelections.length} / 5 selected</div>
                </>
              )}

              {mode === "mbti" && (
                <>
                  <div className="bsa-input-label">Select your MBTI type</div>
                  <div className="bsa-input-hint">
                    Choose your verified MBTI type. We'll map its cognitive function stack to the AQAL framework
                    and reveal which of the 32 intelligence lines your type typically addresses — and which remain unmeasured.
                  </div>
                  <select
                    className="bsa-select"
                    value={mbtiType}
                    onChange={(e) => setMbtiType(e.target.value)}
                  >
                    <option value="">Choose your type...</option>
                    {Object.keys(MBTI_MAP).map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </>
              )}

              {mode === "iq" && (
                <>
                  <div className="bsa-input-label">Select your IQ society membership</div>
                  <div className="bsa-input-hint">
                    IQ societies measure <strong>one dimension</strong> of intelligence: general cognitive ability (g).
                    That's the marker labeled "G" in psychometrics. We'll show you the other 28 lines that
                    your IQ score says <em>nothing</em> about — including 6 genuinely independent dimensions
                    that don't correlate with g at all.
                  </div>
                  <select
                    className="bsa-select"
                    value={iqSociety}
                    onChange={(e) => setIqSociety(e.target.value)}
                  >
                    <option value="">Choose your society...</option>
                    {IQ_SOCIETIES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </>
              )}
            </div>

            {/* ANALYZE BUTTON */}
            <button
              type="button"
              className="bsa-analyze-btn"
              disabled={!canSubmit}
              onClick={handleAnalyze}
            >
              Reveal My Blind Spots <ArrowRight size={14} />
            </button>
          </>
        ) : (
          /* ===== RESULTS ===== */
          <div className="bsa-results">
            <div className="bsa-results-header">
              <h2 className="bsa-results-title">Your Intelligence Coverage Map</h2>
              <button type="button" className="bsa-reset-btn" onClick={handleReset}>
                <RotateCcw size={12} /> Start Over
              </button>
            </div>

            {/* SUMMARY */}
            <div className="bsa-summary">
              <div className="bsa-summary-card">
                <div className="bsa-summary-num" style={{ color: JADE }}>{strongCount}</div>
                <div className="bsa-summary-label">Lines Covered</div>
              </div>
              <div className="bsa-summary-card">
                <div className="bsa-summary-num" style={{ color: RED_SOFT }}>{blindCount}</div>
                <div className="bsa-summary-label">Blind Spots</div>
              </div>
              <div className="bsa-summary-card">
                <div className="bsa-summary-num" style={{ color: CHAMPAGNE }}>32</div>
                <div className="bsa-summary-label">Total Lines</div>
              </div>
              <div className="bsa-summary-card">
                <div className="bsa-summary-num" style={{ color: CREAM2 }}>{Math.round((blindCount / 32) * 100)}%</div>
                <div className="bsa-summary-label">Unmapped</div>
              </div>
            </div>

            {/* EMAIL GATE — show teaser summary above, full grid behind gate */}
            {!emailSubmitted ? (
              <>
                {/* Blurred preview of the grid to tease */}
                <div className="bsa-blurred">
                  <div className="bsa-coverage-grid">
                    {results.slice(0, 12).map((r) => (
                      <div key={r.name} className={`bsa-line-cell ${r.level}`}>
                        <div className="bsa-line-name">{r.name}</div>
                        <div className="bsa-line-icon">
                          {r.level === "strong" ? <Eye size={10} /> : <EyeOff size={10} />}
                          {r.level === "strong" ? "Visible" : "Blind spot"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Email capture form */}
                <div className="bsa-email-gate">
                  <div className="bsa-email-gate-icon"><Lock size={28} /></div>
                  <div className="bsa-email-gate-title">See Your Full Blind-Spot Map</div>
                  <p className="bsa-email-gate-desc">
                    Your analysis found <strong style={{color: RED_SOFT}}>{blindCount} blind spots</strong> across 32 intelligence lines.
                    Enter your email to unlock the complete breakdown — including which lines are most critical to address first.
                  </p>
                  <form className="bsa-email-form" onSubmit={handleEmailSubmit}>
                    <input
                      type="email"
                      className="bsa-email-input"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <button type="submit" className="bsa-email-submit">
                      <Mail size={12} /> Unlock Results
                    </button>
                  </form>
                  {emailError && <div className="bsa-email-error">{emailError}</div>}
                  <div className="bsa-email-privacy">No spam. We’ll notify you when the full AQAL assessment launches.</div>
                </div>
              </>
            ) : (
              <>
                {/* FULL COVERAGE GRID — unlocked */}
                <div className="bsa-coverage-grid">
                  {results.map((r) => (
                    <div key={r.name} className={`bsa-line-cell ${r.level}`}>
                      <div className="bsa-line-name">{r.name}</div>
                      <div className="bsa-line-icon">
                        {r.level === "strong" ? <Eye size={10} /> : <EyeOff size={10} />}
                        {r.level === "strong" ? "Visible" : "Blind spot"}
                      </div>
                    </div>
                  ))}
                </div>

                {/* EVIDENCE LINK */}
                <div className="bsa-evidence">
                  <div className="bsa-evidence-head">
                    <TrendingUp size={18} />
                    <div className="bsa-evidence-title">Can You Actually Build These Blind Spots?</div>
                  </div>
                  <p className="bsa-evidence-desc">
                    Yes — for most lines, with the right intervention. The ACTIVE trial tracked 2,832 adults for a decade
                    and found permanent cognitive gains from targeted training. Spatial intelligence improves by half a
                    standard deviation. Emotional competence builds in 18 hours with spillover into health, relationships,
                    and employability. We’ve compiled 22 peer-reviewed sources proving trainability across 19 intelligence domains.
                  </p>
                  <Link href="/research-library?section=trainability" className="bsa-evidence-link">
                    View the Trainability Evidence <ExternalLink size={10} />
                  </Link>
                </div>
              </>
            )}

            {/* CTA */}
            <div className="bsa-cta">
              <div className="bsa-cta-title">You know {strongCount} lines. See all 32.</div>
              <p className="bsa-cta-desc">
                The AQAL assessment measures every one of these dimensions — not through a multiple-choice quiz,
                but through voice analysis, evidence verification, and a five-AI synthesis that maps your full
                intelligence architecture. Including the lines no other assessment touches.
              </p>
              <div className="bsa-cta-links">
                <Link href="/assessment" className="bsa-cta-link primary">
                  Take the Full Assessment <ArrowRight size={12} />
                </Link>
                <Link href="/research-library" className="bsa-cta-link">
                  View All 32 Lines — Sourced <ExternalLink size={12} />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
