// ============================================================
// ENTRANCE DISCLAIMERS
// Every sign-in (owner, guest, managed) must tick every one of these before the
// server will issue a session. The client renders the list from here and the
// server refuses a sign-in whose body does not carry every id, so the gate is
// the same on both sides and cannot be skipped by editing the page.
// ============================================================

export type LoginDisclaimer = { id: string; title: string; text: string };

export const LOGIN_DISCLAIMERS: readonly LoginDisclaimer[] = [
  {
    id: "education-only",
    title: "Education, not advice",
    text: "Russell Capital Systems is an educational planning tool. Nothing on this site is tax, legal, accounting, investment, fiduciary, actuarial or insurance advice, and signing in does not create an advisor-client relationship.",
  },
  {
    id: "no-guarantee",
    title: "Projections are not guarantees",
    text: "Every projection, illustration, back-test and simulation here is hypothetical. Historical index results do not predict future results. No output represents any insurer's current illustrated scale, premiums, charges, policy values, loan results, death benefits or tax treatment.",
  },
  {
    id: "verify-first",
    title: "Verify before acting",
    text: "I will consult my own licensed tax, legal, insurance and financial professionals before acting on anything I see here. Any life insurance decision must rest on a carrier-issued illustration and the policy documents, not on this tool.",
  },
  {
    id: "patent-pending",
    title: "Patent-pending, confidential",
    text: "The technologies described on this site are patent-pending and not yet granted. I will not copy, reverse-engineer, scrape or redistribute the site's methods, screens or output.",
  },
  {
    id: "terms-privacy",
    title: "Terms, privacy and recording",
    text: "I have read and agree to the Terms of Use and Privacy Policy, and I consent to my sign-in and these acknowledgements being recorded with the date, time and network address.",
  },
] as const;

export const LOGIN_DISCLAIMER_IDS: readonly string[] = LOGIN_DISCLAIMERS.map((d) => d.id);

/** Ids from the list that are absent from `accepted`. Empty means every box was ticked. */
export function missingAcknowledgements(accepted: unknown): string[] {
  const set = new Set(Array.isArray(accepted) ? accepted.filter((x): x is string => typeof x === "string") : []);
  return LOGIN_DISCLAIMER_IDS.filter((id) => !set.has(id));
}
