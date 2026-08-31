import PDFDocument from "pdfkit";

const GREEN = "#22c55e";
const DARK = "#0a1628";
const BLUE = "#3b82f6";
const AMBER = "#f59e0b";
const GRAY = "#7a95b8";
const WHITE = "#ffffff";
const PURPLE = "#a855f7";
const CYAN = "#06b6d4";

function fmtFull(n: number): string {
  return `$${Math.round(n).toLocaleString()}`;
}

function fmtCompact(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

export interface BulkResult {
  clientId: number;
  clientName: string;
  age: number;
  iraBalance: number;
  income: number;
  carrierId: string;
  carrierName: string;
  strategyLabel: string;
  iulNetCash: number;
  reEquity: number;
  rentalIncome: number;
  rothBalance: number;
  netWorth: number;
  error?: string;
}

export interface BulkSummary {
  totalClients: number;
  successfulProjections: number;
  skipped: number;
  totalNetWorth: number;
  avgNetWorth: number;
  topClient: string;
}

export async function generateBulkComparisonPdf(params: {
  advisorName: string;
  results: BulkResult[];
  summary: BulkSummary;
  settings: {
    strategyYears: number;
    solarEquity: boolean;
    iulYears: number;
    autoRecommendCarrier: boolean;
  };
  generatedDate?: string;
}): Promise<Buffer> {
  const { advisorName, results, summary, settings, generatedDate } = params;
  const dateStr = generatedDate || new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const successResults = results.filter(r => !r.error);

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
  doc.fontSize(28).fillColor(WHITE).text("Bulk Strategy", 50, 150, { align: "center" });
  doc.fontSize(28).fillColor(WHITE).text("Comparison Report", 50, 185, { align: "center" });
  doc.moveDown(0.5);
  doc.fontSize(14).fillColor(GRAY).text(`Multi-Client Portfolio Analysis`, 50, 230, { align: "center" });
  doc.moveDown(0.3);
  doc.fontSize(11).fillColor(GRAY).text(`Advisor: ${advisorName}`, 50, 260, { align: "center" });
  doc.moveDown(0.3);
  doc.fontSize(11).fillColor(GRAY).text(dateStr, 50, 285, { align: "center" });

  // Summary stats on cover
  const coverY = 340;
  const statBoxW = (W - 30) / 4;
  const coverStats = [
    { label: "Clients", value: String(summary.totalClients), color: GREEN },
    { label: "Projections", value: String(summary.successfulProjections), color: BLUE },
    { label: "Total Net Worth", value: fmtCompact(summary.totalNetWorth), color: AMBER },
    { label: "Avg Net Worth", value: fmtCompact(summary.avgNetWorth), color: PURPLE },
  ];
  coverStats.forEach((s, i) => {
    const bx = 50 + i * (statBoxW + 10);
    doc.roundedRect(bx, coverY, statBoxW, 55, 4).fillAndStroke("#0f1e35", "#12233e");
    doc.fontSize(7).fillColor(GRAY).text(s.label, bx + 8, coverY + 8, { width: statBoxW - 16, align: "center" });
    doc.fontSize(14).fillColor(s.color).text(s.value, bx + 8, coverY + 26, { width: statBoxW - 16, align: "center" });
  });

  // Settings on cover
  const settY = 420;
  doc.fontSize(10).fillColor(GREEN).text("Batch Settings", 50, settY);
  doc.fontSize(9).fillColor(GRAY).text(`Strategy: ${settings.solarEquity ? "Solar Equity" : `${settings.strategyYears}-Year Non Solar`}`, 50, settY + 18);
  doc.fontSize(9).fillColor(GRAY).text(`IUL Duration: ${settings.iulYears} years`, 50, settY + 34);
  doc.fontSize(9).fillColor(GRAY).text(`Carrier Selection: ${settings.autoRecommendCarrier ? "Auto-Recommended" : "Manual"}`, 50, settY + 50);

  // Compliance notice on cover
  doc.fontSize(8).fillColor(GRAY).text(
    "CONFIDENTIAL — This document is prepared for compliance filing and advisor records. " +
    "Projections are hypothetical and do not guarantee future results. Past performance is not indicative of future returns.",
    50, 680, { align: "center", width: W }
  );

  // ── Cross-Client Comparison Matrix ──
  doc.addPage();
  doc.rect(0, 0, 612, 792).fill(DARK);
  doc.fontSize(18).fillColor(WHITE).text("Cross-Client Comparison Matrix", 50, 50);
  doc.moveTo(50, 78).lineTo(562, 78).strokeColor(GREEN).lineWidth(1).stroke();

  // Table header
  let y = 100;
  const compCols = ["Client", "Age", "IRA Balance", "Carrier", "IUL Net Cash", "RE Equity", "Roth", "Net Worth"];
  const compWidths = [90, 30, 65, 70, 70, 65, 55, 70];
  let xPos = 50;
  compCols.forEach((col, ci) => {
    doc.fontSize(7).fillColor(GREEN).text(col, xPos, y, { width: compWidths[ci] });
    xPos += compWidths[ci];
  });
  y += 14;
  doc.moveTo(50, y).lineTo(562, y).strokeColor("#12233e").lineWidth(0.5).stroke();
  y += 6;

  // Rows
  for (const r of successResults) {
    if (y > 700) {
      doc.addPage();
      doc.rect(0, 0, 612, 792).fill(DARK);
      y = 50;
      // Re-draw header
      xPos = 50;
      compCols.forEach((col, ci) => {
        doc.fontSize(7).fillColor(GREEN).text(col, xPos, y, { width: compWidths[ci] });
        xPos += compWidths[ci];
      });
      y += 14;
      doc.moveTo(50, y).lineTo(562, y).strokeColor("#12233e").lineWidth(0.5).stroke();
      y += 6;
    }

    const isTop = r.clientName === summary.topClient;
    if (isTop) {
      doc.roundedRect(48, y - 2, W + 4, 16, 2).fill("#22c55e10");
    }

    xPos = 50;
    const rowData = [
      r.clientName.length > 14 ? r.clientName.slice(0, 14) + "…" : r.clientName,
      String(r.age),
      fmtCompact(r.iraBalance),
      r.carrierName.length > 12 ? r.carrierName.slice(0, 12) + "…" : r.carrierName,
      fmtFull(r.iulNetCash),
      fmtFull(r.reEquity),
      fmtFull(r.rothBalance),
      fmtFull(r.netWorth),
    ];
    const rowColors = [WHITE, GRAY, GRAY, GRAY, GREEN, BLUE, PURPLE, isTop ? GREEN : WHITE];
    rowData.forEach((val, ci) => {
      doc.fontSize(7).fillColor(rowColors[ci]).text(val, xPos, y, { width: compWidths[ci] });
      xPos += compWidths[ci];
    });
    y += 16;
  }

  // Skipped clients
  const skippedResults = results.filter(r => r.error);
  if (skippedResults.length > 0) {
    y += 10;
    doc.fontSize(9).fillColor(AMBER).text(`Skipped Clients (${skippedResults.length})`, 50, y);
    y += 16;
    for (const r of skippedResults) {
      if (y > 720) break;
      doc.fontSize(8).fillColor(GRAY).text(`• ${r.clientName} — ${r.error}`, 60, y, { width: W - 20 });
      y += 14;
    }
  }

  // Winner highlight
  if (successResults.length >= 2) {
    const best = successResults[0]; // already sorted by netWorth desc
    y += 20;
    if (y > 720) {
      doc.addPage();
      doc.rect(0, 0, 612, 792).fill(DARK);
      y = 50;
    }
    doc.roundedRect(50, y, W, 40, 6).fillAndStroke("#22c55e10", GREEN);
    doc.fontSize(10).fillColor(GREEN).text(
      `★ Top Performer: ${best.clientName} — Projected net worth of ${fmtFull(best.netWorth)} with ${best.carrierName}`,
      60, y + 12, { width: W - 20 }
    );
    y += 50;
  }

  // ── Per-Client Summary Pages ──
  for (let idx = 0; idx < successResults.length; idx++) {
    const r = successResults[idx];

    doc.addPage();
    doc.rect(0, 0, 612, 792).fill(DARK);

    // Header
    doc.fontSize(16).fillColor(WHITE).text(
      `Client ${idx + 1}: ${r.clientName}`,
      50, 50, { width: W }
    );
    doc.moveTo(50, 75).lineTo(562, 75).strokeColor(GREEN).lineWidth(1).stroke();

    // Client profile
    let cy = 90;
    const profileRows = [
      ["Age", String(r.age)],
      ["IRA Balance", fmtFull(r.iraBalance)],
      ["Annual Income", fmtFull(r.income)],
      ["Strategy", r.strategyLabel],
      ["Carrier", r.carrierName],
    ];
    for (const [label, value] of profileRows) {
      doc.fontSize(9).fillColor(GRAY).text(label + ":", 50, cy, { width: 100 });
      doc.fontSize(9).fillColor(WHITE).text(value, 155, cy, { width: W - 105 });
      cy += 16;
    }

    // Projection Metrics
    cy += 15;
    doc.fontSize(12).fillColor(GREEN).text("Projected Outcomes", 50, cy);
    cy += 20;

    const metrics = [
      { label: "IUL Net Cash Value", value: fmtFull(r.iulNetCash), color: GREEN },
      { label: "Real Estate Equity", value: fmtFull(r.reEquity), color: BLUE },
      { label: "Total Rental Income", value: fmtFull(r.rentalIncome), color: CYAN },
      { label: "Roth Balance", value: fmtFull(r.rothBalance), color: PURPLE },
      { label: "Estimated Net Worth", value: fmtFull(r.netWorth), color: WHITE },
    ];

    const boxW = (W - 40) / 3;
    metrics.forEach((m, mi) => {
      const col = mi % 3;
      if (col === 0 && mi > 0) cy += 55;
      const bx = 50 + col * (boxW + 20);
      doc.roundedRect(bx, cy, boxW, 45, 4).fillAndStroke("#0f1e35", "#12233e");
      doc.fontSize(7).fillColor(GRAY).text(m.label, bx + 8, cy + 8, { width: boxW - 16 });
      doc.fontSize(13).fillColor(m.color).text(m.value, bx + 8, cy + 24, { width: boxW - 16 });
    });
    cy += 70;

    // Wealth composition breakdown
    cy += 15;
    doc.fontSize(12).fillColor(GREEN).text("Wealth Composition", 50, cy);
    cy += 20;

    const total = r.iulNetCash + r.reEquity + r.rothBalance;
    if (total > 0) {
      const segments = [
        { label: "IUL Net Cash", pct: (r.iulNetCash / total) * 100, color: GREEN },
        { label: "RE Equity", pct: (r.reEquity / total) * 100, color: BLUE },
        { label: "Roth Balance", pct: (r.rothBalance / total) * 100, color: PURPLE },
      ];

      // Horizontal stacked bar
      const barW = W - 20;
      const barH = 20;
      let barX = 60;
      for (const seg of segments) {
        const segW = (seg.pct / 100) * barW;
        if (segW > 0) {
          doc.rect(barX, cy, segW, barH).fill(seg.color);
          if (segW > 40) {
            doc.fontSize(7).fillColor(WHITE).text(
              `${seg.pct.toFixed(0)}%`,
              barX + 4, cy + 5, { width: segW - 8 }
            );
          }
          barX += segW;
        }
      }
      cy += barH + 10;

      // Legend
      segments.forEach((seg, si) => {
        const lx = 60 + si * 160;
        doc.rect(lx, cy, 8, 8).fill(seg.color);
        doc.fontSize(8).fillColor(GRAY).text(
          `${seg.label}: ${seg.pct.toFixed(1)}%`,
          lx + 14, cy - 1, { width: 140 }
        );
      });
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
    "Carrier recommendations are based on algorithmic scoring and should be validated by a licensed insurance professional.",
    "This document is confidential and intended solely for the named advisor and their authorized compliance officers.",
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
