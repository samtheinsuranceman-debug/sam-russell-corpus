/**
 * THE AI MEMORY BANK — everything the twelve channels are supposed to know,
 * in one registry, wired into the brain AND persisted as a file.
 *
 * ## The problem
 *
 * `compositeMind.ts` gave the channels three things: the NLP directive, the
 * twelve-channel roster, and the instrument catalogue. That is how to SPEAK
 * and what pages EXIST. It said nothing about what this system actually
 * knows — the tax history back to 1946, the erosion engine, thirty-six years
 * of zip-level appreciation, the cycle engine, eighty sequenced combinations,
 * the carrier registry, the provenance traces. A channel could name a page and
 * could not use the engine behind it.
 *
 * ## Why a registry rather than a longer prompt
 *
 * Two reasons, and the second is the one that matters.
 *
 * A prompt string grows until somebody trims it, and what gets trimmed is
 * whatever was added last rather than whatever matters least. A registry has a
 * priority per group, so the trim is a decision rather than an accident.
 *
 * And a registry can be CHECKED. `unwiredGroups()` returns what is registered
 * but not reaching the brain, and a test asserts every module named here
 * exists on disk — so a group cannot quietly point at a file somebody deleted.
 * That is the double insurance: the brain reads it at runtime, and the file is
 * the durable record that survives any prompt being rewritten.
 *
 * ## What `brief` is for
 *
 * `knows` describes the group to a human reading this file. `brief` is the one
 * line the channels actually receive — a standing rule about how to use that
 * knowledge honestly. It is written as an instruction rather than a
 * description, because a channel given a description paraphrases it and a
 * channel given a rule follows it.
 */

import { statusSentence } from "./patentStatus";

export interface MemoryGroup {
  readonly id: string;
  readonly name: string;
  /** The files this group covers. Checked against disk by test. */
  readonly modules: readonly string[];
  /** What this group knows, for a human reading the registry. */
  readonly knows: string;
  /** The standing rule the channels receive. Written as an instruction. */
  readonly brief: string;
  /** Whether it currently reaches the working memory. */
  readonly wired: boolean;
  /** 1 is never trimmed. 3 is dropped first when a prompt budget is tight. */
  readonly priority: 1 | 2 | 3;
}

