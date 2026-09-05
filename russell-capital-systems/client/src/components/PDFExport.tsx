import { useState, useCallback } from "react";
import { FileText, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * PDFExport — generates a professional PDF report from strategy/combo data
 * Uses browser's print-to-PDF via a hidden iframe with styled HTML
 */

interface StrategyData {
  id: number;
  title?: string;
  comboName?: string;
  description?: string;
  impactScore?: number;
  clientProfile: {
    name: string;
    profession: string;
    age: number;
    state: string;
    startingNetWorth: number;
    annualIncome: number;
    familyStatus: string;
    taxBracket: string;
  };
  steps: Array<{
    strategyName: string;
    description: string;
    taxSaved: number;
    capitalDeployed: number;
    netWorthAfter: number;
  }>;
  totalTaxSaved: number;
  totalDeployed: number;
  finalNetWorth: number;
  netWorthMultiplier: number;
  timeHorizon: string;
  ircCodes?: string[];
  categories?: string[];
}

function formatMoney(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function generatePDFHTML(data: StrategyData, type: "strategy" | "combo"): string {
  const cp = data.clientProfile;
  const title = type === "strategy" ? data.title : data.comboName;
  const netWorthGrowth = ((data.finalNetWorth - cp.startingNetWorth) / cp.startingNetWorth * 100).toFixed(1);

  const stepsHTML = data.steps.map((step, i) => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-weight:600;color:#1e293b;text-align:center;">${i + 1}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">
        <div style="font-weight:600;color:#1e293b;">${step.strategyName}</div>
        <div style="font-size:12px;color:#64748b;margin-top:4px;">${step.description.substring(0, 200)}${step.description.length > 200 ? '...' : ''}</div>
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right;color:#16a34a;font-weight:600;">${formatMoney(step.taxSaved)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right;color:#2563eb;font-weight:600;">${formatMoney(step.capitalDeployed)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700;color:#1e293b;">${formatMoney(step.netWorthAfter)}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title} — Russell Capital Systems™</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; color: #1e293b; background: #fff; padding: 40px; max-width: 900px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 3px solid #0f172a; }
    .logo { font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }
    .logo span { color: #16a34a; }
    .subtitle { font-size: 11px; color: #64748b; margin-top: 4px; letter-spacing: 1px; text-transform: uppercase; }
    .date { font-size: 12px; color: #64748b; text-align: right; }
    .title-section { margin-bottom: 28px; }
    .title-section h1 { font-size: 22px; font-weight: 800; color: #0f172a; margin-bottom: 8px; }
    .title-section .desc { font-size: 13px; color: #475569; line-height: 1.6; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; margin-right: 6px; margin-bottom: 4px; }
    .badge-green { background: #dcfce7; color: #166534; }
    .badge-blue { background: #dbeafe; color: #1e40af; }
    .badge-purple { background: #f3e8ff; color: #6b21a8; }
    .badge-amber { background: #fef3c7; color: #92400e; }
    .section { margin-bottom: 28px; }
    .section-title { font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 2px solid #e2e8f0; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
    .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; }
    .stat-label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .stat-value { font-size: 20px; font-weight: 800; color: #0f172a; }
    .stat-value.green { color: #16a34a; }
    .stat-value.blue { color: #2563eb; }
    .stat-value.purple { color: #7c3aed; }
    .profile-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 8px; }
    .profile-item { font-size: 12px; }
    .profile-item .label { color: #64748b; font-weight: 500; }
    .profile-item .value { color: #1e293b; font-weight: 600; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { background: #0f172a; color: #fff; padding: 10px 12px; text-align: left; font-weight: 600; font-size: 12px; }
    th:first-child { border-radius: 6px 0 0 0; }
    th:last-child { border-radius: 0 6px 0 0; }
    .summary-bar { display: flex; justify-content: space-between; background: #0f172a; color: #fff; padding: 16px 20px; border-radius: 8px; margin-top: 20px; }
    .summary-item { text-align: center; }
    .summary-item .label { font-size: 10px; opacity: 0.7; text-transform: uppercase; letter-spacing: 0.5px; }
    .summary-item .value { font-size: 18px; font-weight: 800; margin-top: 4px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8; line-height: 1.6; }
    .confidential { background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 10px 14px; font-size: 11px; color: #991b1b; margin-bottom: 20px; font-weight: 500; }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">Russell Capital <span>Systems™</span></div>
      <div class="subtitle">Turn Capital Into Income™</div>
    </div>
    <div class="date">
      <div>Report Generated</div>
      <div style="font-weight:600;color:#1e293b;">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
      <div style="margin-top:4px;">${type === 'strategy' ? `Strategy #${data.id}` : `Combo #${data.id}`}</div>
    </div>
  </div>

  <div class="confidential">
    CONFIDENTIAL — Prepared exclusively for ${cp.name}. This document contains proprietary tax optimization strategies and should not be distributed without authorization from Russell Capital Systems™.
  </div>

  <div class="title-section">
    <h1>${title}</h1>
    ${data.description ? `<div class="desc">${data.description}</div>` : ''}
    <div style="margin-top:10px;">
      ${(data.categories || []).map(c => `<span class="badge badge-blue">${c}</span>`).join('')}
      ${(data.ircCodes || []).map(c => `<span class="badge badge-purple">${c}</span>`).join('')}
      ${data.impactScore ? `<span class="badge badge-amber">Impact: ${data.impactScore}/12</span>` : ''}
    </div>
  </div>

  <div class="section">
    <div class="section-title">Client Profile</div>
    <div class="profile-grid">
      <div class="profile-item"><div class="label">Client</div><div class="value">${cp.name}</div></div>
      <div class="profile-item"><div class="label">Profession</div><div class="value">${cp.profession}</div></div>
      <div class="profile-item"><div class="label">Age</div><div class="value">${cp.age}</div></div>
      <div class="profile-item"><div class="label">State</div><div class="value">${cp.state}</div></div>
      <div class="profile-item"><div class="label">Starting Net Worth</div><div class="value">${formatMoney(cp.startingNetWorth)}</div></div>
      <div class="profile-item"><div class="label">Annual Income</div><div class="value">${formatMoney(cp.annualIncome)}</div></div>
      <div class="profile-item"><div class="label">Family</div><div class="value">${cp.familyStatus}</div></div>
      <div class="profile-item"><div class="label">Tax Bracket</div><div class="value">${cp.taxBracket}</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Key Metrics</div>
    <div class="grid-3">
      <div class="stat-card">
        <div class="stat-label">Total Tax Saved</div>
        <div class="stat-value green">${formatMoney(data.totalTaxSaved)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Final Net Worth</div>
        <div class="stat-value blue">${formatMoney(data.finalNetWorth)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Net Worth Growth</div>
        <div class="stat-value purple">+${netWorthGrowth}%</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Capital Deployed</div>
        <div class="stat-value">${formatMoney(data.totalDeployed)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Wealth Multiplier</div>
        <div class="stat-value">${data.netWorthMultiplier}x</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Time Horizon</div>
        <div class="stat-value" style="font-size:16px;">${data.timeHorizon}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">${type === 'strategy' ? 'Implementation Steps' : 'Strategy Sequence'} (${data.steps.length} Steps)</div>
    <table>
      <thead>
        <tr>
          <th style="width:40px;text-align:center;">#</th>
          <th>Strategy</th>
          <th style="text-align:right;width:110px;">Tax Saved</th>
          <th style="text-align:right;width:110px;">Deployed</th>
          <th style="text-align:right;width:120px;">Net Worth</th>
        </tr>
      </thead>
      <tbody>
        ${stepsHTML}
      </tbody>
    </table>
  </div>

  <div class="summary-bar">
    <div class="summary-item">
      <div class="label">Starting Net Worth</div>
      <div class="value">${formatMoney(cp.startingNetWorth)}</div>
    </div>
    <div class="summary-item">
      <div class="label">→</div>
      <div class="value" style="color:#4ade80;">+${formatMoney(data.totalTaxSaved)} saved</div>
    </div>
    <div class="summary-item">
      <div class="label">Final Net Worth</div>
      <div class="value" style="color:#60a5fa;">${formatMoney(data.finalNetWorth)}</div>
    </div>
    <div class="summary-item">
      <div class="label">Growth</div>
      <div class="value" style="color:#c084fc;">+${netWorthGrowth}%</div>
    </div>
  </div>

  <div class="footer">
    <p><strong>Disclaimer:</strong> This report is for educational and illustrative purposes only and does not constitute tax, legal, or investment advice. All projected values are hypothetical and based on assumed scenarios. Actual results will vary based on individual circumstances, market conditions, and applicable tax laws. Consult with qualified tax and legal professionals before implementing any strategy. Russell Capital Systems™ is not a registered investment advisor, tax advisor, or law firm.</p>
    <p style="margin-top:8px;">© ${new Date().getFullYear()} Russell Capital Systems™ — www.RussellCap.com — All Rights Reserved. CONFIDENTIAL.</p>
  </div>
</body>
</html>`;
}

export function PDFExportButton({ data, type }: { data: StrategyData; type: "strategy" | "combo" }) {
  const [loading, setLoading] = useState(false);

  const handleExport = useCallback(() => {
    setLoading(true);
    try {
      const html = generatePDFHTML(data, type);
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);

      const printWindow = window.open(url, "_blank");
      if (printWindow) {
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
            setLoading(false);
          }, 500);
        };
      } else {
        // Fallback: download as HTML
        const a = document.createElement("a");
        a.href = url;
        a.download = `${type === 'strategy' ? data.title : data.comboName}_Report.html`;
        a.click();
        setLoading(false);
      }

      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch {
      setLoading(false);
    }
  }, [data, type]);

  return (
    <Button
      onClick={handleExport}
      disabled={loading}
      variant="outline"
      size="sm"
      className="gap-2 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      <FileText className="h-4 w-4" />
      {loading ? "Generating..." : "Download PDF Report"}
    </Button>
  );
}

export default PDFExportButton;
