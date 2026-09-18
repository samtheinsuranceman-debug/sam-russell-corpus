// ============================================================
// JOURNEY ENGINE — the deterministic core of the Financial Librarian.
//
// Given everything a client asked (any number of questions) and their
// completed Financial Assessment, it:
//   1. distils the questions into 3–5 core questions,
//   2. surfaces the EMERGENT question — the pattern underneath their questions
//      and their facts that they have not asked yet,
//   3. composes a 10–15 page journey through the site, each page building on
//      the last (orient → understand → measure → compare → decide → protect →
//      review), including calculators where measuring matters.
//
// The AI advisory team (when configured) polishes the wording; it never
// changes which pages exist, and every step is validated against the catalog.
// ============================================================
import { FACT_FINDER_SECTIONS, isBlank, type ClientFactFinder } from "./clientFactFinder";
import { CATALOG_BY_ID, JOURNEY_CATALOG, type JourneyPage } from "./journeyCatalog";

export const JOURNEY_MIN = 10;
export const JOURNEY_MAX = 15;
export const CORE_QUESTIONS_MIN = 3;
export const CORE_QUESTIONS_MAX = 5;

// ─── topic detection ────────────────────────────────────────────────────────
const TOPIC_KEYWORDS: Array<{ tag: string; words: RegExp }> = [
  { tag: "tax", words: /\b(tax|taxes|irs|bracket|deduct|write[- ]?off|1099|w-?2|agi|capital gains?)\b/i },
  { tag: "roth", words: /\broth|conversion|backdoor\b/i },
  { tag: "mortgage", words: /\b(mortgage|refinanc|payoff|pay off|interest[- ]only|principal)\b/i },
  { tag: "equity", words: /\b(home equity|equity|heloc|line of credit|war[- ]chest)\b/i },
  { tag: "debt", words: /\b(debt|loan|loans|credit card|owe)\b/i },
  { tag: "student-loans", words: /\b(student|pslf|forgiveness)\b/i },
  { tag: "retirement", words: /\b(retire|retirement|401\(?k\)?|403\(?b\)?|ira|pension|social security|when can i)\b/i },
  { tag: "income", words: /\b(income|cash ?flow|paycheck|salary|earn)\b/i },
  { tag: "investments", words: /\b(invest|portfolio|stocks?|bonds?|market|allocation|brokerage|index|etf)\b/i },
  { tag: "volatility", words: /\b(volatil\w*|crash\w*|downturn\w*|recession\w*|lose|losses|risk\w*|safe\w*|guarantee\w*|floor\w*|protect(?:ed)? (?:my|from) (?:market|loss)\w*)\b/i },
  { tag: "iul", words: /\b(iul|indexed universal|life insurance|cash value|policy loan|permanent life|whole life)\b/i },
  { tag: "insurance", words: /\b(insurance|disability|malpractice|umbrella|coverage|term life)\b/i },
  { tag: "estate", words: /\b(estate|will|trust|inherit|heirs?|legacy|beneficiar|probate|kids|children)\b/i },
  { tag: "divorce", words: /\b(divorce|prenup|spouse leaves|separation|marital)\b/i },
  { tag: "asset-protection", words: /\b(lawsuit|sued|creditor|asset protection|liability|shield)\b/i },
  { tag: "practice", words: /\b(practice|business|partner(?:ship)?|buy[- ]in|entity|s[- ]?corp|llc|cash balance|exit|sell the practice)\b/i },
  { tag: "liquidity", words: /\b(liquid|emergency|cash on hand|access|tap into|reserve)\b/i },
  { tag: "real-estate", words: /\b(rental|real estate|property|properties|airbnb|str)\b/i },
  { tag: "oil-gas", words: /\b(oil|gas|drilling|intangible)\b/i },
  { tag: "strategy", words: /\b(strategy|strategies|plan|combine|best way|what should i do|priorit)\b/i },
  { tag: "time", words: /\b(how long|how soon|years|timeline|when should|delay|wait)\b/i },
];

