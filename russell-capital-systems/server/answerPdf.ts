// ============================================================
// ANSWER PDF — the every-page advisor's full answering process on paper:
// the question, where it was asked, and every mode's answer, dated, with
// the disclaimer. Emailed to the person on request so they can review it
// at their own pace.
// ============================================================
import PDFDocument from "pdfkit";

export type AnswerSection = { title: string; text: string; via?: string };

export type AnswerPdfInput = {
  question: string;
  pagePath: string;
  sections: AnswerSection[];
  generatedAt: Date;
  recipient?: string;
  siteName?: string;
};

const GREEN = "#15803d";
const INK = "#0f172a";
const MUTED = "#475569";

export function buildAnswerPdf(input: AnswerPdfInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "LETTER", margins: { top: 64, bottom: 64, left: 60, right: 60 }, info: { Title: `Your question, answered — ${input.siteName ?? "Russell Capital Systems"}`, Author: input.siteName ?? "Russell Capital Systems" } });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const site = input.siteName ?? "Russell Capital Systems";
    doc.fillColor(GREEN).font("Helvetica-Bold").fontSize(11).text(site.toUpperCase(), { characterSpacing: 2 });
    doc.moveDown(0.4);
    doc.fillColor(INK).fontSize(22).text("Your question, answered six ways");
    doc.moveDown(0.3);
    doc.fillColor(MUTED).font("Helvetica").fontSize(10).text(`${input.generatedAt.toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" })}${input.recipient ? ` · prepared for ${input.recipient}` : ""} · asked on ${input.pagePath}`);
    doc.moveDown(1);

    doc.fillColor(INK).font("Helvetica-Bold").fontSize(12).text("The question");
    doc.moveDown(0.2);
    doc.font("Helvetica-Oblique").fontSize(12).text(`“${input.question.trim()}”`);
    doc.moveDown(1);

    for (const s of input.sections) {
      if (doc.y > doc.page.height - 160) doc.addPage();
      doc.fillColor(GREEN).font("Helvetica-Bold").fontSize(13).text(s.title);
      doc.moveDown(0.25);
      doc.fillColor(INK).font("Helvetica").fontSize(10.5).text(s.text.trim(), { lineGap: 2.5 });
      if (s.via) { doc.moveDown(0.15); doc.fillColor(MUTED).fontSize(8).text(`Answered via ${s.via}`); }
      doc.moveDown(0.9);
    }

    doc.moveDown(0.5);
    doc.fillColor(MUTED).font("Helvetica").fontSize(8.5).text(
      "Education and projections only — not tax, legal, investment or insurance advice. Figures come from the facts you shared and public sources with their own dates; confirm anything you intend to act on with your licensed professionals. Citations in the legal section are the sources the advisor could name with confidence; verify each at the linked authority before relying on it.",
      { lineGap: 1.5 },
    );
    doc.end();
  });
}
