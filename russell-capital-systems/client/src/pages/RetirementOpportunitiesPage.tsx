import React, { useState } from 'react';

export default function RetirementOpportunitiesPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [isReferencesOpen, setIsReferencesOpen] = useState(false);

  const tabs = [
    'Tax-Free Retirement Income',
    'Fixed Indexed Annuities',
    'Solar Roth Conversions',
    'Oil & Gas Tax Strategies',
    'Top 10 Retirement Opportunities',
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
            <li>• IRC Section 7702 - Life insurance contract definition (tax-free growth)</li>
            <li>• IRC Section 263(c) - Intangible Drilling Costs deduction</li>
            <li>• IRC Section 613 - Percentage depletion allowance (15%)</li>
            <li>• IRC Section 48 - Investment Tax Credit (solar 30%)</li>
            <li>• IRC Section 408A - Roth IRA conversion rules</li>
            <li>• NAIC AG49 - Actuarial Guideline for IUL illustrations</li>
            <li>• Kiplinger - "The Top 10 Side Gigs For Retirees In 2026" (Jan 25, 2026)</li>
            <li>• Airbnb - "Typical U.S. host earned ~$14,000 in supplemental income" (2022-2023 data)</li>
            <li>• NerdWallet - "16 Passive Income Ideas for 2026" (Feb 10, 2026)</li>
          </ul>
        )}
      </div>

      {/* Header */}
      <h1 className="text-4xl font-bold text-white mb-6">Retirement Income Opportunities</h1>
      <p className="mb-8 max-w-3xl">
        Planning for retirement requires innovative strategies to ensure financial security and growth. At Russell Capital Systems, we leverage advanced tools like the AI Strategy Engine to identify personalized opportunities that maximize tax advantages and income potential. Explore the tabs below to discover proven methods for building a robust retirement portfolio.
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
            <h2 className="text-3xl font-bold text-white mb-4">Tax-Free Retirement Income with IUL</h2>
            <p className="mb-4">
              Indexed Universal Life (IUL) insurance offers a powerful way to build tax-free retirement income under IRC Section 7702. Unlike traditional retirement accounts like 401(k)s or IRAs, IULs have no contribution limits or income restrictions, allowing high earners to save significantly more. The cash value grows tax-free with zero-floor protection, meaning your principal is safe from market downturns while still benefiting from indexed growth. At Russell Capital Systems, our AI Strategy Engine models IUL performance under NAIC AG49 illustration standards to ensure realistic projections for your retirement planning.
            </p>
            <p className="mb-4">
              Consider a physician contributing $50,000 annually to an IUL for 15 years. Assuming a conservative 6% average annual return tied to an index like the S&P 500, the cash value could grow to over $1.2 million by the end of the contribution period. In retirement, policy loans can provide tax-free income—potentially $100,000 per year for 25 years, totaling $2.5 million—without touching the principal. This strategy not only secures your financial future but also leaves a death benefit for legacy planning. Our AI Engine customizes contribution schedules and withdrawal plans to optimize tax-free income based on your unique circumstances.
            </p>
            <p>
              The flexibility of IULs makes them ideal for professionals and business owners facing unpredictable income streams. By integrating IULs into your portfolio, you mitigate market risk while ensuring steady, tax-free cash flow in retirement. Connect with Russell Capital Systems to see how our AI-driven analysis can tailor an IUL strategy to your goals, maximizing both growth and protection.
            </p>
          </div>
        )}
        {activeTab === 1 && (
          <div>
            <h2 className="text-3xl font-bold text-white mb-4">Fixed Indexed Annuities for Guaranteed Income</h2>
            <p className="mb-4">
              Fixed Indexed Annuities (FIAs) provide a secure path to guaranteed lifetime income with downside protection from market volatility. These products link growth to a market index like the S&P 500 while ensuring your principal is never at risk, making them a compelling alternative to bonds or CDs in a low-interest environment. Additionally, FIAs often include income riders that guarantee 5-7% rollup rates, compounding your income base regardless of market performance. At Russell Capital Systems, our AI Strategy Engine analyzes FIA options to match your retirement timeline and income needs.
            </p>
            <p className="mb-4">
              For example, imagine investing $500,000 in an FIA at age 60 with a 6% rollup rate income rider. By age 70, your income base could grow to $895,000, even if the market index remains flat. Activating the rider could then provide a guaranteed $35,000 per year for life, regardless of account value fluctuations. This predictable income stream can cover essential expenses, allowing other investments to grow. Multi-Year Guaranteed Annuities (MYGAs), another FIA variant, offer fixed rates over 3-10 years, serving as a bond alternative with higher yields.
            </p>
            <p>
              FIAs are particularly valuable for retirees seeking stability without sacrificing growth potential. Our AI Engine simulates various market scenarios to recommend the best FIA products and riders for your portfolio, ensuring you never outlive your savings. Partner with Russell Capital to build a retirement plan that balances security with opportunity.
            </p>
          </div>
        )}
        {activeTab === 2 && (
          <div>
            <h2 className="text-3xl font-bold text-white mb-4">Solar Roth Conversions for Tax-Free Growth</h2>
            <p className="mb-4">
              The Solar Roth Conversion strategy combines the 30% Investment Tax Credit (ITC) under IRC Section 48 with Roth IRA conversions to achieve tax-free growth for retirement. By installing solar panels, you earn a federal tax credit that can offset the taxable income generated from converting a traditional IRA to a Roth IRA in the same year. This innovative approach effectively funds a tax-free Roth conversion while adding clean energy value to your property. Russell Capital Systems’ AI Strategy Engine calculates the optimal conversion amounts and solar investment to maximize your tax benefits.
            </p>
            <p className="mb-4">
              For instance, a $100,000 solar panel installation qualifies for a $30,000 ITC. In the same year, you convert $100,000 from a traditional IRA to a Roth IRA, creating $100,000 in taxable income. The $30,000 credit reduces your tax liability significantly, potentially saving you $11,100 at a 37% tax bracket. The converted Roth IRA then grows tax-free, and withdrawals in retirement are also tax-free, adding 22-28% more income potential compared to taxable accounts. This dual benefit of tax savings and clean energy investment is a game-changer for high-net-worth individuals.
            </p>
            <p>
              Beyond personal installations, solar equity investments held within a Roth IRA can further amplify returns through community solar projects or partnerships. Our AI Engine integrates solar credits with Roth conversion timelines to ensure seamless execution and compliance with IRS rules. Let Russell Capital guide you through this cutting-edge strategy to enhance your retirement wealth.
            </p>
          </div>
        )}
        {activeTab === 3 && (
          <div>
            <h2 className="text-3xl font-bold text-white mb-4">Oil & Gas Tax Strategies</h2>
            <p className="mb-4">
              Oil and gas investments offer substantial tax advantages through Intangible Drilling Costs (IDC) deductions under IRC Section 263(c) and percentage depletion allowances under IRC Section 613. IDCs allow 65-80% of your investment to be deducted in the first year, providing immediate tax relief against ordinary income. Additionally, a 15% depletion allowance on gross income reduces taxable income annually for the life of the well. Russell Capital Systems’ AI Strategy Engine models these deductions alongside production income to optimize your portfolio’s tax efficiency.
            </p>
            <p className="mb-4">
              Consider a $200,000 investment in a working interest oil and gas project. Under IDC rules, you could deduct $130,000 in the first year, saving $48,100 at a 37% tax bracket. The 15% depletion allowance on annual production income—say, $20,000—further reduces taxable income by $3,000 per year. This strategy not only lowers your tax burden but also generates monthly income for 20-30 years, creating a dual benefit of cash flow and tax savings. These deductions remain valuable even as other tax benefits phase out post-2026, making oil and gas a strategic choice for high-income earners.
            </p>
            <p>
              Oil and gas investments can also offset taxes from other strategies, such as Roth conversions, by generating significant first-year deductions. Our AI Engine customizes investment amounts and timelines to align with your broader financial goals, ensuring maximum tax efficiency. Partner with Russell Capital to explore how oil and gas can enhance your retirement planning.
            </p>
          </div>
        )}
        {activeTab === 4 && (
          <div>
            <h2 className="text-3xl font-bold text-white mb-4">Top 10 Retirement Opportunities</h2>
            <p className="mb-4">
              Retirees often have time and expertise to leverage for supplemental income, and Russell Capital Systems identifies the top opportunities to build wealth in retirement. From short-term rental businesses averaging $14,000 per year in income (Airbnb data) to real estate buy-and-hold strategies, retirees can create steady cash flow with minimal effort. Other options, like REIT investing with 3-5% dividend yields or building a dividend portfolio of aristocrats, offer passive income without property management. Our AI Strategy Engine evaluates startup costs and income potential to match opportunities to your lifestyle.
            </p>
            <p className="mb-4">
              For those with financial acumen, offering consulting as a “Family CFO” can yield $50-$150 per hour, while online course creation on platforms like Udemy can generate $5,000-$50,000 monthly after initial setup. Oil and gas working interest investments provide 65-80% first-year deductions, as seen in a $200,000 investment yielding $130,000 in IDC write-offs. Solar energy consulting or investments, leveraging the 30% ITC, pair well with Roth conversions for tax-free growth. Additionally, bookkeeping, insurance sales, estate sale businesses, and tax preparation offer low-barrier entry points for retirees seeking active income.
            </p>
            <p>
              Each opportunity can be enhanced with Russell Capital’s tools, such as the Mortgage Killer calculator for real estate or policy loan modeling for IUL-funded down payments. Our AI Engine integrates these strategies into a cohesive retirement plan, ensuring tax efficiency and income stability. Connect with us to discover which opportunities align with your skills and financial goals, turning retirement into a period of growth and opportunity.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

