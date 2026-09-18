// ============================================================
// AI INTAKE SCRIPT — the spoken fact finder.
//
// The blue microphone on every role dashboard runs this script: one
// question at a time, in the order a seasoned advisor asks them — cash,
// stocks outside the IRA, bonds, funds and annuities, the home, the
// rentals, the retirement accounts, the unusual assets — then the AI
// re-explains everything back, asks what matters most and for three
// magic wishes, asks permission, and hands over the three questions the
// person would otherwise ask themselves in five, ten and fifteen years.
//
// Shared by client and server: the browser walks the steps and parses
// spoken answers; the server maps the answers into the Financial
// Assessment and builds the three questions from the same script.
// ============================================================
import { emptyFactFinder, type ClientFactFinder, type FieldValue } from "./clientFactFinder";

export type IntakeRole = "physician" | "client" | "advisor";

export const INTAKE_ROLES: Record<IntakeRole, { label: string; loginLabel: string; path: string; blurb: string }> = {
  physician: { label: "Physician", loginLabel: "Physician Login", path: "/portal/physician", blurb: "For the doctor whose income, taxes and legacy the plan protects." },
  client: { label: "Client", loginLabel: "Client Login", path: "/portal/client", blurb: "For every household the firm serves." },
  advisor: { label: "Advisor", loginLabel: "Advisor Login", path: "/portal/advisor", blurb: "For the advisor running the book and the calculators." },
};

export function isIntakeRole(v: unknown): v is IntakeRole {
  return v === "physician" || v === "client" || v === "advisor";
}

export type StepKind = "money" | "percent" | "number" | "text" | "yesno" | "choice";
export type IntakePhase = "cash" | "stocks" | "bonds" | "funds" | "annuity" | "home" | "rentals" | "retirement" | "unusual";

export type AnswerValue = string | number | boolean | null;
export type Answers = Record<string, AnswerValue>;

export type IntakeStep = {
  id: string;
  phase: IntakePhase;
  /** What the advisor says out loud. */
  say: string;
  kind: StepKind;
  options?: string[];
  /** Only ask when this predicate on the answers so far is true. */
  askIf?: (a: Answers) => boolean;
  /** Where the answer lands in the Financial Assessment. */
  map?: { section: string; key: string };
};

export const PHASE_TITLES: Record<IntakePhase, string> = {
  cash: "Cash",
  stocks: "Stocks outside the IRA",
  bonds: "Bonds outside the IRA",
  funds: "Mutual funds",
  annuity: "Annuities",
  home: "Your home",
  rentals: "Rental properties",
  retirement: "Retirement accounts",
  unusual: "Unusual assets",
};

const yes = (a: Answers, id: string) => a[id] === true;
const no = (a: Answers, id: string) => a[id] === false;

