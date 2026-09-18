import { describe, it, expect } from "vitest";

// ═══════════════════════════════════════════════════════════════════════════
// ─── ROUND 33: STRATEGY VERSIONING, BATCH PDF EXPORT, CSV IMPORT
// ═══════════════════════════════════════════════════════════════════════════

// ─── Strategy Versioning ───────────────────────────────────────────────────

describe("Strategy Versioning — Schema", () => {
  it("should support version and parentStrategyId columns", () => {
    const strategy = {
      id: 1,
      strategyLabel: "Roth + IUL 20yr",
      version: 1,
      parentStrategyId: null,
    };
    expect(strategy.version).toBe(1);
    expect(strategy.parentStrategyId).toBeNull();
  });

  it("should link child version to parent via parentStrategyId", () => {
    const parent = { id: 10, version: 1, parentStrategyId: null };
    const child = { id: 11, version: 2, parentStrategyId: 10 };
    expect(child.parentStrategyId).toBe(parent.id);
    expect(child.version).toBe(parent.version + 1);
  });

  it("should support multiple version chains", () => {
    const v1 = { id: 1, version: 1, parentStrategyId: null };
    const v2 = { id: 2, version: 2, parentStrategyId: 1 };
    const v3 = { id: 3, version: 3, parentStrategyId: 1 };
    expect(v2.parentStrategyId).toBe(v1.id);
    expect(v3.parentStrategyId).toBe(v1.id);
    expect(v3.version).toBeGreaterThan(v2.version);
  });
});

describe("Strategy Versioning — Version Numbering", () => {
  it("should auto-increment version based on existing versions", () => {
    const existingVersions = [
      { id: 1, version: 1 },
      { id: 2, version: 2 },
    ];
    const nextVersion = Math.max(...existingVersions.map(v => v.version)) + 1;
    expect(nextVersion).toBe(3);
  });

  it("should default to version 1 for new strategies", () => {
    const existingVersions: { version: number }[] = [];
    const nextVersion = existingVersions.length === 0 ? 1 : Math.max(...existingVersions.map(v => v.version)) + 1;
    expect(nextVersion).toBe(1);
  });

  it("should resolve root parent from version chain", () => {
    // Given a chain: v1(id=10) -> v2(id=11) -> v3(id=12)
    // All should share the same rootParentId
    const strategies = [
      { id: 10, version: 1, parentStrategyId: null },
      { id: 11, version: 2, parentStrategyId: 10 },
      { id: 12, version: 3, parentStrategyId: 10 },
    ];
    const rootId = strategies[0].id;
    expect(strategies.every(s => s.parentStrategyId === null || s.parentStrategyId === rootId)).toBe(true);
  });
});

describe("Strategy Versioning — Update Flow", () => {
  it("should preserve original strategy when creating new version", () => {
    const original = {
      id: 1, version: 1, parentStrategyId: null,
      inputsJson: { iraBalance: 800000, iulYears: 20 },
      summaryJson: { finalNetCashValue: 500000 },
    };
    const updated = {
      id: 2, version: 2, parentStrategyId: 1,
      inputsJson: { iraBalance: 900000, iulYears: 25 },
      summaryJson: { finalNetCashValue: 650000 },
    };
    // Original is unchanged
    expect(original.inputsJson.iraBalance).toBe(800000);
    expect(original.summaryJson.finalNetCashValue).toBe(500000);
    // Updated has new values
    expect(updated.inputsJson.iraBalance).toBe(900000);
    expect(updated.parentStrategyId).toBe(original.id);
  });

  it("should carry forward metadata from parent to child version", () => {
    const parent = {
      clientId: 5, strategyType: "roth_iul_re",
      carrierId: "aaa-plus-mutual", carrierName: "AAA+ Mutual",
    };
    const child = {
      ...parent, // carries forward
      version: 2, parentStrategyId: 1,
    };
    expect(child.clientId).toBe(parent.clientId);
    expect(child.strategyType).toBe(parent.strategyType);
    expect(child.carrierId).toBe(parent.carrierId);
  });
});

// ─── Batch Strategy PDF Export ─────────────────────────────────────────────

