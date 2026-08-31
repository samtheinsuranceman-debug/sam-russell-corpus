/**
 * Mortgage Killer Strategy — PDF Export Service
 * Branded client-facing PDF with dual amortization schedules,
 * HELOC cycle diagram, IUL policy summary, and total wealth created.
 */

import PDFDocument from "pdfkit";
import type { MortgageKillerResult } from "../shared/mortgageKiller";

// ─── Brand Colors ───────────────────────────────────────────────────────────
const C = {
  bg: "#0f1117",
  card: "#1a1d27",
  cardAlt: "#141720",
  border: "#2a2d3a",
  text: "#e4e4e7",
  muted: "#a1a1aa",
  blue: "#3b82f6",
  emerald: "#22c55e",
  amber: "#f59e0b",
  red: "#ef4444",
  purple: "#8b5cf6",
  cyan: "#06b6d4",
  white: "#ffffff",
  orange: "#f97316",
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function fmtPct(n: number): string {
  return (n * 100).toFixed(1) + "%";
}

function newPage(doc: PDFKit.PDFDocument) {
  doc.addPage();
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(C.bg);
}

function drawPageHeader(doc: PDFKit.PDFDocument, title: string, subtitle?: string) {
  doc.rect(0, 0, doc.page.width, 80).fill(C.card);
  doc.rect(0, 78, doc.page.width, 2).fill(C.blue);
  doc.fillColor(C.blue).fontSize(20).font("Helvetica-Bold").text(title, 40, 22);
  if (subtitle) {
    doc.fillColor(C.muted).fontSize(10).font("Helvetica").text(subtitle, 40, 50);
  }
  doc.y = 100;
}

function drawSectionTitle(doc: PDFKit.PDFDocument, title: string) {
  if (doc.y > doc.page.height - 100) newPage(doc);
  doc.fillColor(C.blue).fontSize(13).font("Helvetica-Bold").text(title, 40, doc.y);
  doc.moveDown(0.3);
  doc.strokeColor(C.border).lineWidth(0.5).moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).stroke();
  doc.moveDown(0.6);
}

function drawText(doc: PDFKit.PDFDocument, text: string, opts?: { bold?: boolean; color?: string; size?: number }) {
  doc.fillColor(opts?.color ?? C.text)
    .fontSize(opts?.size ?? 9.5)
    .font(opts?.bold ? "Helvetica-Bold" : "Helvetica")
    .text(text, 40, doc.y, { width: doc.page.width - 80 });
}

function drawKpiRow(doc: PDFKit.PDFDocument, items: { label: string; value: string; color?: string }[]) {
  const y = doc.y;
  const colW = (doc.page.width - 80) / items.length;
  items.forEach((item, i) => {
    const x = 40 + i * colW;
    doc.fillColor(item.color ?? C.emerald).fontSize(18).font("Helvetica-Bold").text(item.value, x, y, { width: colW });
    doc.fillColor(C.muted).fontSize(8).font("Helvetica").text(item.label, x, y + 22, { width: colW });
  });
  doc.y = y + 45;
}

function drawTableHeader(doc: PDFKit.PDFDocument, cols: { label: string; x: number; w: number }[]) {
  const y = doc.y;
  doc.rect(40, y, doc.page.width - 80, 18).fill(C.card);
  cols.forEach(col => {
    doc.fillColor(C.muted).fontSize(7.5).font("Helvetica-Bold").text(col.label, col.x, y + 4, { width: col.w, align: "right" });
  });
  doc.y = y + 20;
}

function drawTableRow(doc: PDFKit.PDFDocument, cols: { value: string; x: number; w: number; color?: string }[], highlight?: boolean) {
  const y = doc.y;
  if (highlight) {
    doc.rect(40, y, doc.page.width - 80, 14).fill("#1e2a1e");
  }
  cols.forEach(col => {
    doc.fillColor(col.color ?? C.text).fontSize(7.5).font("Helvetica").text(col.value, col.x, y + 2, { width: col.w, align: "right" });
  });
  doc.y = y + 14;
}

