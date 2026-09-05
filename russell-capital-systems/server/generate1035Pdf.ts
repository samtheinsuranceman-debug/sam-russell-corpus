/**
 * 1035 Exchange Analysis PDF Generator
 * Produces a branded, compliance-ready PDF with factor breakdown,
 * candidate comparison, and Solar Strategy pathway.
 */
import PDFDocument from "pdfkit";
import type { Request, Response } from "express";
import {
  scoreReplacementOpportunity,
  type ExistingContract,
  type ReplacementResult,
  type ReplacementCandidate,
  type SolarStrategyPathway,
} from "@shared/replacementScoring";
import type { StateCode } from "@shared/annuityData";

const BRAND_GREEN = "#22c55e";
const BRAND_DARK = "#0a1628";
const GRAY = "#64748b";
const RED = "#ef4444";
const AMBER = "#eab308";
const BLUE = "#3b82f6";

const fmt = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const fmtPct = (n: number) => `${n.toFixed(1)}%`;

function verdictColor(verdict: string): string {
  if (verdict === "REPLACE_NOW") return RED;
  if (verdict === "STRONG_CANDIDATE") return "#f97316";
  if (verdict === "MONITOR") return AMBER;
  if (verdict === "LIKELY_KEEP") return BLUE;
  return BRAND_GREEN;
}

function drawHeader(doc: PDFKit.PDFDocument) {
  doc.rect(0, 0, doc.page.width, 80).fill("#0f172a");
  doc.fontSize(22).fillColor(BRAND_GREEN).text("Russell Capital Systems™", 50, 20, { width: 400 });
  doc.fontSize(10).fillColor("#94a3b8").text("1035 Exchange Analysis Report", 50, 48, { width: 400 });
  doc.fontSize(9).fillColor("#64748b").text(new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), 400, 30, { width: 160, align: "right" });
  doc.moveDown(2);
  doc.y = 100;
}

function drawSectionTitle(doc: PDFKit.PDFDocument, title: string) {
  doc.moveDown(0.5);
  const y = doc.y;
  doc.rect(50, y, 3, 16).fill(BRAND_GREEN);
  doc.fontSize(13).fillColor("#1e293b").text(title, 60, y, { width: 480 });
  doc.moveDown(0.8);
}

function drawKeyValue(doc: PDFKit.PDFDocument, label: string, value: string, x = 50) {
  doc.fontSize(9).fillColor(GRAY).text(label, x, doc.y, { continued: true, width: 200 });
  doc.fillColor("#1e293b").text(`  ${value}`, { width: 280 });
}

function drawFactorRow(doc: PDFKit.PDFDocument, name: string, points: number, maxPoints: number, explanation: string) {
  const y = doc.y;
  const pct = Math.max(0, Math.min(1, points / maxPoints));
  const barColor = pct >= 0.7 ? RED : pct >= 0.4 ? AMBER : BRAND_GREEN;

  doc.fontSize(9).fillColor("#1e293b").text(name, 50, y, { width: 140 });
  doc.fontSize(8).fillColor(GRAY).text(`${points}/${maxPoints}`, 195, y, { width: 40 });

  // Bar background
  doc.rect(240, y + 2, 120, 8).fill("#e2e8f0");
  // Bar fill
  doc.rect(240, y + 2, 120 * pct, 8).fill(barColor);

  doc.fontSize(7).fillColor(GRAY).text(explanation, 370, y, { width: 180 });
  doc.y = y + 18;
}