export const INTAKE_STEPS: IntakeStep[] = [
  // ── cash ──────────────────────────────────────────────────────────────
  { id: "cash.moneyMarket", phase: "cash", kind: "money", say: "Let's start with cash. Roughly how much do you have in money market accounts? If none, just say none." },
  { id: "cash.cds", phase: "cash", kind: "money", say: "How much is in CDs or Treasury bills?" },
  { id: "cash.checking", phase: "cash", kind: "money", say: "About how much sits in checking?", map: { section: "cash", key: "checking" } },
  { id: "cash.savings", phase: "cash", kind: "money", say: "And in savings, including any high-yield savings?", map: { section: "cash", key: "savings" } },
  { id: "cash.rate", phase: "cash", kind: "percent", say: "What interest rate is that cash earning, roughly? A ballpark percentage is fine." },

  // ── stocks outside the IRA ────────────────────────────────────────────
  { id: "stocks.has", phase: "stocks", kind: "yesno", say: "Do you own stocks or a brokerage portfolio outside of your IRA or 401k?" },
  { id: "stocks.value", phase: "stocks", kind: "money", say: "What is that portfolio worth today, roughly?", askIf: (a) => yes(a, "stocks.has"), map: { section: "investments", key: "taxableBrokerage" } },
  { id: "stocks.manager", phase: "stocks", kind: "choice", say: "Who manages it? You, a financial advisor, a robo-advisor, or someone else?", options: ["Myself", "A financial advisor", "A robo-advisor", "Someone else"], askIf: (a) => yes(a, "stocks.has") },
  { id: "stocks.advisorName", phase: "stocks", kind: "text", say: "What is your advisor's first name?", askIf: (a) => yes(a, "stocks.has") && a["stocks.manager"] === "A financial advisor" },
  { id: "stocks.advisorYears", phase: "stocks", kind: "number", say: "How many years have you been with them?", askIf: (a) => yes(a, "stocks.has") && a["stocks.manager"] === "A financial advisor" },

  // ── bonds outside the IRA ─────────────────────────────────────────────
  { id: "bonds.has", phase: "bonds", kind: "yesno", say: "Do you hold any bonds outside of your retirement accounts?" },
  { id: "bonds.value", phase: "bonds", kind: "money", say: "About how much in bonds?", askIf: (a) => yes(a, "bonds.has") },
  { id: "bonds.rate", phase: "bonds", kind: "percent", say: "What rate are those bonds paying?", askIf: (a) => yes(a, "bonds.has") },

  // ── mutual funds ──────────────────────────────────────────────────────
  { id: "funds.has", phase: "funds", kind: "yesno", say: "Do you have mutual funds outside of your retirement accounts?" },
  { id: "funds.value", phase: "funds", kind: "money", say: "What are the mutual funds worth, roughly?", askIf: (a) => yes(a, "funds.has") },
  { id: "funds.avgReturn", phase: "funds", kind: "percent", say: "What has their average return been, if you know it?", askIf: (a) => yes(a, "funds.has") },

  // ── annuities ─────────────────────────────────────────────────────────
  { id: "annuity.has", phase: "annuity", kind: "yesno", say: "Do you own any annuities?" },
  { id: "annuity.company", phase: "annuity", kind: "text", say: "Which insurance company is the annuity with?", askIf: (a) => yes(a, "annuity.has") },
  { id: "annuity.yearBought", phase: "annuity", kind: "number", say: "What year did you buy it? Or tell me how many years ago.", askIf: (a) => yes(a, "annuity.has") },
  { id: "annuity.value", phase: "annuity", kind: "money", say: "What is the account value today?", askIf: (a) => yes(a, "annuity.has"), map: { section: "investments", key: "annuities" } },
  { id: "annuity.guaranteed", phase: "annuity", kind: "yesno", say: "Does it guarantee income for life?", askIf: (a) => yes(a, "annuity.has") },
  { id: "annuity.monthlyIncome", phase: "annuity", kind: "money", say: "What is the guaranteed monthly income?", askIf: (a) => yes(a, "annuity.has") && yes(a, "annuity.guaranteed") },
  { id: "annuity.avgReturn", phase: "annuity", kind: "percent", say: "What has the average return on the annuity been?", askIf: (a) => yes(a, "annuity.has") && no(a, "annuity.guaranteed") },

  // ── the home ──────────────────────────────────────────────────────────
  { id: "home.owns", phase: "home", kind: "yesno", say: "Now your personal home. Do you own it?", map: { section: "realEstate", key: "ownsPrimaryHome" } },
  { id: "home.value", phase: "home", kind: "money", say: "What is the home worth today, roughly?", askIf: (a) => yes(a, "home.owns"), map: { section: "realEstate", key: "primaryHomeValue" } },
  { id: "home.mortgage", phase: "home", kind: "money", say: "And the mortgage balance on it? Say none if it is paid off.", askIf: (a) => yes(a, "home.owns"), map: { section: "realEstate", key: "primaryMortgageBalance" } },
  { id: "home.zip", phase: "home", kind: "text", say: "What is the five-digit ZIP code of the home? The Zip Engine reads its price and rent history from the public record.", askIf: (a) => yes(a, "home.owns"), map: { section: "realEstate", key: "primaryHomeZip" } },

  // ── rentals ───────────────────────────────────────────────────────────
  { id: "rentals.has", phase: "rentals", kind: "yesno", say: "Do you own any rental properties?" },
  { id: "rentals.count", phase: "rentals", kind: "number", say: "How many rental properties?", askIf: (a) => yes(a, "rentals.has") },
  { id: "rentals.mortgageTotal", phase: "rentals", kind: "money", say: "Add up every mortgage balance on the rentals and give me one total.", askIf: (a) => yes(a, "rentals.has") },
  { id: "rentals.interestOnly", phase: "rentals", kind: "money", say: "What would the interest-only payment be each month on each home? If there are several, add them together.", askIf: (a) => yes(a, "rentals.has") },
  { id: "rentals.equity", phase: "rentals", kind: "money", say: "What is the total equity across the rental properties?", askIf: (a) => yes(a, "rentals.has") },
  { id: "rentals.rent", phase: "rentals", kind: "money", say: "What is the total net rent per month after expenses?", askIf: (a) => yes(a, "rentals.has") },

  // ── retirement accounts ───────────────────────────────────────────────
  { id: "retire.employer", phase: "retirement", kind: "money", say: "Retirement accounts now. What is in your 401k, 403b or TSP?", map: { section: "investments", key: "employerPlanBalance" } },
  { id: "retire.ira", phase: "retirement", kind: "money", say: "Traditional IRA or SEP IRA?", map: { section: "investments", key: "traditionalIra" } },
  { id: "retire.roth", phase: "retirement", kind: "money", say: "Roth IRA?", map: { section: "investments", key: "rothIra" } },
  { id: "retire.spouseHas", phase: "retirement", kind: "yesno", say: "Does your wife or husband have retirement accounts?" },
  { id: "retire.spouseValue", phase: "retirement", kind: "money", say: "What are their retirement accounts worth in total?", askIf: (a) => yes(a, "retire.spouseHas"), map: { section: "investments", key: "spouseEmployerPlanBalance" } },

  // ── unusual assets ────────────────────────────────────────────────────
  { id: "unusual.crypto", phase: "unusual", kind: "money", say: "Last group, the unusual assets. Any crypto? Roughly what value?" },
  { id: "unusual.metals", phase: "unusual", kind: "money", say: "Gold or silver?" },
  { id: "unusual.hard", phase: "unusual", kind: "money", say: "Other hard assets: classic cars, a gun collection, stamps, art, equipment? Give me a rough total value." },
  { id: "unusual.detail", phase: "unusual", kind: "text", say: "Tell me what those hard assets are, so nothing is missed.", askIf: (a) => num(a["unusual.hard"]) > 0 },
];

