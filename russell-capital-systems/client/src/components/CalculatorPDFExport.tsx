import { useCallback, useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PDFExportProps {
  calculatorName: string;
  calculatorRoute: string;
  inputs: Record<string, string | number>;
  results: Record<string, string | number>;
  projectionData?: { year: number; [key: string]: number }[];
  irsCitations?: string[];
}

export function CalculatorPDFExport({
  calculatorName,
  calculatorRoute,
  inputs,
  results,
  projectionData,
  irsCitations,
}: PDFExportProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = useCallback(() => {
    setIsGenerating(true);

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      setIsGenerating(false);
      alert('Please allow popups to generate PDF reports.');
      return;
    }

    const inputRows = Object.entries(inputs)
      .filter(([, v]) => v !== '' && v !== undefined && v !== null)
      .map(([key, value]) => {
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();
        const formatted = typeof value === 'number'
          ? value >= 1000 ? `$${value.toLocaleString()}` : String(value)
          : String(value);
        return `<tr><td style="padding:8px 14px;border-bottom:1px solid #e2e8f0;color:#475569;font-weight:500;font-size:13px;">${label}</td><td style="padding:8px 14px;border-bottom:1px solid #e2e8f0;color:#1e293b;font-weight:600;text-align:right;font-size:13px;">${formatted}</td></tr>`;
      }).join('');

    const resultRows = Object.entries(results)
      .filter(([, v]) => v !== '' && v !== undefined && v !== null)
      .map(([key, value]) => {
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();
        const formatted = typeof value === 'number'
          ? value >= 1000 ? `$${value.toLocaleString()}` : value.toFixed(2)
          : String(value);
        return `<tr><td style="padding:10px 14px;border-bottom:1px solid #d1fae5;color:#1e293b;font-weight:500;font-size:14px;">${label}</td><td style="padding:10px 14px;border-bottom:1px solid #d1fae5;color:#059669;font-weight:700;text-align:right;font-size:16px;">${formatted}</td></tr>`;
      }).join('');

    // Build projection table (show every 5 years)
    let projectionSection = '';
    if (projectionData && projectionData.length > 0) {
      const keys = Object.keys(projectionData[0]).filter(k => k !== 'year');
      const headerCells = keys.map(k => {
        const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();
        return `<th style="padding:8px 6px;border-bottom:2px solid #059669;color:#059669;font-weight:700;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:0.3px;">${label}</th>`;
      }).join('');

      const dataRows = projectionData
        .filter((_, i) => i % 5 === 0 || i === projectionData.length - 1)
        .map((row, idx) => {
          const bgColor = idx % 2 === 0 ? '#ffffff' : '#f8fafb';
          const cells = keys.map(k => {
            const val = row[k];
            return `<td style="padding:5px 6px;border-bottom:1px solid #f1f5f9;text-align:right;color:#334155;font-size:11px;background:${bgColor};">$${(val || 0).toLocaleString()}</td>`;
          }).join('');
          return `<tr><td style="padding:5px 6px;border-bottom:1px solid #f1f5f9;font-weight:600;color:#1e293b;font-size:11px;background:${bgColor};">Year ${row.year}</td>${cells}</tr>`;
        }).join('');

      projectionSection = `
        <div style="margin-top:28px;page-break-inside:avoid;">
          <h3 style="color:#059669;font-size:15px;font-weight:700;margin-bottom:10px;border-bottom:2px solid #059669;padding-bottom:6px;display:flex;align-items:center;gap:8px;">
            <span style="display:inline-block;width:20px;height:20px;background:#059669;border-radius:4px;text-align:center;line-height:20px;color:white;font-size:11px;">&#9650;</span>
            50-Year Projection (Every 5 Years)
          </h3>
          <table style="width:100%;border-collapse:collapse;font-size:11px;">
            <thead><tr><th style="padding:8px 6px;border-bottom:2px solid #059669;color:#059669;font-weight:700;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.3px;">Period</th>${headerCells}</tr></thead>
            <tbody>${dataRows}</tbody>
          </table>
        </div>
      `;
    }

    let citationsSection = '';
    if (irsCitations && irsCitations.length > 0) {
      const citationItems = irsCitations.map(c => `<li style="margin-bottom:5px;color:#475569;font-size:11px;line-height:1.5;">${c}</li>`).join('');
      citationsSection = `
        <div style="margin-top:28px;padding:18px 20px;background:linear-gradient(135deg,#f0fdf4,#ecfdf5);border-radius:10px;border:1px solid #bbf7d0;page-break-inside:avoid;">
          <h4 style="color:#065f46;font-size:12px;font-weight:700;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.8px;display:flex;align-items:center;gap:6px;">
            <span style="font-size:14px;">&#167;</span> IRS Code References &amp; Citations
          </h4>
          <ul style="margin:0;padding-left:20px;">${citationItems}</ul>
        </div>
      `;
    }

    const reportDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const reportTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const reportId = 'RCS-' + Date.now().toString(36).toUpperCase();

    const html = `<!DOCTYPE html>
<html>
<head>
  <title>${calculatorName} - Russell Capital Solutions Report</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    @media print {
      body { margin: 0; }
      .no-print { display: none !important; }
      @page { margin: 0.5in; }
    }
    body { font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; max-width: 820px; margin: 0 auto; padding: 40px; line-height: 1.5; }
    * { box-sizing: border-box; }
  </style>
</head>
<body>
  <div class="no-print" style="text-align:center;margin-bottom:24px;padding:16px;background:#f0fdf4;border-radius:12px;border:1px solid #bbf7d0;">
    <button onclick="window.print()" style="padding:14px 40px;background:linear-gradient(135deg,#059669,#047857);color:white;border:none;border-radius:10px;font-size:16px;font-weight:700;cursor:pointer;box-shadow:0 4px 14px rgba(5,150,105,0.3);letter-spacing:0.3px;">
      &#128196; Print / Save as PDF
    </button>
    <p style="margin:8px 0 0;color:#64748b;font-size:12px;">Use your browser's "Save as PDF" option for best results</p>
  </div>

  <!-- Branded Header -->
  <div style="border-bottom:3px solid #059669;padding-bottom:20px;margin-bottom:28px;">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;">
      <div style="display:flex;align-items:center;gap:14px;">
        <div style="width:52px;height:52px;border-radius:12px;background:linear-gradient(135deg,#059669,#047857);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(5,150,105,0.25);">
          <span style="color:white;font-weight:800;font-size:16px;letter-spacing:-0.5px;">RCS</span>
        </div>
        <div>
          <h1 style="margin:0;color:#059669;font-size:24px;font-weight:800;letter-spacing:-0.5px;">Russell Capital Solutions&#8482;</h1>
          <p style="margin:2px 0 0;color:#22c55e;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Turn Capital Into Income&#8482;</p>
          <p style="margin:2px 0 0;color:#94a3b8;font-size:11px;">The Financial Command Center for Physicians</p>
        </div>
      </div>
      <div style="text-align:right;min-width:160px;">
        <p style="margin:0;color:#94a3b8;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;">Report Generated</p>
        <p style="margin:2px 0 0;color:#1e293b;font-weight:700;font-size:14px;">${reportDate}</p>
        <p style="margin:1px 0 0;color:#64748b;font-size:11px;">${reportTime}</p>
        <p style="margin:6px 0 0;color:#94a3b8;font-size:9px;font-family:monospace;">ID: ${reportId}</p>
      </div>
    </div>
  </div>

  <!-- Calculator Title Banner -->
  <div style="background:linear-gradient(135deg,#064e3b 0%,#059669 50%,#047857 100%);padding:22px 28px;border-radius:14px;margin-bottom:28px;box-shadow:0 8px 24px rgba(5,150,105,0.2);">
    <h2 style="margin:0;color:white;font-size:22px;font-weight:800;letter-spacing:-0.3px;">${calculatorName}</h2>
    <p style="margin:5px 0 0;color:#a7f3d0;font-size:13px;font-weight:500;">Comprehensive Financial Analysis Report</p>
  </div>

  <!-- Advisor Contact Bar -->
  <div style="display:flex;justify-content:space-between;align-items:center;padding:14px 20px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;margin-bottom:28px;">
    <div>
      <p style="margin:0;color:#1e293b;font-size:13px;font-weight:700;">Prepared by Russell Capital Solutions</p>
      <p style="margin:2px 0 0;color:#64748b;font-size:11px;">Sam Russell, Chief Strategist</p>
    </div>
    <div style="text-align:right;">
      <p style="margin:0;color:#059669;font-size:12px;font-weight:600;">www.RussellCap.com</p>
      <p style="margin:2px 0 0;color:#64748b;font-size:11px;">contact@russellcapitalsolutions.com</p>
    </div>
  </div>

  <!-- Input Parameters -->
  <div style="margin-bottom:28px;">
    <h3 style="color:#059669;font-size:15px;font-weight:700;margin-bottom:12px;border-bottom:2px solid #059669;padding-bottom:6px;display:flex;align-items:center;gap:8px;">
      <span style="display:inline-block;width:20px;height:20px;background:#059669;border-radius:4px;text-align:center;line-height:20px;color:white;font-size:11px;">&#9998;</span>
      Input Parameters
    </h3>
    <table style="width:100%;border-collapse:collapse;">
      ${inputRows}
    </table>
  </div>

  <!-- Calculated Results -->
  <div style="margin-bottom:28px;background:linear-gradient(135deg,#f0fdf4,#ecfdf5);padding:22px 24px;border-radius:14px;border:2px solid #059669;box-shadow:0 4px 16px rgba(5,150,105,0.08);">
    <h3 style="color:#059669;font-size:15px;font-weight:700;margin-bottom:14px;display:flex;align-items:center;gap:8px;">
      <span style="display:inline-block;width:20px;height:20px;background:#059669;border-radius:4px;text-align:center;line-height:20px;color:white;font-size:12px;">&#10003;</span>
      Calculated Results
    </h3>
    <table style="width:100%;border-collapse:collapse;">
      ${resultRows}
    </table>
  </div>

  ${projectionSection}
  ${citationsSection}

  <!-- Legal Disclaimer -->
  <div style="margin-top:36px;padding:20px 24px;background:#fafafa;border-radius:10px;border:1px solid #e5e7eb;page-break-inside:avoid;">
    <h4 style="color:#374151;font-size:11px;font-weight:700;margin:0 0 10px;text-transform:uppercase;letter-spacing:0.8px;">Important Disclosures</h4>
    <p style="color:#6b7280;font-size:10px;line-height:1.7;margin:0 0 8px;">
      This report is generated by Russell Capital Solutions for <strong>educational and financial planning purposes only</strong>.
      The projections, calculations, and strategies presented herein are based on the input parameters provided and
      standard financial modeling assumptions. Actual results may vary based on market conditions, tax law changes,
      and individual circumstances.
    </p>
    <p style="color:#6b7280;font-size:10px;line-height:1.7;margin:0 0 8px;">
      <strong>This report does not constitute personalized financial, tax, legal, or investment advice.</strong>
      All tax strategies reference applicable IRS codes as cited. Tax laws are subject to change.
      Consult a qualified CPA, financial advisor, or attorney before implementing any strategy discussed in this report.
    </p>
    <p style="color:#6b7280;font-size:10px;line-height:1.7;margin:0 0 8px;">
      Past performance and historical data do not guarantee future results. All 50-year projections assume
      consistent growth rates and do not account for market volatility, inflation variability, or changes in
      personal circumstances unless explicitly modeled.
    </p>
    <p style="color:#9ca3af;font-size:9px;line-height:1.6;margin:0;">
      &copy; ${new Date().getFullYear()} Russell Holdings Management LLC. All rights reserved.
      www.RussellCapitalSolutions.com is owned and operated by Russell Holdings Management LLC.
      Russell Capital Solutions&#8482; and Turn Capital Into Income&#8482; are trademarks of Russell Holdings Management LLC.
    </p>
  </div>

  <!-- Footer -->
  <div style="margin-top:20px;padding-top:16px;border-top:2px solid #059669;display:flex;justify-content:space-between;align-items:center;">
    <div>
      <p style="color:#059669;font-size:12px;font-weight:700;margin:0;">Russell Capital Solutions&#8482;</p>
      <p style="color:#94a3b8;font-size:10px;margin:2px 0 0;">The Financial Command Center for Physicians</p>
    </div>
    <div style="text-align:center;">
      <p style="color:#64748b;font-size:10px;margin:0;">Questions? Contact your advisor</p>
      <p style="color:#059669;font-size:11px;font-weight:600;margin:2px 0 0;">contact@russellcapitalsolutions.com</p>
    </div>
    <div style="text-align:right;">
      <p style="color:#059669;font-size:12px;font-weight:700;margin:0;">www.RussellCap.com</p>
      <p style="color:#94a3b8;font-size:9px;margin:2px 0 0;">Report ${reportId}</p>
    </div>
  </div>
</body>
</html>`;

    printWindow.document.write(html);
    printWindow.document.close();
    setIsGenerating(false);
  }, [calculatorName, inputs, results, projectionData, irsCitations]);

  return (
    <Button
      onClick={generatePDF}
      disabled={isGenerating}
      variant="outline"
      className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <FileDown className="w-4 h-4 mr-2" />
          Export PDF Report
        </>
      )}
    </Button>
  );
}
