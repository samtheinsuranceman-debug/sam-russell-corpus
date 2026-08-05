import { useEffect, useState } from "react";

// ============================================================
// HERO HEADLINE A/B TEST
// ============================================================
// Four hero framings, tested against each other so the market — not us — decides
// which ego frame converts. Each visitor is assigned one variant, stably (stored
// in localStorage), and the variant id rides along on the funnel analytics
// (landing_view / checkout_start) so conversion can be attributed per variant.
//
// The frames deliberately sell EARNED status (finishing, revealed rarity, refusing
// to be one number, a selective network) rather than a false "you're smarter than
// everyone" claim — same ego hit, none of the honesty risk.

export type HeroVariant = {
  id: string;
  lead: string; // plain lead-in
  emph: string; // the gradient-emphasized tail
  sub?: string; // optional supporting line
};

export const HERO_VARIANTS: HeroVariant[] = [
  {
    // Control — the founder-worded outcome headline.
    id: "outcome",
    lead: "How predictable, protected, and reliable is your mind ",
    emph: "at producing your dreams and outcomes?",
    sub: "Almost no one has ever measured it. We do — then we engineer the mind to close the gap between where you stand and what you're chasing.",
  },
  {
    // Commitment-elite: finishing is the flex (true — short answers score zero).
    id: "commitment",
    lead: "Most people won't finish this. The ones who do get ",
    emph: "the only real map of their mind.",
    sub: "It takes 90 minutes and total honesty. That's the filter. The first 10,000 who finish join free, for life.",
  },
  {
    // Revealed rarity: the product literally computes 1-in-X.
    id: "rarity",
    lead: "Find out how rare your mind actually is — ",
    emph: "across all 32 lines, not just the one a test measured.",
    sub: "Every other test scored a sliver of you. This one measures the whole system, and tells you where you stand.",
  },
  {
    // Refusal / identity: for people who reject a single number.
    id: "refuse",
    lead: "The assessment for people who ",
    emph: "refuse to be one number.",
    sub: "A selective network of people who wanted their whole mind measured — and had the nerve to be seen completely.",
  },
];

// The one we'd ship if we had to pick without data (used as the static default
// on any surface that isn't running the experiment).
export const STRONGEST_HERO_ID = "outcome";
export const strongestHero = () =>
  HERO_VARIANTS.find((v) => v.id === STRONGEST_HERO_ID) ?? HERO_VARIANTS[0];

const STORAGE_KEY = "aqal_hero_variant";

// Stable per-visitor assignment. Returns the strongest variant on first paint,
// then settles on the assigned one after mount (keeps assignment client-stable).
export function useHeroVariant(): HeroVariant {
  const [variant, setVariant] = useState<HeroVariant>(strongestHero);

  useEffect(() => {
    try {
      const savedId = localStorage.getItem(STORAGE_KEY);
      const saved = savedId && HERO_VARIANTS.find((v) => v.id === savedId);
      if (saved) {
        setVariant(saved);
        return;
      }
      const pick = HERO_VARIANTS[Math.floor(Math.random() * HERO_VARIANTS.length)];
      localStorage.setItem(STORAGE_KEY, pick.id);
      setVariant(pick);
    } catch {
      // localStorage unavailable — keep the strongest default.
    }
  }, []);

  return variant;
}

/** The assigned variant id for analytics, or the strongest default. */
export function currentHeroId(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || STRONGEST_HERO_ID;
  } catch {
    return STRONGEST_HERO_ID;
  }
}
