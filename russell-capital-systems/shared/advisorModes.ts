// ============================================================
// ADVISOR ANSWER MODES — the six ways the every-page advisor can answer
// the same question. Shared so the mic button, the server prompt and the
// emailed PDF all use one definition.
// ============================================================
export type AdvisorMode = "surface" | "deeper" | "integrated" | "wiifm" | "legal" | "all" | "horizon";

export type ModeDef = { id: AdvisorMode; label: string; short: string; blurb: string; instruction: string; maxWords: number };

export const ADVISOR_MODES: ModeDef[] = [
  {
    id: "surface", label: "Direct answer", short: "Direct", maxWords: 140,
    blurb: "The plain answer, nothing else.",
    instruction: "Give the surface, direct answer: what it is and what it could mean for someone with these facts, in plain words, as education rather than a personal recommendation. No background, no tangents; keep the qualifiers the regulatory floor requires.",
  },
  {
    id: "deeper", label: "Deeper understanding", short: "Deeper", maxWords: 320,
    blurb: "How it actually works, the mechanism, the trade-offs.",
    instruction: "Give a deeper understanding: the mechanism behind the answer, the moving parts, the numbers that drive it, the trade-offs and the conditions under which it stops being true. Use the person's own figures when the profile has them; otherwise say which figure would change the answer.",
  },
  {
    id: "integrated", label: "Integrated", short: "Integrated", maxWords: 320,
    blurb: "How it fits inside the larger picture of the whole plan.",
    instruction: "Give the integrated answer: how this fits inside the larger picture of the person's whole plan — income, taxes, debt, protection, investing, retirement income, estate and legacy — which other decisions it touches, what it depends on, what depends on it, and the order in which the pieces could be modeled. It is hypothetical and based on their facts; a licensed professional confirms any specific before anyone acts.",
  },
  {
    id: "wiifm", label: "What's in it for you", short: "For you", maxWords: 360,
    blurb: "Its place in the whole system, told like a franchise with many moving pieces.",
    instruction: "Give the what's-in-it-for-them answer: how this piece could work together with everything else in a unified system of plans, hypothetically and based on their facts. Explain its place using a well-known system with many moving pieces — the NFL is the default: name the specific role this question and your answer play in the whole franchise (it might be the quarterback, the offensive line, the coaching staff, the front office, the fans, the stadium, merchandise, the television deal, or the little league that teaches children teamwork and to put the ego's need to be number one on the back seat in service of the team's unified outcome). Say plainly what the person gains now and over the years, and what the plan loses if this piece is missing.",
  },
  {
    id: "legal", label: "Legal, with citations", short: "Legal", maxWords: 380,
    blurb: "The governing law, cited, with reference sources.",
    instruction: "Give the legal and regulatory answer: the statutes, regulations, rulings, publications and cases that govern it — Internal Revenue Code sections, Treasury Regulations, IRS publications and notices, state law where it matters, court decisions — each with a citation and a reference source the reader can open (an official URL when you know it). Cite only sources you are confident exist; if you are not certain of a citation, say so rather than guess. Explain what each source says in one sentence. End with: this is education, not legal advice; confirm with a licensed attorney or CPA before acting.",
  },
  {
    id: "all", label: "All of the above", short: "All", maxWords: 1200,
    blurb: "Every answer, as succinctly as possible — and a PDF copy by email if you want one.",
    instruction: "Answer in all five ways, each under its own heading, each as succinct as possible: DIRECT ANSWER, DEEPER UNDERSTANDING, INTEGRATED, WHAT'S IN IT FOR YOU, LEGAL WITH CITATIONS.",
  },
  {
    id: "horizon", label: "The next twenty years", short: "20 years", maxWords: 700,
    blurb: "With permission and a few more facts: the three to five questions you should be asking fifteen or twenty years from now, answered today.",
    instruction: "The person has given permission and a few extra facts (age, years until they would like to stop practising, largest debt and its rate, practice status, what worries them). Do not answer their original question again. Instead, name the THREE TO FIVE questions this person should be asking fifteen or twenty years from now, when it would be too late to act — the questions their situation makes inevitable but that nobody has asked them yet. Number them. Under each, in two to four sentences, answer it NOW: what to do in the next twelve months so the answer in twenty years is a good one, and which of the firm's coordinated strategies it touches. Be specific to the facts given; where a fact is missing, say which one would change the answer. Do not flatter and do not imply the person has been careless; the point is that the system sees further ahead than any single advisor does. End with one sentence inviting them to take the Fact Finder so the next twenty years can be modelled properly, and the standing line: education, not tax, legal or investment advice.",
  },
];

/** The extra facts the advisor asks for, with permission, before the twenty-year questions. */
export const HORIZON_FACTS: Array<{ id: string; label: string; placeholder: string }> = [
  { id: "age", label: "Your age", placeholder: "e.g. 41" },
  { id: "stop", label: "Years until you would like to stop practising", placeholder: "e.g. 18" },
  { id: "debt", label: "Largest debt and its rate", placeholder: "e.g. $620k mortgage at 6.4%" },
  { id: "practice", label: "Employed, partner or owner?", placeholder: "e.g. owner, 2 locations" },
  { id: "worry", label: "The thing about money that worries you most", placeholder: "e.g. taxes keep rising" },
];

export function horizonQuestion(facts: Record<string, string>): string {
  const lines = HORIZON_FACTS.map((f) => `${f.label}: ${facts[f.id]?.trim() || "not given"}`);
  return `With my permission, tell me the three to five questions I should be asking in fifteen or twenty years, and answer them now.\n${lines.join("\n")}`;
}

export const MODE_IDS = ADVISOR_MODES.map((m) => m.id) as [AdvisorMode, ...AdvisorMode[]];

export function modeDef(id: AdvisorMode): ModeDef {
  return ADVISOR_MODES.find((m) => m.id === id) ?? ADVISOR_MODES[0]!;
}

/** The five single modes, in the order the "all" answer and the PDF present them. */
export const SINGLE_MODES: AdvisorMode[] = ["surface", "deeper", "integrated", "wiifm", "legal"];

/**
 * Where the two typed-in numbers in this file come from. Neither is a market
 * or regulatory figure: one is a length limit the firm set, the other is an
 * example printed in an empty input box.
 */
export const ADVISOR_MODES_SOURCES: readonly { label: string; url?: string; asOf?: string; note?: string }[] = [
  { label: "Assumption: word limit for the \"All of the above\" answer = 1,200 words, chosen by the firm because it holds all five single answers in one reply, each written more tightly than it would be on its own; no external source" },
  { label: "Assumption: the \"6.4%\" in the placeholder \"e.g. $620k mortgage at 6.4%\" is an illustrative example shown in an empty box, chosen by the firm because it shows the format of the answer wanted; it is not a quoted rate and feeds no calculation; no external source" },
  { label: "Assumption: word limits for the other modes = 140, 320, 320, 360, 380 and 700, chosen by the firm because each keeps its answer readable in one sitting; no external source" },
];