export const MEMORY_GROUPS: readonly MemoryGroup[] = [
  {
    id: "nlp-patterns",
    name: "NLP language patterns and meta-programs",
    modules: ["shared/nlpBrain.ts"],
    knows:
      "51 meta-programs with elicitation questions and markers, 32 Milton/meta/reframe/pacing patterns, VAK predicate lexicons, a seven-phase emotional arc with per-phase sentence caps, buying-signal weights, and an ethical floor that outranks every pattern.",
    brief:
      "You speak in calibrated language at all times: pace before you lead, match their representational system, cap the pain phase at three sentences, and never run a pattern the ethical floor forbids.",
    wired: true,
    priority: 1,
  },
  {
    id: "twelve-channels",
    name: "The twelve channels",
    modules: ["shared/compositeMind.ts"],
    knows:
      "Twelve readings of one person - Buddy, Peter, Matthew, Luke, John, Mark, DealCloser, Chessmaster, Anchor, HabitBuilder, Edison, BeliefReframer - each with what it reads, what it owns, and its standing question.",
    brief:
      "You are one voice satisfying twelve standing requirements. Never name them, never present them as separate personalities, never say \"our team of AI\".",
    wired: true,
    priority: 1,
  },
  {
    id: "instruments",
    name: "The instrument catalogue",
    modules: ["shared/calculatorCatalog.ts"],
    knows:
      "98 verified pages with path, category, engine and keywords, every path resolved against the real router by test.",
    brief:
      "These are the only pages that exist. Name one by its exact path when it answers part of the question, and never invent a page.",
    wired: true,
    priority: 1,
  },
  {
    id: "tax-engines",
    name: "Tax prediction and bracket engines",
    modules: ["shared/taxBracketEngine.ts", "shared/taxRules.ts", "shared/taxSchedule.ts", "shared/taxStrategies.ts", "shared/qbiDeduction.ts", "shared/retirementLimits.ts", "shared/estateTaxEngine.ts"],
    knows:
      "Federal bracket arithmetic, section 199A two-limb cap with the OBBBA $400 minimum from TY2026, Notice 2025-67 retirement limits, estate tax, and the strategy set for reducing liability.",
    brief:
      "Tax figures come from the engine, never from memory. Name the engine that produced a number. The $400 QBI minimum applies from TY2026 and a fully phased-out practice no longer gets zero.",
    wired: true,
    priority: 1,
  },
  {
    id: "tax-history",
    name: "36-year tax history and the power layer",
    modules: ["shared/taxHistory.ts", "shared/powerHistory.ts"],
    knows:
      "Top marginal rate by year back to 1946, who held the presidency, Senate and House each year, and conditional window statistics - the probability a rate was higher after N years given who held power.",
    brief:
      "When asked where taxes are going, give the conditional base rate from the record with its sample size, never a forecast. Say what the history supports and what it does not.",
    wired: true,
    priority: 1,
  },
  {
    id: "inflation-erosion",
    name: "Inflation, money printing and the erosion engine",
    modules: ["shared/erosion.ts", "shared/macroEngine.ts", "shared/historicalShocks.ts"],
    knows:
      "CPI history from FRED, money supply and debt-to-GDP, the cross-asset fiat effect, recorded shocks (2000-02, 2007-09, 2018 Q4, 2022), and the trajectory ladder at 5 to 40 years.",
    brief:
      "Inflation is shown as recorded history with its caveat - the Fed, oil and wars move prices more than Congress does. Never present an inflation forecast as a finding.",
    wired: true,
    priority: 1,
  },
  {
    id: "zip-appreciation",
    name: "Zip-level appreciation and rent, 36 years",
    modules: ["shared/zipEngine.ts", "shared/strEngine.ts", "shared/strSources.ts"],
    knows:
      "FHFA zip5 appreciation, Zillow ZHVI and ZORI, PMMS mortgage rates via FRED, appreciation windows and cohort analysis, plus short-term rental revenue modelling.",
    brief:
      "Property appreciation and rent figures come from the sourced series for that zip with its as-of date, never from a national average applied locally.",
    wired: true,
    priority: 1,
  },
  {
    id: "cycle-engine",
    name: "The cycle engine and infinite banking",
    modules: ["shared/cycleEngine.ts", "shared/cycleScenarios.ts"],
    knows:
      "Five capital mechanisms with their release rates, turn lengths, bottlenecks and whether their obligations amortise; a twenty-year simulation whose headline output is the break year; and 80 sequenced combinations with influence scores.",
    brief:
      "No capital cycle is infinite. When asked, give the break year and the two decisive inputs - renovation uplift and redeployment rate. Correct the borrowing misconception: you borrow from the insurer against cash value, not from yourself.",
    wired: true,
    priority: 1,
  },
  {
    id: "mechanism-dossiers",
    name: "The five mechanisms, in full",
    modules: ["shared/mechanismDossiers.ts"],
    knows:
      "Per mechanism: the steps in the order they happen with the contract clause governing each, 39 named providers with their own homepages, the conditions it suits and the conditions it does not, how it combines with each of the other four, and two separate ratings - value to someone it suits, and how often a normal household needs it.",
    brief:
      "Value and frequency are two numbers and you never merge them. A policy loan is a 7 for value and a 2 for frequency; say both. Name providers only from the dossier, give their homepage, and never quote a rate, term or contact detail - those live in the verified lender directory or nowhere.",
    wired: true,
    priority: 1,
  },
  {
    id: "sequence-orderings",
    name: "Sequence order, roles and legality",
    modules: ["shared/sequenceOrderings.ts"],
    knows:
      "Sixteen combinations and 42 annotated orderings. Position is a role - source, converter, sink - with a fitness score per mechanism per role. Two hard contract rules prune illegal orderings, cutting the five-mechanism set from 120 permutations to 40. Each annotated ordering carries share, confidence and likelihood as three separate numbers.",
    brief:
      "Order is most of the plan. Before describing a sequence, check it is legal: an equity share must precede any line of credit and any wrap on the same property, because the covenants say so. Give share, confidence and likelihood separately - a high share with a low likelihood means 'if you are in this situation, do it this way, and you are probably not in this situation'.",
    wired: true,
    priority: 1,
  },
  {
    id: "thresholds",
    name: "The thresholds and how they move",
    modules: ["shared/thresholds.ts"],
    knows:
      "Fourteen gates across the five mechanisms: DSCR seasoning and the delayed-financing exception, cash-out LTV and coverage floors, the ten-property conventional cap and the portfolio loans that escape it, partial-release clauses, due-on-sale exposure and every Garn-St Germain exemption, equity-share covenants and the thirty-year term, policy loan value, the seven-pay limit. Each with its standard figure, its documented variants, its source URL, and - where fixed - the statute or contract that fixes it.",
    brief:
      "When asked whether a threshold can be lowered, answer from the registry: name the variant, its conditions, its trade-off and its evidence score. Delayed financing is zero-month seasoning capped at documented cost. No exemption covers a wrap. An equity-share covenant binds the property it is on and no other. Never invent a way around a fixed threshold; name the authority instead.",
    wired: true,
    priority: 1,
  },
  {
    id: "sequence-planner",
    name: "The sequence planner and its archetypes",
    modules: ["shared/sequencePlanner.ts", "shared/sequenceArchetypes.ts"],
    knows:
      "Thirteen moves (five mechanisms with their threshold variants, plus sell-outright and refinance-one) applied to a portfolio with covenants tracked per property. Legality refused per asset with a reason. Stage projections - capital in and out, obligation, amortisation, months, cost band - computed from the engine. Beam search against a goal to twenty-four stages; exhaustive count of legal plans. Twelve named archetypes for the shapes the search keeps finding, from the first-time household to the thirty-house operator.",
    brief:
      "A plan is a sequence of stages on named assets. Before recommending an order, run it through the planner and give each stage's capital in, capital out, months and what to watch. Say the count of legal plans as a number. On a payoff goal with a large portfolio, the fastest legal route usually sells part of it - say so plainly rather than promising a sweep will do it. Name the archetype the household most resembles and its likelihood score.",
    wired: true,
    priority: 1,
  },
  {
    id: "alt-credit",
    name: "Alternative lines of credit",
    modules: ["shared/altCredit/routes.ts", "shared/altCredit/deployment.ts", "shared/altCredit/lenders.ts", "shared/altCredit/simulator.ts", "shared/liquidityRoutes.ts"],
    knows:
      "15 borrowing routes at 1,000+ words each, 15 ranked deployment strategies, 15 lender records with Verified provenance, and a 10,000-path deployment simulator charging idle days.",
    brief:
      "Never state a lender contact detail, rate or rating that is not marked verified with its source and date. An unverified figure is not a figure.",
    wired: true,
    priority: 1,
  },
  {
    id: "genome",
    name: "The wealth genome and strategy fit",
    modules: ["shared/wealthGenomeFactors.ts", "shared/wealthGenomeDurability.ts", "shared/genomeStrategyFit.ts", "shared/genomeStrategies.ts"],
    knows:
      "21 factors with volatility classes and re-ask intervals, the deformed-sphere geometry, and 24 strategies scored against the genome with gates, allocation bands and house position.",
    brief:
      "A fit percentage is never quoted without its confidence. A high fit at low confidence is a list of questions to ask, not a recommendation.",
    wired: true,
    priority: 1,
  },
  {
    id: "household",
    name: "The pairing protocol",
    modules: ["shared/householdGenome.ts"],
    knows:
      "Two-spouse weighting derived from title, exposure and dependence; 14 of 21 factors combining by rules other than averaging; veto force scaling with stake; and a consent gate that withholds all paired output until both agree.",
    brief:
      "Never produce a blended household reading without both partners consenting to the weighting. Name the divergences before naming a strategy.",
    wired: true,
    priority: 1,
  },
  {
    id: "insurance-mechanics",
    name: "Policy mechanics and carriers",
    modules: ["shared/policyLoanMechanics.ts", "shared/policyMechanics.ts", "shared/irc7702.ts", "shared/ag49Validator.ts", "shared/mutualIulCarriers.ts", "shared/iulCarriers.ts", "shared/carrierRatings.ts", "shared/wholeLifeBanking.ts"],
    knows:
      "Loan mechanics including direct versus non-direct recognition, section 7702 and MEC limits, AG49 illustration constraints, and the mutual-only carrier registry with sourced ownership.",
    brief:
      "Illustrations obey AG49. Mutual and mutual-holding carriers only for indexed life. Always raise MEC status before discussing policy loans.",
    wired: true,
    priority: 1,
  },
  {
    id: "annuity",
    name: "Annuity and income engines",
    modules: ["shared/annuityData.ts", "shared/incomeForLife.ts", "shared/lifetimeIncomeEngine.ts", "shared/mygaWaterfall.ts", "shared/growthAnnuityEngine.ts", "shared/longevityEngine.ts"],
    knows:
      "Ranked payout rates from cited rate sheets, MYGA waterfalls, joint survival odds from SOA/SSA/CDC tables, and the research on guaranteed income and wellbeing.",
    brief:
      "Size a guaranteed income floor to non-negotiable spending, not to a percentage rule. The failure in this category is far more often too much than too little.",
    wired: true,
    priority: 2,
  },
  {
    id: "mortgage",
    name: "Mortgage and payoff engines",
    modules: ["shared/mortgageLedger.ts", "shared/mortgageKiller.ts", "shared/reverseHeloc.ts"],
    knows:
      "Amortisation from four statement figures, interest-only versus principal splits, extra-payment arithmetic, and the recycle cycle with a 1,200-month horizon cap shared across functions.",
    brief:
      "Payoff timelines are computed from the client's own statement, and the surplus the figure assumes is always named.",
    wired: true,
    priority: 2,
  },
  {
    id: "real-estate",
    name: "Rental enterprise and property strategy",
    modules: ["shared/rentalEnterprise.ts", "shared/householdWealth.ts", "shared/multiPropertyMyga.ts"],
    knows:
      "Candidate scoring from zip series, FEMA National Risk Index and Fed funds, plus multi-property structures.",
    brief:
      "Property recommendations carry the risk index and the rate assumption they were scored under.",
    wired: true,
    priority: 2,
  },
  {
    id: "markets",
    name: "Market, portfolio and shock modelling",
    modules: ["shared/monteCarloEngine.ts", "shared/ibbotsonModel.ts", "shared/modelPortfolios.ts", "shared/indexCreditingData.ts", "shared/creditingWindows.ts", "shared/sp500SeriesAudit.ts"],
    knows:
      "Monte Carlo with recorded shocks, Ibbotson series, index crediting history and the audited S&P series behind the backtester.",
    brief:
      "Backtests use the audited series and state the window. Never present a backtest as a projection.",
    wired: true,
    priority: 2,
  },
  {
    id: "provenance",
    name: "How a figure gets made",
    modules: ["shared/provenance.ts", "shared/unpricedParameters.ts", "shared/unaskedQuestions.ts"],
    knows:
      "Self-verifying figure traces that recompute their own headline through the real engine, plus the register of parameters nobody priced and questions nobody asked.",
    brief:
      "Any figure you give can be traced to input, source, rule and arithmetic. If it cannot, say so rather than giving it.",
    wired: true,
    priority: 1,
  },
  {
    id: "career",
    name: "The career ledger",
    modules: ["shared/careerEngine.ts"],
    knows:
      "BLS OEWS wage data back to 1999 by SOC code and state, NCES training costs, federal loan rates, true hourly rate and peer percentile.",
    brief:
      "Career and income comparisons come from the sourced series for that specialty and state.",
    wired: true,
    priority: 3,
  },
  {
    id: "longevity",
    name: "Longevity and health shelves",
    modules: ["shared/ltcEngine.ts", "shared/livingRiskProfile.ts"],
    knows:
      "Verified longevity source roster with DOIs checked against Crossref and PubMed, long-term care costs by zip, and rate-increase history from state DOI filings.",
    brief:
      "Health claims carry their DOI. Long-term care costs are local and sourced, never national averages.",
    wired: true,
    priority: 3,
  },
  {
    id: "journeys",
    name: "Journeys, chains and the sphere",
    modules: ["shared/journeyEngine.ts", "shared/journeyCatalog.ts", "shared/chainEngine.ts", "shared/sphere.ts"],
    knows:
      "Multi-step client journeys, the chain engine, and the sphere that places every page on a latitude.",
    brief:
      "A journey is sequenced for a reason. Give the next step, not the whole map.",
    wired: true,
    priority: 3,
  },
  {
    id: "patents",
    name: "The patent inventory",
    modules: ["shared/patentCatalog.ts", "shared/patentStatus.ts"],
    knows:
      "Every designed mechanism in the codebase reconciled against the filed claim sheet, each written as a plain explanation, with singles and combinations separated and the current status of each recorded.",
    brief:
      `Describe the portfolio's legal status with this sentence and no wording of your own: ${statusSentence()} A mechanism being designed, documented and drafted is a different fact from an application existing; never merge them.`,
    wired: true,
    priority: 3,
  },
  {
    id: "compliance",
    name: "Compliance, consent and disclosure",
    modules: ["shared/consent.ts", "shared/loginDisclaimers.ts", "shared/regulatorySandbox.ts", "shared/mandates.ts", "shared/firewall.ts", "shared/accessControl.ts"],
    knows:
      "Recorded consent, mandatory disclaimers, the regulatory sandbox and the access firewall.",
    brief:
      "Disclosure comes before the pitch, not after it. Never discuss a product line outside the mandate.",
    wired: true,
    priority: 1,
  },
  {
    id: "branding",
    name: "Voice and branding",
    modules: ["shared/branding.ts", "shared/revealCopy.ts", "shared/themes.ts", "shared/advisorModes.ts"],
    knows:
      "The system preamble, the standing channel layer, reveal copy and the six advisor modes.",
    brief:
      "Deliberately NOT applied to the six extractor prompts, which must read documents literally rather than persuasively.",
    wired: true,
    priority: 2,
  },
  {
    id: "crypto",
    name: "Crypto cycle and collateral",
    modules: ["shared/cryptoCycleEngine.ts", "shared/fiaCollateralEngine.ts", "shared/premiumFinancing.ts"],
    knows:
      "Crypto cycle modelling, FIA-as-collateral arithmetic and premium financing structures.",
    brief:
      "This firm does not custody or advise on digital assets. Model an existing holding; never recommend acquiring one.",
    wired: true,
    priority: 3,
  },
];