function drawCandidateRow(doc: PDFKit.PDFDocument, c: ReplacementCandidate, rank: number, isSolar: boolean) {
  const y = doc.y;
  if (y > 700) { doc.addPage(); drawHeader(doc); }

  doc.fontSize(10).fillColor("#1e293b").text(`#${rank + 1}  ${c.product.carrier} — ${c.product.product}`, 50, doc.y, { width: 350 });
  doc.fontSize(9).fillColor(BRAND_GREEN).text(`+${fmt(c.monthlyIncomeImprovement)}/mo`, 420, y, { width: 130, align: "right" });
  doc.moveDown(0.3);

  const metrics = [
    `Bonus: ${fmtPct(c.product.premiumBonus ?? 0)}`,
    `Rollup: ${fmtPct(c.product.rollupRate ?? 0)}`,
    `AM Best: ${c.product.amBest}`,
    `Breakeven: ${c.breakevenMonths < 999 ? `${c.breakevenMonths}mo` : "N/A"}`,
    `Match: ${c.matchScore}/100`,
  ];
  doc.fontSize(8).fillColor(GRAY).text(metrics.join("   |   "), 60, doc.y, { width: 490 });

  if (isSolar && c.solarUplift > 0) {
    doc.moveDown(0.2);
    doc.fontSize(8).fillColor("#d97706").text(`☀ Solar ITC: +${fmt(c.solarUplift)}  →  Annuity Bonus: +${fmt(c.bonusUplift)}  →  Combined: +${fmt(c.combinedBonusTotal)}`, 60, doc.y, { width: 490 });
  }

  c.reasons.forEach(r => {
    doc.moveDown(0.15);
    doc.fontSize(7).fillColor(GRAY).text(`  ✓ ${r}`, 60, doc.y, { width: 480 });
  });

  doc.moveDown(0.6);
}

function drawSolarPathway(doc: PDFKit.PDFDocument, sp: SolarStrategyPathway) {
  if (doc.y > 580) { doc.addPage(); drawHeader(doc); }
  drawSectionTitle(doc, "Solar Strategy Pathway (Roth Conversion)");

  if (!sp.eligible) {
    doc.fontSize(9).fillColor(GRAY).text(`Not eligible: ${sp.eligibilityReason}`, 50, doc.y, { width: 500 });
    return;
  }

  const rows: [string, string][] = [
    ["Gross Account Value", fmt(sp.grossAccountValue)],
    ["Surrender Penalty", `-${fmt(sp.surrenderPenalty)}`],
    ["Net After Penalties", fmt(sp.netAfterPenalties)],
    ["Solar ITC Growth", `+${fmtPct(sp.solarGrowthPct)} (+${fmt(sp.solarBonusAmount)})`],
    ["Roth Conversion Tax Cost", `-${fmt(sp.conversionTaxCost)}`],
    ["Principal After Solar", fmt(sp.principalAfterSolar)],
    ["Annuity Premium Bonus", `+${fmtPct(sp.annuityBonusPct)} (+${fmt(sp.annuityBonusAmount)})`],
    ["Total Enhanced Premium", fmt(sp.totalEnhancedPremium)],
    ["Monthly Tax-Free Income", `${fmt(sp.monthlyTaxFreeIncome)}/mo`],
    ["Current Monthly (Taxable)", `${fmt(sp.currentMonthlyTaxableIncome)}/mo`],
    ["Income Improvement", `+${fmt(sp.monthlyIncomeImprovement)}/mo (+${fmtPct(sp.pctIncomeImprovement)})`],
    ["Lifetime Tax Savings", fmt(sp.lifetimeTaxSavings)],
    ["Years to Breakeven", `${sp.yearsToBreakeven.toFixed(1)} years`],
  ];

  rows.forEach(([label, value]) => {
    drawKeyValue(doc, label, value);
  });

  doc.moveDown(0.5);
  doc.fontSize(8).fillColor("#1e293b").text(sp.summary, 50, doc.y, { width: 500 });
}

