/**
 * PDF Export Service
 * Server-side PDF generation for Report Builder and Meeting Agenda
 * Uses PDFKit for high-quality document rendering
 */

import PDFDocument from "pdfkit";

// ─── Color Palette ──────────────────────────────────────────────────────────
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
  white: "#ffffff",
};

// ─── Helpers ────────────────────────────────────────────────────────────────
function drawHeader(doc: PDFKit.PDFDocument, title: string, subtitle: string) {
  doc.rect(0, 0, doc.page.width, 100).fill(COLORS.card);
  doc.fillColor(COLORS.blue).fontSize(24).font("Helvetica-Bold").text(title, 40, 30);
  doc.fillColor(COLORS.muted).fontSize(11).font("Helvetica").text(subtitle, 40, 62);
  doc.moveDown(3);
}

function drawSectionTitle(doc: PDFKit.PDFDocument, title: string, y?: number) {
  const currentY = y ?? doc.y;
  if (currentY > doc.page.height - 120) doc.addPage();
  doc.fillColor(COLORS.blue).fontSize(14).font("Helvetica-Bold").text(title, 40, doc.y);
  doc.moveDown(0.5);
  doc.strokeColor(COLORS.border).lineWidth(1).moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).stroke();
  doc.moveDown(0.8);
}

function drawText(doc: PDFKit.PDFDocument, text: string, opts?: { bold?: boolean; color?: string; indent?: number }) {
  const color = opts?.color ?? COLORS.text;
  const font = opts?.bold ? "Helvetica-Bold" : "Helvetica";
  const indent = opts?.indent ?? 40;
  doc.fillColor(color).fontSize(10).font(font).text(text, indent, doc.y, { width: doc.page.width - 80 });
}

