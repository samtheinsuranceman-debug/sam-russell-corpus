/**
 * Strategy Page PDF Export Service
 * Generates branded PDFs for individual strategy pages:
 * Tax Waterfall, IUL vs Roth, Crypto Corner, Lifetime Income, Growth Annuities
 */

import PDFDocument from "pdfkit";

const COLORS = {
  bg: "#0f1117",
  card: "#1a1d27",
  border: "#2a2d3a",
  text: "#e4e4e7",
  muted: "#a1a1aa",
  blue: "#3b82f6",
  emerald: "#22c55e",
  amber: "#f59e0b",
  purple: "#8b5cf6",
  red: "#ef4444",
  white: "#ffffff",
};

function drawHeader(doc: PDFKit.PDFDocument, title: string, subtitle: string) {
  doc.rect(0, 0, doc.page.width, 100).fill(COLORS.card);
  doc.fillColor(COLORS.blue).fontSize(24).font("Helvetica-Bold").text(title, 40, 30);
  doc.fillColor(COLORS.muted).fontSize(11).font("Helvetica").text(subtitle, 40, 62);
  doc.moveDown(3);
}

function drawSection(doc: PDFKit.PDFDocument, title: string) {
  if (doc.y > doc.page.height - 120) doc.addPage(), doc.rect(0, 0, doc.page.width, doc.page.height).fill(COLORS.bg);
  doc.fillColor(COLORS.blue).fontSize(14).font("Helvetica-Bold").text(title, 40, doc.y);
  doc.moveDown(0.5);
  doc.strokeColor(COLORS.border).lineWidth(1).moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).stroke();
  doc.moveDown(0.8);
}

function drawKV(doc: PDFKit.PDFDocument, label: string, value: string, color?: string) {
  const y = doc.y;
  doc.fillColor(COLORS.muted).fontSize(9).font("Helvetica").text(label, 50, y, { width: 200 });
  doc.fillColor(color ?? COLORS.text).fontSize(10).font("Helvetica-Bold").text(value, 260, y, { width: 280 });
  doc.moveDown(0.5);
}

function drawBullet(doc: PDFKit.PDFDocument, text: string, color?: string) {
  const y = doc.y;
  doc.fillColor(color ?? COLORS.blue).fontSize(8).text("●", 50, y + 1);
  doc.fillColor(COLORS.text).fontSize(10).font("Helvetica").text(text, 65, y, { width: doc.page.width - 110 });
  doc.moveDown(0.3);
}

function addPageNumbers(doc: PDFKit.PDFDocument) {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc.fillColor(COLORS.muted).fontSize(8).font("Helvetica")
      .text(`Page ${i + 1} of ${range.count}`, 0, doc.page.height - 30, { align: "center", width: doc.page.width });
  }
}

function addDisclaimer(doc: PDFKit.PDFDocument) {
  doc.addPage();
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(COLORS.bg);
  drawHeader(doc, "Important Disclosures", "Please read carefully");
  const disclaimers = [
    "The values shown are based on non-guaranteed illustrated rates. Actual performance may vary significantly.",
    "Past performance of any index does not guarantee future results.",
    "Roth conversions are taxable events. Consult with a qualified tax professional before implementing any conversion strategy.",
    "This material is for informational purposes only and should not be construed as legal, tax, or financial advice.",
    "Insurance products are subject to the claims-paying ability of the issuing insurance company.",
    "Cryptocurrency investments are highly volatile and may result in significant loss of principal.",
    "Russell Capital Systems™ provides educational tools and projections. All investment decisions should be made in consultation with qualified financial professionals.",
  ];
  for (const d of disclaimers) {
    drawBullet(doc, d, COLORS.amber);
    doc.moveDown(0.3);
  }
}

const fmt = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
const pct = (n: number) => `${(n * 100).toFixed(2)}%`;

// ─── Generic Strategy PDF ─────────────────────────────────────────────────
export interface StrategyPdfInput {
  pageTitle: string;
  clientName?: string;
  advisorName?: string;
  sections: Array<{
    title: string;
    items: Array<{ label: string; value: string; color?: string }>;
  }>;
  bullets?: string[];
  notes?: string;
}

export function generateStrategyPdf(input: StrategyPdfInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "LETTER", margins: { top: 40, bottom: 40, left: 40, right: 40 }, bufferPages: true });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Cover
    doc.rect(0, 0, doc.page.width, doc.page.height).fill(COLORS.bg);
    doc.fillColor(COLORS.blue).fontSize(28).font("Helvetica-Bold").text(input.pageTitle, 60, 180, { width: doc.page.width - 120 });
    doc.moveDown(1);
    if (input.clientName) doc.fillColor(COLORS.text).fontSize(14).font("Helvetica").text(`Prepared for: ${input.clientName}`, 60);
    if (input.advisorName) { doc.moveDown(0.3); doc.fillColor(COLORS.muted).fontSize(12).text(`Advisor: ${input.advisorName}`, 60); }
    doc.moveDown(1);
    doc.fillColor(COLORS.muted).fontSize(10).text(`Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, 60);
    doc.fillColor(COLORS.muted).fontSize(8).text("Russell Capital Systems™ — Turn Capital Into Income™", 60, doc.page.height - 60);

    // Sections
    for (const section of input.sections) {
      doc.addPage();
      doc.rect(0, 0, doc.page.width, doc.page.height).fill(COLORS.bg);
      drawSection(doc, section.title);
      for (const item of section.items) {
        drawKV(doc, item.label, item.value, item.color);
      }
    }

    // Bullets
    if (input.bullets?.length) {
      drawSection(doc, "Key Insights");
      for (const b of input.bullets) {
        drawBullet(doc, b, COLORS.emerald);
        doc.moveDown(0.2);
      }
    }

    // Notes
    if (input.notes) {
      drawSection(doc, "Advisor Notes");
      doc.fillColor(COLORS.text).fontSize(10).font("Helvetica").text(input.notes, 50, doc.y, { width: doc.page.width - 100 });
    }

    addDisclaimer(doc);
    addPageNumbers(doc);
    doc.end();
  });
}
