# The Career Ledger — what a specialty costs, pays, forgoes, and risks

Dictated 7 September 2026. Sorted by what the public record actually
publishes, the way the Zip Engine spec is sorted: Tier A is read by the
server from the publisher's own file; Tier B is published but reachable only
by hand (a login, a data-use agreement, a PDF the council harvests with
quotes); Tier C is published by no public body and is built from what
clients enter, labelled as theirs. "If you can't cite it, don't do it."

## Pass 1 — built (`/for`, `/for/:specialty`, `shared/careerEngine.ts`, `server/careerData.ts`, `server/careerRouter.ts`)

### Tier A: read by the server, stored with the file's own year and URL
| What | Source | How it lands |
|---|---|---|
| Wages for every physician, surgeon, dentist, veterinarian and lawyer occupation: employment, mean, 10/25/50/75/90th percentiles, national and by state | BLS Occupational Employment and Wage Statistics, one XLSX per year per level, May 2014 → May 2025 (`oesm{yy}nat.zip`, `oesm{yy}st.zip`) | `career_stats`; the 2010 SOC codes carry 2014–2018, the 2018 codes 2019 on; BLS's top code (a percentile at or above $239,200 in 2023) is kept as a flag, never guessed |
| Each state's fifteen best-paid occupations each year, so "where doctors rank" is the file's own ranking | same BLS files | `career_stats.rankInArea` |
| Undergraduate tuition, fees, room and board, national, 1963-64 → 2022-23, all/public/private four-year, current dollars | NCES Digest table 330.10 (XLSX) | `career_series`, area US |
| The same by state, 2021-22 and 2022-23 | NCES Digest table 330.20 (XLSX) | `career_series`, area = state |
| Residency and fellowship lengths | AMA (19 Nov 2020) for every residency; ACGME programme requirements for cardiology (36 months) and gastroenterology (36 months); CODA for oral surgery (minimum four years), periodontics (three years, 30 months), prosthodontics (33 months), pediatric dentistry (24 months), endodontics (24 months, Standard 4-1) | `CAREER_PATHS`, each length beside its page |
| Federal loan rates by academic year, 2006-07 → 2026-27: Direct Unsubsidized graduate and Direct PLUS; fees 1.057% and 4.228% | studentaid.gov (current year and fees); the Kantrowitz history table; the 2013 statute margins (+3.60 graduate, +4.60 PLUS over the May 10-year Treasury) | `FEDERAL_LOAN_RATES` |

### Arithmetic (no data typed in)
- `trainingCost`: the degree year by year at the federal graduate rate of each
  year, origination fee, interest capitalised yearly, balance at graduation.
- `opportunityCost`: what each residency and fellowship year forgoes against
  the alternative salary, compounded at the stated return; the loan growing
  meanwhile; years to recover at the attending premium.
- `repayment`: level payment and total interest over the term.
- `trueHourly`: net after taxes, loans, practice costs and vehicles, per hour
  worked and per hour committed (commute and work travel included).
- `percentileOf`: where an income sits in the BLS 10/25/50/75/90 distribution,
  interpolated; above a suppressed point the page says "at least".
- `peerCompare`: median and percentile against peers who entered the same
  line on the page, only once five or more have.

### The pages
- `/for`: the index by family (physicians, surgeons, psychiatry, dentists,
  dental specialists, veterinarians, attorneys); 38 specialties in pass 1.
- `/for/:specialty`: the training with its citations; the record (national
  and state, year by year, every state ranked, the state's fifteen best-paid
  occupations with the specialty highlighted); the cost of becoming one;
  "Beside your peers" (the peer form, the BLS placement, the hour's true
  worth); "The life the plan is built for" (the perfect life at 5, 10, 15,
  20, 30 and 40 years; who reached it; rarity, likelihood now and likelihood
  after, 1–10; dictation on every text answer); the sources and what is not
  on the page yet.
- Every page is in the SEO catalogue and the sitemap with its own title and
  description (`shared/seo.ts` generates them from the registry).
