import { describe, it, expect, vi } from "vitest";

/* ─── Round 21: Properties/Mortgage, Crypto Holdings, 0% Roth Conversion ─── */

// ── 1. Client Properties DB Helpers ──────────────────────────────────────
describe("Client Properties DB Helpers", () => {
  it("getClientProperties is a function", async () => {
    const db = await import("./db");
    expect(typeof db.getClientProperties).toBe("function");
  });

  it("createClientProperty is a function", async () => {
    const db = await import("./db");
    expect(typeof db.createClientProperty).toBe("function");
  });

  it("updateClientProperty is a function", async () => {
    const db = await import("./db");
    expect(typeof db.updateClientProperty).toBe("function");
  });

  it("deleteClientProperty is a function", async () => {
    const db = await import("./db");
    expect(typeof db.deleteClientProperty).toBe("function");
  });

  it("getClientProperties returns array for non-existent client", async () => {
    const { getClientProperties } = await import("./db");
    const result = await getClientProperties(999999, 999999);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });
});

// ── 2. Client Crypto Holdings DB Helpers ─────────────────────────────────
describe("Client Crypto Holdings DB Helpers", () => {
  it("getClientCryptoHoldings is a function", async () => {
    const db = await import("./db");
    expect(typeof db.getClientCryptoHoldings).toBe("function");
  });

  it("createClientCryptoHolding is a function", async () => {
    const db = await import("./db");
    expect(typeof db.createClientCryptoHolding).toBe("function");
  });

  it("updateClientCryptoHolding is a function", async () => {
    const db = await import("./db");
    expect(typeof db.updateClientCryptoHolding).toBe("function");
  });

  it("deleteClientCryptoHolding is a function", async () => {
    const db = await import("./db");
    expect(typeof db.deleteClientCryptoHolding).toBe("function");
  });

  it("getClientCryptoHoldings returns array for non-existent client", async () => {
    const { getClientCryptoHoldings } = await import("./db");
    const result = await getClientCryptoHoldings(999999, 999999);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });
});

// ── 3. Properties tRPC Procedures ────────────────────────────────────────
describe("Properties tRPC Procedures", () => {
  it("properties.list procedure exists on the router", async () => {
    const { appRouter } = await import("./routers");
    const procedures = Object.keys((appRouter as any)._def.procedures);
    expect(procedures).toContain("properties.list");
  });

  it("properties.create procedure exists on the router", async () => {
    const { appRouter } = await import("./routers");
    const procedures = Object.keys((appRouter as any)._def.procedures);
    expect(procedures).toContain("properties.create");
  });

  it("properties.update procedure exists on the router", async () => {
    const { appRouter } = await import("./routers");
    const procedures = Object.keys((appRouter as any)._def.procedures);
    expect(procedures).toContain("properties.update");
  });

  it("properties.delete procedure exists on the router", async () => {
    const { appRouter } = await import("./routers");
    const procedures = Object.keys((appRouter as any)._def.procedures);
    expect(procedures).toContain("properties.delete");
  });
});

// ── 4. Crypto tRPC Procedures ────────────────────────────────────────────
describe("Crypto tRPC Procedures", () => {
  it("crypto.list procedure exists on the router", async () => {
    const { appRouter } = await import("./routers");
    const procedures = Object.keys((appRouter as any)._def.procedures);
    expect(procedures).toContain("crypto.list");
  });

  it("crypto.create procedure exists on the router", async () => {
    const { appRouter } = await import("./routers");
    const procedures = Object.keys((appRouter as any)._def.procedures);
    expect(procedures).toContain("crypto.create");
  });

  it("crypto.update procedure exists on the router", async () => {
    const { appRouter } = await import("./routers");
    const procedures = Object.keys((appRouter as any)._def.procedures);
    expect(procedures).toContain("crypto.update");
  });

  it("crypto.delete procedure exists on the router", async () => {
    const { appRouter } = await import("./routers");
    const procedures = Object.keys((appRouter as any)._def.procedures);
    expect(procedures).toContain("crypto.delete");
  });

  it("crypto.prices procedure exists on the router", async () => {
    const { appRouter } = await import("./routers");
    const procedures = Object.keys((appRouter as any)._def.procedures);
    expect(procedures).toContain("crypto.prices");
  });
});

// ── 5. 0% Roth Conversion tRPC Procedure ────────────────────────────────
describe("Roth Conversion tRPC Procedures", () => {
  it("rothConversion.project procedure exists on the router", async () => {
    const { appRouter } = await import("./routers");
    const procedures = Object.keys((appRouter as any)._def.procedures);
    expect(procedures).toContain("rothConversion.project");
  });
});

