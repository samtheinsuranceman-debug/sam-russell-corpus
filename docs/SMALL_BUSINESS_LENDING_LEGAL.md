# Small Business Lending — What's Allowed, What Isn't, and What to Do Instead

Written against the specific questions asked. Plain answers first, then the reasoning.
This is a working engineering memo, not legal advice — every item marked **GET COUNSEL**
needs a licensed opinion in each state before a dollar moves.

---

## The short version

| The idea | Verdict | What the code does |
|---|---|---|
| Business advances at 40%+ effective APR | **Legal, heavily disclosed** | Built. `priceAdvance()` computes the true APR and `buildDisclosure()` refuses to assemble an incomplete disclosure. |
| Lending to homeowners 60–90 days late on property taxes at 100%, deed as collateral | **Not built. Illegal as described.** | `priceAdvance()` throws `ConsumerDwellingSecuredError`. |
| Tax offices feeding you names of businesses whose revenue dropped, for a 40–50% cut | **Not built. Criminal for the preparer.** | Excluded from `DistressSignal`. Lawful alternative documented below. |
| Cold email to business owners every 2–3 days | **Legal with CAN-SPAM compliance** | Built. `buildEmailCampaign()` enforces postal address + opt-out. |
| SMS campaign every 2–3 days | **Legal only with prior written consent** | Built, gated. `buildSmsCampaign()` throws without a matching consent record. |
| AI avatar video messages from the lender | **Legal if disclosed** | Built. `AvatarDisclosureError` throws on an undisclosed synthetic. |
| Finding businesses in financial distress | **Legal via public record** | Built. Nine public-record signals, each citing its lawful source. |
| Referral discount to closed borrowers | **Legal in commercial lending** | Built into the campaign footer. |

---

## 1. The 40%-plus business advance — this one is fine, and the APR is the point

Commercial financing to a business is not consumer credit. TILA and Regulation Z do not
reach it, and most state usury caps carve out commercial loans or allow a business to
waive them. Merchant cash advances structured as a purchase of future receivables have
historically sat outside "lending" entirely. That is the industry you are describing and
it is large, legitimate, and bankable.

What changed is disclosure. Four states now require consumer-style disclosure on
commercial financing, reaching MCAs and factoring, not just loans:

- **California SB 1235** (2018) — requires amount financed, finance charge, estimated APR,
  total repayment, payment amount and frequency, and prepayment terms, before signature.
- **New York Commercial Finance Disclosure Law** — substantively similar, effective
  August 1, 2023.
- **Utah** and **Virginia** have their own registration and disclosure regimes.

The CFPB preliminarily determined in December 2022 that TILA does **not** preempt these
state laws, so they stand on their own force.

**The engineering consequence.** The disclosure requires an *estimated APR*, and on a
fixed-fee advance the APR is nothing like the factor rate. A 1.22 factor over six months
with daily remittance reads like 44% annualized if you do the arithmetic in your head. It
isn't. The borrower starts repaying the next business day, so the average balance
outstanding is roughly half the principal, and the rate that actually equates the cash
flows lands in the seventies. `trueApr()` solves for it by bisection on the IRR of the
real payment stream.

That gap is not a compliance nuisance — it is the number you are actually charging. An
originator who quotes factor rates without knowing the APR does not know their own book.

**GET COUNSEL on:** state-by-state licensing (some states require a lender or broker
license even for commercial), whether your structure is a purchase of receivables or a
loan (reconciliation rights and a fixed term push it toward "loan"), and the disclosure
form each state mandates.

---

## 2. The property tax delinquency idea — this is the one I won't build

The proposal: find homeowners 60–90 days late on property taxes, lend against their
home equity at 100% over 6–12 months, take the deed as collateral, on the theory that
foreclosure was already threatened before you arrived.

**This is illegal as described, in essentially every state, on at least four independent
grounds.** Not aggressive, not gray — each of these alone is disqualifying.

1. **It is consumer credit, not commercial.** A loan secured by a borrower's principal
   dwelling is consumer credit under Regulation Z regardless of what the paperwork says
   or how the proceeds are described. The business-purpose exemption turns on the actual
   use of funds, and paying delinquent property taxes on a residence is a personal,
   family, or household purpose by definition.