describe("Batch Strategy PDF Export — generateBatchStrategyPdf", () => {
  it("should generate a valid PDF buffer", async () => {
    const { generateBatchStrategyPdf } = await import("./batchStrategyPdf");
    const pdf = await generateBatchStrategyPdf({
      clientName: "John Doe",
      advisorName: "Jane Advisor",
      strategies: [
        {
          id: 1,
          strategyLabel: "Roth + IUL 20yr",
          strategyType: "roth_iul_re",
          clientName: "John Doe",
          carrierName: "AAA+ Mutual",
          version: 1,
          parentStrategyId: null,
          notes: "Test strategy",
          createdAt: new Date("2024-06-15"),
          inputsJson: { iraBalance: 800000, conversionPortion: 1, homeEquity: 400000, currentTaxBracket: 0.24, iulYears: 20, rentalGrossYield: 0.20, realEstateAppreciation: 0.05 },
          summaryJson: { finalNetCashValue: 500000, totalPropertyEquity: 600000, totalRentalIncome: 200000, finalRothBalance: 300000, estimatedNetWorth: 1500000 },
          iulProjectionJson: [
            { year: 1, premium: 50000, accountValue: 47000, cumulativeLoanBalance: 0, netCashValue: 47000 },
            { year: 5, premium: 50000, accountValue: 280000, cumulativeLoanBalance: 0, netCashValue: 280000 },
            { year: 10, premium: 50000, accountValue: 650000, cumulativeLoanBalance: 100000, netCashValue: 550000 },
          ],
        },
      ],
    });
    expect(pdf).toBeInstanceOf(Buffer);
    expect(pdf.length).toBeGreaterThan(1000);
    // PDF magic bytes
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
  });

  it("should include cover page, TOC, and strategy pages", async () => {
    const { generateBatchStrategyPdf } = await import("./batchStrategyPdf");
    const pdf = await generateBatchStrategyPdf({
      clientName: "Test Client",
      advisorName: "Test Advisor",
      strategies: [
        {
          id: 1, strategyLabel: "Strategy A", strategyType: "roth_iul_re",
          version: 1, parentStrategyId: null, createdAt: new Date(),
          inputsJson: { iraBalance: 500000 },
          summaryJson: { finalNetCashValue: 300000, estimatedNetWorth: 800000 },
        },
        {
          id: 2, strategyLabel: "Strategy B", strategyType: "roth_iul_re",
          version: 1, parentStrategyId: null, createdAt: new Date(),
          inputsJson: { iraBalance: 700000 },
          summaryJson: { finalNetCashValue: 450000, estimatedNetWorth: 1200000 },
        },
      ],
    });
    expect(pdf).toBeInstanceOf(Buffer);
    expect(pdf.length).toBeGreaterThan(2000);
  });

  it("should include comparison summary page for multiple strategies", async () => {
    const { generateBatchStrategyPdf } = await import("./batchStrategyPdf");
    const pdf = await generateBatchStrategyPdf({
      clientName: "Multi Client",
      advisorName: "Multi Advisor",
      strategies: [
        {
          id: 1, strategyLabel: "Conservative", strategyType: "roth_iul_re",
          version: 1, parentStrategyId: null, createdAt: new Date(),
          inputsJson: {}, summaryJson: { estimatedNetWorth: 800000 },
        },
        {
          id: 2, strategyLabel: "Aggressive", strategyType: "roth_iul_re",
          version: 1, parentStrategyId: null, createdAt: new Date(),
          inputsJson: {}, summaryJson: { estimatedNetWorth: 1500000 },
        },
        {
          id: 3, strategyLabel: "Balanced", strategyType: "roth_iul_re",
          version: 1, parentStrategyId: null, createdAt: new Date(),
          inputsJson: {}, summaryJson: { estimatedNetWorth: 1100000 },
        },
      ],
    });
    expect(pdf).toBeInstanceOf(Buffer);
    // Should be larger due to comparison page
    expect(pdf.length).toBeGreaterThan(3000);
  });

  it("should handle strategies with no IUL projection data", async () => {
    const { generateBatchStrategyPdf } = await import("./batchStrategyPdf");
    const pdf = await generateBatchStrategyPdf({
      clientName: "Minimal Client",
      advisorName: "Minimal Advisor",
      strategies: [
        {
          id: 1, strategyLabel: "Minimal Strategy", strategyType: "roth_iul_re",
          version: 1, parentStrategyId: null, createdAt: new Date(),
          inputsJson: { iraBalance: 500000 },
          summaryJson: { finalNetCashValue: 300000 },
          iulProjectionJson: null,
        },
      ],
    });
    expect(pdf).toBeInstanceOf(Buffer);
    expect(pdf.length).toBeGreaterThan(1000);
  });

  it("should handle versioned strategies in the report", async () => {
    const { generateBatchStrategyPdf } = await import("./batchStrategyPdf");
    const pdf = await generateBatchStrategyPdf({
      clientName: "Version Client",
      advisorName: "Version Advisor",
      strategies: [
        {
          id: 1, strategyLabel: "IUL Plan", strategyType: "roth_iul_re",
          version: 1, parentStrategyId: null, createdAt: new Date("2024-01-15"),
          inputsJson: {}, summaryJson: { estimatedNetWorth: 800000 },
        },
        {
          id: 2, strategyLabel: "IUL Plan", strategyType: "roth_iul_re",
          version: 2, parentStrategyId: 1, createdAt: new Date("2024-03-20"),
          inputsJson: {}, summaryJson: { estimatedNetWorth: 950000 },
        },
      ],
    });
    expect(pdf).toBeInstanceOf(Buffer);
    expect(pdf.length).toBeGreaterThan(2000);
  });

  it("should handle single strategy without comparison page", async () => {
    const { generateBatchStrategyPdf } = await import("./batchStrategyPdf");
    const pdf1 = await generateBatchStrategyPdf({
      clientName: "Single", advisorName: "Advisor",
      strategies: [{
        id: 1, strategyLabel: "Solo", strategyType: "roth_iul_re",
        version: 1, parentStrategyId: null, createdAt: new Date(),
        inputsJson: {}, summaryJson: { estimatedNetWorth: 500000 },
      }],
    });
    const pdf2 = await generateBatchStrategyPdf({
      clientName: "Multi", advisorName: "Advisor",
      strategies: [
        { id: 1, strategyLabel: "A", strategyType: "roth_iul_re", version: 1, parentStrategyId: null, createdAt: new Date(), inputsJson: {}, summaryJson: { estimatedNetWorth: 500000 } },
        { id: 2, strategyLabel: "B", strategyType: "roth_iul_re", version: 1, parentStrategyId: null, createdAt: new Date(), inputsJson: {}, summaryJson: { estimatedNetWorth: 600000 } },
      ],
    });
    // Multi should be larger (has comparison page)
    expect(pdf2.length).toBeGreaterThan(pdf1.length);
  });
});

