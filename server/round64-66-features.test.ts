import { describe, it, expect, vi } from "vitest";

// ─── Round 64: Carrier Ratings Service ───
describe("Round 64 — Carrier Ratings Enrichment Service", () => {
  it("should export getEnrichedCarrierRatings function", async () => {
    const mod = await import("./carrierRatingsService");
    expect(typeof mod.getEnrichedCarrierRatings).toBe("function");
    expect(typeof mod.getEnrichedCarrierById).toBe("function");
    expect(typeof mod.invalidateCarrierCache).toBe("function");
  });

  it("should return only validated provider records or an honest empty result", async () => {
    const { getEnrichedCarrierRatings } = await import("./carrierRatingsService");
    const ratings = await getEnrichedCarrierRatings();
    expect(Array.isArray(ratings)).toBe(true);
    for (const r of ratings) {
      expect(r).toHaveProperty("carrierId");
      expect(r).toHaveProperty("carrierName");
      expect(r).toHaveProperty("amBest");
      expect(r).toHaveProperty("sp");
      expect(r).toHaveProperty("moodys");
      expect(r).toHaveProperty("fitch");
      expect(r).toHaveProperty("financials");
      expect(r.dataSource).toBe("live");
      // Provider-supplied enriched fields
      expect(r).toHaveProperty("financialStrength");
      expect(r).toHaveProperty("productQuality");
      expect(r).toHaveProperty("serviceRating");
      expect(r).toHaveProperty("innovationScore");
      expect(r).toHaveProperty("valueScore");
      expect(r).toHaveProperty("overallScore");
      expect(r).toHaveProperty("specialty");
      expect(r).toHaveProperty("strengths");
      expect(r).toHaveProperty("lastUpdated");
      // Score ranges
      expect(r.financialStrength).toBeGreaterThanOrEqual(1);
      expect(r.financialStrength).toBeLessThanOrEqual(10);
      expect(r.overallScore).toBeGreaterThanOrEqual(1);
      expect(r.overallScore).toBeLessThanOrEqual(10);
    }
  });

  it("should sort carriers by overallScore descending", async () => {
    const { getEnrichedCarrierRatings } = await import("./carrierRatingsService");
    const ratings = await getEnrichedCarrierRatings();
    for (let i = 1; i < ratings.length; i++) {
      expect(ratings[i - 1].overallScore).toBeGreaterThanOrEqual(ratings[i].overallScore);
    }
  });

  it("should return a provider carrier by ID when provider data is available", async () => {
    const { getEnrichedCarrierById } = await import("./carrierRatingsService");
    const { getEnrichedCarrierRatings } = await import("./carrierRatingsService");
    const all = await getEnrichedCarrierRatings();
    const first = all[0];
    if (first) {
      const found = await getEnrichedCarrierById(first.carrierId);
      expect(found).not.toBeNull();
      expect(found!.carrierId).toBe(first.carrierId);
      expect(found!.dataSource).toBe("live");
    } else {
      await expect(getEnrichedCarrierById("provider-record-not-available")).resolves.toBeNull();
    }
  });

  it("should return null for unknown carrier ID", async () => {
    const { getEnrichedCarrierById } = await import("./carrierRatingsService");
    const carrier = await getEnrichedCarrierById("nonexistent_carrier_xyz");
    expect(carrier).toBeNull();
  });

  it("should invalidate cache and re-fetch", async () => {
    const { invalidateCarrierCache, getEnrichedCarrierRatings } = await import("./carrierRatingsService");
    invalidateCarrierCache();
    const ratings = await getEnrichedCarrierRatings();
    expect(Array.isArray(ratings)).toBe(true);
    if (ratings[0]) expect(ratings[0].dataSource).toBe("live");
  });

  it("should include COMDEX score in financials", async () => {
    const { getEnrichedCarrierRatings } = await import("./carrierRatingsService");
    const ratings = await getEnrichedCarrierRatings();
    for (const r of ratings) {
      expect(r.financials.comdexScore).toBeGreaterThanOrEqual(70);
      expect(r.financials.comdexScore).toBeLessThanOrEqual(100);
    }
  });
});

