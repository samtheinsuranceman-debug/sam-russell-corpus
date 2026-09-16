/**
 * The Lafayette Life Patriot 2022 illustration, transcribed.
 *
 * Source: "A Basic Life Insurance Illustration of Patriot 2022: Level Premium
 * Whole Life Insurance Policy", policy form LL-01 2104 CA, The Lafayette Life
 * Insurance Company, run 16 March 2026 (LL-3344 (12/25), 26-14.0.0.1), 22
 * pages, prepared at 100% of the current dividend scale.
 *
 * Insured: female, issue age 63, Standard No Tobacco, California.
 *
 * ── Why this file matters ───────────────────────────────────────────────────
 *
 * A participating whole life policy is defined by two tables only the carrier
 * publishes: the guaranteed cash value schedule and the dividend scale. Neither
 * can be derived, and until this illustration arrived every whole life figure
 * on this site ran on an approximation that was labelled as one.
 *
 * These are the carrier's own numbers. `GUARANTEED_CASH_VALUE` is the contract
 * floor. `ILLUSTRATED_CASH_VALUE` is what Lafayette projects at the current
 * dividend scale — which is not guaranteed and is the column to be sceptical
 * of. Holding both lets the engine be checked against the carrier rather than
 * against itself, which is what `test/lafayette.test.ts` does.
 *
 * ── The design ──────────────────────────────────────────────────────────────
 *
 *   Base policy (LL-01 2104 CA)      $1,106,406 face     $79,999.96 / yr
 *   10 Year Term Rider (LLR-01 1408)   $850,000 face      $3,595.50 / yr
 *   Level Premium PUA Rider (LLR-15 1901)               $116,404.50 / yr
 *   ───────────────────────────────────────────────────────────────────
 *   Total                                              $199,999.96 / yr
 *
 * That is 40.0% base, 58.2% paid-up additions rider, 1.8% term. Note the base
 * share: it is well above the 10-25% that banking material quotes as the
 * well-designed range. At issue age 63 the §7702 corridor is tight — an older
 * life needs less death benefit per premium dollar, so the contract runs closer
 * to the MEC limit and the base has to carry more. The "10-25%" rule is a
 * young-issue rule and it does not transfer.
 *
 * ── Premium offset ──────────────────────────────────────────────────────────
 *
 * Out of pocket is $200,000 a year for ten years — $2,000,000 total. From year
 * eleven the illustration shows an $80,000 annual premium with a ZERO outlay,
 * funded by surrendering paid-up additions. The policy pays its own base
 * premium from there.
 *
 * Premium offset is not a guarantee. It works only while the dividend scale
 * supports it; if the scale falls, the out-of-pocket premium comes back.
 */

/** Out-of-pocket premium by policy year. Zero from year 11 — see above. */
export const PREMIUM_OUTLAY: number[] = [
  200000, 200000, 200000, 200000, 200000, 200000, 200000, 200000, 200000, 200000, 80000,
  80000, 80000, 80000, 80000, 80000, 80000, 80000, 80000, 80000, 80000, 80000, 80000, 80000,
  80000, 80000, 80000, 80000, 80000, 80000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
];

/** Premium charged by the contract each year, however it is funded. */
export const CONTRACT_PREMIUM: number[] = [
  200000, 200000, 200000, 200000, 200000, 200000, 200000, 200000, 200000, 200000, 80000,
  80000, 80000, 80000, 80000, 80000, 80000, 80000, 80000, 80000, 80000, 80000, 80000, 80000,
  80000, 80000, 80000, 80000, 80000, 80000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
];

/** Guaranteed net cash value at the end of each policy year. The contract floor. */
export const GUARANTEED_CASH_VALUE: number[] = [
  112070, 259993, 410116, 562446, 716980, 873690, 1032561, 1193461, 1356296, 1520936,
  1495856, 1469460, 1441706, 1412582, 1381987, 1349835, 1315957, 1280306, 1243101, 1204680,
  1162253, 1117994, 1072002, 1024962, 977114, 928827, 914256, 948190, 985055, 1026612,
  1032686, 1038495, 1043983, 1049017, 1053575, 1057614, 1061065, 1063997, 1066609, 1068943,
  1071023, 1072948, 1074840, 1076788, 1078646, 1080439, 1082143, 1083780, 1085340, 1086834,
  1088261, 1089622, 1090916, 1092155, 1093339, 1094457, 1095519, 1106406
];

