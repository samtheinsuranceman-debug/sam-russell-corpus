// ============================================================
// ADVISOR ANSWER MODES — the six ways the every-page advisor can answer
// the same question. Shared so the mic button, the server prompt and the
// emailed PDF all use one definition.
// ============================================================
export type AdvisorMode = "surface" | "deeper" | "integrated" | "wiifm" | "legal" | "all";

export type ModeDef = { id: AdvisorMode; label: string; short: string; blurb: string; instruction: string; maxWords: number };

export const ADVISOR_MODES: ModeDef[] = [
  {
    id: "surface", label: "Direct answer", short: "Direct", maxWords: 140,
    blurb: "The plain answer, nothing else.",
    instruction: "Give the surface, direct answer: what it is and what it means for this person, in plain words. No background, no tangents.",
  },
  {
    id: "deeper", label: "Deeper understanding", short: "Deeper", maxWords: 320,
    blurb: "How it actually works, the mechanism, the trade-offs.",
    instruction: "Give a deeper understanding: the mechanism behind the answer, the moving parts, the numbers that drive it, the trade-offs and the conditions under which it stops being true. Use the person's own figures when the profile has them; otherwise say which figure would change the answer.",
  },
  {
    id: "integrated", label: "Integrated", short: "Integrated", maxWords: 320,
    blurb: "How it fits inside the larger picture of the whole plan.",
    instruction: "Give the integrated answer: how this fits inside the larger picture of the person's whole plan — income, taxes, debt, protection, investing, retirement income, estate and legacy — which other decisions it touches, what it depends on, what depends on it, and the order in which the pieces should move.",
  },
  {
    id: "wiifm", label: "What's in it for you", short: "For you", maxWords: 360,
    blurb: "Its place in the whole system, told like a franchise with many moving pieces.",
    instruction: "Give the what's-in-it-for-them answer: how this piece works together with everything else to build their optimal, unified system of plans. Explain its place using a well-known system with many moving pieces — the NFL is the default: name the specific role this question and your answer play in the whole franchise (it might be the quarterback, the offensive line, the coaching staff, the front office, the fans, the stadium, merchandise, the television deal, or the little league that teaches children teamwork and to put the ego's need to be number one on the back seat in service of the team's unified outcome). Say plainly what the person gains now and over the years, and what the plan loses if this piece is missing.",
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
];

export const MODE_IDS = ADVISOR_MODES.map((m) => m.id) as [AdvisorMode, ...AdvisorMode[]];

export function modeDef(id: AdvisorMode): ModeDef {
  return ADVISOR_MODES.find((m) => m.id === id) ?? ADVISOR_MODES[0]!;
}

/** The five single modes, in the order the "all" answer and the PDF present them. */
export const SINGLE_MODES: AdvisorMode[] = ["surface", "deeper", "integrated", "wiifm", "legal"];
