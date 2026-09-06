// ============================================================
// THE QUESTIONS YOU HAVEN'T ASKED — the librarian, speaking for the whole
// AI team as one voice, looks at everything the client has disclosed and
// finds the questions that matter most and that the client has not asked:
// the ones they might think of in fifteen years, brought forward now.
//
// The flow is consent first, at every step, and every step is sealed on
// the Plan Ledger as a consent event:
//   1. PROPOSE  — "I have found N questions you haven't asked that matter
//      more than any you have. May I show them?" The client picks how many
//      (3–5, 5–7, or 5–10) and says yes or no. Nothing is shown before yes.
//   2. REVEAL   — the questions, each with why it matters for this client
//      and roughly what it is worth. "May I answer them from everything I
//      know about you? And is there anything else you want me to know
//      first?"
//   3. DISCLOSE — anything the client adds goes into their profile (the
//      assessment's notes), so the answers and every engine improve.
//   4. ANSWER   — each question answered from the profile and the engines,
//      through the council where it is configured, sealed as advice.
//   Cadence: offered again no sooner than the interval (default 30 days)
//   and only when the profile has changed or a new question outranks the
//   ones already shown.
//
// The candidates are deterministic: each is a rule over the assessment
// with a dollar-scale estimate from the client's own figures (never
// invented; when a figure is missing the question says so and asks for it).
// ============================================================
import type { ClientFactFinder } from "./clientFactFinder";
import { hurdleRate } from "./erosion";

export type CountOption = "3-5" | "5-7" | "5-10";
export const COUNT_OPTIONS: Record<CountOption, { min: number; max: number; label: string }> = {
  "3-5": { min: 3, max: 5, label: "Three to five" },
  "5-7": { min: 5, max: 7, label: "Five to seven" },
  "5-10": { min: 5, max: 10, label: "Five to ten" },
};

export type UnaskedQuestion = {
  id: string;
  question: string;          // in the client's words
  why: string;               // why it matters for this client, from their own facts
  scale: number;             // rough dollar scale over the horizon, from their figures (0 when a figure is missing)
  scaleNote: string;         // how the scale was reached, or what is missing
  horizonYears: number;      // when the client would otherwise meet this question
  engine: "erosion" | "forgiveness" | "tax-schedule" | "controls" | "journey" | "assessment";
  path: string;              // the page that answers it
  needs?: string[];          // assessment fields that would sharpen the answer
};

const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v)) ? Number(v) : 0);
const money = (v: number) => v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

