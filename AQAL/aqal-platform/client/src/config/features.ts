// Product feature flags. Flip these to change behavior without a code rewrite.

/**
 * Generational (cohort) rarity — score a person within their own generation/age band,
 * shown as a second number alongside whole-population rarity, plus the homepage
 * "Measured by generation · matched by generation" section and mentor/protégé matching.
 *
 * true  → show generational rarity everywhere (Home GenerationSection, Results two-number
 *         reveal, IntelligenceProfile cohort notes). This is the current differentiator.
 * false → hide it entirely; show only whole-population rarity. No other code change needed.
 */
export const SHOW_GENERATIONAL_RARITY = true;
