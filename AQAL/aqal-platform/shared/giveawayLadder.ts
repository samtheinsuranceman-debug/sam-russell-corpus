// ============================================================
// LAUNCH GIVEAWAY LADDER — the founding-member discount schedule
// ============================================================
// The launch offer rewards early adopters on a descending ladder by signup
// order: the first cohort is free, each subsequent cohort pays more, until the
// full price kicks in. This is the single source of truth for both the pricing
// UI (what to show a visitor) and the server (what to actually charge).
//
// signupNumber is 1-based: the Nth person to claim a founding membership.

export type GiveawayTier = {
  /** 0-based tier index */
  index: number;
  /** human label for the pricing UI */
  label: string;
  /** fraction OFF the base price, 0..1 (1.0 = free) */
  discount: number;
  /** inclusive signup-number range this tier covers; hiTo null = unbounded */
  from: number;
  to: number | null;
};

// Each cohort is COHORT_SIZE members. Tune here if the cohorts change size.
export const COHORT_SIZE = 10_000;

export const GIVEAWAY_TIERS: GiveawayTier[] = [
  { index: 0, label: "Founding — Free", discount: 1.0, from: 1, to: COHORT_SIZE },
  { index: 1, label: "Founding — 75% off", discount: 0.75, from: COHORT_SIZE + 1, to: COHORT_SIZE * 2 },
  { index: 2, label: "Founding — 50% off", discount: 0.5, from: COHORT_SIZE * 2 + 1, to: COHORT_SIZE * 3 },
  { index: 3, label: "Founding — 25% off", discount: 0.25, from: COHORT_SIZE * 3 + 1, to: COHORT_SIZE * 4 },
  { index: 4, label: "Full price", discount: 0.0, from: COHORT_SIZE * 4 + 1, to: null },
];

/** The tier a given 1-based signup number falls into. */
export function giveawayTierFor(signupNumber: number): GiveawayTier {
  const n = Math.max(1, Math.floor(signupNumber));
  for (const t of GIVEAWAY_TIERS) {
    if (n >= t.from && (t.to === null || n <= t.to)) return t;
  }
  return GIVEAWAY_TIERS[GIVEAWAY_TIERS.length - 1];
}

/** Apply the ladder to a base price (in cents), rounded to whole cents. */
export function giveawayPriceCents(baseCents: number, signupNumber: number): number {
  const t = giveawayTierFor(signupNumber);
  return Math.round(baseCents * (1 - t.discount));
}

/** How many spots remain in the current tier, given how many have signed up. */
export function spotsLeftInTier(signupNumber: number): number | null {
  const t = giveawayTierFor(signupNumber);
  if (t.to === null) return null; // unbounded (full-price) tier
  return Math.max(0, t.to - Math.max(0, Math.floor(signupNumber)) + 1);
}