export const INTAKE_STEP_BY_ID: Record<string, IntakeStep> = Object.fromEntries(INTAKE_STEPS.map((s) => [s.id, s]));

/** The next unanswered step whose branch condition holds, or null when the intake is done. */
export function nextStep(answers: Answers): IntakeStep | null {
  for (const s of INTAKE_STEPS) {
    if (s.askIf && !s.askIf(answers)) continue;
    if (s.id in answers) continue;
    return s;
  }
  return null;
}

/** Steps that apply given the answers so far (for the progress bar). */
export function applicableSteps(answers: Answers): IntakeStep[] {
  return INTAKE_STEPS.filter((s) => !s.askIf || s.askIf(answers));
}

export function intakeProgress(answers: Answers): { answered: number; total: number; percent: number } {
  const steps = applicableSteps(answers);
  const answered = steps.filter((s) => s.id in answers).length;
  return { answered, total: steps.length, percent: steps.length ? Math.round((answered / steps.length) * 100) : 0 };
}

// ─── parsing spoken answers ───────────────────────────────────────────────

export function num(v: AnswerValue | undefined): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

const NONE = /^\s*(none|nothing|zero|nada|no|nope|not any|i don'?t|we don'?t|don'?t have|do not have|n\/a)\b/i;

const WORD_NUMBERS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20,
  thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90, hundred: 100,
};

/** "about 250k", "$1.2 million", "two hundred thousand", "none" → dollars. Returns null when no amount is heard. */
export function parseMoney(text: string): number | null {
  const t = text.trim().toLowerCase();
  if (!t) return null;
  if (NONE.test(t)) return 0;
  const cleaned = t.replace(/[$,]/g, "");
  const m = cleaned.match(/(\d+(?:\.\d+)?)\s*(k|m|mm|thousand|grand|million|mil|billion)?\b/);
  if (m) {
    let n = parseFloat(m[1]);
    const unit = m[2] ?? "";
    if (unit === "k" || unit === "thousand" || unit === "grand") n *= 1_000;
    else if (unit === "m" || unit === "mm" || unit === "million" || unit === "mil") n *= 1_000_000;
    else if (unit === "billion") n *= 1_000_000_000;
    return Math.round(n);
  }
  // Spoken words: "two hundred thousand", "half a million".
  if (/half a million/.test(cleaned)) return 500_000;
  if (/quarter (of a )?million/.test(cleaned)) return 250_000;
  const words = cleaned.split(/[\s-]+/);
  let total = 0;
  let current = 0;
  let heard = false;
  for (const w of words) {
    if (w in WORD_NUMBERS) {
      heard = true;
      const v = WORD_NUMBERS[w];
      if (v === 100) current = (current || 1) * 100;
      else current += v;
    } else if (w === "thousand") { heard = true; total += (current || 1) * 1_000; current = 0; }
    else if (w === "million") { heard = true; total += (current || 1) * 1_000_000; current = 0; }
  }
  return heard ? total + current : null;
}