function drawBullet(doc: PDFKit.PDFDocument, text: string, bulletColor?: string) {
  const y = doc.y;
  doc.fillColor(bulletColor ?? COLORS.blue).fontSize(8).text("●", 50, y + 1);
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

// ─── Report Builder PDF ─────────────────────────────────────────────────────
export interface ReportPdfInput {
  title: string;
  clientName: string;
  advisorName: string;
  reportId: string;
  generatedAt: string;
  sections: Array<{ id: string; order: number; content?: string }>;
  firmName?: string;
}

export function generateReportPdf(input: ReportPdfInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "LETTER",
      margins: { top: 40, bottom: 40, left: 40, right: 40 },
      bufferPages: true,
      info: {
        Title: input.title,
        Author: input.advisorName,
        Subject: `Financial Report for ${input.clientName}`,
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Cover page
    doc.rect(0, 0, doc.page.width, doc.page.height).fill(COLORS.bg);
    doc.fillColor(COLORS.blue).fontSize(32).font("Helvetica-Bold").text(input.title, 60, 200, { width: doc.page.width - 120 });
    doc.moveDown(1);
    doc.fillColor(COLORS.text).fontSize(16).font("Helvetica").text(`Prepared for: ${input.clientName}`, 60);
    doc.moveDown(0.5);
    doc.fillColor(COLORS.muted).fontSize(12).text(`Advisor: ${input.advisorName}`, 60);
    if (input.firmName) {
      doc.moveDown(0.3);
      doc.text(`Firm: ${input.firmName}`, 60);
    }
    doc.moveDown(1);
    doc.fillColor(COLORS.muted).fontSize(10).text(`Report ID: ${input.reportId}`, 60);
    doc.text(`Generated: ${new Date(input.generatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, 60);

    // Disclaimer footer on cover
    doc.fillColor(COLORS.muted).fontSize(8).font("Helvetica")
      .text("This report is for informational purposes only and does not constitute financial advice.", 60, doc.page.height - 80, { width: doc.page.width - 120 });

    // Section pages
    for (const section of input.sections) {
      doc.addPage();
      doc.rect(0, 0, doc.page.width, doc.page.height).fill(COLORS.bg);

      const sectionName = section.id.replace(/[-_]/g, " ").replace(/\b\w/g, l => l.toUpperCase());
      drawHeader(doc, sectionName, `Section ${section.order} of ${input.sections.length}`);

      if (section.content) {
        drawText(doc, section.content);
      } else {
        // Generate placeholder content based on section type
        const content = getSectionContent(section.id, input.clientName);
        for (const line of content) {
          if (line.startsWith("##")) {
            drawSectionTitle(doc, line.replace("## ", ""));
          } else if (line.startsWith("- ")) {
            drawBullet(doc, line.replace("- ", ""));
          } else {
            drawText(doc, line);
            doc.moveDown(0.3);
          }
        }
      }
    }

    // Final disclaimer page
    doc.addPage();
    doc.rect(0, 0, doc.page.width, doc.page.height).fill(COLORS.bg);
    drawHeader(doc, "Important Disclosures", "Please read carefully");
    const disclaimers = [
      "The values shown in this report are based on non-guaranteed illustrated rates. Actual policy performance may vary significantly.",
      "Past performance of any index does not guarantee future results. Index-linked insurance products are not direct investments in any index.",
      "Roth conversions are taxable events. Consult with a qualified tax professional before implementing any conversion strategy.",
      "This material is for informational purposes only and should not be construed as legal, tax, or financial advice.",
      "Insurance products are subject to the claims-paying ability of the issuing insurance company.",
      "Monte Carlo simulations use random sampling to model possible outcomes. Results represent probability distributions, not predictions.",
    ];
    for (const d of disclaimers) {
      drawBullet(doc, d, COLORS.amber);
      doc.moveDown(0.3);
    }

    addPageNumbers(doc);
    doc.end();
  });
}

// ─── Meeting Agenda PDF ─────────────────────────────────────────────────────
export interface AgendaPdfInput {
  title: string;
  clientName: string;
  meetingType: string;
  duration: number;
  blocks: Array<{
    time: string;
    topic: string;
    talkingPoints: string[];
    resources?: string[];
  }>;
  keyQuestions?: string[];
  followUpActions?: string[];
  advisorName?: string;
  firmName?: string;
}

export function generateAgendaPdf(input: AgendaPdfInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "LETTER",
      margins: { top: 40, bottom: 40, left: 40, right: 40 },
      bufferPages: true,
      info: {
        Title: input.title,
        Author: input.advisorName ?? "Advisor",
        Subject: `Meeting Agenda for ${input.clientName}`,
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Page background
    doc.rect(0, 0, doc.page.width, doc.page.height).fill(COLORS.bg);

    // Header
    drawHeader(doc, input.title, `Client: ${input.clientName} | ${input.meetingType.replace(/_/g, " ")} | ${input.duration} minutes`);

    if (input.advisorName) {
      drawText(doc, `Advisor: ${input.advisorName}${input.firmName ? ` — ${input.firmName}` : ""}`, { color: COLORS.muted });
      doc.moveDown(0.3);
    }
    drawText(doc, `Date: ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`, { color: COLORS.muted });
    doc.moveDown(1.5);

    // Agenda Blocks
    drawSectionTitle(doc, "Agenda");
    for (const block of input.blocks) {
      if (doc.y > doc.page.height - 150) {
        doc.addPage();
        doc.rect(0, 0, doc.page.width, doc.page.height).fill(COLORS.bg);
      }

      // Time badge + topic
      doc.fillColor(COLORS.blue).fontSize(10).font("Helvetica-Bold").text(`[${block.time}]`, 40, doc.y);
      doc.fillColor(COLORS.white).fontSize(12).font("Helvetica-Bold").text(block.topic, 40, doc.y);
      doc.moveDown(0.4);

      // Talking points
      for (const tp of block.talkingPoints) {
        drawBullet(doc, tp);
      }

      // Resources
      if (block.resources?.length) {
        doc.moveDown(0.2);
        drawText(doc, `Resources: ${block.resources.join(", ")}`, { color: COLORS.muted, indent: 65 });
      }
      doc.moveDown(0.8);
    }

    // Key Questions
    if (input.keyQuestions?.length) {
      if (doc.y > doc.page.height - 150) {
        doc.addPage();
        doc.rect(0, 0, doc.page.width, doc.page.height).fill(COLORS.bg);
      }
      drawSectionTitle(doc, "Key Questions to Ask");
      input.keyQuestions.forEach((q, i) => {
        drawText(doc, `${i + 1}. ${q}`);
        doc.moveDown(0.3);
      });
    }

    // Follow-Up Actions
    if (input.followUpActions?.length) {
      if (doc.y > doc.page.height - 150) {
        doc.addPage();
        doc.rect(0, 0, doc.page.width, doc.page.height).fill(COLORS.bg);
      }
      doc.moveDown(0.5);
      drawSectionTitle(doc, "Follow-Up Actions");
      for (const action of input.followUpActions) {
        drawBullet(doc, action, COLORS.emerald);
      }
    }

    addPageNumbers(doc);
    doc.end();
  });
}

// ─── Section Content Generator ──────────────────────────────────────────────
function getSectionContent(sectionId: string, clientName: string): string[] {
  const sections: Record<string, string[]> = {
    "portfolio_overview": [
      `## Portfolio Overview for ${clientName}`,
      `This section provides a comprehensive view of ${clientName}'s current asset allocation and investment positions.`,
      "- Traditional IRA holdings and contribution history",
      "- Roth IRA positions and conversion opportunities",
      "- Taxable investment accounts",
      "- Real estate equity positions",
      "- Life insurance cash value accumulation",
      "",
      "Asset allocation targets should be reviewed annually to ensure alignment with risk tolerance and retirement timeline.",
    ],
    "key_metrics": [
      "## Key Performance Metrics",
      "This section highlights the most important financial metrics for monitoring progress toward retirement goals.",
      "- Net worth trajectory and growth rate",
      "- Savings rate as percentage of gross income",
      "- Tax efficiency ratio across all accounts",
      "- Insurance coverage adequacy score",
      "- Estate planning readiness index",
    ],
    "recommendations": [
      "## Strategic Recommendations",
      "Based on the analysis of current positions and market conditions, the following recommendations are provided:",
      "- Review and potentially increase Roth conversion amounts given current tax bracket",
      "- Consider additional IUL funding to maximize tax-free retirement income",
      "- Evaluate premium financing options for high-net-worth strategies",
      "- Update beneficiary designations across all accounts",
      "- Schedule annual policy review with carrier representatives",
    ],
    "iul_summary": [
      "## IUL Policy Summary",
      "This section details the current indexed universal life insurance policy positions and projected performance.",
      "- Current cash value and death benefit amounts",
      "- Premium payment schedule and status",
      "- Index crediting strategy allocation",
      "- Historical crediting rate performance",
      "- Projected cash value at key milestones (years 10, 20, 30)",
    ],
    "index_performance": [
      "## Index Crediting Performance",
      "Analysis of index performance across selected crediting strategies.",
      "- S&P 500 annual point-to-point results",
      "- Uncapped index participation rates",
      "- Floor protection activation frequency",
      "- Comparison to fixed account alternatives",
    ],
    "cash_value_projection": [
      "## Cash Value Projection",
      "Year-by-year projection of policy cash value under illustrated and guaranteed scenarios.",
      "- Illustrated rate scenario (current non-guaranteed rates)",
      "- Mid-point scenario (50% of illustrated rate)",
      "- Guaranteed minimum scenario",
      "- Breakeven analysis for premium recovery",
    ],
    "roth_summary": [
      "## Roth Conversion Strategy Summary",
      "Overview of the multi-year Roth conversion ladder strategy.",
      "- Optimal annual conversion amounts based on tax bracket analysis",
      "- Projected tax savings over the conversion period",
      "- Impact on required minimum distributions (RMDs)",
      "- Medicare IRMAA surcharge considerations",
    ],
    "tax_impact": [
      "## Tax Impact Analysis",
      "Detailed analysis of the tax implications of the recommended strategy.",
      "- Current vs. projected effective tax rates",
      "- Tax bracket waterfall visualization",
      "- State tax considerations",
      "- Capital gains tax optimization opportunities",
    ],
    "conversion_schedule": [
      "## Conversion Schedule",
      "Recommended year-by-year Roth conversion amounts and timing.",
      "- Annual conversion targets aligned with tax bracket boundaries",
      "- Estimated tax liability per conversion year",
      "- Cumulative tax savings projection",
      "- Flexibility adjustments for income changes",
    ],
    "estate_overview": [
      "## Estate Planning Overview",
      "Comprehensive review of estate planning positions and strategies.",
      "- Current estate value and projected growth",
      "- Federal estate tax exposure analysis",
      "- State estate/inheritance tax considerations",
      "- Trust structure recommendations",
    ],
    "tax_projections": [
      "## Estate Tax Projections",
      "Multi-year projection of estate tax liability under current and proposed tax laws.",
      "- Current exemption utilization",
      "- Projected estate value at various time horizons",
      "- ILIT strategy impact on estate tax reduction",
      "- Gifting strategy recommendations",
    ],
    "trust_analysis": [
      "## Trust Structure Analysis",
      "Review of existing and recommended trust arrangements.",
      "- Irrevocable Life Insurance Trust (ILIT) benefits",
      "- Spousal Lifetime Access Trust (SLAT) considerations",
      "- Grantor Retained Annuity Trust (GRAT) opportunities",
      "- Dynasty trust for multi-generational wealth transfer",
    ],
    "compliance_summary": [
      "## Compliance Summary",
      "Overview of regulatory compliance status and documentation.",
      "- Suitability documentation status",
      "- Best interest standard compliance",
      "- Disclosure requirements met",
      "- Annual review completion status",
    ],
    "suitability_checks": [
      "## Suitability Assessment",
      "Detailed suitability analysis for all recommended products and strategies.",
      "- Risk tolerance alignment verification",
      "- Time horizon appropriateness",
      "- Liquidity needs assessment",
      "- Product suitability scoring",
    ],
    "disclosure_log": [
      "## Disclosure Log",
      "Record of all required disclosures provided to the client.",
      "- Product disclosure documents delivered",
      "- Fee transparency documentation",
      "- Conflict of interest disclosures",
      "- Privacy policy acknowledgments",
    ],
    "practice_overview": [
      "## Practice Overview",
      "High-level summary of practice performance metrics.",
      "- Total clients under management",
      "- Assets under management (AUM) growth",
      "- Revenue trends and projections",
      "- Client retention rate",
    ],
    "growth_metrics": [
      "## Growth Metrics",
      "Key growth indicators for the practice.",
      "- New client acquisition rate",
      "- Average revenue per client",
      "- Referral conversion rate",
      "- Product mix diversification",
    ],
    "revenue_analysis": [
      "## Revenue Analysis",
      "Detailed breakdown of practice revenue streams.",
      "- Commission income by product type",
      "- Fee-based advisory revenue",
      "- Renewal commission trends",
      "- Revenue per advisor metrics",
    ],
    "executive": [
      `## Executive Summary`,
      `This section provides a high-level overview of ${clientName}'s complete financial picture and the key strategies recommended by Russell Capital Systems™, owned by Russell Holdings Management LLC.`,
      "",
      "## What This Report Does For You",
      "This report consolidates your entire financial landscape — income, assets, debts, insurance, tax position, and retirement projections — into a single, actionable document with dollar-quantified recommendations.",
      "",
      "## Opportunities You May Have Overlooked",
      "- Tax bracket optimization through strategic Roth conversions and income shifting",
      "- Unlocking trapped home equity through HELOC strategies that fund tax-advantaged growth",
      "- Insurance policy repositioning to maximize cash value access and tax-free income",
      "- Estate planning structures that can reduce estate tax exposure by 60-80%",
      "",
      "## Key Takeaway",
      "A coordinated, interlocking financial strategy across tax, insurance, investments, and estate planning can produce 2-3x better outcomes than optimizing each area independently.",
      "",
      "## Recommended Next Steps",
      "- Review the Goals Accelerator analysis to see how these strategies achieve your goals faster",
      "- Compare the Do Nothing baseline against the recommended approach",
      "- Schedule a follow-up meeting to discuss implementation timeline",
    ],
    "goals_accelerator": [
      `## Your Stated Goals Accelerator`,
      `This section analyzes how the recommended strategies accelerate ${clientName}'s achievement of their stated financial goals — faster, sooner, with less risk, and more effective use of time and capital.`,
      "",
      "## How These Strategies Accelerate Your Goals",
      "- Each recommended strategy interlocks with others to compound benefits across your financial picture",
      "- Tax savings from one strategy fund growth in another, creating a self-reinforcing cycle",
      "- Risk is reduced through diversification across asset classes, tax treatments, and time horizons",
      "",
      "## Accelerated Timeline Analysis",
      "- Without these strategies: Goals achieved on standard timeline with standard risk",
      "- With these strategies: Goals achieved significantly faster with reduced risk exposure",
      "- Capital efficiency improves as each dollar works harder across multiple strategies",
      "",
      "## Should Your Goals Be Bigger?",
      "Given the power of interlocking strategies, consider whether your original goals were set too conservatively. The strategies in this report may enable you to:",
      "- Retire earlier than planned while maintaining or increasing your lifestyle",
      "- Leave a larger legacy while spending more during retirement",
      "- Build wealth faster by keeping all assets on the move and interlocked for maximum optimization",
      "",
      "## Action: Revisit Your Goal Setting",
      "We recommend returning to the Goals-Based Planning page to set bigger, better goals that fully leverage the strategies available to you.",
    ],
    "tax_bracket_analysis": [
      `## Federal & State Tax Bracket Analysis`,
      `Detailed tax bracket modeling for ${clientName} using 2026 federal and state tax schedules.`,
      "",
      "## Current Tax Position",
      "- Federal marginal tax rate and effective rate",
      "- State income tax rate and bracket position",
      "- Combined total tax burden as percentage of gross income",
      "- Distance to next federal bracket boundary",
      "",
      "## Tax Optimization Opportunities",
      "- Income shifting strategies to reduce marginal rate",
      "- Roth conversion amounts that stay within current bracket",
      "- Tax-loss harvesting opportunities across investment accounts",
      "- Oil & gas investment tax credits and deductions",
      "",
      "## Projected Tax Savings",
      "- Annual federal tax savings from recommended strategies",
      "- Annual state tax savings from recommended strategies",
      "- 20-year cumulative tax savings projection",
      "- Tax savings redirected to HELOC principal paydown and wealth building",
    ],
    "do_nothing_baseline": [
      `## Do Nothing Baseline — What Happens If You Take No Action`,
      `This section compares ${clientName}'s current trajectory (no changes) against the recommended strategy to quantify the cost of inaction.`,
      "",
      "## The Cost of Inaction",
      "Every year without implementing these strategies represents a compounding opportunity cost. The gap between 'do nothing' and 'take action' widens exponentially over time.",
      "",
      "## Key Comparison Metrics",
      "- Net worth at retirement: Do Nothing vs. Recommended",
      "- Monthly retirement income: Do Nothing vs. Recommended",
      "- Total taxes paid over planning horizon: Do Nothing vs. Recommended",
      "- Estate value transferred to heirs: Do Nothing vs. Recommended",
      "- Years to achieve financial independence: Do Nothing vs. Recommended",
      "",
      "## The Compounding Effect of Delay",
      "- Each year of delay reduces the total benefit by an increasing amount",
      "- Tax savings not captured this year cannot be recovered",
      "- Insurance costs increase with age, making delay more expensive",
      "- Market opportunity cost compounds against you",
    ],
    "recommendation_summary": [
      `## Recommendation Summary — Dollar-Quantified Action Plan`,
      `Clear, specific recommendations for ${clientName} with projected dollar benefits and implementation timeline.`,
      "",
      "## Primary Recommendation",
      "Implement the coordinated strategy outlined in this report to maximize wealth accumulation, minimize tax burden, and accelerate goal achievement.",
      "",
      "## Projected Benefits",
      "- Total projected tax savings over planning horizon",
      "- Additional retirement income generated",
      "- Estate value preservation and growth",
      "- Risk reduction through diversification and guarantees",
      "",
      "## Implementation Timeline",
      "- Month 1-2: Tax bracket optimization and Roth conversion planning",
      "- Month 2-3: Insurance portfolio review and repositioning",
      "- Month 3-6: Real estate strategy implementation (HELOC, MYGA ladder)",
      "- Ongoing: Annual review and strategy adjustment",
      "",
      "## Confidence Level: High",
      "These recommendations are based on proven strategies, current tax law, and your specific financial profile. Results may vary based on market conditions and tax law changes.",
    ],
  };

  return sections[sectionId] ?? [
    `## ${sectionId.replace(/[-_]/g, " ").replace(/\b\w/g, l => l.toUpperCase())}`,
    `Detailed analysis for the ${sectionId.replace(/[-_]/g, " ")} section.`,
    "- Key findings and observations",
    "- Data-driven recommendations",
    "- Action items and next steps",
  ];
}