function drawDisclaimer(doc: PDFKit.PDFDocument) {
  if (doc.y > 680) { doc.addPage(); drawHeader(doc); }
  doc.moveDown(1.5);
  doc.rect(50, doc.y, 500, 1).fill("#e2e8f0");
  doc.moveDown(0.5);
  doc.fontSize(7).fillColor(GRAY).text(
    "IMPORTANT DISCLOSURE: This 1035 Exchange Analysis is provided for informational and educational purposes only and does not constitute financial, tax, or legal advice. " +
    "All projections are estimates based on current product data and are not guarantees of future performance. A 1035 exchange may have tax implications and surrender charges. " +
    "Consult with a qualified financial advisor, tax professional, and/or attorney before making any exchange decisions. " +
    "Russell Capital Systems™ is not responsible for decisions made based on this analysis. Past performance does not guarantee future results. " +
    "Insurance product guarantees are backed by the financial strength of the issuing company.",
    50, doc.y, { width: 500, lineGap: 2 }
  );
  doc.moveDown(0.5);
  doc.fontSize(7).fillColor(GRAY).text(
    `Generated by Russell Capital Systems™ on ${new Date().toLocaleDateString("en-US")} at ${new Date().toLocaleTimeString("en-US")}. Confidential — for advisor use only.`,
    50, doc.y, { width: 500, align: "center" }
  );
}

export function generate1035PdfBuffer(contract: ExistingContract, stateCode: StateCode): Buffer {
  const result = scoreReplacementOpportunity(contract, stateCode);

  const doc = new PDFDocument({ size: "LETTER", margin: 50, bufferPages: true });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  // ── Page 1: Executive Summary ──
  drawHeader(doc);

  drawSectionTitle(doc, "Executive Summary");

  // Verdict badge
  const vc = verdictColor(result.verdict);
  doc.fontSize(11).fillColor(vc).text(`${result.verdictLabel}  —  Score: ${result.score}/100`, 50, doc.y, { width: 500 });
  doc.moveDown(0.3);
  doc.fontSize(9).fillColor("#1e293b").text(result.summary, 50, doc.y, { width: 500 });
  doc.moveDown(0.5);

  // Contract details
  drawSectionTitle(doc, "Existing Contract Details");
  const contractRows: [string, string][] = [
    ["Carrier / Product", `${contract.carrierName} — ${contract.productName}`],
    ["Account Value", fmt(contract.accountValue)],
    ["Surrender Value", fmt(contract.surrenderValue)],
    ["Surrender Penalty", `${contract.surrenderPenaltyPct}% (${contract.yearsInForce}yr of ${contract.surrenderPeriodYears}yr period)`],
    ["Current Monthly Income", `${fmt(contract.currentMonthlyIncome)}/mo`],
    ["Carrier Rating", `${contract.carrierRating} (COMDEX ${contract.carrierComdex})`],
    ["Rollup Rate", fmtPct(contract.rollupRate)],
    ["Premium Bonus", fmtPct(contract.premiumBonusPct)],
    ["Client Age", `${contract.clientAge}`],
    ["Account Type", contract.accountType.toUpperCase()],
    ["State", stateCode],
  ];
  contractRows.forEach(([label, value]) => drawKeyValue(doc, label, value));

  // ── Factor Breakdown ──
  doc.moveDown(0.5);
  drawSectionTitle(doc, "Replacement Factor Analysis");
  result.factors.forEach(f => drawFactorRow(doc, f.name, f.points, f.maxPoints, f.explanation));

  // Inaction risk
  doc.moveDown(0.5);
  doc.fontSize(9).fillColor(RED).text(`⚠ Inaction Risk: ${result.inactionRisk}`, 50, doc.y, { width: 500 });
  doc.moveDown(0.3);
  doc.fontSize(9).fillColor(BRAND_GREEN).text(`Estimated Advisor Revenue Opportunity: ${fmt(result.estimatedAdvisorRevenue)}`, 50, doc.y, { width: 500 });

  // ── Page 2: Candidate Comparison ──
  doc.addPage();
  drawHeader(doc);
  drawSectionTitle(doc, "Top Replacement Candidates");
  result.topCandidates.forEach((c, i) => drawCandidateRow(doc, c, i, false));

  // Solar-enhanced candidates (if applicable)
  if (result.solarPathway?.eligible) {
    drawSectionTitle(doc, "Solar Strategy Enhanced Candidates");
    doc.fontSize(9).fillColor("#d97706").text(
      `Solar-Enhanced Score: ${result.solarEnhancedScore}/100 — ${result.solarEnhancedVerdictLabel}`,
      50, doc.y, { width: 500 }
    );
    doc.moveDown(0.5);
    result.topCandidates.forEach((c, i) => drawCandidateRow(doc, c, i, true));
  }

  // ── Solar Pathway Detail ──
  if (result.solarPathway) {
    drawSolarPathway(doc, result.solarPathway);
  }

  // ── Disclaimer ──
  drawDisclaimer(doc);

  doc.end();

  // Synchronous buffer collection (pdfkit buffers all pages when bufferPages: true)
  return Buffer.concat(chunks);
}

