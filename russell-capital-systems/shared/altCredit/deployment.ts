// ============================================================
// PUTTING CAPITAL OUT — fifteen ways to lend money, ranked.
//
// The other half of this tab. Everything in routes.ts is about getting capital
// in; this is about what to do with it, and the two are meant to be read
// together, because the spread between them is the whole business model of
// borrowing to lend.
//
// RANKED BY riskRewardScore: 1 is speculative, unsecured and illiquid; 10 is
// secured, liquid and predictable. The score is not the return — a high return
// with a high chance of total loss scores badly here, and that is the point.
// `netOfLosses` exists for the same reason: a strategy's advertised yield and
// the yield an investor actually keeps after defaults are different numbers,
// and only one of them is ever in the pitch deck.
// ============================================================

import type { DeploymentStrategy } from "./types";

const HUB = "/portal/alt-credit";
const MORTGAGE_PAGES = ["/portal/mortgage-killer", "/portal/mortgage-ledger", "/portal/house-recycling", "/portal/real-estate-mogul"];

export const DEPLOYMENT_STRATEGIES: readonly DeploymentStrategy[] = [
  {
    slug: "merchant-cash-advance", n: 1,
    title: "Merchant Cash Advance and Revenue-Based Financing",
    description: "Buying a slice of a small business's future receivables at a discount. Advertised at 30–50% over six to nine months — and the single most heavily enforced product in small-business finance.",
    depth: "full",
    body: [
      "This is the strategy that prompted this section, and it deserves the most honest treatment on the page rather than the most enthusiastic. The mechanics are genuinely attractive at first look: you advance a small business $100,000 and buy the right to $140,000 of their future receivables, collected daily or weekly from their card settlements or bank account. If it repays over six months, you have made forty percent in half a year.",
      "Start with what that actually annualises to. Forty percent over six months is not a forty percent return — compounded, it is roughly ninety-six percent a year. Over nine months it is about fifty-six percent annualised. Those are the numbers that matter, and they are the numbers this industry spent a decade insisting were not applicable because an advance is a purchase of receivables rather than a loan. Ten states now disagree in statute.",
      "As of 2026, ten states require commercial financing disclosures that reach merchant cash advances: California, Connecticut, Florida, Georgia, Kansas, Missouri, New York, Texas, Utah and Virginia. California's SB 362, enacted in 2025 as Chapter 352 and effective 1 January 2026, goes further and requires the cost to be expressed as an APR while restricting misleading use of the words 'interest' and 'rate'. Texas HB 700 took effect 1 September 2025 with implementing rules at 7 TAC Chapter 86 from 9 July 2026. Vermont folded sales-based financing and factoring into a licensing regime on 16 June 2026 through Act 142. Louisiana brought revenue-based financing under disclosure rules from 1 August 2025. This is not a settled area — it is an area moving in one direction, quickly.",
      "The federal position is worth knowing because it is frequently misrepresented. The CFPB's 1071 small-business data rule excludes merchant cash advances, which is often presented as a clean bill of health. It is not: the CFPB has separately made an initial determination that the New York disclosure law, and potentially those in California, Utah and Virginia, are likely NOT preempted by the Truth in Lending Act — which clears the way for more states to legislate rather than fewer.",
      "Now the enforcement record, which is the part that should decide this for most people. In February 2024 a federal court entered a $20.3 million judgment against merchant cash advance operator Jonathan Braun following an FTC action, and in October 2023 the FTC obtained a permanent industry ban against an operator for deceiving small businesses and seizing personal and business assets. The FTC's complaint against RCG Advances alleged misrepresentation of terms, unauthorised withdrawals from customer accounts, and unfair collection practices including threats of physical violence. In January 2025 the New York Attorney General announced a judgment and settlement exceeding $1 billion against Yellowstone Capital, its founder and roughly two dozen affiliates, over what the AG characterised as illegal loans misrepresented as merchant cash advances.",
      "That is not a sector with a few bad actors. That is a sector where the largest operators have been the subject of the largest actions, and an investor deploying capital into it is deploying into that operating environment whether or not they intend to participate in any of it.",
      "The collection mechanism is where returns actually come from and it is also the legal exposure. Repayment is taken daily or weekly by ACH from the merchant's operating account, before the merchant decides what else to pay. That seniority is why default rates are lower than the borrower profile would suggest — you are first in the queue every morning. It is also why a struggling merchant fails faster with an advance outstanding than without one, and why regulators describe the product the way they do.",
      "Confessions of judgment were the industry's historic enforcement tool: a document signed at origination allowing the funder to obtain a judgment without notice or a hearing on a declared default. Reporting in 2019 found MCA funders had obtained more than 5,500 New York court judgments against borrowers in a five-month period. New York has since restricted their use against out-of-state debtors and the practice has drawn sustained attention. Any structure offered to you that still relies on one should be declined on that basis alone.",
      "The honest return picture. Gross advertised yields in this category run thirty to fifty percent over six to nine months. Default rates are materially higher than any secured strategy on this page, concentrated in the merchants whose revenue was already deteriorating when they sought the advance — and unlike a mortgage, there is usually no collateral to recover. A personal guarantee against a business owner whose business has just failed is frequently uncollectable. Net of realistic losses, and net of the syndication fees most passive investors pay to participate, the yield an investor actually keeps is a fraction of the headline, and the dispersion is wide.",
      "For a rental-property owner specifically, there is a further problem that has nothing to do with ethics. The capital most investors would deploy here is borrowed — often against property at seven to ten percent. Borrowing at ten percent to lend at an uncertain net yield into an unsecured, heavily litigated asset class is a leveraged bet on your own default underwriting, made with your house behind it. That is a fundamentally different risk than the spread suggests.",
      "If you proceed, the structural questions are: who is the funder, what is their actual realised loss rate over a full cycle rather than a good year, do they use confessions of judgment, are they licensed where required, and what is the fee stack between the headline factor rate and what reaches you. An operator who cannot answer the loss-rate question with audited numbers across a downturn is answering it.",
    ],
    mechanics: [
      "The funder advances a sum and purchases a specified amount of future receivables — the 'factor rate' is the multiple, e.g. 1.40 on $100,000 means $140,000 is owed.",
      "Repayment is taken daily or weekly by ACH from the merchant's operating account, or as a percentage of card settlements.",
      "There is no stated interest rate and historically no APR, which is precisely what ten states have now legislated about.",
      "A personal guarantee from the business owner is standard. Collateral in the conventional sense is usually absent.",
      "A passive investor typically participates through a syndication or a fund rather than directly, adding a fee layer between the factor rate and the realised return.",
    ],
    targetReturn: "Advertised at roughly 30–50% over six to nine months, which annualises to approximately 56%–96%.",
    netOfLosses: "Materially lower and widely dispersed. Losses are concentrated and unsecured, and syndication fees sit between the factor rate and the investor. Demand audited realised loss rates across a full cycle, not a good year.",
    termMonths: { min: 4, max: 12 },
    collateral: "Usually none in any recoverable sense. The security is payment seniority — being first in the merchant's account each morning — not an asset you can foreclose on.",
    secondaryGuarantees: [
      "Personal guarantee from the business owner. Frequently uncollectable, because the guarantee is called precisely when the guarantor's business has failed.",
      "Confession of judgment, historically. New York has restricted their use against out-of-state debtors; any structure still relying on one should be declined.",
      "No insurance. No reserve fund unless a specific syndicator provides one, in which case ask who holds it and on what terms.",
    ],
    risks: [
      { risk: "Regulatory recharacterisation as a loan", likelihood: "occasional",
        consequence: "If a court recharacterises an advance as a loan, state usury limits may apply and the transaction can be void or the returns disgorged. The CFPB's 1071 exclusion does not bind any court on this question.",
        mitigation: "Only work with funders licensed where required, in states with settled disclosure regimes, and take your own counsel rather than the syndicator's." },
      { risk: "Enforcement action against the funder", likelihood: "occasional",
        consequence: "The FTC obtained a $20.3M judgment against one operator in February 2024 and a permanent industry ban against another in October 2023; the NY AG secured over $1B against Yellowstone Capital in January 2025. Investor capital in an enforced-against funder is at serious risk.",
        mitigation: "Diligence the funder's regulatory history before the return. Search the FTC and the relevant state AG by company and principal name." },
      { risk: "Default with no recoverable collateral", likelihood: "common",
        consequence: "Total loss on the advance. A personal guarantee against a failed business owner is frequently worth nothing.",
        mitigation: "Diversify across many small advances rather than few large ones, and treat the guarantee as decoration rather than security." },
      { risk: "Borrowing to fund the position", likelihood: "common",
        consequence: "A leveraged bet on unsecured credit underwriting, with property behind it. Losses compound against a fixed borrowing cost.",
        mitigation: "Do not fund this with borrowed money, and certainly not with money borrowed against your home." },
      { risk: "Fee stack erodes the headline", likelihood: "near-certain",
        consequence: "The factor rate is not the investor's return. Syndication, servicing and origination fees sit between them.",
        mitigation: "Ask for the full fee waterfall in writing, and for net realised investor returns across a downturn." },
    ],
    riskRewardScore: 2,
    scoreReasoning: "Genuinely high gross yields and a payment-seniority mechanism that works. Scored 2 out of 10 because the collateral is effectively absent, the losses are concentrated and total, the operating environment has produced a $20.3 million FTC judgment, a permanent industry ban and a $1 billion state settlement in three years, and ten states have legislated against the disclosure practices in the last four. The return is real; so is everything attached to it.",
    eligibility: [
      "Passive participation is usually through a fund or syndication, which is generally a securities offering — accredited investor status typically required.",
      "Direct funding may require a commercial financing licence depending on the state; Vermont's Act 142 (June 2026) and others have moved to licensing regimes.",
      "Disclosure obligations apply in California, Connecticut, Florida, Georgia, Kansas, Missouri, New York, Texas, Utah and Virginia as of 2026.",
    ],
    providerIds: [],
    questions: [
      { question: "What is the typical APR on a merchant cash advance?", answer: "There historically was no stated APR, which is exactly what ten states have now legislated about. A 1.40 factor over six months is roughly 96% annualised; over nine months, about 56%. California's SB 362, effective 1 January 2026, now requires the cost to be expressed as an APR and restricts misleading use of the words 'interest' and 'rate'." },
      { question: "Are merchant cash advances legal?", answer: "Yes, and they are regulated at state level rather than federal. Ten states require commercial financing disclosures reaching MCAs as of 2026. The CFPB's 1071 rule excludes them, but the CFPB has also indicated state disclosure laws are likely not preempted by TILA — and no court is bound by the federal exclusion when deciding whether a specific agreement is a loan under state usury law." },
      { question: "Can you invest in merchant cash advances?", answer: "Yes, usually through a fund or syndication, which generally means a securities offering requiring accredited status. Before the return, diligence the funder's regulatory history: the FTC obtained a $20.3 million judgment against one operator in 2024 and a permanent industry ban against another in 2023, and the New York Attorney General secured over $1 billion against Yellowstone Capital in January 2025." },
    ],
    relatedPaths: [...MORTGAGE_PAGES, `${HUB}/private-mortgage-notes`, `${HUB}/small-business-secured-lending`],
  },

  {
    slug: "private-mortgage-notes", n: 2,
    title: "Private Mortgage Notes and Trust Deed Investing",
    description: "Lend directly against real property at a conservative loan-to-value, secured by a recorded first lien you can foreclose on.",
    depth: "full",
    body: [
      "For a rental-property owner, this is the most natural deployment on the page, because it is the same underwriting they already do — with someone else taking the operational risk.",
      "You lend against a property, take a recorded first lien, and collect interest. If the borrower fails, you foreclose and own an asset you already know how to value. The collateral is the whole strategy, and unlike every unsecured yield on this page it is genuinely recoverable.",
      "The dominant variable is loan-to-value, and it is entirely within your control. A first lien at fifty-five percent of a conservatively appraised value means the property can fall forty-five percent before your principal is at risk. At seventy-five percent, it can fall twenty-five percent. The difference between a good year and a catastrophe in this strategy is almost always the LTV that was accepted at origination.",
      "First position matters as much as LTV. A second-position trust deed at sixty percent combined LTV sounds conservative and is not: in a foreclosure the first is paid in full before you see anything, so your real exposure begins where the first lien ends. Seconds pay more for exactly that reason.",
      "Returns are modest relative to unsecured lending and that is the point. This is a strategy where the realistic net return is close to the gross return, because losses are rare and recoveries are high — which is the opposite of merchant advances, where the headline and the outcome diverge sharply.",
      "The practical work is real: you need a competent servicer, title insurance naming you as lender, hazard insurance with you as loss payee, and an attorney who has run a foreclosure in that state. Judicial foreclosure states take much longer than non-judicial ones, and that timeline is a cost you should price at origination rather than discover during it.",
    ],
    mechanics: [
      "Underwrite the property first: independent appraisal or broker opinion, conservative value, and your own read of the market.",
      "Set LTV. This is the single decision that determines the outcome. 55–65% first position is the conservative band.",
      "Take a recorded first lien. Second position pays more because it is meaningfully riskier, not because the market is inefficient.",
      "Title insurance with a lender's policy naming you; hazard insurance with you as loss payee.",
      "Use a licensed third-party servicer. Self-servicing creates compliance exposure and destroys the payment record you would need in a dispute.",
      "Know the foreclosure route in that state and its realistic timeline before funding.",
    ],
    targetReturn: "Typically high single digits to low teens on first-position paper at conservative LTV, with points at origination.",
    netOfLosses: "Close to gross. Losses are rare at conservative LTV and recoveries are high, which is the defining feature of secured lending and the reason the headline is believable here.",
    termMonths: { min: 6, max: 60 },
    collateral: "A recorded lien on real property. Genuinely recoverable — you foreclose and own an asset whose value you can assess yourself.",
    secondaryGuarantees: [
      "Personal guarantee from the borrower, which has real value here because the lien already secures most of the exposure.",
      "Title insurance protects against defects in your lien position.",
      "Hazard insurance with you as loss payee protects the collateral itself.",
    ],
    risks: [
      { risk: "Property value was overstated at origination", likelihood: "occasional",
        consequence: "A 65% LTV loan on an inflated appraisal may really be a 85% loan, and the cushion you priced is not there.",
        mitigation: "Commission your own appraisal. Never rely on the borrower's." },
      { risk: "Long foreclosure timeline in a judicial state", likelihood: "common",
        consequence: "Months or years of carrying costs, taxes and legal fees while the asset is unproductive.",
        mitigation: "Know the state's process before funding and price the timeline into the rate." },
      { risk: "Second position wiped out", likelihood: "occasional",
        consequence: "In a foreclosure the first lien is paid in full first. A second at high combined LTV can recover nothing.",
        mitigation: "Prefer first position. If taking a second, treat the first lien balance as your true starting exposure." },
      { risk: "Uninsured casualty destroys the collateral", likelihood: "rare",
        consequence: "The security disappears while the obligation remains, against a borrower who has just lost the property.",
        mitigation: "Loss-payee status on a policy you can verify directly with the carrier, not a certificate the borrower supplies." },
    ],
    riskRewardScore: 8,
    scoreReasoning: "Real, recoverable collateral; underwriting the investor already understands; and a realistic net return close to the gross. Scored 8 rather than higher only because foreclosure is slow and expensive in judicial states, and because the strategy is entirely dependent on the LTV discipline of the person setting it.",
    eligibility: [
      "Some states require a lending licence for repeated private mortgage lending — check before the second loan, not after the tenth.",
      "Lending through a self-directed retirement plan is permitted and common, subject to the prohibited-transaction rules.",
      "Consumer-purpose loans trigger federal ability-to-repay and licensing obligations; business-purpose lending does not.",
    ],
    providerIds: [],
    questions: [
      { question: "What return do private mortgage notes pay?", answer: "Typically high single digits to low teens on first-position paper at conservative loan-to-value, often with points at origination. Second-position paper pays more, and it pays more because in a foreclosure the first lien is paid in full before you see anything." },
      { question: "Is trust deed investing safe?", answer: "It is as safe as the loan-to-value you accept and the lien position you take. A first lien at 55% LTV survives a 45% fall in the property; one at 80% survives 20%. The collateral is genuinely recoverable, which distinguishes it from almost every unsecured yield — but the recovery runs through a foreclosure process that is slow and expensive in judicial states." },
      { question: "Can you use a self-directed IRA to lend on real estate?", answer: "Yes, and it is one of the cleanest uses of the structure — the plan makes a secured loan to an unrelated third party and the interest returns to the plan sheltered. The prohibited-transaction rules still apply absolutely: the borrower cannot be you, your spouse, your ascendants or your descendants." },
    ],
    relatedPaths: [...MORTGAGE_PAGES, `${HUB}/self-directed-retirement`, `${HUB}/note-hypothecation`],
  },

  {
    slug: "hard-money-lending", n: 3,
    title: "Lending as a Hard Money Lender",
    description: "Be the private lender on the other side of the bridge — short loans against real property at high rates, with a first lien.",
    depth: "structured",
    body: [
      "Everything that makes hard money expensive to borrow makes it attractive to lend, and a rental owner who has borrowed this way already understands the underwriting from the inside.",
      "You lend against the asset and the exit rather than the borrower, take a first lien, charge points at origination and a high rate, and are repaid in months rather than decades. The short duration is a feature: capital turns several times a year, and each turn is a fresh underwriting decision rather than a thirty-year commitment to a stranger.",
      "The risk is that your borrowers are, by construction, the ones institutions declined. Some are declined for speed and some for substance, and telling those two apart is the entire skill. A borrower with an underwritten takeout and a track record is a different proposition from one with a plan and enthusiasm.",
      "Loan-to-cost and after-repair-value discipline is what separates this from gambling. Lending seventy percent of cost on a renovation where the ARV is optimistic means you end up owning a half-finished house at a number you cannot exit. Commission your own ARV and never accept the borrower comparables.",
      "Done well this is the highest-return secured strategy available to a property investor and it uses skills they already have. Done casually it converts a lender into an accidental renovator, which is the failure mode to design against.",
    ],
    mechanics: [
      "Underwrite the asset and the exit, not the borrower income.",
      "Loan-to-cost and after-repair-value tests, both on your own numbers.",
      "First lien, lender title policy, hazard insurance with you as loss payee.",
      "Points at origination plus monthly interest, principal at maturity.",
      "Draw schedules on renovation loans, released against inspected progress rather than against invoices.",
    ],
    targetReturn: "Low-to-high teens plus two to four points at origination; annualised higher when capital turns more than once a year.",
    netOfLosses: "Close to gross while LTV and ARV discipline hold. A single foreclosure on an over-advanced renovation can consume a year of spread.",
    termMonths: { min: 3, max: 18 },
    collateral: "A recorded first lien on real property, plus control of the renovation draws. Genuinely recoverable, though sometimes as a half-finished house.",
    secondaryGuarantees: [
      "Personal guarantee, which carries real value here because the lien already covers most of the exposure.",
      "Lender title policy and loss-payee hazard cover.",
      "Draw control — in practice the strongest protection you have, because you stop funding the moment progress stops.",
    ],
    risks: [
      { risk: "Borrower abandons a half-finished renovation", likelihood: "occasional", consequence: "You foreclose on an unfinishable asset and become the renovator, with carrying costs running against you.", mitigation: "Fund against inspected progress, never in advance, and keep enough undisbursed to finish the job yourself." },
      { risk: "After-repair value was optimistic", likelihood: "common", consequence: "The exit you underwrote does not exist and the loan is over-advanced against reality.", mitigation: "Commission your own ARV from an appraiser you instruct." },
      { risk: "Judicial foreclosure timeline", likelihood: "common", consequence: "Months of carrying costs, taxes and legal fees before you control the asset.", mitigation: "Know the state process before funding and price the timeline into the rate." },
    ],
    riskRewardScore: 7,
    scoreReasoning: "The highest-return secured strategy available to someone who already understands property, with real collateral and a duration short enough to turn capital several times a year. Scored 7 rather than higher because the borrower pool is adversely selected by construction, and one bad renovation loan can absorb a year of returns.",
    eligibility: [
      "Repeated lending may require a state licence; business-purpose lending avoids consumer obligations but not licensing.",
      "Workable inside a self-directed plan, subject absolutely to the prohibited-transaction rules.",
    ],
    providerIds: [],
    questions: [
      { question: "How much do hard money lenders make?", answer: "Typically low-to-high teens in rate plus two to four points at origination, and more annualised when capital turns more than once a year. The realistic net depends almost entirely on whether loan-to-cost and after-repair-value discipline held, because one foreclosure on an over-advanced renovation can consume a year of spread." },
      { question: "Is being a private lender profitable?", answer: "It can be, and it uses skills a property investor already has. The difficulty is that your borrowers are by construction the ones institutions declined — some for speed, some for substance — and distinguishing between those two is the entire business." },
      { question: "What LTV should a private lender use?", answer: "On a stabilised property, 55–65% of a conservative independent value. On a renovation, underwrite loan-to-cost and after-repair-value separately and on your own numbers, and fund draws against inspected progress rather than against invoices." },
    ],
    relatedPaths: [...MORTGAGE_PAGES, `${HUB}/private-hard-money`, `${HUB}/private-mortgage-notes`],
  },
  {
    slug: "small-business-secured-lending", n: 4,
    title: "Secured Small-Business Lending",
    description: "Lend to small businesses against equipment, receivables or property — the secured cousin of the merchant advance.",
    depth: "structured",
    body: [
      "The return on a merchant advance comes from taking unsecured risk at a very high price. The return on secured small-business lending comes from taking a real security interest at a lower one, and for most investors the second is a far better trade.",
      "The security can be equipment, accounts receivable, inventory or real property, perfected by a UCC filing or a mortgage. The difference from an advance is that when the business fails you have something to seize, and the recovery rate on properly perfected collateral is materially above zero.",
      "Yields sit well below merchant advances and well above property lending, which is roughly where the risk sits too. The work is heavier: perfecting a security interest correctly, monitoring a borrowing base on receivables, and knowing what a used piece of equipment actually sells for rather than what it cost.",
      "For a passive investor the realistic route is a fund rather than direct lending, which adds a fee layer and removes the control that makes the strategy work. Judge the manager on realised loss rates through a downturn, not on a track record that begins in a good year.",
    ],
    mechanics: [
      "Security interest perfected by UCC-1 filing on personal property, or by a mortgage on real property.",
      "Borrowing base monitoring where receivables are the collateral, with ageing reviewed monthly.",
      "Personal guarantee is standard, and worth more here than in an advance because the business holds assets.",
      "Field exams or audits on larger facilities.",
    ],
    targetReturn: "Mid-teens to low twenties on direct lending; materially lower net of fees through a fund.",
    netOfLosses: "Meaningfully below gross. Recovery on perfected collateral is real but partial, and workout costs are significant.",
    termMonths: { min: 6, max: 36 },
    collateral: "Equipment, receivables, inventory or real property, perfected by UCC filing or mortgage. Recoverable at a discount — and the discount on used equipment is larger than borrowers suggest.",
    secondaryGuarantees: [
      "Personal guarantee, with genuine value where the guarantor holds assets outside the business.",
      "A perfected security interest — worthless if filed incorrectly, which is why this is not a place to economise on counsel.",
      "Sometimes a blanket lien across all business assets.",
    ],
    risks: [
      { risk: "Security interest imperfectly perfected", likelihood: "occasional", consequence: "An incorrectly filed UCC-1 can leave you effectively unsecured, behind a creditor who filed properly.", mitigation: "Counsel files it and you verify the filing yourself afterwards." },
      { risk: "Collateral is worth far less used", likelihood: "common", consequence: "Specialised equipment can be near-worthless outside the business that ordered it.", mitigation: "Value collateral at forced-liquidation value, never at book or replacement." },
      { risk: "Borrowing base deteriorates unnoticed", likelihood: "occasional", consequence: "Receivables age into uncollectability while the facility stays fully drawn against them.", mitigation: "Review ageing monthly rather than quarterly." },
    ],
    riskRewardScore: 5,
    scoreReasoning: "Real, perfected collateral and yields well above property lending. Scored mid because recoveries are partial, the operational burden is heavy for an individual, and most passive access runs through funds where the fee layer and the manager's discipline become the actual risk being taken.",
    eligibility: [
      "Fund participation is generally a securities offering requiring accredited status.",
      "Direct commercial lending may require state licensing depending on volume and structure.",
    ],
    providerIds: [],
    questions: [
      { question: "How do you invest in small business loans?", answer: "Directly, by taking a perfected security interest in equipment, receivables or property, or passively through a private credit fund. Direct lending offers control and a higher net yield; a fund offers diversification and removes the operational burden, at the cost of a fee layer and complete dependence on the manager's underwriting." },
      { question: "What is a UCC-1 filing?", answer: "A public filing that perfects a security interest in personal property — equipment, receivables, inventory — establishing your priority against other creditors. An incorrectly filed UCC-1 can leave you effectively unsecured behind a properly filed creditor, which is why counsel should file it and you should verify it afterwards." },
      { question: "Is secured business lending better than a merchant cash advance?", answer: "For an investor, usually yes. The yield is lower, but when a business fails there is something to seize, and recovery on properly perfected collateral is materially above the near-zero recovery on an unsecured advance. You are also operating outside the most heavily enforced corner of small-business finance." },
    ],
    relatedPaths: [...MORTGAGE_PAGES, `${HUB}/merchant-cash-advance`],
  },
  {
    slug: "equipment-leasing", n: 5,
    title: "Equipment Leasing and Finance",
    description: "Own the equipment and lease it to the business that uses it — title itself is the collateral.",
    depth: "structured",
    body: [
      "The cleanest security in commercial finance is owning the thing. In a true lease you hold title to the equipment and the business pays for its use; if they stop paying, you do not foreclose on anything, you repossess something you already own.",
      "Yields are steady and the duration is medium — typically two to five years — which suits capital that does not need to turn quickly. Essential-use equipment performs best: a business will stop paying almost anything before it stops paying for the machine that generates its revenue.",
      "The risk is residual value, and it is the whole risk. Specialised equipment is worth a fraction of its cost outside the business that ordered it, and a lease underwritten on an optimistic residual is an unsecured loan wearing a costume. Value at forced-liquidation value, on a third-party opinion, before the lease is written.",
      "Passive access is generally through a fund or a lease syndication, which again places the manager's discipline between you and the return.",
    ],
    mechanics: [
      "A true lease keeps title with the lessor; a capital lease is a financing in substance and is treated differently for tax.",
      "The residual value assumption is the central underwriting decision and the one most often made optimistically.",
      "Essential-use equipment performs far better than discretionary equipment.",
      "File a UCC even on a true lease, to protect priority if the lease is later recharacterised.",
    ],
    targetReturn: "High single digits to mid teens, depending on residual assumptions and lessee credit.",
    netOfLosses: "Highly sensitive to residual accuracy. An aggressive residual turns a secured yield into an unsecured one without changing the headline at all.",
    termMonths: { min: 24, max: 60 },
    collateral: "Title to the equipment. Strong where the equipment is essential-use with an established resale market; weak where it is specialised.",
    secondaryGuarantees: [
      "Title, which is the strongest form of security available in commercial finance.",
      "Personal guarantee, common on smaller lessees.",
      "Insurance on the equipment with the lessor named.",
    ],
    risks: [
      { risk: "Residual value overstated", likelihood: "common", consequence: "Recovery on repossession is a fraction of the assumed residual, turning a secured deal into an unsecured one after the fact.", mitigation: "Third-party residual opinions, valued at forced-liquidation rather than replacement." },
      { risk: "Specialised equipment has no secondary market", likelihood: "occasional", consequence: "Repossession yields an asset nobody wants at any price.", mitigation: "Prefer essential-use equipment with an established resale market." },
      { risk: "Lease recharacterised as a financing", likelihood: "rare", consequence: "Tax and priority treatment change, sometimes adversely.", mitigation: "Structure with counsel who does equipment finance specifically, and file protectively." },
    ],
    riskRewardScore: 6,
    scoreReasoning: "Title is the strongest security available anywhere in commercial finance, and essential-use equipment is genuinely sticky. Scored 6 because everything rests on a residual assumption made years before it is tested, and specialised equipment can be close to unsellable.",
    eligibility: [
      "Fund or syndication participation is generally a securities offering.",
      "Direct leasing is a business activity with its own tax and accounting treatment.",
    ],
    providerIds: [],
    questions: [
      { question: "How does equipment lease investing work?", answer: "You buy the equipment and lease it to the business that uses it, holding title throughout. The payments are your return; if the lessee defaults you repossess an asset you already own, which is a stronger position than foreclosing on collateral you merely hold a lien against." },
      { question: "What return does equipment leasing pay?", answer: "High single digits to mid teens depending on the lessee's credit and, critically, the residual value assumed at the end of the lease. An aggressive residual assumption is the most common way a secured-looking deal turns out, years later, to have been unsecured." },
      { question: "What is the main risk in equipment leasing?", answer: "Residual value, almost entirely. Specialised equipment is worth a fraction of its cost outside the business that ordered it. Essential-use equipment with an established resale market performs far better, because a business stops paying almost everything else before it stops paying for the machine that earns its revenue." },
    ],
    relatedPaths: [...MORTGAGE_PAGES, `${HUB}/small-business-secured-lending`],
  },
] as const;

export const DEPLOYMENT_COUNT = DEPLOYMENT_STRATEGIES.length;

export function strategy(slug: string): DeploymentStrategy | undefined {
  return DEPLOYMENT_STRATEGIES.find((s) => s.slug === slug);
}

/** Ranked most viable (highest risk-adjusted) to least. */
export function ranked(): DeploymentStrategy[] {
  return [...DEPLOYMENT_STRATEGIES].sort((a, b) => b.riskRewardScore - a.riskRewardScore);
}
