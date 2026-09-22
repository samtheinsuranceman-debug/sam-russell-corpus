// ============================================================
// ADVISOR IDENTITY — one place for the master advisor's name. The operator
// chose "Samuel Goldman" over "Thomas Goldman" on 22 Sep 2026; the old name
// stays as an alias so existing routes, tests and copy keep resolving.
// No secrets here: this file is bundled to the browser.
// ============================================================

export const ADVISOR_NAME = "Samuel Goldman" as const;
export const ADVISOR_FIRST_NAME = "Samuel" as const;
export const ADVISOR_ALIASES = ["Thomas Goldman", "Thomas"] as const;

/** Route slugs that all resolve to the advisor. The first is canonical. */
export const ADVISOR_ROUTES = [
  "/portal/samuel-goldman",
  "/portal/thomas-goldman",
  "/portal/advisor",
  "/portal/ask",
] as const;

export const ADVISOR_CANONICAL_ROUTE = ADVISOR_ROUTES[0];

/** Replace the old name in any string (titles, prompts) without touching anything else. */
export function withAdvisorName(text: string): string {
  return ADVISOR_ALIASES.reduce((s, alias) => s.split(alias).join(alias === "Thomas" ? ADVISOR_FIRST_NAME : ADVISOR_NAME), text);
}

/**
 * The nudge the advisor speaks after the visitor has opened a page or two.
 * `pageTitle` is the catalogue title of the page they opened; `purpose` its one-line purpose.
 */
export function nudgeScript(pageTitle: string, purpose?: string): string {
  const what = purpose ? `${pageTitle}, ${purpose.replace(/\.$/, "")}` : pageTitle;
  return (
    `Hi, this is ${ADVISOR_NAME}. I noticed you opened ${what}. ` +
    `Would you like any assistance with it, or is there a question I can answer so you can finalise ` +
    `your confidence and understanding? I can walk through every variable or concern in your decision tree ` +
    `and bring each one to light, one at a time.`
  );
}