2. **It is a high-cost mortgage under HOEPA.** HOEPA, as expanded by Dodd-Frank, captures
   closed-end loans secured by a principal dwelling whose APR exceeds the Average Prime
   Offer Rate by 6.5 points, or whose points and fees exceed 5% of the loan. A 100% APR
   clears that trigger by a factor of more than ten. High-cost status brings mandatory
   pre-loan HUD counseling, ability-to-repay determination, a ban on balloon structures,
   restrictions on fees, and **assignee liability** — meaning whoever buys the paper
   inherits the violation. Remedies include rescission, statutory damages, and fees.

3. **It exceeds criminal usury limits.** Consumer usury caps on residential mortgage
   lending are typically 12–25% depending on the state. New York's criminal usury
   threshold is 25%. 100% is not a civil overage that gets refunded; in several states it
   is a felony that voids the debt entirely — you lose the interest *and* the principal.

4. **Targeting tax delinquency specifically triggers foreclosure-rescue statutes.** Most
   states enacted "distressed property consultant" or "foreclosure rescue" laws after
   2008. They typically require registration and bonding, ban advance fees, impose
   fiduciary duties on anyone soliciting a homeowner in default, void transfers of title
   taken in connection with a rescue transaction, and carry criminal penalties. The fact
   pattern you described — approaching an owner already in default and taking the deed —
   is the exact conduct these statutes were written to criminalize.

**In code:** `priceAdvance()` throws `ConsumerDwellingSecuredError` on any advance flagged
as secured by a principal dwelling. There is no override flag. If someone later adds one,
the test suite fails.

### The lawful version, which is a better business anyway

**Tax lien certificates.** You want a position secured by real property, backed by an
owner who is already delinquent, at a return far above savings. That instrument already
exists, it is statutory, and the county sells it to you at auction:

- The county places the lien and auctions the certificate to recover its revenue.
- Statutory interest rates run roughly **8% to 36%** depending on the state — Florida up
  to 18%, Arizona 16%, Illinois structured by penalty percentage.
- The lien sits in **first position**, ahead of the mortgage.
- The homeowner redeems by paying tax plus statutory interest, and you are made whole.
- If they don't redeem within the statutory period, you have a defined foreclosure path
  with a court-supervised process.

You get the security you wanted and the delinquency you wanted to target, with a
statutory rate instead of a usurious one and a county as your counterparty instead of a
distressed homeowner. It is competitive — institutional buyers bid these down — but it is
a real asset class you can scale into, and no part of it is a criminal exposure.

**GET COUNSEL on:** state-specific redemption periods, bidding mechanics (bid-down-interest
vs. premium-bid vs. rotational), and whether your state's certificates are worth holding.

---

## 3. The tax office partnership — the answer is no, and there's a legal route

The proposal: partner with tax preparation offices, have them identify businesses whose
revenue dropped sharply against last year, have them recommend your loan, cut them 40–50%.

**IRC § 7216 makes this a crime for the preparer.** It prohibits a tax return preparer
from knowingly or recklessly *disclosing* return information, **or using it**, for any
purpose other than preparing that return. It is a misdemeanor: up to **one year
imprisonment and a $1,000 fine per disclosure**, plus prosecution costs. § 6713 adds a
civil penalty of **$250 per disclosure**, capped at $10,000 per year. It also triggers
referral to the IRS Office of Professional Responsibility, which can bar the preparer from
practice.

Note what § 7216 covers: not just handing over a name, but **using** return information.
A preparer who reads a client's return, notices revenue fell, and pitches your loan has
used return information for a non-return purpose. Making the pitch himself does not
sidestep it.

The commission makes it worse, not better. A 40–50% revenue share is the motive element a
prosecutor would put in front of a jury, and it likely violates state CPA ethics rules on
contingent fees and undisclosed conflicts independently.

**There is no workaround, because the statute is aimed at exactly this.** I'm not going
to design one.

### What is legal

§ 7216 permits disclosure **with the taxpayer's specific written consent**, and the
consent has to meet the requirements of Rev. Proc. 2013-14: it must be knowing and
voluntary, must identify the intended purpose and the specific recipient, must be signed
and dated before any disclosure occurs, and cannot be bundled into an engagement letter as
boilerplate.

That gives you a real, buildable channel:

