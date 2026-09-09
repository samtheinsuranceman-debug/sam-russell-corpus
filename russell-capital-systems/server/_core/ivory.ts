/**
 * Theme 10 — Ivory Clinic. What the client, and the client's CPA, receives.
 *
 * Every PDF, email and shared artifact reads its colours from here. Navy band
 * on top with the company name bold at top left, parchment body, money in
 * antique gold, references and disclosures in muted ink at the bottom. No
 * neon, no city, no glow, no copper button: a navy text link or a navy button.
 */
import type PDFKit from "pdfkit";

export const IVORY = {
  canvas: "#F7F4EE",
  surface: "#FFFFFF",
  rowAlt: "#F1EDE4",
  band: "#0B1220",
  bandText: "#F7F4EE",
  bandMuted: "#C9D0DC",
  ink: "#1C2230",
  heading: "#0B1220",
  navy: "#0B1220",
  muted: "#6A7383",
  faint: "#9AA1AD",
  hairline: "#D9D4C8",
  money: "#8A6A1F",
  positive: "#3D6B4F",
  negative: "#A3322D",
  warn: "#8A6A1F",
  steel: "#3E5F8A",
  fill: "#EEF1F5",
};

export const IVORY_COMPANY = "Russell Capital Systems™";

/** Parchment page. Call after every addPage(). */
export function ivoryPage(doc: PDFKit.PDFDocument) {
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(IVORY.canvas);
}

/** The navy band: bold company name top left, the document title under it, a date or subtitle on the right. */
export function ivoryBand(
  doc: PDFKit.PDFDocument,
  opts: { title: string; subtitle?: string; right?: string; height?: number; company?: string },
) {
  const h = opts.height ?? 96;
  doc.rect(0, 0, doc.page.width, h).fill(IVORY.band);
  doc.fillColor(IVORY.bandText).font("Helvetica-Bold").fontSize(13).text(opts.company ?? IVORY_COMPANY, 40, 22, { width: 360 });
  doc.fillColor(IVORY.bandText).font("Helvetica-Bold").fontSize(20).text(opts.title, 40, 44, { width: doc.page.width - 80 });
  if (opts.subtitle) doc.fillColor(IVORY.bandMuted).font("Helvetica").fontSize(10).text(opts.subtitle, 40, 70, { width: doc.page.width - 80 });
  if (opts.right) doc.fillColor(IVORY.bandMuted).font("Helvetica").fontSize(9).text(opts.right, doc.page.width - 240, 24, { width: 200, align: "right" });
  doc.fillColor(IVORY.ink).font("Helvetica");
  doc.y = h + 24;
}

/** References and disclosures in muted ink at the bottom of the current page. */
export function ivoryReferences(doc: PDFKit.PDFDocument, lines: string[], label = "References & disclosures") {
  const width = doc.page.width - 80;
  const bodySize = 7.5;
  const needed = 26 + lines.length * 2 + lines.reduce((n, l) => n + doc.heightOfString(l, { width }) * (bodySize / doc.currentLineHeight()) + 2, 0);
  if (doc.y > doc.page.height - 60 - needed) { doc.addPage(); ivoryPage(doc); }
  const y = doc.page.height - 60 - needed;
  doc.moveTo(40, y).lineTo(doc.page.width - 40, y).strokeColor(IVORY.hairline).lineWidth(0.5).stroke();
  doc.fillColor(IVORY.muted).font("Helvetica-Bold").fontSize(7.5).text(label.toUpperCase(), 40, y + 8, { width, characterSpacing: 0.8 });
  doc.font("Helvetica").fontSize(bodySize).fillColor(IVORY.muted);
  for (const line of lines) doc.text(line, 40, doc.y + 2, { width });
}

/** Money on paper: antique gold, never neon. */
export function ivoryMoney(doc: PDFKit.PDFDocument, text: string, x: number, y: number, opts: PDFKit.Mixins.TextOptions = {}) {
  doc.fillColor(IVORY.money).font("Helvetica-Bold").text(text, x, y, opts);
  doc.fillColor(IVORY.ink).font("Helvetica");
}

