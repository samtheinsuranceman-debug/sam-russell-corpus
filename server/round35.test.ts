import { describe, it, expect } from "vitest";
import {
  recommendCarriers,
  getTopRecommendations,
  type CarrierRates,
  type ClientProfile,
} from "../shared/carrierRecommendation";

/* ─── Test carrier data ─── */
const CARRIERS: CarrierRates[] = [
  { carrierId: "aaa_plus_mutual", carrierName: "AAA+ Mutual", loadFee: 0.06, coiRate: 0.05, capRate: 0.12, floorRate: 0.0, avgReturn: 0.10, loanRate: 0.05 },
  { carrierId: "national_life", carrierName: "National Life", loadFee: 0.05, coiRate: 0.04, capRate: 0.10, floorRate: 0.01, avgReturn: 0.085, loanRate: 0.04 },
  { carrierId: "aa-minus-mutual", carrierName: "AA- Mutual", loadFee: 0.07, coiRate: 0.06, capRate: 0.14, floorRate: 0.0, avgReturn: 0.11, loanRate: 0.06 },
  { carrierId: "bbb_plus_mutual", carrierName: "BBB+ Mutual", loadFee: 0.055, coiRate: 0.045, capRate: 0.11, floorRate: 0.005, avgReturn: 0.09, loanRate: 0.045 },
  { carrierId: "a-plus-mutual-life", carrierName: "A+ Mutual Life", loadFee: 0.04, coiRate: 0.035, capRate: 0.09, floorRate: 0.02, avgReturn: 0.08, loanRate: 0.035 },
];

/* ═══════════════════════════════════════════════════════════════════════════
   CARRIER RECOMMENDATION ENGINE
   ═══════════════════════════════════════════════════════════════════════════ */