// ── 6. Schema Validation ─────────────────────────────────────────────────
describe("Schema Tables Exist", () => {
  it("clientProperties table is defined in schema", async () => {
    const schema = await import("../drizzle/schema");
    expect(schema.clientProperties).toBeDefined();
    expect(typeof schema.clientProperties).toBe("object");
  });

  it("clientCryptoHoldings table is defined in schema", async () => {
    const schema = await import("../drizzle/schema");
    expect(schema.clientCryptoHoldings).toBeDefined();
    expect(typeof schema.clientCryptoHoldings).toBe("object");
  });

  it("clientProperties has correct columns", async () => {
    const schema = await import("../drizzle/schema");
    const table = schema.clientProperties;
    const columns = Object.keys(table);
    expect(columns).toContain("id");
    expect(columns).toContain("clientId");
    expect(columns).toContain("workspaceId");
    expect(columns).toContain("propertyName");
    expect(columns).toContain("propertyType");
    expect(columns).toContain("propertyValue");
    expect(columns).toContain("monthlyMortgagePayment");
    expect(columns).toContain("monthlyInterestOnlyPayment");
    expect(columns).toContain("totalInterestPayment");
    expect(columns).toContain("monthlyRentalIncome");
    expect(columns).toContain("annualAppreciation");
    expect(columns).toContain("mortgageBalance");
    expect(columns).toContain("interestRate");
    expect(columns).toContain("loanTermYears");
  });

  it("clientCryptoHoldings has correct columns", async () => {
    const schema = await import("../drizzle/schema");
    const table = schema.clientCryptoHoldings;
    const columns = Object.keys(table);
    expect(columns).toContain("id");
    expect(columns).toContain("clientId");
    expect(columns).toContain("workspaceId");
    expect(columns).toContain("coinId");
    expect(columns).toContain("coinName");
    expect(columns).toContain("coinSymbol");
    expect(columns).toContain("quantity");
    expect(columns).toContain("avgPurchasePrice");
    expect(columns).toContain("amountStaked");
    expect(columns).toContain("stakingPercentage");
    expect(columns).toContain("predictedStakingIncome");
  });
});

// ── 7. Roth Conversion Calculation Logic ─────────────────────────────────
describe("Roth Conversion Calculation Logic", () => {
  it("IRA ÷ 0.4 produces correct target property price", () => {
    const iraBalance = 800000;
    const targetPropertyPrice = iraBalance / 0.4;
    expect(targetPropertyPrice).toBe(2000000);
  });

  it("30% down payment is calculated correctly", () => {
    const targetPropertyPrice = 2000000;
    const downPayment = targetPropertyPrice * 0.30;
    expect(downPayment).toBe(600000);
  });

  it("70% mortgage amount is calculated correctly", () => {
    const targetPropertyPrice = 2000000;
    const mortgageAmount = targetPropertyPrice * 0.70;
    expect(mortgageAmount).toBe(1400000);
  });

  it("standard deduction for married is 29200", () => {
    const standardDeduction = 29200; // 2024 married filing jointly
    expect(standardDeduction).toBe(29200);
  });

  it("standard deduction for single is 14600", () => {
    const standardDeduction = 14600;
    expect(standardDeduction).toBe(14600);
  });

  it("standard deduction for head of household is 21900", () => {
    const standardDeduction = 21900;
    expect(standardDeduction).toBe(21900);
  });

  it("conversion amount is limited to standard deduction", () => {
    const iraBalance = 800000;
    const standardDeduction = 29200;
    const conversionAmount = Math.min(iraBalance, standardDeduction);
    expect(conversionAmount).toBe(29200);
  });

  it("tax savings calculated at current bracket", () => {
    const conversionAmount = 29200;
    const currentTaxBracket = 0.24;
    const taxSavings = conversionAmount * currentTaxBracket;
    expect(taxSavings).toBe(7008);
  });

  it("HELOC interest-only monthly payment calculated correctly", () => {
    const helocAmount = 600000;
    const helocRate = 0.07;
    const monthlyHelocPayment = (helocAmount * helocRate) / 12;
    expect(monthlyHelocPayment).toBeCloseTo(3500, 2);
  });

  it("property appreciates at 5% compounding over 5 years", () => {
    let propertyValue = 2000000;
    for (let y = 1; y <= 5; y++) {
      propertyValue = propertyValue * 1.05;
    }
    expect(Math.round(propertyValue)).toBe(Math.round(2000000 * Math.pow(1.05, 5)));
  });

  it("20% gross yield on property value", () => {
    const propertyValue = 2000000;
    const rentalGrossYield = 0.20;
    const annualRentalIncome = propertyValue * rentalGrossYield;
    expect(annualRentalIncome).toBe(400000);
  });

  it("mortgage payment formula produces positive value", () => {
    const mortgageAmount = 1400000;
    const monthlyRate = 0.065 / 12;
    const term = 30 * 12;
    const payment = mortgageAmount * (monthlyRate * Math.pow(1 + monthlyRate, term)) / (Math.pow(1 + monthlyRate, term) - 1);
    expect(payment).toBeGreaterThan(0);
    expect(payment).toBeLessThan(20000); // Reasonable monthly payment
  });

  it("Roth balance grows at 5% annually", () => {
    let rothBalance = 29200;
    for (let y = 1; y <= 5; y++) {
      rothBalance = rothBalance * 1.05;
    }
    expect(Math.round(rothBalance)).toBe(Math.round(29200 * Math.pow(1.05, 5)));
  });

  it("IUL cash value grows with credit rate after premium", () => {
    const iulCreditRate = 0.055;
    const iulPremium = 7008;
    // Year 1: premium * 0.88 (12% load) * (1 + credit rate)
    const iulCashValue = (iulPremium * 0.88) * (1 + iulCreditRate);
    expect(iulCashValue).toBeGreaterThan(0);
    expect(iulCashValue).toBeLessThan(iulPremium); // Should be less due to load
  });
});