- Exit rating (`client/src/components/ExitRating.tsx`, all pages): when the
  pointer leaves the top of the window after ninety seconds on the site, one
  question, 1–10, with the "before" score; stored in `exit_ratings`; the
  owner's summary is `career.exitSummary`.

### Switches
`CAREER_DATA_DAYS=90` re-reads BLS and NCES quarterly (first pass four
minutes after boot); the owner's "Read the files now" is `career.refresh`.
No key is needed for any source in this pass.

## Tier B — published, reachable by hand or by harvest (next passes)
| What | Source | Route |
|---|---|---|
| Medical school tuition and fees by school, 1996-97 → present | AAMC Tuition and Student Fees workbooks (three Excel files, sign-in) | owner downloads, uploads; parsed per school and year |
| Resident and fellow stipends by year | AAMC Survey of Resident/Fellow Stipends and Benefits (Excel, public to constituents) | same |
| Dental school tuition by school | CODA Survey of Dental Education, Report 2 (public XLSX link) | server read, next pass |
| Law school tuition by school, 2011 → present | ABA 509 Required Disclosures (national compilation spreadsheets) | server read, next pass |
| Malpractice premium changes 2003–2025 and premium levels for select areas by specialty | AMA Policy Research Perspectives (PDFs built on the Medical Liability Monitor rate survey, which itself is paid) | council harvest with verbatim quotes, owner approval, as the erosion engine does |
| Share of physicians ever sued, by specialty (28.7% in 2024) | AMA claim-frequency PRP | same |
| Every paid malpractice claim since 1 Sept 1990: state, practitioner field, payment range, year | NPDB Public Use Data File (CSV after a data-use agreement; no direct URL) | owner downloads, uploads; aggregated by state and field |
| Wages 1999–2013 | BLS OES XLS (binary) | needs an XLS reader; pass 2 |

## Tier C — no public body publishes it; built from what clients enter
- Practice sale prices, revenue and EBITDA multiples, earn-outs, holdbacks,
  consulting fees and required stay periods, by specialty and zip. Broker
  guides publish "directional ranges" and opinions, not transactions; there
  is no public register of practice sales. The ledger records each client's
  own closed deal (price, trailing revenue, EBITDA, structure, stay) and the
  aggregate becomes the record, labelled by count.
- Lawsuit counts from county courts: not aggregated anywhere public; NPDB
  (Tier B) is the national record of paid claims and adverse actions.
- Vehicles, travel time, life satisfaction, family health, hours: the peer
  form; compared only against peers who entered them.

## Sources checked 7 September 2026
- AMA residency lengths: https://www.ama-assn.org/medical-students/preparing-residency/medical-specialty-choice-should-residency-training-length
- ACGME cardiovascular disease: https://www.acgme.org/globalassets/pfassets/programrequirements/2026-prs/141_cardiovasculardisease_2026.pdf
- ACGME gastroenterology: https://www.acgme.org/globalassets/pfassets/programrequirements/2026-prs/144_gastroenterology_2026.pdf
- CODA programme lengths: https://coda.ada.org/find-a-program ; endodontics standard: https://coda.ada.org/-/media/project/ada-organization/ada/coda/files/endo.pdf
- BLS OEWS tables and May 2025 structure: https://www.bls.gov/oes/tables.htm , https://www.bls.gov/oes/current/oes_stru.htm
- NCES 330.10 / 330.20: https://nces.ed.gov/programs/digest/d23/tables/dt23_330.10.asp , https://nces.ed.gov/programs/digest/d23/tables/dt23_330.20.asp
- Federal loan rates: https://studentaid.gov/understand-aid/types/loans/interest-rates , https://www.savingforcollege.com/article/historical-federal-student-interest-rates-and-fees
- AAMC tuition and stipends: https://www.aamc.org/data-reports/reporting-tools/report/tuition-and-student-fees-reports , https://www.aamc.org/data-reports/students-residents/report/aamc-survey-resident/fellow-stipends-and-benefits
- AMA liability: https://www.ama-assn.org/about/ama-research/policy-research-perspectives-medical-liability-premiums , https://www.ama-assn.org/about/ama-research/medical-liability-market-research
- NPDB PUF: https://www.npdb.hrsa.gov/resources/publicData.jsp
