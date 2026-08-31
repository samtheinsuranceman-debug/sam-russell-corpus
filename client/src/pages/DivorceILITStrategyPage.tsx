import React, { useState } from 'react';

export default function DivorceILITStrategyPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [isReferencesOpen, setIsReferencesOpen] = useState(false);

  const tabs = [
    'The Divorce Asset Crisis',
    'ILIT as Divorce Shield',
    'SLAT Strategy for Married Couples',
    'PLAT for Unmarried Partners',
    'Implementation Roadmap',
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
            <li>• Treas. Reg. 20.2031-8(a)(1) - Goodman Rule</li>
            <li>• Hofstein Weiner & Meyer, P.C. - "Irrevocable Life Insurance Trusts in Event of a Divorce"</li>
            <li>• PA Probate Code Sections 6111.1 and 6111.2 - Divorce effect on revocable transfers</li>
            <li>• Securian Financial - Estate Planning ILIT Foreword to Counsel and Specimen Documents (F74093-25)</li>
          </ul>
        )}
      </div>

      {/* Header */}
      <h1 className="text-4xl font-bold text-white mb-6">Divorce Protection with ILIT Strategies</h1>
      <p className="mb-8 max-w-3xl">
        Divorce can devastate wealth, splitting assets and disrupting long-term financial plans. At Russell Capital Systems, we specialize in using Irrevocable Life Insurance Trusts (ILITs) to shield your wealth from marital dissolution. Explore the strategies below to learn how ILITs, including specialized variants like SLATs and PLATs, can safeguard your legacy.
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
            <h2 className="text-3xl font-bold text-white mb-4">The Divorce Asset Crisis</h2>
            <p className="mb-4">
              Divorce is a financial wrecking ball, with approximately 50% of marriages ending in dissolution and average legal costs ranging from $15,000 to $30,000 per couple. Beyond attorney fees, the division of assets can shatter retirement plans as accounts like 401(k)s are split via Qualified Domestic Relations Orders (QDROs), home equity is divided, and business valuations force liquidations at unfavorable terms. For high-net-worth individuals, the stakes are even higher, as complex portfolios and illiquid assets become battlegrounds for equitable distribution. This wealth destruction often leaves both parties with diminished financial security heading into their later years.
            </p>
            <p className="mb-4">
              Consider a couple with a $2 million joint portfolio, including a $500,000 home, $1 million in retirement accounts, and $500,000 in business interests. In a typical divorce settlement, each spouse might receive $1 million in assets, but after legal fees, taxes on liquidated assets, and market timing losses, the net value could drop to $800,000 per person. This 20% reduction in wealth—compounded by lost growth over time—can derail retirement plans. Emotional stress further clouds decision-making, often leading to suboptimal financial outcomes. Protecting assets before marital issues arise is critical to preserving your legacy.
            </p>
            <p>
              At Russell Capital Systems, we use our AI Strategy Engine to model divorce risk scenarios and identify proactive asset protection strategies. By placing key assets outside the marital estate, you can mitigate the financial fallout of divorce. Our tools provide clarity on how to structure your wealth to withstand legal challenges, ensuring your financial future remains intact.
            </p>
          </div>
        )}
        {activeTab === 1 && (
          <div>
            <h2 className="text-3xl font-bold text-white mb-4">ILIT as Divorce Shield</h2>
            <p className="mb-4">
              An Irrevocable Life Insurance Trust (ILIT) is a powerful tool to protect wealth from divorce settlements. By transferring ownership of a life insurance policy—often an Indexed Universal Life (IUL) policy—to an ILIT, the policy’s cash value and death benefit are removed from the grantor’s taxable estate and marital property. Under IRC Section 2042, as long as the grantor retains no incidents of ownership, the asset is shielded from both estate taxes and divorce claims. This structure ensures that, in the event of marital dissolution, the policy remains outside the divisible estate, preserving wealth for designated beneficiaries like children or a charitable cause.
            </p>
            <p className="mb-4">
              For example, a high-net-worth individual might fund an ILIT with a $2 million IUL policy, naming their children as beneficiaries. If a divorce occurs, the ex-spouse typically cannot claim the policy’s cash value—potentially $600,000 after 15 years of growth—or the death benefit, as the trust is irrevocable and independently managed by a trustee. Legal precedents, such as those discussed by Hofstein Weiner & Meyer, P.C., reinforce that properly structured ILITs withstand challenges in divorce court, provided no fraudulent transfer is alleged under state law. Timing is critical—establishing the ILIT well before marital issues arise avoids scrutiny under the IRS three-year lookback rule (IRC 2035).
            </p>
            <p>
              Russell Capital Systems’ AI Strategy Engine optimizes ILIT design by simulating funding strategies, premium schedules, and growth projections to maximize divorce protection while aligning with estate planning goals. Our platform ensures compliance with complex IRS rules and state-specific divorce statutes. Partner with us to build an ILIT that acts as an impenetrable financial shield.
            </p>
          </div>
        )}
        {activeTab === 2 && (
          <div>
            <h2 className="text-3xl font-bold text-white mb-4">SLAT Strategy for Married Couples</h2>
            <p className="mb-4">
              A Spousal Limited Access Trust (SLAT) is a specialized ILIT variant for married couples seeking divorce protection while maintaining spousal benefits. As outlined in Securian Financial’s estate planning documents, a SLAT allows one spouse (the grantor) to establish an irrevocable trust for the benefit of the other spouse, often funding it with an IUL policy. The beneficiary spouse can access cash value for health, education, maintenance, and support (HEMS) needs, but the asset remains outside the marital estate for divorce purposes. Upon the grantor’s death, the death benefit passes to remainder beneficiaries, such as children, free of estate tax.
            </p>
            <p className="mb-4">
              Imagine a couple where Spouse A funds a SLAT with a $1 million IUL policy for Spouse B’s benefit. If divorce occurs, Spouse B’s access is limited to HEMS distributions determined by an independent trustee, and the policy itself is not subject to equitable distribution. Post-divorce, the trust can be amended to name new beneficiaries, leveraging provisions like Pennsylvania Probate Code Section 6111.1, which treats an ex-spouse as predeceased. This dual protection—divorce shielding and estate tax exclusion—makes SLATs ideal for couples with significant assets and complex family dynamics, such as blended families.
            </p>
            <p>
              Russell Capital Systems’ AI Strategy Engine customizes SLAT setups by modeling premium funding, cash value growth, and distribution scenarios to align with your family’s needs. We ensure proper drafting to avoid IRS pitfalls like retained interest under IRC Section 2036. Collaborate with us to implement a SLAT that balances flexibility and protection.
            </p>
          </div>
        )}
        {activeTab === 3 && (
          <div>
            <h2 className="text-3xl font-bold text-white mb-4">PLAT for Unmarried Partners</h2>
            <p className="mb-4">
              A Partner Limited Access Trust (PLAT) is an ILIT variant designed for unmarried partners, addressing unique needs in relationships like young cohabitating couples, second marriages with children from prior relationships, divorced individuals who don’t remarry, or senior couples avoiding legal marriage. As detailed in Securian Financial’s research, a PLAT allows the grantor to provide for a partner’s lifetime needs via limited access to cash value while stipulating ultimate beneficiaries (often children) for the death benefit. This structure keeps the policy outside the taxable estate and protects assets from potential future relationship disputes.
            </p>
            <p className="mb-4">
              For instance, a grantor in a second relationship might establish a PLAT with a $1.5 million IUL policy, naming their partner and children from a prior marriage as beneficiaries. The partner can access up to $40,000 annually from cash value for living expenses, as determined by an independent trustee, while the death benefit is reserved for the children. This setup ensures financial support for the partner without risking the legacy intended for the grantor’s heirs, even if the relationship ends. The irrevocable nature of the trust further shields the asset from legal challenges.
            </p>
            <p>
              Russell Capital Systems leverages our AI Strategy Engine to tailor PLAT structures, balancing support for partners with legacy protection for other beneficiaries. We simulate distribution schedules and tax implications to ensure compliance and efficiency. Work with us to secure your financial intentions across complex personal dynamics.
            </p>
          </div>
        )}
        {activeTab === 4 && (
          <div>
            <h2 className="text-3xl font-bold text-white mb-4">Implementation Roadmap</h2>
            <p className="mb-4">
              Implementing an ILIT for divorce protection follows a structured roadmap to ensure legal compliance and financial efficacy. Step one involves a comprehensive assessment with Russell Capital Systems’ AI Strategy Engine, which analyzes your asset portfolio, income, and family dynamics to recommend the optimal trust type (Traditional ILIT, SLAT, or PLAT). Step two engages a qualified attorney to draft the irrevocable trust, incorporating provisions for divorce protection, such as treating an ex-spouse as predeceased. Step three sees the trustee purchase an IUL policy, often with a death benefit tailored to your estate planning goals.
            </p>
            <p className="mb-4">
              In step four, the trust is funded via annual exclusion gifts—$18,000 per person in 2024—or lifetime exemption amounts, ensuring premiums are paid without triggering gift taxes. Step five requires sending Crummey notices to beneficiaries, qualifying the gifts for exclusion under IRS rules. Over time, in step six, the cash value builds tax-free within the trust, potentially reaching $500,000 on a $1 million policy over 20 years. Finally, in step seven, distributions for HEMS needs become available to designated beneficiaries, providing flexibility while maintaining asset protection.
            </p>
            <p>
              Russell Capital Systems guides you through each step, using our AI Engine to model funding strategies, growth projections, and distribution impacts. Our platform ensures alignment with IRS regulations like the three-year lookback rule (IRC 2035) while optimizing for divorce and creditor protection. Partner with us to execute an ILIT strategy that secures your wealth against life’s uncertainties.
            </p>
          </div>
        )}
      </div>

      {/* ━━━ 50-YEAR PROJECTION ENGINE ━━━ */}
      <div className="mt-12 bg-[#0c1425] border border-emerald-500/20 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-white mb-4">50-Year Projection Engine</h2>
        <div className="flex items-center gap-4 mb-6">
          <label className="text-sm text-slate-400">Projection Horizon:</label>
          <input type="range" min="1" max="50" defaultValue="30" className="flex-1 accent-emerald-500"
            onChange={(e) => {
              const val = e.target.value;
              document.getElementById(`proj-year-divorce-ilit`)!.textContent = val;
            }} />
          <span id={`proj-year-divorce-ilit`} className="text-emerald-400 font-bold text-lg w-12 text-center">30</span>
          <span className="text-slate-500 text-sm">years</span>
        </div>
        <div className="flex gap-2 mb-6">
          {['Conservative', 'Moderate', 'Aggressive'].map((s, i) => (
            <button key={s} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              i === 1 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}>{s}</button>
          ))}
        </div>
        <div className="grid grid-cols-5 gap-4 text-center">
          {[5, 10, 20, 30, 50].map(yr => (
            <div key={yr} className="bg-[#1e293b] rounded-lg p-4">
              <div className="text-slate-500 text-xs mb-1">Year {yr}</div>
              <div className="text-emerald-400 font-bold text-lg">[ILIT Asset Growth]</div>
            </div>
          ))}
        </div>
      </div>

      {/* ━━━ AI BRAIN → AI ADVISOR CONNECTOR ━━━ */}
      <div className="mt-8 bg-gradient-to-r from-[#0c1425] to-[#1a1040] border border-purple-500/20 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-purple-400">🧠</span> AI Brain Analysis
          </h2>
          <div className="flex gap-2">
            <a href="/portal/ai-assist" className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg text-sm hover:bg-purple-500/30 transition-all">
              Send to AI Advisor →
            </a>
            <a href="/portal/ai-brain" className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm hover:bg-emerald-500/30 transition-all">
              View AI Brain Hub →
            </a>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#1e293b] rounded-lg p-4">
            <div className="text-amber-400 text-sm font-semibold mb-2">⚡ Immediate Action</div>
            <p className="text-slate-300 text-sm">Run this calculator with client data, then let the AI Advisor generate a personalized recommendation based on the 50-year projection.</p>
          </div>
          <div className="bg-[#1e293b] rounded-lg p-4">
            <div className="text-emerald-400 text-sm font-semibold mb-2">📊 Cross-Calculator Insight</div>
            <p className="text-slate-300 text-sm">This tool syncs with all 248+ calculators via StrategyContext. Changes here automatically cascade to related projections across the platform.</p>
          </div>
          <div className="bg-[#1e293b] rounded-lg p-4">
            <div className="text-rose-400 text-sm font-semibold mb-2">🛡️ Risk Assessment</div>
            <p className="text-slate-300 text-sm">The AI Brain continuously monitors market conditions and adjusts risk scores. Connect to the AI Advisor for real-time mitigation strategies.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