/**
 * Express handler: POST /api/generate-1035-pdf
 * Body: { contract: ExistingContract, stateCode: StateCode }
 * Returns: application/pdf
 */
export async function handle1035PdfRequest(req: Request, res: Response) {
  try {
    const { contract, stateCode } = req.body;
    if (!contract || !stateCode) {
      return res.status(400).json({ error: "Missing contract or stateCode" });
    }

    const doc = new PDFDocument({ size: "LETTER", margin: 50, bufferPages: true });
    const chunks: Buffer[] = [];

    const result = scoreReplacementOpportunity(contract as ExistingContract, stateCode as StateCode);

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="1035_Exchange_Analysis_${new Date().toISOString().slice(0, 10)}.pdf"`);
      res.send(pdfBuffer);
    });

    // ── Page 1: Executive Summary ──
    drawHeader(doc);
    drawSectionTitle(doc, "Executive Summary");
    const vc = verdictColor(result.verdict);
    doc.fontSize(11).fillColor(vc).text(`${result.verdictLabel}  —  Score: ${result.score}/100`, 50, doc.y, { width: 500 });
    doc.moveDown(0.3);
    doc.fontSize(9).fillColor("#1e293b").text(result.summary, 50, doc.y, { width: 500 });
    doc.moveDown(0.5);

    drawSectionTitle(doc, "Existing Contract Details");
    const contractRows: [string, string][] = [
      ["Carrier / Product", `${contract.carrierName} — ${contract.productName}`],
      ["Account Value", fmt(contract.accountValue)],
      ["Surrender Value", fmt(contract.surrenderValue)],
      ["Surrender Penalty", `${contract.surrenderPenaltyPct}% (${contract.yearsInForce}yr of ${contract.surrenderPeriodYears}yr period)`],
      ["Current Monthly Income", `${fmt(contract.currentMonthlyIncome)}/mo`],
      ["Carrier Rating", `${contract.carrierRating} (COMDEX ${contract.carrierComdex})`],
      ["Rollup Rate", fmtPct(contract.rollupRate)],
      ["Premium Bonus", fmtPct(contract.premiumBonusPct)],
      ["Client Age", `${contract.clientAge}`],
      ["Account Type", contract.accountType.toUpperCase()],
      ["State", stateCode],
    ];
    contractRows.forEach(([label, value]) => drawKeyValue(doc, label, value));

    doc.moveDown(0.5);
    drawSectionTitle(doc, "Replacement Factor Analysis");
    result.factors.forEach(f => drawFactorRow(doc, f.name, f.points, f.maxPoints, f.explanation));

    doc.moveDown(0.5);
    doc.fontSize(9).fillColor(RED).text(`⚠ Inaction Risk: ${result.inactionRisk}`, 50, doc.y, { width: 500 });
    doc.moveDown(0.3);
    doc.fontSize(9).fillColor(BRAND_GREEN).text(`Estimated Advisor Revenue Opportunity: ${fmt(result.estimatedAdvisorRevenue)}`, 50, doc.y, { width: 500 });

    // ── Page 2: Candidates ──
    doc.addPage();
    drawHeader(doc);
    drawSectionTitle(doc, "Top Replacement Candidates");
    result.topCandidates.forEach((c, i) => drawCandidateRow(doc, c, i, false));

    if (result.solarPathway?.eligible) {
      drawSectionTitle(doc, "Solar Strategy Enhanced Candidates");
      doc.fontSize(9).fillColor("#d97706").text(
        `Solar-Enhanced Score: ${result.solarEnhancedScore}/100 — ${result.solarEnhancedVerdictLabel}`,
        50, doc.y, { width: 500 }
      );
      doc.moveDown(0.5);
      result.topCandidates.forEach((c, i) => drawCandidateRow(doc, c, i, true));
    }

    if (result.solarPathway) {
      drawSolarPathway(doc, result.solarPathway);
    }

    drawDisclaimer(doc);
    doc.end();
  } catch (err: any) {
    console.error("[1035 PDF] Error:", err);
    res.status(500).json({ error: err.message || "Failed to generate PDF" });
  }
}

/**
 * Bulk 1035 Exchange Analysis PDF Generator
 * Accepts an array of { contract, stateCode, clientName } and generates
 * a single multi-page PDF with each client's 1035 analysis.
 */
export function generateBulk1035PdfBuffer(
  entries: Array<{ contract: ExistingContract; stateCode: StateCode; clientName: string }>
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
  const doc = new PDFDocument({ size: "LETTER", margin: 50, bufferPages: true });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  doc.on("end", () => resolve(Buffer.concat(chunks)));
  doc.on("error", reject);

  // Cover page
  doc.rect(0, 0, doc.page.width, doc.page.height).fill("#0f172a");
  doc.fontSize(28).fillColor(BRAND_GREEN).text("Russell Capital Systems™", 50, 200, { width: 500, align: "center" });
  doc.fontSize(14).fillColor("#94a3b8").text("Bulk 1035 Exchange Analysis Report", 50, 245, { width: 500, align: "center" });
  doc.moveDown(2);
  doc.fontSize(11).fillColor("#64748b").text(`${entries.length} Contracts Analyzed`, 50, doc.y, { width: 500, align: "center" });
  doc.fontSize(10).fillColor("#475569").text(new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), 50, doc.y + 20, { width: 500, align: "center" });

  // Summary table page
  doc.addPage();
  drawHeader(doc);
  drawSectionTitle(doc, "Executive Summary — All Contracts");

  const summaryResults = entries.map(e => ({
    name: e.clientName,
    result: scoreReplacementOpportunity(e.contract, e.stateCode),
  }));

  // Summary table header
  const colX = [50, 180, 310, 390, 470];
  doc.fontSize(8).fillColor(GRAY);
  doc.text("Client", colX[0], doc.y, { width: 120 });
  doc.text("Carrier / Product", colX[1], doc.y - 10, { width: 120 });
  doc.text("Score", colX[2], doc.y - 10, { width: 70 });
  doc.text("Verdict", colX[3], doc.y - 10, { width: 70 });
  doc.text("Revenue Opp.", colX[4], doc.y - 10, { width: 80 });
  doc.moveDown(0.5);
  doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor("#e2e8f0").stroke();
  doc.moveDown(0.3);

  summaryResults.forEach(({ name, result }, i) => {
    const y = doc.y;
    if (y > 680) { doc.addPage(); drawHeader(doc); }
    const contract = entries[i].contract;
    doc.fontSize(8).fillColor("#1e293b").text(name, colX[0], doc.y, { width: 120 });
    doc.fillColor("#475569").text(`${contract.carrierName}`, colX[1], doc.y - 10, { width: 120 });
    doc.fillColor(verdictColor(result.verdict)).text(`${result.score}`, colX[2], doc.y - 10, { width: 70 });
    doc.text(result.verdictLabel, colX[3], doc.y - 10, { width: 70 });
    doc.fillColor(BRAND_GREEN).text(fmt(result.estimatedAdvisorRevenue), colX[4], doc.y - 10, { width: 80 });
    doc.moveDown(0.5);
  });

  // Total revenue opportunity
  const totalRevenue = summaryResults.reduce((sum, s) => sum + s.result.estimatedAdvisorRevenue, 0);
  const replaceCount = summaryResults.filter(s => s.result.verdict === "REPLACE_NOW" || s.result.verdict === "STRONG_CANDIDATE").length;
  doc.moveDown(1);
  doc.fontSize(10).fillColor(BRAND_GREEN).text(`Total Revenue Opportunity: ${fmt(totalRevenue)}`, 50, doc.y, { width: 500 });
  doc.fontSize(9).fillColor("#1e293b").text(`${replaceCount} of ${entries.length} contracts recommended for replacement`, 50, doc.y + 2, { width: 500 });

  // Individual analysis pages
  entries.forEach((entry, idx) => {
    doc.addPage();
    drawHeader(doc);
    doc.fontSize(11).fillColor("#1e293b").text(`Client: ${entry.clientName}`, 50, doc.y, { width: 500 });
    doc.moveDown(0.3);

    const result = summaryResults[idx].result;
    const vc = verdictColor(result.verdict);

    drawSectionTitle(doc, "Verdict");
    doc.fontSize(11).fillColor(vc).text(`${result.verdictLabel}  —  Score: ${result.score}/100`, 50, doc.y, { width: 500 });
    doc.moveDown(0.3);
    doc.fontSize(9).fillColor("#1e293b").text(result.summary, 50, doc.y, { width: 500 });
    doc.moveDown(0.5);

    drawSectionTitle(doc, "Contract Details");
    const rows: [string, string][] = [
      ["Carrier / Product", `${entry.contract.carrierName} — ${entry.contract.productName}`],
      ["Account Value", fmt(entry.contract.accountValue)],
      ["Surrender Value", fmt(entry.contract.surrenderValue)],
      ["Penalty", `${entry.contract.surrenderPenaltyPct}%`],
      ["Monthly Income", `${fmt(entry.contract.currentMonthlyIncome)}/mo`],
      ["Client Age", `${entry.contract.clientAge}`],
      ["State", entry.stateCode],
    ];
    rows.forEach(([label, value]) => drawKeyValue(doc, label, value));

    drawSectionTitle(doc, "Factor Analysis");
    result.factors.forEach(f => drawFactorRow(doc, f.name, f.points, f.maxPoints, f.explanation));

    doc.moveDown(0.5);
    doc.fontSize(9).fillColor(RED).text(`Inaction Risk: ${result.inactionRisk}`, 50, doc.y, { width: 500 });
    doc.fontSize(9).fillColor(BRAND_GREEN).text(`Revenue Opportunity: ${fmt(result.estimatedAdvisorRevenue)}`, 50, doc.y + 2, { width: 500 });

    if (result.topCandidates.length > 0 && doc.y < 550) {
      drawSectionTitle(doc, "Top Candidates");
      result.topCandidates.slice(0, 3).forEach((c, i) => drawCandidateRow(doc, c, i, false));
    }
  });

  drawDisclaimer(doc);
  doc.end();
  });
}

/**
 * Express handler: POST /api/generate-bulk-1035-pdf
 * Body: { entries: Array<{ contract, stateCode, clientName }> }
 * Returns: application/pdf
 */
export async function handleBulk1035PdfRequest(req: Request, res: Response) {
  try {
    const { entries } = req.body;
    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ error: "Missing or empty entries array" });
    }
    if (entries.length > 50) {
      return res.status(400).json({ error: "Maximum 50 contracts per bulk request" });
    }
    const pdfBuffer = await generateBulk1035PdfBuffer(entries);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="Bulk_1035_Analysis_${new Date().toISOString().slice(0, 10)}.pdf"`);
    res.send(pdfBuffer);
  } catch (err: any) {
    console.error("[Bulk 1035 PDF] Error:", err);
    res.status(500).json({ error: err.message || "Failed to generate bulk PDF" });
  }
}