/** The email shell: same ivory and navy. Only one CTA and it is navy. */
export const IVORY_EMAIL_CSS = `
  body { margin: 0; padding: 0; background: ${IVORY.canvas}; font-family: -apple-system, BlinkMacSystemFont, 'IBM Plex Sans', 'Inter', sans-serif; color: ${IVORY.ink}; }
  .card { background: ${IVORY.surface}; border: 1px solid ${IVORY.hairline}; border-radius: 12px; padding: 40px; }
  .band { background: ${IVORY.band}; color: ${IVORY.bandText}; padding: 18px 24px; border-radius: 12px 12px 0 0; font-weight: 700; letter-spacing: .02em; }
  h1 { font-size: 24px; font-weight: 700; color: ${IVORY.heading}; margin: 0 0 12px; }
  p { font-size: 15px; line-height: 1.6; color: ${IVORY.ink}; margin: 0 0 16px; }
  .muted { color: ${IVORY.muted}; font-size: 12px; }
  .money { color: ${IVORY.money}; font-variant-numeric: tabular-nums; font-weight: 700; }
  .cta { display: block; background: ${IVORY.navy}; color: ${IVORY.bandText} !important; text-decoration: none; font-weight: 700; font-size: 15px; text-align: center; padding: 14px 28px; border-radius: 10px; margin: 28px 0; }
  .references { border-top: 1px solid ${IVORY.hairline}; padding-top: 14px; margin-top: 24px; color: ${IVORY.muted}; font-size: 11px; line-height: 1.5; }
`;

/** The dark-room palette the templates were written in → Ivory. Order matters: longer keys first. */
export const IVORY_EMAIL_MAP: Array<[string, string]> = [
  // translucent tints
  ["#f59e0b33", "#8A6A1F33"], ["#f59e0b1a", "#8A6A1F1A"], ["#f59e0b0d", "#8A6A1F0D"],
  ["#4f8cff33", "#0B122033"], ["#4f8cff1a", "#0B12201A"], ["#3b82f633", "#0B122033"], ["#3b82f61a", "#0B12201A"],
  ["#22c55e33", "#3D6B4F33"], ["#22c55e1a", "#3D6B4F1A"], ["#ef44441a", "#A3322D1A"],
  // canvases and cards
  ["#060f1e", IVORY.canvas], ["#060e1a", IVORY.canvas], ["#040d1a", IVORY.canvas], ["#0a1628", IVORY.canvas], ["#0f172a", IVORY.canvas],
  ["#0b1628", IVORY.surface], ["#0f1e35", IVORY.rowAlt], ["#0d1f3a", IVORY.rowAlt], ["#162a4a", IVORY.rowAlt], ["#1a2744", IVORY.rowAlt],
  ["#1a3050", IVORY.rowAlt], ["#1a3a5c", IVORY.rowAlt], ["#1e293b", IVORY.rowAlt], ["#334155", IVORY.hairline],
  ["#12233e", IVORY.hairline], ["#1b2a44", IVORY.hairline], ["#e2e8f0", IVORY.hairline], ["#d1fae5", IVORY.fill], ["#065f46", IVORY.fill], ["#064e3b", IVORY.fill],
  // ink
  ["#c8d8ec", IVORY.ink], ["#7a95b8", "#4A5568"], ["#3d5a7a", IVORY.muted], ["#6b8ab5", IVORY.muted], ["#8fa6c4", IVORY.muted],
  ["#4a6a8a", IVORY.muted], ["#4a6585", IVORY.muted], ["#94a3b8", IVORY.muted], ["#64748b", IVORY.muted], ["#475569", IVORY.muted],
  // accents: blue → navy, green → forest, gold → antique gold, red → oxblood ink, indigo/purple → gold
  ["#4f8cff", IVORY.navy], ["#3a7aee", IVORY.navy], ["#3b82f6", IVORY.navy], ["#38bdf8", IVORY.steel], ["#818cf8", IVORY.money], ["#a855f7", IVORY.money],
  ["#10b981", IVORY.positive], ["#22c55e", IVORY.positive], ["#059669", IVORY.positive], ["#16a34a", IVORY.positive], ["#34d399", IVORY.positive],
  ["#6ee7b7", IVORY.positive], ["#06d6a0", IVORY.positive],
  ["#f59e0b", IVORY.money], ["#fbbf24", IVORY.money], ["#f0c040", IVORY.money],
  ["#ef4444", IVORY.negative],
];
