// ============================================================
// AQAL — Research Library: HEALTHY AGING & LONGEVITY shelf (sections 7000+)
// ============================================================
// The founder's brief: every verified source on "anti-aging" — treatments,
// supplements, therapies, lipids, exercise — so a member who names longevity
// as a goal gets the remediations that actually have evidence, and the honest
// verdict on the ones that do not.
//
// Verification contract (see RESEARCH_PIPELINE.md):
//   • Every source below is a DOI that was resolved against the publisher's
//     page (title, journal, year, first author read back) or read from the
//     PubMed record (PMID → DOI → title) on 2026-09-10. Nothing here is typed
//     from memory; a source that could not be confirmed was left out.
//   • No Google-Scholar fallbacks on this shelf: `kind` is always "doi".
//   • Animal-only findings are labelled as such in the title or description and
//     rated Emerging; debunked or unsupported claims carry impact magnitude 1
//     so the library counts them as "debunked", not as endorsements.
//   • Nothing on this shelf is medical advice. Drugs and hormones are described
//     with the trial that tested them; the decision belongs to a clinician.
//
// The shelf is merged into PRACTICE_EVIDENCE by researchLibraryData.ts, so it
// appears in the same page, filters, ledger counts and catalog as the rest.
import type { PracticeCluster } from "./ResearchLibrary";

// Section labels (one per topic, matching the newer per-cluster convention).
export const LONGEVITY_GROUP = "Healthy aging & longevity — the verified shelf";

export const LONGEVITY_SECTIONS: Record<string, string> = {
  "7000": "7000 · Longevity — How to Read This Shelf",
  "7001": "7001 · Longevity — Cardiorespiratory Fitness & Mortality",
  "7002": "7002 · Longevity — Strength, Grip & Muscle",
  "7003": "7003 · Longevity — Daily Movement & Steps",
  "7004": "7004 · Longevity — Protein & Creatine for Aging Muscle",
  "7005": "7005 · Longevity — ApoB, LDL & the Causal Lipid",
  "7006": "7006 · Longevity — Beyond Statins: Ezetimibe, PCSK9, Bempedoic Acid",
  "7007": "7007 · Longevity — Lipoprotein(a)",
  "7008": "7008 · Longevity — Triglycerides, Fish Oil & Omega-3",
  "7009": "7009 · Longevity — Blood Pressure Targets",
  "7010": "7010 · Longevity — Body Weight & GLP-1 Drugs",
  "7011": "7011 · Longevity — Metformin",
  "7012": "7012 · Longevity — Rapamycin & mTOR",
  "7013": "7013 · Longevity — Other Mouse Geroprotectors (Acarbose, 17α-Estradiol, Canagliflozin)",
  "7014": "7014 · Longevity — Senolytics (Dasatinib + Quercetin, Fisetin)",
  "7015": "7015 · Longevity — NAD⁺ Precursors (NR, NMN)",
  "7016": "7016 · Longevity — Spermidine, Urolithin A, Taurine, GlyNAC",
  "7017": "7017 · Longevity — Coenzyme Q10 & Selenium",
  "7018": "7018 · Longevity — Vitamin D",
  "7019": "7019 · Longevity — Multivitamin & Cocoa Flavanols (COSMOS)",
  "7020": "7020 · Longevity — Antioxidant Megadoses & Resveratrol",
  "7021": "7021 · Longevity — Caloric Restriction (CALERIE)",
  "7022": "7022 · Longevity — Time-Restricted Eating & Fasting-Mimicking",
  "7023": "7023 · Longevity — Mediterranean Diet & Coffee",
  "7024": "7024 · Longevity — Sleep Duration",
  "7025": "7025 · Longevity — Sauna",
  "7026": "7026 · Longevity — Menopausal Hormone Therapy",
  "7027": "7027 · Longevity — Testosterone, Growth Hormone & DHEA",
  "7028": "7028 · Longevity — Epigenetic Clocks & Biological Age",
  "7029": "7029 · Longevity — Hearing, Vision & Dementia Risk",
  "7030": "7030 · Longevity — Vaccines (Shingles, Influenza)",
  "7031": "7031 · Longevity — Aspirin in Healthy Older Adults",
  "7032": "7032 · Longevity — Screening Colonoscopy",
  "7033": "7033 · Longevity — Young Blood, Plasma Exchange, Hyperbaric Oxygen & Stem-Cell Clinics",
  "7034": "7034 · Longevity — Partial Epigenetic Reprogramming (Animal Only)",
  "7035": "7035 · Longevity — Social Connection & Loneliness",
  "7036": "7036 · Longevity — Smoking & Alcohol",
  "7037": "7037 · Longevity — Frailty & the Lifestyle Bundle",
  "7038": "7038 · Longevity — Collagen for Skin Aging",
};

export const LONGEVITY_SECTION_SHORT: Record<string, string> = {
  "7000": "Longevity: Read Me First",
  "7001": "Longevity: VO₂max",
  "7002": "Longevity: Strength",
  "7003": "Longevity: Steps",
  "7004": "Longevity: Protein & Creatine",
  "7005": "Longevity: ApoB / LDL",
  "7006": "Longevity: Beyond Statins",
  "7007": "Longevity: Lp(a)",
  "7008": "Longevity: Omega-3",
  "7009": "Longevity: Blood Pressure",
  "7010": "Longevity: Weight & GLP-1",
  "7011": "Longevity: Metformin",
  "7012": "Longevity: Rapamycin",
  "7013": "Longevity: Mouse Geroprotectors",
  "7014": "Longevity: Senolytics",
  "7015": "Longevity: NAD⁺",
  "7016": "Longevity: Spermidine etc.",
  "7017": "Longevity: CoQ10",
  "7018": "Longevity: Vitamin D",
  "7019": "Longevity: Multivitamin",
  "7020": "Longevity: Antioxidants",
  "7021": "Longevity: Calorie Restriction",
  "7022": "Longevity: Fasting",
  "7023": "Longevity: Diet & Coffee",
  "7024": "Longevity: Sleep",
  "7025": "Longevity: Sauna",
  "7026": "Longevity: Menopause HT",
  "7027": "Longevity: T, GH, DHEA",
  "7028": "Longevity: Bio-Age Clocks",
  "7029": "Longevity: Hearing",
  "7030": "Longevity: Vaccines",
  "7031": "Longevity: Aspirin",
  "7032": "Longevity: Colonoscopy",
  "7033": "Longevity: Young Blood etc.",
  "7034": "Longevity: Reprogramming",
  "7035": "Longevity: Social",
  "7036": "Longevity: Smoking & Alcohol",
  "7037": "Longevity: Frailty",
  "7038": "Longevity: Collagen",
};

export const LONGEVITY_SECTION_ORDER: string[] = Object.keys(LONGEVITY_SECTIONS);

const doi = (id: string) => `https://doi.org/${id}`;

