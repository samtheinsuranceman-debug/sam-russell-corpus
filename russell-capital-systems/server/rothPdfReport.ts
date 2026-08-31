import PDFDocument from "pdfkit";

const GREEN = "#22c55e";
const DARK = "#0a1628";
const BLUE = "#3b82f6";
const AMBER = "#f59e0b";
const RED = "#ef4444";
const GRAY = "#7a95b8";
const WHITE = "#ffffff";
const PURPLE = "#8b5cf6";
const CYAN = "#06b6d4";

function fmtFull(n: number): string {
  return `$${Math.round(n).toLocaleString()}`;
}

function fmtCompact(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${Math.round(n).toLocaleString()}`;
}

export async function generateRothReport(params: {
  iraBalance: number; conversionPortion: number; homeEquity: number;
  age: number; income: number; filingStatus: string; currentTaxBracket: number;
  iulYears: number; strategyYears: number; solarEquity: boolean;
  rentalGrossYield: number; realEstateAppreciation: number; helocRate: number;
  clientName?: string;
  carrierId?: string;
  carrierAvgReturn?: number;
}): Promise<Buffer> {
  // A Mutual Life Accumulator III baseline rates (sample illustration)
  const IUL_LOAD_FEE = 0.08;   // 8% Y1, 6% Y2-5, 0% after (using Y1 as default)
  const IUL_LOAN_RATE = 0.05;  // 5% declared rate loan
  const IUL_AVG_RETURN = params.carrierAvgReturn ?? 0.12; // 12% annual growth (user instruction)
  const IUL_COI_RATE = 0.008;  // 0.8% age-based COI starting rate

  const {
    iraBalance, conversionPortion, homeEquity, age, income,
    filingStatus, currentTaxBracket, iulYears, strategyYears,
    solarEquity: isSolar, rentalGrossYield, realEstateAppreciation, helocRate,
    clientName,
  } = params;

  const iraValue = iraBalance;
  const conversionAmount = iraValue * conversionPortion;
  const newRothValue = conversionAmount;
  const taxSavings = iraValue * 0.50;
  const halfTaxSavings = taxSavings / 2;
  const solarEnhancement = isSolar ? iraValue * 0.22 : 0;
  const targetPropertyPrice = iraValue / 0.4;
  const totalPropertyCount = Math.max(1, strategyYears);
  const perPropertyPrice = targetPropertyPrice / totalPropertyCount;
  const downPayment = targetPropertyPrice * 0.30;
  const mortgageAmount = targetPropertyPrice * 0.70;
  const helocAmount = downPayment;
  const mortgageRate = 0.065;
  const monthlyInterestOnlyPayment = Math.round(mortgageAmount * (mortgageRate / 12));
  const monthlyHelocPayment = Math.round(helocAmount * helocRate / 12);
  const year1Premium = isSolar ? solarEnhancement : halfTaxSavings;
  const year2Premium = isSolar ? halfTaxSavings : halfTaxSavings;

  // ── Build IUL projection ──
  const iulRows: any[] = [];
  let accountValue = 0;
  let cumulativeLoanBalance = 0;
  let cumulativePremiums = 0;

  for (let y = 1; y <= iulYears; y++) {
    let premium = 0;
    let premiumSource = "";
    let policyLoanTaken = 0;
    let strPrincipalPayment = 0;

    if (y === 1) {
      premium = year1Premium;
      premiumSource = isSolar ? "Solar equity (22%)" : "Half tax savings";
    } else if (y === 2) {
      premium = year2Premium;
      premiumSource = isSolar ? "Roth funds" : "Other half savings";
      const month13Loan = iraValue * 0.25;
      policyLoanTaken += month13Loan;
      strPrincipalPayment += month13Loan;
    } else if (y === 3) {
      premium = isSolar ? 0 : halfTaxSavings;
      premiumSource = isSolar ? "No new premium" : "IRA fund";
      const surrenderValue = accountValue * 0.80;
      policyLoanTaken += surrenderValue;
      strPrincipalPayment += surrenderValue;
    } else if (y >= 4) {
      const borrowForPremium = accountValue * 0.80 * 0.5;
      premium = borrowForPremium;
      premiumSource = `Borrow cascade Y${y}`;
      policyLoanTaken += borrowForPremium;
    }

    // A Mutual Life Accumulator III: 8% Y1, 6% Y2-5, 0% after
    const yearLoadRate = y === 1 ? 0.08 : (y <= 5 ? 0.06 : 0);
    const loadFee = premium * yearLoadRate;
    const coiCost = premium * IUL_COI_RATE;
    const netPremiumToAccount = premium - loadFee - coiCost;
    cumulativePremiums += premium;
    accountValue += netPremiumToAccount;
    const interestEarned = accountValue * IUL_AVG_RETURN;
    accountValue += interestEarned;
    cumulativeLoanBalance = cumulativeLoanBalance * (1 + IUL_LOAN_RATE) + policyLoanTaken;
    const netCashValue = accountValue - cumulativeLoanBalance;

    iulRows.push({
      year: y, premium: Math.round(premium), premiumSource,
      loadFee: Math.round(loadFee), coiCost: Math.round(coiCost),
      interestEarned: Math.round(interestEarned),
      endingAccountValue: Math.round(accountValue),
      cumulativeLoanBalance: Math.round(cumulativeLoanBalance),
      netCashValue: Math.round(netCashValue),
      strPrincipalPayment: Math.round(strPrincipalPayment),
      cumulativePremiums: Math.round(cumulativePremiums),
    });
  }

  // ── Build STR projection ──
  const strRows: any[] = [];
  let principalOwed = mortgageAmount;
  let helocBalance = helocAmount;
  let totalInterestPaid = 0;
  let propertiesAcquired = 0;

  for (let y = 1; y <= 20; y++) {
    const newPropsThisYear = y <= strategyYears ? Math.ceil(totalPropertyCount / strategyYears) : 0;
    propertiesAcquired = Math.min(propertiesAcquired + newPropsThisYear, totalPropertyCount);
    const activePropertyValue = perPropertyPrice * propertiesAcquired;
    const currentPropertyValue = activePropertyValue * Math.pow(1 + realEstateAppreciation, y);
    const rentalIncome = Math.round(currentPropertyValue * rentalGrossYield);
    const intOnlyPmt = Math.round(principalOwed * (mortgageRate / 12) * 12);
    const helocPmt = Math.round(helocBalance * helocRate);
    totalInterestPaid += intOnlyPmt + helocPmt;
    const iulPrincipalApplied = iulRows[y - 1]?.strPrincipalPayment ?? 0;
    principalOwed = Math.max(0, principalOwed - iulPrincipalApplied);
    const netCashFlow = rentalIncome - intOnlyPmt - helocPmt;
    const propertyEquity = Math.round(currentPropertyValue) - principalOwed;

    strRows.push({
      year: y, propertyValue: Math.round(currentPropertyValue), rentalIncome,
      interestOnlyPayment: intOnlyPmt, helocPayment: helocPmt, netCashFlow,
      principalOwed: Math.round(principalOwed), helocBalance: Math.round(helocBalance),
      propertyEquity: Math.round(propertyEquity), totalInterestPaid: Math.round(totalInterestPaid),
    });
  }

  // ── Build Roth projection ──
  let rothBalance = newRothValue;
  const rothRows: { year: number; balance: number }[] = [];
  for (let y = 1; y <= iulYears; y++) {
    rothBalance *= 1.05;
    rothRows.push({ year: y, balance: Math.round(rothBalance) });
  }

  const strategyLabel = isSolar
    ? "0% Year 1 Strategy - Solar Equity"
    : `0% Year ${strategyYears} Strategy - Non Solar`;

  const lastIul = iulRows[iulRows.length - 1];
  const lastStr = strRows[strRows.length - 1];
  const lastRoth = rothRows[rothRows.length - 1];
  const totalRentalIncome = strRows.reduce((s: number, r: any) => s + r.rentalIncome, 0);
  const totalWealth = (lastIul?.netCashValue ?? 0) + (lastStr?.propertyEquity ?? 0) + (lastRoth?.balance ?? 0);
  const initialInvestment = iraBalance + homeEquity;
  const wealthMultiplier = initialInvestment > 0 ? totalWealth / initialInvestment : 0;

  // ── Rate Stress Test (8%, 10%, 12%, 14%) ──
  const stressRates = [0.08, 0.10, 0.12, 0.14];
  function runStressScenario(creditRate: number) {
    let av = 0;
    let lb = 0;
    let cp = 0;
    const yearly: { year: number; av: number; ncv: number }[] = [];
    for (let y = 1; y <= iulYears; y++) {
      let prem: number;
      let loan = 0;
      if (y === 1) { prem = year1Premium; }
      else if (y === 2) { prem = year2Premium; loan = iraValue * 0.25; }
      else if (y === 3) { prem = year2Premium; loan = av * 0.90 * 0.80; }
      else { prem = year2Premium; loan = prem; }
      cp += prem;
      const lr = y === 1 ? 0.08 : (y <= 5 ? 0.06 : 0);
      const net = prem - prem * lr - prem * IUL_COI_RATE;
      av += net;
      av += av * creditRate;
      lb += loan;
      lb += lb * IUL_LOAN_RATE;
      yearly.push({ year: y, av: Math.round(av), ncv: Math.round(av - lb) });
    }
    return { yearly, finalAV: Math.round(av), finalNCV: Math.round(av - lb), totalPremiums: Math.round(cp) };
  }
  const stressResults = stressRates.map(r => ({ rate: r, label: `${(r * 100).toFixed(0)}%`, ...runStressScenario(r) }));

  // ── Generate PDF ──
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 40, bufferPages: true });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // ═══════════════════════════════════════════════════════════════
    // PAGE 1: COVER & STRATEGY SUMMARY
    // ═══════════════════════════════════════════════════════════════
    doc.rect(0, 0, doc.page.width, 100).fill(DARK);
    doc.fontSize(24).fillColor(GREEN).text("Russell Capital Systems™", 40, 22);
    doc.fontSize(10).fillColor(WHITE).text("Turn Capital Into Income\u2122", 40, 50);
    doc.fontSize(12).fillColor(WHITE).text(strategyLabel, 40, 70);
    doc.fontSize(8).fillColor(GRAY).text(
      `Prepared ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}` +
      (clientName ? ` | Client: ${clientName}` : "") +
      ` | Age ${age} | Income $${income.toLocaleString()} | ${filingStatus}`,
      40, 86
    );

    doc.moveDown(3);

    // Strategy Summary
    doc.fontSize(14).fillColor(GREEN).text("Strategy Summary", 40);
    doc.moveDown(0.5);

    const summaryItems: [string, string][] = [
      ["IRA Balance", fmtFull(iraBalance)],
      ["Conversion Amount", fmtFull(conversionAmount)],
      ["New Roth IRA Value", fmtFull(newRothValue)],
      ["Tax Savings (50%)", fmtFull(taxSavings)],
      ...(isSolar ? [["Solar Enhancement (+22%)", fmtFull(solarEnhancement)] as [string, string]] : []),
      ["Target STR Total (IRA / 0.4)", fmtFull(targetPropertyPrice)],
      ["Properties", `${totalPropertyCount} @ ${fmtFull(perPropertyPrice)} each`],
      ["Down Payment (30%)", fmtFull(downPayment)],
      ["Mortgage (70%)", fmtFull(mortgageAmount)],
      ["Monthly Interest-Only", fmtFull(monthlyInterestOnlyPayment)],
      ["Year 1 IUL Premium", fmtFull(year1Premium)],
      ["Year 2 IUL Premium", fmtFull(year2Premium)],
      ["IUL Illustrated Rate", `${(IUL_AVG_RETURN * 100).toFixed(0)}% (A Mutual Life Accumulator III)`],
    ];

    summaryItems.forEach(([label, value], i) => {
      const rowY = doc.y;
      if (i % 2 === 0) doc.rect(40, rowY - 2, 515, 14).fill("#0f1e35");
      doc.fontSize(9).fillColor(GRAY).text(label, 50, rowY, { width: 200 });
      doc.fontSize(9).fillColor(WHITE).text(value, 260, rowY, { width: 250 });
      doc.moveDown(0.3);
    });

    // 20-Year Wealth Summary Box
    doc.moveDown(1);
    doc.rect(40, doc.y - 4, 515, 80).fill("#052e16").lineWidth(1).stroke(GREEN);
    const boxY = doc.y;
    doc.fontSize(12).fillColor(GREEN).text("20-Year Total Wealth Projection", 60, boxY);
    doc.fontSize(20).fillColor(WHITE).text(fmtFull(totalWealth), 60, boxY + 20);
    doc.fontSize(9).fillColor(GRAY).text(`${wealthMultiplier.toFixed(1)}x wealth multiplier on ${fmtFull(initialInvestment)} initial investment`, 60, boxY + 48);
    doc.fontSize(9).fillColor(GREEN).text(`IUL Net Cash: ${fmtFull(lastIul?.netCashValue ?? 0)}`, 320, boxY + 20);
    doc.fontSize(9).fillColor(BLUE).text(`Property Equity: ${fmtFull(lastStr?.propertyEquity ?? 0)}`, 320, boxY + 34);
    doc.fontSize(9).fillColor(AMBER).text(`Roth Balance: ${fmtFull(lastRoth?.balance ?? 0)}`, 320, boxY + 48);
    doc.y = boxY + 80;

    // ═══════════════════════════════════════════════════════════════
    // PAGE 2: IUL PROJECTION TABLE
    // ═══════════════════════════════════════════════════════════════
    doc.addPage();
    doc.rect(0, 0, doc.page.width, 50).fill(DARK);
    doc.fontSize(14).fillColor(GREEN).text(`${iulYears}-Year IUL Projection — A Mutual Life Accumulator III`, 40, 18);
    doc.fontSize(8).fillColor(GRAY).text(`${(IUL_AVG_RETURN * 100).toFixed(0)}% illustrated rate | 8%/6%/0% premium loads | 5% policy loan rate`, 40, 36);
    doc.moveDown(2);

    const iulCols = ["Yr", "Premium", "Source", "Load", "COI", "Interest", "Acct Value", "Loan Bal", "Net Cash"];
    const iulColX = [40, 65, 110, 195, 235, 275, 330, 400, 465];
    const iulColW = [25, 45, 85, 40, 40, 55, 70, 65, 70];

    const drawIulHeader = () => {
      doc.rect(40, doc.y - 2, 515, 14).fill(DARK);
      const headerY = doc.y;
      iulCols.forEach((col, i) => {
        doc.fontSize(7).fillColor(GREEN).text(col, iulColX[i], headerY - 12, { width: iulColW[i] });
      });
      doc.moveDown(0.3);
    };

    drawIulHeader();

    iulRows.forEach((row: any, i: number) => {
      if (doc.y > 740) {
        doc.addPage();
        drawIulHeader();
      }
      const rowY = doc.y;
      if (i % 2 === 0) doc.rect(40, rowY - 2, 515, 12).fill("#0f1e35");
      const vals = [
        String(row.year), fmtFull(row.premium), row.premiumSource.substring(0, 18),
        fmtFull(row.loadFee), fmtFull(row.coiCost), fmtFull(row.interestEarned),
        fmtFull(row.endingAccountValue), fmtFull(row.cumulativeLoanBalance), fmtFull(row.netCashValue),
      ];
      vals.forEach((v, ci) => {
        const color = ci === 5 ? GREEN : ci === 7 ? RED : ci === 8 ? (row.netCashValue >= 0 ? GREEN : RED) : WHITE;
        doc.fontSize(7).fillColor(color).text(v, iulColX[ci], rowY, { width: iulColW[ci] });
      });
      doc.moveDown(0.2);
    });

    // ═══════════════════════════════════════════════════════════════
    // PAGE 3: STR PROJECTION + ROTH
    // ═══════════════════════════════════════════════════════════════
    doc.addPage();
    doc.rect(0, 0, doc.page.width, 50).fill(DARK);
    doc.fontSize(14).fillColor(GREEN).text("20-Year STR Property Projection", 40, 18);
    doc.fontSize(8).fillColor(GRAY).text(`${totalPropertyCount} propert${totalPropertyCount > 1 ? "ies" : "y"} | ${(realEstateAppreciation * 100).toFixed(0)}% appreciation | ${(rentalGrossYield * 100).toFixed(0)}% gross yield`, 40, 36);
    doc.moveDown(2);

    const strCols = ["Yr", "Prop Value", "Rental Inc", "Int-Only", "HELOC", "Net Cash", "Princ Owed", "Equity"];
    const strColX = [40, 65, 130, 205, 280, 345, 410, 475];
    const strColW = [25, 65, 75, 75, 65, 65, 65, 60];

    const drawStrHeader = () => {
      doc.rect(40, doc.y - 2, 515, 14).fill(DARK);
      const headerY = doc.y;
      strCols.forEach((col, i) => {
        doc.fontSize(7).fillColor(GREEN).text(col, strColX[i], headerY - 12, { width: strColW[i] });
      });
      doc.moveDown(0.3);
    };

    drawStrHeader();

    strRows.forEach((row: any, i: number) => {
      if (doc.y > 740) {
        doc.addPage();
        drawStrHeader();
      }
      const rowY = doc.y;
      if (i % 2 === 0) doc.rect(40, rowY - 2, 515, 12).fill("#0f1e35");
      const vals = [
        String(row.year), fmtFull(row.propertyValue), fmtFull(row.rentalIncome),
        fmtFull(row.interestOnlyPayment), fmtFull(row.helocPayment),
        `${row.netCashFlow >= 0 ? "+" : ""}${fmtFull(row.netCashFlow)}`,
        fmtFull(row.principalOwed), fmtFull(row.propertyEquity),
      ];
      vals.forEach((v, ci) => {
        const color = ci === 2 ? GREEN : ci === 3 || ci === 4 ? RED : ci === 5 ? (row.netCashFlow >= 0 ? GREEN : RED) : ci === 7 ? BLUE : WHITE;
        doc.fontSize(7).fillColor(color).text(v, strColX[ci], rowY, { width: strColW[ci] });
      });
      doc.moveDown(0.2);
    });

    // Roth projection mini-table
    doc.moveDown(1);
    doc.fontSize(12).fillColor(AMBER).text("Roth IRA Growth (5% Tax-Free)", 40, doc.y);
    doc.moveDown(0.5);

    const rothDisplay = rothRows.filter((_, i) => (i + 1) % 5 === 0 || i === 0);
    rothDisplay.forEach((row, i) => {
      const rowY = doc.y;
      if (i % 2 === 0) doc.rect(40, rowY - 2, 515, 14).fill("#0f1e35");
      doc.fontSize(9).fillColor(GRAY).text(`Year ${row.year}`, 50, rowY, { width: 100 });
      doc.fontSize(9).fillColor(AMBER).text(fmtFull(row.balance), 160, rowY, { width: 150 });
      doc.moveDown(0.3);
    });

    // ═══════════════════════════════════════════════════════════════
    // PAGE 4: COMBINED SUMMARY
    // ═══════════════════════════════════════════════════════════════
    doc.addPage();
    doc.rect(0, 0, doc.page.width, 50).fill(DARK);
    doc.fontSize(14).fillColor(GREEN).text("Combined Strategy Summary", 40, 18);
    doc.fontSize(8).fillColor(GRAY).text(`${iulYears}-year projection | ${strategyLabel}`, 40, 36);
    doc.moveDown(2);

    const grandItems: [string, string, string][] = [
      ["IUL Account Value", fmtFull(lastIul?.endingAccountValue ?? 0), GREEN],
      ["IUL Net Cash Value (after loan payoff)", fmtFull(lastIul?.netCashValue ?? 0), GREEN],
      ["IUL Loan Balance", fmtFull(lastIul?.cumulativeLoanBalance ?? 0), RED],
      ["Total IUL Premiums Paid", fmtFull(lastIul?.cumulativePremiums ?? 0), WHITE],
      ["Total Rental Income (20yr)", fmtFull(totalRentalIncome), GREEN],
      ["Property Appreciation", `+${fmtFull((lastStr?.propertyValue ?? 0) - targetPropertyPrice)}`, BLUE],
      ["Final Property Value", fmtFull(lastStr?.propertyValue ?? 0), BLUE],
      ["Final Property Equity", fmtFull(lastStr?.propertyEquity ?? 0), BLUE],
      ["Final Roth Balance", fmtFull(lastRoth?.balance ?? 0), AMBER],
      ["Total Wealth at Year 20", fmtFull(totalWealth), GREEN],
      ["Initial Investment", fmtFull(initialInvestment), WHITE],
      ["Wealth Multiplier", `${wealthMultiplier.toFixed(2)}x`, GREEN],
    ];

    grandItems.forEach(([label, value, color], i) => {
      const rowY = doc.y;
      if (i % 2 === 0) doc.rect(40, rowY - 2, 515, 16).fill("#0f1e35");
      const isTotal = label.includes("Total Wealth") || label.includes("Multiplier");
      doc.fontSize(isTotal ? 10 : 9).fillColor(GRAY).text(label, 50, rowY, { width: 280 });
      doc.fontSize(isTotal ? 11 : 9).fillColor(color).text(value, 340, rowY, { width: 200 });
      doc.moveDown(isTotal ? 0.5 : 0.3);
    });

    // ═══════════════════════════════════════════════════════════════
    // PAGE 5: RATE STRESS TEST (8% / 10% / 12% / 14%)
    // ═══════════════════════════════════════════════════════════════
    doc.addPage();
    doc.rect(0, 0, doc.page.width, 50).fill(DARK);
    doc.fontSize(14).fillColor(CYAN).text("Rate Sensitivity — IUL Performance at 8% / 10% / 12% / 14%", 40, 18);
    doc.fontSize(8).fillColor(GRAY).text("Deterministic projections showing how different illustrated rates affect your IUL cash values", 40, 36);
    doc.moveDown(2);

    // Summary comparison table
    doc.fontSize(11).fillColor(WHITE).text(`Year ${iulYears} Final Values by Illustrated Rate`, 40, doc.y);
    doc.moveDown(0.5);

    // Header
    const stressColX = [40, 120, 230, 350, 460];
    const stressColW = [80, 110, 120, 110, 80];
    const stressHeaders = ["Rate", "Account Value", "Net Cash Value", "Total Premiums", "Multiplier"];
    doc.rect(40, doc.y - 2, 515, 16).fill(DARK);
    const shY = doc.y;
    stressHeaders.forEach((h, i) => {
      doc.fontSize(8).fillColor(CYAN).text(h, stressColX[i], shY, { width: stressColW[i] });
    });
    doc.moveDown(0.5);

    stressResults.forEach((s, i) => {
      const rowY = doc.y;
      const isBase = s.rate === IUL_AVG_RETURN;
      if (isBase) {
        doc.rect(40, rowY - 2, 515, 16).fill("#164e63");
      } else if (i % 2 === 0) {
        doc.rect(40, rowY - 2, 515, 16).fill("#0f1e35");
      }
      const mult = s.totalPremiums > 0 ? (s.finalAV / s.totalPremiums).toFixed(1) + "x" : "N/A";
      const color = isBase ? CYAN : s.rate >= 0.12 ? GREEN : s.rate >= 0.10 ? AMBER : RED;
      doc.fontSize(9).fillColor(color).text(s.label + (isBase ? " (base)" : ""), stressColX[0], rowY, { width: stressColW[0] });
      doc.fontSize(9).fillColor(WHITE).text(fmtFull(s.finalAV), stressColX[1], rowY, { width: stressColW[1] });
      doc.fontSize(9).fillColor(s.finalNCV >= 0 ? GREEN : RED).text(fmtFull(s.finalNCV), stressColX[2], rowY, { width: stressColW[2] });
      doc.fontSize(9).fillColor(GRAY).text(fmtFull(s.totalPremiums), stressColX[3], rowY, { width: stressColW[3] });
      doc.fontSize(9).fillColor(color).text(mult, stressColX[4], rowY, { width: stressColW[4] });
      doc.moveDown(0.4);
    });

    // Year-by-year comparison at key milestones
    doc.moveDown(1);
    doc.fontSize(11).fillColor(WHITE).text("Key Milestone Comparison", 40, doc.y);
    doc.moveDown(0.5);

    const milestones = [5, 10, 15, iulYears];
    const mColX = [40, 120, 220, 320, 420];
    const mColW = [80, 100, 100, 100, 100];

    // Header
    doc.rect(40, doc.y - 2, 515, 16).fill(DARK);
    const mhY = doc.y;
    doc.fontSize(8).fillColor(CYAN).text("Year", mColX[0], mhY, { width: mColW[0] });
    stressResults.forEach((s, i) => {
      doc.fontSize(8).fillColor(CYAN).text(`${s.label} Net Cash`, mColX[i + 1], mhY, { width: mColW[i + 1] });
    });
    doc.moveDown(0.5);

    milestones.forEach((yr, mi) => {
      const rowY = doc.y;
      if (mi % 2 === 0) doc.rect(40, rowY - 2, 515, 14).fill("#0f1e35");
      doc.fontSize(9).fillColor(WHITE).text(`Year ${yr}`, mColX[0], rowY, { width: mColW[0] });
      stressResults.forEach((s, i) => {
        const val = s.yearly[yr - 1]?.ncv ?? 0;
        const color = val >= 0 ? GREEN : RED;
        doc.fontSize(8).fillColor(color).text(fmtCompact(val), mColX[i + 1], rowY, { width: mColW[i + 1] });
      });
      doc.moveDown(0.3);
    });

    // Explanation
    doc.moveDown(0.5);
    doc.fontSize(8).fillColor(GRAY).text(
      "This analysis shows how different illustrated rates affect your IUL performance. " +
      "The 12% base case uses the A Mutual Life Accumulator III illustrated rate per the sample illustration. " +
      "The 8% scenario represents a conservative estimate, while 14% shows upside potential. " +
      "All scenarios use identical charge structures (8%/6%/0% loads, 0.8% COI, 5% loan rate). " +
      "The IUL floor of 0% means actual returns cannot go negative in any given year.",
      40, doc.y, { width: 515, lineGap: 3 }
    );

    // ═══════════════════════════════════════════════════════════════
    // PAGE 6: MONTE CARLO SIMULATION
    // ═══════════════════════════════════════════════════════════════
    doc.addPage();
    doc.rect(0, 0, doc.page.width, 50).fill(DARK);
    doc.fontSize(14).fillColor(PURPLE).text("Monte Carlo Simulation — IUL Net Cash Value", 40, 18);
    doc.fontSize(8).fillColor(GRAY).text("500 simulations | 15% S&P 500 volatility | 0% IUL floor", 40, 36);
    doc.moveDown(2);

    // Run Monte Carlo
    const MC_SIMS = 500;
    const MC_VOL = 0.15;
    const mcPercentiles: { year: number; p10: number; p25: number; p50: number; p75: number; p90: number; actual: number }[] = [];
    const allPaths: number[][] = [];
    for (let s = 0; s < MC_SIMS; s++) {
      const path: number[] = [];
      let av = 0;
      for (let y = 0; y < iulYears; y++) {
        const premium = iulRows[y].premium;
        const u1 = Math.random();
        const u2 = Math.random();
        const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        const randomReturn = Math.max(0, IUL_AVG_RETURN + MC_VOL * z);
        av += premium * (1 - IUL_LOAD_FEE);
        av += av * randomReturn;
        av -= av * IUL_COI_RATE;
        av = Math.max(0, av);
        const loanBal = iulRows[y].cumulativeLoanBalance;
        path.push(Math.max(0, av - loanBal));
      }
      allPaths.push(path);
    }
    for (let y = 0; y < iulYears; y++) {
      const vals = allPaths.map(p => p[y]).sort((a, b) => a - b);
      const pct = (p: number) => vals[Math.floor(vals.length * p)];
      mcPercentiles.push({
        year: y + 1,
        p10: Math.round(pct(0.10)),
        p25: Math.round(pct(0.25)),
        p50: Math.round(pct(0.50)),
        p75: Math.round(pct(0.75)),
        p90: Math.round(pct(0.90)),
        actual: iulRows[y].netCashValue,
      });
    }

    // Monte Carlo percentile table
    doc.fontSize(11).fillColor(WHITE).text("Percentile Outcomes by Year", 40, doc.y);
    doc.moveDown(0.5);

    const mcCols = ["Year", "10th %ile", "25th %ile", "Median", "75th %ile", "90th %ile", "Base Case"];
    const mcColX = [40, 80, 145, 215, 285, 360, 435];
    const mcColW = [40, 65, 70, 70, 75, 75, 75];

    const drawMcHeader = () => {
      doc.rect(40, doc.y - 2, 515, 14).fill(DARK);
      const headerY = doc.y;
      mcCols.forEach((col, i) => {
        doc.fontSize(7).fillColor(PURPLE).text(col, mcColX[i], headerY - 12, { width: mcColW[i] });
      });
      doc.moveDown(0.3);
    };
    drawMcHeader();

    // Show every other year + final year
    const mcDisplayYears = mcPercentiles.filter((_, i) => i % 2 === 0 || i === mcPercentiles.length - 1);
    mcDisplayYears.forEach((row, i) => {
      if (doc.y > 700) { doc.addPage(); drawMcHeader(); }
      const rowY = doc.y;
      if (i % 2 === 0) doc.rect(40, rowY - 2, 515, 12).fill("#0f1e35");
      const vals = [
        String(row.year), fmtCompact(row.p10), fmtCompact(row.p25),
        fmtCompact(row.p50), fmtCompact(row.p75), fmtCompact(row.p90), fmtCompact(row.actual),
      ];
      const colors = [WHITE, RED, AMBER, PURPLE, BLUE, GREEN, GREEN];
      vals.forEach((v, ci) => {
        doc.fontSize(7).fillColor(colors[ci]).text(v, mcColX[ci], rowY, { width: mcColW[ci] });
      });
      doc.moveDown(0.2);
    });

    // Final year summary
    const lastMc = mcPercentiles[mcPercentiles.length - 1];
    doc.moveDown(0.8);
    doc.fontSize(11).fillColor(WHITE).text(`Year ${iulYears} Final Outcomes`, 40, doc.y);
    doc.moveDown(0.5);

    const mcSummaryItems: [string, string, string][] = [
      ["Worst Case (10th %ile)", fmtFull(lastMc.p10), RED],
      ["Below Average (25th %ile)", fmtFull(lastMc.p25), AMBER],
      ["Median (50th %ile)", fmtFull(lastMc.p50), PURPLE],
      ["Above Average (75th %ile)", fmtFull(lastMc.p75), BLUE],
      ["Best Case (90th %ile)", fmtFull(lastMc.p90), GREEN],
      [`Base Case (${(IUL_AVG_RETURN * 100).toFixed(0)}% fixed)`, fmtFull(lastMc.actual), GREEN],
    ];
    mcSummaryItems.forEach(([label, value, color], i) => {
      const rowY = doc.y;
      if (i % 2 === 0) doc.rect(40, rowY - 2, 515, 14).fill("#0f1e35");
      doc.fontSize(9).fillColor(GRAY).text(label, 50, rowY, { width: 250 });
      doc.fontSize(9).fillColor(color).text(value, 310, rowY, { width: 200 });
      doc.moveDown(0.3);
    });

    doc.moveDown(0.5);
    doc.fontSize(8).fillColor(GRAY).text(
      "Monte Carlo simulation runs 500 paths with 15% annual volatility (historical S&P 500 average). " +
      "The IUL floor of 0% prevents negative returns from reducing account value. " +
      "Wider spreads in later years reflect compounding uncertainty. " +
      `The base case uses a fixed ${(IUL_AVG_RETURN * 100).toFixed(0)}% annual return for comparison.`,
      40, doc.y, { width: 515, lineGap: 3 }
    );

    // ═══════════════════════════════════════════════════════════════
    // PAGE 7: SENSITIVITY ANALYSIS
    // ═══════════════════════════════════════════════════════════════
    doc.addPage();
    doc.rect(0, 0, doc.page.width, 50).fill(DARK);
    doc.fontSize(14).fillColor(CYAN).text("Sensitivity Analysis — IUL Net Cash Value", 40, 18);
    doc.fontSize(8).fillColor(GRAY).text("Median of 200 simulations per cell | Return Rate vs. Volatility", 40, 36);
    doc.moveDown(2);

    const sensReturnRates = [0.06, 0.07, 0.08, 0.09, 0.10, 0.11, 0.12];
    const sensVolatilities = [0.10, 0.12, 0.15, 0.18, 0.20];
    const SENS_SIMS = 200;
    const sensGrid: number[][] = [];
    let sensMin = Infinity, sensMax = -Infinity;

    for (const ret of sensReturnRates) {
      const row: number[] = [];
      for (const vol of sensVolatilities) {
        const finals: number[] = [];
        for (let s = 0; s < SENS_SIMS; s++) {
          let av = 0;
          for (let y = 0; y < iulYears; y++) {
            const premium = iulRows[y].premium;
            const u1 = Math.random();
            const u2 = Math.random();
            const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
            const randomReturn = Math.max(0, ret + vol * z);
            av += premium * (1 - IUL_LOAD_FEE);
            av += av * randomReturn;
            av -= av * IUL_COI_RATE;
            av = Math.max(0, av);
          }
          const loanBal = iulRows[iulYears - 1].cumulativeLoanBalance;
          finals.push(Math.max(0, av - loanBal));
        }
        finals.sort((a, b) => a - b);
        const median = Math.round(finals[Math.floor(finals.length / 2)]);
        row.push(median);
        if (median < sensMin) sensMin = median;
        if (median > sensMax) sensMax = median;
      }
      sensGrid.push(row);
    }

    doc.fontSize(11).fillColor(WHITE).text(`Year ${iulYears} IUL Net Cash Value — Return Rate vs. Volatility`, 40, doc.y);
    doc.moveDown(0.5);

    const sensTableX = 40;
    const sensCellW = 82;
    const sensLabelW = 85;
    const sensCellH = 18;

    // Header row
    const sensHeaderY = doc.y;
    doc.rect(sensTableX, sensHeaderY - 2, sensLabelW + sensCellW * sensVolatilities.length, sensCellH).fill(DARK);
    doc.fontSize(7).fillColor(CYAN).text("Return \\ Vol", sensTableX + 4, sensHeaderY + 2, { width: sensLabelW - 8 });
    sensVolatilities.forEach((v, i) => {
      const isBase = v === 0.15;
      const x = sensTableX + sensLabelW + i * sensCellW;
      if (isBase) doc.rect(x, sensHeaderY - 2, sensCellW, sensCellH).fill("#164e63");
      doc.fontSize(7).fillColor(isBase ? CYAN : GRAY).text(`${(v * 100).toFixed(0)}%`, x + 4, sensHeaderY + 2, { width: sensCellW - 8, align: "center" });
    });
    doc.y = sensHeaderY + sensCellH;

    // Data rows
    sensReturnRates.forEach((ret, ri) => {
      const rowY = doc.y;
      const isBaseRow = ret === 0.10;
      doc.rect(sensTableX, rowY - 2, sensLabelW, sensCellH).fill(isBaseRow ? "#164e63" : "#0f1e35");
      doc.fontSize(7).fillColor(isBaseRow ? CYAN : GRAY).text(`${(ret * 100).toFixed(0)}%`, sensTableX + 4, rowY + 2, { width: sensLabelW - 8 });
      sensGrid[ri].forEach((val, ci) => {
        const x = sensTableX + sensLabelW + ci * sensCellW;
        const isBase = ret === 0.10 && sensVolatilities[ci] === 0.15;
        const ratio = sensMax === sensMin ? 1 : (val - sensMin) / (sensMax - sensMin);
        let bgColor = "#1c1917";
        let textColor = RED;
        if (isBase) { bgColor = "#164e63"; textColor = CYAN; }
        else if (ratio >= 0.8) { bgColor = "#052e16"; textColor = GREEN; }
        else if (ratio >= 0.6) { bgColor = "#0a3622"; textColor = "#86efac"; }
        else if (ratio >= 0.4) { bgColor = "#0c2d48"; textColor = BLUE; }
        else if (ratio >= 0.2) { bgColor = "#2a1a00"; textColor = AMBER; }
        else { bgColor = "#2a0a0a"; textColor = RED; }
        doc.rect(x, rowY - 2, sensCellW, sensCellH).fill(bgColor);
        doc.fontSize(7).fillColor(textColor).text(fmtCompact(val), x + 4, rowY + 2, { width: sensCellW - 8, align: "center" });
      });
      doc.y = rowY + sensCellH;
    });

    doc.moveDown(1);
    doc.fontSize(8).fillColor(GRAY).text(
      "Each cell shows the median IUL net cash value (account value minus cumulative loan balance) " +
      `at year ${iulYears} across 200 simulated paths per scenario. ` +
      "Higher returns and lower volatility produce better outcomes. " +
      "The highlighted cell (10% return, 15% volatility) represents the base case assumptions.",
      40, doc.y, { width: 515, lineGap: 3 }
    );

    // Legend
    doc.moveDown(0.5);
    const legendItems: [string, string][] = [
      ["High (top 20%)", GREEN], ["Above Avg", "#86efac"],
      ["Medium", BLUE], ["Below Avg", AMBER], ["Stress", RED],
    ];
    let legendX = 40;
    legendItems.forEach(([label, color]) => {
      doc.rect(legendX, doc.y, 8, 8).fill(color);
      doc.fontSize(7).fillColor(GRAY).text(label, legendX + 12, doc.y, { width: 80 });
      legendX += 90;
    });

    // ═══════════════════════════════════════════════════════════════
    // PAGE 8: DISCLAIMERS
    // ═══════════════════════════════════════════════════════════════
    doc.addPage();
    doc.rect(0, 0, doc.page.width, 50).fill(DARK);
    doc.fontSize(14).fillColor(WHITE).text("Important Disclosures", 40, 18);
    doc.moveDown(2);

    const disclaimers = [
      "This report is for illustrative purposes only and does not constitute financial, tax, or legal advice.",
      "The IUL projections use the A Mutual Life Indexed UL Accumulator III illustrated rate and charge structure derived from the sample illustration. Actual policy performance will vary based on market conditions, index performance, and policy-specific factors.",
      `The ${(IUL_AVG_RETURN * 100).toFixed(0)}% illustrated rate is not guaranteed. The A Mutual Life Accumulator III has a 0% floor (preventing negative returns) and a 14.5% cap on the S&P 500 index strategy. Historical 25-year compound crediting rate is approximately 6.75%.`,
      "Real estate projections assume consistent appreciation and rental yields. Actual property performance depends on location, market conditions, property management, and other factors.",
      "Tax savings estimates are approximate and depend on individual tax situations, filing status, and applicable deductions. Consult a qualified tax professional before making any conversion decisions.",
      "Policy loans accrue interest at the declared rate and reduce the death benefit and cash surrender value. Excessive policy loans may cause the policy to lapse.",
      "Monte Carlo simulations use historical S&P 500 volatility (approximately 15%) and are not predictive of future performance. Past performance does not guarantee future results.",
      "Russell Capital Systems™ and its advisors are not affiliated with A Mutual Life, and this report does not represent an official carrier illustration.",
    ];

    disclaimers.forEach((text, i) => {
      doc.fontSize(8).fillColor(GRAY).text(`${i + 1}. ${text}`, 50, doc.y, { width: 500, lineGap: 2 });
      doc.moveDown(0.5);
    });

    doc.moveDown(1);
    doc.fontSize(9).fillColor(WHITE).text("Russell Capital Systems™", 40, doc.y);
    doc.fontSize(8).fillColor(GREEN).text("Turn Capital Into Income\u2122", 40, doc.y + 14);
    doc.fontSize(7).fillColor(GRAY).text("www.RussellCapitalSystems.com", 40, doc.y + 28);

    // Footer on each page
    const footerText = "Russell Capital Systems™ | Confidential | For illustrative purposes only | Not financial advice";
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc.fontSize(7).fillColor(GRAY).text(
        `${footerText}  |  Page ${i + 1} of ${pageCount}`,
        40, doc.page.height - 30, { align: "center", width: 515 }
      );
    }

    doc.end();
  });
}