export function detectTags(text: string): string[] {
  const tags = TOPIC_KEYWORDS.filter((t) => t.words.test(text)).map((t) => t.tag);
  if (/\bmortgage\b/i.test(text)) tags.push("home");
  return Array.from(new Set(tags));
}

// ─── fact-finder signals ────────────────────────────────────────────────────
export type Signal = { tag: string; weight: number; reason: string };

const num = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : 0);
const pri = (v: unknown): number => (typeof v === "string" ? Number.parseInt(v, 10) || 0 : 0);
const yes = (v: unknown): boolean => v === true || v === "Yes";

/** Reads the completed assessment and returns weighted topic signals. */
export function factFinderSignals(ff: ClientFactFinder | null | undefined): Signal[] {
  if (!ff) return [];
  const s = (id: string) => ff.sections?.[id] ?? {};
  const inc = s("income"), tax = s("taxes"), re = s("realEstate"), debt = s("debts"), inv = s("investments");
  const cash = s("cash"), ins = s("insurance"), prac = s("practice"), est = s("estate"), prot = s("protection"), ret = s("retirement"), hh = s("household");
  const out: Signal[] = [];
  const push = (tag: string, weight: number, reason: string) => { if (weight > 0) out.push({ tag, weight, reason }); };

  const totalIncome = num(inc.w2Income) + num(inc.bonusIncome) + num(inc.contractorIncome) + num(inc.practiceDistributions) + num(inc.spouseIncome);
  const agi = num(tax.adjustedGrossIncome) || totalIncome;
  const fedTax = num(tax.federalTaxPaid);
  const effRate = agi > 0 ? fedTax / agi : 0;
  if (effRate >= 0.28) push("tax", 5, `federal tax is about ${Math.round(effRate * 100)}% of income`);
  else if (effRate >= 0.2) push("tax", 3, `federal tax is about ${Math.round(effRate * 100)}% of income`);
  if (agi >= 400_000) push("high-income", 3, "income is in the top brackets");
  if (agi >= 400_000 && effRate >= 0.2) push("oil-gas", 2, "high W-2 income with limited deductions");
  if (yes(tax.niitExposure)) push("tax-free", 2, "net investment income tax applies");

  if (yes(re.ownsPrimaryHome) && num(re.primaryMortgageBalance) > 0) {
    push("mortgage", 4, `mortgage balance of ${fmtMoney(num(re.primaryMortgageBalance))}`);
    if (num(re.primaryMortgageYearsRemaining) >= 15) push("payoff", 3, `${num(re.primaryMortgageYearsRemaining)} years remaining on the mortgage`);
    if (yes(re.primaryInterestOnly)) push("interest", 3, "the mortgage is interest-only");
  }
  if (num(re.homeEquity) >= 200_000) push("equity", 4, `${fmtMoney(num(re.homeEquity))} of home equity`);
  if (num(re.homeEquity) >= 200_000 || num(re.helocLimit) > 0) push("war-chest", 3, "substantial equity available to cycle");
  if ((ff.lists?.properties?.length ?? 0) > 0) push("real-estate", 2, "additional properties owned");

  if (num(debt.studentLoanBalance) > 0) push("student-loans", 3, `student loans of ${fmtMoney(num(debt.studentLoanBalance))}`);
  if (num(debt.creditCardBalance) > 0 || num(debt.personalLoans) > 0) push("debt", 3, "consumer debt carried");
  if (num(debt.practiceLoanBalance) > 0) push("practice", 2, "practice debt outstanding");

  const taxDeferred = num(inv.employerPlanBalance) + num(inv.spouseEmployerPlanBalance) + num(inv.traditionalIra) + num(inv.cashBalancePlan);
  if (taxDeferred >= 250_000) push("roth", 4, `${fmtMoney(taxDeferred)} in tax-deferred accounts`);
  if (taxDeferred >= 250_000) push("withdrawal", 2, "large tax-deferred balances will face required distributions");
  if (yes(inv.concentratedPosition)) push("risk", 3, "a single holding exceeds 10% of investable assets");
  const rt = String(inv.riskTolerance ?? "");
  if (/conservative/i.test(rt) || /sell/i.test(String(inv.worstYearReaction ?? ""))) push("volatility", 4, "you would sell in a 30% drop or describe yourself as conservative");
  if (num(inv.taxableBrokerage) >= 250_000) push("tax-free", 2, "large taxable brokerage balance");

  if (num(cash.emergencyFundMonths) < 3) push("liquidity", 3, `only ${num(cash.emergencyFundMonths)} months of expenses in cash`);
  if (num(cash.liquidityNeeds12mo) > 0) push("liquidity", 2, "large cash need within 12 months");

  if (num(ins.disabilityMonthlyBenefit) <= 0) push("disability", 3, "no disability income coverage recorded");
  if (num(ins.termLifeDeathBenefit) + num(ins.permanentLifeDeathBenefit) <= 0 && num(hh.dependents) > 0) push("insurance", 3, "dependents but no life insurance recorded");
  if (num(ins.permanentLifeCashValue) > 0) push("iul", 2, "permanent life cash value in force");
  if (!isBlank(ins.coverageGapsConcern)) push("gaps", 2, "you suspect a coverage gap");

  if (yes(prac.ownsPractice)) push("practice", 4, "you own or partner in a practice");
  if (yes(prac.ownsPractice) && /Under 3|3–7/.test(String(prac.exitTimeline ?? ""))) push("succession", 3, "practice exit within seven years");

  if (est.hasWill === false) push("estate", 4, "no current will");
  if (est.hasRevocableTrust === false && agi >= 300_000) push("trust", 3, "no revocable trust at this income level");
  if (/Significant|Central/.test(String(est.charitableIntent ?? ""))) push("legacy", 2, "significant charitable intent");
  if (num(est.inheritanceExpected) > 0) push("legacy", 1, "an inheritance is expected");

  if (pri(prot.divorceProtectionPriority) >= 4) push("divorce", 4, "divorce protection rated essential");
  if (pri(prot.creditorProtectionPriority) >= 4) push("asset-protection", 4, "creditor protection rated essential");
  if (pri(prot.taxFreeIncomePriority) >= 4) push("tax-free", 3, "tax-free future income rated essential");
  if (/malpractice|surgeon|physician|psychiat/i.test(`${hh.occupation ?? ""} ${hh.specialty ?? ""}`)) push("malpractice", 2, "a liability-exposed profession");

  const age = ageFrom(hh.dateOfBirth);
  const target = num(ret.targetRetirementAge);
  if (age && target && target - age <= 10) push("retirement", 4, `retirement targeted within ${Math.max(0, target - age)} years`);
  else if (target) push("retirement", 2, `retirement targeted at ${target}`);
  if (num(ret.desiredRetirementIncomeMonthly) > 0) push("income", 2, "a retirement income target is set");
  if (num(ret.desiredRetirementIncomeMonthly) * 12 > 0.6 * totalIncome && totalIncome > 0) push("gap", 3, "the retirement income target is a large share of today's income");
  if (!isBlank(ret.retirementConcern) && /market|crash|run out|outliv/i.test(String(ret.retirementConcern))) push("volatility", 3, "your retirement worry is about markets or running out");

  return mergeSignals(out);
}