export const LONGEVITY_EVIDENCE: PracticeCluster[] = [
  // ─── 7000 · orientation ─────────────────────────────────────────────────────
  {
    id: "lv-read-me-first",
    section: "7000",
    title: "How to Read the Longevity Shelf — Hallmarks, Levers, and the Size of the Prize",
    subtitle: "What aging is, what the big levers are worth, and how this shelf grades evidence",
    evidenceTag: "Strong",
    description:
      "Aging science now organises itself around twelve interlocking hallmarks (genomic instability, telomere attrition, epigenetic drift, loss of proteostasis, disabled autophagy, deregulated nutrient sensing, mitochondrial dysfunction, cellular senescence, stem-cell exhaustion, altered intercellular communication, chronic inflammation and dysbiosis). Most of what is sold as anti-aging targets one of them in a dish or a mouse. The largest human lever remains the ordinary bundle: in 123,219 US adults followed for up to 34 years, never smoking, a healthy weight, regular activity, moderate alcohol and a good diet were associated with roughly 12–14 additional years of life expectancy at age 50. Everything on this shelf is graded against that bar: human outcome trials rank Strong, human biomarker trials Moderate, animal-only work Emerging, and claims that failed in people are rated at the floor so no one mistakes them for a recommendation.",
    callout: "Not medical advice. Drugs and hormones are described with the trial that tested them; the decision belongs to you and a clinician.",
    feeds: ["a map of the field", "a calibrated sense of which levers are large", "protection against hype"],
    impact: { magnitude: 5, latency: "months", durability: "lasting", effort: "moderate" },
    sources: [
      { cite: "López-Otín, C., Blasco, M. A., Partridge, L., Serrano, M., & Kroemer, G. (2023). Hallmarks of aging: An expanding universe. Cell, 186(2), 243–278.", note: "The reference map of the twelve hallmarks; every intervention on this shelf can be located on it.", link: doi("10.1016/j.cell.2022.11.001"), kind: "doi" },
      { cite: "Li, Y., Pan, A., Wang, D. D., et al. (2018). Impact of healthy lifestyle factors on life expectancies in the US population. Circulation, 138(4), 345–355.", note: "Five low-risk habits were associated with 14.0 (women) and 12.2 (men) extra years of life expectancy at age 50 across the Nurses' Health Study and Health Professionals Follow-Up Study.", link: doi("10.1161/CIRCULATIONAHA.117.032047"), kind: "doi" },
      { cite: "Piercy, K. L., Troiano, R. P., Ballard, R. M., et al. (2018). The Physical Activity Guidelines for Americans. JAMA, 320(19), 2020–2028.", note: "The federal dose: 150–300 min/week moderate or 75–150 vigorous aerobic activity plus two strength days; the baseline the exercise clusters below build on.", link: doi("10.1001/jama.2018.14854"), kind: "doi" },
    ],
  },

  // ─── 7001 · cardiorespiratory fitness ───────────────────────────────────────
  {
    id: "lv-vo2max-mortality",
    section: "7001",
    title: "Cardiorespiratory Fitness — The Strongest Measured Predictor of Survival",
    subtitle: "VO₂max, treadmill fitness and all-cause mortality",
    evidenceTag: "Strong",
    description:
      "Among 122,007 patients who took a treadmill test at the Cleveland Clinic, mortality fell step by step with fitness, and the fittest group (the top 2.3%) had the lowest risk of all — there was no ceiling at which more fitness stopped helping. Being in the lowest fitness group carried a mortality risk comparable to or larger than smoking, diabetes or coronary disease. The same shape held in 750,302 US veterans across ages 30–95, both sexes and every racial group. Fitness is trainable at any age: an aerobic programme in older adults enlarged the hippocampus and improved memory within a year. This is the first lever on the shelf because it is the largest that a person controls directly.",
    feeds: ["survival", "cardiac and metabolic health", "brain volume and memory", "capacity for everything else"],
    impact: { magnitude: 5, latency: "weeks", durability: "sustained", effort: "high" },
    sources: [
      { cite: "Mandsager, K., Harb, S., Cremer, P., Phelan, D., Nissen, S. E., & Jaber, W. (2018). Association of cardiorespiratory fitness with long-term mortality among adults undergoing exercise treadmill testing. JAMA Network Open, 1(6), e183605.", note: "122,007 adults, median 8.4 years: mortality fell across every fitness stratum with no upper limit of benefit; low fitness was a risk comparable to major clinical diseases.", link: doi("10.1001/jamanetworkopen.2018.3605"), kind: "doi" },
      { cite: "Kokkinos, P., Faselis, C., Samuel, I. B. H., et al. (2022). Cardiorespiratory fitness and mortality risk across the spectra of age, race, and sex. Journal of the American College of Cardiology, 80(6), 598–609.", note: "750,302 veterans: the inverse, graded fitness–mortality relationship held in every age, race and sex group.", link: doi("10.1016/j.jacc.2022.05.031"), kind: "doi" },
      { cite: "Erickson, K. I., Voss, M. W., Prakash, R. S., et al. (2011). Exercise training increases size of hippocampus and improves memory. Proceedings of the National Academy of Sciences, 108(7), 3017–3022.", note: "Randomized trial in 120 older adults: a year of aerobic training grew the anterior hippocampus by 2% and improved spatial memory, reversing one to two years of age-related loss.", link: doi("10.1073/pnas.1015950108"), kind: "doi" },
    ],
  },

  // ─── 7002 · strength ────────────────────────────────────────────────────────
  {
    id: "lv-strength-grip-mortality",
    section: "7002",
    title: "Strength, Grip and Muscle-Strengthening Activity — A Vital Sign You Can Train",
    subtitle: "Grip strength as a predictor; resistance training and mortality",
    evidenceTag: "Strong",
    description:
      "In the PURE study of 139,691 adults across 17 countries, each 5 kg drop in grip strength was associated with a 16% higher risk of death from any cause, a 17% higher risk of cardiovascular death and higher rates of heart attack and stroke; grip predicted death better than systolic blood pressure. Muscle-strengthening activity itself is protective: a meta-analysis of prospective cohorts found 10–17% lower all-cause mortality, cardiovascular disease, total cancer and diabetes in people who did it, with the largest benefit at around 30–60 minutes a week and a J-shaped curve beyond that. Strength is the muscle the frailty clusters below are about.",
    feeds: ["survival", "falls and fracture resistance", "independence in later life", "metabolic health"],
    impact: { magnitude: 4, latency: "weeks", durability: "sustained", effort: "moderate" },
    sources: [
      { cite: "Leong, D. P., Teo, K. K., Rangarajan, S., et al. (2015). Prognostic value of grip strength: Findings from the Prospective Urban Rural Epidemiology (PURE) study. The Lancet, 386(9990), 266–273.", note: "139,691 adults, 17 countries: each 5 kg lower grip strength, 16% higher all-cause mortality; a stronger predictor than systolic blood pressure.", link: doi("10.1016/S0140-6736(14)62000-6"), kind: "doi" },
      { cite: "Momma, H., Kawakami, R., Honda, T., & Sawada, S. S. (2022). Muscle-strengthening activities are associated with lower risk and mortality in major non-communicable diseases: A systematic review and meta-analysis of cohort studies. British Journal of Sports Medicine, 56(13), 755–763.", note: "Muscle-strengthening activity: 10–17% lower risk of all-cause mortality, cardiovascular disease, cancer and diabetes, maximal at 30–60 min/week.", link: doi("10.1136/bjsports-2021-105061"), kind: "doi" },
    ],
  },

  // ─── 7003 · steps ───────────────────────────────────────────────────────────
  {
    id: "lv-steps-movement-mortality",
    section: "7003",
    title: "Daily Steps and Everyday Vigorous Bursts — The Dose That Moves Mortality",
    subtitle: "Step counts, accelerometer-measured activity and short vigorous bursts",
    evidenceTag: "Strong",
    description:
      "Across 47,471 adults in 15 cohorts, mortality fell steeply as daily steps rose, levelling at about 6,000–8,000 steps for adults 60 and older and 8,000–10,000 for younger adults. In older women, the benefit began well below the 10,000 mark: 4,400 steps a day was associated with substantially lower mortality than 2,700, with gains continuing to about 7,500. Accelerometer data confirm the shape: any physical activity, including light activity, was associated with lower mortality, and long sedentary time with higher. Even people who do no formal exercise benefit from short bursts: in 25,241 non-exercisers wearing wrist devices, three or four one-minute bouts of vigorous everyday activity a day (a fast stair climb, carrying shopping) were associated with 38–40% lower all-cause and cancer mortality and 48–49% lower cardiovascular mortality.",
    feeds: ["survival", "cardiovascular health", "an entry point for people who do not exercise"],
    impact: { magnitude: 4, latency: "weeks", durability: "sustained", effort: "low" },
    sources: [
      { cite: "Paluch, A. E., Bajpai, S., Bassett, D. R., et al. (2022). Daily steps and all-cause mortality: A meta-analysis of 15 international cohorts. The Lancet Public Health, 7(3), e219–e228.", note: "47,471 adults: progressively lower mortality up to ~6,000–8,000 steps/day (≥60 years) and ~8,000–10,000 (younger); step rate added little once volume was counted.", link: doi("10.1016/S2468-2667(21)00302-9"), kind: "doi" },
      { cite: "Lee, I.-M., Shiroma, E. J., Kamada, M., Bassett, D. R., Matthews, C. E., & Buring, J. E. (2019). Association of step volume and intensity with all-cause mortality in older women. JAMA Internal Medicine, 179(8), 1105–1112.", note: "16,741 women (mean age 72): ~4,400 steps/day associated with lower mortality than ~2,700; benefit plateaued around 7,500 steps.", link: doi("10.1001/jamainternmed.2019.0899"), kind: "doi" },
      { cite: "Ekelund, U., Tarp, J., Steene-Johannessen, J., et al. (2019). Dose-response associations between accelerometry measured physical activity and sedentary time and all cause mortality: Systematic review and harmonised meta-analysis. BMJ, 366, l4570.", note: "36,383 adults with device-measured activity: higher total and light-intensity activity associated with lower mortality; sedentary time above ~9.5 h/day with higher.", link: doi("10.1136/bmj.l4570"), kind: "doi" },
      { cite: "Stamatakis, E., Ahmadi, M. N., Gill, J. M. R., et al. (2022). Association of wearable device-measured vigorous intermittent lifestyle physical activity with mortality. Nature Medicine, 28(12), 2521–2529.", note: "25,241 non-exercisers in UK Biobank: 3–4 one-minute vigorous bursts a day associated with ~40% lower all-cause and ~49% lower cardiovascular mortality.", link: doi("10.1038/s41591-022-02100-x"), kind: "doi" },
    ],
  },

  // ─── 7004 · protein & creatine ──────────────────────────────────────────────
  {
    id: "lv-protein-creatine-aging-muscle",
    section: "7004",
    title: "Protein and Creatine for Aging Muscle",
    subtitle: "Dietary protein targets after 65; creatine with resistance training",
    evidenceTag: "Moderate",
    description:
      "Older adults need more protein than younger ones to hold muscle: the PROT-AGE expert group recommends 1.0–1.2 g per kg of body weight per day for healthy people over 65, more with illness or training, spread so each meal delivers enough to trigger muscle protein synthesis. Creatine is the best-studied sports supplement in existence and the safety record is long; in older adults who also lift, creatine (typically 5 g/day) adds lean mass and strength beyond training alone, and reviews point to plausible benefits for bone and fall risk. Creatine without training does little for muscle. See also sections 43 and 44 of the main library.",
    feeds: ["muscle mass and strength", "recovery from illness", "independence"],
    impact: { magnitude: 3, latency: "weeks", durability: "sustained", effort: "low" },
    sources: [
      { cite: "Bauer, J., Biolo, G., Cederholm, T., et al. (2013). Evidence-based recommendations for optimal dietary protein intake in older people: A position paper from the PROT-AGE Study Group. Journal of the American Medical Directors Association, 14(8), 542–559.", note: "The consensus target of 1.0–1.2 g/kg/day for healthy older adults, higher with disease, with per-meal distribution and exercise pairing.", link: doi("10.1016/j.jamda.2013.05.021"), kind: "doi" },
      { cite: "Kreider, R. B., Kalman, D. S., Antonio, J., et al. (2017). International Society of Sports Nutrition position stand: Safety and efficacy of creatine supplementation in exercise, sport, and medicine. Journal of the International Society of Sports Nutrition, 14, 18.", note: "The position stand on creatine's efficacy and safety across ages, including clinical and aging populations.", link: doi("10.1186/s12970-017-0173-z"), kind: "doi" },
      { cite: "Candow, D. G., Forbes, S. C., Chilibeck, P. D., Cornish, S. M., Antonio, J., & Kreider, R. B. (2019). Effectiveness of creatine supplementation on aging muscle and bone: Focus on falls prevention and inflammation. Journal of Clinical Medicine, 8(4), 488.", note: "Review of creatine plus resistance training in adults 57–69: added lean mass and strength, with plausible bone and fall-risk benefits.", link: doi("10.3390/jcm8040488"), kind: "doi" },
    ],
  },

  // ─── 7005 · ApoB / LDL ──────────────────────────────────────────────────────
  {
    id: "lv-apob-ldl-causal",
    section: "7005",
    title: "ApoB and LDL — The Causal Lipid, and Why Years of Exposure Matter",
    subtitle: "Genetics, epidemiology and 26 randomized trials point the same way",
    evidenceTag: "Strong",
    description:
      "Low-density lipoprotein does not merely correlate with heart disease; it causes it. The European Atherosclerosis Society consensus laid the three lines of evidence side by side — Mendelian randomization, prospective cohorts and randomized trials — and the effect is dose- and time-dependent: the total burden of LDL carried across a lifetime determines risk, which is why lowering it earlier and for longer pays more than the same reduction late. The Cholesterol Treatment Trialists' meta-analysis of 170,000 people in 26 trials found each 1 mmol/L (about 39 mg/dL) reduction in LDL cut major vascular events by roughly 22% a year, with more intensive lowering producing further reductions and no threshold of harm found. For primary prevention the US Preventive Services Task Force recommends statins for adults 40–75 with at least one risk factor and a 10-year risk of 10% or more.",
    feeds: ["cardiovascular survival", "a number you can measure and move"],
    impact: { magnitude: 5, latency: "weeks", durability: "lasting", effort: "low" },
    sources: [
      { cite: "Ference, B. A., Ginsberg, H. N., Graham, I., et al. (2017). Low-density lipoproteins cause atherosclerotic cardiovascular disease. 1. Evidence from genetic, epidemiologic, and clinical studies. A consensus statement from the European Atherosclerosis Society Consensus Panel. European Heart Journal, 38(32), 2459–2472.", note: "The causal case for LDL from three independent lines of evidence, with cumulative exposure as the driver of risk.", link: doi("10.1093/eurheartj/ehx144"), kind: "doi" },
      { cite: "Cholesterol Treatment Trialists' (CTT) Collaboration. (2010). Efficacy and safety of more intensive lowering of LDL cholesterol: A meta-analysis of data from 170 000 participants in 26 randomised trials. The Lancet, 376(9753), 1670–1681.", note: "Each 1 mmol/L LDL reduction: ~22% fewer major vascular events per year; more intensive lowering, further reduction; no lower threshold identified.", link: doi("10.1016/S0140-6736(10)61350-5"), kind: "doi" },
      { cite: "US Preventive Services Task Force. (2022). Statin use for the primary prevention of cardiovascular disease in adults: US Preventive Services Task Force recommendation statement. JAMA, 328(8), 746–753.", note: "Grade B recommendation for adults 40–75 with ≥1 risk factor and ≥10% 10-year risk; grade C for 7.5–10%.", link: doi("10.1001/jama.2022.13044"), kind: "doi" },
    ],
  },

  // ─── 7006 · beyond statins ──────────────────────────────────────────────────
  {
    id: "lv-beyond-statins",
    section: "7006",
    title: "Beyond Statins — Ezetimibe, PCSK9 Inhibitors and Bempedoic Acid",
    subtitle: "Every non-statin route to lower LDL that has an outcomes trial",
    evidenceTag: "Strong",
    description:
      "The lipid hypothesis was tested drug by drug. Adding ezetimibe to a statin after an acute coronary syndrome (IMPROVE-IT, 18,144 patients) lowered LDL further and reduced cardiovascular events. The PCSK9 antibodies pushed LDL to levels never before reached in trials: evolocumab (FOURIER, 27,564 patients) cut the primary endpoint by 15% on top of statin therapy, and alirocumab (ODYSSEY OUTCOMES, 18,924 patients after an acute coronary syndrome) reduced events and, in that trial, all-cause death. For people who cannot take statins, bempedoic acid (CLEAR Outcomes, 13,970 statin-intolerant patients) lowered LDL by about 21% and reduced major adverse cardiovascular events by 13%. The common thread is the one from section 7005: it is the LDL reduction, not the molecule, that carries the benefit.",
    feeds: ["cardiovascular survival", "options for statin-intolerant people"],
    impact: { magnitude: 4, latency: "weeks", durability: "lasting", effort: "low" },
    sources: [
      { cite: "Cannon, C. P., Blazing, M. A., Giugliano, R. P., et al. (2015). Ezetimibe added to statin therapy after acute coronary syndromes. New England Journal of Medicine, 372(25), 2387–2397.", note: "IMPROVE-IT, 18,144 patients: ezetimibe plus simvastatin lowered LDL to a median 53.7 mg/dL and reduced cardiovascular events versus statin alone.", link: doi("10.1056/NEJMoa1410489"), kind: "doi" },
      { cite: "Sabatine, M. S., Giugliano, R. P., Keech, A. C., et al. (2017). Evolocumab and clinical outcomes in patients with cardiovascular disease. New England Journal of Medicine, 376(18), 1713–1722.", note: "FOURIER, 27,564 patients: LDL to a median 30 mg/dL; 15% relative reduction in the primary composite endpoint.", link: doi("10.1056/NEJMoa1615664"), kind: "doi" },
      { cite: "Schwartz, G. G., Steg, P. G., Szarek, M., et al. (2018). Alirocumab and cardiovascular outcomes after acute coronary syndrome. New England Journal of Medicine, 379(22), 2097–2107.", note: "ODYSSEY OUTCOMES, 18,924 patients: 15% relative reduction in major adverse events; lower all-cause mortality in this trial.", link: doi("10.1056/NEJMoa1801174"), kind: "doi" },
      { cite: "Nissen, S. E., Lincoff, A. M., Brennan, D., et al. (2023). Bempedoic acid and cardiovascular outcomes in statin-intolerant patients. New England Journal of Medicine, 388(15), 1353–1364.", note: "CLEAR Outcomes, 13,970 statin-intolerant patients: 13% relative reduction in major adverse cardiovascular events.", link: doi("10.1056/NEJMoa2215024"), kind: "doi" },
    ],
  },

  // ─── 7007 · Lp(a) ───────────────────────────────────────────────────────────
  {
    id: "lv-lipoprotein-a",
    section: "7007",
    title: "Lipoprotein(a) — The Inherited Risk Worth Measuring Once",
    subtitle: "A genetically set lipid, a causal risk factor, and the drugs in trials",
    evidenceTag: "Strong",
    description:
      "Lipoprotein(a) is an LDL-like particle whose level is about 90% inherited, barely moved by diet or statins, and elevated in roughly one person in five. The European Atherosclerosis Society's 2022 consensus reviews the genetic and epidemiological evidence that it is a causal risk factor for heart attack, stroke and aortic valve stenosis, and recommends that every adult have it measured at least once. Antisense therapy can lower it by up to 80% (pelacarsen phase 2, 286 patients), and outcome trials are under way; until they report, the practical use of an Lp(a) result is to sharpen how aggressively the other lipids and risk factors are treated.",
    feeds: ["knowing an inherited risk", "targeting the modifiable risks harder when it is high"],
    impact: { magnitude: 3, latency: "days", durability: "lasting", effort: "low" },
    sources: [
      { cite: "Kronenberg, F., Mora, S., Stroes, E. S. G., et al. (2022). Lipoprotein(a) in atherosclerotic cardiovascular disease and aortic stenosis: A European Atherosclerosis Society consensus statement. European Heart Journal, 43(39), 3925–3946.", note: "The consensus on Lp(a) as a causal, largely genetic risk factor, with the recommendation to measure it once in every adult.", link: doi("10.1093/eurheartj/ehac361"), kind: "doi" },
      { cite: "Tsimikas, S., Karwatowska-Prokopczuk, E., Gouni-Berthold, I., et al. (2020). Lipoprotein(a) reduction in persons with cardiovascular disease. New England Journal of Medicine, 382(3), 244–255.", note: "Phase 2 trial of the antisense drug pelacarsen in 286 patients: dose-dependent Lp(a) reductions of 35–80%; outcomes trial pending.", link: doi("10.1056/NEJMoa1905239"), kind: "doi" },
    ],
  },

  // ─── 7008 · omega-3 ─────────────────────────────────────────────────────────
  {
    id: "lv-omega3-fish-oil",
    section: "7008",
    title: "Triglycerides, Fish Oil and Omega-3 — What the Big Trials Actually Showed",
    subtitle: "REDUCE-IT vs STRENGTH vs VITAL, the atrial-fibrillation signal, and blood omega-3 levels",
    evidenceTag: "Mixed",
    description:
      "Three large trials give three different answers. In REDUCE-IT (8,179 statin-treated patients with high triglycerides), 4 g/day of purified EPA (icosapent ethyl) cut major cardiovascular events by 25% — a striking result that the mineral-oil placebo has been argued to have inflated. In STRENGTH (13,078 similar patients), 4 g/day of a mixed EPA+DHA formulation against corn oil did nothing. In VITAL (25,871 healthy adults), 1 g/day of ordinary fish oil did not reduce major cardiovascular events or cancer. A meta-analysis of the outcome trials found that marine omega-3 supplements raise the risk of atrial fibrillation, more so at higher doses. Meanwhile, higher blood levels of omega-3 fatty acids — largely from eating fish — were associated with 15–18% lower mortality across 17 cohorts. The honest reading: eat fish; a low-dose capsule is unlikely to change your survival; high-dose EPA is a prescription decision for people with high triglycerides and cardiovascular risk, weighed against atrial fibrillation.",
    feeds: ["a clear picture of a crowded market", "who might benefit from prescription EPA"],
    impact: { magnitude: 2, latency: "months", durability: "sustained", effort: "low" },
    sources: [
      { cite: "Bhatt, D. L., Steg, P. G., Miller, M., et al. (2019). Cardiovascular risk reduction with icosapent ethyl for hypertriglyceridemia. New England Journal of Medicine, 380(1), 11–22.", note: "REDUCE-IT, 8,179 patients: 4 g/day EPA, 25% relative reduction in ischemic events; mineral-oil comparator debated.", link: doi("10.1056/NEJMoa1812792"), kind: "doi" },
      { cite: "Nicholls, S. J., Lincoff, A. M., Garcia, M., et al. (2020). Effect of high-dose omega-3 fatty acids vs corn oil on major adverse cardiovascular events in patients at high cardiovascular risk: The STRENGTH randomized clinical trial. JAMA, 324(22), 2268–2280.", note: "13,078 patients: 4 g/day EPA+DHA carboxylic acid versus corn oil, no reduction in major adverse cardiovascular events.", link: doi("10.1001/jama.2020.22258"), kind: "doi" },
      { cite: "Manson, J. E., Cook, N. R., Lee, I.-M., et al. (2019). Marine n−3 fatty acids and prevention of cardiovascular disease and cancer. New England Journal of Medicine, 380(1), 23–32.", note: "VITAL, 25,871 adults: 1 g/day fish oil did not lower the primary cardiovascular or cancer endpoints.", link: doi("10.1056/NEJMoa1811403"), kind: "doi" },
      { cite: "Gencer, B., Djousse, L., Al-Ramady, O. T., Cook, N. R., Manson, J. E., & Albert, C. M. (2021). Effect of long-term marine ω-3 fatty acids supplementation on the risk of atrial fibrillation in randomized controlled trials of cardiovascular outcomes: A systematic review and meta-analysis. Circulation, 144(25), 1981–1990.", note: "Seven trials, 81,210 participants: omega-3 supplementation associated with a 25% higher risk of atrial fibrillation, greater at doses above 1 g/day.", link: doi("10.1161/CIRCULATIONAHA.121.055654"), kind: "doi" },
      { cite: "Harris, W. S., Tintle, N. L., Imamura, F., et al. (2021). Blood n-3 fatty acid levels and total and cause-specific mortality from 17 prospective studies. Nature Communications, 12, 2329.", note: "42,466 people, 15,720 deaths: higher circulating omega-3 levels associated with 15–18% lower all-cause mortality.", link: doi("10.1038/s41467-021-22370-2"), kind: "doi" },
    ],
  },

  // ─── 7009 · blood pressure ──────────────────────────────────────────────────
  {
    id: "lv-blood-pressure-targets",
    section: "7009",
    title: "Blood Pressure — The Intensive Target That Lowered Deaths",
    subtitle: "SPRINT and STEP: systolic below 120–130 in adults at risk and in older adults",
    evidenceTag: "Strong",
    description:
      "SPRINT randomized 9,361 adults at raised cardiovascular risk (without diabetes) to a systolic target below 120 mm Hg or below 140. The trial was stopped early because the intensive group had 25% fewer major cardiovascular events and 27% lower all-cause mortality, at the cost of more hypotension, fainting, electrolyte problems and acute kidney injury. STEP repeated the question in 8,511 Chinese adults aged 60–80 with a target of 110–130 versus 130–150 and found 26% fewer cardiovascular events with no excess of serious adverse events. Blood pressure is measurable at home for the cost of a cuff, and the lifestyle levers (weight, sodium, alcohol, activity) come first.",
    feeds: ["cardiovascular survival", "stroke and heart-failure prevention", "kidney protection"],
    impact: { magnitude: 5, latency: "weeks", durability: "lasting", effort: "low" },
    sources: [
      { cite: "The SPRINT Research Group. (2015). A randomized trial of intensive versus standard blood-pressure control. New England Journal of Medicine, 373(22), 2103–2116.", note: "9,361 adults: systolic target <120 vs <140, 25% fewer major cardiovascular events and 27% lower all-cause mortality; more hypotension and kidney events.", link: doi("10.1056/NEJMoa1511939"), kind: "doi" },
      { cite: "Zhang, W., Zhang, S., Deng, Y., et al. (2021). Trial of intensive blood-pressure control in older patients with hypertension. New England Journal of Medicine, 385(14), 1268–1279.", note: "STEP, 8,511 adults aged 60–80: target 110–130 vs 130–150 systolic, 26% fewer cardiovascular events, no excess serious harm.", link: doi("10.1056/NEJMoa2111437"), kind: "doi" },
    ],
  },

  // ─── 7010 · weight & GLP-1 ──────────────────────────────────────────────────
  {
    id: "lv-weight-glp1",
    section: "7010",
    title: "Body Weight and the GLP-1 Drugs",
    subtitle: "What excess weight costs in years, and the first weight-loss drug with an outcomes trial",
    evidenceTag: "Strong",
    description:
      "In 3.9 million never-smokers without prior disease across 239 studies, mortality was lowest at a BMI of 20–25 and rose steadily above it: about 39% higher per 5 BMI units in Europe, with grade-1 obesity carrying a 45% higher mortality and grade-3 obesity a 176% higher mortality than the healthy range. Semaglutide is the first weight-loss medication shown to reduce hard cardiovascular outcomes: in SELECT, 17,604 adults with obesity and established cardiovascular disease but no diabetes had 20% fewer major adverse cardiovascular events on weekly semaglutide 2.4 mg over a mean 40 months. Whether the drug extends life in people without cardiovascular disease is not yet tested; muscle loss during rapid weight loss is the reason section 7002 and 7004 travel with this one.",
    feeds: ["cardiovascular survival in people with obesity", "a realistic view of BMI risk"],
    impact: { magnitude: 4, latency: "months", durability: "sustained", effort: "moderate" },
    sources: [
      { cite: "The Global BMI Mortality Collaboration. (2016). Body-mass index and all-cause mortality: Individual-participant-data meta-analysis of 239 prospective studies in four continents. The Lancet, 388(10046), 776–786.", note: "3,951,455 never-smokers without disease: mortality minimal at BMI 20–25; hazard ratios 1.45 (grade 1), 1.94 (grade 2) and 2.76 (grade 3 obesity).", link: doi("10.1016/S0140-6736(16)30175-1"), kind: "doi" },
      { cite: "Lincoff, A. M., Brown-Frandsen, K., Colhoun, H. M., et al. (2023). Semaglutide and cardiovascular outcomes in obesity without diabetes. New England Journal of Medicine, 389(24), 2221–2232.", note: "SELECT, 17,604 patients: 20% relative reduction in major adverse cardiovascular events with semaglutide 2.4 mg weekly.", link: doi("10.1056/NEJMoa2307563"), kind: "doi" },
    ],
  },

  // ─── 7011 · metformin ───────────────────────────────────────────────────────
  {
    id: "lv-metformin",
    section: "7011",
    title: "Metformin — Promising Signals, an Unfinished Trial, and a Catch for Exercisers",
    subtitle: "Observational hints, the TAME proposal, and what it does to training gains",
    evidenceTag: "Emerging",
    description:
      "Metformin's reputation as a longevity drug rests mainly on observation: in a UK primary-care cohort, people with type 2 diabetes started on metformin lived slightly longer than matched non-diabetic controls, whereas those started on a sulphonylurea died sooner — a finding vulnerable to who gets prescribed what. A meta-analysis of 53 studies reported lower all-cause mortality and less cancer and cardiovascular disease in diabetic metformin users than in non-diabetics and other-treated diabetics. The Targeting Aging with Metformin (TAME) trial was designed to test the geroscience hypothesis directly in 3,000 older adults; it has not yet reported. One randomized trial matters for anyone who exercises: in older adults training aerobically for 12 weeks, metformin blunted the improvement in mitochondrial respiration and in VO₂max. Until TAME reports, metformin for aging in people without diabetes is a hypothesis, not a result.",
    feeds: ["an honest read on a popular off-label drug"],
    impact: { magnitude: 2, latency: "months", durability: "sustained", effort: "low" },
    sources: [
      { cite: "Bannister, C. A., Holden, S. E., Jenkins-Jones, S., et al. (2014). Can people with type 2 diabetes live longer than those without? A comparison of mortality in people initiated with metformin or sulphonylurea monotherapy and matched, non-diabetic controls. Diabetes, Obesity and Metabolism, 16(11), 1165–1173.", note: "78,241 metformin users lived marginally longer than matched non-diabetic controls; sulphonylurea users had higher mortality. Observational.", link: doi("10.1111/dom.12354"), kind: "doi" },
      { cite: "Campbell, J. M., Bellman, S. M., Stephenson, M. D., & Lisy, K. (2017). Metformin reduces all-cause mortality and diseases of ageing independent of its effect on diabetes control: A systematic review and meta-analysis. Ageing Research Reviews, 40, 31–44.", note: "53 studies: diabetics on metformin had lower all-cause mortality than non-diabetics and than diabetics on other therapies; observational data throughout.", link: doi("10.1016/j.arr.2017.08.003"), kind: "doi" },
      { cite: "Barzilai, N., Crandall, J. P., Kritchevsky, S. B., & Espeland, M. A. (2016). Metformin as a tool to target aging. Cell Metabolism, 23(6), 1060–1065.", note: "The rationale and design of TAME, the first trial to treat aging itself as the endpoint; results are not yet published.", link: doi("10.1016/j.cmet.2016.05.011"), kind: "doi" },
      { cite: "Konopka, A. R., Laurin, J. L., Schoenberg, H. M., et al. (2019). Metformin inhibits mitochondrial adaptations to aerobic exercise training in older adults. Aging Cell, 18(1), e12880.", note: "Randomized, double-blind: 12 weeks of aerobic training improved mitochondrial respiration and VO₂max in older adults on placebo, and metformin blunted both.", link: doi("10.1111/acel.12880"), kind: "doi" },
    ],
  },

  // ─── 7012 · rapamycin ───────────────────────────────────────────────────────
  {
    id: "lv-rapamycin-mtor",
    section: "7012",
    title: "Rapamycin and mTOR — The Best Mouse Result, and the First Human Trials",
    subtitle: "Late-life lifespan extension in mice; immune and one-year safety data in people",
    evidenceTag: "Emerging",
    description:
      "Rapamycin is the most reproducible life-extending drug in mammals: fed to genetically heterogeneous mice from 600 days of age (the human equivalent of about 60), it extended median lifespan by 14% in females and 9% in males, and it remains the anchor of the NIA Interventions Testing Program. Combined with the cancer drug trametinib it extended mouse lifespan additively. In people, six weeks of low-dose everolimus improved the antibody response to influenza vaccine in adults over 65 by about 20% and reduced markers of immune aging. Off-label use is now common enough to study: a survey of 333 users reported no excess serious side effects, and PEARL, a 48-week randomized placebo-controlled trial of 5 or 10 mg weekly in healthy adults, found safety similar to placebo, no change in the primary endpoint (visceral fat), and improvements in lean mass and self-reported pain in women on 10 mg. That is a safety result, not a longevity result; no human trial has yet shown rapamycin extends life.",
    feeds: ["the strongest preclinical geroprotector, honestly framed", "immune aging"],
    impact: { magnitude: 2, latency: "months", durability: "sustained", effort: "moderate" },
    sources: [
      { cite: "Harrison, D. E., Strong, R., Sharp, Z. D., et al. (2009). Rapamycin fed late in life extends lifespan in genetically heterogeneous mice. Nature, 460(7253), 392–395.", note: "Started at 600 days of age: median lifespan +14% (females) and +9% (males); the founding Interventions Testing Program result.", link: doi("10.1038/nature08221"), kind: "doi" },
      { cite: "Gkioni, L., Nespital, T., Baghdadi, M., et al. (2025). The geroprotectors trametinib and rapamycin combine additively to extend mouse healthspan and lifespan. Nature Aging, 5(7), 1249–1265.", note: "Mice: trametinib extended lifespan in both sexes and its combination with rapamycin was additive, with less tumour burden and inflammation.", link: doi("10.1038/s43587-025-00876-4"), kind: "doi" },
      { cite: "Mannick, J. B., Del Giudice, G., Lattanzi, M., et al. (2014). mTOR inhibition improves immune function in the elderly. Science Translational Medicine, 6(268), 268ra179.", note: "Randomized trial in 218 adults ≥65: six weeks of low-dose everolimus improved influenza-vaccine antibody response by ~20% and reduced exhausted T cells.", link: doi("10.1126/scitranslmed.3009892"), kind: "doi" },
      { cite: "Kaeberlein, T. L., Green, A. S., Haddad, G., et al. (2023). Evaluation of off-label rapamycin use to promote healthspan in 333 adults. GeroScience, 45(5), 2757–2768.", note: "Survey of 333 off-label users and 172 non-users: initial evidence of safe use in adults of normal health; self-report, not a trial.", link: doi("10.1007/s11357-023-00818-1"), kind: "doi" },
      { cite: "Moel, M., Harinath, G., Lee, V., et al. (2025). Influence of rapamycin on safety and healthspan metrics after one year: PEARL trial results. Aging, 17(4), 908–936.", note: "48-week randomized, double-blind, placebo-controlled trial of 5 or 10 mg weekly: adverse events similar to placebo, primary endpoint (visceral fat) unchanged, lean mass and pain improved in women on 10 mg.", link: doi("10.18632/aging.206235"), kind: "doi" },
    ],
  },

  // ─── 7013 · other ITP geroprotectors ────────────────────────────────────────
  {
    id: "lv-itp-geroprotectors-mice",
    section: "7013",
    title: "Acarbose, 17α-Estradiol and Canagliflozin — Lifespan Extension in Mice, Mostly Male",
    subtitle: "What the NIA Interventions Testing Program has found beyond rapamycin",
    evidenceTag: "Emerging",
    description:
      "The Interventions Testing Program runs the same lifespan experiment at three sites in genetically diverse mice, which is why its results are trusted. Acarbose (a diabetes drug that slows starch digestion) extended median lifespan by 22% in males and 5% in females; 17α-estradiol, a non-feminizing estrogen isomer, extended male lifespan by 12% and did nothing in females; nordihydroguaiaretic acid extended male lifespan. Canagliflozin, an SGLT2 inhibitor, extended male lifespan by 14% and female not at all. The sex asymmetry is itself a finding: several of these drugs appear to work through male-specific metabolic pathways. None has a human lifespan or healthspan trial. They are here so that a member who reads about them online sees exactly what was shown and in whom.",
    feeds: ["accurate knowledge of the preclinical pipeline"],
    impact: { magnitude: 2, latency: "months", durability: "sustained", effort: "low" },
    sources: [
      { cite: "Harrison, D. E., Strong, R., Allison, D. B., et al. (2014). Acarbose, 17-α-estradiol, and nordihydroguaiaretic acid extend mouse lifespan preferentially in males. Aging Cell, 13(2), 273–282.", note: "ITP: acarbose +22% median lifespan in males (+5% females); 17α-estradiol +12% in males only; NDGA extended male lifespan.", link: doi("10.1111/acel.12170"), kind: "doi" },
      { cite: "Miller, R. A., Harrison, D. E., Allison, D. B., et al. (2020). Canagliflozin extends life span in genetically heterogeneous male but not female mice. JCI Insight, 5(21), e140019.", note: "ITP: canagliflozin +14% median lifespan in males, no effect in females; fewer tumours and less cardiac enlargement in males.", link: doi("10.1172/jci.insight.140019"), kind: "doi" },
    ],
  },

  // ─── 7014 · senolytics ──────────────────────────────────────────────────────
  {
    id: "lv-senolytics",
    section: "7014",
    title: "Senolytics — Clearing Senescent Cells: Strong in Mice, Pilot-Stage in People",
    subtitle: "Dasatinib + quercetin and fisetin",
    evidenceTag: "Emerging",
    description:
      "Senescent cells stop dividing but stay alive, secreting inflammatory signals that damage the tissue around them; their accumulation is one of the hallmarks of aging. Drugs that selectively kill them extend healthspan and lifespan in mice — fisetin, a flavonoid found in strawberries, did so even when started late in life. In people the evidence is pilot-stage: a first-in-human open-label study of dasatinib plus quercetin in 14 patients with idiopathic pulmonary fibrosis improved walking distance and chair-stand performance, and a second small trial in diabetic kidney disease showed the combination actually reduced senescent-cell burden in fat tissue and skin within 11 days. These are safety-and-mechanism studies with no placebo group; whether intermittent senolytics improve anything durable in healthy people is unknown, and dasatinib is a chemotherapy drug with real side effects.",
    feeds: ["mechanism-level understanding of one hallmark", "calibration on a heavily marketed category"],
    impact: { magnitude: 2, latency: "weeks", durability: "transient", effort: "moderate" },
    sources: [
      { cite: "Yousefzadeh, M. J., Zhu, Y., McGowan, S. J., et al. (2018). Fisetin is a senotherapeutic that extends health and lifespan. EBioMedicine, 36, 18–28.", note: "Mice: fisetin reduced senescence markers and extended median and maximum lifespan even when started in old age.", link: doi("10.1016/j.ebiom.2018.09.015"), kind: "doi" },
      { cite: "Justice, J. N., Nambiar, A. M., Tchkonia, T., et al. (2019). Senolytics in idiopathic pulmonary fibrosis: Results from a first-in-human, open-label, pilot study. EBioMedicine, 40, 554–563.", note: "14 patients: three weeks of intermittent dasatinib + quercetin improved 6-minute walk, gait speed and chair-stands; no control group.", link: doi("10.1016/j.ebiom.2018.12.052"), kind: "doi" },
      { cite: "Hickson, L. J., Langhi Prata, L. G. P., Bobart, S. A., et al. (2019). Senolytics decrease senescent cells in humans: Preliminary report from a clinical trial of dasatinib plus quercetin in individuals with diabetic kidney disease. EBioMedicine, 47, 446–456.", note: "Nine patients: a three-day course reduced senescent-cell markers in adipose tissue and skin and lowered circulating SASP factors within 11 days.", link: doi("10.1016/j.ebiom.2019.08.069"), kind: "doi" },
    ],
  },

  // ─── 7015 · NAD+ precursors ─────────────────────────────────────────────────
  {
    id: "lv-nad-precursors",
    section: "7015",
    title: "NAD⁺ Precursors (NR, NMN) — They Raise the Molecule; Outcomes Are Thin",
    subtitle: "Nicotinamide riboside and nicotinamide mononucleotide in randomized trials",
    evidenceTag: "Moderate",
    description:
      "NAD⁺ declines with age and is required by the sirtuins and DNA-repair enzymes, so raising it is a rational target. The randomized trials agree on one point — oral precursors reliably raise blood NAD⁺ — and are modest on everything else. Six weeks of nicotinamide riboside (1 g/day) in healthy middle-aged and older adults was well tolerated, raised NAD⁺ by about 60%, and produced a trend toward lower blood pressure without other clinical change. NMN (250 mg/day for 10 weeks) increased muscle insulin sensitivity in postmenopausal women with prediabetes, on par with a weight-loss programme, without changing weight, blood lipids or muscle NAD⁺. A 60-day dose-ranging trial in 80 healthy adults found higher doses raised NAD⁺ more, with a modest gain in six-minute walk distance and a subjective health score. No trial has shown NAD⁺ precursors change disease, function in daily life, or lifespan in people.",
    feeds: ["a biomarker you can move", "insulin sensitivity in a specific group"],
    impact: { magnitude: 2, latency: "weeks", durability: "transient", effort: "low" },
    sources: [
      { cite: "Martens, C. R., Denman, B. A., Mazzo, M. R., et al. (2018). Chronic nicotinamide riboside supplementation is well-tolerated and elevates NAD⁺ in healthy middle-aged and older adults. Nature Communications, 9, 1286.", note: "Randomized crossover in 24 adults: 1 g/day NR raised blood NAD⁺ ~60%; trend to lower blood pressure; no adverse signal.", link: doi("10.1038/s41467-018-03421-7"), kind: "doi" },
      { cite: "Yoshino, M., Yoshino, J., Kayser, B. D., et al. (2021). Nicotinamide mononucleotide increases muscle insulin sensitivity in prediabetic women. Science, 372(6547), 1224–1229.", note: "Randomized, placebo-controlled: 250 mg/day NMN for 10 weeks raised muscle insulin sensitivity ~25% in 25 postmenopausal women with prediabetes; no other metabolic change.", link: doi("10.1126/science.abe9985"), kind: "doi" },
      { cite: "Yi, L., Maier, A. B., Tao, R., et al. (2023). The efficacy and safety of β-nicotinamide mononucleotide (NMN) supplementation in healthy middle-aged adults: A randomized, multicenter, double-blind, placebo-controlled, parallel-group, dose-dependent clinical trial. GeroScience, 45(1), 29–43.", note: "80 adults, 60 days, 300–900 mg/day: dose-dependent NAD⁺ rise, longer six-minute walk and better self-rated health; safe at all doses.", link: doi("10.1007/s11357-022-00705-1"), kind: "doi" },
    ],
  },

  // ─── 7016 · spermidine / urolithin A / taurine / GlyNAC ─────────────────────
  {
    id: "lv-emerging-supplements",
    section: "7016",
    title: "Spermidine, Urolithin A, Taurine and GlyNAC — The Emerging Supplements, Trial by Trial",
    subtitle: "What each one has shown in people and in animals",
    evidenceTag: "Emerging",
    description:
      "Spermidine, a polyamine that induces autophagy, extended lifespan and protected the heart in mice, and higher dietary intake was associated with lower cardiovascular mortality in a human cohort; but in the SmartAge randomized trial, 12 months of spermidine (0.9 mg/day) did not improve memory in 100 older adults with subjective cognitive decline. Urolithin A, a gut metabolite of pomegranate compounds, improved muscle endurance modestly and reduced inflammatory markers in a four-month randomized trial of 66 older adults, without changing six-minute walk distance or VO₂max. Taurine declines with age and supplementing it extended lifespan in mice and worms and improved health markers in monkeys; the human data are correlational only. GlyNAC (glycine plus N-acetylcysteine) restored glutathione and improved oxidative stress, mitochondrial function, inflammation, gait speed and strength in a 16-week randomized trial of 24 older adults, with the effects fading after stopping. All four are early; none has an outcome trial.",
    feeds: ["mechanism-level levers on autophagy, mitophagy and oxidative stress", "an honest ranking of supplements by evidence"],
    impact: { magnitude: 2, latency: "months", durability: "transient", effort: "low" },
    sources: [
      { cite: "Eisenberg, T., Abdellatif, M., Schroeder, S., et al. (2016). Cardioprotection and lifespan extension by the natural polyamine spermidine. Nature Medicine, 22(12), 1428–1438.", note: "Mice: dietary spermidine extended lifespan and protected cardiac function; higher human dietary intake associated with lower cardiovascular mortality.", link: doi("10.1038/nm.4222"), kind: "doi" },
      { cite: "Schwarz, C., Benson, G. S., Horn, N., et al. (2022). Effects of spermidine supplementation on cognition and biomarkers in older adults with subjective cognitive decline: A randomized clinical trial. JAMA Network Open, 5(5), e2213875.", note: "SmartAge, 100 adults, 12 months: no significant difference in memory performance versus placebo.", link: doi("10.1001/jamanetworkopen.2022.13875"), kind: "doi" },
      { cite: "Singh, A., D'Amico, D., Andreux, P. A., et al. (2022). Effect of urolithin A supplementation on muscle endurance and mitochondrial health in older adults: A randomized clinical trial. JAMA Network Open, 5(1), e2144279.", note: "66 adults aged 65–90, four months: improved hand and leg muscle endurance and lower inflammatory markers; no change in six-minute walk or peak VO₂.", link: doi("10.1001/jamanetworkopen.2021.44279"), kind: "doi" },
      { cite: "Singh, P., Gollapalli, K., Mangiola, S., et al. (2023). Taurine deficiency as a driver of aging. Science, 380(6649), eabn9257.", note: "Taurine supplementation extended lifespan in mice and worms and improved health markers in middle-aged monkeys; human evidence is associational.", link: doi("10.1126/science.abn9257"), kind: "doi" },
      { cite: "Kumar, P., Liu, C., Hsu, J. W., et al. (2023). Supplementing glycine and N-acetylcysteine (GlyNAC) in older adults improves glutathione deficiency, oxidative stress, mitochondrial dysfunction, inflammation, physical function, and aging hallmarks: A randomized clinical trial. Journals of Gerontology: Series A, 78(1), 75–89.", note: "24 older adults, 16 weeks, placebo-controlled: corrected glutathione deficiency and improved gait speed, grip and several hallmarks; benefits waned after withdrawal.", link: doi("10.1093/gerona/glac135"), kind: "doi" },
    ],
  },

  // ─── 7017 · CoQ10 & selenium ────────────────────────────────────────────────
  {
    id: "lv-coq10-selenium",
    section: "7017",
    title: "Coenzyme Q10 and Selenium — Two Randomized Trials With Mortality Endpoints",
    subtitle: "Q-SYMBIO in heart failure; KiSel-10 in older Swedes",
    evidenceTag: "Moderate",
    description:
      "Coenzyme Q10 is one of the few supplements with randomized mortality data. In Q-SYMBIO, 420 patients with chronic heart failure took 300 mg/day CoQ10 or placebo for two years: major adverse cardiovascular events fell by 43% and cardiovascular and all-cause mortality were both roughly halved. In KiSel-10, 443 healthy Swedish adults aged 70–88 (a region of low dietary selenium) took selenium 200 µg plus CoQ10 200 mg daily for four years and had about half the cardiovascular mortality of the placebo group, with better heart function on echocardiography. Both are single trials of modest size in specific populations; neither has been replicated in a large general-population sample, so the result is a lead worth knowing, not a general recommendation.",
    feeds: ["a supplement pair with actual mortality data in defined groups"],
    impact: { magnitude: 3, latency: "months", durability: "sustained", effort: "low" },
    sources: [
      { cite: "Mortensen, S. A., Rosenfeldt, F., Kumar, A., et al. (2014). The effect of coenzyme Q10 on morbidity and mortality in chronic heart failure: Results from Q-SYMBIO: A randomized double-blind trial. JACC: Heart Failure, 2(6), 641–649.", note: "420 heart-failure patients, two years: 43% fewer major adverse cardiovascular events; cardiovascular and all-cause mortality roughly halved.", link: doi("10.1016/j.jchf.2014.06.008"), kind: "doi" },
      { cite: "Alehagen, U., Johansson, P., Björnstedt, M., Rosén, A., & Dahlström, U. (2013). Cardiovascular mortality and N-terminal-proBNP reduced after combined selenium and coenzyme Q10 supplementation: A 5-year prospective randomized double-blind placebo-controlled trial among elderly Swedish citizens. International Journal of Cardiology, 167(5), 1860–1866.", note: "443 adults aged 70–88 in a low-selenium region: cardiovascular mortality 5.9% vs 12.6% with the combination over four years.", link: doi("10.1016/j.ijcard.2012.04.156"), kind: "doi" },
    ],
  },

  // ─── 7018 · vitamin D ───────────────────────────────────────────────────────
  {
    id: "lv-vitamin-d-trials",
    section: "7018",
    title: "Vitamin D — Two Large Trials, No Effect on Death, Cancer or Heart Disease in the Replete",
    subtitle: "VITAL and D-Health",
    evidenceTag: "Strong",
    description:
      "Low vitamin D levels track with almost every bad outcome in observational studies, which is exactly why the randomized trials matter. VITAL gave 25,871 US adults 2,000 IU/day of vitamin D₃ or placebo for a median 5.3 years: no reduction in invasive cancer or major cardiovascular events. D-Health gave 21,315 Australians aged 60–84 a monthly 60,000 IU dose for up to five years: no reduction in all-cause mortality, with a non-significant hint of higher cancer mortality. The people in these trials were mostly not deficient, so the result is best read as: topping up an adequate level does not extend life. Correcting a true deficiency, and the bone and fall outcomes covered in section 49, are separate questions.",
    feeds: ["calibration on the most-sold supplement"],
    impact: { magnitude: 1, latency: "months", durability: "sustained", effort: "low" },
    callout: "Rated at the floor as a longevity intervention because two large randomized trials found no effect on mortality, cancer or cardiovascular events in people who were mostly vitamin-D replete. Deficiency and bone health are separate questions.",
    sources: [
      { cite: "Manson, J. E., Cook, N. R., Lee, I.-M., et al. (2019). Vitamin D supplements and prevention of cancer and cardiovascular disease. New England Journal of Medicine, 380(1), 33–44.", note: "VITAL, 25,871 adults, median 5.3 years: 2,000 IU/day did not reduce invasive cancer or major cardiovascular events.", link: doi("10.1056/NEJMoa1809944"), kind: "doi" },
      { cite: "Neale, R. E., Baxter, C., Romero, B. D., et al. (2022). The D-Health Trial: A randomised controlled trial of the effect of vitamin D on mortality. The Lancet Diabetes & Endocrinology, 10(2), 120–128.", note: "21,315 adults aged 60–84, monthly 60,000 IU for up to five years: no reduction in all-cause mortality.", link: doi("10.1016/S2213-8587(21)00345-4"), kind: "doi" },
    ],
  },

  // ─── 7019 · COSMOS ──────────────────────────────────────────────────────────
  {
    id: "lv-cosmos-multivitamin-cocoa",
    section: "7019",
    title: "A Daily Multivitamin and Cocoa Flavanols — COSMOS",
    subtitle: "21,442 older adults, 3.6 years: cardiovascular events and cognition",
    evidenceTag: "Moderate",
    description:
      "COSMOS randomized 21,442 US adults (women ≥65, men ≥60) to cocoa extract (500 mg flavanols/day), a daily multivitamin, both or neither. Cocoa extract did not reduce the primary composite of cardiovascular events, though cardiovascular death — a secondary endpoint — was 27% lower. In the cognitive sub-study of 2,262 participants, the multivitamin, not the cocoa, improved global cognition over three years, with the largest effect in people with prior cardiovascular disease; the cocoa extract had no cognitive effect. A daily multivitamin is cheap and safe, and this is the first large randomized signal that it may slow cognitive aging; it is one trial and one sub-study, so the finding is promising rather than settled.",
    feeds: ["cognitive aging", "cardiovascular death (secondary signal)"],
    impact: { magnitude: 2, latency: "months", durability: "sustained", effort: "low" },
    sources: [
      { cite: "Sesso, H. D., Manson, J. E., Aragaki, A. K., et al. (2022). Effect of cocoa flavanol supplementation for the prevention of cardiovascular disease events: The COcoa Supplement and Multivitamin Outcomes Study (COSMOS) randomized clinical trial. American Journal of Clinical Nutrition, 115(6), 1490–1500.", note: "Cocoa extract: no reduction in the primary cardiovascular composite; 27% lower cardiovascular death as a secondary endpoint.", link: doi("10.1093/ajcn/nqac055"), kind: "doi" },
      { cite: "Baker, L. D., Manson, J. E., Rapp, S. R., et al. (2023). Effects of cocoa extract and a multivitamin on cognitive function: A randomized clinical trial. Alzheimer's & Dementia, 19(4), 1308–1319.", note: "COSMOS-Mind, 2,262 adults, three years: the multivitamin improved global cognition, episodic memory and executive function; cocoa extract did not.", link: doi("10.1002/alz.12767"), kind: "doi" },
    ],
  },

  // ─── 7020 · antioxidants & resveratrol ──────────────────────────────────────
  {
    id: "lv-antioxidant-megadose-resveratrol",
    section: "7020",
    title: "Antioxidant Megadoses and Resveratrol — The Verdict Is In, and It Is Not Good",
    subtitle: "Beta-carotene, vitamin E and vitamin A raise mortality; resveratrol does nothing measurable in people",
    evidenceTag: "Strong",
    description:
      "The Cochrane review of 78 randomized trials with 296,707 participants found that antioxidant supplements do not reduce mortality, and that beta-carotene and vitamin E, and possibly high-dose vitamin A, increase it. Resveratrol's story began with a 2003 Nature paper showing it activated sirtuins and extended yeast lifespan; two decades later, in 783 older Italian adults followed for nine years, urinary resveratrol metabolites — the marker of dietary intake — bore no relation to mortality, inflammation, cardiovascular disease or cancer. Both are rated at the floor so no one on this platform mistakes them for a longevity practice. The lesson generalises: oxidative stress is a hallmark of aging, and swallowing antioxidants is not the remedy.",
    feeds: ["protection from a harmful category", "a worked example of how a hypothesis dies"],
    impact: { magnitude: 1, latency: "months", durability: "sustained", effort: "low" },
    callout: "Debunked as a longevity practice. Beta-carotene and vitamin E supplements increased mortality across 296,707 trial participants; dietary resveratrol showed no association with health outcomes in a nine-year cohort.",
    sources: [
      { cite: "Bjelakovic, G., Nikolova, D., Gluud, L. L., Simonetti, R. G., & Gluud, C. (2012). Antioxidant supplements for prevention of mortality in healthy participants and patients with various diseases. Cochrane Database of Systematic Reviews, 3, CD007176.", note: "78 trials, 296,707 participants: no mortality benefit; beta-carotene and vitamin E increased mortality, high-dose vitamin A possibly so.", link: doi("10.1002/14651858.CD007176.pub2"), kind: "doi" },
      { cite: "Howitz, K. T., Bitterman, K. J., Cohen, H. Y., et al. (2003). Small molecule activators of sirtuins extend Saccharomyces cerevisiae lifespan. Nature, 425(6954), 191–196.", note: "The origin of the resveratrol story: sirtuin activation and lifespan extension in yeast.", link: doi("10.1038/nature01960"), kind: "doi" },
      { cite: "Semba, R. D., Ferrucci, L., Bartali, B., et al. (2014). Resveratrol levels and all-cause mortality in older community-dwelling adults. JAMA Internal Medicine, 174(7), 1077–1084.", note: "InCHIANTI, 783 adults ≥65, nine years: urinary resveratrol metabolites unrelated to mortality, inflammatory markers, cardiovascular disease or cancer.", link: doi("10.1001/jamainternmed.2014.1582"), kind: "doi" },
    ],
  },

  // ─── 7021 · caloric restriction ─────────────────────────────────────────────
  {
    id: "lv-caloric-restriction-calerie",
    section: "7021",
    title: "Caloric Restriction in Humans — CALERIE, the Only Long Randomized Trial",
    subtitle: "Two years of ~12% restriction in healthy, non-obese adults",
    evidenceTag: "Moderate",
    description:
      "Caloric restriction is the oldest and most reproducible way to extend life in animals. CALERIE randomized 218 healthy, non-obese adults aged 21–50 to two years of 25% restriction (they achieved about 12%) or their usual diet. The restricted group lost about 10% of body weight, and their cardiometabolic risk factors improved across the board — LDL, blood pressure, insulin sensitivity, C-reactive protein — with no adverse effect on quality of life, mood or bone beyond the expected loss. Blood DNA-methylation clocks told a nuanced story: the pace-of-aging measure DunedinPACE slowed by 2–3% in the restricted group, while the first-generation clocks that estimate accumulated biological age did not move. This is the best human evidence that the animal mechanism reaches people, and it is a biomarker result, not a lifespan result.",
    feeds: ["cardiometabolic risk", "pace of biological aging (biomarker)"],
    impact: { magnitude: 3, latency: "months", durability: "sustained", effort: "high" },
    sources: [
      { cite: "Ravussin, E., Redman, L. M., Rochon, J., et al. (2015). A 2-year randomized controlled trial of human caloric restriction: Feasibility and effects on predictors of health span and longevity. Journals of Gerontology: Series A, 70(9), 1097–1104.", note: "CALERIE, 218 adults: ~12% sustained restriction, ~10% weight loss, improved cardiometabolic risk factors, no adverse quality-of-life effects.", link: doi("10.1093/gerona/glv057"), kind: "doi" },
      { cite: "Kraus, W. E., Bhapkar, M., Huffman, K. M., et al. (2019). 2 years of calorie restriction and cardiometabolic risk (CALERIE): Exploratory outcomes of a multicentre, phase 2, randomised controlled trial. The Lancet Diabetes & Endocrinology, 7(9), 673–683.", note: "Persistent improvements in LDL, blood pressure, insulin sensitivity, C-reactive protein and metabolic-syndrome score at two years.", link: doi("10.1016/S2213-8587(19)30151-2"), kind: "doi" },
      { cite: "Waziry, R., Ryan, C. P., Corcoran, D. L., et al. (2023). Effect of long-term caloric restriction on DNA methylation measures of biological aging in healthy adults from the CALERIE trial. Nature Aging, 3(3), 248–257.", note: "DunedinPACE slowed 2–3% with restriction; PhenoAge and GrimAge did not change.", link: doi("10.1038/s43587-022-00357-y"), kind: "doi" },
    ],
  },

  // ─── 7022 · TRE & fasting-mimicking ─────────────────────────────────────────
  {
    id: "lv-time-restricted-fasting-mimicking",
    section: "7022",
    title: "Time-Restricted Eating and the Fasting-Mimicking Diet — Calories Still Count",
    subtitle: "TREAT, the NEJM trial of 8-hour eating with calorie restriction, and periodic fasting-mimicking",
    evidenceTag: "Mixed",
    description:
      "Eating in a shorter window is easy to describe and hard to beat as a habit, which is why the trials are sobering. TREAT randomized 116 adults with overweight to a 16:8 window or three meals a day for 12 weeks: the eating-window group lost 0.94 kg, statistically no different from controls, and lost more lean mass. A 12-month trial in 139 Chinese adults with obesity found that an 8-hour window added nothing to calorie restriction alone — both groups lost about 7–8 kg. The fasting-mimicking diet (five days a month of a low-calorie plant-based regimen) reduced risk factors for aging, diabetes and cardiovascular disease in a small pilot embedded in a mouse paper. The practical reading: time restriction is a tool for eating less, and eating less is what does the work; watch the lean mass and pair it with section 7002.",
    feeds: ["a realistic view of fasting", "weight control as a habit rather than a hack"],
    impact: { magnitude: 2, latency: "weeks", durability: "sustained", effort: "moderate" },
    sources: [
      { cite: "Lowe, D. A., Wu, N., Rohdin-Bibby, L., et al. (2020). Effects of time-restricted eating on weight loss and other metabolic parameters in women and men with overweight and obesity: The TREAT randomized clinical trial. JAMA Internal Medicine, 180(11), 1491–1499.", note: "116 adults, 12 weeks: 16:8 eating produced no significant weight loss versus controls and more loss of lean mass.", link: doi("10.1001/jamainternmed.2020.4153"), kind: "doi" },
      { cite: "Liu, D., Huang, Y., Huang, C., et al. (2022). Calorie restriction with or without time-restricted eating in weight loss. New England Journal of Medicine, 386(16), 1495–1504.", note: "139 adults with obesity, 12 months: an 8-hour window added no benefit over calorie restriction alone for weight, fat or metabolic risk.", link: doi("10.1056/NEJMoa2114833"), kind: "doi" },
      { cite: "Brandhorst, S., Choi, I. Y., Wei, M., et al. (2015). A periodic diet that mimics fasting promotes multi-system regeneration, enhanced cognitive performance, and healthspan. Cell Metabolism, 22(1), 86–99.", note: "Mice: periodic fasting-mimicking cycles extended healthspan; a 19-person human pilot showed reduced risk factors for aging and disease.", link: doi("10.1016/j.cmet.2015.05.012"), kind: "doi" },
    ],
  },

  // ─── 7023 · diet & coffee ───────────────────────────────────────────────────
  {
    id: "lv-mediterranean-coffee",
    section: "7023",
    title: "The Mediterranean Diet and Coffee",
    subtitle: "PREDIMED's randomized result and the largest coffee cohort",
    evidenceTag: "Strong",
    description:
      "PREDIMED randomized 7,447 Spanish adults at high cardiovascular risk to a Mediterranean diet with extra-virgin olive oil, the same diet with nuts, or a low-fat control; both Mediterranean arms had about 30% fewer major cardiovascular events over 4.8 years. (The 2018 paper is the corrected re-analysis after problems with randomization at some sites; the result held.) Coffee, long suspected, turns out to be neutral-to-favourable: among 402,260 adults in the NIH-AARP cohort, coffee drinkers had modestly lower mortality than non-drinkers after adjusting for smoking, with the association holding for caffeinated and decaffeinated coffee and for deaths from heart disease, stroke, diabetes and infection. See sections 26 and 56 of the main library for the brain-specific evidence.",
    feeds: ["cardiovascular survival", "a dietary pattern with a randomized outcome trial behind it"],
    impact: { magnitude: 4, latency: "months", durability: "lasting", effort: "moderate" },
    sources: [
      { cite: "Estruch, R., Ros, E., Salas-Salvadó, J., et al. (2018). Primary prevention of cardiovascular disease with a Mediterranean diet supplemented with extra-virgin olive oil or nuts. New England Journal of Medicine, 378(25), e34.", note: "PREDIMED, 7,447 adults: ~30% fewer major cardiovascular events with either Mediterranean arm; corrected re-analysis.", link: doi("10.1056/NEJMoa1800389"), kind: "doi" },
      { cite: "Freedman, N. D., Park, Y., Abnet, C. C., Hollenbeck, A. R., & Sinha, R. (2012). Association of coffee drinking with total and cause-specific mortality. New England Journal of Medicine, 366(20), 1891–1904.", note: "402,260 adults, 13.6 years: coffee drinking associated with modestly lower total and cause-specific mortality after adjustment for smoking.", link: doi("10.1056/NEJMoa1112010"), kind: "doi" },
    ],
  },

  // ─── 7024 · sleep duration ──────────────────────────────────────────────────
  {
    id: "lv-sleep-duration-mortality",
    section: "7024",
    title: "Sleep Duration and Mortality — The U-Shaped Curve",
    subtitle: "Short and long sleep both track with earlier death",
    evidenceTag: "Strong",
    description:
      "Across 16 prospective studies and 1.38 million people, sleeping less than about six hours a night was associated with 12% higher mortality and sleeping more than about nine hours with 30% higher — the long-sleep side is likely partly reverse causation (illness makes people sleep), the short-sleep side is consistent with the experimental evidence in section 14. Sleep is the cheapest lever on this shelf and the one most people underuse; see sections 14 and 79 of the main library for the how.",
    feeds: ["survival", "everything section 14 lists"],
    impact: { magnitude: 4, latency: "days", durability: "sustained", effort: "low" },
    sources: [
      { cite: "Cappuccio, F. P., D'Elia, L., Strazzullo, P., & Miller, M. A. (2010). Sleep duration and all-cause mortality: A systematic review and meta-analysis of prospective studies. Sleep, 33(5), 585–592.", note: "16 studies, 1,382,999 people: short sleep RR 1.12 and long sleep RR 1.30 for all-cause mortality.", link: doi("10.1093/sleep/33.5.585"), kind: "doi" },
    ],
  },

  // ─── 7025 · sauna ───────────────────────────────────────────────────────────
  {
    id: "lv-sauna-mortality",
    section: "7025",
    title: "Sauna Bathing and Mortality — The Finnish Cohort",
    subtitle: "Frequency of sauna use and fatal cardiovascular events over 20 years",
    evidenceTag: "Moderate",
    description:
      "In 2,315 middle-aged Finnish men followed for a median of 20.7 years, those who used a sauna four to seven times a week had 40% lower all-cause mortality and roughly half the sudden cardiac deaths of once-a-week users, with a dose-response across frequency and session length. It is one cohort in one culture and cannot rule out that healthier men sauna more; the physiology (heat stress raises heart rate and cardiac output much like moderate exercise) makes it plausible. Section 17 of the main library covers the mood and brain evidence.",
    feeds: ["cardiovascular health", "a low-effort practice with a mortality signal"],
    impact: { magnitude: 3, latency: "months", durability: "sustained", effort: "low" },
    sources: [
      { cite: "Laukkanen, T., Khan, H., Zaccardi, F., & Laukkanen, J. A. (2015). Association between sauna bathing and fatal cardiovascular and all-cause mortality events. JAMA Internal Medicine, 175(4), 542–548.", note: "2,315 men, 20.7 years: 4–7 sauna sessions/week associated with 40% lower all-cause mortality and 63% lower sudden cardiac death versus once a week.", link: doi("10.1001/jamainternmed.2014.8187"), kind: "doi" },
    ],
  },

  // ─── 7026 · menopausal hormone therapy ──────────────────────────────────────
  {
    id: "lv-menopausal-hormone-therapy",
    section: "7026",
    title: "Menopausal Hormone Therapy — From the 2002 Scare to the Timing Hypothesis",
    subtitle: "WHI's principal results, its 18-year mortality follow-up, and the 2022 position statement",
    evidenceTag: "Strong",
    description:
      "The Women's Health Initiative stopped its estrogen-plus-progestin trial in 2002 because, in 16,608 postmenopausal women (mean age 63), the combination raised breast cancer, coronary events, stroke and clots even as it cut fractures and colorectal cancer. Eighteen years on, the same trials showed no difference in all-cause, cardiovascular or cancer mortality between hormone therapy and placebo across 27,347 women. The 2022 position statement of The North American Menopause Society draws the line the data support: for women under 60 or within ten years of menopause with bothersome symptoms and no contraindication, the benefit–risk ratio is favourable; starting later, it is not. Hormone therapy treats symptoms and bone; it is not a longevity therapy, and it is not the danger the 2002 headlines made it.",
    feeds: ["symptom relief and bone protection in the right window", "an honest end to a 20-year confusion"],
    impact: { magnitude: 3, latency: "weeks", durability: "sustained", effort: "low" },
    sources: [
      { cite: "Writing Group for the Women's Health Initiative Investigators. (2002). Risks and benefits of estrogen plus progestin in healthy postmenopausal women: Principal results from the Women's Health Initiative randomized controlled trial. JAMA, 288(3), 321–333.", note: "16,608 women: estrogen + progestin increased breast cancer, coronary disease, stroke and pulmonary embolism; decreased fractures and colorectal cancer; trial stopped early.", link: doi("10.1001/jama.288.3.321"), kind: "doi" },
      { cite: "Manson, J. E., Aragaki, A. K., Rossouw, J. E., et al. (2017). Menopausal hormone therapy and long-term all-cause and cause-specific mortality: The Women's Health Initiative randomized trials. JAMA, 318(10), 927–938.", note: "27,347 women, 18 years of cumulative follow-up: no difference in all-cause, cardiovascular or total cancer mortality versus placebo.", link: doi("10.1001/jama.2017.11217"), kind: "doi" },
      { cite: "The North American Menopause Society. (2022). The 2022 hormone therapy position statement of The North American Menopause Society. Menopause, 29(7), 767–794.", note: "Favourable benefit–risk for women <60 or within 10 years of menopause with symptoms; less favourable when started later.", link: doi("10.1097/GME.0000000000002028"), kind: "doi" },
    ],
  },

  // ─── 7027 · testosterone, GH, DHEA ──────────────────────────────────────────
  {
    id: "lv-testosterone-gh-dhea",
    section: "7027",
    title: "Testosterone, Growth Hormone and DHEA — The Honest Verdict on the Anti-Aging Hormones",
    subtitle: "TRAVERSE, the growth-hormone systematic review, and the DHEA trial",
    evidenceTag: "Strong",
    description:
      "Three hormones are sold as youth restored. Testosterone: in TRAVERSE, 5,246 men aged 45–80 with low testosterone and symptoms plus cardiovascular risk were randomized to gel or placebo for a mean 22 months; the therapy was non-inferior for major cardiovascular events (it did not raise heart-attack or stroke risk), but atrial fibrillation, acute kidney injury and pulmonary embolism were more frequent. It treats hypogonadism; it does not extend life. Growth hormone: a systematic review of 18 trials in healthy elderly found small gains in lean mass and losses in fat, no improvement in strength or function, and more soft-tissue swelling, joint pain, carpal tunnel and glucose intolerance — the reviewers concluded it cannot be recommended as an anti-aging therapy. DHEA: two years of DHEA in 87 elderly men and 57 women (and low-dose testosterone in the men) produced no clinically meaningful change in body composition, strength, insulin sensitivity or quality of life. Growth hormone and DHEA are rated at the floor.",
    feeds: ["protection against the hormone-clinic sales pitch", "clarity on who testosterone is actually for"],
    impact: { magnitude: 1, latency: "months", durability: "sustained", effort: "moderate" },
    callout: "Growth hormone and DHEA are debunked as anti-aging therapies by randomized evidence. Testosterone treats diagnosed hypogonadism and was cardiovascular-neutral in TRAVERSE, with more atrial fibrillation and clots; it is not a longevity drug.",
    sources: [
      { cite: "Lincoff, A. M., Bhasin, S., Flevaris, P., et al. (2023). Cardiovascular safety of testosterone-replacement therapy. New England Journal of Medicine, 389(2), 107–117.", note: "TRAVERSE, 5,246 men: non-inferior for major adverse cardiac events; higher incidence of atrial fibrillation, acute kidney injury and pulmonary embolism.", link: doi("10.1056/NEJMoa2215025"), kind: "doi" },
      { cite: "Liu, H., Bravata, D. M., Olkin, I., et al. (2007). Systematic review: The safety and efficacy of growth hormone in the healthy elderly. Annals of Internal Medicine, 146(2), 104–115.", note: "18 study populations: small body-composition changes, no functional benefit, more adverse events; not recommended as anti-aging therapy.", link: doi("10.7326/0003-4819-146-2-200701160-00005"), kind: "doi" },
      { cite: "Nair, K. S., Rizza, R. A., O'Brien, P., et al. (2006). DHEA in elderly women and DHEA or testosterone in elderly men. New England Journal of Medicine, 355(16), 1647–1659.", note: "Two-year randomized trial: no clinically relevant benefit of DHEA (or low-dose testosterone) on body composition, performance, insulin sensitivity or quality of life.", link: doi("10.1056/NEJMoa054629"), kind: "doi" },
    ],
  },

  // ─── 7028 · epigenetic clocks ───────────────────────────────────────────────
  {
    id: "lv-epigenetic-clocks",
    section: "7028",
    title: "Epigenetic Clocks and Biological Age — What the Blood Test Can and Cannot Tell You",
    subtitle: "Horvath's clock, PhenoAge, DunedinPACE, and the TRIIM pilot",
    evidenceTag: "Moderate",
    description:
      "DNA-methylation clocks read a pattern of chemical marks on DNA that shifts predictably with age; Horvath's 2013 clock estimated chronological age within about 3.6 years across tissues. Second-generation clocks were trained on outcomes rather than birthdays: PhenoAge predicts mortality, cancer, physical function and Alzheimer's better than the first generation, and DunedinPACE estimates the current pace of aging from a single blood draw, which is what the CALERIE trial used to show calorie restriction slows it. The clocks are research instruments that respond to interventions; whether slowing a clock reading translates into longer life has not been shown. The TRIIM pilot — nine men given growth hormone, DHEA and metformin for a year to regrow the thymus — reported a 2.5-year reversal in epigenetic age; it had no control group, and the consumer 'biological age' tests built on such clocks should be read with that in mind.",
    feeds: ["a measurable, movable proxy for aging", "informed scepticism about consumer age tests"],
    impact: { magnitude: 2, latency: "months", durability: "transient", effort: "low" },
    sources: [
      { cite: "Horvath, S. (2013). DNA methylation age of human tissues and cell types. Genome Biology, 14(10), R115.", note: "The multi-tissue clock: 353 CpG sites predict chronological age with a median error of 3.6 years.", link: doi("10.1186/gb-2013-14-10-r115"), kind: "doi" },
      { cite: "Levine, M. E., Lu, A. T., Quach, A., et al. (2018). An epigenetic biomarker of aging for lifespan and healthspan. Aging, 10(4), 573–591.", note: "DNAm PhenoAge: trained on clinical measures, it outperforms first-generation clocks for mortality, cancer, healthspan and Alzheimer's prediction.", link: doi("10.18632/aging.101414"), kind: "doi" },
      { cite: "Belsky, D. W., Caspi, A., Corcoran, D. L., et al. (2022). DunedinPACE, a DNA methylation biomarker of the pace of aging. eLife, 11, e73420.", note: "A blood-test measure of the current rate of aging, validated against decline, disease and death in independent cohorts.", link: doi("10.7554/eLife.73420"), kind: "doi" },
      { cite: "Fahy, G. M., Brooke, R. T., Watson, J. P., et al. (2019). Reversal of epigenetic aging and immunosenescent trends in humans. Aging Cell, 18(6), e13028.", note: "TRIIM: nine men, one year of growth hormone + DHEA + metformin; thymic regeneration and ~2.5-year epigenetic age reversal; uncontrolled pilot.", link: doi("10.1111/acel.13028"), kind: "doi" },
    ],
  },

  // ─── 7029 · hearing & dementia ──────────────────────────────────────────────
  {
    id: "lv-hearing-vision-dementia",
    section: "7029",
    title: "Hearing Aids, Vision and the Modifiable Share of Dementia",
    subtitle: "ACHIEVE and the Lancet Commission's fourteen risk factors",
    evidenceTag: "Strong",
    description:
      "The 2024 Lancet Commission estimates that about 45% of dementia cases are attributable to fourteen modifiable risk factors, with hearing loss, high LDL cholesterol, less education and untreated vision loss among the largest. ACHIEVE tested the hearing lever directly: 977 older adults with untreated hearing loss were randomized to hearing aids plus audiological counselling or health education. In the overall group, three-year cognitive decline did not differ; in the pre-specified subgroup at higher dementia risk (older, drawn from an ongoing heart-health cohort), the hearing intervention slowed cognitive decline by 48%. Hearing and vision are the two senses that keep the brain fed with input; section 50 and 53 of the main library carry the rest of the evidence.",
    feeds: ["cognitive protection", "a concrete list of what to fix"],
    impact: { magnitude: 3, latency: "months", durability: "lasting", effort: "low" },
    sources: [
      { cite: "Livingston, G., Huntley, J., Liu, K. Y., et al. (2024). Dementia prevention, intervention, and care: 2024 report of the Lancet standing Commission. The Lancet, 404(10452), 572–628.", note: "Fourteen modifiable risk factors, now including high LDL cholesterol and untreated vision loss, together accounting for ~45% of dementia cases.", link: doi("10.1016/S0140-6736(24)01296-0"), kind: "doi" },
      { cite: "Lin, F. R., Pike, J. R., Albert, M. S., et al. (2023). Hearing intervention versus health education control to reduce cognitive decline in older adults with hearing loss in the USA (ACHIEVE): A multicentre, randomised controlled trial. The Lancet, 402(10404), 786–797.", note: "977 adults, three years: no overall difference, but a 48% slowing of cognitive decline in the pre-specified higher-risk subgroup.", link: doi("10.1016/S0140-6736(23)01406-X"), kind: "doi" },
    ],
  },

  // ─── 7030 · vaccines ────────────────────────────────────────────────────────
  {
    id: "lv-vaccines-shingles-flu",
    section: "7030",
    title: "Vaccines as Longevity Medicine — Shingles and Dementia, Influenza and the Heart",
    subtitle: "A natural experiment in Wales and a meta-analysis of cardiovascular outcomes",
    evidenceTag: "Strong",
    description:
      "Two vaccines have evidence that reaches past the infection they prevent. In Wales, eligibility for the shingles vaccine was set by a birth-date cut-off, producing a near-randomized comparison of people born a week apart; the vaccinated cohort had about a 20% lower probability of a new dementia diagnosis over seven years (a 3.5-percentage-point absolute reduction), with the effect larger in women. Influenza vaccination, in a meta-analysis of five randomized trials in 6,735 patients at high cardiovascular risk, was associated with 36% fewer major adverse cardiovascular events within a year, and roughly halved them in people with recent acute coronary syndrome. Infections and the inflammation they trigger are part of how aging damages the brain and heart; vaccination is the cheapest anti-inflammatory on the shelf.",
    feeds: ["dementia risk", "cardiovascular events", "immune aging"],
    impact: { magnitude: 3, latency: "months", durability: "lasting", effort: "low" },
    sources: [
      { cite: "Eyting, M., Xie, M., Michalik, F., Heß, S., Chung, S., & Geldsetzer, P. (2025). A natural experiment on the effect of herpes zoster vaccination on dementia. Nature, 641(8062), 438–446.", note: "Regression-discontinuity design in Wales: ~20% relative (3.5-point absolute) reduction in new dementia diagnoses over seven years among the vaccine-eligible.", link: doi("10.1038/s41586-025-08800-x"), kind: "doi" },
      { cite: "Udell, J. A., Zawi, R., Bhatt, D. L., et al. (2013). Association between influenza vaccination and cardiovascular outcomes in high-risk patients: A meta-analysis. JAMA, 310(16), 1711–1720.", note: "Five randomized trials, 6,735 patients: 36% lower risk of major adverse cardiovascular events within a year of vaccination.", link: doi("10.1001/jama.2013.279206"), kind: "doi" },
    ],
  },

  // ─── 7031 · aspirin ─────────────────────────────────────────────────────────
  {
    id: "lv-aspirin-aspree",
    section: "7031",
    title: "Daily Low-Dose Aspirin in Healthy Older Adults — ASPREE Said No",
    subtitle: "19,114 adults ≥70 without cardiovascular disease",
    evidenceTag: "Strong",
    description:
      "For decades a daily baby aspirin was folk longevity medicine. ASPREE tested it in 19,114 healthy adults aged 70 and over (65 for Black and Hispanic participants in the US) with no history of cardiovascular disease, dementia or disability: over 4.7 years, aspirin did not extend disability-free survival and all-cause mortality was higher in the aspirin group, driven by cancer deaths, alongside the expected increase in major bleeding. People with established cardiovascular disease are a different population and were not in this trial. Rated at the floor as a primary-prevention longevity practice.",
    feeds: ["stopping a harmful habit"],
    impact: { magnitude: 1, latency: "months", durability: "sustained", effort: "low" },
    callout: "Debunked for healthy older adults: no gain in disability-free survival, higher all-cause mortality and more major bleeding. Aspirin after a heart attack or stroke is a separate, evidence-based use.",
    sources: [
      { cite: "McNeil, J. J., Nelson, M. R., Woods, R. L., et al. (2018). Effect of aspirin on all-cause mortality in the healthy elderly. New England Journal of Medicine, 379(16), 1519–1528.", note: "ASPREE, 19,114 adults: all-cause mortality 12.7 vs 11.1 per 1,000 person-years with aspirin, the excess mostly cancer deaths.", link: doi("10.1056/NEJMoa1803955"), kind: "doi" },
    ],
  },

  // ─── 7032 · colonoscopy ─────────────────────────────────────────────────────
  {
    id: "lv-screening-colonoscopy",
    section: "7032",
    title: "Screening Colonoscopy — What the First Randomized Trial Showed",
    subtitle: "NORDICC: invitation versus usual care in 84,585 adults",
    evidenceTag: "Strong",
    description:
      "NORDICC randomized 84,585 adults aged 55–64 in Poland, Norway and Sweden to an invitation for a single screening colonoscopy or to usual care. In the intention-to-screen analysis, colorectal cancer risk over ten years fell by 18% and colorectal-cancer death did not fall significantly — but only 42% of invitees actually had the colonoscopy. Among those who did, the per-protocol estimate was a 31% reduction in cancer and a 50% reduction in colorectal-cancer death. The lesson is not that screening fails; it is that a screening test only works on the people who take it, and that the size of the benefit for an individual who completes it is large.",
    feeds: ["cancer prevention", "a realistic view of screening numbers"],
    impact: { magnitude: 3, latency: "months", durability: "lasting", effort: "low" },
    sources: [
      { cite: "Bretthauer, M., Løberg, M., Wieszczy, P., et al. (2022). Effect of colonoscopy screening on risks of colorectal cancer and related death. New England Journal of Medicine, 387(17), 1547–1556.", note: "84,585 adults: 18% lower colorectal cancer incidence by invitation; ~31% lower incidence and ~50% lower colorectal-cancer mortality among those who were actually screened.", link: doi("10.1056/NEJMoa2208375"), kind: "doi" },
    ],
  },

  // ─── 7033 · young blood, plasma exchange, HBOT, stem-cell clinics ───────────
  {
    id: "lv-young-blood-plasma-hbot-stemcell-clinics",
    section: "7033",
    title: "Young Blood, Plasma Exchange, Hyperbaric Oxygen and Stem-Cell Clinics — Where the Evidence Stops",
    subtitle: "Parabiosis in mice, the first human plasma trial, a telomere study, and the direct-to-consumer stem-cell industry",
    evidenceTag: "Emerging",
    description:
      "Joining the circulation of an old mouse to a young one rejuvenated the old animal's muscle and liver stem cells — the 2005 experiment behind every young-blood clinic. Later work showed that diluting old plasma with saline and albumin, with no young blood at all, produced similar rejuvenation in mice, pointing to the removal of harmful factors rather than the addition of youthful ones. In people, the only randomized trial infused young plasma into 18 patients with Alzheimer's disease: it was safe and feasible, and showed no cognitive benefit. Hyperbaric oxygen, in an uncontrolled study of 35 older adults, lengthened blood-cell telomeres and reduced senescent cells after 60 sessions; the study had no placebo group and no clinical outcome. The direct-to-consumer stem-cell industry — 351 US businesses at 570 clinics in the 2016 survey — sells unproven interventions for aging and disease, and serious harms have been reported. Rated Emerging for the science, and at the floor for the clinics that sell it today.",
    feeds: ["knowing which headlines rest on mice", "protection from expensive, unproven procedures"],
    impact: { magnitude: 1, latency: "months", durability: "transient", effort: "high" },
    callout: "Rated at the floor as a purchasable treatment: no young-plasma, plasma-exchange, hyperbaric or stem-cell product has shown a clinical anti-aging benefit in a controlled human trial, and the clinics selling them operate outside that evidence.",
    sources: [
      { cite: "Conboy, I. M., Conboy, M. J., Wagers, A. J., Girma, E. R., Weissman, I. L., & Rando, T. A. (2005). Rejuvenation of aged progenitor cells by exposure to a young systemic environment. Nature, 433(7027), 760–764.", note: "Heterochronic parabiosis in mice: young circulation restored muscle and liver progenitor-cell function in old animals.", link: doi("10.1038/nature03260"), kind: "doi" },
      { cite: "Mehdipour, M., Skinner, C., Wong, N., et al. (2020). Rejuvenation of three germ layers tissues by exchanging old blood plasma with saline-albumin. Aging, 12(10), 8790–8819.", note: "Mice: replacing half the plasma with saline-albumin, no young blood, rejuvenated muscle, liver and brain — the effect comes from dilution, not youth factors.", link: doi("10.18632/aging.103418"), kind: "doi" },
      { cite: "Sha, S. J., Deutsch, G. K., Tian, L., et al. (2019). Safety, tolerability, and feasibility of young plasma infusion in the Plasma for Alzheimer Symptom Amelioration Study: A randomized clinical trial. JAMA Neurology, 76(1), 35–43.", note: "18 patients with Alzheimer's: young plasma was safe and feasible; no cognitive or functional benefit was found.", link: doi("10.1001/jamaneurol.2018.3288"), kind: "doi" },
      { cite: "Hachmo, Y., Hadanny, A., Abu Hamed, R., et al. (2020). Hyperbaric oxygen therapy increases telomere length and decreases immunosenescence in isolated blood cells: A prospective trial. Aging, 12(22), 22445–22456.", note: "35 adults ≥64, 60 sessions, no control group: longer telomeres and fewer senescent T cells in blood; no clinical outcome measured.", link: doi("10.18632/aging.202188"), kind: "doi" },
      { cite: "Turner, L., & Knoepfler, P. (2016). Selling stem cells in the USA: Assessing the direct-to-consumer industry. Cell Stem Cell, 19(2), 154–157.", note: "351 US businesses marketing unproven stem-cell interventions at 570 clinics, including for aging; the regulatory and safety concerns are laid out.", link: doi("10.1016/j.stem.2016.06.007"), kind: "doi" },
    ],
  },

  // ─── 7034 · partial reprogramming ───────────────────────────────────────────
  {
    id: "lv-partial-reprogramming-animal",
    section: "7034",
    title: "Partial Epigenetic Reprogramming — The Most Exciting Result on the Shelf, and It Is All in Mice",
    subtitle: "Cyclic Yamanaka-factor expression in progeroid and aged mice; vision restored in the eye",
    evidenceTag: "Emerging",
    description:
      "Turning on the four Yamanaka factors briefly and cyclically — enough to reset epigenetic marks without erasing cell identity — extended lifespan by about 30% in a mouse model of premature aging and improved recovery from injury in old normal mice. Expressing three of the factors in the retina restored youthful DNA-methylation patterns, regenerated crushed optic-nerve axons and reversed vision loss in aged mice and in a glaucoma model. This is the mechanistic proof that aged tissue retains a record of its younger state; it is also gene therapy delivered by virus, with a known cancer risk if expression runs too long. No human has been treated in a published trial. Companies have been funded on these papers; a member should know the papers are mouse papers.",
    feeds: ["understanding where the field is heading", "immunity to 'age reversal' marketing"],
    impact: { magnitude: 2, latency: "months", durability: "transient", effort: "high" },
    sources: [
      { cite: "Ocampo, A., Reddy, P., Martinez-Redondo, P., et al. (2016). In vivo amelioration of age-associated hallmarks by partial reprogramming. Cell, 167(7), 1719–1733.e12.", note: "Cyclic OSKM expression: ~30% longer lifespan in progeroid mice and improved injury recovery in aged wild-type mice.", link: doi("10.1016/j.cell.2016.11.052"), kind: "doi" },
      { cite: "Lu, Y., Brommer, B., Tian, X., et al. (2020). Reprogramming to recover youthful epigenetic information and restore vision. Nature, 588(7836), 124–129.", note: "OSK expression in mouse retinal ganglion cells restored youthful methylation, regenerated axons after injury and reversed vision loss in aged and glaucoma models.", link: doi("10.1038/s41586-020-2975-4"), kind: "doi" },
    ],
  },

  // ─── 7035 · social connection ───────────────────────────────────────────────
  {
    id: "lv-social-connection-mortality",
    section: "7035",
    title: "Social Connection and Loneliness — A Mortality Effect the Size of Smoking",
    subtitle: "Two meta-analyses of relationships, isolation and death",
    evidenceTag: "Strong",
    description:
      "Across 148 studies and 308,849 people, those with stronger social relationships had a 50% higher likelihood of survival over the follow-up period — an effect comparable to quitting smoking and larger than obesity or physical inactivity. A second meta-analysis of 70 studies and 3.4 million people put numbers on the reverse: social isolation raised the likelihood of death by 29%, loneliness by 26% and living alone by 32%, with the effects strongest below age 65. Sections 3, 149 and 150 of the main library carry the mechanism; this shelf carries the survival arithmetic. Of every practice here, this is the one most members skip.",
    feeds: ["survival", "everything section 3 lists"],
    impact: { magnitude: 5, latency: "months", durability: "lasting", effort: "moderate" },
    sources: [
      { cite: "Holt-Lunstad, J., Smith, T. B., & Layton, J. B. (2010). Social relationships and mortality risk: A meta-analytic review. PLoS Medicine, 7(7), e1000316.", note: "148 studies, 308,849 people: 50% greater likelihood of survival with stronger social relationships.", link: doi("10.1371/journal.pmed.1000316"), kind: "doi" },
      { cite: "Holt-Lunstad, J., Smith, T. B., Baker, M., Harris, T., & Stephenson, D. (2015). Loneliness and social isolation as risk factors for mortality: A meta-analytic review. Perspectives on Psychological Science, 10(2), 227–237.", note: "70 studies, 3,407,134 people: isolation +29%, loneliness +26%, living alone +32% likelihood of mortality.", link: doi("10.1177/1745691614568352"), kind: "doi" },
    ],
  },

  // ─── 7036 · smoking & alcohol ───────────────────────────────────────────────
  {
    id: "lv-smoking-alcohol-years",
    section: "7036",
    title: "Smoking and Alcohol — The Two Largest Subtractions, With the Years Counted",
    subtitle: "What smoking costs, what quitting recovers, and the alcohol curve without a safe floor",
    evidenceTag: "Strong",
    description:
      "In 216,917 US adults, current smokers lost about a decade of life expectancy compared with never-smokers; quitting by age 40 recovered roughly nine of those ten years, and quitting at 45–54 recovered about six. The Global Burden of Disease analysis of 694 data sources across 195 countries found that the level of alcohol consumption that minimised overall health loss was zero: the small cardiovascular benefit of light drinking was outweighed by cancer, injury and infectious-disease risk at every level. These are the two levers where the arithmetic is least ambiguous and the years at stake are largest.",
    feeds: ["the single largest recoverable loss (smoking)", "a clear line on alcohol"],
    impact: { magnitude: 5, latency: "months", durability: "lasting", effort: "high" },
    sources: [
      { cite: "Jha, P., Ramasundarahettige, C., Landsman, V., et al. (2013). 21st-century hazards of smoking and benefits of cessation in the United States. New England Journal of Medicine, 368(4), 341–350.", note: "216,917 adults: smokers lose ~10 years of life; quitting before 40 recovers ~90% of them.", link: doi("10.1056/NEJMsa1211128"), kind: "doi" },
      { cite: "GBD 2016 Alcohol Collaborators. (2018). Alcohol use and burden for 195 countries and territories, 1990–2016: A systematic analysis for the Global Burden of Disease Study 2016. The Lancet, 392(10152), 1015–1035.", note: "The level of consumption that minimises health loss is zero standard drinks per week.", link: doi("10.1016/S0140-6736(18)31310-2"), kind: "doi" },
    ],
  },

  // ─── 7037 · frailty & the bundle ────────────────────────────────────────────
  {
    id: "lv-frailty-phenotype",
    section: "7037",
    title: "Frailty — The Five-Sign Phenotype That Predicts What Comes Next",
    subtitle: "Weight loss, exhaustion, weakness, slow walking, low activity",
    evidenceTag: "Strong",
    description:
      "Fried's phenotype defined frailty as three or more of five signs: unintentional weight loss, self-reported exhaustion, weak grip, slow walking speed and low physical activity. In 5,317 adults aged 65 and over it was present in 6.9%, and it independently predicted falls, worsening mobility, hospitalization and death over three years, with hazard ratios of 1.8–4.5 unadjusted. One or two signs marked an intermediate stage at high risk of becoming frail. Each of the five is measurable at home and each maps onto a section of this shelf (7002, 7003, 7004, 7024). Frailty is the thing the longevity bundle is designed to prevent, and it is reversible in its early stages.",
    feeds: ["a five-point self-check", "the target the whole shelf is aimed at"],
    impact: { magnitude: 4, latency: "weeks", durability: "sustained", effort: "low" },
    sources: [
      { cite: "Fried, L. P., Tangen, C. M., Walston, J., et al. (2001). Frailty in older adults: Evidence for a phenotype. Journals of Gerontology: Series A, 56(3), M146–M156.", note: "5,317 adults ≥65: the five-criterion phenotype predicted falls, disability, hospitalization and death independently of comorbidity.", link: doi("10.1093/gerona/56.3.M146"), kind: "doi" },
      { cite: "Li, Y., Pan, A., Wang, D. D., et al. (2018). Impact of healthy lifestyle factors on life expectancies in the US population. Circulation, 138(4), 345–355.", note: "The bundle that prevents it: five low-risk habits, 12–14 additional years of life expectancy at 50.", link: doi("10.1161/CIRCULATIONAHA.117.032047"), kind: "doi" },
    ],
  },

  // ─── 7038 · collagen ────────────────────────────────────────────────────────
  {
    id: "lv-collagen-skin",
    section: "7038",
    title: "Oral Collagen for Skin Aging — A Cosmetic Result, Not a Longevity One",
    subtitle: "Hydration, elasticity and roughness in a placebo-controlled trial",
    evidenceTag: "Moderate",
    description:
      "Collagen peptides are among the best-selling 'anti-aging' supplements. In a randomized, placebo-controlled trial of 72 women aged 35 and over, 12 weeks of a collagen-peptide drink improved skin hydration, elasticity, roughness and density, with the gains persisting four weeks after stopping. That is a real, measured cosmetic effect. It has no bearing on lifespan, heart, brain or muscle, and it is here so that a member can put it in its place: a skin product with decent evidence, not a longevity intervention.",
    feeds: ["skin appearance", "clarity about what 'anti-aging' means on a label"],
    impact: { magnitude: 2, latency: "weeks", durability: "transient", effort: "low" },
    sources: [
      { cite: "Bolke, L., Schlippe, G., Gerß, J., & Voss, W. (2019). A collagen supplement improves skin hydration, elasticity, roughness, and density: Results of a randomized, placebo-controlled, blind study. Nutrients, 11(10), 2494.", note: "72 women, 12 weeks: improved skin hydration, elasticity, roughness and density versus placebo, persisting at follow-up.", link: doi("10.3390/nu11102494"), kind: "doi" },
    ],
  },
];
