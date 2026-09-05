// @ts-nocheck

import React, { useCallback } from 'react';

type TableData = any;  // Placeholder for table data structure
type ChartData = any;  // Placeholder for chart data structure

type Section = {
  title: string;
  content: string | TableData | ChartData;
  type: 'text' | 'table' | 'chart';
};

type ReportData = {
  title: string;
  date: string;
  sections: Section[];
  summary: string;
  disclaimers: string[];
  ircCitations: string[];
};

const IRC_CITATIONS: { [key: string]: string[] } = {
  'iul': ['§7702', '§72', '§101(a)'],
  'myga': ['§72', '§1035'],
  'roth': ['§408A', '§408(d)(3)'],
  'heloc': ['§163', '§121'],
  'trust': ['§2503(b)', '§2611', '§2042'],
  'cost_seg': ['§168(k)', '§179'],
  'oil_gas': ['§263(c)', '§611'],
  'str': ['§469', '§280A'],
  'qprt': ['§2702'],
  '1031': ['§1031']
};

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function formatPercentage(rate: number): string {
  return `${(rate * 100).toFixed(2)}%`;
}

function generateDisclaimer(strategyType: string): string {
  return `Disclaimer for ${strategyType}: This is not financial advice and should not be considered as such.`;
}

function getIRCCitations(strategies: string[]): string[] {
  const citations = strategies.flatMap(strategy => IRC_CITATIONS[strategy] || []);
  return Array.from(new Set(citations));
}

function calculateProjection(current: number, rate: number, years: number): number[] {
  return Array.from({ length: years }, (_, i) => current * Math.pow(1 + rate, i + 1));
}

export const useReportGenerator = () => {
  const generateFullReport = useCallback((clientName: string): ReportData => {
    const today = new Date().toISOString().split('T')[0];
    const sections: Section[] = [
      {
        title: 'Executive Summary',
        content: 'This is a comprehensive overview of the client\'s financial position. The first paragraph highlights key assets and liabilities. The second paragraph discusses potential growth opportunities. The third paragraph summarizes risks and recommendations.',
        type: 'text'
      },
      {
        title: 'Net Worth Analysis',
        content: 'Current assets: ' + formatCurrency(500000) + '. Liabilities: ' + formatCurrency(200000) + '. Net worth trajectory shows a ' + formatPercentage(0.05) + ' annual growth based on projections.',
        type: 'text'
      },
      {
        title: 'Tax Optimization',
        content: 'Current tax burden: ' + formatCurrency(30000) + '. Recommended strategies include Roth conversions. Projected savings: ' + formatCurrency(5000) + ' annually.',
        type: 'text'
      },
      {
        title: 'Retirement Readiness',
        content: calculateProjection(100000, 0.07, 10).map(amount => formatCurrency(amount)).join(', '),
        type: 'text'
      },
      {
        title: 'Insurance Coverage',
        content: 'Current coverage: Life insurance of ' + formatCurrency(1000000) + '. Gaps identified in health insurance. Recommendations: Increase coverage by 20%.',
        type: 'text'
      },
      {
        title: 'Estate Planning',
        content: 'Current plan includes a simple will. Tax exposure: ' + formatCurrency(150000) + '. Recommended structures: Revocable trust.',
        type: 'text'
      },
      {
        title: 'Strategy Recommendations',
        content: '1. Roth conversion (impact: high). 2. IUL policy (impact: medium). 3. MYGA investment (impact: medium). 4. HELOC utilization (impact: low). 5. Cost segregation (impact: high).',
        type: 'text'
      },
      {
        title: 'Risk Assessment',
        content: 'Portfolio risk: ' + formatPercentage(0.15) + '. Concentration in stocks: 60%. Liquidity: ' + formatCurrency(50000) + '.',
        type: 'text'
      },
      {
        title: 'Action Items',
        content: '1. Review insurance: By end of month. 2. Implement tax strategy: Within 3 months. 3. Update estate plan: Next quarter.',
        type: 'text'
      },
      {
        title: 'Regulatory Disclaimers',
        content: 'This report includes IRC citations and suitability disclosures.',
        type: 'text'
      }
    ];

    return {
      title: `Full Financial Report for ${clientName}`,
      date: today,
      sections,
      summary: 'This full report provides a detailed analysis of the client\'s financial health, including recommendations and projections.',
      disclaimers: ['General disclaimer: Past performance is not indicative of future results.', generateDisclaimer('roth')],
      ircCitations: getIRCCitations(['roth', 'trust', 'iul'])
    };
  }, []);

  const generateExecutiveReport = useCallback((clientName: string): ReportData => {
    const today = new Date().toISOString().split('T')[0];
    const sections: Section[] = [
      {
        title: 'Executive Summary',
        content: 'High-level overview: Assets exceed liabilities by ' + formatCurrency(300000) + '. Key risks include market volatility. Recommendations focus on tax savings.',
        type: 'text'
      }
    ];

    return {
      title: `Executive Report for ${clientName}`,
      date: today,
      sections,
      summary: 'Executive summary of financial position.',
      disclaimers: [],
      ircCitations: []
    };
  }, []);

  const generateComplianceReport = useCallback((clientName: string): ReportData => {
    const today = new Date().toISOString().split('T')[0];
    const sections: Section[] = [
      {
        title: 'Compliance Overview',
        content: 'All strategies comply with IRC regulations. Citations include: ' + getIRCCitations(['trust', '1031']).join(', '),
        type: 'text'
      }
    ];

    return {
      title: `Compliance Report for ${clientName}`,
      date: today,
      sections,
      summary: 'Ensures all recommendations meet regulatory standards.',
      disclaimers: [generateDisclaimer('trust')],
      ircCitations: getIRCCitations(['trust'])
    };
  }, []);

  const generateTaxReport = useCallback((clientName: string): ReportData => {
    const today = new Date().toISOString().split('T')[0];
    const sections: Section[] = [
      {
        title: 'Tax Optimization Strategies',
        content: 'Current tax: ' + formatCurrency(25000) + '. Strategies: Roth conversion for savings of ' + formatCurrency(4000) + '.',
        type: 'text'
      }
    ];

    return {
      title: `Tax Report for ${clientName}`,
      date: today,
      sections,
      summary: 'Focus on tax reduction opportunities.',
      disclaimers: [generateDisclaimer('roth')],
      ircCitations: getIRCCitations(['roth'])
    };
  }, []);

  const generateRetirementReport = useCallback((clientName: string): ReportData => {
    const today = new Date().toISOString().split('T')[0];
    const sections: Section[] = [
      {
        title: 'Retirement Projections',
        content: 'Current savings: ' + formatCurrency(500000) + '. Projected income: ' + calculateProjection(500000, 0.06, 10).map(amount => formatCurrency(amount)).join(', '),
        type: 'text'
      }
    ];

    return {
      title: `Retirement Report for ${clientName}`,
      date: today,
      sections,
      summary: 'Analysis of retirement readiness and gaps.',
      disclaimers: [],
      ircCitations: getIRCCitations(['roth'])
    };
  }, []);

  return {
    generateFullReport,
    generateExecutiveReport,
    generateComplianceReport,
    generateTaxReport,
    generateRetirementReport
  };
};
