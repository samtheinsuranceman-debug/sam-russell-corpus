import React, { useState } from 'react';

export default function TrustsPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [isReferencesOpen, setIsReferencesOpen] = useState(false);

  const tabs = [
    'Understanding Trusts',
    'Types of ILITs',
    'Oil & Gas Through Trusts',
    'Trust Income Distribution',
    'Dynasty Trust Legacy',
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-300 p-6 lg:p-10">
      {/* References Section */}
      <div className="mb-8 bg-[#1e293b] rounded-lg shadow-lg p-6">
        <button
          className="w-full flex justify-between items-center text-white text-xl font-semibold"
          onClick={() => setIsReferencesOpen(!isReferencesOpen)}
        >
          <span>References</span>
          <svg
            className={`w-6 h-6 transform transition-transform ${isReferencesOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isReferencesOpen && (
          <ul className="mt-4 space-y-2 text-gray-300">
            <li>• IRC Section 2042 - Incidents of ownership</li>
            <li>• IRC Section 2035 - Three-year lookback rule</li>
            <li>• IRC Section 263(c) - Intangible Drilling Costs deduction</li>
            <li>• IRC Section 613 - Percentage depletion allowance (15%)</li>
            <li>• Securian Financial - Estate Planning ILIT Foreword to Counsel and Specimen Documents (F74093-25)</li>
          </ul>
        )}
      </div>

      {/* Header */}
      <h1 className="text-4xl font-bold text-white mb-6">Trusts for Wealth Protection & Legacy</h1>
      <p className="mb-8 max-w-3xl">
        Trusts are foundational tools for estate planning, offering unparalleled asset protection and control over wealth distribution. At Russell Capital Systems, we integrate trust strategies with innovative investments to build lasting legacies. Dive into the sections below to understand how trusts can secure your financial future.
      </p>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {tabs.map((tab, index) => (
          <button
            key={index}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === index
                ? 'bg-[#1e293b] text-white'
                : 'bg-transparent text-gray-400 hover:text-white'
            }`}
            onClick={() => setActiveTab(index)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-[#1e293b] rounded-lg shadow-lg p-6">
        {activeTab === 0 && (
          <div>
            <h2 className="text-3xl font-bold text-white mb-4">Understanding Trusts</h2>
            <p className="mb-4">
              A trust is a legal arrangement where a grantor transfers assets to a trustee, who manages them for the benefit of designated beneficiaries. Trusts can be revocable, allowing the grantor to alter terms during their lifetime, or irrevocable, locking in the structure for maximum tax and asset protection benefits. The distinction between grantor, trustee, and beneficiary is critical: the grantor creates and funds the trust, the trustee administers it, and beneficiaries receive the benefits per the trust’s terms. Trusts matter for wealth protection because they can remove assets from your taxable estate, reducing exposure to estate taxes, which currently exempt $13.61 million per individual in 2024 but are set to sunset to approximately $7 million in 2026.
            </p>
            <p className="mb-4">
              Irrevocable trusts, like ILITs, are particularly valuable for high-net-worth individuals as they shield assets from creditors, lawsuits, and divorce settlements while providing precise control over wealth distribution. For example, a trust holding a $2 million life insurance policy ensures the death benefit passes to beneficiaries without estate tax, potentially saving $800,000 at a 40% federal estate tax rate if above the exemption threshold. Trusts also avoid probate, a costly and public process, preserving privacy and reducing administrative delays. This makes them indispensable for anyone with significant assets or complex family dynamics.
            </p>
            <p>
              At Russell Capital Systems, our AI Strategy Engine evaluates your estate size, tax exposure, and family needs to recommend the ideal trust structure. We model scenarios like the 2026 estate tax sunset to ensure your plan remains robust under changing laws. Partner with us to craft a trust strategy that protects your wealth and aligns with your long-term vision.
            </p>
          </div>
        )}
        {activeTab === 1 && (
          <div>
            <h2 className="text-3xl font-bold text-white mb-4">Types of ILITs</h2>
            <p className="mb-4">
              Irrevocable Life Insurance Trusts (ILITs) come in various forms, each tailored to specific estate planning needs as outlined in Securian Financial’s research (F74093-25). A Traditional ILIT owns a life insurance policy, removing the death benefit from the grantor’s taxable estate and distributing proceeds tax-free to beneficiaries like children. Funding methods include Crummey gifts (annual exclusion amounts), split dollar arrangements, private financing, or income-producing assets. This structure suits high-net-worth individuals, those with illiquid assets like businesses or farms, or blended families needing precise control over asset distribution.
            </p>
            <p className="mb-4">
              Spousal Limited Access Trusts (SLATs) add flexibility by naming the non-grantor spouse and children as beneficiaries, allowing the spouse to access cash value for Health, Education, Maintenance, and Support (HEMS) needs while keeping the policy outside the estate. Beneficiary Limited Access Trusts (BLATs) extend similar access to a child or other beneficiary, with parents controlling distributions via an independent trustee for creditor protection. Partner Limited Access Trusts (PLATs) cater to unmarried partners, supporting their lifetime needs while reserving the death benefit for other heirs. Lastly, Dynasty Trusts create multi-generational legacies by paying income over time rather than lump sums, ideal in the 31 states that have repealed the Rule Against Perpetuities.
            </p>
            <p>
              Russell Capital Systems’ AI Strategy Engine analyzes your family structure and financial goals to recommend the best ILIT variant, modeling funding strategies like premium financing for tax efficiency. We ensure compliance with IRS rules, such as avoiding incidents of ownership under IRC Section 2042. Collaborate with us to select and implement the ILIT that best secures your legacy.
            </p>
          </div>
        )}
        {activeTab === 2 && (
          <div>
            <h2 className="text-3xl font-bold text-white mb-4">Oil & Gas Through Trusts</h2>
            <p className="mb-4">
              Oil and gas investments can be held within trusts, combining significant tax advantages with asset protection and structured wealth distribution. Under IRC Section 263(c), Intangible Drilling Costs (IDCs) allow 65-80% of an investment to be deducted in the first year, while IRC Section 613 provides a 15% percentage depletion allowance on gross income annually. When a trust holds a working interest in oil and gas projects, the income and tax benefits flow through to beneficiaries per the trust’s terms. This setup shields the investment from personal creditors or divorce settlements while reducing the grantor’s taxable estate.
            </p>
            <p className="mb-4">
              Consider a trust investing $300,000 in an oil and gas working interest project. Under IDC rules, $195,000 could be deducted in year one, saving $72,150 at a 37% tax bracket for the trust or beneficiaries, depending on distribution rules. Ongoing royalty income—say, $30,000 annually—receives a $4,500 depletion allowance, further reducing taxable income. The trust distributes this income to beneficiaries as specified, providing steady cash flow while maintaining legal separation from personal assets. This dual benefit of tax savings and protected income makes oil and gas a compelling trust asset.
            </p>
            <p>
              Russell Capital Systems’ AI Strategy Engine models oil and gas investments within trusts, optimizing IDC deductions and income distributions for tax efficiency. We align these strategies with broader estate planning goals, ensuring compliance with IRS regulations. Partner with us to integrate oil and gas into your trust for enhanced wealth protection and legacy building.
            </p>
          </div>
        )}
        {activeTab === 3 && (
          <div>
            <h2 className="text-3xl font-bold text-white mb-4">Trust Income Distribution</h2>
            <p className="mb-4">
              Income distribution from trusts, whether from life insurance cash value, oil and gas royalties, or other investments, follows specific tax and legal frameworks that impact beneficiaries. Trusts are classified as simple (distributing all income annually) or complex (allowing income accumulation), with Distributable Net Income (DNI) determining the taxable portion passed to beneficiaries. Trust tax brackets are compressed—reaching the 37% rate at just $14,450 of income in 2024—making it often more tax-efficient to distribute income to beneficiaries in lower brackets. Proper planning ensures income flows align with both financial needs and tax optimization.
            </p>
            <p className="mb-4">
              For example, a trust generating $50,000 in annual income from oil and gas royalties could face $18,500 in federal tax if retained at the trust level due to compressed brackets. Distributing this income to two beneficiaries in the 24% bracket reduces the tax to $12,000 total, saving $6,500 annually. Distributions can be tailored to cover specific expenses like education or healthcare, maintaining control over funds while minimizing tax liability. This strategy preserves more wealth for beneficiaries over time, enhancing the trust’s purpose.
            </p>
            <p>
              Russell Capital Systems’ AI Strategy Engine simulates trust income scenarios, calculating DNI and recommending distribution schedules to minimize tax burdens. We integrate these plans with your broader financial strategy, ensuring alignment with estate goals. Work with us to structure trust distributions that maximize benefits for your heirs.
            </p>
          </div>
        )}
        {activeTab === 4 && (
          <div>
            <h2 className="text-3xl font-bold text-white mb-4">Dynasty Trust Legacy</h2>
            <p className="mb-4">
              A Dynasty Trust is a specialized ILIT designed for multi-generational wealth transfer, paying income to beneficiaries over decades or even centuries rather than as a lump sum. Available in 31 states that have repealed or modified the Rule Against Perpetuities (e.g., Alaska, Florida, Nevada), these trusts avoid the Generation-Skipping Transfer Tax (GST) when structured properly, preserving wealth across children, grandchildren, and beyond. A life insurance policy within a Dynasty Trust can provide a perpetual income stream, ensuring financial security for future generations while minimizing estate tax exposure at each transfer point.
            </p>
            <p className="mb-4">
              Imagine a $2 million IUL death benefit placed in a Dynasty Trust upon the grantor’s passing. Instead of a one-time payout, the trust distributes $100,000 annually to children for their lifetimes, then transitions income to grandchildren, and so on, potentially lasting 100+ years in perpetuity-friendly states. This structure avoids repeated estate taxation at each generation, saving millions over time compared to traditional inheritance methods. The trust’s terms can dictate distribution amounts and conditions, maintaining the grantor’s vision indefinitely.
            </p>
            <p>
              Russell Capital Systems’ AI Strategy Engine models Dynasty Trust scenarios, projecting income distributions and tax savings across multiple generations. We ensure compliance with state laws and IRS rules to maximize legacy protection. Partner with us to establish a Dynasty Trust that secures your family’s financial future for centuries.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

