/**
 * COPY COMPLIANCE GUARD
 *
 * Reads every surface a visitor or a model can receive and fails on the copy
 * that NAIC Model 570 (adopted in North Carolina at 11 NCAC 12 .0424–.0433),
 * G.S. 58-63-15, G.S. 58-62-86, 35 U.S.C. § 292 and FTC Act § 5 forbid. Built
 * from the two copy audits of origin/master 279ca5f (P12-A phrase scan, P12-B
 * rulebook R1–R28), after the High-severity items were fixed.
 *
 * How it reads text:
 *   - Corpus: client/src/**.{ts,tsx}, shared/**.{ts,json}, live/**.html, and the
 *     server files that hold prompts or visitor-facing copy (PROMPT_FILES).
 *     Tests are not read.
 *   - Lines carrying a `copy-ok:` pragma are dropped first. The pragma must name
 *     the rule and say why, in the form `copy-ok: R<n> <reason of 10+ chars>`
 *     (e.g. `// copy-ok: R10 claim recorded verbatim as 'unconfirmed' in the
 *     claims registry`). A malformed pragma fails the build, the count is
 *     pinned in RATCHETS.pragmas, and every one is listed in the output.
 *     The pragma is also the documented escape for an honest negation that a
 *     phrase rule cannot tell from the claim ("IUL is not a Mega Roth").
 *   - Block comments (only where a comment can start: line start or just after
 *     `{`, so `accept="image/*"` is not read as one) and line comments are
 *     stripped, then the text is normalized: lower case, the separators
 *     · — – ‐ ‑ - | collapsed to spaces, whitespace collapsed. So "Never-Lose", "never lose" and "NEVER  LOSE" are one thing,
 *     and a claim split across JSX lines is still one sentence.
 *
 * Three kinds of rule:
 *   1. BANNED: always fail, anywhere in the corpus.
 *   2. HIGH_SURFACES: the pages the audits rated RED carry no unqualified
 *      "tax-free" near a policy at all.
 *   3. RATCHETS: the Medium/Low backlog (unqualified "tax-free", "guaranteed
 *      returns", "divorce-proof", "infinite banking", policy routes without the
 *      product line). Each count may only fall. When you fix some, lower the
 *      number in the same change.
 *
 * Plumbing assertions: disclosures never read a user flag; the NAIC 570 line
 * renders through the shared component on the homepage, the public Ultra
 * Calculator, inside AppShell and (for pages without AppShell) from gated();
 * every client-facing AI prompt carries the regulatory floor; no prompt tells
 * the model to trim caveats.
 */
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import PolicyDisclosureLine from "@/components/PolicyDisclosureLine";
import AiAnswerNote from "@/components/AiAnswerNote";
import { ANNUITY_PATHS, HOMEPAGE_POLICY_KINDS, LIFE_POLICY_PATHS, POLICY_DISCLOSURE, policyKindForPath } from "@shared/policyDisclosure";
import { AI_ANSWER_NOTE, AI_COMPLIANCE_FLOOR } from "@shared/aiCompliance";
import { CLIENT_FACING_PREAMBLE } from "@shared/branding";
import { mayClaimPatentPending, patentClaimHits, FILED_APPLICATION_NUMBERS, techStatusLabel } from "@shared/patentStatus";
import manifesto from "../shared/homeManifesto.json";

const APP = resolve(__dirname, "..");
const read = (rel: string) => readFileSync(join(APP, rel), "utf8");

/* ─── Corpus ─────────────────────────────────────────────────────────────── */

const ROOTS: Array<[string, string[]]> = [
  ["client/src", [".ts", ".tsx"]],
  ["shared", [".ts", ".json"]],
  ["live", [".html"]],
];
/** Server files whose strings reach a visitor or shape a model's answer. */
const PROMPT_FILES = [
  "server/ultraAI.ts",
  "server/agentDefinitions.ts",
  "server/whispererReports.ts",
  "server/leadStrategy.ts",
];
/** The built static homepage, served before the app boots (see livePageParity.test.ts). */
const EXTRA_FILES = ["../docs/mirror/index.html"];
/**
 * Exempt by path, with the reason. Nothing else is exempt by path; everything
 * else uses a line pragma so the exemption is visible where it applies.
 */
const EXEMPT: Record<string, string> = {
  "shared/aiCompliance.ts": "defines the banned words for the model, so it contains them",
  "shared/patentStatus.ts": "defines the patent phrases it forbids",
  "shared/copyGuard.ts": "the first-login/genome screens' own copy guard (from master); it lists the phrases it bans",
  "shared/iulComplianceEngine.ts": "builds real carrier illustrations, where 'AG 49 compliant' is the correct term (same exemption as policyDisclosure.test.ts)",
  "shared/ag49Products.ts": "records the old AG 49 claim it corrected (same exemption as policyDisclosure.test.ts)",
};

function walk(dir: string, exts: string[], out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, exts, out);
    else if (exts.includes(extname(name)) && !/\.(test|spec|bak)\./.test(name)) out.push(full);
  }
  return out;
}

type Doc = { rel: string; raw: string; text: string; pragmas: number; badPragmas: string[] };