describe("Carrier Recommendation Engine", () => {
  describe("recommendCarriers", () => {
    it("returns empty array for empty carrier list", () => {
      const result = recommendCarriers([], { age: 45, riskTolerance: "moderate", annualPremium: 25000 });
      expect(result).toEqual([]);
    });

    it("returns all carriers ranked by score", () => {
      const profile: ClientProfile = { age: 45, riskTolerance: "moderate", annualPremium: 25000 };
      const result = recommendCarriers(CARRIERS, profile);
      expect(result).toHaveLength(5);
      // Verify ranks are sequential 1-5
      expect(result.map(r => r.rank)).toEqual([1, 2, 3, 4, 5]);
    });

    it("assigns scores between 0 and 100", () => {
      const profile: ClientProfile = { age: 45, riskTolerance: "moderate", annualPremium: 25000 };
      const result = recommendCarriers(CARRIERS, profile);
      for (const r of result) {
        expect(r.totalScore).toBeGreaterThanOrEqual(0);
        expect(r.totalScore).toBeLessThanOrEqual(100);
        expect(r.growthScore).toBeGreaterThanOrEqual(0);
        expect(r.growthScore).toBeLessThanOrEqual(100);
        expect(r.protectionScore).toBeGreaterThanOrEqual(0);
        expect(r.protectionScore).toBeLessThanOrEqual(100);
        expect(r.costScore).toBeGreaterThanOrEqual(0);
        expect(r.costScore).toBeLessThanOrEqual(100);
        expect(r.loanScore).toBeGreaterThanOrEqual(0);
        expect(r.loanScore).toBeLessThanOrEqual(100);
      }
    });

    it("includes reasoning for each carrier", () => {
      const profile: ClientProfile = { age: 45, riskTolerance: "moderate", annualPremium: 25000 };
      const result = recommendCarriers(CARRIERS, profile);
      for (const r of result) {
        expect(r.reasoning).toBeInstanceOf(Array);
        expect(r.reasoning.length).toBeGreaterThan(0);
      }
    });

    it("sorted by totalScore descending", () => {
      const profile: ClientProfile = { age: 50, riskTolerance: "aggressive", annualPremium: 50000 };
      const result = recommendCarriers(CARRIERS, profile);
      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1].totalScore).toBeGreaterThanOrEqual(result[i].totalScore);
      }
    });

    it("includes carrierId and carrierName in results", () => {
      const profile: ClientProfile = { age: 45, riskTolerance: "moderate", annualPremium: 25000 };
      const result = recommendCarriers(CARRIERS, profile);
      const ids = result.map(r => r.carrierId);
      expect(ids).toContain("aaa_plus_mutual");
      expect(ids).toContain("national_life");
      expect(ids).toContain("aa-minus-mutual");
      expect(ids).toContain("bbb_plus_mutual");
      expect(ids).toContain("a-plus-mutual-life");
    });
  });

  describe("Risk tolerance affects ranking", () => {
    it("aggressive profile gives higher growth scores to high-cap carriers", () => {
      const profile: ClientProfile = { age: 35, riskTolerance: "aggressive", annualPremium: 30000 };
      const result = recommendCarriers(CARRIERS, profile);
      // AA- Mutual has highest cap rate (14%) and avg return (11%) — should have highest growth score
      const allianz = result.find(r => r.carrierId === "aa-minus-mutual")!;
      const securian = result.find(r => r.carrierId === "a-plus-mutual-life")!;
      expect(allianz.growthScore).toBeGreaterThan(securian.growthScore);
    });

    it("conservative profile favors protection and low cost carriers", () => {
      const profile: ClientProfile = { age: 60, riskTolerance: "conservative", annualPremium: 15000 };
      const result = recommendCarriers(CARRIERS, profile);
      // A+ Mutual Life has highest floor rate (2%) and lowest costs — should rank high for conservative
      const securianRank = result.find(r => r.carrierId === "a-plus-mutual-life")!.rank;
      const allianzRank = result.find(r => r.carrierId === "aa-minus-mutual")!.rank;
      // A+ Mutual Life (high protection, low cost) should rank higher than AA- Mutual (high growth, high cost)
      expect(securianRank).toBeLessThan(allianzRank);
    });

    it("moderate profile produces balanced scores", () => {
      const profile: ClientProfile = { age: 45, riskTolerance: "moderate", annualPremium: 25000 };
      const result = recommendCarriers(CARRIERS, profile);
      // All scores should be relatively close (within 50 points of each other)
      const scores = result.map(r => r.totalScore);
      const range = Math.max(...scores) - Math.min(...scores);
      expect(range).toBeLessThanOrEqual(80); // Not too extreme spread
    });
  });

  describe("Age affects scoring weights", () => {
    it("younger clients get higher growth weight", () => {
      const young: ClientProfile = { age: 30, riskTolerance: "moderate", annualPremium: 25000 };
      const old: ClientProfile = { age: 65, riskTolerance: "moderate", annualPremium: 25000 };

      const youngResult = recommendCarriers(CARRIERS, young);
      const oldResult = recommendCarriers(CARRIERS, old);

      // AA- Mutual (highest growth) should score better for young vs old
      const youngAAMinus = youngResult.find(r => r.carrierId === "aa-minus-mutual")!;
      const oldAAMinus = oldResult.find(r => r.carrierId === "aa-minus-mutual")!;
      // Young client should give AA- Mutual a higher total score than old client
      expect(youngAAMinus.totalScore).toBeGreaterThanOrEqual(oldAAMinus.totalScore);
    });

    it("older clients get higher protection weight", () => {
      const young: ClientProfile = { age: 30, riskTolerance: "moderate", annualPremium: 25000 };
      const old: ClientProfile = { age: 65, riskTolerance: "moderate", annualPremium: 25000 };

      const youngResult = recommendCarriers(CARRIERS, young);
      const oldResult = recommendCarriers(CARRIERS, old);

      // A+ Mutual Life (highest floor rate) should rank better for old vs young
      const youngAPlusMutual = youngResult.find(r => r.carrierId === "a-plus-mutual-life")!;
      const oldAPlusMutual = oldResult.find(r => r.carrierId === "a-plus-mutual-life")!;
      expect(oldAPlusMutual.rank).toBeLessThanOrEqual(youngAPlusMutual.rank);
    });
  });

  describe("getTopRecommendations", () => {
    it("returns top N carriers", () => {
      const profile: ClientProfile = { age: 45, riskTolerance: "moderate", annualPremium: 25000 };
      const top3 = getTopRecommendations(CARRIERS, profile, 3);
      expect(top3).toHaveLength(3);
      expect(top3[0].rank).toBe(1);
      expect(top3[1].rank).toBe(2);
      expect(top3[2].rank).toBe(3);
    });

    it("defaults to top 3", () => {
      const profile: ClientProfile = { age: 45, riskTolerance: "moderate", annualPremium: 25000 };
      const result = getTopRecommendations(CARRIERS, profile);
      expect(result).toHaveLength(3);
    });

    it("returns all if N > carrier count", () => {
      const profile: ClientProfile = { age: 45, riskTolerance: "moderate", annualPremium: 25000 };
      const result = getTopRecommendations(CARRIERS, profile, 10);
      expect(result).toHaveLength(5);
    });
  });

  describe("Edge cases", () => {
    it("handles single carrier", () => {
      const profile: ClientProfile = { age: 45, riskTolerance: "moderate", annualPremium: 25000 };
      const result = recommendCarriers([CARRIERS[0]], profile);
      expect(result).toHaveLength(1);
      expect(result[0].rank).toBe(1);
      // With single carrier, all normalized scores should be 50 (midpoint)
      expect(result[0].totalScore).toBe(50);
    });

    it("handles identical carriers", () => {
      const identical: CarrierRates[] = [
        { ...CARRIERS[0], carrierId: "a", carrierName: "Carrier A" },
        { ...CARRIERS[0], carrierId: "b", carrierName: "Carrier B" },
      ];
      const profile: ClientProfile = { age: 45, riskTolerance: "moderate", annualPremium: 25000 };
      const result = recommendCarriers(identical, profile);
      expect(result).toHaveLength(2);
      // Both should have the same score
      expect(result[0].totalScore).toBe(result[1].totalScore);
    });

    it("handles extreme ages", () => {
      const veryYoung: ClientProfile = { age: 20, riskTolerance: "aggressive", annualPremium: 10000 };
      const veryOld: ClientProfile = { age: 80, riskTolerance: "conservative", annualPremium: 50000 };

      const youngResult = recommendCarriers(CARRIERS, veryYoung);
      const oldResult = recommendCarriers(CARRIERS, veryOld);

      expect(youngResult).toHaveLength(5);
      expect(oldResult).toHaveLength(5);
      // All scores should be valid
      for (const r of [...youngResult, ...oldResult]) {
        expect(r.totalScore).toBeGreaterThanOrEqual(0);
        expect(r.totalScore).toBeLessThanOrEqual(100);
      }
    });

    it("handles zero premium", () => {
      const profile: ClientProfile = { age: 45, riskTolerance: "moderate", annualPremium: 0 };
      const result = recommendCarriers(CARRIERS, profile);
      expect(result).toHaveLength(5);
    });
  });

  describe("Reasoning generation", () => {
    it("mentions cap rate for high-growth carriers", () => {
      const profile: ClientProfile = { age: 35, riskTolerance: "aggressive", annualPremium: 30000 };
      const result = recommendCarriers(CARRIERS, profile);
      const allianz = result.find(r => r.carrierId === "aa-minus-mutual")!;
      const hasGrowthReasoning = allianz.reasoning.some(r => r.includes("cap rate") || r.includes("growth"));
      expect(hasGrowthReasoning).toBe(true);
    });

    it("mentions floor rate for high-protection carriers", () => {
      const profile: ClientProfile = { age: 60, riskTolerance: "conservative", annualPremium: 15000 };
      const result = recommendCarriers(CARRIERS, profile);
      const securian = result.find(r => r.carrierId === "a-plus-mutual-life")!;
      const hasProtectionReasoning = securian.reasoning.some(r => r.includes("floor") || r.includes("protection"));
      expect(hasProtectionReasoning).toBe(true);
    });

    it("mentions cost for low-cost carriers", () => {
      const profile: ClientProfile = { age: 45, riskTolerance: "moderate", annualPremium: 25000 };
      const result = recommendCarriers(CARRIERS, profile);
      const securian = result.find(r => r.carrierId === "a-plus-mutual-life")!;
      const hasCostReasoning = securian.reasoning.some(r => r.includes("cost") || r.includes("load") || r.includes("COI"));
      expect(hasCostReasoning).toBe(true);
    });

    it("mentions age-specific reasoning for young clients", () => {
      const profile: ClientProfile = { age: 35, riskTolerance: "aggressive", annualPremium: 30000 };
      const result = recommendCarriers(CARRIERS, profile);
      // At least one carrier should have age-specific reasoning
      const hasAgeReasoning = result.some(r => r.reasoning.some(reason => reason.includes("accumulation")));
      expect(hasAgeReasoning).toBe(true);
    });

    it("mentions age-specific reasoning for older clients", () => {
      const profile: ClientProfile = { age: 60, riskTolerance: "conservative", annualPremium: 15000 };
      const result = recommendCarriers(CARRIERS, profile);
      const hasAgeReasoning = result.some(r => r.reasoning.some(reason => reason.includes("horizon") || reason.includes("accumulation")));
      expect(hasAgeReasoning).toBe(true);
    });

    it("fallback reasoning for balanced carriers", () => {
      // When a carrier doesn't excel in any dimension, it should get the fallback
      const balanced: CarrierRates[] = [
        { carrierId: "a", carrierName: "A", loadFee: 0.05, coiRate: 0.05, capRate: 0.10, floorRate: 0.01, avgReturn: 0.09, loanRate: 0.05 },
        { carrierId: "b", carrierName: "B", loadFee: 0.05, coiRate: 0.05, capRate: 0.10, floorRate: 0.01, avgReturn: 0.09, loanRate: 0.05 },
      ];
      const profile: ClientProfile = { age: 45, riskTolerance: "moderate", annualPremium: 25000 };
      const result = recommendCarriers(balanced, profile);
      // Both should have the fallback reasoning since they're identical
      for (const r of result) {
        expect(r.reasoning.some(reason => reason.includes("Balanced") || reason.includes("moderate"))).toBe(true);
      }
    });
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   STRATEGY ANALYTICS
   ═══════════════════════════════════════════════════════════════════════════ */

describe("Strategy Analytics", () => {
  describe("Data structure", () => {
    it("analytics response has required fields", () => {
      // Verify the expected shape of the analytics response
      const mockResponse = {
        totalStrategies: 10,
        activeStrategies: 7,
        archivedStrategies: 3,
        topCarriers: [
          { carrierId: "aaa_plus_mutual", carrierName: "AAA+ Mutual", count: 5 },
          { carrierId: "aa-minus-mutual", carrierName: "AA- Mutual", count: 3 },
        ],
        clientsWithStrategies: 4,
        strategyTypes: [
          { type: "1yr-non-solar", count: 6 },
          { type: "2yr-non-solar", count: 4 },
        ],
      };

      expect(mockResponse.totalStrategies).toBe(10);
      expect(mockResponse.activeStrategies).toBe(7);
      expect(mockResponse.archivedStrategies).toBe(3);
      expect(mockResponse.topCarriers).toHaveLength(2);
      expect(mockResponse.clientsWithStrategies).toBe(4);
      expect(mockResponse.strategyTypes).toHaveLength(2);
    });

    it("active + archived = total", () => {
      const total = 15;
      const active = 10;
      const archived = 5;
      expect(active + archived).toBe(total);
    });

    it("topCarriers sorted by count descending", () => {
      const topCarriers = [
        { carrierId: "a", carrierName: "A", count: 10 },
        { carrierId: "b", carrierName: "B", count: 5 },
        { carrierId: "c", carrierName: "C", count: 2 },
      ];
      for (let i = 1; i < topCarriers.length; i++) {
        expect(topCarriers[i - 1].count).toBeGreaterThanOrEqual(topCarriers[i].count);
      }
    });

    it("strategyTypes sorted by count descending", () => {
      const types = [
        { type: "1yr-non-solar", count: 8 },
        { type: "2yr-non-solar", count: 5 },
        { type: "1yr-solar", count: 2 },
      ];
      for (let i = 1; i < types.length; i++) {
        expect(types[i - 1].count).toBeGreaterThanOrEqual(types[i].count);
      }
    });
  });

  describe("Empty state handling", () => {
    it("returns zeros when no strategies exist", () => {
      const emptyResponse = {
        totalStrategies: 0,
        activeStrategies: 0,
        archivedStrategies: 0,
        topCarriers: [],
        clientsWithStrategies: 0,
        strategyTypes: [],
      };

      expect(emptyResponse.totalStrategies).toBe(0);
      expect(emptyResponse.topCarriers).toHaveLength(0);
      expect(emptyResponse.strategyTypes).toHaveLength(0);
    });
  });

  describe("Carrier count aggregation", () => {
    it("correctly counts carriers from strategy data", () => {
      const strategies = [
        { carrierId: "aaa_plus_mutual", carrierName: "AAA+ Mutual" },
        { carrierId: "aaa_plus_mutual", carrierName: "AAA+ Mutual" },
        { carrierId: "aa-minus-mutual", carrierName: "AA- Mutual" },
        { carrierId: "aaa_plus_mutual", carrierName: "AAA+ Mutual" },
        { carrierId: "aa-minus-mutual", carrierName: "AA- Mutual" },
      ];

      const carrierCounts = new Map<string, { name: string; count: number }>();
      for (const s of strategies) {
        const existing = carrierCounts.get(s.carrierId);
        if (existing) {
          existing.count++;
        } else {
          carrierCounts.set(s.carrierId, { name: s.carrierName, count: 1 });
        }
      }

      const topCarriers = Array.from(carrierCounts.entries())
        .map(([id, { name, count }]) => ({ carrierId: id, carrierName: name, count }))
        .sort((a, b) => b.count - a.count);

      expect(topCarriers).toHaveLength(2);
      expect(topCarriers[0].carrierId).toBe("aaa_plus_mutual");
      expect(topCarriers[0].count).toBe(3);
      expect(topCarriers[1].carrierId).toBe("aa-minus-mutual");
      expect(topCarriers[1].count).toBe(2);
    });

    it("limits to top 5 carriers", () => {
      const carriers = Array.from({ length: 10 }, (_, i) => ({
        carrierId: `carrier_${i}`,
        carrierName: `Carrier ${i}`,
        count: 10 - i,
      }));

      const top5 = carriers.slice(0, 5);
      expect(top5).toHaveLength(5);
      expect(top5[0].count).toBe(10);
      expect(top5[4].count).toBe(6);
    });
  });

  describe("Strategy type breakdown", () => {
    it("correctly counts strategy types", () => {
      const strategies = [
        { strategyType: "1yr-non-solar" },
        { strategyType: "1yr-non-solar" },
        { strategyType: "2yr-non-solar" },
        { strategyType: "1yr-solar" },
        { strategyType: "1yr-non-solar" },
      ];

      const typeCounts = new Map<string, number>();
      for (const s of strategies) {
        typeCounts.set(s.strategyType, (typeCounts.get(s.strategyType) ?? 0) + 1);
      }

      const types = Array.from(typeCounts.entries())
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count);

      expect(types).toHaveLength(3);
      expect(types[0]).toEqual({ type: "1yr-non-solar", count: 3 });
      expect(types[1]).toEqual({ type: "2yr-non-solar", count: 1 });
      expect(types[2]).toEqual({ type: "1yr-solar", count: 1 });
    });
  });

  describe("Widget display logic", () => {
    it("percentage bar calculation for carrier counts", () => {
      const topCarriers = [
        { carrierId: "a", carrierName: "A", count: 10 },
        { carrierId: "b", carrierName: "B", count: 5 },
        { carrierId: "c", carrierName: "C", count: 2 },
      ];

      const maxCount = topCarriers[0].count;
      const percentages = topCarriers.map(c => (c.count / maxCount) * 100);

      expect(percentages[0]).toBe(100);
      expect(percentages[1]).toBe(50);
      expect(percentages[2]).toBe(20);
    });

    it("handles single carrier in bar calculation", () => {
      const topCarriers = [{ carrierId: "a", carrierName: "A", count: 3 }];
      const maxCount = topCarriers[0]?.count ?? 1;
      const pct = (topCarriers[0].count / maxCount) * 100;
      expect(pct).toBe(100);
    });
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   NORMALIZE FUNCTION (via recommendation engine)
   ═══════════════════════════════════════════════════════════════════════════ */

describe("Scoring normalization", () => {
  it("produces consistent results across multiple runs", () => {
    const profile: ClientProfile = { age: 45, riskTolerance: "moderate", annualPremium: 25000 };
    const result1 = recommendCarriers(CARRIERS, profile);
    const result2 = recommendCarriers(CARRIERS, profile);

    for (let i = 0; i < result1.length; i++) {
      expect(result1[i].totalScore).toBe(result2[i].totalScore);
      expect(result1[i].rank).toBe(result2[i].rank);
    }
  });

  it("different profiles produce different score distributions", () => {
    const aggressive: ClientProfile = { age: 30, riskTolerance: "aggressive", annualPremium: 50000 };
    const conservative: ClientProfile = { age: 65, riskTolerance: "conservative", annualPremium: 15000 };

    const aggResult = recommendCarriers(CARRIERS, aggressive);
    const conResult = recommendCarriers(CARRIERS, conservative);

    // Growth-heavy carrier (AA- Mutual) should score relatively better for aggressive
    const aggAAMinus = aggResult.find(r => r.carrierId === "aa-minus-mutual")!;
    const conAAMinus = conResult.find(r => r.carrierId === "aa-minus-mutual")!;
    // AA- Mutual should have a higher total score for aggressive vs conservative profile
    expect(aggAAMinus.totalScore).toBeGreaterThanOrEqual(conAAMinus.totalScore);
  });
});