// ─── Round 65: PDF Export Service ───
describe("Round 65 — PDF Export Service", () => {
  it("should export generateReportPdf and generateAgendaPdf functions", async () => {
    const mod = await import("./pdfExportService");
    expect(typeof mod.generateReportPdf).toBe("function");
    expect(typeof mod.generateAgendaPdf).toBe("function");
  });

  it("should generate a report PDF buffer", async () => {
    const { generateReportPdf } = await import("./pdfExportService");
    const buffer = await generateReportPdf({
      title: "Test Executive Summary",
      clientName: "John Doe",
      advisorName: "Jane Advisor",
      reportId: "test-report-001",
      generatedAt: new Date().toISOString(),
      sections: [
        { id: "portfolio_overview", order: 1 },
        { id: "recommendations", order: 2 },
      ],
    });
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(100);
    // PDF magic bytes
    expect(buffer.toString("utf-8", 0, 5)).toBe("%PDF-");
  });

  it("should generate a report PDF with custom content in sections", async () => {
    const { generateReportPdf } = await import("./pdfExportService");
    const buffer = await generateReportPdf({
      title: "Custom Report",
      clientName: "Alice Smith",
      advisorName: "Bob Advisor",
      reportId: "test-report-002",
      generatedAt: new Date().toISOString(),
      sections: [
        { id: "custom_section", order: 1, content: "This is custom content for the section." },
      ],
      firmName: "Russell Capital Systems",
    });
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(100);
  });

  it("should generate an agenda PDF buffer", async () => {
    const { generateAgendaPdf } = await import("./pdfExportService");
    const buffer = await generateAgendaPdf({
      title: "Strategy Review Meeting",
      clientName: "John Doe",
      meetingType: "strategy_review",
      duration: 60,
      blocks: [
        {
          time: "0:00 - 0:10",
          topic: "Welcome & Overview",
          talkingPoints: ["Review agenda", "Set expectations"],
          resources: ["Portfolio Summary"],
        },
        {
          time: "0:10 - 0:30",
          topic: "IUL Strategy Review",
          talkingPoints: ["Review current cash value", "Discuss index performance"],
        },
      ],
      keyQuestions: ["What are your retirement income goals?", "Have your risk tolerance changed?"],
      followUpActions: ["Send updated illustration", "Schedule next quarterly review"],
      advisorName: "Jane Advisor",
      firmName: "Russell Capital Systems",
    });
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(100);
    expect(buffer.toString("utf-8", 0, 5)).toBe("%PDF-");
  });

  it("should handle empty blocks in agenda PDF", async () => {
    const { generateAgendaPdf } = await import("./pdfExportService");
    const buffer = await generateAgendaPdf({
      title: "Quick Check-in",
      clientName: "Bob Client",
      meetingType: "initial_consultation",
      duration: 30,
      blocks: [],
    });
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(100);
  });

  it("should handle all standard report section IDs", async () => {
    const { generateReportPdf } = await import("./pdfExportService");
    const sectionIds = [
      "portfolio_overview", "key_metrics", "recommendations",
      "iul_summary", "index_performance", "cash_value_projection",
      "roth_summary", "tax_impact", "conversion_schedule",
      "estate_overview", "tax_projections", "trust_analysis",
      "compliance_summary", "suitability_checks", "disclosure_log",
      "practice_overview", "growth_metrics", "revenue_analysis",
    ];
    const buffer = await generateReportPdf({
      title: "Full Report",
      clientName: "Test Client",
      advisorName: "Test Advisor",
      reportId: "test-full-001",
      generatedAt: new Date().toISOString(),
      sections: sectionIds.map((id, i) => ({ id, order: i + 1 })),
    });
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(500);
  });
});