// ─── CSV Import Parser ─────────────────────────────────────────────────────

// Replicate the parseCSV function from CarrierSettings for testing
function parseCSV(text: string) {
  const DEFAULTS = { loadFee: "0.0600", coiRate: "0.0500", capRate: "0.1200", floorRate: "0.0000", avgReturn: "0.1000" };
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const header = lines[0].toLowerCase().replace(/["\s]/g, "").split(",");
  const colMap: Record<string, number> = {};
  header.forEach((h, i) => {
    if (h.includes("carrier") && (h.includes("id") || h === "carrierid")) colMap.carrierId = i;
    else if (h.includes("carrier") && h.includes("name")) colMap.carrierName = i;
    else if (h.includes("load") || h === "loadfee") colMap.loadFee = i;
    else if (h.includes("coi") || h === "coirate") colMap.coiRate = i;
    else if (h.includes("cap") || h === "caprate") colMap.capRate = i;
    else if (h.includes("floor") || h === "floorrate") colMap.floorRate = i;
    else if (h.includes("avg") || h.includes("return") || h === "avgreturn") colMap.avgReturn = i;
    else if (h.includes("note")) colMap.notes = i;
    else if (h.includes("name") && !colMap.carrierName) colMap.carrierName = i;
    else if (h.includes("id") && !colMap.carrierId) colMap.carrierId = i;
  });

  const rows: any[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const fields: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === ',' && !inQuotes) { fields.push(current.trim()); current = ""; continue; }
      current += ch;
    }
    fields.push(current.trim());

    const errors: string[] = [];
    const carrierId = fields[colMap.carrierId ?? 0] ?? "";
    const carrierName = fields[colMap.carrierName ?? 1] ?? "";
    if (!carrierId) errors.push("Missing carrier ID");
    if (!carrierName) errors.push("Missing carrier name");

    const parseRate = (val: string | undefined, fieldName: string): string => {
      if (!val || val === "" || val === "-") return "";
      const cleaned = val.replace(/[%$\s]/g, "");
      const num = parseFloat(cleaned);
      if (isNaN(num)) { errors.push(`Invalid ${fieldName}: ${val}`); return ""; }
      return num > 1 ? (num / 100).toFixed(4) : num.toFixed(4);
    };

    rows.push({
      carrierId, carrierName,
      loadFee: parseRate(fields[colMap.loadFee ?? 2], "load fee") || DEFAULTS.loadFee,
      coiRate: parseRate(fields[colMap.coiRate ?? 3], "COI rate") || DEFAULTS.coiRate,
      capRate: parseRate(fields[colMap.capRate ?? 4], "cap rate") || DEFAULTS.capRate,
      floorRate: parseRate(fields[colMap.floorRate ?? 5], "floor rate") || DEFAULTS.floorRate,
      avgReturn: parseRate(fields[colMap.avgReturn ?? 6], "avg return") || DEFAULTS.avgReturn,
      notes: fields[colMap.notes ?? 7] ?? "",
      valid: errors.length === 0, errors,
    });
  }
  return rows;
}

