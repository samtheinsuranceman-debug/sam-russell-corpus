import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  DollarSign,
  Scale,
  Heart,
  HeartCrack,
  Users,
  Baby,
  MapPin,
  Calculator,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  ChevronUp,
  Info,
  Zap,
  Lock,
  Unlock,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  ComposedChart,
} from "recharts";

// ─── STATE ANNUITY PROTECTION MAP ───────────────────────────────────
// States where fixed annuities held in trust are protected from divorce proceedings
const STATE_PROTECTION: Record<string, { level: "full" | "partial" | "none" | "strong"; details: string; statute: string }> = {
  "AL": { level: "partial", details: "Annuities exempt up to $250K under creditor protection; divorce courts have discretion", statute: "Ala. Code §6-10-8" },
  "AK": { level: "full", details: "Spendthrift trust assets fully protected from divorce division", statute: "Alaska Stat. §34.40.110" },
  "AZ": { level: "partial", details: "Community property state; separate property annuities in trust may be protected", statute: "A.R.S. §20-1131" },
  "AR": { level: "partial", details: "Annuity proceeds exempt from creditors up to $500/month", statute: "Ark. Code §23-79-134" },
  "CA": { level: "none", details: "Community property state; annuities acquired during marriage are divisible", statute: "Cal. Fam. Code §760" },
  "CO": { level: "partial", details: "Annuities in irrevocable trust may be protected; court discretion applies", statute: "C.R.S. §13-54-102" },
  "CT": { level: "partial", details: "Annuity cash values exempt up to $4K; trust assets may have additional protection", statute: "Conn. Gen. Stat. §52-352b" },
  "DE": { level: "strong", details: "Qualified dispositions in trust fully protected; strong asset protection trust laws", statute: "12 Del. Code §3570" },
  "FL": { level: "full", details: "Annuity cash values 100% exempt from creditors and divorce proceedings", statute: "Fla. Stat. §222.14" },
  "GA": { level: "partial", details: "Annuities exempt from garnishment; divorce courts may still consider as marital asset", statute: "O.C.G.A. §33-25-11" },
  "HI": { level: "none", details: "Equitable distribution state; all assets including annuities subject to division", statute: "HRS §580-47" },
  "ID": { level: "none", details: "Community property state; annuities acquired during marriage divisible", statute: "Idaho Code §32-906" },
  "IL": { level: "partial", details: "Annuity proceeds exempt; trust-held annuities may have enhanced protection", statute: "215 ILCS 5/238" },
  "IN": { level: "partial", details: "Annuity cash values exempt from execution; divorce courts have broad discretion", statute: "Ind. Code §27-1-12-29" },
  "IA": { level: "partial", details: "Annuity proceeds exempt up to $15K; irrevocable trust adds protection layer", statute: "Iowa Code §627.6(6)" },
  "KS": { level: "partial", details: "Cash value of annuities exempt from creditors; trust protection varies", statute: "K.S.A. §40-414" },
  "KY": { level: "partial", details: "Annuity benefits exempt from creditor claims; divorce treatment varies by court", statute: "KRS §304.14-300" },
  "LA": { level: "none", details: "Community property state; annuities purchased with community funds divisible", statute: "La. C.C. Art. 2338" },
  "ME": { level: "partial", details: "Annuity proceeds reasonably necessary for support exempt", statute: "14 M.R.S.A. §4422" },
  "MD": { level: "partial", details: "Annuities may be considered marital property; trust structure critical", statute: "Md. Code Ins. §16-111" },
  "MA": { level: "partial", details: "Equitable division; annuities in irrevocable trust may be excluded", statute: "M.G.L. c.175 §119A" },
  "MI": { level: "partial", details: "Annuity cash values exempt from creditors; divorce courts may still divide", statute: "MCL §500.4054" },
  "MN": { level: "partial", details: "Annuity proceeds exempt; ILIT-held annuities have stronger protection", statute: "Minn. Stat. §550.37" },
  "MS": { level: "partial", details: "Annuity benefits exempt from creditors and garnishment", statute: "Miss. Code §85-3-11" },
  "MO": { level: "partial", details: "Annuity proceeds exempt from attachment; trust adds protection", statute: "Mo. Rev. Stat. §376.550" },
  "MT": { level: "partial", details: "Unmatured annuity benefits exempt to extent reasonably necessary", statute: "MCA §25-13-608" },
  "NE": { level: "partial", details: "Annuity cash values exempt from creditors", statute: "Neb. Rev. Stat. §44-371" },
  "NV": { level: "strong", details: "Strong asset protection trust state; annuities in trust well-protected from divorce", statute: "NRS §166.170" },
  "NH": { level: "partial", details: "Annuity proceeds exempt from creditors; divorce courts have equitable powers", statute: "RSA §511:2" },
  "NJ": { level: "partial", details: "Annuity benefits exempt from creditor claims", statute: "N.J.S.A. §17B:24-6" },
  "NM": { level: "none", details: "Community property state; annuities acquired during marriage are community property", statute: "NMSA §40-3-8" },
  "NY": { level: "partial", details: "Annuity proceeds exempt from creditors; equitable distribution in divorce", statute: "N.Y. Ins. Law §3212" },
  "NC": { level: "partial", details: "Annuity cash values exempt from creditors; divorce division varies", statute: "N.C.G.S. §1C-1601" },
  "ND": { level: "partial", details: "Annuity benefits exempt from process", statute: "N.D.C.C. §26.1-33-40" },
  "OH": { level: "partial", details: "Annuity cash values exempt from creditors; separate property in trust protected", statute: "ORC §3911.10" },
  "OK": { level: "full", details: "Annuity benefits fully exempt from legal process and divorce proceedings", statute: "36 O.S. §3631" },
  "OR": { level: "partial", details: "Annuity proceeds exempt from creditors; trust-held assets may be excluded from division", statute: "ORS §743.049" },
  "PA": { level: "partial", details: "Annuity contract values exempt from creditors", statute: "42 Pa.C.S. §8124" },
  "RI": { level: "partial", details: "Annuity proceeds exempt from creditor claims", statute: "R.I.G.L. §27-4-11" },
  "SC": { level: "strong", details: "Strong trust protection; annuities in irrevocable trust protected from equitable division", statute: "S.C. Code §38-63-40" },
  "SD": { level: "strong", details: "Premier asset protection trust state; annuities in trust fully shielded from divorce", statute: "SDCL §55-16-15" },
  "TN": { level: "strong", details: "Tennessee Investment Services Act provides strong trust asset protection", statute: "Tenn. Code §35-15-502" },
  "TX": { level: "full", details: "Annuity benefits fully exempt from seizure; community property but trust assets protected", statute: "Tex. Ins. Code §1108.051" },
  "UT": { level: "partial", details: "Annuity proceeds exempt from creditors; divorce courts have equitable powers", statute: "Utah Code §78B-5-505" },
  "VT": { level: "partial", details: "Annuity benefits exempt from trustee process", statute: "8 V.S.A. §3709" },
  "VA": { level: "partial", details: "Annuity cash values exempt from creditors; separate property in trust protected", statute: "Va. Code §38.2-3122" },
  "WA": { level: "none", details: "Community property state; annuities acquired during marriage are community property", statute: "RCW §26.16.030" },
  "WV": { level: "partial", details: "Annuity proceeds exempt from creditors", statute: "W.Va. Code §38-10-4" },
  "WI": { level: "none", details: "Community property state; marital property annuities subject to division", statute: "Wis. Stat. §766.31" },
  "WY": { level: "full", details: "Strong asset protection; annuity benefits fully exempt from legal process", statute: "Wyo. Stat. §26-15-129" },
  "DC": { level: "partial", details: "Equitable distribution; annuities in irrevocable trust may be excluded", statute: "D.C. Code §16-910" },
};