function addPageNumbers(doc: PDFKit.PDFDocument) {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc.fillColor(C.muted).fontSize(7).font("Helvetica")
      .text(`Russell Capital Systems™  •  Mortgage Killer Strategy  •  Page ${i + 1} of ${range.count}`, 0, doc.page.height - 25, { align: "center", width: doc.page.width });
  }
}

// ─── Main PDF Generator ─────────────────────────────────────────────────────

export interface MortgageKillerPdfInput {
  result: MortgageKillerResult;
  clientName: string;
  advisorName: string;
  firmName?: string;
  mortgageRate: number;
  annualIncome: number;
  mortgageBalance: number;
  homeMarketValue: number;
  homeEquityValue: number;
  incomeAllocationPct: number;
}

export function generateMortgageKillerPdf(input: MortgageKillerPdfInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const { result, clientName, advisorName } = input;
    const doc = new PDFDocument({
      size: "LETTER",
      margins: { top: 40, bottom: 40, left: 40, right: 40 },
      bufferPages: true,
      info: {
        Title: `Mortgage Killer Strategy — ${clientName}`,
        Author: advisorName,
        Subject: "Mortgage Acceleration Analysis",
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // ═══════════════════════════════════════════════════════════════════════
    // PAGE 1: COVER
    // ═══════════════════════════════════════════════════════════════════════
    doc.rect(0, 0, doc.page.width, doc.page.height).fill(C.bg);

    // Accent bar
    doc.rect(0, 0, doc.page.width, 6).fill(C.blue);

    // Title block
    doc.fillColor(C.blue).fontSize(36).font("Helvetica-Bold").text("MORTGAGE", 60, 160);
    doc.fillColor(C.emerald).fontSize(36).font("Helvetica-Bold").text("KILLER", 60, 200);
    doc.fillColor(C.text).fontSize(14).font("Helvetica").text("STRATEGY", 60, 244);

    doc.moveDown(3);
    doc.fillColor(C.text).fontSize(14).font("Helvetica").text(`Prepared for: ${clientName}`, 60);
    doc.moveDown(0.5);
    doc.fillColor(C.muted).fontSize(11).text(`Advisor: ${advisorName}`, 60);
    if (input.firmName) {
      doc.moveDown(0.3);
      doc.text(`Firm: ${input.firmName}`, 60);
    }
    doc.moveDown(1);
    doc.fillColor(C.muted).fontSize(10).text(`Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, 60);

    // Summary KPIs on cover
    doc.y = 420;
    doc.rect(50, doc.y, doc.page.width - 100, 120).lineWidth(1).strokeColor(C.border).stroke();
    doc.y += 15;
    doc.fillColor(C.white).fontSize(11).font("Helvetica-Bold").text("Strategy Highlights", 70, doc.y);
    doc.y += 25;

    const highlights = [
      { label: "Years Saved", value: `${result.summary.yearsSaved} yrs ${result.summary.monthsSaved % 12} mo`, color: C.emerald },
      { label: "Interest Saved", value: fmt(result.summary.totalInterestSaved), color: C.emerald },
      { label: "Total Wealth Created", value: fmt(result.summary.totalWealthCreated), color: C.blue },
    ];
    drawKpiRow(doc, highlights);

    const highlights2 = [
      { label: "Mortgage-Free Date", value: result.summary.mortgageFreeDate, color: C.cyan },
      { label: "Original Payoff Date", value: result.summary.originalPayoffDate, color: C.amber },
      { label: "Final IUL Cash Value", value: fmt(result.summary.finalPolicyCashValue), color: C.purple },
    ];
    drawKpiRow(doc, highlights2);

    // Disclaimer
    doc.fillColor(C.muted).fontSize(7).font("Helvetica")
      .text("This analysis is for illustrative purposes only and does not constitute financial advice. Actual results may vary. IUL projections use non-guaranteed illustrated rates.", 60, doc.page.height - 60, { width: doc.page.width - 120 });

    // ═══════════════════════════════════════════════════════════════════════
    // PAGE 2: CLIENT FACT FINDER SUMMARY
    // ═══════════════════════════════════════════════════════════════════════
    newPage(doc);
    drawPageHeader(doc, "Client Financial Snapshot", `${clientName} — Current Position`);

    drawSectionTitle(doc, "Mortgage Details");
    const mortgageDetails = [
      ["Current Balance", fmt(input.mortgageBalance)],
      ["Interest Rate", fmtPct(input.mortgageRate)],
      ["Monthly Payment", fmt(result.currentPlan.monthlyPayment)],
      ["Remaining Term", `${Math.ceil(result.currentPlan.payoffMonths / 12)} years (${result.currentPlan.payoffMonths} months)`],
      ["Total Interest (Current Plan)", fmt(result.currentPlan.totalInterest)],
    ];
    mortgageDetails.forEach(([label, value]) => {
      doc.fillColor(C.muted).fontSize(9).font("Helvetica").text(label, 50, doc.y, { continued: true, width: 200 });
      doc.fillColor(C.white).font("Helvetica-Bold").text(`  ${value}`, { width: 300 });
      doc.moveDown(0.2);
    });

    doc.moveDown(0.8);
    drawSectionTitle(doc, "Property & Assets");
    const assetDetails = [
      ["Home Market Value", fmt(input.homeMarketValue)],
      ["Home Equity", fmt(input.homeEquityValue)],
      ["Annual Income", fmt(input.annualIncome)],
      ["IUL Premium (20% of Income)", fmt(result.summary.annualIulPremium)],
    ];
    assetDetails.forEach(([label, value]) => {
      doc.fillColor(C.muted).fontSize(9).font("Helvetica").text(label, 50, doc.y, { continued: true, width: 200 });
      doc.fillColor(C.white).font("Helvetica-Bold").text(`  ${value}`, { width: 300 });
      doc.moveDown(0.2);
    });

    doc.moveDown(0.8);
    drawSectionTitle(doc, "Strategy Parameters");
    const stratParams = [
      ["Income Allocation", fmtPct(input.incomeAllocationPct)],
      ["HELOC Funding (Years 1-2)", fmt(result.summary.totalHelocDrawn)],
      ["Total IUL Premiums", fmt(result.summary.totalIulPremiums)],
      ["Total Policy Loans Applied", fmt(result.summary.totalPolicyLoans)],
    ];
    stratParams.forEach(([label, value]) => {
      doc.fillColor(C.muted).fontSize(9).font("Helvetica").text(label, 50, doc.y, { continued: true, width: 200 });
      doc.fillColor(C.white).font("Helvetica-Bold").text(`  ${value}`, { width: 300 });
      doc.moveDown(0.2);
    });

    // ═══════════════════════════════════════════════════════════════════════
    // PAGE 3: CURRENT PLAN — AMORTIZATION SCHEDULE
    // ═══════════════════════════════════════════════════════════════════════
    newPage(doc);
    drawPageHeader(doc, "Current Plan — Standard Amortization", `Total Interest: ${fmt(result.currentPlan.totalInterest)} over ${Math.ceil(result.currentPlan.payoffMonths / 12)} years`);

    drawSectionTitle(doc, "Annual Amortization Summary");

    const amortCols = [
      { label: "Year", x: 40, w: 45 },
      { label: "Beg. Balance", x: 85, w: 80 },
      { label: "Annual Payment", x: 165, w: 80 },
      { label: "Principal", x: 245, w: 75 },
      { label: "Interest", x: 320, w: 75 },
      { label: "End Balance", x: 395, w: 80 },
      { label: "Cum. Interest", x: 475, w: 80 },
    ];
    drawTableHeader(doc, amortCols);

    // Aggregate by year for current plan
    const currentByYear = new Map<number, { begBal: number; payment: number; principal: number; interest: number; endBal: number; cumInt: number }>();
    for (const row of result.currentPlan.schedule) {
      if (!currentByYear.has(row.year)) {
        currentByYear.set(row.year, { begBal: row.beginningBalance, payment: 0, principal: 0, interest: 0, endBal: 0, cumInt: 0 });
      }
      const yr = currentByYear.get(row.year)!;
      yr.payment += row.payment;
      yr.principal += row.principal;
      yr.interest += row.interest;
      yr.endBal = row.endingBalance;
      yr.cumInt = row.cumulativeInterest;
    }

    let rowCount = 0;
    for (const [year, data] of Array.from(currentByYear)) {
      if (doc.y > doc.page.height - 50) {
        newPage(doc);
        drawPageHeader(doc, "Current Plan — Continued", "Standard Amortization Schedule");
        drawTableHeader(doc, amortCols);
      }
      const highlight = year % 5 === 0;
      drawTableRow(doc, [
        { value: `${year}`, x: 40, w: 45 },
        { value: fmt(data.begBal), x: 85, w: 80 },
        { value: fmt(data.payment), x: 165, w: 80 },
        { value: fmt(data.principal), x: 245, w: 75 },
        { value: fmt(data.interest), x: 320, w: 75, color: C.red },
        { value: fmt(data.endBal), x: 395, w: 80 },
        { value: fmt(data.cumInt), x: 475, w: 80, color: C.amber },
      ], highlight);
      rowCount++;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PAGE 4+: RECOMMENDED PLAN — ACCELERATED AMORTIZATION
    // ═══════════════════════════════════════════════════════════════════════
    newPage(doc);
    drawPageHeader(doc, "Recommended Plan — Accelerated Payoff", `Total Interest: ${fmt(result.recommendedPlan.totalInterest)} | Payoff in ${Math.ceil(result.recommendedPlan.payoffMonths / 12)} years`);

    drawSectionTitle(doc, "Accelerated Amortization with IUL Policy Loan Payments");

    const accelCols = [
      { label: "Year", x: 40, w: 40 },
      { label: "Beg. Balance", x: 80, w: 70 },
      { label: "Regular Pmt", x: 150, w: 70 },
      { label: "Extra Principal", x: 220, w: 70 },
      { label: "Total Principal", x: 290, w: 70 },
      { label: "Interest", x: 360, w: 60 },
      { label: "End Balance", x: 420, w: 70 },
      { label: "Source", x: 490, w: 65 },
    ];
    drawTableHeader(doc, accelCols);

    // Aggregate recommended by year
    const accelByYear = new Map<number, { begBal: number; payment: number; principal: number; interest: number; endBal: number; extraPrincipal: number; source: string }>();
    for (const row of result.recommendedPlan.schedule) {
      if (!accelByYear.has(row.year)) {
        accelByYear.set(row.year, { begBal: row.beginningBalance, payment: 0, principal: 0, interest: 0, endBal: 0, extraPrincipal: 0, source: "regular" });
      }
      const yr = accelByYear.get(row.year)!;
      yr.payment += row.payment;
      yr.principal += row.principal;
      yr.interest += row.interest;
      yr.endBal = row.endingBalance;
      yr.extraPrincipal += (row.extraPrincipal ?? 0);
      if (row.source === "iul_loan") yr.source = "IUL Loan";
      else if (row.source === "heloc") yr.source = "HELOC";
    }

    for (const [year, data] of Array.from(accelByYear)) {
      if (doc.y > doc.page.height - 50) {
        newPage(doc);
        drawPageHeader(doc, "Recommended Plan — Continued", "Accelerated Amortization Schedule");
        drawTableHeader(doc, accelCols);
      }
      const hasExtra = data.extraPrincipal > 0;
      drawTableRow(doc, [
        { value: `${year}`, x: 40, w: 40 },
        { value: fmt(data.begBal), x: 80, w: 70 },
        { value: fmt(data.payment - data.extraPrincipal), x: 150, w: 70 },
        { value: hasExtra ? fmt(data.extraPrincipal) : "—", x: 220, w: 70, color: hasExtra ? C.emerald : C.muted },
        { value: fmt(data.principal), x: 290, w: 70 },
        { value: fmt(data.interest), x: 360, w: 60, color: C.red },
        { value: fmt(data.endBal), x: 420, w: 70 },
        { value: data.source !== "regular" ? data.source : "—", x: 490, w: 65, color: data.source === "IUL Loan" ? C.emerald : data.source === "HELOC" ? C.cyan : C.muted },
      ], hasExtra);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PAGE: IUL POLICY SUMMARY
    // ═══════════════════════════════════════════════════════════════════════
    newPage(doc);
    drawPageHeader(doc, "IUL Policy Projection", `Annual Premium: ${fmt(result.summary.annualIulPremium)} | Total Premiums: ${fmt(result.summary.totalIulPremiums)}`);

    drawSectionTitle(doc, "Year-by-Year IUL Cash Value & Policy Loans");

    const iulCols = [
      { label: "Year", x: 40, w: 40 },
      { label: "Premium", x: 80, w: 65 },
      { label: "Source", x: 145, w: 55 },
      { label: "Cash Value", x: 200, w: 75 },
      { label: "Surrender Value", x: 275, w: 75 },
      { label: "Policy Loan", x: 350, w: 75 },
      { label: "Applied To", x: 425, w: 75 },
      { label: "Net CV", x: 500, w: 55 },
    ];
    drawTableHeader(doc, iulCols);

    for (const py of result.iulPolicy) {
      if (doc.y > doc.page.height - 50) {
        newPage(doc);
        drawPageHeader(doc, "IUL Policy — Continued", "Policy Projection");
        drawTableHeader(doc, iulCols);
      }
      const hasLoan = py.policyLoan > 0;
      drawTableRow(doc, [
        { value: `${py.year}`, x: 40, w: 40 },
        { value: py.premium > 0 ? fmt(py.premium) : "—", x: 80, w: 65 },
        { value: py.premiumSource === "heloc" ? "HELOC" : py.premiumSource === "income" ? "Income" : "—", x: 145, w: 55, color: py.premiumSource === "heloc" ? C.cyan : C.muted },
        { value: fmt(py.cashValue), x: 200, w: 75, color: C.blue },
        { value: fmt(py.surrenderValue), x: 275, w: 75 },
        { value: hasLoan ? fmt(py.policyLoan) : "—", x: 350, w: 75, color: hasLoan ? C.emerald : C.muted },
        { value: hasLoan ? "Mortgage" : "—", x: 425, w: 75, color: hasLoan ? C.emerald : C.muted },
        { value: fmt(py.netCashValue), x: 500, w: 55, color: C.purple },
      ], hasLoan);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PAGE: HELOC CYCLE DIAGRAM
    // ═══════════════════════════════════════════════════════════════════════
    newPage(doc);
    drawPageHeader(doc, "HELOC Funding Cycle", `Total HELOC Drawn: ${fmt(result.summary.totalHelocDrawn)}`);

    drawSectionTitle(doc, "How the HELOC-to-IUL Cycle Works");

    const steps = [
      { num: "1", text: "Take 60% HELOC against home equity to fund Year 1 IUL premium", color: C.cyan },
      { num: "2", text: "IUL policy earns 12% annual compound return on cash value", color: C.blue },
      { num: "3", text: "Month 13: Take 80% policy loan against surrender value", color: C.emerald },
      { num: "4", text: "Apply policy loan as principal-only payment to mortgage", color: C.emerald },
      { num: "5", text: "Repeat HELOC draw for Year 2 IUL premium", color: C.cyan },
      { num: "6", text: "Years 3-9: Continue cycle — HELOC supplements IUL funding", color: C.purple },
      { num: "7", text: "Each year's policy loan accelerates mortgage payoff", color: C.emerald },
      { num: "8", text: "Mortgage paid off years early — all saved interest compounds at 7%", color: C.amber },
    ];

    steps.forEach(step => {
      const y = doc.y;
      doc.circle(55, y + 6, 10).fill(step.color);
      doc.fillColor(C.white).fontSize(9).font("Helvetica-Bold").text(step.num, 50, y + 1);
      doc.fillColor(C.text).fontSize(9.5).font("Helvetica").text(step.text, 75, y, { width: doc.page.width - 120 });
      doc.moveDown(0.8);
    });

    doc.moveDown(1);
    drawSectionTitle(doc, "HELOC Draw Schedule");

    const helocCols = [
      { label: "Year", x: 40, w: 50 },
      { label: "Draw Amount", x: 90, w: 90 },
      { label: "Purpose", x: 180, w: 180 },
      { label: "Balance", x: 360, w: 80 },
      { label: "Interest Paid", x: 440, w: 80 },
    ];
    drawTableHeader(doc, helocCols);

    for (const h of result.helocSchedule) {
      drawTableRow(doc, [
        { value: `${h.year}`, x: 40, w: 50 },
        { value: h.drawAmount > 0 ? fmt(h.drawAmount) : "—", x: 90, w: 90, color: h.drawAmount > 0 ? C.cyan : C.muted },
        { value: h.purpose, x: 180, w: 180 },
        { value: fmt(h.balance), x: 360, w: 80 },
        { value: fmt(h.interestPaid), x: 440, w: 80, color: C.amber },
      ], h.drawAmount > 0);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PAGE: INTEREST SAVINGS & COMPOUND GROWTH
    // ═══════════════════════════════════════════════════════════════════════
    newPage(doc);
    drawPageHeader(doc, "Interest Savings & Wealth Accumulation", `${fmt(result.interestSavings.totalInterestSaved)} saved → ${fmt(result.interestSavings.compoundedValue20yr)} at 7% over 20 years`);

    drawSectionTitle(doc, "Year-by-Year Interest Savings Compounding at 7%");

    const savCols = [
      { label: "Year", x: 40, w: 50 },
      { label: "Interest Saved", x: 90, w: 100 },
      { label: "Cumulative Saved", x: 190, w: 100 },
      { label: "Compounded Value (7%)", x: 290, w: 120 },
    ];
    drawTableHeader(doc, savCols);

    for (const s of result.interestSavings.yearByYear) {
      if (doc.y > doc.page.height - 50) {
        newPage(doc);
        drawPageHeader(doc, "Interest Savings — Continued", "Compound Growth at 7%");
        drawTableHeader(doc, savCols);
      }
      drawTableRow(doc, [
        { value: `${s.year}`, x: 40, w: 50 },
        { value: s.interestSaved > 0 ? fmt(s.interestSaved) : "—", x: 90, w: 100, color: s.interestSaved > 0 ? C.emerald : C.muted },
        { value: fmt(s.cumulativeSaved), x: 190, w: 100 },
        { value: fmt(s.compoundedValue), x: 290, w: 120, color: C.blue },
      ], s.year % 5 === 0);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PAGE: EXECUTIVE SUMMARY
    // ═══════════════════════════════════════════════════════════════════════
    newPage(doc);
    drawPageHeader(doc, "Executive Summary", "Side-by-Side Comparison");

    drawSectionTitle(doc, "Current Plan vs. Recommended Plan");

    const comparisonRows = [
      { label: "Total Interest Paid", current: fmt(result.currentPlan.totalInterest), recommended: fmt(result.recommendedPlan.totalInterest), diff: fmt(result.summary.totalInterestSaved), diffColor: C.emerald },
      { label: "Total Payments", current: fmt(result.currentPlan.totalPayments), recommended: fmt(result.recommendedPlan.totalPayments), diff: fmt(result.currentPlan.totalPayments - result.recommendedPlan.totalPayments), diffColor: C.emerald },
      { label: "Payoff Timeline", current: `${Math.ceil(result.currentPlan.payoffMonths / 12)} years`, recommended: `${Math.ceil(result.recommendedPlan.payoffMonths / 12)} years`, diff: `${result.summary.yearsSaved} years saved`, diffColor: C.emerald },
      { label: "Mortgage-Free Date", current: result.summary.originalPayoffDate, recommended: result.summary.mortgageFreeDate, diff: "Earlier!", diffColor: C.emerald },
    ];

    const compCols = [
      { label: "Metric", x: 40, w: 120 },
      { label: "Current Plan", x: 160, w: 110 },
      { label: "Recommended Plan", x: 270, w: 110 },
      { label: "Savings", x: 380, w: 110 },
    ];
    drawTableHeader(doc, compCols);

    comparisonRows.forEach(row => {
      drawTableRow(doc, [
        { value: row.label, x: 40, w: 120, color: C.muted },
        { value: row.current, x: 160, w: 110, color: C.red },
        { value: row.recommended, x: 270, w: 110, color: C.emerald },
        { value: row.diff, x: 380, w: 110, color: row.diffColor },
      ]);
    });

    doc.moveDown(2);
    drawSectionTitle(doc, "Wealth Created Through This Strategy");

    const wealthItems = [
      { label: "Interest Saved (Compounded at 7% for 20 years)", value: fmt(result.interestSavings.compoundedValue20yr), color: C.blue },
      { label: "Final IUL Cash Value", value: fmt(result.summary.finalPolicyCashValue), color: C.purple },
      { label: "Total Wealth Created", value: fmt(result.summary.totalWealthCreated), color: C.emerald },
    ];

    wealthItems.forEach(item => {
      doc.fillColor(C.muted).fontSize(10).font("Helvetica").text(item.label, 50, doc.y, { continued: true, width: 300 });
      doc.fillColor(item.color).font("Helvetica-Bold").text(`  ${item.value}`, { width: 200 });
      doc.moveDown(0.4);
    });

    doc.moveDown(2);
    drawSectionTitle(doc, "Strategy Costs");

    const costItems = [
      { label: "Total IUL Premiums Paid", value: fmt(result.summary.totalIulPremiums) },
      { label: "Total HELOC Interest", value: fmt(result.helocSchedule.reduce((s, h) => s + h.interestPaid, 0)) },
      { label: "Net Benefit", value: fmt(result.summary.totalWealthCreated - result.summary.totalIulPremiums - result.helocSchedule.reduce((s, h) => s + h.interestPaid, 0)) },
    ];

    costItems.forEach(item => {
      doc.fillColor(C.muted).fontSize(10).font("Helvetica").text(item.label, 50, doc.y, { continued: true, width: 300 });
      doc.fillColor(C.white).font("Helvetica-Bold").text(`  ${item.value}`, { width: 200 });
      doc.moveDown(0.4);
    });

    // ═══════════════════════════════════════════════════════════════════════
    // FINAL PAGE: DISCLAIMERS
    // ═══════════════════════════════════════════════════════════════════════
    newPage(doc);
    drawPageHeader(doc, "Important Disclosures", "Please read carefully");

    const disclaimers = [
      "The values shown in this report are based on non-guaranteed illustrated rates. Actual policy performance may vary significantly from the projections shown.",
      "IUL projections assume a 12% annual crediting rate, which represents a non-guaranteed illustrated rate. The actual crediting rate will depend on index performance and policy caps/floors.",
      "HELOC rates are variable and may change over the life of the loan. The rate used in this analysis may not reflect your actual HELOC terms.",
      "Policy loans reduce the death benefit and cash value of the policy. Excessive policy loans may cause the policy to lapse.",
      "This analysis does not account for potential changes in tax law, interest rates, or personal financial circumstances.",
      "Past performance of any index does not guarantee future results. Index-linked insurance products are not direct investments in any index.",
      "Consult with a qualified financial advisor, tax professional, and insurance specialist before implementing this strategy.",
      "This material is for informational purposes only and should not be construed as legal, tax, or financial advice.",
    ];

    disclaimers.forEach(d => {
      if (doc.y > doc.page.height - 60) {
        newPage(doc);
        drawPageHeader(doc, "Disclosures — Continued", "");
      }
      const y = doc.y;
      doc.fillColor(C.amber).fontSize(7).text("●", 50, y + 1);
      doc.fillColor(C.text).fontSize(8.5).font("Helvetica").text(d, 65, y, { width: doc.page.width - 110 });
      doc.moveDown(0.5);
    });

    addPageNumbers(doc);
    doc.end();
  });
}
