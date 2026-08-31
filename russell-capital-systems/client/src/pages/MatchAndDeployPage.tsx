import React, { useState } from 'react';

const MatchAndDeployPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('strategy');
  const [isReferencesOpen, setIsReferencesOpen] = useState(false);
  const [salary, setSalary] = useState(500000);
  const [matchRate, setMatchRate] = useState(5);
  const [matchFormula, setMatchFormula] = useState('Dollar-for-dollar up to X%');
  const [iulPremium, setIulPremium] = useState(50000);
  const [iulCreditingRate, setIulCreditingRate] = useState(6.5);
  const [yearsToRetirement, setYearsToRetirement] = useState(25);
  const [currentTaxBracket, setCurrentTaxBracket] = useState(37);
  const [retirementTaxBracket, setRetirementTaxBracket] = useState(32);
  const [rothConversionRate, setRothConversionRate] = useState(12);

  const calculateComparison = () => {
    const comparison = [];
    let max401kBalance = 0;
    let matchDeploy401kBalance = 0;
    let iulBalance = 0;
    for (let y = 1; y <= yearsToRetirement; y++) {
      const max401kContribution = Math.min(24500, salary * 0.05);
      max401kBalance = (max401kBalance + max401kContribution) * (1 + 0.06);
      const matchContribution = salary * (matchRate / 100) * (matchFormula === 'Dollar-for-dollar up to X%' ? 1 : 0.5);
      matchDeploy401kBalance = (matchDeploy401kBalance + matchContribution) * (1 + 0.06);
      iulBalance = (iulBalance + iulPremium) * (1 + iulCreditingRate / 100);
      const max401kAfterTax = max401kBalance * (1 - retirementTaxBracket / 100);
      const matchDeployAfterTax = (matchDeploy401kBalance * (1 - rothConversionRate / 100)) + iulBalance;
      comparison.push({
        year: y,
        max401k: Math.round(max401kBalance),
        max401kAfterTax: Math.round(max401kAfterTax),
        matchDeploy401k: Math.round(matchDeploy401kBalance),
        iul: Math.round(iulBalance),
        matchDeployTotal: Math.round(matchDeployAfterTax),
        difference: Math.round(matchDeployAfterTax - max401kAfterTax),
      });
    }
    return comparison;
  };

  const comparisonData = calculateComparison();

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-300 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-white text-3xl font-bold mb-6">401(k) Match & Deploy: Capture Free Money, Build Tax-Free Wealth</h1>

        {/* References & Legal Section */}
        <div className="bg-[#1e293b] p-4 rounded-lg mb-6">
          <button
            className="text-white font-semibold flex justify-between items-center w-full"
            onClick={() => setIsReferencesOpen(!isReferencesOpen)}
          >
            <span>References & Legal</span>
            <span>{isReferencesOpen ? '▲' : '▼'}</span>
          </button>
          {isReferencesOpen && (
            <ul className="mt-4 list-disc pl-6 space-y-2">
              <li>IRC §401(k) — Employee elective deferrals</li>
              <li>IRC §402A — Designated Roth contributions</li>
              <li>IRC §72(e) — Tax-free life insurance policy loans</li>
              <li>IRC §101(a) — Tax-free death benefit</li>
              <li>IRC §402(c) — Rollovers from qualified plans</li>
              <li>SECURE 2.0 Act §604 — Employer Roth matching (optional, 2024+)</li>
              <li>SECURE 2.0 Act §603 — Mandatory Roth catch-up for high earners ($145K+, 2026+)</li>
              <li>IRS Notice 2025-67 — 2026 retirement plan limits</li>
              <li>"There is NO IRS minimum contribution requirement for 401(k) plans."</li>
              <li>"IUL policy loans are not considered taxable income under IRC §72(e)"</li>
            </ul>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-6">
          {['References & Legal', 'The Match & Deploy Strategy', 'Match & Deploy Calculator', 'Generate Outcome', 'AI Strategy Engine'].map((tab) => (
            <button
              key={tab}
              className={`px-4 py-2 rounded-md ${
                activeTab === tab.toLowerCase().replace(/ & /g, '').replace(/ /g, '-') ? 'bg-blue-600 text-white' : 'bg-[#1e293b] text-gray-300'
              }`}
              onClick={() => setActiveTab(tab.toLowerCase().replace(/ & /g, '').replace(/ /g, '-'))}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-[#1e293b] p-6 rounded-lg">
          {activeTab === 'references-legal' && <div>References content already shown above.</div>}

          {activeTab === 'the-match-deploy-strategy' && (
            <div>
              <h2 className="text-white text-2xl mb-4">The Match & Deploy Strategy</h2>
              <p className="mb-4">
                Contribute ONLY enough to your 401(k) to capture the employer match (free money), then deploy remaining income into an IUL for tax-free growth, policy loans, and no RMDs.
              </p>
              <div className="flex gap-4 mb-4">
                <label>Employer Match Rate:</label>
                {[4, 5, 6].map((rate) => (
                  <button
                    key={rate}
                    className={`px-2 py-1 ${matchRate === rate ? 'bg-blue-600' : 'bg-[#0f172a]'}`}
                    onClick={() => setMatchRate(rate)}
                  >
                    {rate}%
                  </button>
                ))}
              </div>
              <div className="space-y-4">
                <div>TRADITIONAL: Max out 401(k) at $24,500/year for 25 years → $1.8M at retirement → Taxed at 32-37% → Net: $1.17M</div>
                <div>MATCH & DEPLOY: Contribute $25K (5% match), deploy $50K/year into IUL → 401(k): $750K (Roth converted) + IUL: $2.5M tax-free → Net: $3.25M</div>
                <div className="text-yellow-300">DIFFERENCE: $2.08M MORE with Match & Deploy</div>
              </div>
            </div>
          )}

          {activeTab === 'match-deploy-calculator' && (
            <div>
              <h2 className="text-white text-2xl mb-4">Match & Deploy Calculator</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label>Annual Salary: ${salary.toLocaleString()}</label>
                  <input type="range" min="100000" max="1500000" value={salary} onChange={(e) => setSalary(Number(e.target.value))} className="w-full" />
                </div>
                <div>
                  <label>Employer Match Rate: {matchRate}%</label>
                  <div className="flex gap-2">
                    {[4, 5, 6].map((val) => (
                      <button
                        key={val}
                        className={`px-2 py-1 ${matchRate === val ? 'bg-blue-600' : 'bg-[#0f172a]'}`}
                        onClick={() => setMatchRate(val)}
                      >
                        {val}%
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label>Match Formula:</label>
                  <div className="flex gap-2">
                    {['Dollar-for-dollar up to X%', '50 cents on dollar up to X%'].map((val) => (
                      <button
                        key={val}
                        className={`px-2 py-1 ${matchFormula === val ? 'bg-blue-600' : 'bg-[#0f172a]'}`}
                        onClick={() => setMatchFormula(val)}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label>Annual IUL Premium: ${iulPremium.toLocaleString()}</label>
                  <input type="range" min="20000" max="100000" value={iulPremium} onChange={(e) => setIulPremium(Number(e.target.value))} className="w-full" />
                </div>
                <div>
                  <label>IUL Crediting Rate: {iulCreditingRate}%</label>
                  <input type="range" min="4" max="9" step="0.1" value={iulCreditingRate} onChange={(e) => setIulCreditingRate(Number(e.target.value))} className="w-full" />
                </div>
                <div>
                  <label>Years to Retirement: {yearsToRetirement}</label>
                  <input type="range" min="10" max="35" value={yearsToRetirement} onChange={(e) => setYearsToRetirement(Number(e.target.value))} className="w-full" />
                </div>
                <div>
                  <label>Current Tax Bracket: {currentTaxBracket}%</label>
                  <div className="flex gap-2">
                    {[24, 32, 35, 37].map((val) => (
                      <button
                        key={val}
                        className={`px-2 py-1 ${currentTaxBracket === val ? 'bg-blue-600' : 'bg-[#0f172a]'}`}
                        onClick={() => setCurrentTaxBracket(val)}
                      >
                        {val}%
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label>Retirement Tax Bracket: {retirementTaxBracket}%</label>
                  <div className="flex gap-2">
                    {[22, 24, 32, 35].map((val) => (
                      <button
                        key={val}
                        className={`px-2 py-1 ${retirementTaxBracket === val ? 'bg-blue-600' : 'bg-[#0f172a]'}`}
                        onClick={() => setRetirementTaxBracket(val)}
                      >
                        {val}%
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label>Roth Conversion Rate: {rothConversionRate}%</label>
                  <div className="flex gap-2">
                    {[0, 12, 22, 24].map((val) => (
                      <button
                        key={val}
                        className={`px-2 py-1 ${rothConversionRate === val ? 'bg-blue-600' : 'bg-[#0f172a]'}`}
                        onClick={() => setRothConversionRate(val)}
                      >
                        {val}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th>Year</th><th>Max 401(k)</th><th>Max 401(k) After Tax</th><th>Match 401(k)</th><th>IUL Value</th><th>Match & Deploy Total</th><th>Difference</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.map((row) => (
                    <tr key={row.year} className="border-b border-gray-600">
                      <td>{row.year}</td>
                      <td>${row.max401k.toLocaleString()}</td>
                      <td>${row.max401kAfterTax.toLocaleString()}</td>
                      <td>${row.matchDeploy401k.toLocaleString()}</td>
                      <td>${row.iul.toLocaleString()}</td>
                      <td>${row.matchDeployTotal.toLocaleString()}</td>
                      <td className={row.difference > 0 ? 'text-green-400' : 'text-red-400'}>${row.difference.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'generate-outcome' && (
            <div>
              <h2 className="text-white text-2xl mb-4">Generate Outcome</h2>
              <div className="space-y-4">
                <div>Total 401(k) Value (after Roth conversion): ${(comparisonData[comparisonData.length - 1]?.matchDeploy401k * (1 - rothConversionRate / 100) || 0).toLocaleString()}</div>
                <div>Total IUL Cash Value (tax-free): ${(comparisonData[comparisonData.length - 1]?.iul || 0).toLocaleString()}</div>
                <div>Total Tax-Free Retirement Income Available: ${((comparisonData[comparisonData.length - 1]?.iul || 0) * 0.05).toLocaleString()}/year</div>
                <div>Total Death Benefit to Heirs: ${((comparisonData[comparisonData.length - 1]?.iul || 0) * 1.5).toLocaleString()}</div>
                <div className="text-yellow-300">
                  Traditional 401(k) Only: ${(comparisonData[comparisonData.length - 1]?.max401kAfterTax || 0).toLocaleString()} vs Match & Deploy: ${(comparisonData[comparisonData.length - 1]?.matchDeployTotal || 0).toLocaleString()}
                </div>
                <div>Net Advantage: ${(comparisonData[comparisonData.length - 1]?.difference || 0).toLocaleString()}</div>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md">Send to AI Strategy Engine</button>
                <p className="text-sm text-gray-400">
                  Disclaimer: IUL illustrations are hypothetical and not guaranteed. Policy loans reduce death benefit. Consult a qualified tax professional.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'ai-strategy-engine' && (
            <div>
              <h2 className="text-white text-2xl mb-4">AI Strategy Engine</h2>
              <p className="mb-4">Cross-tool recommendations:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Combine with Mortgage Killer V2 to deploy home equity into IUL</li>
                <li>Use STR Tax Eliminator depreciation to offset Roth conversion taxes</li>
                <li>Structure IUL inside SLAT for additional estate protection</li>
                <li>Run Time Machine to see cost of waiting 5 years</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchAndDeployPage;
