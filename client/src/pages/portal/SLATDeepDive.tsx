// @ts-nocheck

import React, { useState, useMemo } from 'react';
import { Users, DollarSign, TrendingUp, Shield, CheckCircle2, AlertTriangle, Calendar, Target, Percent, ArrowRight, Heart, Lock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, ComposedChart, Line } from 'recharts';
import { PageInsights } from "@/components/PageInsights";
import { TAX_RULES_2026 } from "@shared/taxRules";

export default function SLATDeepDive() {
  const [showDetails, setShowDetails] = useState(false);
  const [selectedYear, setSelectedYear] = useState(2024);

  const estateGrowthData = useMemo(() => {
    const initialEstate = 10000000; // $10M starting value
    const growthRate = 0.04; // 4% annual growth
    return Array.from({ length: 31 }, (_, i) => ({
      year: 2024 + i,
      estateValue: initialEstate * Math.pow(1 + growthRate, i),
    }));
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white p-8 font-sans">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-indigo-400 flex items-center justify-center">
          <Users className="mr-2" size={32} />
          Spousal Lifetime Access Trust (SLAT) Deep Dive
        </h1>
        <p className="mt-4 text-[#94a3b8]">A comprehensive analysis of SLATs for estate planning, including risks, benefits, and projections.</p>
      </header>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-emerald-400 flex items-center">
          <DollarSign className="mr-2" size={24} />
          Introduction to SLATs
        </h2>
        <p className="mt-4 text-gray-200">
          A Spousal Lifetime Access Trust (SLAT) is an irrevocable trust designed to remove assets from your estate while providing indirect access to your spouse. It leverages the gift tax exemption to protect wealth from estate taxes and creditors, but requires careful structuring to avoid common pitfalls.
        </p>
        <ul className="mt-4 list-disc pl-6 text-[#94a3b8]">
          <li>Key benefits: Asset protection, tax savings, and generational wealth transfer.</li>
          <li>Potential drawbacks: Irrevocability and dependency on spousal access.</li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-indigo-400 flex items-center">
          <Shield className="mr-2" size={24} />
          Dual SLAT Structure and Reciprocal Trust Doctrine Warning
        </h2>
        <p className="mt-4 text-gray-200">
          In a dual SLAT setup, each spouse creates a trust for the other, allowing mutual access to assets. However, this can trigger the reciprocal trust doctrine, where the IRS might treat the trusts as mutual and include them in your estate.
        </p>
        <div className="mt-4 p-4 bg-[#0d1526] rounded-lg flex items-center text-yellow-400">
          <AlertTriangle className="mr-2" size={20} />
          <p>Warning: Under IRC rules, if trusts are substantially similar, they may be recharacterized, leading to unintended tax liabilities. Always consult an estate attorney to differentiate the trusts.</p>
        </div>
        <ul className="mt-4 list-disc pl-6 text-[#94a3b8]">
          <li>Best practice: Vary trust terms, such as beneficiaries or withdrawal rights, to avoid reciprocity.</li>
          <li>Example: Spouse A’s trust might include children as beneficiaries, while Spouse B’s does not.</li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-emerald-400 flex items-center">
          <Calendar className="mr-2" size={24} />
          Exemption Under Current Law
        </h2>
        {/* $15M per person in 2026, indexed, no sunset — P.L. 119-21 § 70106 amending IRC § 2010(c)(3), https://www.congress.gov/119/plaws/publ21/PLAW-119publ21.pdf; Rev. Proc. 2025-32, https://www.irs.gov/pub/irs-drop/rp-25-32.pdf (read 23 Sep 2026). Was "sunset from $13.61M (2024) to $7M in 2026". */}
        <p className="mt-4 text-gray-200">
          The federal estate and gift tax exemption is $15 million per person in 2026, indexed for inflation. The One Big Beautiful Bill Act (P.L. 119-21, July 2025) made it permanent, so there is no scheduled sunset. A lower exemption is possible only if a future Congress changes the law.
        </p>
        <div className="mt-4 flex items-center justify-center">
          <div className="bg-[#0d1526] p-6 rounded-lg shadow-lg">
            <p className="text-xl text-indigo-400">Current Exemption: $15M per person (2026, indexed)</p>
            <p className="text-xl text-emerald-400 mt-2">Scheduled sunset: none (P.L. 119-21)</p>
            <button
              onClick={() => setSelectedYear(prev => prev + 1)}
              className="mt-4 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded"
            >
              Advance Year <ArrowRight className="inline ml-2" size={16} />
            </button>
          </div>
        </div>
        <p className="mt-4 text-[#94a3b8]">
          Action item: Fund your SLAT before 2026 to lock in the higher exemption and protect more assets.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-indigo-400 flex items-center">
          <Percent className="mr-2" size={24} />
          Gift Tax: Annual Exclusion vs Lifetime Exemption
        </h2>
        <p className="mt-4 text-gray-200">
          When funding a SLAT, you can use the annual gift tax exclusion ({`$${TAX_RULES_2026.annualGiftExclusion.toLocaleString()} per recipient in ${TAX_RULES_2026.taxYear}; Source: IRS Rev. Proc. 2025-32`}) or the lifetime exemption. The annual exclusion applies to gifts without strings attached, while the lifetime exemption covers larger transfers but reduces your available estate tax exemption.
        </p>
        <ul className="mt-4 list-disc pl-6 text-[#94a3b8]">
          <li>Annual Exclusion: Ideal for smaller gifts; no tax return required if under the limit.</li>
          <li>Lifetime Exemption: Use for SLAT funding over {`$${TAX_RULES_2026.annualGiftExclusion.toLocaleString()}`} per recipient; triggers gift tax reporting under IRC 2511.</li>
          <li>Comparison: Annual gifts preserve your lifetime exemption, but may not suffice for substantial estate planning.</li>
        </ul>
        <div className="mt-4 p-4 bg-[#0d1526] rounded-lg">
          <p className="text-emerald-400">Tip: Combine both for optimal strategy—use annual exclusion for immediate gifts and lifetime for the bulk.</p>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-emerald-400 flex items-center">
          <TrendingUp className="mr-2" size={24} />
          30-Year Estate Growth Projection
        </h2>
        <p className="mt-4 text-gray-200">
          This projection illustrates how a SLAT-funded estate might grow over 30 years, assuming a 4% annual growth rate. Data is based on initial funding of $10M.
        </p>
        <div className="mt-8 h-96 bg-[#0d1526] rounded-lg p-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={estateGrowthData}>
              <XAxis dataKey="year" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="estateValue" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-4 text-[#94a3b8]">
          Key Insight: By 2054, the estate could reach approximately ${(estateGrowthData[30].estateValue / 1e6).toFixed(2)}M, highlighting the power of compound growth in a SLAT.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-indigo-400 flex items-center">
          <Heart className="mr-2" size={24} />
          Spousal Access vs Creditor Protection Balance
        </h2>
        <p className="mt-4 text-gray-200">
          SLATs provide spousal access through withdrawal rights, but this must be balanced against creditor protection. Assets in the trust are shielded from creditors, but excessive access could undermine this.
        </p>
        <ul className="mt-4 list-disc pl-6 text-[#94a3b8]">
          <li>Spousal Access: Allows loans or distributions, maintaining lifestyle without estate inclusion.</li>
          <li>Creditor Protection: Assets are irrevocable, protecting against claims, but ensure no general power of appointment under section 2041.</li>
          <li>Balance Tip: Limit withdrawal rights to a specific percentage to preserve protection.</li>
        </ul>
        <div className="mt-4 flex items-center">
          <Shield className="mr-2 text-emerald-400" size={20} />
          <p className="text-gray-200">Achieving balance is crucial for long-term security.</p>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-emerald-400 flex items-center">
          <Target className="mr-2" size={24} />
          Generation-Skipping Provisions
        </h2>
        <p className="mt-4 text-gray-200">
          SLATs can include generation-skipping transfer (GST) provisions to bypass estate taxes for grandchildren. This requires allocating GST exemption at funding.
        </p>
        <ul className="mt-4 list-disc pl-6 text-[#94a3b8]">
          <li>GST Exemption: Similar to gift tax, allows tax-free transfers to skip generations.</li>
          <li>Benefits: Preserves wealth across multiple generations without intermediate taxation.</li>
          <li>Risks: If not properly allocated, future distributions could incur GST tax.</li>
        </ul>
        <p className="mt-4 text-gray-200">
          Example: A SLAT with GST provisions could transfer $15M (the 2026 GST exemption) to grandchildren tax-free, amplifying family wealth.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-indigo-400 flex items-center">
          <Lock className="mr-2" size={24} />
          Compliance and Tax Considerations
        </h2>
        <p className="mt-4 text-gray-200">
          Ensuring SLAT compliance is essential to avoid IRS scrutiny. Key sections include:
        </p>
        <ul className="mt-4 list-disc pl-6 text-[#94a3b8]">
          <li>IRC 2511: Gifts to SLATs are completed gifts, using your exemption.</li>
          <li>Section 2036: Avoid retained interests; the trust must be irrevocable without control.</li>
          <li>Section 2041: No general power of appointment for the grantor to prevent estate inclusion.</li>
          <li>Revenue Ruling 2004-64: Reimbursement of income taxes by the trust could be treated as a gift.</li>
        </ul>
        <div className="mt-4 p-4 bg-[#0d1526] rounded-lg">
          <CheckCircle2 className="mr-2 text-emerald-400" size={20} />
          <p>Compliance Checklist: Review trust documents annually and consult with a tax advisor for updates.</p>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-emerald-400 flex items-center">
          <TrendingUp className="mr-2" size={24} />
          Additional Charts for Analysis
        </h2>
        <p className="mt-4 text-gray-200">Composed chart showing gift tax implications over time.</p>
        <div className="mt-8 h-96 bg-[#0d1526] rounded-lg p-4">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={estateGrowthData.slice(0, 10)}>
              <XAxis dataKey="year" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="estateValue" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
              <Line type="monotone" dataKey="estateValue" stroke="#10B981" />
              <Bar dataKey="estateValue" fill="#EC4899" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-4 text-[#94a3b8]">This chart combines area, line, and bar for a multifaceted view of growth.</p>
      </section>

      <footer className="text-center text-[#7a95b8] mt-12">
        <p>Disclaimer: This is for educational purposes only. Consult professionals for personalized advice.</p>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="mt-4 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded"
        >
          Toggle Details {showDetails ? 'Hide' : 'Show'}
        </button>
        {showDetails && (
          <div className="mt-4 p-4 bg-[#0d1526] rounded-lg">
            <p>Extended details: SLATs are complex instruments. Ensure all provisions align with current tax laws.</p>
            <ul className="list-disc pl-6">
              <li>Monitor legislative changes post-2026.</li>
              <li>Integrate with other trusts like dynasty trusts.</li>
              <li>Consider state-specific laws for added protection.</li>
            </ul>
          </div>
        )}
      </footer>
      <PageInsights section="s-l-a-t-deep-dive" />
    </div>
  );
}
