import React, { useState } from 'react';
import { useSharedField } from "@/context/FinancialDataContext";

const STRTaxEliminatorPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('strategy');
  const [isReferencesOpen, setIsReferencesOpen] = useState(false);
  const [w2Income, setW2Income] = useSharedField("annualIncome", 500000);
  const [propertyPrice, setPropertyPrice] = useState(750000);
  const [downPaymentPercent, setDownPaymentPercent] = useState(30);
  const [costSegPercent, setCostSegPercent] = useState(40);
  const [bonusDepreciation, setBonusDepreciation] = useState(100);
  const [rentalIncomeRate, setRentalIncomeRate] = useState(20);
  const [operatingCostPercent, setOperatingCostPercent] = useState(50);
  const [appreciationRate, setAppreciationRate] = useState(5);
  const [years, setYears] = useSharedField("projectionYears", 10);
  const [propertiesPerYear, setPropertiesPerYear] = useState(1);

  const calculateEmpire = () => {
    const empire = [];
    let totalProperties = 0;
    let totalPortfolioValue = 0;
    let totalEquity = 0;
    let cumulativeTaxSavings = 0;
    let cumulativeNetWorth = 0;
    for (let y = 1; y <= years; y++) {
      totalProperties += propertiesPerYear;
      const purchasePrice = propertyPrice * propertiesPerYear;
      totalPortfolioValue += purchasePrice * Math.pow(1 + appreciationRate / 100, y);
      totalEquity += (purchasePrice * (downPaymentPercent / 100)) + (purchasePrice * (Math.pow(1 + appreciationRate / 100, y) - 1));
      const depreciation = purchasePrice * (costSegPercent / 100) * (bonusDepreciation / 100);
      const taxSavings = depreciation * 0.37;
      cumulativeTaxSavings += taxSavings;
      const grossRentalIncome = purchasePrice * (rentalIncomeRate / 100);
      const netRentalIncome = grossRentalIncome * (1 - operatingCostPercent / 100);
      cumulativeNetWorth = totalEquity + cumulativeTaxSavings + netRentalIncome * y;
      empire.push({
        year: y,
        properties: totalProperties,
        portfolioValue: Math.round(totalPortfolioValue),
        equity: Math.round(totalEquity),
        depreciation: Math.round(depreciation),
        taxSavings: Math.round(taxSavings),
        grossRental: Math.round(grossRentalIncome),
        netRental: Math.round(netRentalIncome),
        cumulativeTaxSavings: Math.round(cumulativeTaxSavings),
        netWorth: Math.round(cumulativeNetWorth),
        effectiveTaxRate: Math.round(((w2Income - taxSavings) / w2Income) * 100),
      });
    }
    return empire;
  };

  const empireData = calculateEmpire();

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-300 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-white text-3xl font-bold mb-6">Short-Term Rental Tax Eliminator</h1>

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
              <li>IRC §168(k) — 100% Bonus depreciation (permanent under OBBBA July 4, 2025)</li>
              <li>IRC §469 — Passive activity loss rules</li>
              <li>IRC §469(c)(7) — Real estate professional status</li>
              <li>IRS Temp. Reg. §1.469-5T — Material participation tests</li>
              <li>IRC §1250 — Depreciation recapture on sale</li>
              <li>IRS Publication 925 — Passive Activity and At-Risk Rules</li>
              <li>IRS Publication 946 — How to Depreciate Property</li>
              <li>One Big Beautiful Bill Act (OBBBA) — Signed July 4, 2025</li>
            </ul>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-6">
          {['References & Legal', 'The STR Tax Elimination Strategy', 'STR Empire Calculator', 'Generate Outcome', 'AI Strategy Engine'].map((tab) => (
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

          {activeTab === 'the-str-tax-elimination-strategy' && (
            <div>
              <h2 className="text-white text-2xl mb-4">The STR Tax Elimination Strategy</h2>
              <p className="mb-4">
                The STR Loophole allows high-income earners to offset W-2 income with paper losses from bonus depreciation on short-term rental properties (average rental ≤ 7 days + material participation = active income).
              </p>
              <div className="space-y-4">
                <div>Year 1: Buy STR #1 ($750K, 30% down = $225K). Cost seg: 40% = $300K bonus depreciation. Tax savings: $111K at 37%</div>
                <div>Year 2: Buy STR #2. Use Year 1 tax savings + rental income for down payment. Another $111K saved.</div>
                <div>Year 3-5: Repeat. Portfolio: 5 STRs, $3.75M in real estate, $555K total tax savings</div>
                <div>Year 10: 10 STRs, $7.5M portfolio, $1.1M total tax savings, $300K/year rental income</div>
                <div className="text-yellow-300">Do Nothing: Pay $185K/year in taxes over 10 years = $1.85M gone</div>
              </div>
            </div>
          )}

          {activeTab === 'str-empire-calculator' && (
            <div>
              <h2 className="text-white text-2xl mb-4">STR Empire Calculator</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label>Annual W-2 Income: ${w2Income.toLocaleString()}</label>
                  <input type="range" min="200000" max="1500000" value={w2Income} onChange={(e) => setW2Income(Number(e.target.value))} className="w-full" />
                </div>
                <div>
                  <label>Property Purchase Price: ${propertyPrice.toLocaleString()}</label>
                  <input type="range" min="300000" max="2000000" value={propertyPrice} onChange={(e) => setPropertyPrice(Number(e.target.value))} className="w-full" />
                </div>
                <div>
                  <label>Down Payment Percentage: {downPaymentPercent}%</label>
                  <input type="range" min="20" max="40" value={downPaymentPercent} onChange={(e) => setDownPaymentPercent(Number(e.target.value))} className="w-full" />
                </div>
                <div>
                  <label>Cost Segregation Percentage: {costSegPercent}%</label>
                  <div className="flex gap-2">
                    {[20, 30, 40, 50, 60, 70, 80, 90, 100].map((val) => (
                      <button
                        key={val}
                        className={`px-2 py-1 ${costSegPercent === val ? 'bg-blue-600' : 'bg-[#0f172a]'}`}
                        onClick={() => setCostSegPercent(val)}
                      >
                        {val}%
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label>Bonus Depreciation Rate: {bonusDepreciation}%</label>
                  <div className="flex gap-2">
                    {[40, 60, 80, 100].map((val) => (
                      <button
                        key={val}
                        className={`px-2 py-1 ${bonusDepreciation === val ? 'bg-blue-600' : 'bg-[#0f172a]'}`}
                        onClick={() => setBonusDepreciation(val)}
                      >
                        {val}%
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label>Gross Rental Income Rate: {rentalIncomeRate}%</label>
                  <div className="flex gap-2">
                    {[10, 15, 20, 25, 30].map((val) => (
                      <button
                        key={val}
                        className={`px-2 py-1 ${rentalIncomeRate === val ? 'bg-blue-600' : 'bg-[#0f172a]'}`}
                        onClick={() => setRentalIncomeRate(val)}
                      >
                        {val}%
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label>Operating Cost Percentage: {operatingCostPercent}%</label>
                  <input type="range" min="30" max="60" value={operatingCostPercent} onChange={(e) => setOperatingCostPercent(Number(e.target.value))} className="w-full" />
                </div>
                <div>
                  <label>Annual Appreciation: {appreciationRate}%</label>
                  <input type="range" min="2" max="8" step="0.1" value={appreciationRate} onChange={(e) => setAppreciationRate(Number(e.target.value))} className="w-full" />
                </div>
                <div>
                  <label>Number of Years: {years}</label>
                  <input type="range" min="1" max="20" value={years} onChange={(e) => setYears(Number(e.target.value))} className="w-full" />
                </div>
                <div>
                  <label>Properties per Year: {propertiesPerYear}</label>
                  <div className="flex gap-2">
                    {[1, 2, 3].map((val) => (
                      <button
                        key={val}
                        className={`px-2 py-1 ${propertiesPerYear === val ? 'bg-blue-600' : 'bg-[#0f172a]'}`}
                        onClick={() => setPropertiesPerYear(val)}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th>Year</th><th>Properties</th><th>Portfolio Value</th><th>Equity</th><th>Depreciation</th><th>Tax Savings</th><th>Gross Rental</th><th>Net Rental</th><th>Cum. Tax Savings</th><th>Net Worth</th><th>Eff. Tax Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {empireData.map((row) => (
                    <tr key={row.year} className="border-b border-gray-600">
                      <td>{row.year}</td>
                      <td>{row.properties}</td>
                      <td>${row.portfolioValue.toLocaleString()}</td>
                      <td>${row.equity.toLocaleString()}</td>
                      <td>${row.depreciation.toLocaleString()}</td>
                      <td>${row.taxSavings.toLocaleString()}</td>
                      <td>${row.grossRental.toLocaleString()}</td>
                      <td>${row.netRental.toLocaleString()}</td>
                      <td>${row.cumulativeTaxSavings.toLocaleString()}</td>
                      <td>${row.netWorth.toLocaleString()}</td>
                      <td>{row.effectiveTaxRate}%</td>
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
                <div>Total Properties Acquired: {empireData[empireData.length - 1]?.properties || 0}</div>
                <div>Total Portfolio Value: ${(empireData[empireData.length - 1]?.portfolioValue || 0).toLocaleString()}</div>
                <div>Total Tax Savings (Cumulative): ${(empireData[empireData.length - 1]?.cumulativeTaxSavings || 0).toLocaleString()}</div>
                <div>Annual Passive Income at Year {years}: ${(empireData[empireData.length - 1]?.netRental || 0).toLocaleString()}</div>
                <div className="text-yellow-300">
                  Net Worth Comparison: STR Strategy: ${(empireData[empireData.length - 1]?.netWorth || 0).toLocaleString()} vs Traditional: ${(w2Income * years * 0.63).toLocaleString()}
                </div>
                <div className="text-yellow-300 text-xl">Millions Saved: ${(empireData[empireData.length - 1]?.cumulativeTaxSavings || 0).toLocaleString()}</div>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md">Send to AI Strategy Engine</button>
                <p className="text-sm text-gray-400">
                  Disclaimer: Depreciation recapture under IRC §1250 may apply on sale. Consult a tax professional.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'ai-strategy-engine' && (
            <div>
              <h2 className="text-white text-2xl mb-4">AI Strategy Engine</h2>
              <p className="mb-4">Cross-tool recommendations:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Combine with Solar Roth Conversion for additional 26% ITC</li>
                <li>Use Oil & Gas investments for additional depletion deductions</li>
                <li>Structure properties in ILIT for estate protection</li>
                <li>Link to Mortgage Killer V2 for HELOC strategy on STR properties</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default STRTaxEliminatorPage;