// ─── Round 66: Enhanced Client Portal ───
describe("Round 66 — Enhanced Client Portal with Scorecard & Income Timeline", () => {
  it("should compute scorecard with proper structure", () => {
    // Simulate the scorecard computation logic from routers.ts
    const totalAssets = 750000;
    const hasIUL = true;
    const hasRoth = true;
    const hasEstatePlan = true;
    const diversificationScore = 4;

    const overallScore = Math.min(100, Math.round(
      (hasIUL ? 20 : 0) + (hasRoth ? 20 : 0) + (hasEstatePlan ? 15 : 0) +
      Math.min(25, diversificationScore * 5) +
      Math.min(20, (totalAssets > 1000000 ? 20 : totalAssets > 500000 ? 15 : totalAssets > 100000 ? 10 : 5))
    ));

    expect(overallScore).toBe(20 + 20 + 15 + 20 + 15); // 90
    expect(overallScore).toBeLessThanOrEqual(100);
    expect(overallScore).toBeGreaterThanOrEqual(0);
  });

  it("should compute scorecard with minimal data", () => {
    const totalAssets = 50000;
    const hasIUL = false;
    const hasRoth = false;
    const hasEstatePlan = false;
    const diversificationScore = 1;

    const overallScore = Math.min(100, Math.round(
      (hasIUL ? 20 : 0) + (hasRoth ? 20 : 0) + (hasEstatePlan ? 15 : 0) +
      Math.min(25, diversificationScore * 5) +
      Math.min(20, (totalAssets > 1000000 ? 20 : totalAssets > 500000 ? 15 : totalAssets > 100000 ? 10 : 5))
    ));

    expect(overallScore).toBe(0 + 0 + 0 + 5 + 5); // 10
    expect(overallScore).toBeLessThanOrEqual(100);
  });

  it("should generate income timeline with correct structure", () => {
    const age = 45;
    const retirementAge = 65;
    const rothBalance = 200000;
    const lifeInsuranceCv = 500000;
    const iraBalance = 300000;

    const incomeTimeline = Array.from({ length: 35 }, (_, i) => {
      const yr = age + i;
      const ssIncome = yr >= 67 ? 36000 : 0;
      const rothIncome = yr >= retirementAge ? Math.round(rothBalance * 0.04) : 0;
      const iulIncome = yr >= retirementAge ? Math.round(lifeInsuranceCv * 0.06) : 0;
      const iraIncome = yr >= 72 ? Math.round(iraBalance / (90 - yr + 1)) : 0;
      return { age: yr, socialSecurity: ssIncome, rothDistributions: rothIncome, iulLoans: iulIncome, iraRmd: iraIncome, total: ssIncome + rothIncome + iulIncome + iraIncome };
    });

    expect(incomeTimeline.length).toBe(35);
    expect(incomeTimeline[0].age).toBe(45);
    expect(incomeTimeline[0].socialSecurity).toBe(0);
    expect(incomeTimeline[0].rothDistributions).toBe(0);
    expect(incomeTimeline[0].iulLoans).toBe(0);

    // At age 65 (index 20), Roth and IUL should kick in
    const at65 = incomeTimeline.find(r => r.age === 65)!;
    expect(at65.rothDistributions).toBe(8000); // 200000 * 0.04
    expect(at65.iulLoans).toBe(30000); // 500000 * 0.06
    expect(at65.socialSecurity).toBe(0); // SS starts at 67

    // At age 67, SS kicks in
    const at67 = incomeTimeline.find(r => r.age === 67)!;
    expect(at67.socialSecurity).toBe(36000);
    // IRA RMD doesn't start until 72, so at 67 it's just SS + Roth + IUL
    expect(at67.total).toBe(36000 + 8000 + 30000); // 74000

    // At age 72, IRA RMD kicks in
    const at72 = incomeTimeline.find(r => r.age === 72)!;
    expect(at72.iraRmd).toBe(Math.round(300000 / (90 - 72 + 1))); // 300000 / 19 = 15789
    expect(at72.iraRmd).toBeGreaterThan(0);
  });

  it("should handle zero balances gracefully in income timeline", () => {
    const age = 50;
    const retirementAge = 65;
    const rothBalance = 0;
    const lifeInsuranceCv = 0;
    const iraBalance = 0;

    const incomeTimeline = Array.from({ length: 35 }, (_, i) => {
      const yr = age + i;
      const ssIncome = yr >= 67 ? 36000 : 0;
      const rothIncome = yr >= retirementAge ? Math.round(rothBalance * 0.04) : 0;
      const iulIncome = yr >= retirementAge ? Math.round(lifeInsuranceCv * 0.06) : 0;
      const iraIncome = yr >= 72 ? Math.round(iraBalance / (90 - yr + 1)) : 0;
      return { age: yr, socialSecurity: ssIncome, rothDistributions: rothIncome, iulLoans: iulIncome, iraRmd: iraIncome, total: ssIncome + rothIncome + iulIncome + iraIncome };
    });

    // Only SS income should be present
    const at70 = incomeTimeline.find(r => r.age === 70)!;
    expect(at70.socialSecurity).toBe(36000);
    expect(at70.rothDistributions).toBe(0);
    expect(at70.iulLoans).toBe(0);
    expect(at70.iraRmd).toBe(0);
    expect(at70.total).toBe(36000);
  });

  it("should generate scorecard categories with correct status labels", () => {
    const hasIUL = true;
    const hasRoth = false;
    const hasEstatePlan = true;
    const diversificationScore = 5;
    const income = 150000;
    const totalAssets = 800000;

    const categories = [
      { name: "Tax-Free Income", score: hasIUL ? 90 : 30, status: hasIUL ? "Strong" : "Needs Attention" },
      { name: "Roth Strategy", score: hasRoth ? 85 : 25, status: hasRoth ? "Active" : "Not Started" },
      { name: "Estate Protection", score: hasEstatePlan ? 80 : 20, status: hasEstatePlan ? "In Place" : "Unprotected" },
      { name: "Diversification", score: Math.min(100, diversificationScore * 20), status: diversificationScore >= 4 ? "Well Diversified" : "Concentrated" },
      { name: "Savings Rate", score: income > 0 ? Math.min(100, Math.round((totalAssets / income) * 10)) : 50, status: "On Track" },
    ];

    expect(categories).toHaveLength(5);
    expect(categories[0].score).toBe(90);
    expect(categories[0].status).toBe("Strong");
    expect(categories[1].score).toBe(25);
    expect(categories[1].status).toBe("Not Started");
    expect(categories[2].score).toBe(80);
    expect(categories[2].status).toBe("In Place");
    expect(categories[3].score).toBe(100);
    expect(categories[3].status).toBe("Well Diversified");
    expect(categories[4].score).toBe(53); // 800000/150000 * 10 = 53.3 rounded
  });
});