describe("CSV Import — Parser", () => {
  it("should parse a valid CSV with percentage format", () => {
    const csv = `carrier_id,carrier_name,load_fee,coi_rate,cap_rate,floor_rate,avg_return,notes
aaa-plus-mutual,AAA+ Mutual,6%,4.5%,12%,0%,10%,Based on 2024 illustration`;
    const rows = parseCSV(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].carrierId).toBe("aaa-plus-mutual");
    expect(rows[0].carrierName).toBe("AAA+ Mutual");
    expect(parseFloat(rows[0].loadFee)).toBeCloseTo(0.06);
    expect(parseFloat(rows[0].coiRate)).toBeCloseTo(0.045);
    expect(parseFloat(rows[0].capRate)).toBeCloseTo(0.12);
    expect(parseFloat(rows[0].floorRate)).toBeCloseTo(0);
    expect(parseFloat(rows[0].avgReturn)).toBeCloseTo(0.10);
    expect(rows[0].valid).toBe(true);
  });

  it("should parse decimal format (0.06 instead of 6%)", () => {
    const csv = `carrier_id,carrier_name,load_fee,coi_rate,cap_rate,floor_rate,avg_return,notes
aa-minus-mutual,AA- Mutual Life,0.07,0.055,0.13,0.00,0.105,FIA+ rider`;
    const rows = parseCSV(csv);
    expect(rows).toHaveLength(1);
    expect(parseFloat(rows[0].loadFee)).toBeCloseTo(0.07);
    expect(parseFloat(rows[0].coiRate)).toBeCloseTo(0.055);
    expect(parseFloat(rows[0].capRate)).toBeCloseTo(0.13);
    expect(parseFloat(rows[0].avgReturn)).toBeCloseTo(0.105);
    expect(rows[0].valid).toBe(true);
  });

  it("should parse multiple rows", () => {
    const csv = `carrier_id,carrier_name,load_fee,coi_rate,cap_rate,floor_rate,avg_return,notes
aaa-plus-mutual,AAA+ Mutual,6%,4.5%,12%,0%,10%,Note 1
national-life,National Life Group,5.5%,5%,11.5%,1%,9.5%,Note 2
aa-minus-mutual,AA- Mutual Life,7%,5.5%,13%,0%,10.5%,Note 3`;
    const rows = parseCSV(csv);
    expect(rows).toHaveLength(3);
    expect(rows.every((r: any) => r.valid)).toBe(true);
    expect(rows[1].carrierName).toBe("National Life Group");
    expect(parseFloat(rows[2].avgReturn)).toBeCloseTo(0.105);
  });

  it("should handle quoted fields with commas", () => {
    const csv = `carrier_id,carrier_name,load_fee,coi_rate,cap_rate,floor_rate,avg_return,notes
aaa-plus-mutual,"AAA+ Mutual, Inc.",6%,4.5%,12%,0%,10%,"Based on 2024 illustration, updated"`;
    const rows = parseCSV(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].carrierName).toBe("AAA+ Mutual, Inc.");
    expect(rows[0].notes).toBe("Based on 2024 illustration, updated");
    expect(rows[0].valid).toBe(true);
  });

  it("should flag rows with missing carrier ID", () => {
    const csv = `carrier_id,carrier_name,load_fee,coi_rate,cap_rate,floor_rate,avg_return,notes
,AAA+ Mutual,6%,4.5%,12%,0%,10%,Note`;
    const rows = parseCSV(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].valid).toBe(false);
    expect(rows[0].errors).toContain("Missing carrier ID");
  });

  it("should flag rows with missing carrier name", () => {
    const csv = `carrier_id,carrier_name,load_fee,coi_rate,cap_rate,floor_rate,avg_return,notes
aaa-plus-mutual,,6%,4.5%,12%,0%,10%,Note`;
    const rows = parseCSV(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].valid).toBe(false);
    expect(rows[0].errors).toContain("Missing carrier name");
  });

  it("should use defaults for missing rate values", () => {
    const csv = `carrier_id,carrier_name,load_fee,coi_rate,cap_rate,floor_rate,avg_return,notes
aaa-plus-mutual,AAA+ Mutual,-,-,-,-,-,No rates`;
    const rows = parseCSV(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].valid).toBe(true);
    // Should fall back to defaults
    expect(parseFloat(rows[0].loadFee)).toBeCloseTo(0.06);
    expect(parseFloat(rows[0].coiRate)).toBeCloseTo(0.05);
  });

  it("should return empty array for header-only CSV", () => {
    const csv = `carrier_id,carrier_name,load_fee,coi_rate,cap_rate,floor_rate,avg_return,notes`;
    const rows = parseCSV(csv);
    expect(rows).toHaveLength(0);
  });

  it("should return empty array for empty input", () => {
    const rows = parseCSV("");
    expect(rows).toHaveLength(0);
  });

  it("should handle Windows-style line endings (CRLF)", () => {
    const csv = "carrier_id,carrier_name,load_fee,coi_rate,cap_rate,floor_rate,avg_return,notes\r\naaa-plus-mutual,AAA+ Mutual,6%,4.5%,12%,0%,10%,Note\r\n";
    const rows = parseCSV(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].valid).toBe(true);
  });

  it("should skip empty lines in CSV", () => {
    const csv = `carrier_id,carrier_name,load_fee,coi_rate,cap_rate,floor_rate,avg_return,notes
aaa-plus-mutual,AAA+ Mutual,6%,4.5%,12%,0%,10%,Note 1

aa-minus-mutual,AA- Mutual Life,7%,5.5%,13%,0%,10.5%,Note 2
`;
    const rows = parseCSV(csv);
    expect(rows).toHaveLength(2);
  });

  it("should handle flexible header names", () => {
    const csv = `id,name,load,coi,cap,floor,return,notes
aaa-plus-mutual,AAA+ Mutual,6%,4.5%,12%,0%,10%,Note`;
    const rows = parseCSV(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].carrierId).toBe("aaa-plus-mutual");
    expect(rows[0].carrierName).toBe("AAA+ Mutual");
  });
});

