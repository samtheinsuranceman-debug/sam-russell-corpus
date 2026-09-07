# The IUL Engine's links — the policy's crediting read against the other engines

Dictated 7 September 2026; built the same day (`/portal/iul-engine`,
`shared/iulLinks.ts`, `server/iulLinksRouter.ts`).

## The four joins
1. **Tax engine.** Tax-equivalent yield = credited rate ÷ (1 − marginal −
   state − net investment income tax): the return a taxable account would
   need to keep the same amount after tax. The client's marginal rate comes
   from the Fact Finder's tax section and is highlighted in the table beside
   the standard brackets. The credited rate is the backtester's average over
   the record or over the last ten years for the chosen index account.
2. **Inflation engine.** CPI-U December-over-December change (FRED
   `CPIAUCSL`) beside the credited rate for the same year, 1994 on; the mean
   credited rate in years above and at-or-below the CPI median, and the
   Pearson correlation. The caveat above the table states that this is a
   description of the record, not a mechanism, because caps and
   participation rates are set by the carrier and move with rates and option
   prices. No claim that inflation raises credits is made.
3. **Fiat engine.** The same pairing against M2 (FRED `M2SL`).
4. **Liquidity.** A policy loan beside an early IRA withdrawal (§72(t)), a
   401(k) loan (§72(p)), a brokerage sale or margin, home equity, and a CD,
   each with its statute where a statute governs and "institution's terms"
   where none does.

Plus the note on crediting while a loan is out: direct-recognition versus
non-direct-recognition loans, in the policy form's own terms; the second is
what lets the Rental Enterprise's trust loop keep earning on money paid out
to the trustee. The page never says "high-water mark"; the dictation's
description of Nationwide's multi-index account is carried on the carrier
registry as the ranked 50/30/20 monthly-average weighting it is.

## Sources
FRED CPIAUCSL and M2SL; the backtester (`shared/indexCreditingData.ts`);
26 U.S.C. §72 and §7702 (LII, fetched 7 September 2026).

## Not in this pass
- Carrier-by-carrier loan rates and loan types (read from each policy form
  per the registry's protocol).
- Long-term care through the policy (the Long-Term Care engine, next).
