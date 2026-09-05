import PDFDocument from "pdfkit";
import { getClientById, getStrategiesByClient, getClientNotes } from "./db";

const GREEN = "#22c55e";
const DARK = "#0a1628";
const GRAY = "#7a95b8";
const WHITE = "#ffffff";

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

export async function generateClientReport(clientId: number, workspaceId: number): Promise<Buffer> {
  const client = await getClientById(clientId, workspaceId);
  if (!client) throw new Error("Client not found");

  const strategies = await getStrategiesByClient(clientId);
  const notes = await getClientNotes(clientId, workspaceId);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "LETTER", margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // ─── Header ──────────────────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 80).fill(DARK);
    doc.fontSize(22).fillColor(GREEN).text("Russell Capital Systems™", 50, 25, { continued: false });
    doc.fontSize(9).fillColor(GRAY).text("Turn Capital Into Income™", 50, 52);
    doc.fontSize(9).fillColor(GRAY).text(`Report generated ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, 50, 65);

    doc.moveDown(2);

    // ─── Client Profile ──────────────────────────────────────────────────
    doc.fontSize(16).fillColor("#1a3055").text("Client Profile", 50);
    doc.moveDown(0.5);

    const netWorth = Number(client.iraBalance ?? 0) + Number(client.rothBalance ?? 0) +
      Number(client.taxableAssets ?? 0) + Number(client.realEstateEquity ?? 0) +
      Number(client.lifeInsuranceCv ?? 0);

    const profileRows: [string, string][] = [
      ["Name", client.name],
      ["Age", client.age ? String(client.age) : "N/A"],
      ["Filing Status", client.filingStatus ?? "N/A"],
      ["Annual Income", client.income ? fmt(Number(client.income)) : "N/A"],
      ["Total Net Worth", fmt(netWorth)],
      ["IRA Balance", client.iraBalance ? fmt(Number(client.iraBalance)) : "N/A"],
      ["Roth Balance", client.rothBalance ? fmt(Number(client.rothBalance)) : "N/A"],
      ["Real Estate Equity", client.realEstateEquity ? fmt(Number(client.realEstateEquity)) : "N/A"],
      ["Life Insurance CV", client.lifeInsuranceCv ? fmt(Number(client.lifeInsuranceCv)) : "N/A"],
    ];

    for (const [label, value] of profileRows) {
      doc.fontSize(10).fillColor(GRAY).text(label, 60, undefined, { continued: true, width: 200 });
      doc.fillColor("#1a3055").text(value, { align: "left" });
    }

    doc.moveDown(1.5);

    // ─── Metric Projections ──────────────────────────────────────────────
    doc.fontSize(16).fillColor("#1a3055").text("Financial Projections", 50);
    doc.moveDown(0.5);

    const age = client.age ?? 45;
    const income = Number(client.income ?? 0);
    const ira = Number(client.iraBalance ?? 0);
    const roth = Number(client.rothBalance ?? 0);
    const re = Number(client.realEstateEquity ?? 0);
    const lifeIns = Number(client.lifeInsuranceCv ?? 0);

    const projections: [string, string, string][] = [
      ["Net Worth Projection", fmt(netWorth * Math.pow(1.07, Math.max(0, 85 - age))), `by ${new Date().getFullYear() + Math.max(0, 85 - age)}`],
      ["Debt Destruction", fmt(re * 0.4), `Mortgage paid off by ${new Date().getFullYear() + Math.min(15, Math.max(5, Math.round(re * 0.4 / (income * 0.15))))}`],
      ["Income Engine", fmt(income * 0.8), `Tax-free income in ${Math.max(3, Math.round((65 - age) / 2))} years`],
      ["Policy Values", lifeIns > 0 ? fmt(lifeIns * 1.5) : fmt(income * 0.8 * 8), "Projected cash value"],
    ];

    for (const [label, value, note] of projections) {
      doc.fontSize(11).fillColor(GREEN).text(`● ${label}`, 60);
      doc.fontSize(10).fillColor("#1a3055").text(`  ${value} — ${note}`, 75);
      doc.moveDown(0.3);
    }

    doc.moveDown(1.5);

    // ─── Strategy History ────────────────────────────────────────────────
    doc.fontSize(16).fillColor("#1a3055").text("Strategy History", 50);
    doc.moveDown(0.5);

    if (strategies.length === 0) {
      doc.fontSize(10).fillColor(GRAY).text("No strategies generated yet.", 60);
    } else {
      for (const s of strategies.slice(0, 5)) {
        const date = new Date(s.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        doc.fontSize(11).fillColor("#1a3055").text(`${date} — ${s.generatedBy ?? "AI"}`, 60);
        if (s.summary) {
          doc.fontSize(9).fillColor(GRAY).text(s.summary.slice(0, 300), 75, undefined, { width: 450 });
        }
        if (s.taxPlan) {
          doc.fontSize(9).fillColor(GRAY).text(`Tax: ${s.taxPlan.slice(0, 200)}`, 75, undefined, { width: 450 });
        }
        doc.moveDown(0.5);
      }
    }

    // ─── Recent Notes ────────────────────────────────────────────────────
    if (doc.y > 600) doc.addPage();
    doc.moveDown(1);
    doc.fontSize(16).fillColor("#1a3055").text("Recent Activity Notes", 50);
    doc.moveDown(0.5);

    if (notes.length === 0) {
      doc.fontSize(10).fillColor(GRAY).text("No notes logged yet.", 60);
    } else {
      for (const n of notes.slice(0, 10)) {
        const date = new Date(n.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const typeColors: Record<string, string> = { call: "#22c55e", meeting: "#3b82f6", email: "#a78bfa", task: "#f0c040" };
        const color = typeColors[n.noteType ?? "general"] ?? GRAY;
        doc.fontSize(9).fillColor(color).text(`[${(n.noteType ?? "note").toUpperCase()}] ${date}`, 60, undefined, { continued: true });
        doc.fillColor("#1a3055").text(` — ${n.content.slice(0, 200)}`);
        doc.moveDown(0.3);
      }
    }

    // ─── Footer ──────────────────────────────────────────────────────────
    doc.moveDown(2);
    doc.fontSize(8).fillColor(GRAY).text(
      "This report is generated by Russell Capital Systems™ for informational purposes only. It does not constitute financial advice.",
      50, undefined, { width: 500, align: "center" }
    );

    doc.end();
  });
}
