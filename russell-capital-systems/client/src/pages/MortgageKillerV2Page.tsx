import React, { useState } from 'react';

const MortgageKillerV2Page: React.FC = () => {
  const [activeTab, setActiveTab] = useState('strategy');
  const [isReferencesOpen, setIsReferencesOpen] = useState(false);
  const [homeValue, setHomeValue] = useState(400000);
  const [mortgageRate, setMortgageRate] = useState(6.5);
  const [helocRate, setHelocRate] = useState(8.0);
  const [appreciationRate, setAppreciationRate] = useState(5.0);
  const [iulCreditingRate, setIulCreditingRate] = useState(6.5);
  const [propertyCycles, setPropertyCycles] = useState(4);
  const [yearsBetween, setYearsBetween] = useState(7);

  const calculateCycles = () => {
    const cycles = [];
    let netWorth = 0;
    let iulCashValue = 0;
    let currentHomeValue = homeValue;
    for (let i = 0; i < propertyCycles; i++) {
      const purchasePrice = currentHomeValue;
      const downPayment = purchasePrice * 0.2;
      const helocAmount = purchasePrice * 0.8;
      const yearsToPayoff = yearsBetween;
      const equityBuilt = purchasePrice * (Math.pow(1 + appreciationRate / 100, yearsToPayoff) - 1);
      iulCashValue += helocAmount * 0.2 * (Math.pow(1 + iulCreditingRate / 100, yearsToPayoff) - 1);
      netWorth += purchasePrice + equityBuilt + iulCashValue;
      cycles.push({
        cycle: i + 1,
        purchasePrice,
        downPayment,
        helocAmount,
        yearsToPayoff,
        equityBuilt: Math.round(equityBuilt),
        iulCashValue: Math.round(iulCashValue),
        netWorth: Math.round(netWorth),
      });
      currentHomeValue *= 1.25; // Simulate increasing property prices
    }
    return cycles;
  };

  const cyclesData = calculateCycles();

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-300 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-white text-3xl font-bold mb-6">Mortgage Killer: Lifetime Wealth Multiplication</h1>

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
              <li>IRC §163(h) — Mortgage interest deduction</li>
              <li>IRC §72(e) — Tax-free IUL policy loans</li>
              <li>IRC §101(a) — Tax-free death benefit</li>
              <li>Reg. §1.72-2 — Life insurance contract definitions</li>
              <li>Federal Reserve Economic Data (FRED) — Historical home appreciation rates</li>
              <li>National Association of Realtors — Median home price data</li>
            </ul>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-6">
          {['References & Legal', 'The Lifetime Strategy', 'Property Cycle Calculator', 'Generate Outcome', 'AI Strategy Engine'].map((tab) => (
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

          {activeTab === 'the-lifetime-strategy' && (
            <div>
              <h2 className="text-white text-2xl mb-4">The Lifetime Strategy</h2>
              <p className="mb-4">
                The Mortgage Killer strategy uses a HELOC-to-IUL approach to pay off mortgages faster and build wealth through multiple property cycles. After paying off Property #1, equity is used to purchase Property #2, and the cycle repeats.
              </p>
              <div className="space-y-4">
                <div>Year 0-7: Property #1 ($400K) — HELOC-to-IUL eliminates mortgage, builds $180K IUL cash value. Net Worth: $580K</div>
                <div>Year 7-12: Property #2 ($500K) — Use Property #1 equity. Net Worth: $1.2M</div>
                <div>Year 12-18: Property #3 ($650K) — IUL cash value now $500K+. Net Worth: $2.3M</div>
                <div>Year 18-25: Property #4 ($800K) — Portfolio: 4 properties + $1.2M IUL. Net Worth: $4.5M</div>
                <div>Year 25-30: Retirement — 4 rentals ($8K/month) + tax-free IUL loans ($150K/year). Net Worth: $5.5M</div>
                <div className="text-yellow-300">
                  Traditional Path: 30-year mortgage on one property. Net Worth: $1.1M (1 property, no IUL)
                </div>
              </div>
            </div>
          )}

          {activeTab === 'property-cycle-calculator' && (
            <div>
              <h2 className="text-white text-2xl mb-4">Property Cycle Calculator</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label>Starting Home Value: ${homeValue.toLocaleString()}</label>
                  <input type="range" min="200000" max="2000000" value={homeValue} onChange={(e) => setHomeValue(Number(e.target.value))} className="w-full" />
                </div>
                <div>
                  <label>Mortgage Rate: {mortgageRate}%</label>
                  <input type="range" min="3" max="8" step="0.1" value={mortgageRate} onChange={(e) => setMortgageRate(Number(e.target.value))} className="w-full" />
                </div>
                <div>
                  <label>HELOC Rate: {helocRate}%</label>
                  <input type="range" min="5" max="12" step="0.1" value={helocRate} onChange={(e) => setHelocRate(Number(e.target.value))} className="w-full" />
                </div>
                <div>
                  <label>Home Appreciation Rate: {appreciationRate}%</label>
                  <input type="range" min="2" max="8" step="0.1" value={appreciationRate} onChange={(e) => setAppreciationRate(Number(e.target.value))} className="w-full" />
                </div>
                <div>
                  <label>IUL Crediting Rate: {iulCreditingRate}%</label>
                  <input type="range" min="4" max="9" step="0.1" value={iulCreditingRate} onChange={(e) => setIulCreditingRate(Number(e.target.value))} className="w-full" />
                </div>
                <div>
                  <label>Property Cycles: {propertyCycles}</label>
                  <input type="range" min="1" max="6" value={propertyCycles} onChange={(e) => setPropertyCycles(Number(e.target.value))} className="w-full" />
                </div>
                <div>
                  <label>Years Between Purchases: {yearsBetween}</label>
                  <input type="range" min="5" max="10" value={yearsBetween} onChange={(e) => setYearsBetween(Number(e.target.value))} className="w-full" />
                </div>
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th>Cycle</th><th>Purchase Price</th><th>Down Payment</th><th>HELOC Amount</th><th>Years to Payoff</th><th>Equity Built</th><th>IUL Cash Value</th><th>Net Worth</th>
                  </tr>
                </thead>
                <tbody>
                  {cyclesData.map((cycle) => (
                    <tr key={cycle.cycle} className="border-b border-gray-600">
                      <td>{cycle.cycle}</td>
                      <td>${cycle.purchasePrice.toLocaleString()}</td>
                      <td>${cycle.downPayment.toLocaleString()}</td>
                      <td>${cycle.helocAmount.toLocaleString()}</td>
                      <td>{cycle.yearsToPayoff}</td>
                      <td>${cycle.equityBuilt.toLocaleString()}</td>
                      <td>${cycle.iulCashValue.toLocaleString()}</td>
                      <td>${cycle.netWorth.toLocaleString()}</td>
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
                <div>Total Properties Owned at Retirement: {propertyCycles}</div>
                <div>Total Rental Income Projection: ${(propertyCycles * 2000).toLocaleString()}/month</div>
                <div>Total IUL Cash Value: ${(cyclesData[cyclesData.length - 1]?.iulCashValue || 0).toLocaleString()}</div>
                <div>Tax-Free Retirement Income Available: ${(propertyCycles * 2000 * 12 + 150000).toLocaleString()}/year</div>
                <div className="text-yellow-300">
                  Total Wealth Created: ${(cyclesData[cyclesData.length - 1]?.netWorth || 0).toLocaleString()} vs Traditional 30-Year Mortgage: $1,100,000
                </div>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md">Send to AI Strategy Engine for Full Analysis</button>
                <p className="text-sm text-gray-400">
                  Disclaimer: This illustration is hypothetical. Actual results depend on market conditions, interest rates, and individual circumstances.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'ai-strategy-engine' && (
            <div>
              <h2 className="text-white text-2xl mb-4">AI Strategy Engine</h2>
              <p className="mb-4">Based on your Mortgage Killer V2 results, the AI recommends:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Link to Tax Waterfall for rental income optimization</li>
                <li>Link to Estate Planning for property trust strategies</li>
                <li>Link to Time Machine for "what if you started 5 years earlier"</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MortgageKillerV2Page;