const PROTECTION_COLORS: Record<string, string> = {
  full: "#00ff88",
  strong: "#00cc66",
  partial: "#ffaa00",
  none: "#ff4444",
};

const PROTECTION_LABELS: Record<string, string> = {
  full: "FULL PROTECTION",
  strong: "STRONG PROTECTION",
  partial: "PARTIAL PROTECTION",
  none: "MINIMAL PROTECTION",
};

// ─── FINANCIAL ENGINE ───────────────────────────────────────────────
function computeDivorceScenario(params: {
  netWorth: number;
  annualIncome: number;
  homeValue: number;
  mortgageBalance: number;
  iulCashValue: number;
  ilitValue: number;
  fixedAnnuityValue: number;
  annuityProtected: boolean;
  divorceYear: number;
  spousalSplitPct: number;
  alimonyPct: number;
  alimonyYears: number;
  attorneyFees: number;
  childSupportAnnual: number;
  childSupportYears: number;
  projectionYears: number;
  growthRate: number;
}) {
  const p = params;
  const unprotectedTimeline: any[] = [];
  const protectedTimeline: any[] = [];

  // UNPROTECTED: Everything is on the table
  let unprotectedNW = p.netWorth;
  const totalUnprotectedLoss =
    unprotectedNW * (p.spousalSplitPct / 100) +
    p.attorneyFees +
    p.annualIncome * (p.alimonyPct / 100) * p.alimonyYears +
    p.childSupportAnnual * p.childSupportYears;

  // PROTECTED: IUL cash value, ILIT, and (if state allows) fixed annuities are shielded
  let protectedNW = p.netWorth;
  const shieldedAssets = p.iulCashValue + p.ilitValue + (p.annuityProtected ? p.fixedAnnuityValue : 0);
  const exposedNW = Math.max(0, protectedNW - shieldedAssets);
  const totalProtectedLoss =
    exposedNW * (p.spousalSplitPct / 100) +
    p.attorneyFees * 0.6 + // Lower attorney fees with clear trust documentation
    p.annualIncome * (p.alimonyPct / 100) * Math.max(0, p.alimonyYears - 2) + // Reduced alimony with proper planning
    p.childSupportAnnual * p.childSupportYears; // Child support stays the same

  for (let year = 0; year <= p.projectionYears; year++) {
    if (year === 0) {
      // Pre-divorce
      unprotectedTimeline.push({
        year,
        label: `Year ${year}`,
        netWorth: unprotectedNW,
        event: "Pre-Divorce",
      });
      protectedTimeline.push({
        year,
        label: `Year ${year}`,
        netWorth: protectedNW,
        event: "Pre-Divorce",
      });
    } else if (year === 1) {
      // Divorce hits
      unprotectedNW -= totalUnprotectedLoss;
      unprotectedNW = Math.max(unprotectedNW, 0);
      protectedNW -= totalProtectedLoss;
      protectedNW = Math.max(protectedNW, shieldedAssets * 0.5); // Protected assets keep growing

      unprotectedTimeline.push({
        year,
        label: `Year ${year}`,
        netWorth: Math.round(unprotectedNW),
        event: "DIVORCE",
      });
      protectedTimeline.push({
        year,
        label: `Year ${year}`,
        netWorth: Math.round(protectedNW),
        event: "DIVORCE (Protected)",
      });
    } else {
      // Post-divorce recovery
      const alimonyDrain = year <= p.alimonyYears ? p.annualIncome * (p.alimonyPct / 100) : 0;
      const childDrain = year <= p.childSupportYears ? p.childSupportAnnual : 0;

      // Unprotected: slow recovery, ongoing drains
      unprotectedNW = unprotectedNW * (1 + p.growthRate / 100) + p.annualIncome * 0.3 - alimonyDrain - childDrain;
      unprotectedNW = Math.max(unprotectedNW, 0);

      // Protected: IUL cash value grows tax-free (IRC §7702), ILIT compounds
      const iulGrowth = p.iulCashValue * 0.065; // 6.5% IUL crediting rate
      const ilitGrowth = p.ilitValue * 0.055; // 5.5% ILIT growth
      const reducedAlimony = year <= Math.max(0, p.alimonyYears - 2) ? p.annualIncome * (p.alimonyPct / 100) * 0.7 : 0;
      protectedNW = protectedNW * (1 + p.growthRate / 100) + p.annualIncome * 0.3 + iulGrowth + ilitGrowth - reducedAlimony - childDrain;

      unprotectedTimeline.push({
        year,
        label: `Year ${year}`,
        netWorth: Math.round(unprotectedNW),
        event: year <= p.alimonyYears ? "Alimony + Recovery" : "Recovery",
      });
      protectedTimeline.push({
        year,
        label: `Year ${year}`,
        netWorth: Math.round(protectedNW),
        event: year <= Math.max(0, p.alimonyYears - 2) ? "Reduced Alimony + Growth" : "Tax-Free Growth",
      });
    }
  }

  return {
    unprotectedTimeline,
    protectedTimeline,
    totalUnprotectedLoss: Math.round(totalUnprotectedLoss),
    totalProtectedLoss: Math.round(totalProtectedLoss),
    assetsSaved: Math.round(totalUnprotectedLoss - totalProtectedLoss),
    shieldedAssets: Math.round(shieldedAssets),
    finalUnprotected: Math.round(unprotectedTimeline[unprotectedTimeline.length - 1]?.netWorth || 0),
    finalProtected: Math.round(protectedTimeline[protectedTimeline.length - 1]?.netWorth || 0),
  };
}

// ─── FORMATTERS ─────────────────────────────────────────────────────
const fmt = (n: number) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
};

const fmtFull = (n: number) => `$${n.toLocaleString()}`;

