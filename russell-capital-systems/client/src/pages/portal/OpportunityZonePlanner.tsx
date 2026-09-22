// @ts-nocheck

import React, { useState, useMemo } from 'react';
import { MapPin, DollarSign, TrendingUp, Shield, CheckCircle2, AlertTriangle, Calendar, Target, Building2, Clock, ArrowRight, Award } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { PageInsights } from "@/components/PageInsights";

const OpportunityZonePlanner = () => {
  const [capitalGain, setCapitalGain] = useState(1000000); // Default to $1,000,000

  // Calculate wealth data using useMemo for performance
  const wealthData = useMemo(() => {
    const taxRate = 0.238; // 23.8% tax rate
    const growthRate = 0.08; // 8% annual growth
    const years = Array.from({ length: 21 }, (_, i) => i); // 0 to 20 years

    const withoutOZ = years.map(year => {
      const initialWithout = capitalGain * (1 - taxRate); // After tax
      const futureValue = initialWithout * Math.pow(1 + growthRate, year);
      return { year, withoutOZ: futureValue };
    });

    const withOZ = years.map(year => {
      const initialWith = capitalGain; // Full amount invested
      const futureValue = initialWith * Math.pow(1 + growthRate, year);
      // Adjust for deferred tax in 2026 (year 0 is now, so year ~6 from 2020, but simplify as per description)
      if (year >= 6) { // Assuming year 0 is 2020, year 6 is 2026
        return { year, withOZ: futureValue - (capitalGain * taxRate) }; // Subtract deferred tax
      }
      return { year, withOZ: futureValue };
    });

    return years.map((year, index) => ({
      year,
      withoutOZ: withoutOZ[index].withoutOZ,
      withOZ: withOZ[index].withOZ,
    }));
  }, [capitalGain]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#0a0f1a] text-gray-900 dark:text-gray-100 font-sans">
      {/* Header Section */}
      <header className="p-6 bg-blue-600 dark:bg-blue-800 text-white text-center shadow-lg">
        <h1 className="text-4xl font-bold">Opportunity Zone Planner</h1>
        <div className="mt-4 flex justify-center items-center">
          <DollarSign className="mr-2" size={24} />
          <input
            type="number"
            value={capitalGain}
            onChange={(e) => setCapitalGain(Number(e.target.value))}
            className="p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-1/3"
            placeholder="Enter Capital Gain (e.g., 1000000)"
          />
        </div>
      </header>

      {/* OZ Investment Timeline Section */}
      <section className="p-6 bg-gray-200 dark:bg-[#0d1526]">
        <h2 className="text-2xl font-semibold mb-4 flex items-center">
          <Calendar className="mr-2" size={24} color="blue" />
          OZ Investment Timeline
        </h2>
        <div className="relative flex justify-between items-center mt-4">
          <div className="flex-1 text-center">
            <div className="bg-yellow-400 dark:bg-yellow-600 p-2 rounded shadow">
              Day 0: Realize ${capitalGain} capital gain
            </div>
          </div>
          <ArrowRight className="mx-2" size={24} color="gold" />
          <div className="flex-1 text-center">
            <div className="bg-blue-400 dark:bg-blue-600 p-2 rounded shadow">
              Day 180: Invest ${capitalGain} in QOF (deadline)
            </div>
          </div>
          <ArrowRight className="mx-2" size={24} color="gold" />
          <div className="flex-1 text-center">
            <div className="bg-red-400 dark:bg-red-600 p-2 rounded shadow">
              Year 5: 10% basis step-up (EXPIRED - before 12/31/2026)
            </div>
          </div>
          <ArrowRight className="mx-2" size={24} color="gold" />
          <div className="flex-1 text-center">
            <div className="bg-red-400 dark:bg-red-600 p-2 rounded shadow">
              Year 7: 15% basis step-up (EXPIRED - before 12/31/2026)
            </div>
          </div>
          <ArrowRight className="mx-2" size={24} color="gold" />
          <div className="flex-1 text-center">
            <div className="bg-green-400 dark:bg-green-600 p-2 rounded shadow">
              Year 10+: Eliminate ALL gains on OZ investment
            </div>
          </div>
          <ArrowRight className="mx-2" size={24} color="gold" />
          <div className="flex-1 text-center">
            <div className="bg-orange-400 dark:bg-orange-600 p-2 rounded shadow">
              Original gain deferred until 12/31/2026 or sale
            </div>
          </div>
        </div>
      </section>

      {/* Wealth Comparison Section */}
      <section className="p-6 bg-gray-300 dark:bg-gray-700">
        <h2 className="text-2xl font-semibold mb-4 flex items-center">
          <TrendingUp className="mr-2" size={24} color="blue" />
          Wealth Comparison (20 Years)
        </h2>
        <p className="mb-2">Without OZ: Tax at 23.8% on ${capitalGain} = $${(capitalGain * 0.238).toFixed(0)}, Invest remaining at 8% = ~$3.55M in 20 years</p>
        <p className="mb-2">With OZ: Invest full ${capitalGain} at 8% = ~$4.66M in 20 years, Pay deferred tax in 2026, Net advantage: ~$1.11M</p>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={wealthData}>
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="withoutOZ" stroke="red" fill="red" name="Without OZ" />
            <Area type="monotone" dataKey="withOZ" stroke="green" fill="green" name="With OZ" />
          </AreaChart>
        </ResponsiveContainer>
      </section>

      {/* Investment Types Section */}
      <section className="p-6 bg-gray-200 dark:bg-[#0d1526]">
        <h2 className="text-2xl font-semibold mb-4 flex items-center">
          <Building2 className="mr-2" size={24} color="blue" />
          Investment Types
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border rounded shadow bg-white dark:bg-gray-700">
            <h3 className="font-bold flex items-center">
              <Target className="mr-2" size={20} color="gold" />
              QOZ Business
            </h3>
            <p>Operating company in OZ</p>
            <p>70% of tangible property in OZ</p>
            <p>Active business requirement</p>
          </div>
          <div className="p-4 border rounded shadow bg-white dark:bg-gray-700">
            <h3 className="font-bold flex items-center">
              <MapPin className="mr-2" size={20} color="gold" />
              QOZ Property
            </h3>
            <p>Real estate in OZ</p>
            <p>Must substantially improve (2x basis)</p>
            <p>30-month improvement period</p>
          </div>
          <div className="p-4 border rounded shadow bg-white dark:bg-gray-700">
            <h3 className="font-bold flex items-center">
              <Shield className="mr-2" size={20} color="gold" />
              QOZ Fund
            </h3>
            <p>Invest through Qualified Opportunity Fund</p>
            <p>90% of assets in OZ property/business</p>
            <p>Semi-annual testing</p>
          </div>
        </div>
      </section>

      {/* Substantial Improvement Test Section */}
      <section className="p-6 bg-gray-300 dark:bg-gray-700">
        <h2 className="text-2xl font-semibold mb-4 flex items-center">
          <Clock className="mr-2" size={24} color="blue" />
          Substantial Improvement Test
        </h2>
        <p>Purchase price of building (not land): $500,000</p>
        <p>Must invest $500,000+ in improvements within 30 months</p>
        <p>Land value excluded from test</p>
        <p>Original use property exempt from test</p>
        <div className="mt-4">
          <input
            type="number"
            placeholder="Enter building purchase price"
            className="p-2 border rounded bg-white dark:bg-gray-600 w-full"
          />
          <button className="mt-2 bg-blue-500 p-2 rounded text-white">Calculate Improvements Needed</button>
        </div>
      </section>

      {/* Exit Strategy Matrix Section */}
      <section className="p-6 bg-gray-200 dark:bg-[#0d1526]">
        <h2 className="text-2xl font-semibold mb-4 flex items-center">
          <Award className="mr-2" size={24} color="blue" />
          Exit Strategy Matrix
        </h2>
        <div className="overflow-x-auto"><table className="w-full border-collapse border border-gray-300 dark:border-[#1e3a5f]">
          <thead>
            <tr className="bg-blue-500 dark:bg-blue-700 text-white">
              <th className="p-2 border">Hold Period</th>
              <th className="p-2 border">Original Gain</th>
              <th className="p-2 border">OZ Gain</th>
              <th className="p-2 border">Total Tax</th>
            </tr>
          </thead>
          <tbody>
            <tr className="even:bg-gray-100 dark:even:bg-gray-600">
              <td className="p-2 border">&lt; 10 years</td>
              <td className="p-2 border">Deferred (due 2026)</td>
              <td className="p-2 border">Taxable</td>
              <td className="p-2 border">Full tax</td>
            </tr>
            <tr className="even:bg-gray-100 dark:even:bg-gray-600">
              <td className="p-2 border">10+ years</td>
              <td className="p-2 border">Deferred (due 2026)</td>
              <td className="p-2 border">TAX-FREE</td>
              <td className="p-2 border">Only original</td>
            </tr>
            <tr className="even:bg-gray-100 dark:even:bg-gray-600">
              <td className="p-2 border">Death</td>
              <td className="p-2 border">Stepped-up basis</td>
              <td className="p-2 border">Stepped-up</td>
              <td className="p-2 border">Potentially $0</td>
            </tr>
          </tbody>
        </table></div>
      </section>

      {/* IRS Compliance Section */}
      <section className="p-6 bg-gray-300 dark:bg-gray-700">
        <h2 className="text-2xl font-semibold mb-4 flex items-center">
          <CheckCircle2 className="mr-2" size={24} color="blue" />
          IRS Compliance
        </h2>
        <ul className="list-disc pl-5">
          <li>IRC §1400Z-2 Opportunity Zones</li>
          <li>IRC §1400Z-2(d) QOF requirements</li>
          <li>IRC §1400Z-2(b) deferral election</li>
          <li>IRC §1400Z-2(c) basis step-up after 10 years</li>
          <li>180-day investment window</li>
        </ul>
        <AlertTriangle className="mt-4 inline" size={24} color="gold" />
        <p className="inline ml-2">Ensure compliance to avoid penalties.</p>
      </section>

      {/* Footer for additional info */}
      <footer className="p-4 text-center bg-gray-400 dark:bg-[#0d1526]">
        <p>Built with React, Tailwind CSS, and Recharts. Dark theme with blue/gold accents for better visualization.</p>
      </footer>
      <PageInsights section="opportunity-zone-planner" />
    </div>
  );
};

export default OpportunityZonePlanner;