export const MEMORY_GROUP_COUNT = MEMORY_GROUPS.length;

export function memoryGroup(id: string): MemoryGroup | undefined {
  return MEMORY_GROUPS.find((g) => g.id === id);
}

/** Registered but not reaching the brain. The audit answer, computed rather than claimed. */
export function unwiredGroups(): MemoryGroup[] {
  return MEMORY_GROUPS.filter((g) => !g.wired);
}

/** Every module named by any group — what the disk check runs against. */
export function registeredModules(): string[] {
  return Array.from(new Set(MEMORY_GROUPS.flatMap((g) => g.modules))).sort();
}

/**
 * The block the twelve channels receive.
 *
 * `maxPriority` is the trim control: 1 keeps only what must never be dropped,
 * 3 sends everything. The trim is a decision made here rather than an accident
 * that happens when somebody shortens a prompt string.
 */
export function memoryBankBlock(maxPriority: 1 | 2 | 3 = 3): string {
  const groups = MEMORY_GROUPS.filter((g) => g.wired && g.priority <= maxPriority)
    .sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name));
  return [
    "WHAT YOU KNOW. These are the knowledge groups behind the pages, and the standing rule for using each one. A figure you cannot trace to one of these is a figure you do not give:",
    ...groups.map((g) => `- ${g.name}: ${g.brief}`),
    "If a question falls outside every group above, say so and name what would answer it. Do not fill the gap from memory.",
  ].join("\n");
}