// ─── MAIN COMPONENT ────────────────────────────────────────────────
export default function DivorceCalculator() {
  const [, navigate] = useLocation();

  // Client Profile
  const [clientName, setClientName] = useState("Dr. James Richardson");
  const [clientAge, setClientAge] = useState(48);
  const [state, setState] = useState("FL");
  const [netWorth, setNetWorth] = useState(12_000_000);
  const [annualIncome, setAnnualIncome] = useState(850_000);
  const [homeValue, setHomeValue] = useState(3_200_000);
  const [mortgageBalance, setMortgageBalance] = useState(1_400_000);

  // Protection Assets
  const [iulCashValue, setIulCashValue] = useState(2_500_000);
  const [ilitValue, setIlitValue] = useState(3_000_000);
  const [fixedAnnuityValue, setFixedAnnuityValue] = useState(1_500_000);

  // Divorce Parameters
  const [spousalSplitPct, setSpousalSplitPct] = useState(50);
  const [alimonyPct, setAlimonyPct] = useState(25);
  const [alimonyYears, setAlimonyYears] = useState(10);
  const [attorneyFees, setAttorneyFees] = useState(350_000);
  const [childSupportAnnual, setChildSupportAnnual] = useState(60_000);
  const [childSupportYears, setChildSupportYears] = useState(8);
  const [projectionYears, setProjectionYears] = useState(30);
  const [growthRate, setGrowthRate] = useState(6);

  // Multi-Divorce Toggles
  const [showDivorce2, setShowDivorce2] = useState(false);
  const [divorce2Delay, setDivorce2Delay] = useState(8);
  const [showDivorce3, setShowDivorce3] = useState(false);
  const [divorce3Delay, setDivorce3Delay] = useState(7);

  // View toggles
  const [perspective, setPerspective] = useState<"both" | "unprotected" | "protected">("both");
  const [showStateMap, setShowStateMap] = useState(false);
  const [showAdultChildren, setShowAdultChildren] = useState(false);
  const [expandedIRS, setExpandedIRS] = useState(false);
  const [showStartToday, setShowStartToday] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);

  const stateProtection = STATE_PROTECTION[state];
  const annuityProtected = stateProtection?.level === "full" || stateProtection?.level === "strong";

  // ─── COMPUTE DIVORCE 1 ──────────────────────────────────────────
  const divorce1 = useMemo(() => computeDivorceScenario({
    netWorth, annualIncome, homeValue, mortgageBalance,
    iulCashValue, ilitValue, fixedAnnuityValue, annuityProtected,
    divorceYear: 1, spousalSplitPct, alimonyPct, alimonyYears,
    attorneyFees, childSupportAnnual, childSupportYears,
    projectionYears, growthRate,
  }), [netWorth, annualIncome, homeValue, mortgageBalance, iulCashValue, ilitValue, fixedAnnuityValue, annuityProtected, spousalSplitPct, alimonyPct, alimonyYears, attorneyFees, childSupportAnnual, childSupportYears, projectionYears, growthRate]);

  // ─── COMPUTE DIVORCE 2 (feeds from divorce 1 ending position) ──
  const divorce2 = useMemo(() => {
    if (!showDivorce2) return null;
    const d1UnprotectedEnd = divorce1.unprotectedTimeline[divorce2Delay]?.netWorth || divorce1.finalUnprotected;
    const d1ProtectedEnd = divorce1.protectedTimeline[divorce2Delay]?.netWorth || divorce1.finalProtected;
    return computeDivorceScenario({
      netWorth: d1UnprotectedEnd, // Use unprotected position for unprotected path
      annualIncome: annualIncome * 0.85, // Income often drops after first divorce
      homeValue: homeValue * 0.7, mortgageBalance: mortgageBalance * 0.5,
      iulCashValue: iulCashValue * 1.3, // IUL has been growing
      ilitValue: ilitValue * 1.25,
      fixedAnnuityValue: fixedAnnuityValue * 1.2,
      annuityProtected,
      divorceYear: 1, spousalSplitPct: spousalSplitPct * 0.9,
      alimonyPct: alimonyPct * 0.8, alimonyYears: Math.max(3, alimonyYears - 3),
      attorneyFees: attorneyFees * 1.3, // More expensive the second time
      childSupportAnnual: childSupportAnnual * 0.5,
      childSupportYears: Math.max(0, childSupportYears - 4),
      projectionYears: Math.max(10, projectionYears - divorce2Delay),
      growthRate,
    });
  }, [showDivorce2, divorce1, divorce2Delay, annualIncome, homeValue, mortgageBalance, iulCashValue, ilitValue, fixedAnnuityValue, annuityProtected, spousalSplitPct, alimonyPct, alimonyYears, attorneyFees, childSupportAnnual, childSupportYears, projectionYears, growthRate]);

  // ─── COMPUTE DIVORCE 3 (feeds from divorce 2 ending position) ──
  const divorce3 = useMemo(() => {
    if (!showDivorce3 || !divorce2) return null;
    const d2UnprotectedEnd = divorce2.unprotectedTimeline[divorce3Delay]?.netWorth || divorce2.finalUnprotected;
    return computeDivorceScenario({
      netWorth: d2UnprotectedEnd,
      annualIncome: annualIncome * 0.65, // Significant income erosion by 3rd divorce
      homeValue: homeValue * 0.5, mortgageBalance: mortgageBalance * 0.3,
      iulCashValue: iulCashValue * 1.6, // IUL keeps compounding
      ilitValue: ilitValue * 1.55,
      fixedAnnuityValue: fixedAnnuityValue * 1.45,
      annuityProtected,
      divorceYear: 1, spousalSplitPct: spousalSplitPct * 0.8,
      alimonyPct: alimonyPct * 0.6, alimonyYears: Math.max(2, alimonyYears - 5),
      attorneyFees: attorneyFees * 1.6, // Even more expensive
      childSupportAnnual: 0, childSupportYears: 0,
      projectionYears: Math.max(10, projectionYears - divorce2Delay - divorce3Delay),
      growthRate,
    });
  }, [showDivorce3, divorce2, divorce3Delay, annualIncome, homeValue, mortgageBalance, iulCashValue, ilitValue, fixedAnnuityValue, annuityProtected, spousalSplitPct, alimonyPct, alimonyYears, attorneyFees, childSupportAnnual, childSupportYears, projectionYears, growthRate]);

  // ─── COMBINED TIMELINE FOR MULTI-DIVORCE VIEW ───────────────────
  const combinedTimeline = useMemo(() => {
    const data: any[] = [];
    for (let y = 0; y <= projectionYears; y++) {
      const d1u = divorce1.unprotectedTimeline[y]?.netWorth || 0;
      const d1p = divorce1.protectedTimeline[y]?.netWorth || 0;
      let unprotected = d1u;
      let protected_ = d1p;

      if (showDivorce2 && divorce2 && y >= divorce2Delay) {
        const d2y = y - divorce2Delay;
        if (d2y < divorce2.unprotectedTimeline.length) {
          unprotected = divorce2.unprotectedTimeline[d2y]?.netWorth || unprotected;
        }
      }
      if (showDivorce3 && divorce3 && y >= divorce2Delay + divorce3Delay) {
        const d3y = y - divorce2Delay - divorce3Delay;
        if (d3y < divorce3.unprotectedTimeline.length) {
          unprotected = divorce3.unprotectedTimeline[d3y]?.netWorth || unprotected;
        }
      }

      // Protected path: IUL/ILIT keep growing regardless of divorces
      if (showDivorce2 && y >= divorce2Delay) {
        protected_ = protected_ * 1.02; // Protected assets compound
      }
      if (showDivorce3 && y >= divorce2Delay + divorce3Delay) {
        protected_ = protected_ * 1.015;
      }

      data.push({
        year: y,
        label: `Year ${y}`,
        unprotected: Math.round(Math.max(0, unprotected)),
        protected: Math.round(protected_),
        gap: Math.round(Math.max(0, protected_ - unprotected)),
      });
    }
    return data;
  }, [divorce1, divorce2, divorce3, showDivorce2, showDivorce3, divorce2Delay, divorce3Delay, projectionYears]);

  // ─── CUMULATIVE LOSSES ──────────────────────────────────────────
  const totalUnprotectedLoss = (divorce1?.totalUnprotectedLoss || 0) + (divorce2?.totalUnprotectedLoss || 0) + (divorce3?.totalUnprotectedLoss || 0);
  const totalProtectedLoss = (divorce1?.totalProtectedLoss || 0) + (divorce2?.totalProtectedLoss || 0) + (divorce3?.totalProtectedLoss || 0);
  const totalSaved = totalUnprotectedLoss - totalProtectedLoss;
  const divorceCount = 1 + (showDivorce2 ? 1 : 0) + (showDivorce3 ? 1 : 0);

  // ─── ADULT CHILDREN IMPACT ──────────────────────────────────────
  const inheritanceLossUnprotected = useMemo(() => {
    const finalUnprotected = combinedTimeline[combinedTimeline.length - 1]?.unprotected || 0;
    const finalProtected = combinedTimeline[combinedTimeline.length - 1]?.protected || 0;
    return {
      unprotected: Math.round(finalUnprotected * 0.4), // 40% to children after estate tax
      protected: Math.round(finalProtected * 0.85), // 85% passes through ILIT tax-free (IRC §2042)
      ilitDeathBenefit: Math.round(ilitValue * 3.5), // Death benefit multiplier
    };
  }, [combinedTimeline, ilitValue]);

  // ─── "WHAT IF YOU STARTED TODAY" ────────────────────────────────
  const startTodayData = useMemo(() => {
    const scenarios = [0, 1, 2, 3, 5, 10]; // Years of delay
    return scenarios.map(delay => {
      const reducedIUL = iulCashValue * Math.max(0.1, 1 - delay * 0.12);
      const reducedILIT = ilitValue * Math.max(0.1, 1 - delay * 0.1);
      const reducedAnnuity = fixedAnnuityValue * Math.max(0.1, 1 - delay * 0.15);
      const shielded = reducedIUL + reducedILIT + (annuityProtected ? reducedAnnuity : 0);
      const exposed = Math.max(0, netWorth - shielded);
      const loss = exposed * (spousalSplitPct / 100) + attorneyFees + annualIncome * (alimonyPct / 100) * alimonyYears;
      return {
        delay: delay === 0 ? "Today" : `${delay}yr delay`,
        shielded: Math.round(shielded),
        loss: Math.round(loss),
        saved: Math.round(netWorth * (spousalSplitPct / 100) + attorneyFees + annualIncome * (alimonyPct / 100) * alimonyYears - loss),
      };
    });
  }, [netWorth, iulCashValue, ilitValue, fixedAnnuityValue, annuityProtected, spousalSplitPct, attorneyFees, annualIncome, alimonyPct, alimonyYears]);

  // ─── PIE CHART DATA ─────────────────────────────────────────────
  const assetBreakdown = [
    { name: "IUL Cash Value (§7702)", value: iulCashValue, fill: "#00ff88" },
    { name: "ILIT Value (§2042)", value: ilitValue, fill: "#00cc66" },
    { name: `Fixed Annuity ${annuityProtected ? "(Protected)" : "(Exposed)"}`, value: fixedAnnuityValue, fill: annuityProtected ? "#0088ff" : "#ff4444" },
    { name: "Exposed Assets", value: Math.max(0, netWorth - iulCashValue - ilitValue - fixedAnnuityValue), fill: "#ff6644" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0e17] text-white">
      {/* HEADER */}
      <div className="sticky top-0 z-50 bg-[#0a0e17]/95 backdrop-blur-xl border-b border-red-500/20">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/portal/dashboard")} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-400" />
                <h1 className="text-lg font-bold bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
                  DIVORCE DEVASTATION ENGINE
                </h1>
              </div>
              <p className="text-[10px] text-gray-500">The Gold Standard in Divorce-Proof Financial Planning</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 text-[10px] font-bold bg-red-500/20 text-red-400 rounded-full border border-red-500/30">
              {divorceCount} DIVORCE{divorceCount > 1 ? "S" : ""} MODELED
            </span>
            <span className="px-2 py-1 text-[10px] font-bold bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30">
              {fmt(totalSaved)} SAVED
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 py-6 space-y-6">

        {/* ─── EXPLAINER VIDEO ─────────────────────────────────────── */}
        <div className="rounded-2xl bg-gradient-to-br from-[#0c1425] to-[#111827] border border-emerald-500/20 overflow-hidden">
          <button
            onClick={() => setVideoOpen(!videoOpen)}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" /></svg>
              </div>
              <div className="text-left">
                <h2 className="text-sm font-bold text-white">Watch: Why This Calculator Matters</h2>
                <p className="text-[10px] text-slate-400">2-minute explainer — how IUL, ILIT & fixed annuities protect assets in divorce</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">2:29</span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${videoOpen ? "rotate-180" : ""}`} />
            </div>
          </button>
          {videoOpen && (
            <div className="px-6 pb-6">
              <div className="relative w-full rounded-lg overflow-hidden bg-black" style={{ aspectRatio: "16/9" }}>
                <video controls className="w-full h-full object-contain" preload="metadata">
                  <source src="/manus-storage/divorce_calculator_explainer_3a588ea7.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <div className="bg-[#1e293b] rounded-lg p-2 border border-slate-700/50">
                  <div className="text-emerald-400 text-[10px] font-semibold mb-1">Scene 1-2</div>
                  <p className="text-slate-300 text-[10px]">The divorce wealth problem & how the calculator works</p>
                </div>
                <div className="bg-[#1e293b] rounded-lg p-2 border border-slate-700/50">
                  <div className="text-amber-400 text-[10px] font-semibold mb-1">Scene 3</div>
                  <p className="text-slate-300 text-[10px]">Protected vs. unprotected — IRS §72(e), §101(a), ILIT</p>
                </div>
                <div className="bg-[#1e293b] rounded-lg p-2 border border-slate-700/50">
                  <div className="text-purple-400 text-[10px] font-semibold mb-1">Scene 4-5</div>
                  <p className="text-slate-300 text-[10px]">50-year projection engine & call to action</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ─── WAKE-UP CALL BANNER ─────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-950/60 via-red-900/40 to-orange-950/60 border border-red-500/30 p-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl" />
          <div className="relative">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-red-500/20">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-red-300 mb-2">
                  50% of Marriages End in Divorce. 67% of Second Marriages. 73% of Third Marriages.
                </h2>
                <p className="text-sm text-gray-300 leading-relaxed">
                  Without proper asset protection through <strong className="text-emerald-400">IUL cash value (IRC §7702)</strong>,{" "}
                  <strong className="text-emerald-400">Irrevocable Life Insurance Trusts (IRC §2042)</strong>, and{" "}
                  <strong className="text-emerald-400">fixed annuities held in trust</strong>, your client's wealth is a sitting target.
                  This calculator shows the exact dollar impact of being unprotected vs. divorce-proofed — across 1, 2, or 3 divorces.
                </p>
                <div className="mt-3 flex flex-wrap gap-3 text-xs">
                  <span className="px-2 py-1 bg-red-500/20 text-red-300 rounded-full">Average divorce cost: $15K–$100K+ in legal fees alone</span>
                  <span className="px-2 py-1 bg-red-500/20 text-red-300 rounded-full">Equitable distribution: 50% of marital assets at risk</span>
                  <span className="px-2 py-1 bg-red-500/20 text-red-300 rounded-full">Alimony: 15–30% of income for 5–20 years</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── CLIENT PROFILE + PROTECTION INPUTS ──────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Client Profile */}
          <div className="rounded-xl bg-[#111827] border border-white/10 p-4">
            <h3 className="text-sm font-bold text-blue-400 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" /> CLIENT PROFILE
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-gray-500 uppercase">Client Name</label>
                <input type="text" value={clientName} onChange={e => setClientName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-500 uppercase">Age</label>
                  <input type="number" value={clientAge} onChange={e => setClientAge(+e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase">State</label>
                  <select value={state} onChange={e => setState(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white">
                    {Object.keys(STATE_PROTECTION).sort().map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase">Total Net Worth</label>
                <input type="number" value={netWorth} onChange={e => setNetWorth(+e.target.value)} step={100000}
                  className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white" />
                <span className="text-[10px] text-gray-500">{fmt(netWorth)}</span>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase">Annual Income</label>
                <input type="number" value={annualIncome} onChange={e => setAnnualIncome(+e.target.value)} step={50000}
                  className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white" />
                <span className="text-[10px] text-gray-500">{fmt(annualIncome)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-500 uppercase">Home Value</label>
                  <input type="number" value={homeValue} onChange={e => setHomeValue(+e.target.value)} step={100000}
                    className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase">Mortgage</label>
                  <input type="number" value={mortgageBalance} onChange={e => setMortgageBalance(+e.target.value)} step={50000}
                    className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Protection Assets */}
          <div className="rounded-xl bg-[#111827] border border-emerald-500/20 p-4">
            <h3 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> DIVORCE-PROOF ASSETS
            </h3>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <label className="text-[10px] text-emerald-400 uppercase font-bold">IUL Cash Value (IRC §7702)</label>
                <input type="number" value={iulCashValue} onChange={e => setIulCashValue(+e.target.value)} step={100000}
                  className="w-full mt-1 px-3 py-2 bg-white/5 border border-emerald-500/20 rounded-lg text-sm text-emerald-300" />
                <span className="text-[10px] text-emerald-400">{fmt(iulCashValue)} — Tax-free growth, creditor protected</span>
              </div>
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <label className="text-[10px] text-emerald-400 uppercase font-bold">ILIT Value (IRC §2042)</label>
                <input type="number" value={ilitValue} onChange={e => setIlitValue(+e.target.value)} step={100000}
                  className="w-full mt-1 px-3 py-2 bg-white/5 border border-emerald-500/20 rounded-lg text-sm text-emerald-300" />
                <span className="text-[10px] text-emerald-400">{fmt(ilitValue)} — Outside taxable estate, untouchable</span>
              </div>
              <div className={`p-3 rounded-lg border ${annuityProtected ? "bg-blue-500/10 border-blue-500/20" : "bg-red-500/10 border-red-500/20"}`}>
                <label className={`text-[10px] uppercase font-bold ${annuityProtected ? "text-blue-400" : "text-red-400"}`}>
                  Fixed Annuity in Trust {annuityProtected ? "(PROTECTED in " + state + ")" : "(EXPOSED in " + state + ")"}
                </label>
                <input type="number" value={fixedAnnuityValue} onChange={e => setFixedAnnuityValue(+e.target.value)} step={100000}
                  className={`w-full mt-1 px-3 py-2 bg-white/5 border rounded-lg text-sm ${annuityProtected ? "border-blue-500/20 text-blue-300" : "border-red-500/20 text-red-300"}`} />
                <span className={`text-[10px] ${annuityProtected ? "text-blue-400" : "text-red-400"}`}>
                  {fmt(fixedAnnuityValue)} — {stateProtection?.details}
                </span>
                <span className="block text-[9px] text-gray-500 mt-1">Statute: {stateProtection?.statute}</span>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-gray-400 uppercase">Total Shielded</span>
                  <span className="text-lg font-bold text-emerald-400">{fmt(iulCashValue + ilitValue + (annuityProtected ? fixedAnnuityValue : 0))}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-[10px] text-gray-400 uppercase">Total Exposed</span>
                  <span className="text-lg font-bold text-red-400">{fmt(Math.max(0, netWorth - iulCashValue - ilitValue - (annuityProtected ? fixedAnnuityValue : 0)))}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Divorce Parameters */}
          <div className="rounded-xl bg-[#111827] border border-red-500/20 p-4">
            <h3 className="text-sm font-bold text-red-400 mb-3 flex items-center gap-2">
              <Scale className="w-4 h-4" /> DIVORCE PARAMETERS
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-gray-500 uppercase">Spousal Asset Split: {spousalSplitPct}%</label>
                <input type="range" min={20} max={60} value={spousalSplitPct} onChange={e => setSpousalSplitPct(+e.target.value)}
                  className="w-full accent-red-500" />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase">Alimony: {alimonyPct}% of income for {alimonyYears} years</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <input type="range" min={10} max={40} value={alimonyPct} onChange={e => setAlimonyPct(+e.target.value)} className="w-full accent-red-500" />
                  <input type="range" min={2} max={20} value={alimonyYears} onChange={e => setAlimonyYears(+e.target.value)} className="w-full accent-red-500" />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase">Attorney Fees</label>
                <input type="number" value={attorneyFees} onChange={e => setAttorneyFees(+e.target.value)} step={25000}
                  className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-500 uppercase">Child Support/yr</label>
                  <input type="number" value={childSupportAnnual} onChange={e => setChildSupportAnnual(+e.target.value)} step={5000}
                    className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase">CS Years</label>
                  <input type="number" value={childSupportYears} onChange={e => setChildSupportYears(+e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white" />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase">Projection: {projectionYears} years | Growth: {growthRate}%</label>
                <input type="range" min={5} max={50} value={projectionYears} onChange={e => setProjectionYears(+e.target.value)}
                  className="w-full accent-blue-500" />
                <input type="range" min={2} max={12} value={growthRate} onChange={e => setGrowthRate(+e.target.value)}
                  className="w-full accent-blue-500" />
              </div>
            </div>
          </div>
        </div>

        {/* ─── MULTI-DIVORCE TOGGLES ───────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Divorce 1 — Always on */}
          <div className="rounded-xl bg-gradient-to-br from-red-950/40 to-red-900/20 border border-red-500/30 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <HeartCrack className="w-5 h-5 text-red-400" />
                <h3 className="text-sm font-bold text-red-400">DIVORCE #1</h3>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-red-500/30 text-red-300 rounded-full">ALWAYS ON</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-gray-400">Unprotected Loss</span><span className="text-red-400 font-bold">{fmt(divorce1.totalUnprotectedLoss)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Protected Loss</span><span className="text-emerald-400 font-bold">{fmt(divorce1.totalProtectedLoss)}</span></div>
              <div className="flex justify-between border-t border-white/10 pt-2"><span className="text-gray-400">Assets Saved</span><span className="text-yellow-400 font-bold">{fmt(divorce1.assetsSaved)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Shielded Assets</span><span className="text-emerald-400">{fmt(divorce1.shieldedAssets)}</span></div>
            </div>
          </div>

          {/* Divorce 2 — Toggle */}
          <div className={`rounded-xl border p-4 transition-all ${showDivorce2 ? "bg-gradient-to-br from-orange-950/40 to-orange-900/20 border-orange-500/30" : "bg-[#111827] border-white/10 opacity-60"}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <HeartCrack className={`w-5 h-5 ${showDivorce2 ? "text-orange-400" : "text-gray-600"}`} />
                <h3 className={`text-sm font-bold ${showDivorce2 ? "text-orange-400" : "text-gray-600"}`}>DIVORCE #2</h3>
              </div>
              <button onClick={() => setShowDivorce2(!showDivorce2)} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
                {showDivorce2 ? <ToggleRight className="w-6 h-6 text-orange-400" /> : <ToggleLeft className="w-6 h-6 text-gray-600" />}
              </button>
            </div>
            {showDivorce2 ? (
              <div className="space-y-2">
                <div>
                  <label className="text-[10px] text-orange-400 uppercase">Years after 1st divorce: {divorce2Delay}</label>
                  <input type="range" min={1} max={20} value={divorce2Delay} onChange={e => setDivorce2Delay(+e.target.value)} className="w-full accent-orange-500" />
                </div>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between"><span className="text-gray-400">Additional Unprotected Loss</span><span className="text-red-400 font-bold">{fmt(divorce2?.totalUnprotectedLoss || 0)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Additional Protected Loss</span><span className="text-emerald-400 font-bold">{fmt(divorce2?.totalProtectedLoss || 0)}</span></div>
                  <div className="flex justify-between border-t border-white/10 pt-1"><span className="text-gray-400">Additional Saved</span><span className="text-yellow-400 font-bold">{fmt(divorce2?.assetsSaved || 0)}</span></div>
                </div>
                <p className="text-[9px] text-orange-300/60 mt-2">67% of second marriages end in divorce. Feeds from Divorce #1 ending position.</p>
              </div>
            ) : (
              <p className="text-xs text-gray-500">Toggle to model a 2nd divorce. 67% of second marriages end in divorce.</p>
            )}
          </div>

          {/* Divorce 3 — Toggle */}
          <div className={`rounded-xl border p-4 transition-all ${showDivorce3 ? "bg-gradient-to-br from-purple-950/40 to-purple-900/20 border-purple-500/30" : "bg-[#111827] border-white/10 opacity-60"}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <HeartCrack className={`w-5 h-5 ${showDivorce3 ? "text-purple-400" : "text-gray-600"}`} />
                <h3 className={`text-sm font-bold ${showDivorce3 ? "text-purple-400" : "text-gray-600"}`}>DIVORCE #3</h3>
              </div>
              <button onClick={() => { if (showDivorce2) setShowDivorce3(!showDivorce3); }} className={`p-1 rounded-lg hover:bg-white/10 transition-colors ${!showDivorce2 ? "cursor-not-allowed" : ""}`}>
                {showDivorce3 ? <ToggleRight className="w-6 h-6 text-purple-400" /> : <ToggleLeft className="w-6 h-6 text-gray-600" />}
              </button>
            </div>
            {showDivorce3 && showDivorce2 ? (
              <div className="space-y-2">
                <div>
                  <label className="text-[10px] text-purple-400 uppercase">Years after 2nd divorce: {divorce3Delay}</label>
                  <input type="range" min={1} max={20} value={divorce3Delay} onChange={e => setDivorce3Delay(+e.target.value)} className="w-full accent-purple-500" />
                </div>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between"><span className="text-gray-400">Additional Unprotected Loss</span><span className="text-red-400 font-bold">{fmt(divorce3?.totalUnprotectedLoss || 0)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Additional Protected Loss</span><span className="text-emerald-400 font-bold">{fmt(divorce3?.totalProtectedLoss || 0)}</span></div>
                  <div className="flex justify-between border-t border-white/10 pt-1"><span className="text-gray-400">Additional Saved</span><span className="text-yellow-400 font-bold">{fmt(divorce3?.assetsSaved || 0)}</span></div>
                </div>
                <p className="text-[9px] text-purple-300/60 mt-2">73% of third marriages end in divorce. The devastation compounds exponentially.</p>
              </div>
            ) : (
              <p className="text-xs text-gray-500">{showDivorce2 ? "Toggle to model a 3rd divorce. 73% of third marriages fail." : "Enable Divorce #2 first."}</p>
            )}
          </div>
        </div>

        {/* ─── IMPACT SUMMARY CARDS ────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-center">
            <TrendingDown className="w-6 h-6 text-red-400 mx-auto mb-2" />
            <p className="text-[10px] text-gray-400 uppercase">Total Unprotected Loss</p>
            <p className="text-xl font-bold text-red-400">{fmt(totalUnprotectedLoss)}</p>
            <p className="text-[9px] text-gray-500">Across {divorceCount} divorce{divorceCount > 1 ? "s" : ""}</p>
          </div>
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-center">
            <ShieldCheck className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
            <p className="text-[10px] text-gray-400 uppercase">Total Protected Loss</p>
            <p className="text-xl font-bold text-emerald-400">{fmt(totalProtectedLoss)}</p>
            <p className="text-[9px] text-gray-500">With IUL + ILIT + Annuity</p>
          </div>
          <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/20 p-4 text-center">
            <DollarSign className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <p className="text-[10px] text-gray-400 uppercase">Total Assets Saved</p>
            <p className="text-xl font-bold text-yellow-400">{fmt(totalSaved)}</p>
            <p className="text-[9px] text-gray-500">Protection advantage</p>
          </div>
          <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-4 text-center">
            <TrendingUp className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <p className="text-[10px] text-gray-400 uppercase">Final Net Worth Gap</p>
            <p className="text-xl font-bold text-blue-400">{fmt((combinedTimeline[combinedTimeline.length - 1]?.protected || 0) - (combinedTimeline[combinedTimeline.length - 1]?.unprotected || 0))}</p>
            <p className="text-[9px] text-gray-500">After {projectionYears} years</p>
          </div>
        </div>

        {/* ─── PERSPECTIVE TOGGLE ──────────────────────────────────── */}
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPerspective("both")} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${perspective === "both" ? "bg-blue-500 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}>
            Both Paths
          </button>
          <button onClick={() => setPerspective("unprotected")} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${perspective === "unprotected" ? "bg-red-500 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}>
            <Unlock className="w-3 h-3 inline mr-1" />Unprotected Only
          </button>
          <button onClick={() => setPerspective("protected")} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${perspective === "protected" ? "bg-emerald-500 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}>
            <Lock className="w-3 h-3 inline mr-1" />Protected Only
          </button>
        </div>

        {/* ─── MAIN TIMELINE CHART ─────────────────────────────────── */}
        <div className="rounded-xl bg-[#111827] border border-white/10 p-6">
          <h3 className="text-sm font-bold text-white mb-1">NET WORTH TIMELINE — {divorceCount} DIVORCE{divorceCount > 1 ? "S" : ""} OVER {projectionYears} YEARS</h3>
          <p className="text-[10px] text-gray-500 mb-4">Unprotected (red) vs. Divorce-Proofed (green) — The gap is your client's future</p>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={combinedTimeline}>
              <defs>
                <linearGradient id="gradUnprotected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ff4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradProtected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00ff88" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00ff88" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
              <XAxis dataKey="label" tick={{ fill: "#6b7280", fontSize: 10 }} interval={Math.floor(projectionYears / 10)} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} tickFormatter={v => fmt(v)} />
              <Tooltip
                contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 8, fontSize: 12 }}
                formatter={(value: number, name: string) => [fmtFull(value), name === "unprotected" ? "Unprotected" : name === "protected" ? "Protected" : "Gap"]}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {(perspective === "both" || perspective === "unprotected") && (
                <Area type="monotone" dataKey="unprotected" name="Unprotected" stroke="#ff4444" fill="url(#gradUnprotected)" strokeWidth={2} />
              )}
              {(perspective === "both" || perspective === "protected") && (
                <Area type="monotone" dataKey="protected" name="Protected" stroke="#00ff88" fill="url(#gradProtected)" strokeWidth={2} />
              )}
              {perspective === "both" && (
                <Area type="monotone" dataKey="gap" name="Protection Gap" stroke="#fbbf24" fill="none" strokeWidth={1} strokeDasharray="5 5" />
              )}
            </AreaChart>
          </ResponsiveContainer>
          {/* Divorce event markers */}
          <div className="flex flex-wrap gap-3 mt-3 text-[10px]">
            <span className="px-2 py-1 bg-red-500/20 text-red-300 rounded-full">Divorce #1: Year 1</span>
            {showDivorce2 && <span className="px-2 py-1 bg-orange-500/20 text-orange-300 rounded-full">Divorce #2: Year {divorce2Delay}</span>}
            {showDivorce3 && showDivorce2 && <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full">Divorce #3: Year {divorce2Delay + divorce3Delay}</span>}
          </div>
        </div>

        {/* ─── ASSET BREAKDOWN PIE + FINAL COMPARISON ──────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Asset Breakdown Pie */}
          <div className="rounded-xl bg-[#111827] border border-white/10 p-6">
            <h3 className="text-sm font-bold text-white mb-1">ASSET PROTECTION BREAKDOWN</h3>
            <p className="text-[10px] text-gray-500 mb-4">Green = shielded from divorce | Red/Orange = exposed to division</p>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={assetBreakdown} cx="50%" cy="50%" outerRadius={110} innerRadius={60} dataKey="value" label={({ name, value }) => `${name}: ${fmt(value)}`} labelLine={{ stroke: "#6b7280" }}>
                  {assetBreakdown.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => fmtFull(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Final Net Worth Comparison Bar */}
          <div className="rounded-xl bg-[#111827] border border-white/10 p-6">
            <h3 className="text-sm font-bold text-white mb-1">FINAL NET WORTH COMPARISON</h3>
            <p className="text-[10px] text-gray-500 mb-4">After {projectionYears} years and {divorceCount} divorce{divorceCount > 1 ? "s" : ""}</p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { name: "Unprotected", value: combinedTimeline[combinedTimeline.length - 1]?.unprotected || 0, fill: "#ff4444" },
                { name: "Protected", value: combinedTimeline[combinedTimeline.length - 1]?.protected || 0, fill: "#00ff88" },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 12 }} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} tickFormatter={v => fmt(v)} />
                <Tooltip contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => fmtFull(v)} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  <Cell fill="#ff4444" />
                  <Cell fill="#00ff88" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-3 p-3 rounded-lg bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20">
              <p className="text-center text-sm">
                <span className="text-gray-400">Protection Advantage: </span>
                <span className="text-2xl font-bold text-emerald-400">
                  {fmt((combinedTimeline[combinedTimeline.length - 1]?.protected || 0) - (combinedTimeline[combinedTimeline.length - 1]?.unprotected || 0))}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* ─── STATE PROTECTION MAP ────────────────────────────────── */}
        <div className="rounded-xl bg-[#111827] border border-white/10 p-6">
          <button onClick={() => setShowStateMap(!showStateMap)} className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-400" />
              <h3 className="text-sm font-bold text-white">STATE-BY-STATE ANNUITY PROTECTION MAP</h3>
            </div>
            {showStateMap ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
          <p className="text-[10px] text-gray-500 mt-1">Fixed annuities held in irrevocable trust — protection level varies by state</p>

          {/* Current State Highlight */}
          <div className={`mt-3 p-3 rounded-lg border ${annuityProtected ? "bg-emerald-500/10 border-emerald-500/20" : "bg-red-500/10 border-red-500/20"}`}>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-gray-400">Current State: </span>
                <span className="text-sm font-bold text-white">{state}</span>
                <span className={`ml-2 px-2 py-0.5 text-[10px] font-bold rounded-full ${annuityProtected ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                  {PROTECTION_LABELS[stateProtection?.level || "none"]}
                </span>
              </div>
              <span className="text-[10px] text-gray-500">{stateProtection?.statute}</span>
            </div>
            <p className="text-xs text-gray-300 mt-1">{stateProtection?.details}</p>
          </div>

          {showStateMap && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {Object.entries(STATE_PROTECTION).sort(([a], [b]) => a.localeCompare(b)).map(([st, info]) => (
                <button key={st} onClick={() => setState(st)}
                  className={`p-2 rounded-lg border text-center transition-all hover:scale-105 ${
                    st === state ? "ring-2 ring-white/50" : ""
                  }`}
                  style={{ borderColor: PROTECTION_COLORS[info.level] + "40", backgroundColor: PROTECTION_COLORS[info.level] + "10" }}>
                  <span className="text-sm font-bold" style={{ color: PROTECTION_COLORS[info.level] }}>{st}</span>
                  <span className="block text-[8px] text-gray-500 mt-0.5">{info.level.toUpperCase()}</span>
                </button>
              ))}
            </div>
          )}
          {showStateMap && (
            <div className="mt-3 flex flex-wrap gap-3 text-[10px]">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#00ff88]"></span> Full Protection</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#00cc66]"></span> Strong Protection</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#ffaa00]"></span> Partial Protection</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#ff4444]"></span> Minimal Protection</span>
            </div>
          )}
        </div>

        {/* ─── ADULT CHILDREN IMPACT ───────────────────────────────── */}
        <div className="rounded-xl bg-[#111827] border border-white/10 p-6">
          <button onClick={() => setShowAdultChildren(!showAdultChildren)} className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold text-white">ADULT CHILDREN IMPACT — INHERITANCE DEVASTATION</h3>
            </div>
            {showAdultChildren ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
          <p className="text-[10px] text-gray-500 mt-1">How divorce destroys generational wealth transfer — and how ILIT (IRC §2042) prevents it</p>

          {showAdultChildren && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
                  <Unlock className="w-6 h-6 text-red-400 mx-auto mb-2" />
                  <p className="text-[10px] text-gray-400 uppercase">Unprotected Inheritance</p>
                  <p className="text-2xl font-bold text-red-400">{fmt(inheritanceLossUnprotected.unprotected)}</p>
                  <p className="text-[9px] text-gray-500 mt-1">After estate taxes, divorce losses, and probate</p>
                </div>
                <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <Lock className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                  <p className="text-[10px] text-gray-400 uppercase">ILIT-Protected Inheritance</p>
                  <p className="text-2xl font-bold text-emerald-400">{fmt(inheritanceLossUnprotected.protected)}</p>
                  <p className="text-[9px] text-gray-500 mt-1">Tax-free via IRC §2042, bypasses probate entirely</p>
                </div>
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
                  <Shield className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                  <p className="text-[10px] text-gray-400 uppercase">ILIT Death Benefit</p>
                  <p className="text-2xl font-bold text-blue-400">{fmt(inheritanceLossUnprotected.ilitDeathBenefit)}</p>
                  <p className="text-[9px] text-gray-500 mt-1">Tax-free death benefit to children (IRC §101(a))</p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <h4 className="text-xs font-bold text-amber-400 mb-2">HOW DIVORCE DESTROYS YOUR CHILDREN'S INHERITANCE</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-300">
                  <div className="space-y-2">
                    <p><strong className="text-red-400">Divorce #1:</strong> 50% of marital assets go to ex-spouse. Children's future inheritance cut in half immediately.</p>
                    <p><strong className="text-red-400">Divorce #2:</strong> Remaining assets split again. New spouse may have claim to assets intended for children from first marriage.</p>
                    <p><strong className="text-red-400">Divorce #3:</strong> By now, original family wealth is a fraction of what it was. Children from all marriages compete for scraps.</p>
                  </div>
                  <div className="space-y-2">
                    <p><strong className="text-emerald-400">With ILIT:</strong> Life insurance death benefit passes outside the estate (IRC §2042). No ex-spouse can touch it.</p>
                    <p><strong className="text-emerald-400">With IUL:</strong> Cash value grows tax-free (IRC §7702). Loans against cash value are not taxable income.</p>
                    <p><strong className="text-emerald-400">With Trust-Held Annuity:</strong> Fixed annuity in irrevocable trust is beyond reach of divorce courts in protected states.</p>
                  </div>
                </div>
              </div>

              {/* Inheritance Comparison Bar Chart */}
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={[
                  { name: "Unprotected\nInheritance", value: inheritanceLossUnprotected.unprotected, fill: "#ff4444" },
                  { name: "ILIT-Protected\nInheritance", value: inheritanceLossUnprotected.protected, fill: "#00ff88" },
                  { name: "ILIT Death\nBenefit", value: inheritanceLossUnprotected.ilitDeathBenefit, fill: "#3b82f6" },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                  <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 10 }} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} tickFormatter={v => fmt(v)} />
                  <Tooltip contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => fmtFull(v)} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    <Cell fill="#ff4444" />
                    <Cell fill="#00ff88" />
                    <Cell fill="#3b82f6" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* ─── WHAT IF YOU STARTED TODAY ───────────────────────────── */}
        <div className="rounded-xl bg-[#111827] border border-white/10 p-6">
          <button onClick={() => setShowStartToday(!showStartToday)} className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              <h3 className="text-sm font-bold text-white">WHAT IF YOU STARTED TODAY? — COST OF DELAY CALCULATOR</h3>
            </div>
            {showStartToday ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
          <p className="text-[10px] text-gray-500 mt-1">Every year you wait to divorce-proof costs your client exponentially more</p>

          {showStartToday && (
            <div className="mt-4 space-y-4">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={startTodayData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                  <XAxis dataKey="delay" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} tickFormatter={v => fmt(v)} />
                  <Tooltip contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => fmtFull(v)} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="shielded" name="Assets Shielded" fill="#00ff88" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="loss" name="Divorce Loss" fill="#ff4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {startTodayData.map((d, i) => (
                  <div key={i} className={`p-3 rounded-lg border text-center ${i === 0 ? "bg-emerald-500/10 border-emerald-500/30" : "bg-white/5 border-white/10"}`}>
                    <p className="text-[10px] text-gray-400 uppercase">{d.delay}</p>
                    <p className={`text-sm font-bold ${i === 0 ? "text-emerald-400" : "text-red-400"}`}>{fmt(d.loss)}</p>
                    <p className="text-[9px] text-gray-500">divorce loss</p>
                    <p className="text-xs font-bold text-emerald-400 mt-1">{fmt(d.shielded)}</p>
                    <p className="text-[9px] text-gray-500">shielded</p>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-lg bg-gradient-to-r from-yellow-500/10 to-red-500/10 border border-yellow-500/20">
                <p className="text-sm text-center">
                  <span className="text-gray-300">Waiting 10 years costs your client an additional </span>
                  <span className="text-xl font-bold text-red-400">{fmt((startTodayData[5]?.loss || 0) - (startTodayData[0]?.loss || 0))}</span>
                  <span className="text-gray-300"> in divorce exposure</span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ─── IRS CODE CITATIONS ──────────────────────────────────── */}
        <div className="rounded-xl bg-[#111827] border border-white/10 p-6">
          <button onClick={() => setExpandedIRS(!expandedIRS)} className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-400" />
              <h3 className="text-sm font-bold text-white">IRS CODE CITATIONS — LEGAL FOUNDATION</h3>
            </div>
            {expandedIRS ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
          <p className="text-[10px] text-gray-500 mt-1">Every protection strategy is grounded in federal tax law</p>

          {expandedIRS && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { code: "IRC §7702", title: "Life Insurance Contract Definition", desc: "Defines what qualifies as a life insurance contract for tax purposes. IUL cash value growth is tax-deferred, and policy loans are tax-free. This is the foundation of divorce-proof wealth accumulation.", bg: "rgba(16,185,129,0.05)", border: "rgba(16,185,129,0.2)", badge: "rgba(16,185,129,0.2)", text: "#10b981" },
                { code: "IRC §2042", title: "Proceeds of Life Insurance", desc: "Life insurance proceeds payable to a named beneficiary are excluded from the insured's gross estate when owned by an ILIT. This means the death benefit is completely outside the reach of divorce courts.", bg: "rgba(16,185,129,0.05)", border: "rgba(16,185,129,0.2)", badge: "rgba(16,185,129,0.2)", text: "#10b981" },
                { code: "IRC §2035", title: "Three-Year Rule", desc: "Transfers of life insurance within 3 years of death are pulled back into the estate. This is why ILITs must be established well in advance — not as a last-minute divorce strategy.", bg: "rgba(245,158,11,0.05)", border: "rgba(245,158,11,0.2)", badge: "rgba(245,158,11,0.2)", text: "#f59e0b" },
                { code: "IRC §2036", title: "Retained Life Estate", desc: "If the grantor retains the right to income or use of transferred property, it's included in the estate. Properly structured ILITs avoid this by ensuring the grantor has no incidents of ownership.", bg: "rgba(245,158,11,0.05)", border: "rgba(245,158,11,0.2)", badge: "rgba(245,158,11,0.2)", text: "#f59e0b" },
                { code: "IRC §72", title: "Annuities; Certain Proceeds", desc: "Governs the taxation of annuity contracts. Fixed annuities in irrevocable trusts grow tax-deferred. When held in a protected state, they're beyond the reach of divorce proceedings.", bg: "rgba(59,130,246,0.05)", border: "rgba(59,130,246,0.2)", badge: "rgba(59,130,246,0.2)", text: "#3b82f6" },
                { code: "IRC §101(a)", title: "Death Benefits Exclusion", desc: "Life insurance death benefits paid to beneficiaries are generally income tax-free. Combined with ILIT ownership (§2042), this creates a completely tax-free wealth transfer to children.", bg: "rgba(59,130,246,0.05)", border: "rgba(59,130,246,0.2)", badge: "rgba(59,130,246,0.2)", text: "#3b82f6" },
                { code: "IRC §677", title: "Grantor Trust Income", desc: "Income of a trust is taxable to the grantor if it may be used to pay premiums on the grantor's life insurance. Crummey powers in ILITs navigate this by making beneficiaries the technical premium payers.", bg: "rgba(139,92,246,0.05)", border: "rgba(139,92,246,0.2)", badge: "rgba(139,92,246,0.2)", text: "#8b5cf6" },
                { code: "IRC §2503(b)", title: "Annual Gift Tax Exclusion", desc: "Allows annual gifts up to $18,000 per beneficiary ($36,000 for married couples) without gift tax. ILIT premium payments use Crummey notices to qualify for this exclusion.", bg: "rgba(139,92,246,0.05)", border: "rgba(139,92,246,0.2)", badge: "rgba(139,92,246,0.2)", text: "#8b5cf6" },
                { code: "IRC §2611", title: "Generation-Skipping Transfer", desc: "Defines generation-skipping transfers. Dynasty trusts holding IUL policies can pass wealth across multiple generations, compounding the divorce protection for children and grandchildren.", bg: "rgba(6,182,212,0.05)", border: "rgba(6,182,212,0.2)", badge: "rgba(6,182,212,0.2)", text: "#06b6d4" },
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-lg" style={{ backgroundColor: item.bg, border: `1px solid ${item.border}` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full" style={{ backgroundColor: item.badge, color: item.text }}>{item.code}</span>
                    <span className="text-xs font-bold text-white">{item.title}</span>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── BOTTOM CALL TO ACTION ───────────────────────────────── */}
        <div className="rounded-2xl bg-gradient-to-r from-emerald-950/60 via-blue-950/40 to-emerald-950/60 border border-emerald-500/30 p-8 text-center">
          <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Divorce-Proofing Isn't Optional. It's the Foundation.</h2>
          <p className="text-sm text-gray-300 max-w-2xl mx-auto mb-4">
            Every high-net-worth client needs an IUL cash value strategy (IRC §7702), an ILIT (IRC §2042),
            and fixed annuities in trust. The question isn't whether divorce will happen — it's whether your client
            will be protected when it does.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button onClick={() => navigate("/portal/trusts")} className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors text-sm">
              Explore Trust Structures →
            </button>
            <button onClick={() => navigate("/portal/client-intake")} className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-colors text-sm">
              Client Intake Recommender →
            </button>
            <button onClick={() => navigate("/portal/strategy-compare")} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors text-sm border border-white/20">
              Compare Strategies →
            </button>
          </div>
        </div>

        {/* ─── DISCLAIMER ─────────────────────────────────────────── */}
        <div className="text-[9px] text-gray-600 text-center px-8 pb-8">
          <p>This calculator is for educational and illustrative purposes only. It does not constitute legal, tax, or financial advice.
          Actual divorce outcomes depend on jurisdiction, judge discretion, prenuptial agreements, and many other factors.
          IRS code citations are current as of 2024. Consult with qualified legal and tax professionals before implementing any strategy.
          Russell Capital — www.russellcap.com</p>
        </div>
      </div>
    </div>
  );
}