export function parsePercent(text: string): number | null {
  const t = text.trim().toLowerCase();
  if (!t) return null;
  if (NONE.test(t) || /not sure|don'?t know|no idea|unsure/.test(t)) return 0;
  const m = t.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
  if (m) return parseFloat(m[1]);
  const w = t.split(/[\s-]+/).find((x) => x in WORD_NUMBERS);
  return w ? WORD_NUMBERS[w] : null;
}

export function parseNumber(text: string): number | null {
  const t = text.trim().toLowerCase();
  if (!t) return null;
  if (NONE.test(t)) return 0;
  const m = t.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
  if (m) return parseFloat(m[1]);
  const w = t.split(/[\s-]+/).find((x) => x in WORD_NUMBERS);
  return w ? WORD_NUMBERS[w] : null;
}

export function parseYesNo(text: string): boolean | null {
  const t = text.trim().toLowerCase();
  if (!t) return null;
  if (/^(y|yes|yeah|yep|yup|sure|correct|absolutely|i do|we do|of course|definitely|right|true|affirmative|a little|some|a few)\b/.test(t)) return true;
  if (/^(n|no|nope|none|nah|not really|i don'?t|we don'?t|negative|false|never)\b/.test(t)) return false;
  if (/\b(yes|i do|we do|we have|i have|i own|we own)\b/.test(t)) return true;
  if (/\b(no|none|don'?t|do not|nothing)\b/.test(t)) return false;
  return null;
}

export function parseChoice(text: string, options: string[]): string | null {
  const t = text.trim().toLowerCase();
  if (!t) return null;
  for (const o of options) if (t.includes(o.toLowerCase())) return o;
  if (/\b(me|myself|i do|i manage|on my own|self)\b/.test(t)) return options.find((o) => /myself/i.test(o)) ?? null;
  if (/\b(advisor|adviser|broker|planner|edward|schwab|fidelity|merrill|morgan|wealth manager|guy|lady|firm)\b/.test(t)) return options.find((o) => /financial advisor/i.test(o)) ?? null;
  if (/\b(robo|betterment|wealthfront|automated|algorithm)\b/.test(t)) return options.find((o) => /robo/i.test(o)) ?? null;
  if (/\b(someone|somebody|else|family|brother|father|friend|wife|husband)\b/.test(t)) return options.find((o) => /someone/i.test(o)) ?? null;
  return null;
}

/** Turn what was heard into a stored answer for this step; null means "did not understand, ask again". */
export function parseAnswer(step: IntakeStep, text: string): AnswerValue | null {
  switch (step.kind) {
    case "money": return parseMoney(text);
    case "percent": return parsePercent(text);
    case "number": {
      const n = parseNumber(text);
      if (n === null) return null;
      // "12 years ago" for the annuity purchase year.
      if (step.id === "annuity.yearBought" && /ago/.test(text) && n < 100) return new Date().getFullYear() - n;
      return n;
    }
    case "yesno": return parseYesNo(text);
    case "choice": return parseChoice(text, step.options ?? []);
    case "text": return text.trim() || null;
  }
}

// ─── formatting and the recap ──────────────────────────────────────────────

export function money(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function intakeTotals(a: Answers) {
  const cash = num(a["cash.moneyMarket"]) + num(a["cash.cds"]) + num(a["cash.checking"]) + num(a["cash.savings"]);
  const taxable = num(a["stocks.value"]) + num(a["bonds.value"]) + num(a["funds.value"]);
  const annuity = num(a["annuity.value"]);
  const homeValue = num(a["home.value"]);
  const homeMortgage = num(a["home.mortgage"]);
  const homeEquity = a["home.owns"] === true ? Math.max(0, homeValue - homeMortgage) : 0;
  const rentalEquity = num(a["rentals.equity"]);
  const rentalMortgage = num(a["rentals.mortgageTotal"]);
  const retirement = num(a["retire.employer"]) + num(a["retire.ira"]) + num(a["retire.roth"]) + num(a["retire.spouseValue"]);
  const unusual = num(a["unusual.crypto"]) + num(a["unusual.metals"]) + num(a["unusual.hard"]);
  const netWorth = cash + taxable + annuity + homeEquity + rentalEquity + retirement + unusual;
  const liquid = cash + taxable;
  return { cash, taxable, annuity, homeValue, homeMortgage, homeEquity, rentalEquity, rentalMortgage, retirement, unusual, netWorth, liquid };
}

/** The advisor re-explains everything back, section by section, in plain sentences. */
export function buildRecap(a: Answers): string[] {
  const t = intakeTotals(a);
  const out: string[] = [];
  const cashRate = num(a["cash.rate"]);
  out.push(`Here is what I heard. In cash you hold about ${money(t.cash)}: ${money(num(a["cash.moneyMarket"]))} in money market, ${money(num(a["cash.cds"]))} in CDs or T-bills, ${money(num(a["cash.checking"]))} in checking and ${money(num(a["cash.savings"]))} in savings, earning roughly ${cashRate}%${cashRate < 3 ? ", which is below what inflation is taking" : ""}.`);
  if (a["stocks.has"] === true) {
    const mgr = String(a["stocks.manager"] ?? "");
    const who = mgr === "A financial advisor"
      ? `managed by your advisor${a["stocks.advisorName"] ? ` ${String(a["stocks.advisorName"])}` : ""}${num(a["stocks.advisorYears"]) ? ` for about ${num(a["stocks.advisorYears"])} years` : ""}`
      : mgr === "Myself" ? "which you manage yourself" : mgr ? `managed by ${mgr.toLowerCase()}` : "";
    out.push(`Outside your retirement accounts you have a stock portfolio worth about ${money(num(a["stocks.value"]))}${who ? `, ${who}` : ""}.`);
  } else out.push("You hold no stocks outside your retirement accounts.");
  if (a["bonds.has"] === true) out.push(`You hold about ${money(num(a["bonds.value"]))} in bonds paying around ${num(a["bonds.rate"])}%.`);
  if (a["funds.has"] === true) out.push(`Your mutual funds outside retirement are worth about ${money(num(a["funds.value"]))}${num(a["funds.avgReturn"]) ? `, averaging ${num(a["funds.avgReturn"])}%` : ""}.`);
  if (a["annuity.has"] === true) {
    const yr = num(a["annuity.yearBought"]);
    const ago = yr ? new Date().getFullYear() - yr : 0;
    out.push(`You own an annuity with ${String(a["annuity.company"] ?? "an insurer")}${yr ? `, bought in ${yr}, about ${ago} years ago` : ""}, worth ${money(num(a["annuity.value"]))}. ${a["annuity.guaranteed"] === true ? `It guarantees ${money(num(a["annuity.monthlyIncome"]))} a month for life.` : `It does not guarantee lifetime income; it has averaged about ${num(a["annuity.avgReturn"])}%.`}`);
  }
  if (a["home.owns"] === true) out.push(`Your home is worth about ${money(t.homeValue)} with ${t.homeMortgage ? `a mortgage of ${money(t.homeMortgage)}` : "no mortgage"}, so roughly ${money(t.homeEquity)} of equity${a["home.zip"] ? ` in ZIP ${String(a["home.zip"])}` : ""}.`);
  else out.push("You rent rather than own your home.");
  if (a["rentals.has"] === true) out.push(`You own ${num(a["rentals.count"]) || "several"} rental properties with ${money(t.rentalMortgage)} of total mortgage balances, interest-only payments of about ${money(num(a["rentals.interestOnly"]))} a month, ${money(t.rentalEquity)} of equity and ${money(num(a["rentals.rent"]))} a month in net rent.`);
  out.push(`Your retirement accounts total about ${money(t.retirement)}: ${money(num(a["retire.employer"]))} in the 401k, ${money(num(a["retire.ira"]))} in traditional or SEP IRAs, ${money(num(a["retire.roth"]))} in Roth${a["retire.spouseHas"] === true ? ` and ${money(num(a["retire.spouseValue"]))} in your spouse's accounts` : ""}.`);
  if (t.unusual > 0) out.push(`In unusual assets you hold about ${money(t.unusual)}: ${money(num(a["unusual.crypto"]))} in crypto, ${money(num(a["unusual.metals"]))} in gold and silver and ${money(num(a["unusual.hard"]))} in hard assets${a["unusual.detail"] ? ` (${String(a["unusual.detail"])})` : ""}.`);
  out.push(`All together that is about ${money(t.netWorth)} of net worth, ${money(t.liquid)} of it liquid. Did I get that right?`);
  return out;
}

// ─── mapping into the Financial Assessment ────────────────────────────────

export type IntakeExtras = { priorities?: string; wishes?: { account?: string; future?: string; outcomes?: string } };

function setField(ff: ClientFactFinder, section: string, key: string, value: FieldValue) {
  if (!ff.sections[section]) ff.sections[section] = {};
  ff.sections[section][key] = value;
}

/** Merge the spoken answers into an existing (or empty) Financial Assessment. Never erases what was already answered elsewhere. */
export function applyIntakeToFactFinder(existing: ClientFactFinder | null | undefined, a: Answers, extras: IntakeExtras = {}): ClientFactFinder {
  const base = existing ?? emptyFactFinder();
  const ff: ClientFactFinder = { version: 1, sections: {}, lists: {} };
  for (const [k, v] of Object.entries(base.sections ?? {})) ff.sections[k] = { ...v };
  for (const [k, v] of Object.entries(base.lists ?? {})) ff.lists[k] = v.map((r) => ({ ...r }));
  for (const s of INTAKE_STEPS) {
    if (!s.map || !(s.id in a)) continue;
    const v = a[s.id];
    if (v === null || v === undefined) continue;
    setField(ff, s.map.section, s.map.key, v);
  }
  const t = intakeTotals(a);
  setField(ff, "cash", "moneyMarketCds", num(a["cash.moneyMarket"]) + num(a["cash.cds"]));
  if (a["home.owns"] === true) setField(ff, "realEstate", "homeEquity", t.homeEquity);
  if (a["annuity.has"] === true) {
    const yr = num(a["annuity.yearBought"]);
    setField(ff, "investments", "annuityDetail",
      `${String(a["annuity.company"] ?? "Annuity")}${yr ? `, bought ${yr}` : ""}; ${a["annuity.guaranteed"] === true ? `guaranteed lifetime income ${money(num(a["annuity.monthlyIncome"]))}/mo` : `no lifetime guarantee, avg return ${num(a["annuity.avgReturn"])}%`}`);
  }
  if (a["stocks.manager"] === "A financial advisor") {
    setField(ff, "investments", "currentAdvisor", `${String(a["stocks.advisorName"] ?? "Advisor")}${num(a["stocks.advisorYears"]) ? ` (${num(a["stocks.advisorYears"])} yrs)` : ""}`);
  }
  if (t.unusual > 0) setField(ff, "investments", "cryptoAlternatives", t.unusual);
  if (a["rentals.has"] === true) {
    const rows = (ff.lists.properties ?? []).filter((r) => r.type !== "Rental");
    rows.push({ type: "Rental", zip: "", value: t.rentalEquity + t.rentalMortgage, mortgageBalance: t.rentalMortgage, rate: null, netRentMonthly: num(a["rentals.rent"]) });
    ff.lists.properties = rows;
    setField(ff, "income", "rentalIncome", num(a["rentals.rent"]) * 12);
  }
  if (extras.priorities) setField(ff, "goals", "topGoals", extras.priorities);
  const w = extras.wishes;
  if (w && (w.account || w.future || w.outcomes)) {
    setField(ff, "goals", "tenYearGoals", [w.account && `Wish for the accounts: ${w.account}`, w.future && `Wish for the future: ${w.future}`, w.outcomes && `Wish for the outcomes: ${w.outcomes}`].filter(Boolean).join("\n"));
  }
  const notes: string[] = [];
  if (num(a["unusual.metals"])) notes.push(`Gold/silver ${money(num(a["unusual.metals"]))}`);
  if (num(a["unusual.hard"])) notes.push(`Hard assets ${money(num(a["unusual.hard"]))}${a["unusual.detail"] ? `: ${String(a["unusual.detail"])}` : ""}`);
  if (num(a["cash.rate"])) notes.push(`Cash earning ${num(a["cash.rate"])}%`);
  if (a["bonds.has"] === true) notes.push(`Bonds ${money(num(a["bonds.value"]))} at ${num(a["bonds.rate"])}%`);
  if (a["funds.has"] === true) notes.push(`Mutual funds ${money(num(a["funds.value"]))}`);
  if (a["rentals.has"] === true) notes.push(`Rental interest-only payments ${money(num(a["rentals.interestOnly"]))}/mo across ${num(a["rentals.count"]) || "several"} homes`);
  if (notes.length) {
    const prior = String(ff.sections.documents?.notes ?? "").split("\n").filter((l) => l && !l.startsWith("AI intake:"));
    setField(ff, "documents", "notes", [...prior, `AI intake: ${notes.join("; ")}`].join("\n"));
  }
  return ff;
}

// ─── the three questions ──────────────────────────────────────────────────

export type HorizonQuestion = {
  horizon: 5 | 10 | 15;
  title: string;
  /** The question the person would otherwise ask themselves at that horizon. */
  question: string;
  /** Why the numbers say it is coming, in their own figures. */
  evidence: string[];
  /** Every strategy in the operating system that bears on it. */
  strategies: string[];
  /** What the site can compute today, with the page to open. */
  calculators: Array<{ label: string; path: string }>;
};

const CHAIN = { label: "Calculator Chain, 10,000 simulations", path: "/portal/chain" };

/** Deterministic: the three questions built from the intake, before any model polishes the wording. */
export function buildThreeQuestions(a: Answers, extras: IntakeExtras = {}): HorizonQuestion[] {
  const t = intakeTotals(a);
  const cashRate = num(a["cash.rate"]);
  const hasMortgage = a["home.owns"] === true && t.homeMortgage > 0;
  const hasRentals = a["rentals.has"] === true;
  const hasAnnuity = a["annuity.has"] === true;
  const guaranteed = hasAnnuity && a["annuity.guaranteed"] === true;
  const advisor = a["stocks.manager"] === "A financial advisor";
  const advisorName = String(a["stocks.advisorName"] ?? "your advisor");
  const preTax = num(a["retire.employer"]) + num(a["retire.ira"]) + num(a["retire.spouseValue"]);
  const roth = num(a["retire.roth"]);
  const crypto = num(a["unusual.crypto"]);
  const priorities = extras.priorities ? ` You told me what matters most: "${extras.priorities}".` : "";
  const wishes = extras.wishes;

  // Five years: the cash and the mortgage. The money that is sitting still.
  const q5: HorizonQuestion = {
    horizon: 5,
    title: "The five-year question: why is so much of my money sitting still?",
    question:
      `In five years you will look at ${money(t.cash)} of cash earning ${cashRate}%${hasMortgage ? `, next to a ${money(t.homeMortgage)} mortgage` : ""}${t.homeEquity > 100_000 ? ` and ${money(t.homeEquity)} of idle home equity` : ""}, ` +
      `and ask: "How much did it cost me to leave that still while inflation and the Federal Reserve's money printing ran, and what should the sequence have been: emergency reserve first, then the mortgage cycle, then the equity, then the market?"${priorities}`,
    evidence: [
      `Cash ${money(t.cash)} at ${cashRate}% against a 3% to 4% cost of living is a real loss every year the money printing continues.`,
      hasMortgage ? `A ${money(t.homeMortgage)} mortgage with ${money(t.liquid)} liquid means the Mortgage Killer cycle can start now, not later.` : "With no mortgage the surplus goes straight to the growth engine and the property cycle.",
      t.homeEquity > 100_000 ? `${money(t.homeEquity)} of equity is a war chest that only works when it is deployed with the lien risk explained.` : "Home equity is still small; the first cycle builds it.",
    ],
    strategies: ["Emergency reserve sizing (months of expenses)", "Mortgage Killer recycling cycles", "Equity deployment with lien-risk disclosure", "Fed money-printing inflation model (M2 pass-through)", "Loan availability under tightening credit", "ZIP appreciation and rent history for the home"],
    calculators: [{ label: "Mortgage Killer", path: "/portal/mortgage-killer" }, { label: "Zip Engine", path: "/portal/zip-engine" }, { label: "Outside Forces", path: "/portal/outside-forces" }, CHAIN],
  };

  // Ten years: taxes, the advisor, the annuity, the rentals. The structure question.
  const q10: HorizonQuestion = {
    horizon: 10,
    title: "The ten-year question: who is my structure really working for?",
    question:
      `In ten years you will hold ${money(preTax)} of pre-tax retirement money${roth ? ` against only ${money(roth)} in Roth` : " and almost nothing tax-free"}` +
      `${advisor ? `, ${num(a["stocks.advisorYears"]) || "many"} years further into paying ${advisorName} on ${money(num(a["stocks.value"]))}` : ""}` +
      `${hasAnnuity ? `, with the ${String(a["annuity.company"] ?? "")} annuity ${guaranteed ? `paying ${money(num(a["annuity.monthlyIncome"]))} a month` : `still averaging ${num(a["annuity.avgReturn"])}%`}` : ""}` +
      `${hasRentals ? `, and ${money(t.rentalMortgage)} of rental debt at interest-only payments of ${money(num(a["rentals.interestOnly"]))} a month` : ""}, ` +
      `and ask: "What would the tax bill on all of that have been if I had converted it in sequence, moved the fee-paying accounts into structures that pay me, ${hasRentals ? "recycled the rentals through a 1031 exchange, " : ""}and let the income floor be guaranteed instead of hoped for?"` +
      `${wishes?.account ? ` Your wish for the accounts was: "${wishes.account}".` : ""}`,
    evidence: [
      `${money(preTax)} of pre-tax money is a future tax bill that grows with every year of future taxation drift; Roth conversion sequencing decides its size.`,
      advisor ? `Fees on ${money(num(a["stocks.value"]))} compound against you as surely as returns compound for you.` : "Self-managed money needs a written rule for the 30% year, or it becomes the advisor's problem at the worst time.",
      hasAnnuity ? (guaranteed ? "A guaranteed income floor is the one asset that does not care what the market does; it sets how aggressive everything else can be." : "An annuity with no lifetime guarantee is a growth account wearing an insurance wrapper; the exchange rules can move it.") : "No guaranteed income floor yet means every retirement dollar has to be defended by the market.",
      hasRentals ? `Interest-only rental debt of ${money(t.rentalMortgage)} is cheap while rates hold and dangerous when loan availability tightens; the 1031 chain and the rent growth history for each ZIP decide the exit.` : "Rentals enter the plan through the house-recycling cycle, one paid-off property every six to seven years.",
    ],
    strategies: ["Roth conversion sequencing (Tax Waterfall)", "Future taxation drift model", "Trust-owned Index Universal Life for tax-free income", "1035 annuity exchange review", "Lifetime guaranteed income floor (Income Annuity Top 10)", "1031 exchange chain optimization", "Advisor fee comparison and policy-cost lab", "Real-estate rentals with ZIP rent-growth history"],
    calculators: [{ label: "Tax Waterfall", path: "/portal/tax-waterfall" }, { label: "Roth Conversion", path: "/portal/roth-conversion" }, { label: "Existing Annuities", path: "/portal/existing-annuities" }, { label: "Income for Life", path: "/portal/income-for-life" }, { label: "Real Estate Mogul", path: "/portal/real-estate-mogul" }, CHAIN],
  };

  // Fifteen years: legacy, protection, the unusual assets, the spouse.
  const q15: HorizonQuestion = {
    horizon: 15,
    title: "The fifteen-year question: what survives me, and what survives the divorce, the lawsuit, and the tax law?",
    question:
      `In fifteen years, with about ${money(t.netWorth)} of today's net worth compounding${crypto ? `, ${money(crypto)} of crypto that has either multiplied or vanished` : ""}${t.unusual - crypto > 0 ? `, and ${money(t.unusual - crypto)} of hard assets nobody has appraised or titled` : ""}` +
      `${a["retire.spouseHas"] === true ? `, plus your spouse's ${money(num(a["retire.spouseValue"]))}` : ""}, ` +
      `you will ask: "Which of this is actually protected from a creditor, a divorce, an estate tax, or a market crash in the year I retire, and did I build the multi-generational cash-flow cycle early enough for my children to inherit an engine instead of a balance?"` +
      `${wishes?.future ? ` Your wish for the future was: "${wishes.future}".` : ""}${wishes?.outcomes ? ` Your wish for the outcomes was: "${wishes.outcomes}".` : ""}`,
    evidence: [
      `${money(t.netWorth)} run through 10,000 simulations, with the Fed printing model, hard-asset inflation and future taxation switched on, shows the spread between the plan that survives and the one that does not.`,
      "Assets titled in your own name are exposed; assets inside a trust-owned policy, an LLC, or a spouse's protected account are not, and the difference is decided now, not at the courthouse.",
      crypto ? `Crypto at ${money(crypto)} needs a written rule for the 70% drawdown year and a titling plan so it is inheritable.` : "The unusual assets need titles, appraisals and a beneficiary path, or they become the estate's problem.",
      "Sequence-of-returns risk in the five years around retirement is the single largest destroyer of physician plans; the income floor and the policy loans are the hedge.",
    ],
    strategies: ["Multi-generational wealth transfer engine", "Divorce Shield and asset-protection titling", "Estate tax projection and trust structure", "Time Machine policy design (AG-49)", "Policy loans as the sequence-of-returns hedge", "LifeForge 10,000-scenario Monte Carlo", "Hard-asset inflation model (real estate, equities, crypto)", "Long-term-care and disability gap analysis", "Crypto drawdown rule and inheritance titling"],
    calculators: [{ label: "Estate Tax", path: "/portal/estate-tax" }, { label: "Time Machine Calculator", path: "/portal/time-machine-calculator" }, { label: "Inheritance", path: "/portal/inheritance" }, { label: "Long-Term Care", path: "/portal/long-term-care" }, { label: "Crypto Corner", path: "/portal/crypto-corner" }, CHAIN],
  };

  return [q5, q10, q15];
}

export const PERMISSION_ASK =
  "Thank you. Given all the knowledge, the database, the calculations and the experience we have here, do you mind if we offer you three questions you may find yourself asking in five, ten or fifteen years? We would like to give them to you now, early.";

export const INTAKE_STORAGE_KEY = "rcs_intake_v1";