/** Guaranteed death benefit by policy year. */
export const GUARANTEED_DEATH_BENEFIT: number[] = [
  2130061, 2300790, 2468667, 2633759, 2796138, 2955865, 3113011, 3267636, 3419811, 3569604,
  2611774, 2505579, 2400963, 2297870, 2196247, 2096035, 1997177, 1899608, 1803262, 1708080,
  1614013, 1521008, 1428995, 1337900, 1247670, 1158246, 1106406, 1106406, 1106406, 1106406,
  1106406, 1106406, 1106406, 1106406, 1106406, 1106406, 1106406, 1106406, 1106406, 1106406,
  1106406, 1106406, 1106406, 1106406, 1106406, 1106406, 1106406, 1106406, 1106406, 1106406,
  1106406, 1106406, 1106406, 1106406, 1106406, 1106406, 1106406, 1106406
];

/** Annual dividend at 100% of the current scale. Not guaranteed. */
export const ILLUSTRATED_DIVIDEND: number[] = [
  21218, 28566, 36062, 44332, 54518, 65609, 77472, 88298, 97238, 106387, 109201, 112143,
  115305, 118734, 122375, 126090, 130031, 134299, 138724, 143292, 148042, 153343, 158811,
  163257, 167939, 172830, 177862, 183104, 188493, 194089, 169440, 176913, 184550, 192055,
  199816, 207796, 216014, 224232, 232245, 240413, 248720, 257116, 265573, 274514, 284630,
  295376, 306913, 319390, 332835, 347256, 363020, 379100, 395498, 412164, 429132, 446210,
  463506, 422775
];

/** Net cash value at 100% of the current dividend scale. Not guaranteed. */
export const ILLUSTRATED_CASH_VALUE: number[] = [
  133288, 310137, 497168, 695285, 906541, 1131975, 1372529, 1627199, 1894167, 2173618,
  2267784, 2365182, 2465969, 2570389, 2678480, 2790168, 2905348, 3024174, 3147031, 3274441,
  3403712, 3536953, 3674172, 3815308, 3960545, 4110199, 4264930, 4425817, 4594251, 4772173,
  4969848, 5174715, 5386610, 5604639, 5828810, 6058948, 6294738, 6536364, 6784650, 7039912,
  7302331, 7572572, 7851499, 8140237, 8438919, 8748318, 9069028, 9402140, 9748509, 10109181,
  10485477, 10877689, 11286110, 11711094, 12152920, 12611551, 13087297, 13640131
];

/** Death benefit at 100% of the current dividend scale. Not guaranteed. */
export const ILLUSTRATED_DEATH_BENEFIT: number[] = [
  2151279, 2362462, 2581662, 2809434, 3047787, 3298189, 3561424, 3836353, 4120267, 4412326,
  3600706, 3642410, 3687606, 3736531, 3789376, 3846171, 3907067, 3972353, 4042172, 4116607,
  4195779, 4280184, 4370009, 4464196, 4562781, 4665971, 4773903, 4886779, 5004747, 5128007,
  5312532, 5501541, 5697660, 5900749, 6111072, 6328888, 6554489, 6787951, 7029134, 7278212,
  7535358, 7800690, 8074281, 8356595, 8648775, 8951477, 9265489, 9591760, 9931263, 10284979,
  10654253, 11039406, 11440744, 11858523, 12293033, 12744371, 13212749, 13640131
];

export const LAFAYETTE_PATRIOT_2022 = {
  carrier: 'The Lafayette Life Insurance Company',
  product: 'Patriot 2022 Level Premium Whole Life',
  policyForm: 'LL-01 2104 CA',
  source: 'Basic Life Insurance Illustration, LL-3344 (12/25), 26-14.0.0.1, 22 pages',
  illustratedOn: '2026-03-16',
  state: 'CA',
  issueAge: 63,
  sex: 'female' as const,
  underwriting: 'Standard No Tobacco',
  initialFaceAmount: 1_106_406,
  basePremium: 79_999.96,
  termRiderPremium: 3_595.50,
  puaRiderPremium: 116_404.50,
  totalPremium: 199_999.96,
  outOfPocketYears: 10,
  dividendOption: 'paidUpAdditions' as const,
  /**
   * Lafayette is a non-direct-recognition carrier: the dividend is unaffected
   * by an outstanding policy loan. That is the contract term the whole banking
   * argument rests on, and it is the reason this carrier is used for it.
   */
  directRecognition: false,
  scale: '100% of current dividend scale',
  years: 58,
} as const;

/**
 * Dividend as a percentage of the prior year's illustrated cash value.
 *
 * This is NOT the dividend interest rate. A carrier's declared rate is applied
 * to a reserve after the cost of insurance inside the contract; this ratio is
 * what actually lands on the cash value, and it is the honest input for any
 * model that works in cash value terms. It is derived, not transcribed.
 */
export function impliedDividendRate(year: number): number {
  if (year < 2 || year > ILLUSTRATED_CASH_VALUE.length) return 0;
  const prior = ILLUSTRATED_CASH_VALUE[year - 2];
  if (prior <= 0) return 0;
  return (ILLUSTRATED_DIVIDEND[year - 1] / prior) * 100;
}