1. The preparer offers **their own client** a consent form: *"May we share your business
   information with Russell Capital Lending to see whether you qualify for working
   capital?"*
2. The client signs, or doesn't. The preparer never speaks to you about anyone who didn't.
3. Consented clients come to you as warm, documented referrals — and you receive actual
   financials, which is better underwriting data than a cold lead.
4. Compensate the **referral relationship**, disclosed to the client. Run the fee
   structure past counsel; several states restrict what a CPA may accept for a referral,
   and the fee must be disclosed to the client either way.

This is slower than buying a list of struggling businesses. It is also the version that
doesn't end with your referral partner indicted.

---

## 4. Finding businesses that need capital — public record beats confidential data

You asked how to find out which businesses are behind. The engine uses nine signals, all
public record or the owner's own published behavior:

| Signal | Lawful source |
|---|---|
| Existing UCC-1 filing | Secretary of State UCC search |
| Stacked UCC filings from multiple secured parties | Secretary of State UCC search |
| State or federal tax lien filed | County recorder / Secretary of State |
| Civil judgment entered | Public court docket |
| License or contractor registration lapsed | State licensing registry |
| Hiring reversal (postings pulled) | Public job boards |
| Review sentiment decline | Public review platforms |
| Equipment listed for sale | Public marketplaces |
| Seasonal capital window | The trade calendar in `industryRisk.ts` |

**The design decision that matters most here:** intent and credit concern are scored as
**two separate numbers** and never collapsed into one. Desperation is simultaneously the
strongest buying signal and the strongest default signal. A model that blends them hands
back a list of businesses eager to sign and unable to pay — which is how a lending book
fills with defaults while the conversion metrics look excellent. Stacked UCC filings score
9 on intent *and* 8 on concern, and land in `underwrite-hard`, not `call-first`.

**The best signal is not distress at all — it's the calendar.** A landscaper contacted in
February is being offered money that buys mulch, fuel, and a second crew, and bills from
April. The same landscaper contacted in August is being offered a bailout. Same business,
same message, opposite outcome. That is what `tradesNeedingCapital()` is for, and it is
the cheapest edge in the whole system.

---

## 5. The marketing campaign — email and SMS are not the same risk

### Email: legal, build it aggressively

CAN-SPAM has **no opt-in requirement**. Cold commercial email to a business is lawful.
Required: accurate header and "from" information, a non-deceptive subject line, a valid
physical postal address in every message, a functioning opt-out, and honoring opt-outs
within **ten business days**. Penalties run per message, so the address and opt-out are
not optional decorations.

A touch every 2–3 days is aggressive but legal. `buildEmailCampaign()` rotates through
your scripts so no prospect sees the same message twice in a sequence — better response
rates, and it keeps your sending domain out of spam traps.

### SMS: this is where campaigns become lawsuits

The TCPA requires **prior express written consent** for automated marketing texts.
Statutory damages are **$500 per message, trebled to $1,500 if willful, with no cap.** A
1,000-recipient campaign sent without consent is a $500,000 to $1,500,000 exposure before
anyone reads the message, and TCPA class actions are a mature plaintiff's bar specialty.

The B2B carve-out does **not** save you. It covers manually dialed calls to verified
**landlines** for non-marketing purposes. An automated campaign to a business owner's
mobile is squarely covered.

One narrowing worth knowing and not relying on: in *Bradford v. Sovereign Pest Control*
(5th Cir., Feb. 25, 2026), the court held the statute requires only prior express consent,
not the FCC's written standard. That covers **Texas, Louisiana, and Mississippi only**.
The engine holds every state to the written standard, because a multi-state campaign
priced off the most permissive circuit is priced wrong.

`buildSmsCampaign()` throws `MissingConsentError` without a consent record that matches the
number being messaged, is unrevoked, and records the method, timestamp, and exact
disclosure shown. There is no bypass.

**Capture consent at the landing page.** That is the whole fix — your email campaign
drives to a page, the page captures consent, and consented prospects move into the SMS
sequence. It costs one step and removes seven figures of exposure.

### Avatar video: legal, disclose it

An AI-generated video of you delivering the pitch is fine — it's your likeness, your
message. Undisclosed, a synthetic presented as a genuine recording is a deception claim
under the FTC Act, and a growing number of states now have synthetic-media disclosure
statutes. `AvatarDisclosureError` throws if the script body doesn't disclose it.
Disclosed, it's a legitimate and genuinely effective format.