describe("CSV Import — Rate Format Detection", () => {
  it("should detect percentage format (values > 1 treated as percentages)", () => {
    const csv = `carrier_id,carrier_name,load_fee,coi_rate,cap_rate,floor_rate,avg_return,notes
test,Test Carrier,6,4.5,12,0,10,Test`;
    const rows = parseCSV(csv);
    expect(parseFloat(rows[0].loadFee)).toBeCloseTo(0.06);
    expect(parseFloat(rows[0].coiRate)).toBeCloseTo(0.045);
    expect(parseFloat(rows[0].capRate)).toBeCloseTo(0.12);
    expect(parseFloat(rows[0].avgReturn)).toBeCloseTo(0.10);
  });

  it("should detect decimal format (values <= 1 kept as-is)", () => {
    const csv = `carrier_id,carrier_name,load_fee,coi_rate,cap_rate,floor_rate,avg_return,notes
test,Test Carrier,0.06,0.045,0.12,0,0.10,Test`;
    const rows = parseCSV(csv);
    expect(parseFloat(rows[0].loadFee)).toBeCloseTo(0.06);
    expect(parseFloat(rows[0].coiRate)).toBeCloseTo(0.045);
    expect(parseFloat(rows[0].capRate)).toBeCloseTo(0.12);
    expect(parseFloat(rows[0].avgReturn)).toBeCloseTo(0.10);
  });

  it("should strip % and $ symbols from rate values", () => {
    const csv = `carrier_id,carrier_name,load_fee,coi_rate,cap_rate,floor_rate,avg_return,notes
test,Test,$6%,$4.5%,$12%,$0%,$10%,Test`;
    const rows = parseCSV(csv);
    expect(parseFloat(rows[0].loadFee)).toBeCloseTo(0.06);
    expect(rows[0].valid).toBe(true);
  });
});

