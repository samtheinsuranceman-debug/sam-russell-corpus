# PR-2b — navTree entries dropped during the port

The donor tree (russell-capital-app/client/src/navTree.ts) carried 289 leaves.
**141 were dropped** because they do not resolve against this application's
`shared/routeManifest.ts`, plus **17 folders** left empty by that pruning.

Nothing was silently discarded — the full list is below so any of these can be
restored deliberately once the corresponding route exists.

## target not in ROUTE_MANIFEST — 124

- Annual Financial Physical  `/portal/annual-financial-physical`
- Living Benefits Probability  `/portal/living-benefits`
- PPVA  `/portal/ppva`
- Annuity Comparison  `/portal/annuity-comparison`
- Annuity Hidden Fee Detector  `/portal/annuity-fee-detector`
- Combo Recommender V2  `/portal/combo-recommender-v2`
- 529 vs IUL  `/portal/529-vs-iul`
- Captive + IUL  `/portal/captive-iul`
- Emergency Fund vs IUL  `/portal/emergency-fund-vs-iul`
- Infinity Banking  `/portal/infinity-banking`
- IUL Compliance Engine  `/portal/iul-compliance-engine`
- IUL Max Funded  `/portal/iul-max-funded`
- Multi-Carrier IUL  `/portal/multi-carrier-iul`
- Term vs Whole vs IUL  `/portal/term-vs-whole-vs-iul`
- Whole Life Dividend  `/portal/whole-life-dividend`
- PPLI  `/portal/ppli`
- PPLI Modeler  `/portal/ppli-modeler`
- Private Placement  `/portal/private-placement`
- Split Dollar  `/portal/split-dollar`
- Split Dollar Life  `/portal/split-dollar-life`
- Tax Bracket Navigator  `/portal/tax-bracket-navigator`
- Tax Code Simulator  `/portal/tax-code-simulator`
- 199A Optimizer  `/portal/199a-optimizer`
- QBI Calculator  `/portal/qbi-calculator`
- Section 199A  `/portal/section-199a`
- Tax Credits  `/portal/tax-credits`
- Tax-Deferred Exchange  `/portal/tax-deferred-exchange`
- Gain/Loss Harvesting  `/portal/gain-loss-harvesting`
- Tax-Loss Harvesting II  `/portal/tax-loss-harvest-calc`
- Volatility Harvesting  `/portal/volatility-harvesting`
- Tax Alpha Scorecard  `/portal/tax-alpha-scorecard`
- Tax Optimizer  `/portal/tax-optimizer`
- Tax Projection  `/portal/tax-projection`
- Capital Gains Tax  `/portal/capital-gains-tax`
- Depreciation Recapture  `/portal/depreciation-recapture`
- Installment Sale  `/portal/installment-sale`
- NUA Calculator  `/portal/nua-calculator`
- State Tax Migration  `/portal/state-tax-migration`
- Tax-Equivalent Yield  `/portal/tax-equivalent-yield`
- Debt Recycling  `/portal/debt-recycling`
- IDR Plan Comparison  `/portal/idr-comparison`
- Re-Stacking  `/portal/re-stacking`
- Safe Withdrawal Rate  `/portal/safe-withdrawal-rate`
- Withdrawal Rate  `/portal/withdrawal-rate`
- Withdrawal Sequencer  `/portal/withdrawal-sequencer`
- Buy-Sell Agreement  `/portal/buy-sell-agreement`
- Buy-Sell Funding  `/portal/buy-sell-funding`
- Cross Purchase  `/portal/cross-purchase`
- Entity Comparison  `/portal/entity-comparison`
- Deferred Compensation  `/portal/deferred-compensation`
- Equity Compensation  `/portal/equity-compensation`
- Executive Bonus  `/portal/executive-bonus`
- Executive Bridge  `/portal/executive-bridge`
- Executive Comp  `/portal/executive-comp`
- Phantom Stock  `/portal/phantom-stock`
- QSBS  `/portal/qsbs`
- Business Entity  `/portal/business-entity`
- Business Exit  `/portal/business-exit`
- Business Valuation  `/portal/business-valuation`
- ESOP Analyzer  `/portal/esop-analyzer`
- ESOP Buyout  `/portal/esop-buyout`
- Key Person Insurance  `/portal/key-person-insurance`
- Contract Analyzer  `/portal/physician-contract`
- Overhead Expense  `/portal/overhead-expense`
- Practice Wealth Sync  `/portal/practice-sync`
- Practice Valuation  `/portal/practice-valuation`
- Business Succession  `/portal/business-succession`
- Succession Plan  `/portal/succession-plan`
- Succession Valuation  `/portal/succession-valuation`
- Generational Wealth Sim  `/portal/generational-wealth-sim`
- Heartfire Legacy  `/portal/heartfire-legacy`
- Multi-Generational Wealth  `/portal/multi-generational-wealth`
- Multi-Gen Roth  `/portal/multi-gen-roth`
- Backdoor Roth  `/portal/backdoor-roth`
- Mega Backdoor Roth  `/portal/mega-backdoor-roth`
- Roth Conversion Analyzer  `/portal/roth-conversion-analyzer`
- Premium Financing Arbitrage  `/portal/premium-financing-arbitrage`
- Taxable Account  `/portal/taxable-account`
- Presentation Vault  `/portal/presentation-vault`
- Home Affordability  `/portal/home-affordability`
- Reverse Mortgage  `/portal/reverse-mortgage`
- Charitable Remainder Unitrust  `/portal/charitable-remainder-unitrust`
- CLT Engine  `/portal/clt-engine`
- CRT Engine  `/portal/crt-engine`
- CRUT Deep Dive  `/portal/crut-deep-dive`
- Digital Estate Planner  `/portal/digital-estate-planner`
- Estate Freeze Comparison  `/portal/estate-freeze-comparison`
- Estate Liquidity  `/portal/estate-liquidity`
- Estate Planning Sim  `/portal/estate-planning-sim`
- Estate Timeline  `/portal/estate-timeline`
- Taxable Estate  `/portal/taxable-estate`
- Wealth Transfer Comparison  `/portal/wealth-transfer-comparison`
- Dynasty Trust  `/portal/dynasty-trust-planner`
- GRAT  `/portal/grat-calculator`
- GST Trust  `/portal/gst-trust`
- IDGT Advanced  `/portal/idgt-advanced`
- ILIT  `/portal/ilit-calculator`
- Incentive Trust  `/portal/incentive-trust`
- International Trust  `/portal/international-trust`
- QPRT Advanced  `/portal/qprt-advanced`
- QPRT Calculator  `/portal/qprt-calculator`
- SLAT Deep Dive  `/portal/slat-deep-dive`
- Special Needs Trust  `/portal/special-needs-trust`
- State Trust Planning  `/portal/state-trust-planning`
- Trust Comparison Matrix  `/portal/trust-comparison-matrix`
- Trust Funding  `/portal/trust-funding`
- Disability Gap  `/portal/disability-gap`
- Disability Insurance  `/portal/disability-insurance-needs`
- Life Insurance Needs  `/portal/life-insurance-needs`
- LTC Hybrid  `/portal/long-term-care-hybrid`
- LTC Cost  `/portal/ltc-cost`
- Own-Occ Disability  `/portal/own-occ-disability`
- Umbrella Insurance  `/portal/umbrella-insurance`
- Beneficiary IRA  `/portal/beneficiary-ira`
- Inherited Roth  `/portal/inherited-roth`
- RMD Calculator  `/portal/rmd-calculator`
- Social Security Maximizer  `/portal/social-security-maximizer`
- Social Security Bridge  `/portal/ss-bridge`
- Pension Max  `/portal/pension-max`
- Pension vs Lump Sum  `/portal/pension-vs-lump-sum`
- Patient Presentation  `/portal/client-presentation`
- Patient Report Gen  `/portal/client-report-gen`
- Peer Trust Network  `/portal/peer-network`
- AI Strategy Lab Pro  `/portal/ai-strategy-lab`

