import PDFDocument from "pdfkit";

const GREEN = "#22c55e";
const DARK = "#0a1628";
const BLUE = "#3b82f6";
const AMBER = "#f59e0b";
const GRAY = "#7a95b8";
const WHITE = "#ffffff";
const PURPLE = "#a855f7";

function fmtFull(n: number): string {
  return `$${Math.round(n).toLocaleString()}`;
}

interface SavedStrategy {
  id: number;
  strategyLabel: string;
  strategyType: string;
  clientName?: string | null;
  carrierName?: string | null;
  advisorName?: string | null;
  version?: number | null;
  parentStrategyId?: number | null;
  notes?: string | null;
  createdAt: Date | string;
  inputsJson: any;
  summaryJson: any;
  iulProjectionJson?: any;
}

export async function generateBatchStrategyPdf(params: {
  clientName: string;
  advisorName: string;
  strategies: SavedStrategy[];
  generatedDate?: string;
}): Promise<Buffer> {
  const { clientName, advisorName, strategies, generatedDate } = params;
  const dateStr = generatedDate || new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const doc = new PDFDocument({
    size: "LETTER",
    margins: { top: 50, bottom: 60, left: 50, right: 50 },
    bufferPages: true,
  });

  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));

  const W = 512; // usable width (612 - 50 - 50)

  // ── Cover Page ──
  doc.rect(0, 0, 612, 792).fill(DARK);
  doc.fontSize(10).fillColor(GREEN).text("RUSSELL CAPITAL SYSTEMS", 50, 80, { align: "center" });
  doc.moveDown(2);
  doc.fontSize(28).fillColor(WHITE).text("Strategy Portfolio Report", 50, 150, { align: "center" });
  doc.moveDown(0.5);
  doc.fontSize(14).fillColor(GRAY).text(`Prepared for ${clientName}`, 50, 200, { align: "center" });
  doc.moveDown(0.3);
  doc.fontSize(11).fillColor(GRAY).text(`Advisor: ${advisorName}`, 50, 225, { align: "center" });
  doc.moveDown(0.3);
  doc.fontSize(11).fillColor(GRAY).text(dateStr, 50, 250, { align: "center" });
  doc.moveDown(2);
  doc.fontSize(11).fillColor(GRAY).text(`${strategies.length} Strategies Included`, 50, 300, { align: "center" });

  // Compliance notice on cover
  doc.fontSize(8).fillColor(GRAY).text(
    "CONFIDENTIAL — This document is prepared for compliance filing and client records. " +
    "Projections are hypothetical and do not guarantee future results. Past performance is not indicative of future returns.",
    50, 680, { align: "center", width: W }
  );

  // ── Table of Contents ──
  doc.addPage();
  doc.rect(0, 0, 612, 792).fill(DARK);
  doc.fontSize(18).fillColor(WHITE).text("Table of Contents", 50, 50);
  doc.moveTo(50, 78).lineTo(562, 78).strokeColor(GREEN).lineWidth(1).stroke();

  let tocY = 100;
  strategies.forEach((s, i) => {
    const versionStr = s.version && s.version > 1 ? ` (v${s.version})` : "";
    doc.fontSize(11).fillColor(WHITE).text(`${i + 1}.`, 50, tocY, { width: 25 });
    doc.fontSize(11).fillColor(WHITE).text(`${s.strategyLabel}${versionStr}`, 75, tocY, { width: 350 });
    doc.fontSize(9).fillColor(GRAY).text(
      new Date(s.createdAt).toLocaleDateString(),
      450, tocY, { width: 100, align: "right" }
    );
    tocY += 22;
    if (tocY > 700) {
      doc.addPage();
      doc.rect(0, 0, 612, 792).fill(DARK);
      tocY = 50;
    }
  });

  // ── Strategy Pages ──
  for (let idx = 0; idx < strategies.length; idx++) {
    const s = strategies[idx];
    const summary = s.summaryJson as any;
    const inputs = s.inputsJson as any;
    const iulRows = s.iulProjectionJson as any[] | null;

    doc.addPage();
    doc.rect(0, 0, 612, 792).fill(DARK);

    // Header
    const versionStr = s.version && s.version > 1 ? ` — v${s.version}` : "";
    doc.fontSize(16).fillColor(WHITE).text(
      `Strategy ${idx + 1}: ${s.strategyLabel}${versionStr}`,
      50, 50, { width: W }
    );
    doc.moveTo(50, 75).lineTo(562, 75).strokeColor(GREEN).lineWidth(1).stroke();

    // Metadata
    let y = 90;
    const metaRows = [
      ["Client", s.clientName ?? clientName],
      ["Advisor", s.advisorName ?? advisorName],
      ["Carrier", s.carrierName ?? "Generic IUL"],
      ["Date Created", new Date(s.createdAt).toLocaleDateString()],
      ["Strategy Type", s.strategyType],
    ];
    if (s.notes) metaRows.push(["Notes", s.notes]);

    for (const [label, value] of metaRows) {
      doc.fontSize(9).fillColor(GRAY).text(label + ":", 50, y, { width: 100 });
      doc.fontSize(9).fillColor(WHITE).text(String(value), 155, y, { width: W - 105 });
      y += 16;
    }

    // Key Input Parameters
    y += 10;
    doc.fontSize(12).fillColor(GREEN).text("Input Parameters", 50, y);
    y += 18;

    if (inputs) {
      const inputRows = [
        ["IRA Balance", fmtFull(inputs.iraBalance ?? 0)],
        ["Conversion", `${((inputs.conversionPortion ?? 1) * 100).toFixed(0)}%`],
        ["Home Equity", fmtFull(inputs.homeEquity ?? 0)],
        ["Tax Bracket", `${((inputs.currentTaxBracket ?? 0.24) * 100).toFixed(0)}%`],
        ["IUL Years", String(inputs.iulYears ?? 20)],
        ["Rental Yield", `${((inputs.rentalGrossYield ?? 0.20) * 100).toFixed(0)}%`],
        ["RE Appreciation", `${((inputs.realEstateAppreciation ?? 0.05) * 100).toFixed(0)}%`],
      ];

      // Two-column layout
      const colW = W / 2;
      for (let r = 0; r < inputRows.length; r++) {
        const col = r % 2;
        const rowIdx = Math.floor(r / 2);
        const xOff = col * colW;
        if (col === 0 && r > 0) y += 16;
        doc.fontSize(9).fillColor(GRAY).text(inputRows[r][0] + ":", 50 + xOff, y, { width: 100 });
        doc.fontSize(9).fillColor(WHITE).text(inputRows[r][1], 155 + xOff, y, { width: 100 });
      }
      if (inputRows.length % 2 !== 0) y += 16;
      y += 10;
    }

    // Summary Metrics
    y += 10;
    doc.fontSize(12).fillColor(GREEN).text("Summary Metrics", 50, y);
    y += 18;

    if (summary) {
      const metrics = [
        { label: "IUL Net Cash Value", value: fmtFull(summary.finalNetCashValue ?? 0), color: GREEN },
        { label: "Property Equity", value: fmtFull(summary.totalPropertyEquity ?? summary.finalPropertyEquity ?? 0), color: BLUE },
        { label: "Total Rental Income", value: fmtFull(summary.totalRentalIncome ?? 0), color: AMBER },
        { label: "Roth Balance", value: fmtFull(summary.finalRothBalance ?? 0), color: PURPLE },
        { label: "Estimated Net Worth", value: fmtFull(summary.estimatedNetWorth ?? 0), color: WHITE },
      ];

      const boxW = (W - 40) / 3;
      metrics.forEach((m, mi) => {
        const col = mi % 3;
        if (col === 0 && mi > 0) y += 50;
        const bx = 50 + col * (boxW + 20);
        doc.roundedRect(bx, y, boxW, 42, 4).fillAndStroke("#0f1e35", "#12233e");
        doc.fontSize(7).fillColor(GRAY).text(m.label, bx + 8, y + 6, { width: boxW - 16 });
        doc.fontSize(12).fillColor(m.color).text(m.value, bx + 8, y + 20, { width: boxW - 16 });
      });
      y += 60;
    }

    // IUL Projection Table (if available)
    if (iulRows && iulRows.length > 0 && y < 550) {
      y += 10;
      doc.fontSize(12).fillColor(GREEN).text("IUL Projection Summary", 50, y);
      y += 18;

      // Table header
      const cols = ["Year", "Premium", "Account Value", "Loan Balance", "Net Cash Value"];
      const colWidths = [45, 100, 120, 120, 120];
      let xPos = 50;
      cols.forEach((col, ci) => {
        doc.fontSize(8).fillColor(GRAY).text(col, xPos, y, { width: colWidths[ci] });
        xPos += colWidths[ci];
      });
      y += 14;
      doc.moveTo(50, y).lineTo(562, y).strokeColor("#12233e").lineWidth(0.5).stroke();
      y += 4;

      // Show key years: 1, 5, 10, 15, 20 (or last)
      const keyYears = [1, 5, 10, 15, 20];
      const displayRows = iulRows.filter((r: any) => keyYears.includes(r.year) || r.year === iulRows.length);
      for (const row of displayRows) {
        if (y > 700) break;
        xPos = 50;
        const rowData = [
          String(row.year),
          fmtFull(row.premium ?? 0),
          fmtFull(row.accountValue ?? row.endingAccountValue ?? 0),
          fmtFull(row.cumulativeLoanBalance ?? row.loanBalance ?? 0),
          fmtFull(row.netCashValue ?? 0),
        ];
        rowData.forEach((val, ci) => {
          doc.fontSize(8).fillColor(WHITE).text(val, xPos, y, { width: colWidths[ci] });
          xPos += colWidths[ci];
        });
        y += 14;
      }
    }
  }

  // ── Summary Comparison Page ──
  if (strategies.length > 1) {
    doc.addPage();
    doc.rect(0, 0, 612, 792).fill(DARK);
    doc.fontSize(18).fillColor(WHITE).text("Strategy Comparison Summary", 50, 50);
    doc.moveTo(50, 78).lineTo(562, 78).strokeColor(GREEN).lineWidth(1).stroke();

    let y = 100;
    // Comparison table
    const compCols = ["Strategy", "IUL Net Cash", "RE Equity", "Rental Income", "Net Worth"];
    const compWidths = [160, 90, 90, 90, 90];
    let xPos = 50;
    compCols.forEach((col, ci) => {
      doc.fontSize(8).fillColor(GRAY).text(col, xPos, y, { width: compWidths[ci] });
      xPos += compWidths[ci];
    });
    y += 14;
    doc.moveTo(50, y).lineTo(562, y).strokeColor("#12233e").lineWidth(0.5).stroke();
    y += 6;

    for (const s of strategies) {
      if (y > 700) break;
      const summary = s.summaryJson as any;
      const vStr = s.version && s.version > 1 ? ` v${s.version}` : "";
      xPos = 50;
      const rowData = [
        `${s.strategyLabel}${vStr}`,
        fmtFull(summary?.finalNetCashValue ?? 0),
        fmtFull(summary?.totalPropertyEquity ?? summary?.finalPropertyEquity ?? 0),
        fmtFull(summary?.totalRentalIncome ?? 0),
        fmtFull(summary?.estimatedNetWorth ?? 0),
      ];
      rowData.forEach((val, ci) => {
        doc.fontSize(8).fillColor(ci === 0 ? WHITE : GREEN).text(val, xPos, y, { width: compWidths[ci] });
        xPos += compWidths[ci];
      });
      y += 16;
    }

    // Winner highlight
    if (strategies.length >= 2) {
      const best = strategies.reduce((a, b) => {
        const aNet = (a.summaryJson as any)?.estimatedNetWorth ?? 0;
        const bNet = (b.summaryJson as any)?.estimatedNetWorth ?? 0;
        return aNet >= bNet ? a : b;
      });
      y += 20;
      doc.roundedRect(50, y, W, 40, 6).fillAndStroke("#22c55e15", GREEN);
      doc.fontSize(10).fillColor(GREEN).text(
        `★ Recommended: ${best.strategyLabel} — Highest projected net worth of ${fmtFull((best.summaryJson as any)?.estimatedNetWorth ?? 0)}`,
        60, y + 12, { width: W - 20 }
      );
    }
  }

  // ── Disclaimer Page ──
  doc.addPage();
  doc.rect(0, 0, 612, 792).fill(DARK);
  doc.fontSize(14).fillColor(WHITE).text("Disclosures & Disclaimers", 50, 50);
  doc.moveTo(50, 72).lineTo(562, 72).strokeColor(GRAY).lineWidth(0.5).stroke();

  const disclaimers = [
    "This report is prepared for informational and compliance purposes only and does not constitute financial, tax, or legal advice.",
    "All projections are hypothetical and based on assumed rates of return, tax brackets, and market conditions. Actual results may vary significantly.",
    "Past performance is not indicative of future results. Investment returns and principal values will fluctuate.",
    "IUL (Indexed Universal Life) projections assume specific cap rates, floor rates, and cost of insurance charges that may change over the policy's lifetime.",
    "Real estate projections assume consistent rental yields and appreciation rates which are subject to market conditions.",
    "Tax calculations are based on current tax law and may change. Consult a qualified tax professional for specific advice.",
    "This document is confidential and intended solely for the named client and their authorized advisors.",
  ];

  let dy = 90;
  disclaimers.forEach((d, i) => {
    doc.fontSize(9).fillColor(GRAY).text(`${i + 1}. ${d}`, 50, dy, { width: W });
    dy += doc.heightOfString(`${i + 1}. ${d}`, { width: W }) + 8;
  });

  dy += 20;
  doc.fontSize(9).fillColor(WHITE).text(
    `Generated by Russell Capital Systems™ on ${dateStr}`,
    50, dy, { width: W, align: "center" }
  );

  // Add page numbers to all pages
  const totalPages = doc.bufferedPageRange().count;
  for (let i = 0; i < totalPages; i++) {
    doc.switchToPage(i);
    doc.fontSize(7).fillColor(GRAY).text(
      `Page ${i + 1} of ${totalPages}`,
      50, 760, { width: W, align: "center" }
    );
  }

  doc.end();
  return new Promise((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });
}