/** `copy-ok: R<n> <reason>`: the rule it relies on and a reason someone can check. */
export const PRAGMA = /copy-ok: R\d+ \S.{9,}/;

export function normalizeCopy(raw: string): { text: string; pragmas: number; badPragmas: string[] } {
  let pragmas = 0;
  const badPragmas: string[] = [];
  const kept = raw.split("\n").filter((l) => {
    if (l.includes("copy-ok:")) {
      pragmas++;
      if (!PRAGMA.test(l)) badPragmas.push(l.trim().slice(0, 120));
      return false;
    }
    return true;
  });
  // A block comment can only start at a line start or right after "{" (JSX); "image/*" inside an attribute is not one.
  const noBlock = kept.join("\n").replace(/(^[ \t]*|\{\s*)\/\*[\s\S]*?\*\//gm, "$1 ");
  const noLine = noBlock
    .split("\n")
    .filter((l) => !l.trim().startsWith("//"))
    .join("\n");
  const text = noLine
    // Prettier breaks long JSX text with {" "} spacers; "never{" "}lose money" is one sentence.
    .replace(/\{\s*(["'`])\s*\1\s*\}/g, " ")
    .replace(/\{\s*(["'`]) \1\s*\}/g, " ")
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[·—–‐‑‒\u00ad|\-]/g, " ")
    .replace(/\s+/g, " ");
  return { text, pragmas, badPragmas };
}

let cache: Doc[] | null = null;
function corpus(): Doc[] {
  if (cache) return cache;
  const files: string[] = [];
  for (const [dir, exts] of ROOTS) files.push(...walk(join(APP, dir), exts));
  for (const f of PROMPT_FILES) files.push(join(APP, f));
  for (const f of EXTRA_FILES) files.push(resolve(APP, f));
  cache = files
    .map((full) => {
      const rel = full.startsWith(APP + "/") ? full.slice(APP.length + 1) : full.slice(resolve(APP, "..").length + 1);
      const raw = readFileSync(full, "utf8");
      return { rel, raw, ...normalizeCopy(raw) };
    })
    .filter((d) => !EXEMPT[d.rel]);
  return cache;
}

/* ─── Rules ──────────────────────────────────────────────────────────────── */

/** Within `n` words of each other, either order. */
const near = (a: string, b: string, n = 12) => new RegExp(`\\b(${a})\\b(\\s+\\S+){0,${n}}?\\s+\\b(${b})\\b|\\b(${b})\\b(\\s+\\S+){0,${n}}?\\s+\\b(${a})\\b`);
const POLICY = "iul|annuity|annuities|policy|myga|fia|life insurance";

type Rule = {
  id: string;
  why: string;
  rx: RegExp;
  only?: RegExp;
  /** Files exempt from this one rule, each with the reason (the guard asserts the reason still holds where it can). */
  skip?: Record<string, string>;
  /** A match is allowed when this appears within 160 characters of it (a statement of the prohibition itself). */
  allowIf?: RegExp;
};

/** Always fail. Patterns run against normalized text (lower case, separators → spaces). */
export const BANNED: Rule[] = [
  { id: "mega-roth", why: "R2/R3: a policy titled as an IRA (G.S. 58-63-15(1))", rx: /\bmega ?roth\b/ },
  { id: "never-lose", why: "R10: the floor limits index credits, not charges", rx: /\bnever lose (your |a |a single )?(\w+ )?(money|principal|dollar|dime|penny|value)\b|\bnever (lose|loses|lost) (money|principal|value|a dollar|a dime|a penny|your money)\b|\bnever loses value\b|\bcan(not|'t) lose (money|principal)\b|\bcan never go down\b|\bwon't lose (money|a dime)\b/ },
  { id: "risk-free-product", why: "R10: no-risk language beside a policy", rx: near("risk free|zero risk|zero market risk|no market risk", POLICY) },
  { id: "no-risk-of-loss", why: "R10", rx: /\bno risk of loss\b/ },
  { id: "guaranteed-growth", why: "R4: 'guaranteed' applied to growth or compounding", rx: /\bguaranteed (growth|compounding)\b|\b(compounds?|compounding|grows?|growing) at (an? )?\d+(\.\d+)?% guaranteed\b/ },
  { id: "zero-tax", why: "R7/R11: a tax result stated as a certainty", rx: /\bpay \$?0 in tax\b|\b0% roth conversion|\btax savings = |\b(99|ninety nine) percent of the time\b/ },
  { id: "policy-never-dies", why: "R13: a policy matures at the insured's death", rx: /\bpolicy (will )?never (die|dies|lapse|lapses)\b|\bnever lapses,? (even )?at death\b|\bpolicy doesn't lapse at death\b|\bdoes not terminate at the insured's death\b|\bpolicy lives forever\b/ },
  { id: "nicknames", why: "R2: product nicknames that hide what it is", rx: /\bmagic growing jar\b|\bspecialized liquidity tool\b|\bmulti guaranteed annuity\b/ },
  { id: "piggy-bank-policy", why: "R2", rx: near("piggy bank", POLICY) },
  { id: "promissory", why: "R11: projections are not promises", rx: /\brepeat forever\b|\bgrows exponentially for\b|\bgrowth goes exponential\b|\bcollateral always wins\b/ },
  { id: "ag49-compliance-claim", why: "R13: these pages are not illustrations", rx: /\b(ag ?49( ?a)?( ?\/ ?b)?|actuarial guideline (49|xlix)( ?a)?)( ?[ab])? (compliant|complies|comply|compliance notice)\b|\b(comply|complies|compliant|compliance) with (the )?(naic )?(ag ?49|actuarial guideline (49|xlix))|\bfederal rules? called ag/ },
  { id: "fabricated-score", why: "R27: a score nothing computes", rx: /\bpage insights score\b/ },
  {
    id: "guaranty-association",
    why: "R19: G.S. 58-62-86 bars using the guaranty association in a sale",
    rx: /\bguaranty (association|associations|fund|funds|coverage|limit|limits|headroom|protection|tier)\b/,
    // Only the notice sentence itself (or the model rule 'as a reason to buy') excuses a mention; a bare citation does not.
    allowIf: /may not be used in the sale or solicitation|used as a reason to buy|as a reason to buy anything/,
    skip: {
      "shared/annuityData.ts": "statutory reference data; no page renders its split recommendation (asserted below)",
      "client/src/pages/portal/AnnuityMemory.tsx": "advisor reference database; carries the § 58-62-86 notice on the page (asserted below)",
      "client/src/pages/portal/AnnuityAccumulationDB.tsx": "password-gated advisor database; carries the § 58-62-86 notice on the page (asserted below)",
    },
  },
  { id: "grok-bans", why: "R24: owner's standing bans", rx: /\bthe best place\b|\bwe treat anxiety\b|\boxytocin\b|\bformulary\b|\bburnout rate\b|\bfinancial prescription\b|\bsee diagnosis\b|\bshape is the diagnosis\b/ },
  { id: "health-claims", why: "R24: no health claims for a financial product", rx: /\blive longer\b|\bcortisol\b|\bhealth strategy\b|\blower (rates of )?depression\b|\blower mortality risk\b/ },
  { id: "demo-mode-disclaimers", why: "disclosures must always render", rx: /\bhide disclaimers\b|\bshow disclaimers\b/ },
  { id: "guaranteed-tax-free-sales", why: "R4/R7: unqualified guarantee plus tax claim in a sales comparison", rx: /\btax free (&|and) guaranteed\b|\bguaranteed (&|and) tax free\b|\bguaranteed tax free\b|\b100% (certainty|confidence|predictable)\b|\btaxable (&|and) (unreliable|unpredictable)\b/ },
  { id: "zero-percent-tax", why: "R7/R11: a Roth conversion is taxable; 'tax-free' needs its condition, never '100%' or '0% tax'", rx: /\b100% tax free\b|(^|[^\d.])0% tax\b|\bzero tax (impact|liability|variability|engine|bill)\b|\btax burden \$0\b/ },
  { id: "refund-promise", why: "contradicts the non-refundable terms on /pricing", rx: /\brefund every penny\b|\bmoney back guarantee\b|\bwe guarantee them\b/ },
  { id: "divorce-proof-prompt", why: "R11: an absolute handed to the model", rx: /\bdivorce proof\b/, only: /^server\// },
];

/** No unqualified "tax-free" near a policy at all on the surfaces the audits rated RED. */
const HIGH_SURFACES = [
  "shared/homeManifesto.json",
  "client/src/pages/Landing.tsx",
  "live/rcs-live-homepage.template.html",
  "client/src/pages/portal/PhysiciansEdge.tsx",
  "client/src/pages/portal/IULvsRoth.tsx",
  "client/src/pages/portal/MortgageKillerV3.tsx",
  "client/src/pages/portal/TimeMachineAG49.tsx",
  "shared/calculatorCatalog.ts",
  "server/ultraAI.ts",
  "server/leadStrategy.ts",
];

/**
 * "tax free" is qualified when its conditions travel with it (R7): within 250
 * characters, the MEC test AND in-force/lapse; or within 60, a context where
 * the phrase is correct on its own (qualified Roth, death benefit §101(a),
 * inheritance, 529/HSA, 1035 exchange).
 */
export function unqualifiedTaxFree(text: string): string[] {
  const out: string[] = [];
  const ctx = /\b(iul|policy loans?|life loans?|cash value)\b/;
  for (const m of text.matchAll(/tax free/g)) {
    const i = m.index ?? 0;
    const wide = text.slice(Math.max(0, i - 250), i + 258);
    const tight = text.slice(Math.max(0, i - 60), i + 68);
    if (!ctx.test(wide)) continue;
    if (/\b(mec|modified endowment)/.test(wide) && /in force|lapse/.test(wide)) continue;
    // Bare "roth"/"qualified" let "IUL loans are tax-free, just like a Roth" through; require the real condition.
    if (/\bqualified (roth )?(distributions?|withdrawals?)\b|\broth ira\b(?!.{0,40}\biul\b)|\broth: ["'`]|death benefit|101\(a\)|inheritance|529|\bhsa\b|1035/.test(tight)) continue;
    out.push(text.slice(Math.max(0, i - 80), i + 60));
  }
  return out;
}

/**
 * The Medium/Low backlog, pinned at its count after the High fix (23 Sep 2026).
 * Only ever lower these numbers.
 */
export const RATCHETS = {
  unqualifiedTaxFree: 251,
  guaranteedReturns: 12,
  divorceProof: 14,
  infiniteBanking: 25,
  policyRoutesWithoutLine: 98,
  /** "N% guaranteed": fine for a contractual minimum or term rate with its caveat; counted so it cannot spread. */
  /** Both orders ("N% guaranteed", "guaranteed N%"); the remainder are contractual minimums/maximums in carrier data and questionnaire choices. */
  percentGuaranteed: 16,
  /** copy-ok pragmas in the corpus. */
  pragmas: 4,
  /** Components that call an AI endpoint (P12-A ai_files.txt) and render no AiAnswerNote / "AI-generated" line. */
  aiSurfacesWithoutNote: 33,
};

/** Components that call an AI endpoint, from P12-A's scan (p12/ai_files.txt). */
const AI_SURFACES = [
  "client/src/components/TapeRecorderAdvisor.tsx", "client/src/components/ExportToSlides.tsx", "client/src/components/ExportPdfButton.tsx",
  "client/src/components/ReportGenerator.tsx", "client/src/components/AdvisorNudge.tsx", "client/src/components/VoiceAdvisor.tsx",
  "client/src/components/AIChatBox.tsx", "client/src/pages/portal/CompetitiveAnalysis.tsx", "client/src/pages/portal/AiAssist.tsx",
  "client/src/pages/portal/AISlideGenerator.tsx", "client/src/pages/portal/WarStoryGenerator.tsx", "client/src/pages/portal/ClientIntakeInterview.tsx",
  "client/src/pages/portal/Knowledge.tsx", "client/src/pages/portal/MortgageKiller.tsx", "client/src/pages/portal/ClientDetail.tsx",
  "client/src/pages/portal/IndexStrategyComparison.tsx", "client/src/pages/portal/ComplianceExport.tsx", "client/src/pages/portal/ExchangeChainOptimizer.tsx",
  "client/src/pages/portal/Arena.tsx", "client/src/pages/portal/LiveCoPilot.tsx", "client/src/pages/portal/DocumentTemplates.tsx",
  "client/src/pages/portal/ReferralTracker.tsx", "client/src/pages/portal/EngineChainingPipeline.tsx", "client/src/pages/portal/AvatarTwins.tsx",
  "client/src/pages/portal/MeetingAgenda.tsx", "client/src/pages/portal/ThomasGoldman.tsx", "client/src/pages/portal/AdvisorChat.tsx",
  "client/src/pages/portal/AiStrategyRecommender.tsx", "client/src/pages/portal/SamuelGoldman.tsx", "client/src/pages/portal/ClientReportBuilder.tsx",
  "client/src/pages/portal/WillWriter.tsx", "client/src/pages/portal/CarrierQuotes.tsx", "client/src/pages/portal/Pipeline.tsx",
  "client/src/pages/portal/AdvancedReporting.tsx", "client/src/pages/portal/MySlides.tsx", "client/src/pages/portal/IbbotsonCharts.tsx",
  "client/src/pages/portal/RewardsVault.tsx", "client/src/pages/portal/BatchSlides.tsx", "client/src/pages/portal/MorningRitual.tsx",
  "client/src/pages/portal/WithdrawalSequencing.tsx", "client/src/pages/portal/SeminarGenerator.tsx", "client/src/pages/portal/StrategyCompare.tsx",
  "client/src/pages/portal/VideoProposalGenerator.tsx", "client/src/pages/portal/ComboRecommender.tsx", "client/src/pages/UltraCalculatorPage.tsx",
  "client/src/components/HomeAIConcierge.tsx",
];

/**
 * A user-facing switch that can drop a disclosure: a negating setter (`setX(!x)`, `setX(prev => !prev)`),
 * a setter wired straight to a checkbox/switch, or a disclosure rendered behind a flag.
 * Dialog open/close setters (onOpenChange) and acknowledgement buttons (setX(false)) are not toggles.
 */
export const DISCLAIMER_TOGGLE: RegExp[] = [
  /set\w*Disclaimers?\s*\(\s*(!|\(?\s*\w+\s*\)?\s*=>\s*!)/,
  /(onCheckedChange|onChange|onToggle)=\{\s*set\w*Disclaimers?\s*\}/,
  /(onCheckedChange|onChange)=\{\s*\(?\s*\w*\s*\)?\s*=>\s*set\w*Disclaimers?\s*\(/,
  /\{\s*\w+\s*&&\s*\(?\s*<(NAICDisclaimer|ComplianceFooter|PolicyDisclosureLine|AiAnswerNote)\b/,
];

/* ─── Tests ──────────────────────────────────────────────────────────────── */

describe("copy compliance: banned phrases", () => {
  it("reads a meaningful number of files, so a green result means something", () => {
    expect(corpus().length).toBeGreaterThan(800);
  });

  it("finds no banned phrase on any visitor or model surface", () => {
    const hits: string[] = [];
    for (const d of corpus()) {
      for (const r of BANNED) {
        if (r.only && !r.only.test(d.rel)) continue;
        if (r.skip?.[d.rel]) continue;
        for (const m of d.text.matchAll(new RegExp(r.rx.source, "g"))) {
          const i = m.index ?? 0;
          if (r.allowIf && r.allowIf.test(d.text.slice(Math.max(0, i - 160), i + m[0].length + 160))) continue;
          hits.push(`${d.rel} [${r.id}: ${r.why}] … ${m[0]}`);
        }
      }
    }
    const pragmas = corpus().filter((d) => d.pragmas > 0).map((d) => `${d.rel} (${d.pragmas})`);
    // Visible in the test output: every file that relies on a copy-ok pragma.
    console.log(`[copyComplianceGuard] copy-ok pragmas: ${pragmas.length ? pragmas.join(", ") : "none"}`);
    expect(hits).toEqual([]);
  });

  it("every copy-ok pragma names its rule and gives a reason, and their number only falls", () => {
    const bad = corpus().flatMap((d) => d.badPragmas.map((l) => `${d.rel}: ${l}`));
    expect(bad).toEqual([]);
    const total = corpus().reduce((n, d) => n + d.pragmas, 0);
    expect(total).toBeLessThanOrEqual(RATCHETS.pragmas);
  });

  it("the per-rule exemptions still hold", () => {
    // annuityData's split recommendation is rendered nowhere; the advisor databases carry the notice.
    const offenders = walk(join(APP, "client/src"), [".ts", ".tsx"]).filter((f) => /splitRec\.(recommendation|splitCount)/.test(readFileSync(f, "utf8")));
    expect(offenders).toEqual([]);
    for (const f of ["client/src/pages/portal/AnnuityMemory.tsx", "client/src/pages/portal/AnnuityAccumulationDB.tsx"]) {
      expect(read(f), f).toContain("58-62-86");
    }
    expect(read("shared/replacementScoring.ts")).not.toMatch(/function scoreStateGuarantyHeadroom/);
  });

  it("finds no patent-status claim while nothing is filed", () => {
    expect(FILED_APPLICATION_NUMBERS.length === 0).toBe(!mayClaimPatentPending());
    // The homepage eyebrow (React and static) reads manifesto.techLabel; it must say what the filed list says.
    expect((manifesto as { techLabel: string }).techLabel).toBe(techStatusLabel());
    expect(read("client/src/pages/Landing.tsx")).toContain("{manifesto.techLabel}");
    const hits = corpus().flatMap((d) => patentClaimHits(d.raw).map((h) => `${d.rel}: ${h}`));
    expect(hits).toEqual([]);
  });

  it("each banned pattern fires on the copy that shipped on origin/master 279ca5f", () => {
    const planted: Record<string, string> = {
      "mega-roth": 'The "Mega Roth IRA" Strategy',
      "never-lose": "It knows the account has a floor, so you can never lose money even when the market crashes",
      "risk-free-product": "Zero market risk on guaranteed portion of the annuity",
      "no-risk-of-loss": "with no risk of loss to principal or interest",
      "guaranteed-growth": "Guaranteed compounding growth",
      "zero-tax": "Convert $2M+ to Roth — Pay $0 in Tax",
      "policy-never-dies": "The policy never lapses at death; it transfers to surviving family members",
      nicknames: "put it into a specialized liquidity tool that grows at, say, seven cents per dollar",
      "piggy-bank-policy": "borrow money from a piggy bank and fund the IUL policy",
      promissory: "HELOC → IUL → Policy Loan → Buy Property → Appreciate → Extract Equity → Repeat Forever",
      "ag49-compliance-claim": "These illustrations comply with NAIC AG 49-A and 49-B requirements. NAIC AG 49-A/B Compliant",
      "fabricated-score": "Page Insights Score: 92/100",
      "guaranty-association": "State Compliance & Guaranty Association",
      "grok-bans": "The shape is the diagnosis. This is the formulary.",
      "health-claims": "People With Guaranteed Lifetime Income Live Longer",
      "demo-mode-disclaimers": "Switch to Demo Mode (hide disclaimers)",
      "refund-promise": "we refund every penny. No questions asked",
      "divorce-proof-prompt": "hard to touch ('divorce-proof')",
      "guaranteed-tax-free-sales": "With $4,000/month guaranteed tax-free, here is exactly what you can plan for with 100% confidence",
      "zero-percent-tax": "Roth converting at 0% tax liability… lifetime income that is 100% tax-free",
    };
    // Forms that slipped past the first version of this guard (C-B review S1).
    const alsoPlanted: Record<string, string[]> = {
      "ag49-compliance-claim": ["These illustrations comply with NAIC Actuarial Guideline 49-A and 49-B requirements."],
      "never-lose": ["you will never lose a dime", "your account can never go down", "you won't lose money", "you'll never{\" \"}lose money", "never lose your principal", "never lose a single dollar"],
      "policy-never-dies": ["The policy lives forever", "It never lapses, even at death", "your policy will never die"],
      "guaranteed-tax-free-sales": ["With $4,000/month guaranteed tax-free, plan with 100% confidence", "Current — Taxable & Unreliable", "Solar Strategy — Tax-Free & Guaranteed"],
      "zero-percent-tax": ["0% tax — forever", "the entire income stream becomes 100% tax-free for life", "100% Tax Free", "with zero tax impact"],
      "mega-roth": ["the MegaRoth"],
      "guaranteed-growth": ["compounds at 6.25% guaranteed while the loan shrinks"],
      "guaranty-association": ["to stay within North Carolina's $250,000 guaranty limit per carrier", "Your state guaranty association protects you (§ 58-62-86)"],
      "risk-free-product": ["this IUL is risk‑free"],
    };
    for (const [id, samples] of Object.entries(alsoPlanted)) {
      const r = BANNED.find((x) => x.id === id)!;
      for (const s of samples) expect(normalizeCopy(s).text, `${id}: ${s}`).toMatch(r.rx);
    }
    // allowIf excuses only the notice sentence, not a bare citation.
    const ga = BANNED.find((x) => x.id === "guaranty-association")!;
    expect(ga.allowIf!.test(normalizeCopy("Your state guaranty association protects you (§ 58-62-86)").text)).toBe(false);
    expect(ga.allowIf!.test(normalizeCopy("The state guaranty association may not be used in the sale or solicitation of an annuity").text)).toBe(true);
    // The toggle detector catches every shape the reviewer found, and not dialogs or acknowledgements.
    for (const bad of ["setShowDisclaimer(!showDisclaimer)", "setShowDisclaimer(prev => !prev)", "onCheckedChange={setIncludeDisclaimer}", "onChange={(e) => setIncludeDisclaimer(e.target.checked)}", "{showDisclaimer && <NAICDisclaimer />}"]) {
      expect(DISCLAIMER_TOGGLE.some((rx) => rx.test(bad)), bad).toBe(true);
    }
    for (const ok of ["onOpenChange={setShowDisclaimer}", "setShowDisclaimer(false)", "<NAICDisclaimer />"]) {
      expect(DISCLAIMER_TOGGLE.some((rx) => rx.test(ok)), ok).toBe(false);
    }
    // The comment stripper does not swallow live markup after accept="image/*".
    expect(normalizeCopy('<input accept="image/*" /> <p>never lose money</p> {/* c */}').text).toContain("never lose money");
    for (const r of BANNED) {
      const sample = planted[r.id];
      expect(sample, `no planted sample for ${r.id}`).toBeTruthy();
      expect(normalizeCopy(sample).text, r.id).toMatch(r.rx);
    }
    // The patent matcher catches both split forms that passed the old guard.
    expect(patentClaimHits("Technology 01 · Pending · Only at RCS").length).toBeGreaterThan(0);
    expect(patentClaimHits("8 Patents — Filed with USPTO").length).toBeGreaterThan(0);
  });

  it("allows 'guaranteed' where the contract guarantees it and the caveat travels with it", () => {
    // R4: contractual guarantees are fine; guarantee-of-return language is not.
    const ok = normalizeCopy("The contract guarantees principal and the stated rate for the term, subject to the claims-paying ability of the insurer. Guaranteed Rate: 5.50%").text;
    for (const r of BANNED) expect(ok, r.id).not.toMatch(r.rx);
    expect(normalizeCopy("Guaranteed compounding growth").text).toMatch(BANNED.find((r) => r.id === "guaranteed-growth")!.rx);
  });
});

describe("copy compliance: the RED surfaces carry every tax-free condition", () => {
  it("has no unqualified 'tax-free' near a policy on the pages the audits rated RED", () => {
    const hits: string[] = [];
    for (const rel of HIGH_SURFACES) {
      const d = corpus().find((x) => x.rel === rel);
      expect(d, `${rel} is not in the corpus`).toBeTruthy();
      for (const h of unqualifiedTaxFree(d!.text)) hits.push(`${rel}: …${h}…`);
    }
    expect(hits).toEqual([]);
  });

  it("the qualifier check fires on the unconditioned form and passes the conditioned one", () => {
    expect(unqualifiedTaxFree(normalizeCopy("IUL policy loans give you tax-free income for life").text).length).toBe(1);
    expect(unqualifiedTaxFree(normalizeCopy("IUL policy loans can be tax-free if the policy is not a MEC and stays in force").text).length).toBe(0);
    expect(unqualifiedTaxFree(normalizeCopy("Qualified Roth withdrawals are tax-free; the IUL is life insurance").text).length).toBe(0);
  });
});

describe("copy compliance: the backlog only shrinks", () => {
  const count = (rx: RegExp) => corpus().reduce((n, d) => n + (d.text.match(rx)?.length ?? 0), 0);

  it("unqualified 'tax-free' near a policy", () => {
    const n = corpus().reduce((s, d) => s + unqualifiedTaxFree(d.text).length, 0);
    expect(n).toBeLessThanOrEqual(RATCHETS.unqualifiedTaxFree);
  });

  it("'N% guaranteed' outside a contractual minimum", () => {
    expect(count(/\b\d+(\.\d+)?% guaranteed\b|\bguaranteed \d+(\.\d+)?%/g)).toBeLessThanOrEqual(RATCHETS.percentGuaranteed);
  });

  it("AI-calling components without the AI-generated note", () => {
    const missing = AI_SURFACES.filter((f) => !/<AiAnswerNote|AI-generated/.test(read(f)));
    expect(missing.length, missing.join(", ")).toBeLessThanOrEqual(RATCHETS.aiSurfacesWithoutNote);
  });

  it("'guaranteed returns', 'divorce-proof', 'infinite banking'", () => {
    expect(count(/\bguaranteed returns?\b/g)).toBeLessThanOrEqual(RATCHETS.guaranteedReturns);
    expect(count(/\bdivorce proof/g)).toBeLessThanOrEqual(RATCHETS.divorceProof);
    expect(count(/\binfinite banking\b|\bbe your own bank\b|\bbank on yourself\b/g)).toBeLessThanOrEqual(RATCHETS.infiniteBanking);
  });

  it("routes whose page talks about IUL or annuities but carries no product line", () => {
    const app = read("client/src/App.tsx");
    const imports = new Map<string, string>();
    for (const m of app.matchAll(/const (\w+) = lazy\(\(\) => import\("\.\/([^"]+)"\)\)/g)) imports.set(m[1], m[2]);
    for (const m of app.matchAll(/^import (\w+) from "\.\/([^"]+)";/gm)) if (!imports.has(m[1])) imports.set(m[1], m[2]);
    const uncovered: string[] = [];
    for (const m of app.matchAll(/<Route path="([^"]+)" component=\{(?:gated\()?(\w+)/g)) {
      const [, path, comp] = m;
      const file = imports.get(comp);
      if (!file) continue;
      const candidates = [`client/src/${file}.tsx`, `client/src/${file}.ts`, `client/src/${file}`];
      const hit = candidates.find((c) => {
        try {
          return statSync(join(APP, c)).isFile();
        } catch {
          return false;
        }
      });
      if (!hit) continue;
      const mentions = read(hit).match(/\b(iul|indexed universal life|annuit\w*|myga|fia)\b/gi)?.length ?? 0;
      if (mentions >= 3 && path !== "/" && policyKindForPath(path) === null) uncovered.push(path);
    }
    expect(uncovered.length, uncovered.join(", ")).toBeLessThanOrEqual(RATCHETS.policyRoutesWithoutLine);
  });
});

describe("copy compliance: the NAIC Model 570 line renders through the shared component", () => {
  it("renders the right line for every listed life and annuity route", () => {
    for (const p of LIFE_POLICY_PATHS) {
      const html = renderToStaticMarkup(createElement(PolicyDisclosureLine, { path: p }));
      expect(html, p).toContain('data-testid="policy-disclosure"');
      expect(html, p).toContain("permanent life insurance policy");
    }
    for (const p of ANNUITY_PATHS) {
      const html = renderToStaticMarkup(createElement(PolicyDisclosureLine, { path: p }));
      expect(html, p).toContain("annuity contract issued by an insurance company");
    }
  });

  it("covers the routes the audits found without it", () => {
    for (const p of ["/ultra-calculator", "/portal/physicians-edge", "/portal/tax-waterfall", "/portal/house-recycling", "/portal/divorce-calculator", "/portal/estate-flow", "/portal/iul-loan-optimizer"]) {
      expect(policyKindForPath(p), p).toBe("life");
    }
    for (const p of ["/portal/athene-guaranteed-income", "/portal/growth-annuities", "/portal/lifetime-income", "/portal/income-for-life", "/portal/existing-annuities", "/portal/fia-top10", "/portal/myga-fixed-rate"]) {
      expect(policyKindForPath(p), p).toBe("annuity");
    }
  });

  it("is mounted in AppShell, in gated() for pages without AppShell, and on the public homepage and Ultra Calculator", () => {
    expect(read("client/src/components/AppShell.tsx")).toMatch(/<PolicyDisclosureLine path=\{location\} \/>/);
    const app = read("client/src/App.tsx");
    const gatedFn = app.slice(app.indexOf("function gated("), app.indexOf("function FrontDoor("));
    expect(gatedFn).toContain("<PolicyDisclosureSlot>");
    const landing = read("client/src/pages/Landing.tsx");
    expect(landing).toContain("<PolicyDisclosureLine");
    expect(landing).toContain("HOMEPAGE_POLICY_KINDS");
    expect(HOMEPAGE_POLICY_KINDS).toEqual(["life", "annuity"]);
    expect(read("client/src/pages/UltraCalculatorPage.tsx")).toContain('<PolicyDisclosureLine path="/ultra-calculator"');
  });

  it("the static homepage carries the same line, from the manifesto", () => {
    expect((manifesto as { productDisclosure: string }).productDisclosure).toBe(`${POLICY_DISCLOSURE.life} ${POLICY_DISCLOSURE.annuity}`);
    const template = read("live/rcs-live-homepage.template.html");
    expect(template).toContain('id="productDisclosure"');
    expect(template).toContain("M.productDisclosure");
  });

  it("names the product as life insurance near the homepage's IUL claims", () => {
    const iulClaims = manifesto.claims.filter((c) => /\biul\b|policy|indexed universal life/i.test(c.name + c.lead + c.detail));
    expect(iulClaims.length).toBeGreaterThan(0);
    for (const c of iulClaims) {
      if (/\biul\b|indexed universal life/i.test(c.name + c.lead + c.detail) && /loan|cash value|account/i.test(c.lead + c.detail)) {
        expect(`${c.lead} ${c.detail}`, c.ref).toMatch(/life insurance/i);
      }
    }
  });
});

describe("copy compliance: disclosures cannot be switched off", () => {
  it("no disclosure component returns null on a user-settable flag", () => {
    for (const f of ["client/src/components/NAICDisclaimer.tsx", "client/src/components/ComplianceFooter.tsx", "client/src/components/PolicyDisclosureLine.tsx", "client/src/components/AiAnswerNote.tsx"]) {
      const src = read(f);
      expect(src, f).not.toMatch(/useDisclaimer\(\)/);
      expect(src, f).not.toMatch(/!\s*showDisclaimers/);
    }
    const ctx = read("client/src/contexts/DisclaimerContext.tsx");
    expect(ctx).not.toMatch(/localStorage\.(getItem|setItem)/);
    expect(ctx).toMatch(/showDisclaimers: true/);
    // Nowhere in the client may a component hide a disclosure behind the old flag.
    const offenders = walk(join(APP, "client/src"), [".ts", ".tsx"]).filter((f) => /if\s*\(\s*!\s*showDisclaimers\s*\)\s*return null/.test(readFileSync(f, "utf8")));
    expect(offenders).toEqual([]);
    // Nor a page-level Hide/Show switch (MarketScenarioStressTest had one): no setter that toggles a disclaimer flag.
    const toggles = walk(join(APP, "client/src"), [".ts", ".tsx"]).filter((f) => DISCLAIMER_TOGGLE.some((rx) => rx.test(readFileSync(f, "utf8"))));
    expect(toggles).toEqual([]);
  });

  it("the footer makes no blanket compliance claim", () => {
    const footer = read("client/src/components/ComplianceFooter.tsx");
    expect(footer).not.toMatch(/AG 49-A\/B Compliant/);
    expect(footer).not.toMatch(/illustrations on this platform comply/i);
  });
});

describe("copy compliance: the AI speaks as an advertisement", () => {
  it("the client-facing preamble carries the regulatory floor, ahead of the channel layer", () => {
    expect(CLIENT_FACING_PREAMBLE).toContain(AI_COMPLIANCE_FLOOR);
    expect(CLIENT_FACING_PREAMBLE.indexOf(AI_COMPLIANCE_FLOOR)).toBeLessThan(CLIENT_FACING_PREAMBLE.indexOf("DealCloser"));
    for (const must of ["hypothetical", "not a guarantee", "life insurance", "modified endowment contract", "not tax, legal or investment advice", "issued by insurance companies"]) {
      expect(AI_COMPLIANCE_FLOOR.toLowerCase().replace("nothing is a guarantee", "not a guarantee"), must).toContain(must);
    }
  });

  it("the Ultra Calculator advisor and the public concierge carry the floor; no prompt trims caveats", () => {
    const ultra = read("server/ultraAI.ts");
    expect(ultra).toMatch(/ADVISOR_SYSTEM =\s*\n\s*AI_COMPLIANCE_FLOOR/);
    expect(ultra).toMatch(/PUBLIC_TEASER_SYSTEM_BASE =\s*\n\s*AI_COMPLIANCE_FLOOR/);
    for (const f of ["shared/compositeMind.ts", "shared/advisorModes.ts", "shared/nlpBrain.ts", "server/ultraAI.ts", "server/agentDefinitions.ts", "server/routers.ts"]) {
      expect(read(f), f).not.toMatch(/never stack caveats/i);
    }
    expect(read("server/agentDefinitions.ts")).toContain("AI_COMPLIANCE_FLOOR");
  });

  it("the combo explainer no longer asks the model to call combos ideal, and runs on the preamble", () => {
    const routers = read("server/routers.ts");
    expect(routers).not.toMatch(/explain why the recommended Tax-Free Wealth Combos are ideal/);
    const i = routers.indexOf("You explain strategy combinations for Russell Capital Systems");
    expect(i).toBeGreaterThan(-1);
    expect(routers.slice(Math.max(0, i - 80), i)).toContain("${CLIENT_FACING_PREAMBLE}");
  });

  it("AI answers carry the one shared note", () => {
    const html = renderToStaticMarkup(createElement(AiAnswerNote));
    expect(html).toContain('data-testid="ai-answer-note"');
    expect(html).toContain(AI_ANSWER_NOTE);
    expect(AI_ANSWER_NOTE).toMatch(/AI-generated/);
    for (const f of [
      "client/src/components/AIChatBox.tsx",
      "client/src/components/VoiceAdvisor.tsx",
      "client/src/components/HomeAIConcierge.tsx",
      "client/src/pages/UltraCalculatorPage.tsx",
      "client/src/pages/portal/AiAssist.tsx",
      "client/src/pages/portal/AiStrategyRecommender.tsx",
      "client/src/pages/portal/ComboRecommender.tsx",
    ]) {
      expect(read(f), f).toContain("<AiAnswerNote");
    }
  });
});