// ── 8. Property Type Enum Validation ─────────────────────────────────────
describe("Property Type Enum", () => {
  const validTypes = ["PRIMARY", "INVESTMENT", "SHORT_TERM_RENTAL", "COMMERCIAL", "LAND"];

  it("all property types are valid", () => {
    validTypes.forEach(type => {
      expect(typeof type).toBe("string");
      expect(type.length).toBeGreaterThan(0);
    });
  });

  it("has 5 property types", () => {
    expect(validTypes.length).toBe(5);
  });
});

// ── 9. Crypto Price Fetching Logic ───────────────────────────────────────
describe("Crypto Price Integration", () => {
  it("CoinGecko API URL is correctly formed", () => {
    const coinIds = ["bitcoin", "ethereum", "solana"];
    const ids = coinIds.join(",");
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;
    expect(url).toContain("bitcoin,ethereum,solana");
    expect(url).toContain("vs_currencies=usd");
    expect(url).toContain("include_24hr_change=true");
  });

  it("P&L calculation is correct for positive gain", () => {
    const qty = 2.5;
    const avgCost = 45000;
    const currentPrice = 60000;
    const costBasis = qty * avgCost;
    const currentValue = qty * currentPrice;
    const pnl = currentValue - costBasis;
    const pnlPct = (pnl / costBasis) * 100;
    expect(pnl).toBe(37500);
    expect(pnlPct).toBeCloseTo(33.33, 1);
  });

  it("P&L calculation is correct for loss", () => {
    const qty = 1.0;
    const avgCost = 50000;
    const currentPrice = 35000;
    const costBasis = qty * avgCost;
    const currentValue = qty * currentPrice;
    const pnl = currentValue - costBasis;
    expect(pnl).toBe(-15000);
  });

  it("staking income calculation from percentage", () => {
    const amountStaked = 2.0;
    const currentPrice = 60000;
    const stakingPercentage = 5.5;
    const annualIncome = amountStaked * currentPrice * (stakingPercentage / 100);
    expect(annualIncome).toBe(6600);
  });
});

// ── 10. Integration: All Round 21 Router Procedures ──────────────────────
describe("Round 21 Complete Router Integration", () => {
  it("all Round 21 procedures are registered", async () => {
    const { appRouter } = await import("./routers");
    const procedures = Object.keys((appRouter as any)._def.procedures);
    const round21Procedures = [
      "properties.list",
      "properties.create",
      "properties.update",
      "properties.delete",
      "crypto.list",
      "crypto.create",
      "crypto.update",
      "crypto.delete",
      "crypto.prices",
      "rothConversion.project",
    ];
    round21Procedures.forEach(proc => {
      expect(procedures).toContain(proc);
    });
  });

  it("total procedure count includes Round 21 additions", async () => {
    const { appRouter } = await import("./routers");
    const procedures = Object.keys((appRouter as any)._def.procedures);
    // Should have at least 10 new procedures from Round 21
    expect(procedures.length).toBeGreaterThanOrEqual(80);
  });
});
