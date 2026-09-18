/**
 * The reveal layer — Grok's copy for the three-line stack under every
 * calculator question and again under the output (SITE_PERSONALITY_SYSTEM.md).
 *
 * One master pair, then one specialisation per needle. Nothing here promises
 * that no one else will ever build this; it says the stack is ours and the
 * questions are asked together on purpose.
 */
import type { Needle } from "./themes";

export const MASTER_MICRO =
  "This question exists because the usual calculator never has to live with the tax year, the policy, and the household at the same time.";

export const MASTER_MACRO =
  "You are not seeing this on another site because most of the industry sells a product illustration, not a physician's tax-and-reserve system. The next five to ten years of retail software will still optimize one box. This page is what happens when the boxes are forced to answer to each other.";

/** The softer form for anything a client receives by link, email or PDF. */
export const IVORY_MACRO =
  "Modeled as one household system — product, tax, and income year together — rather than as separate illustrations.";

export const FOOTER_LABEL = "Why this isn't on the other screen →";

export const NEEDLE_REVEAL: Record<Needle, { micro: string; macro: string }> = {
  gold: {
    micro: "A carrier illustration will answer “what the product can print.” This asks what the policy can fund after tax, after loan, after the practice.",
    macro: "Other desks stop at the illustration. This desk keeps going until the policy, the tax bracket, and the income year agree. That last step is why this number is not waiting for you on a product website.",
  },
  horizon: {
    micro: "Retail retirement tools assume a portfolio. This assumes a paycheck you cannot outlive and a tax on Medicare if you guess wrong.",
    macro: "The industry will keep selling accumulation. You needed a coordinated income year. That coordination is what does not exist on the public calculators, and will not until income, IRMAA, and the contract are modeled as one problem.",
  },
  forest: {
    micro: "A Roth calculator converts a number. This converts a year in a physician's bracket map, against a policy and a surviving spouse.",
    macro: "Your CPA can convert. Your agent can illustrate. Almost no one owns both questions on the same page. That is the gap this engine is built to occupy for the next decade of your tax life.",
  },
  steel: {
    micro: "A mortgage site wants the payment. This wants the house to retire the house without waking the tax.",
    macro: "Bank tools amortize. Advisor tools ignore the property. This is the first room where the note, the policy loan, and the bracket have to survive each other. That is not a filter you will find on Zillow or at a wire house in the next cycle of software.",
  },
  cyan: {
    micro: "A chart shop will show a path. This asks which path still works when AG49, inflation, and the withdrawal year are in the same frame.",
    macro: "Prediction pages elsewhere are entertainment. This one has to answer to the policy and the tax engine behind it. That coupling is the part the market will not copy quickly, because it is not a widget. It is the building.",
  },
  oxblood: {
    micro: "A will template asks who gets the assets. This asks which pocket the assets should have been in before anyone dies.",
    macro: "Estate software drafts documents. Insurance software prints a death benefit. This page is the missing year-zero, which is why attorneys and agents keep handing you two unread piles. You are in the room that makes them one pile.",
  },
  champagne: {
    micro: "This is an operator question. It is here so the plan is honest about who gets paid and what breaks.",
    macro: "Most client-facing sites hide this layer. We do not. The plan that cannot say its own economics is the plan every other site is still willing to print.",
  },
};

/** Public engines have their own whispers. */
export const PUBLIC_REVEAL: Record<string, { micro: string; macro: string }> = {
  "/calculators": { micro: MASTER_MICRO, macro: MASTER_MACRO },
  "/ultra-calculator": { micro: NEEDLE_REVEAL.cyan.micro, macro: MASTER_MACRO },
  "/fact-finder": {
    micro: "Other fact-finders collect hobbies. This one collects the constraints the engines actually need.",
    macro: MASTER_MACRO,
  },
};

/** Phrases the reveal layer must never use (Grok's "what not to write"). */
export const FORBIDDEN_PHRASES = ["secret", "don't want you to know", "don’t want you to know", "guaranteed unique", "nobody else has this"];

export function revealFor(needle: Needle | null, path?: string): { micro: string; macro: string } {
  if (path && PUBLIC_REVEAL[path]) return PUBLIC_REVEAL[path];
  if (needle) return NEEDLE_REVEAL[needle];
  return { micro: MASTER_MICRO, macro: MASTER_MACRO };
}
