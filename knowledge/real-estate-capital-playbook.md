# Real Estate Capital Playbook

**For:** RCS advisors using the Real Estate Capital Intelligence Network (RECIN).
**Last updated:** 2026-09-18

This is the reasoning the engine encodes. It exists so an advisor can defend a
number in front of a client, and so nobody has to guess why the tool said what
it said.

> **What this is not.** Nothing here is a loan approval, a rate quote, a tax
> conclusion, or a suitability determination. The engine produces decision
> support and review flags. Lenders decide credit; CPAs decide tax; attorneys
> decide structure.

---

## 1. The question the product answers

Not *"how much can this client borrow?"* — a lender answers that, and the answer
is usually too much. The question is:

> **What is the least fragile capital structure that achieves the client's stated
> objective while preserving liquidity, optionality, tax integrity, retirement
> resilience, estate intent, and a credible exit?**

Which is why the engine never ranks options by size of proceeds.

---

## 2. Lender maximum versus prudent maximum

Every option reports both.

- **Lender maximum** — what the collateral and income will support under the
  lender's own tests (LTV, CLTV, DSCR, debt yield, LTC, ARV).
- **Prudent maximum** — the lender maximum cut down to what still passes policy
  under the *conservative* stress: coverage, portfolio leverage, and reserve runway.

The gap between them is not unused capacity. It is the margin that keeps the
plan solvent when assumptions move. Borrowing to the lender maximum transfers
that entire margin to the lender.

When the gap exceeds 25%, the engine raises `LENDER_VS_PRUDENT_GAP`.

---

## 3. The binding constraint

Capacity is the **minimum** across every applicable test, and the engine names
which one bound:

| Constraint | Test | Typically binds when |
|---|---|---|
| `ltv` | value × max LTV − existing liens | High-yield property, low leverage |
| `cltv` | as above, **less undrawn credit lines** | An existing HELOC sits on the property |
| `dscr` | NOI ÷ (existing + new debt service) ≥ minimum | Modest-yield rentals — the common case |
| `debt_yield` | NOI ÷ total debt ≥ minimum | Commercial, and at every refinance |
| `ltc` | loan ÷ (price + verified rehab + eligible costs) | Hard money on a purchase |
| `arv` | loan ÷ after-repair value | Hard money where the rehab is ambitious |

**Why this matters more than the number.** Attacking the wrong constraint moves
nothing. If DSCR binds, adding collateral changes the answer by zero dollars —
you need rent, a lower rate, longer amortization, or less debt.

**Undrawn lines count in full.** A $100k HELOC with $50k drawn consumes $100k of
CLTV capacity. The lender underwrites the line, not the balance.

**Debt yield is the one test that does not move with rates or cap rates**, which
is exactly why a take-out lender will hold you to it when everything else has
been argued away.

---

## 4. DSCR versus hard money

| | DSCR / permanent | Hard money / bridge |
|---|---|---|
| Repaid by | Durable rent | A defined sale, refinance, or stabilization |
| Core risk | Vacancy, rent decline, rate reset | **Failure to exit by maturity**, rehab overrun, ARV miss |
| Right when | Stabilized or nearly so | Distressed / value-add with a documented exit |
| The test that matters | DSCR under stressed rents, expenses, rates | Time-to-exit plus take-out readiness |

**A bridge is only as sound as its exit.** The engine computes a *take-out
readiness score*: does the permanent refinance pass its **own** LTV, DSCR and
debt-yield tests, under its own stressed assumptions? An exit that has not been
tested scores zero, and a low score fires `UNTESTED_BRIDGE_EXIT`.

The loan does not care that the property improved if no lender will refinance it
at maturity.

---

## 5. Tax: three things that are always true

**1. Interest is a deduction, not a credit.** A deduction reduces taxable
income; a credit reduces tax owed. A client in a 37% bracket recovers at most
37 cents per dollar of deductible interest — not a dollar.

**2. Deductibility follows the USE of proceeds, not the collateral.** Borrowing
against a rental and spending it on a boat does not produce rental interest
expense. Every draw needs a use-of-proceeds ledger. Commingling one personal
expense into an investment draw can taint the tracing for the whole balance.

**3. Debt payoff does not reduce taxable gain.** This is the expensive one.