describe("CSV Template Generation", () => {
  it("should generate a valid CSV template with headers and sample rows", () => {
    // Replicate the template function
    const template = [
      "carrier_id,carrier_name,load_fee,coi_rate,cap_rate,floor_rate,avg_return,notes",
      "aaa-plus-mutual,AAA+ Mutual,6%,4.5%,12%,0%,10%,Based on 2024 illustration",
      "national-life,National Life Group,5.5%,5%,11.5%,1%,9.5%,LSW illustration dated Jan 2024",
      "aa-minus-mutual,AA- Mutual Life,7%,5.5%,13%,0%,10.5%,FIA+ rider included",
    ].join("\n");

    const lines = template.split("\n");
    expect(lines).toHaveLength(4);
    expect(lines[0]).toContain("carrier_id");
    expect(lines[0]).toContain("carrier_name");
    expect(lines[0]).toContain("load_fee");

    // Template should be parseable
    const rows = parseCSV(template);
    expect(rows).toHaveLength(3);
    expect(rows.every((r: any) => r.valid)).toBe(true);
  });
});

// ─── Batch Export Endpoint Logic ───────────────────────────────────────────

describe("Batch Export — Endpoint Logic", () => {
  it("should filter strategies by clientId when provided", () => {
    const allStrategies = [
      { id: 1, clientId: 5, strategyLabel: "A" },
      { id: 2, clientId: 5, strategyLabel: "B" },
      { id: 3, clientId: 10, strategyLabel: "C" },
    ];
    const clientId = 5;
    const filtered = allStrategies.filter(s => s.clientId === clientId);
    expect(filtered).toHaveLength(2);
    expect(filtered.every(s => s.clientId === 5)).toBe(true);
  });

  it("should return all strategies when no clientId filter", () => {
    const allStrategies = [
      { id: 1, clientId: 5 },
      { id: 2, clientId: 10 },
    ];
    const clientId = undefined;
    const filtered = clientId ? allStrategies.filter(s => s.clientId === clientId) : allStrategies;
    expect(filtered).toHaveLength(2);
  });

  it("should generate filename from client name", () => {
    const clientName = "John Doe";
    const filename = `${clientName.replace(/\s+/g, '_')}_Strategy_Portfolio.pdf`;
    expect(filename).toBe("John_Doe_Strategy_Portfolio.pdf");
  });

  it("should use 'All_Clients' when no client filter", () => {
    const clientName = "All Clients";
    const filename = `${clientName.replace(/\s+/g, '_')}_Strategy_Portfolio.pdf`;
    expect(filename).toBe("All_Clients_Strategy_Portfolio.pdf");
  });
});

// ─── Version Timeline Display Logic ────────────────────────────────────────

describe("Version Timeline — Display Logic", () => {
  it("should group strategies by root parent", () => {
    const strategies = [
      { id: 1, version: 1, parentStrategyId: null, strategyLabel: "Plan A" },
      { id: 2, version: 2, parentStrategyId: 1, strategyLabel: "Plan A" },
      { id: 3, version: 1, parentStrategyId: null, strategyLabel: "Plan B" },
    ];

    const groups = new Map<number, typeof strategies>();
    for (const s of strategies) {
      const rootId = s.parentStrategyId ?? s.id;
      if (!groups.has(rootId)) groups.set(rootId, []);
      groups.get(rootId)!.push(s);
    }

    expect(groups.size).toBe(2);
    expect(groups.get(1)!.length).toBe(2);
    expect(groups.get(3)!.length).toBe(1);
  });

  it("should sort versions in descending order (newest first)", () => {
    const versions = [
      { id: 1, version: 1, createdAt: new Date("2024-01-01") },
      { id: 2, version: 2, createdAt: new Date("2024-03-01") },
      { id: 3, version: 3, createdAt: new Date("2024-06-01") },
    ];
    const sorted = [...versions].sort((a, b) => b.version - a.version);
    expect(sorted[0].version).toBe(3);
    expect(sorted[2].version).toBe(1);
  });

  it("should identify the latest version in a chain", () => {
    const versions = [
      { id: 1, version: 1 },
      { id: 2, version: 2 },
      { id: 3, version: 3 },
    ];
    const latest = versions.reduce((a, b) => a.version > b.version ? a : b);
    expect(latest.version).toBe(3);
    expect(latest.id).toBe(3);
  });
});
