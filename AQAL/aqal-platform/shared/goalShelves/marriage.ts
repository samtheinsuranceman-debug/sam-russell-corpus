// Goal shelf: MARRIAGE — be a better husband, wife or partner (sections 8000–8099).
// Verification: every DOI below was resolved against the Crossref record or the
// publisher page on 2026-09-11. See types.ts for the contract.
import { doi, type GoalShelfCluster } from "./types";

export const SECTIONS: Record<string, string> = {
  "8000": "How to Read This Shelf",
  "8001": "Fairness at Home — Chores, Load & Relationship Quality",
};

export const CLUSTERS: GoalShelfCluster[] = [
  {
    id: "gs-marriage-read-me-first",
    goal: "marriage", tier: "fundamental", section: "8000",
    title: "How to Read the Marriage Shelf",
    subtitle: "Protocols, not diagnoses — pick one per tier each month",
    evidenceTag: "Strong",
    impact: { magnitude: 3, latency: "weeks", durability: "sustained", effort: "low" },
    description:
      "Every protocol on this shelf is tagged fundamental, moderate, advanced or elite and carries a concrete action step. The monthly menu hands you one or two from each tier. Start with the fundamental one you are not already doing; the tiers above it compound on that floor.",
    action: "This month, pick the one fundamental protocol on this shelf you are not already doing and run it daily for 30 days before adding anything else.",
    sources: [
      { cite: "Rodriguez-Stanley, J., Alonso-Ferres, M., Zilioli, S., & Slatcher, R. B. (2020). Housework, health, and well-being in older adults: The role of socioeconomic status. Journal of Family Psychology, 34(5), 610–620.", note: "In 2,644 married and cohabiting adults (MIDUS), the hours of chores mattered less than whether the split felt fair; perceived fairness carried the effect of housework on later marital quality, well-being and sleep.", link: doi("10.1037/fam0000630"), kind: "doi" },
    ],
  },
];