## folder left empty after pruning — 17

- Deductions & Credits
- Debt Recovery
- Rehabilitation
- Buy-Sell & Entity
- Exec Comp
- Exit Architecture
- Burn Rate Diagnostics
- Metabolic Analysis
- Charitable Trusts
- Advanced Trust Instruments
- Trust Planning
- Coverage Vitals
- Life Support (Insurance)
- Lump-Sum vs Income
- Pension Wing
- Roth & Muni
- Tax-Free Income

## placeholder (no route) — 17

- Micronutrient Tracker
- Spending Vitals Dashboard
- Cash Flow Metabolic Rate
- Lifestyle Inflation Meter
- Fixed Cost vs Variable Cost Ratio
- Hidden Cost Exposure Report
- Expense Ratio Pathology
- Regulatory Filing Suite
- Pre-Procedure Compliance Checklist
- IRMAA Reduction Protocol
- Bracket-Shift Strategy
- Tax-Free Ladder Strategy
- Muni Bond Allocation
- Tax-Free Income Projector
- Zero-Tax Retirement Blueprint
- Genome Sequencing Suite
- Risk DNA Analysis


## duplicate target removed — 1

The donor listed **Mortgage Killer** in two places: `Medicine > Mortgage Killer >
Payoff Operations` and `Wellness Coaching > Mortgage Killer > Payoff Coaching`.
After pruning, both collapsed to a single leaf pointing at the same route,
`/portal/mortgage-killer`.

The **Medicine** placement is kept. The Wellness Coaching branch was removed
whole, since pruning had left it containing nothing but the duplicate.

Caught by `server/navTree.test.ts` → *"introduces no duplicate navigation entry"*,
not by inspection.