```
CASH COLUMN                        TAX COLUMN
  Sale price                         Sale price
− Selling costs                    − Selling costs
− Loan payoff        ← debt        − Adjusted basis   ← no debt here, ever
= Cash to owner                    = Gain (recapture + capital gain)
```

A client can walk away with little cash and still owe substantial tax. The
engine returns these as separate fields and refuses to net them.

> Borrowed money is never income. A HELOC does not create tax-free income; it
> creates a liability with an interest cost.

---

## 6. The cross-domain signals

Single ratios are commodity. The value is catching where two domains quietly
depend on the same dollar or the same assumption.

**Liquidity collision (`LIQUIDITY_COLLISION`).** One cash balance cannot
simultaneously be the vacancy reserve, the bridge interest reserve, the insurance
reserve, and the retirement buffer. A household with $150k earmarked four times
has $150k, not $600k. Only unallocated cash counts toward runway.

**Refinance dependence.** A plan that is solvent only because it assumes a future
refinance is a plan with an untested assumption at its centre. Test the
refinance at stressed value, rent, rate and credit — on its own terms.

**Collateral contagion (`COLLATERAL_CONTAGION`).** Cross-collateralization turns
one property's vacancy into a portfolio event. Where the rate difference is
small, individual financing with release provisions is worth more than the spread.

**Rate-hedge mismatch (`RATE_HEDGE_MISMATCH`).** Variable-rate debt funding a
long-duration rental has a timing problem: leases reset slowly, debt resets
immediately. That is how a covered property becomes uncovered without anything
happening to the building.

**Insurance coupling (`INSURANCE_REAL_ESTATE_COUPLING`).** A policy-loan strategy
and a bridge interest reserve drawn from the same balance sheet can each look
survivable alone and fail in the same month together.

**Estate-plan conflict (`ESTATE_PLAN_COLLATERAL_CONFLICT`).** Encumbering a
property promised to heirs or held in trust can put lender transfer restrictions
directly across the estate plan — and it surfaces at the worst moment.

**Complexity threshold (`BEHAVIORAL_COMPLEXITY_THRESHOLD`).** Count entities,
liens, instruments, maturities and rate resets. A theoretically superior plan is
inferior in practice if it exceeds what the household and advisor can actually
administer. Missed maturities are administration failures, not market failures.

---

## 7. Reading the stress columns

Every option runs three ways:

| | Vacancy | Rate shock | Value | Expenses |
|---|---|---|---|---|
| **Base** | as entered | as entered | — | — |
| **Conservative** | ≥12% | +200bp | −10% | +10% |
| **Severe** | ≥20% | +400bp | −20% | +20% |

Rate shocks apply to **variable-rate paper only** — fixed debt is genuinely
insulated until maturity, where the exposure becomes refinance risk instead.

`passesPolicy` is false when any threshold is missed, and `failures` names which
and by how much. Prudent capacity is sized off the **conservative** column.

All thresholds are configurable by an authorized advisor, and **any report that
relies on a threshold must display it**. A finding is only defensible if the
reader can see what it was judged against.

---

## 8. Reading a finding

Each carries: a stable `code`, `severity`, the `evidence` it was computed from,
a `recommendation`, `confidence` and `materiality`, the `requiredReviewer`, and
`invalidatedBy` — what would make it go away.

That last field is the honest one. It tells the client what to go get rather
than leaving them with a verdict. When a finding says *"invalidated by: a
take-out term sheet"*, the next action is obvious.

Route by reviewer: `cpa` for anything tax, `attorney` for structure, entity or
estate, `lender` for credit and exit, `insurance` for policy interactions,
`compliance` for client-facing language.

---

## 9. The advisor conversation

1. **Start with the binding constraint**, not the amount. "Your income binds
   before your equity does" reframes the whole discussion.
2. **Show lender max beside prudent max**, and say plainly what the gap buys.
3. **Show the severe column** next to the base case. A client who has seen the
   severe column before signing does not call you in a panic after it arrives.
4. **Separate the cash and tax columns** on any sale discussion, every time.
5. **Name what would change the answer** — the `invalidatedBy` field — so the
   client leaves with an action, not a verdict.
6. **Never** say approved, guaranteed, tax-free, or safe. The engine will not
   produce those words; neither should the advisor.