function mergeSignals(list: Signal[]): Signal[] {
  const by = new Map<string, Signal>();
  for (const s of list) {
    const cur = by.get(s.tag);
    if (!cur) by.set(s.tag, { ...s });
    else { cur.weight += s.weight; if (s.weight > cur.weight / 2) cur.reason = s.reason; }
  }
  return Array.from(by.values()).sort((a, b) => b.weight - a.weight);
}

function ageFrom(dob: unknown): number | null {
  if (typeof dob !== "string" || !dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000));
}

export function fmtMoney(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

// ─── distilling the questions ───────────────────────────────────────────────
const CORE_TEMPLATES: Record<string, string> = {
  tax: "How do I pay less tax on the income I already earn — this year and every year after?",
  roth: "When and how should tax-deferred money become tax-free money?",
  mortgage: "What is the fastest sensible way to be free of my mortgage, and what is that interest worth to me?",
  equity: "How can my home equity work for me without giving up liquidity or safety?",
  debt: "In what order should my debts be paid, and what should be paid off at all?",
  "student-loans": "What is the right plan for my student loans given my income and career track?",
  retirement: "When can I retire, on what income, and from which accounts first?",
  income: "How much income will my plan produce, and how reliable is it?",
  investments: "Is my money invested in a way that fits my goals and my nerves?",
  volatility: "How do I keep growing while controlling volatility and the variables I can actually control?",
  iul: "Where does permanent life insurance fit — as a tax-free reserve, a legacy, or not at all?",
  insurance: "Is my income and family protected if something goes wrong?",
  estate: "What happens to everything if I'm gone — and is that what I want?",
  divorce: "How do I keep what I've built if my marriage doesn't last?",
  "asset-protection": "How do I make my assets hard to reach for lawsuits and creditors?",
  practice: "How should my practice be structured for taxes, retirement, and an eventual exit?",
  liquidity: "How much should I keep liquid, and where, without idling money?",
  "real-estate": "Does real estate belong in my plan, and on what terms?",
  "oil-gas": "Do the large energy deductions fit my situation, and what are the risks?",
  strategy: "Which strategies belong in my plan, and in what order?",
  time: "What does waiting cost me, and what should happen first?",
};

const TAG_PRIORITY = ["tax", "mortgage", "retirement", "volatility", "roth", "equity", "estate", "divorce", "asset-protection", "practice", "student-loans", "debt", "iul", "insurance", "investments", "liquidity", "income", "real-estate", "oil-gas", "strategy", "time"];

export type Distilled = { question: string; tag: string; from: string[] };

/** Groups any number of client questions into 3–5 core questions. */
export function distillQuestions(questions: string[], signals: Signal[] = []): Distilled[] {
  const clean = questions.map((q) => q.trim()).filter((q) => q.length > 2);
  const groups = new Map<string, string[]>();
  const untagged: string[] = [];
  for (const q of clean) {
    const tags = detectTags(q).filter((t) => CORE_TEMPLATES[t]);
    if (tags.length === 0) { untagged.push(q); continue; }
    const primary = TAG_PRIORITY.find((t) => tags.includes(t)) ?? tags[0]!;
    groups.set(primary, [...(groups.get(primary) ?? []), q]);
  }
  let ordered = Array.from(groups.entries()).sort((a, b) => b[1].length - a[1].length || TAG_PRIORITY.indexOf(a[0]) - TAG_PRIORITY.indexOf(b[0]));
  if (untagged.length) ordered.push(["strategy", untagged]);
  const result: Distilled[] = ordered.slice(0, CORE_QUESTIONS_MAX).map(([tag, from]) => ({ question: CORE_TEMPLATES[tag] ?? from[0]!, tag, from }));
  // Too few? Let the strongest assessment signals supply the rest.
  for (const s of signals) {
    if (result.length >= CORE_QUESTIONS_MIN) break;
    if (result.some((r) => r.tag === s.tag) || !CORE_TEMPLATES[s.tag]) continue;
    result.push({ question: CORE_TEMPLATES[s.tag]!, tag: s.tag, from: [`from your assessment: ${s.reason}`] });
  }
  if (result.length === 0) result.push({ question: CORE_TEMPLATES.strategy!, tag: "strategy", from: [] });
  return result;
}

// ─── the emergent question ──────────────────────────────────────────────────
const EMERGENT_TEMPLATES: Record<string, (reason: string) => string> = {
  volatility: (r) => `Underneath your questions is a volatility question you haven't asked: given that ${r}, how do you keep the plan from depending on markets you can't control?`,
  tax: (r) => `The pattern beneath your questions is a tax question: ${r} — every strategy you asked about changes in value once that is addressed first.`,
  equity: (r) => `You haven't asked about the largest asset on your balance sheet: ${r}. How it is deployed decides how fast everything else moves.`,
  "war-chest": (r) => `The unasked question is liquidity: ${r}. A plan that can't be reached on demand fails the moment life needs it.`,
  roth: (r) => `The question you haven't asked is about the tax-deferred balances: ${r}. Left alone, they become a tax problem in retirement — sequenced deliberately, they become tax-free income.`,
  estate: (r) => `Every question you asked assumes you're here to see the results. The emergent question is what happens if you're not — ${r}.`,
  divorce: (r) => `You rated protection as essential (${r}) but haven't asked how the plan survives a divorce. That is the question the structure has to answer first.`,
  "asset-protection": (r) => `The pattern beneath your questions is exposure: ${r}. Growth without protection is growth someone else can claim.`,
  disability: (r) => `The question missing from your list is what happens to the whole plan if you can't work: ${r}.`,
  liquidity: (r) => `Behind your questions sits a liquidity question: ${r}. Any strategy that locks money away needs that answered first.`,
  retirement: (r) => `Your questions point somewhere you haven't asked about directly: ${r}. The timeline sets the pace of every other decision.`,
  practice: (r) => `You haven't asked about the business itself: ${r}. Its structure decides your taxes, your retirement plan, and your exit.`,
  "student-loans": (r) => `The unasked question is the loans: ${r}. Their treatment changes how much cash the rest of the plan has to work with.`,
  mortgage: (r) => `You asked around the mortgage but not about it: ${r}. Interest recovered there funds much of what you asked for.`,
  insurance: (r) => `The emergent question is protection of the people the plan is for: ${r}.`,
  gap: (r) => `The pattern underneath is an income gap: ${r}. Everything you asked about is really about closing it.`,
};

export function emergentQuestion(distilled: Distilled[], signals: Signal[]): { question: string; tag: string; reason: string } {
  const asked = new Set(distilled.map((d) => d.tag));
  const related: Record<string, string[]> = { mortgage: ["payoff", "interest", "home"], equity: ["war-chest", "heloc"], retirement: ["gap", "withdrawal", "income"], volatility: ["risk"], insurance: ["disability", "gaps", "malpractice"], "asset-protection": ["trust", "malpractice"], estate: ["trust", "legacy"] };
  const covered = new Set<string>();
  for (const a of Array.from(asked)) { covered.add(a); for (const r of related[a] ?? []) covered.add(r); }
  const candidate = signals.find((s) => !covered.has(s.tag) && EMERGENT_TEMPLATES[s.tag]) ?? signals.find((s) => EMERGENT_TEMPLATES[s.tag]);
  if (!candidate) {
    return { question: "The question underneath all of yours: in what order should these moves happen so each one funds the next?", tag: "strategy", reason: "sequencing" };
  }
  return { question: EMERGENT_TEMPLATES[candidate.tag]!(candidate.reason), tag: candidate.tag, reason: candidate.reason };
}

// ─── composing the journey ──────────────────────────────────────────────────
export type JourneyStep = { id: string; path: string; title: string; why: string; guide: string; kind: string; serves: string[] };
export type JourneyControls = { youControl: string[]; youDont: string[] };
export type Journey = {
  coreQuestions: string[];
  emergentQuestion: string;
  steps: JourneyStep[];
  /** The variables the client can actually move, and the ones the plan must survive instead. */
  controls: JourneyControls;
  generatedBy: string;
};

const TAG_ALIASES: Record<string, string[]> = {
  mortgage: ["mortgage", "payoff", "interest", "home", "debt"],
  equity: ["equity", "heloc", "war-chest", "liquidity", "iul"],
  debt: ["debt", "student-loans", "household", "payoff"],
  "student-loans": ["student-loans", "debt", "physician", "household"],
  retirement: ["retirement", "income", "gap", "withdrawal", "social-security", "longevity"],
  income: ["income", "retirement", "gap", "timeline"],
  investments: ["investments", "growth", "allocation", "evidence", "risk"],
  volatility: ["volatility", "risk", "floor", "stress", "sequence-risk", "guarantee", "control", "variables"],
  tax: ["tax", "brackets", "waterfall", "deduction", "tax-free", "combination"],
  roth: ["roth", "conversion", "tax-free", "withdrawal"],
  iul: ["iul", "tax-free", "loans", "insurance", "floor"],
  insurance: ["insurance", "disability", "gaps", "protection", "malpractice"],
  estate: ["estate", "legacy", "heirs", "beneficiaries", "trust", "will"],
  divorce: ["divorce", "protection", "asset-protection", "trust"],
  "asset-protection": ["asset-protection", "creditor", "trust", "protection", "malpractice"],
  practice: ["practice", "business", "entity", "succession", "cash-balance"],
  liquidity: ["liquidity", "war-chest", "loans", "heloc"],
  "real-estate": ["real-estate", "rental", "leverage"],
  "oil-gas": ["oil-gas", "deduction", "high-income"],
  strategy: ["strategy", "combination", "coordination", "recommendation", "decision"],
  time: ["time", "delay", "compounding", "urgency"],
  gap: ["gap", "income", "retirement"],
  disability: ["disability", "insurance", "gaps"],
  "war-chest": ["war-chest", "equity", "liquidity", "loans"],
  "high-income": ["high-income", "tax", "physician"],
  "tax-free": ["tax-free", "roth", "iul", "combination"],
  malpractice: ["malpractice", "protection", "asset-protection"],
  succession: ["succession", "business", "practice"],
  trust: ["trust", "estate", "asset-protection"],
  legacy: ["legacy", "estate"],
  risk: ["risk", "volatility", "stress"],
  withdrawal: ["withdrawal", "sequence", "retirement"],
  payoff: ["payoff", "mortgage", "interest"],
  interest: ["interest", "mortgage"],
};

function expand(tag: string): string[] { return TAG_ALIASES[tag] ?? [tag]; }

export function buildJourney(questions: string[], ff: ClientFactFinder | null | undefined): Journey {
  const signals = factFinderSignals(ff);
  const distilled = distillQuestions(questions, signals);
  const emergent = emergentQuestion(distilled, signals);

  // Score every catalog page.
  const scores = new Map<string, { score: number; serves: Set<string> }>();
  for (const page of JOURNEY_CATALOG) {
    let score = 0;
    const serves = new Set<string>();
    distilled.forEach((d, i) => {
      const hits = expand(d.tag).filter((t) => page.tags.includes(t)).length;
      if (hits) { score += hits * 3 + (CORE_QUESTIONS_MAX - i); serves.add(`Q${i + 1}`); }
    });
    const eh = expand(emergent.tag).filter((t) => page.tags.includes(t)).length;
    if (eh) { score += eh * 3 + 2; serves.add("emergent"); }
    for (const s of signals) {
      if (page.tags.includes(s.tag)) score += Math.min(s.weight, 5);
    }
    scores.set(page.id, { score, serves });
  }

  const chosen: JourneyPage[] = [];
  const take = (id: string) => { const p = CATALOG_BY_ID[id]; if (p && !chosen.some((c) => c.id === id)) chosen.push(p); };

  // 1. Always orient first: the mirror (where you stand) and the genome score.
  take("mirror");
  take("wealth-genome");
  // 2. Two best pages per core question, in question order, then the emergent pages.
  const byScore = [...JOURNEY_CATALOG].sort((a, b) => (scores.get(b.id)!.score - scores.get(a.id)!.score) || a.builds - b.builds);
  distilled.forEach((_, i) => {
    let n = 0;
    for (const p of byScore) {
      if (n >= 2) break;
      if (scores.get(p.id)!.serves.has(`Q${i + 1}`) && !chosen.some((c) => c.id === p.id)) { chosen.push(p); n += 1; }
    }
  });
  let e = 0;
  for (const p of byScore) {
    if (e >= 2) break;
    if (scores.get(p.id)!.serves.has("emergent") && !chosen.some((c) => c.id === p.id)) { chosen.push(p); e += 1; }
  }
  // 3. Guarantee coverage of the arc: at least one calculator, one comparison,
  //    one variables/volatility control page, and protection when it matters.
  const ensureKind = (pred: (p: JourneyPage) => boolean) => {
    if (chosen.some(pred)) return;
    const best = byScore.find((p) => pred(p) && !chosen.some((c) => c.id === p.id));
    if (best) chosen.push(best);
  };
  ensureKind((p) => p.kind === "calculator");
  ensureKind((p) => p.kind === "comparison");
  ensureKind((p) => p.tags.includes("control") || p.tags.includes("variables") || p.tags.includes("volatility"));
  if (signals.some((s) => ["divorce", "asset-protection", "malpractice"].includes(s.tag))) ensureKind((p) => p.kind === "protection");
  if (signals.some((s) => ["estate", "trust", "legacy"].includes(s.tag))) ensureKind((p) => p.kind === "legacy");
  // 4. Fill to the minimum with the next best pages, then close with a review.
  for (const p of byScore) {
    if (chosen.length >= JOURNEY_MAX - 1) break;
    if (chosen.length >= JOURNEY_MIN - 1 && scores.get(p.id)!.score === 0) break;
    if (!chosen.some((c) => c.id === p.id) && p.kind !== "review") chosen.push(p);
  }
  take("russell-number");
  while (chosen.length < JOURNEY_MIN) { const p = byScore.find((x) => !chosen.some((c) => c.id === x.id)); if (!p) break; chosen.splice(chosen.length - 1, 0, p); }

  // 5. Sequence: orientation first, then by build order, then by score; review last.
  const ordered = chosen
    .map((p, idx) => ({ p, idx }))
    .sort((a, b) => (a.p.builds - b.p.builds) || (scores.get(b.p.id)!.score - scores.get(a.p.id)!.score) || (a.idx - b.idx))
    .map((x) => x.p)
    .slice(0, JOURNEY_MAX);

  const steps: JourneyStep[] = ordered.map((p, i) => {
    const sv = Array.from(scores.get(p.id)?.serves ?? []);
    const servesText = sv.length
      ? ` It serves ${sv.map((s) => (s === "emergent" ? "the emergent question" : `question ${s.slice(1)}`)).join(" and ")}.`
      : "";
    const bridge = i === 0 ? "Start here." : i === ordered.length - 1 ? "Close the loop." : `Builds on “${ordered[i - 1]!.title}”.`;
    const answers = sv.map((s) => (s === "emergent" ? `the question you hadn't asked` : distilled[Number(s.slice(1)) - 1]?.question)).filter(Boolean);
    const guide = (answers.length ? `This page works on: ${answers.map((a) => `“${a}”`).join(" and ")}. ` : "") + p.walkthrough;
    return { id: p.id, path: p.path, title: p.title, kind: p.kind, serves: sv, why: `${bridge} ${p.purpose}${servesText}`, guide };
  });

  return {
    coreQuestions: distilled.map((d) => d.question),
    emergentQuestion: emergent.question,
    steps,
    controls: journeyControls(distilled, signals),
    generatedBy: "journey-engine",
  };
}

// ─── the variables the client controls ──────────────────────────────────────
const CONTROL_TEMPLATES: Record<string, string> = {
  tax: "How much of your income is taxed — through deductions, plan design, and conversion timing",
  roth: "The pace of converting tax-deferred money to tax-free money",
  mortgage: "How fast the mortgage is retired, and how much interest you recover",
  payoff: "Extra principal each month",
  equity: "Whether home equity sits idle or is cycled into a liquid reserve",
  "war-chest": "The size of the liquid, tax-advantaged reserve you keep on demand",
  debt: "The order and speed of paying each debt",
  "student-loans": "The repayment or forgiveness track for the student loans",
  retirement: "Your retirement date and the income target",
  income: "How much of today's income you save",
  investments: "Your allocation and how diversified it is",
  volatility: "Floors, guarantees, and reserves that decide whether a downturn ever forces a sale",
  risk: "The concentration you hold in any single position",
  iul: "Whether a permanent policy is used as a tax-free reserve",
  insurance: "Life, disability, and liability coverage in force",
  disability: "Disability coverage and its definition of occupation",
  estate: "Whether a will, trust, and powers of attorney exist and are current",
  divorce: "The structures that keep assets separate if a marriage ends",
  "asset-protection": "Which assets sit inside protected structures",
  practice: "Entity, retirement-plan design, and exit timing for the practice",
  liquidity: "Months of expenses held in cash",
  time: "When the first move happens — every year of delay is a variable you control",
};
const UNCONTROLLED = [
  "Market returns in any given year",
  "Interest rates set by the Federal Reserve",
  "Changes to the tax code",
  "How long you and your spouse live",
  "Health events and the timing of a claim",
  "Inflation",
];

/** What the client can move (from their questions and facts) versus what the plan must simply survive. */
export function journeyControls(distilled: Distilled[], signals: Signal[]): JourneyControls {
  const tags: string[] = [];
  for (const d of distilled) tags.push(d.tag, ...expand(d.tag));
  for (const s of signals.slice(0, 8)) tags.push(s.tag);
  const seen = new Set<string>();
  const youControl: string[] = [];
  for (const t of tags) {
    const line = CONTROL_TEMPLATES[t];
    if (line && !seen.has(line)) { seen.add(line); youControl.push(line); }
    if (youControl.length >= 7) break;
  }
  if (!seen.has(CONTROL_TEMPLATES.time!)) youControl.push(CONTROL_TEMPLATES.time!);
  return { youControl, youDont: UNCONTROLLED };
}

/** Validates a journey (e.g. one an AI polished) against the catalog and size rules. */
export function validateJourney(j: Journey): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  if (j.coreQuestions.length < CORE_QUESTIONS_MIN || j.coreQuestions.length > CORE_QUESTIONS_MAX) problems.push(`core questions: ${j.coreQuestions.length} (need ${CORE_QUESTIONS_MIN}–${CORE_QUESTIONS_MAX})`);
  if (!j.emergentQuestion || j.emergentQuestion.length < 20) problems.push("emergent question missing");
  if (j.steps.length < JOURNEY_MIN || j.steps.length > JOURNEY_MAX) problems.push(`steps: ${j.steps.length} (need ${JOURNEY_MIN}–${JOURNEY_MAX})`);
  if (!j.controls || j.controls.youControl.length === 0 || j.controls.youDont.length === 0) problems.push("controls missing");
  const seen = new Set<string>();
  for (const s of j.steps) {
    if (!s.guide || s.guide.length < 20) problems.push(`guide missing for ${s.id}`);
    const p = CATALOG_BY_ID[s.id];
    if (!p) problems.push(`unknown page ${s.id}`);
    else if (p.path !== s.path) problems.push(`path mismatch for ${s.id}`);
    if (seen.has(s.id)) problems.push(`duplicate ${s.id}`);
    seen.add(s.id);
  }
  return { ok: problems.length === 0, problems };
}

/** Short summary of the assessment for the librarian's own reasoning. */
export function assessmentHeadline(ff: ClientFactFinder | null | undefined): string {
  if (!ff) return "";
  const hh = ff.sections?.household ?? {};
  const name = [hh.firstName, hh.lastName].filter((v) => !isBlank(v as never)).join(" ");
  const sections = FACT_FINDER_SECTIONS.length;
  return `${name || "Client"} · ${sections}-section assessment complete`;
}