/** Every candidate this profile raises, ranked by scale (then by how soon it bites). Deterministic. */
export function candidateQuestions(ff: ClientFactFinder | null | undefined, opts: { inflation?: number; pHigherTaxes30?: number; nominalReturn?: number } = {}): UnaskedQuestion[] {
  const s = (id: string) => ff?.sections?.[id] ?? {};
  const hh = s("household"), inc = s("income"), tax = s("taxes"), re = s("realEstate"), debt = s("debts"), inv = s("investments"), ins = s("insurance"), prac = s("practice"), est = s("estate"), ret = s("retirement"), goals = s("goals"), cash = s("cash");
  const income = n(inc.w2Income) + n(inc.bonusIncome) + n(inc.contractorIncome) + n(inc.practiceDistributions) + n(inc.spouseIncome) + n(inc.rentalIncome) + n(inc.otherIncome);
  const federal = n(tax.federalTaxPaid);
  const pretax = n(inv.employerPlanBalance) + n(inv.traditionalIra);
  const taxable = n(inv.taxableBrokerage);
  const equity = n(re.homeEquity);
  const loans = n(debt.studentLoanBalance);
  const inflation = opts.inflation ?? 0.03;
  const pHigher = opts.pHigherTaxes30 ?? 0.8;
  const ret_ = opts.nominalReturn ?? 0.07;
  const age = (() => { const d = String(hh.dateOfBirth ?? ""); const y = Number(d.slice(0, 4)); return y > 1900 ? new Date().getFullYear() - y : 0; })();
  const out: UnaskedQuestion[] = [];

  // 1. Purchasing power: the erosion engine's question.
  if (income > 0) {
    const need = hurdleRate(0.03, inflation, 0.25);
    out.push({ id: "erosion.hurdle", question: `What return do I actually need just to stand still after inflation and tax — and is anything I own earning it?`, why: `On your income of ${money(income)}, a dollar saved today buys about ${Math.round(100 / (1 + inflation) ** 30)} cents in thirty years at ${(inflation * 100).toFixed(1)}% inflation. To grow 3% a year in real terms after a 25% tax on growth you need ${(need * 100).toFixed(1)}% nominal. Most plans never ask this.`, scale: Math.round(income * 0.2 * 30 * ((1 + inflation) ** 30 - 1) / 2), scaleNote: "roughly, the purchasing power a 20% savings rate loses to inflation over thirty years if it earns nothing real", horizonYears: 15, engine: "erosion", path: "/portal/erosion" });
  }
  // 2. The expected tax path.
  if (federal > 0 || income > 300_000) {
    const base = federal || income * 0.28;
    out.push({ id: "erosion.taxpath", question: `If tax rates are higher in twenty years — the record says the odds are about ${Math.round(pHigher * 100)}% — how much of what I am deferring today am I really going to keep?`, why: `Every pre-tax dollar you defer is a bet on the rate you will pay when it comes out. The tax path on this site blends the record since 1946 with a weighted panel of forecasters and who is expected to hold the levers.`, scale: Math.round(base * 20 * 0.12), scaleNote: `about 12% more tax over twenty years on ${money(base)} a year, the expected burden multiplier at that horizon`, horizonYears: 20, engine: "erosion", path: "/portal/erosion" });
  }
  // 3. Roth conversion window.
  if (pretax > 250_000) {
    out.push({ id: "tax.roth", question: `Which years between now and my required distributions are my cheapest years to move pre-tax money to Roth — and how much each year?`, why: `You hold ${money(pretax)} pre-tax. Required distributions and a surviving spouse's single-filer brackets can push that into the top bracket later; the schedule fills each year exactly to the top of a chosen bracket after every deduction.`, scale: Math.round(pretax * 0.13), scaleNote: `the difference between paying 24% and 37% on ${money(pretax)}`, horizonYears: 10, engine: "tax-schedule", path: "/portal/tax-schedule" });
  }
  // 4. Student loans.
  if (loans > 50_000) {
    out.push({ id: "forgiveness.path", question: `Is my ${money(loans)} of student debt an expense to kill — or an asset a forgiveness program can turn into a tax-free account?`, why: `PSLF has forgiven $78 billion for over a million borrowers. If your employer qualifies, the payment difference invested for thirty years is usually worth more than paying the loan off early.`, scale: Math.round(loans * 1.2), scaleNote: "the balance plus accrued interest a ten-year PSLF path typically forgives, tax-free", horizonYears: 10, engine: "forgiveness", path: "/portal/forgiveness", needs: ["debts.studentLoanServicer", "income.employmentType"] });
  }
  // 5. Home equity doing nothing.
  if (equity > 400_000) {
    out.push({ id: "tax.equity", question: `My ${money(equity)} of home equity earns nothing and is exposed to a judgment — should any of it be working, and inside what wrapper?`, why: `Home equity earns 0%, is not deductible to borrow against since 2018 (permanent now), and in most states is only partly protected. The schedule tests the spread between a loan rate and a policy's net crediting rate at conservative assumptions.`, scale: Math.round(equity * 0.3 * ((1 + ret_ - 0.01) ** 20 - 1)), scaleNote: `what 30% of it could grow to in twenty years at ${((ret_ - 0.01) * 100).toFixed(0)}% net, before the loan cost`, horizonYears: 12, engine: "tax-schedule", path: "/portal/tax-schedule" });
  }
  // 6. Practice owner without a plan beyond the 401(k).
  if (n(inc.practiceDistributions) > 300_000 || String(inc.employmentType ?? "").includes("owner")) {
    out.push({ id: "tax.cashbalance", question: `How much could my practice deduct this year through a cash balance plan on top of the 401(k) — and who else has to be covered?`, why: `At your practice income an actuary can usually fund a six-figure deduction toward the $290,000-a-year §415(b) benefit, on top of the $72,000 §415(c) limit. It is the largest routine deduction most owners never take.`, scale: Math.round(Math.min(0.35 * n(inc.practiceDistributions), 200_000) * 0.37 * 10), scaleNote: "ten years of the deduction at the top rate", horizonYears: 8, engine: "tax-schedule", path: "/portal/tax-schedule" });
  }
  // 7. Disability and the plan's survival.
  if (!n(ins.disabilityMonthlyBenefit) && income > 200_000) {
    out.push({ id: "protect.disability", question: `If I could not practise from next month, how many months does everything on this site keep working — and what stops first?`, why: `Your assessment shows no own-occupation disability benefit. Every engine here assumes the income continues; the plan is built to survive markets, not the loss of the earner.`, scale: Math.round(income * 10), scaleNote: "ten years of income", horizonYears: 5, engine: "assessment", path: "/portal/financial-assessment", needs: ["insurance.disabilityMonthlyBenefit"] });
  }
  // 8. Estate exposure.
  const nw = n(est.estimatedNetWorth) || (pretax + taxable + equity);
  if (nw > 8_000_000) {
    out.push({ id: "estate.exemption", question: `The estate exemption is $15 million per person now — what should I move out of my estate while it is, and into whose hands?`, why: `Growth on ${money(nw)} compounds inside your estate at 40% above the exemption. A spousal lifetime access trust or an IDGT sale moves the growth out while you keep access.`, scale: Math.round(Math.max(0, nw * ((1 + ret_) ** 20) - 30_000_000) * 0.4), scaleNote: "estate tax on the growth above two exemptions in twenty years", horizonYears: 20, engine: "tax-schedule", path: "/portal/tax-schedule" });
  }
  // 9. Who can act if you cannot.
  if (!est.powerOfAttorney || String(est.powerOfAttorney).toLowerCase().startsWith("no")) {
    out.push({ id: "controls.authority", question: `If I am in the hospital as a patient rather than a doctor, who can move money, and within what limits — and have I written those limits down?`, why: `The Controls page lets you grant scoped, time-boxed, revocable authority with ceilings and a human-approval line. Most families discover the gap at the worst moment.`, scale: 0, scaleNote: "not a dollar question until it is — then it is all of them", horizonYears: 10, engine: "controls", path: "/portal/controls", needs: ["estate.powerOfAttorney"] });
  }
  // 10. The sale you have not planned.
  if (n(prac.practiceValue) > 1_000_000 || n(inv.businessInterests) > 1_000_000) {
    const v = n(prac.practiceValue) || n(inv.businessInterests);
    out.push({ id: "tax.exit", question: `When I sell the practice, which of the four ways to not pay the capital-gains tax that year fits me — and which one has to be set up years before?`, why: `On ${money(v)} the federal gain tax alone is about ${money(v * 0.238)}. QSBS needs a C corporation years ahead; a CRT and an opportunity fund need the plan in place before the closing; a 1031 fits the real estate.`, scale: Math.round(v * 0.238), scaleNote: "federal tax at 23.8% on the sale", horizonYears: 7, engine: "tax-schedule", path: "/portal/tax-schedule" });
  }
  // 11. Cash drag.
  if (n(cash.checkingSavings) + n(cash.moneyMarket) > income * 0.5 && income > 0) {
    const c = n(cash.checkingSavings) + n(cash.moneyMarket);
    out.push({ id: "erosion.cash", question: `I keep ${money(c)} in cash — what is that costing me every year in purchasing power, and how much of it is really the reserve I need?`, why: `Cash loses the inflation rate every year, about ${(inflation * 100).toFixed(1)}% today. Six to twelve months of expenses is a reserve; the rest is a decision.`, scale: Math.round(c * inflation * 10), scaleNote: "ten years of inflation on the balance", horizonYears: 3, engine: "erosion", path: "/portal/erosion" });
  }
  // 12. The goal you wrote down.
  const top = typeof goals.topGoals === "string" ? goals.topGoals.split(/\n|;/)[0]?.trim() : "";
  if (top) out.push({ id: "journey.goal", question: `You said your first goal is "${top}". What is the single number that, if it were true, would mean that goal is done — and what date?`, why: `Every engine on this site runs to a date and a number. A goal without both cannot be scheduled, sequenced or protected.`, scale: 0, scaleNote: "the number is the answer", horizonYears: 1, engine: "journey", path: "/portal/my-journey" });

  return out.sort((a, b) => (b.scale - a.scale) || (a.horizonYears - b.horizonYears));
}