### Referral discount

A 10% discount to borrowers who refer other owners is fine in commercial lending. Note
this would be a **RESPA § 8 problem if it ever touched a mortgage transaction** — keep the
two businesses cleanly separated.

---

## 6. Standing rules the code enforces

From `LENDING_RULES` and `PROSPECTING_RULES`:

- No default or repayment rate printed without a source and an as-of date.
- No "top 25" that hides the trades whose loss rate couldn't be sourced.
- No count-weighted loss rate presented as dollar-weighted.
- No automated text without a matching, unrevoked written consent record.
- No commercial email without a physical address and working opt-out.
- No undisclosed synthetic avatar.
- No payment to a tax preparer for the identity of a client whose revenue fell.
- No obtaining a business's financial condition from any source the business didn't
  publish or consent to release.
- No treating desperation as a buying signal without scoring it separately as credit risk.

---

## 7. Open items before origination

1. **Pull the SBA FOIA dataset.** `loadSbaChargeOffRates()` is written and tested but the
   data isn't loaded — `data.sba.gov` is blocked from the build container. Run it outside
   the sandbox. Until then `rankIndustries()` returns only the trades you've sourced,
   by design.
2. **State licensing analysis.** Which states require a license to originate commercial
   advances, and which require registration under their CFDL.
3. **Structure opinion.** Purchase of receivables vs. loan. Reconciliation rights and a
   fixed term push toward "loan," which changes the usury analysis in some states.
4. **The § 7216 consent form**, drafted to Rev. Proc. 2013-14, if you pursue the CPA
   channel.
5. **Tax lien certificate state selection**, if you pursue the property-secured strategy
   in its lawful form.

---

## Sources

- [California SB 1235 — Commercial financing: disclosures](https://leginfo.legislature.ca.gov/faces/billTextClient.xhtml?bill_id=201720180SB1235)
- [CFPB preliminary determinations — TILA does not preempt NY, CA, UT, VA commercial financing disclosure laws](https://www.consumerfinancemonitor.com/2022/12/09/cfpb-makes-preliminary-determinations-that-truth-in-lending-act-does-not-preempt-new-york-california-utah-and-virginia-commercial-financing-disclosure-laws/)
- [Commercial Financing Disclosure Laws by State](https://onyxiq.com/commercial-financing-disclosure-laws/)
- [IRS — Section 7216 Information Center](https://www.irs.gov/tax-professionals/section-7216-information-center)
- [Rev. Proc. 2013-14 — consent requirements under §§ 7216, 6713](https://www.irs.gov/pub/irs-drop/rp-13-14.pdf)
- [26 CFR § 301.7216-1 — Penalty for disclosure or use of tax return information](https://www.law.cornell.edu/cfr/text/26/301.7216-1)
- [The many implications of Sec. 7216 — The Tax Adviser](https://www.thetaxadviser.com/issues/2024/jan/the-many-implications-of-sec-7216/)
- [CFPB — 2013 HOEPA Rule small entity compliance guide](https://files.consumerfinance.gov/f/documents/bcfp_hoepa_small-entity_compliance-guide.pdf)
- [The Expanded Scope of High-Cost Mortgages Under Dodd-Frank — Consumer Compliance Outlook](https://www.consumercomplianceoutlook.org/2015/first-quarter/expanded-scope-of-high-cost-mortgages-under-dodd-frank-wall-street-reform-consumer-protection-act-2/)
- [A Predatory Lending Primer: HOEPA — Congressional Research Service](https://www.everycrsreport.com/reports/RL34259.html)
- [TCPA text message rules and regulations guide 2026 — ActiveProspect](https://activeprospect.com/blog/tcpa-text-messages/)
- [TCPA compliance for SMS in 2026 — IDT Express](https://www.idtexpress.com/blog/tcpa-compliance-for-sms-in-2026-the-complete-guide-for-us-businesses/)
- [SBA 7(a) default rates by industry — PeerSense](https://peersense.com/blog/sba-loan-default-rates-what-they-mean)
- [Industries with the lowest SBA default rates](https://www.sba7a.loans/sba-7a-loans-small-business-blog/industries-with-the-lowest-default-rates-for-sba-loans/)