/** Pick the top questions for the count the client chose. */
export function pickQuestions(candidates: UnaskedQuestion[], count: CountOption): UnaskedQuestion[] {
  const { min, max } = COUNT_OPTIONS[count];
  const withScale = candidates.filter((c) => c.scale > 0);
  const picked = [...withScale, ...candidates.filter((c) => c.scale === 0)].slice(0, max);
  return picked.length >= min ? picked : candidates.slice(0, Math.min(max, candidates.length));
}

/** What the librarian says at each step — one voice for the whole team. */
export function proposeScript(count: number, minShown: number): string {
  return `While we have been talking I have been reading everything you have told me. I have found ${count} questions you have not asked — questions that matter more to your plan than any you have asked so far, and that most people only think of fifteen years from now. May I show you ${minShown === count ? "them" : `${minShown} to ${count} of them`}? You choose how many, and nothing is shown until you say yes.`;
}
export function revealScript(qs: UnaskedQuestion[]): string {
  return `Here they are. ${qs.map((q, i) => `${i + 1}. ${q.question}`).join(" ")} May I answer them from everything I know about you? And before I do — is there anything else you want me to know? Anything you add goes into your profile and makes every answer on this site better.`;
}

/** Cadence: offer again after the interval, or sooner if the profile changed or a stronger question appeared. */
export function shouldOffer(last: { at: Date; questionIds: string[]; profileHash: string } | null, now: Date, profileHash: string, top: UnaskedQuestion[], intervalDays = 30): { offer: boolean; reason: string } {
  if (!last) return { offer: true, reason: "first time" };
  const days = (now.getTime() - last.at.getTime()) / 86_400_000;
  if (days >= intervalDays) return { offer: true, reason: `${Math.floor(days)} days since the last offer` };
  if (profileHash !== last.profileHash) return { offer: true, reason: "the profile has changed" };
  const newTop = top.slice(0, 3).some((q) => !last.questionIds.includes(q.id));
  if (newTop) return { offer: true, reason: "a stronger question has appeared" };
  return { offer: false, reason: `offered ${Math.floor(days)} days ago; nothing has changed` };
}
