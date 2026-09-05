# IQ Test Norming/Underwriting Process: Deep Dive

## 1. THE NORMING PIPELINE (How Rarity Is Established)

### The 7-Step Process (All Major Tests Follow This):

1. **Construct Specification** — Written blueprint defining what is measured, on whom, for what use
2. **Item Development** — Write 3-5x more items than final test; expert review for bias
3. **Pilot & Calibrate** — 200-500 participants; IRT or CTT item analysis
4. **Standardization** — 1,500-2,500 stratified participants matching census demographics
5. **Score Conversion** — Rank → percentile → z-score → IQ = 100 + 15z
6. **Reliability & Validity** — α ≥ .90 for composites; factor analysis; criterion validity
7. **Re-norm** — Every 7-15 years to correct for Flynn effect drift

### Specific Standardization Samples:
- WAIS-IV (2008): 2,200 U.S. adults, 13 age bands
- WAIS-V (2024): 2,200+ U.S. adults, updated to 2023-2024 Census
- Stanford-Binet 5 (2003): 4,800 individuals aged 2-85+
- Woodcock-Johnson IV (2014): ~7,000 participants
- Raven's SPM: 3,500+ UK participants + international norms

### The Score Conversion Formula (Universal):
```
For each age band in the standardization sample:
1. Rank all participants by raw score
2. Convert rank to percentile: percentile = rank / N × 100
3. Convert percentile to z-score: z = Φ⁻¹(percentile/100)
4. Linear transform: IQ = 100 + 15 × z
```

This FORCES a normal distribution. The rarity is then read directly from the normal distribution:
- IQ 115 = 84.1st percentile = 1 in 6.3
- IQ 130 = 97.7th percentile = 1 in 44
- IQ 145 = 99.87th percentile = 1 in 741
- IQ 160 = 99.997th percentile = 1 in 31,560
- IQ 175 = 99.99997th percentile = 1 in 3,488,557

---

## 2. THE FLYNN EFFECT AND RE-NORMING

### What It Is:
- IQ scores rise approximately 3 points per decade across all countries studied
- Discovered by James Flynn (1984) analyzing military conscript data
- Meta-analysis (Trahan et al., 2014): confirmed 0.3 points/year average gain
- Most recent WAIS data: 1.2 IQ points per decade for Full Scale IQ (lower than historical)

### Why It Matters for Rarity:
- A test normed in 2000 will OVERESTIMATE a person's rarity by 2020
- Someone scoring IQ 130 on 2000 norms might only be IQ 124 on 2020 norms
- This means: 1 in 44 (on old norms) might actually be 1 in 17 (on current norms)

### Re-norming Schedule:
- WAIS: Every 12-16 years (WAIS-III 1997 → WAIS-IV 2008 → WAIS-V 2024)
- Stanford-Binet: Every 15-20 years (SB4 1986 → SB5 2003)
- Raven's: Irregular; multiple national re-standardizations
- WJ: Every 12-15 years (WJ-III 2001 → WJ-IV 2014)

### Flynn Effect by Domain:
- Fluid reasoning (Gf): ~5 points/decade (largest gains)
- Crystallized intelligence (Gc): ~2 points/decade (smaller gains)
- Processing speed (Gs): ~3 points/decade
- Working memory (Gwm): ~2 points/decade

### Recent Evidence of Reversal:
- Some Scandinavian countries show DECLINING IQ since ~2000 ("reverse Flynn effect")
- Norway: -0.3 points/year since 1995 (Bratsberg & Rogeberg, 2018)
- This makes re-norming even more critical

---

## 3. PRECISION AT THE TAILS (The Rarity Problem)

### The Fundamental Problem:
To estimate the 99th percentile with precision, you need ~100 people above it.
- For 99th percentile: need 10,000 total sample (only ~100 above)
- For 99.9th percentile: need 100,000 total sample (only ~100 above)
- For 99.99th percentile: need 1,000,000 total sample (only ~100 above)

### What Tests Actually Have:
- WAIS-IV: 2,200 total → only ~22 people above 99th percentile
- SB5: 4,800 total → only ~48 people above 99th percentile
- This means: scores above IQ 145 are EXTRAPOLATED, not directly measured

### The Ceiling Effect:
- WAIS-IV caps at FSIQ ~160 (cannot measure above this)
- SB5 caps at FSIQ ~160
- WISC-V Extended Norms: pushed to 210 using targeted high-ability samples
- Scores above 160 are "extrapolated based on assumptions that the IQ distribution remains Gaussian far into the tails" — they are NOT empirically derived

### Fat Tails Controversy:
- Terman's 1921 data: IQ distribution deviates from normal above ~140
- More people at extreme high end than normal distribution predicts
- Possible explanations:
  - Assortative mating concentrates high-IQ genes
  - Measurement error bumps more people UP than DOWN (more people at 150 than 160)
  - Selection bias in high-range samples
- Counter-argument: IQ is DEFINED as normal; if observed distribution differs, it's the measurement that's wrong, not the model

### SLODR (Spearman's Law of Diminishing Returns):
- At higher ability levels, g accounts for LESS variance
- Profiles become more differentiated (spiky rather than flat)
- A single IQ number becomes LESS meaningful above ~130
- This supports AQAL's multi-dimensional approach: at high levels, you NEED multiple dimensions to differentiate people

---

## 4. HIGH-RANGE TESTING (Beyond Standard IQ Tests)

### Paul Cooijmans' Methodology:
- Created 51+ high-range tests since 1994
- Key findings:
  - g does NOT diminish much at the high range (contradicts SLODR somewhat)
  - Tests need to be heterogeneous (multiple item types) for validity
  - Verbal problems span the widest range of difficulty
  - Knowledge-requiring problems add validity
  - Test length matters enormously for reliability

### Problems with High-Range Testing:
- Self-selected samples (not representative)
- Unsupervised administration
- Answer leakage online
- No independent validation against proctored tests
- Scores above 160 are "exploratory" not "measurement"

### Cooijmans' Norming Method:
- Equates scores across multiple tests using overlapping test-takers
- Computes "real IQ" from multiple test scores
- Uses within-sex percentile reporting
- Acknowledges these are estimates, not precise measurements

---

## 5. MENSA'S UNDERWRITING PROCESS

### Admission Standard:
- 98th percentile on ANY approved intelligence test
- This equals: IQ 130 (SD=15), IQ 132 (SD=16/CFIT), or equivalent percentile

### Approved Tests (150+ worldwide):
- Clinical: WAIS, Stanford-Binet, Woodcock-Johnson, DAS
- Educational: SAT (pre-1994: 1250+), GRE (pre-1994: 1250+), ACT (29+)
- Military: AFQT (98th percentile), Army GCT (136+, pre-1980)
- Group: Cattell Culture Fair, Raven's APM, Otis-Lennon

### Mensa's Validation:
- Requires SUPERVISED, professionally administered tests only
- No online tests accepted
- Full test required (all subtests, not abbreviated)
- Documentation must include: name, DOB, test name, score, percentile, date, administrator credentials
- Moving to Computerized Adaptive Testing (CAT) for security

### Country Variations:
- Denmark: Figure/Abstract Reasoning Test (standard)
- UK: Cattell Culture Fair III B (standard Mensa test)
- USA: Mensa Admission Test (proprietary) or prior evidence
- Each country may use different tests but ALL require 98th percentile

---

## 6. MULTIVARIATE RARITY (The Mathematical Foundation for AQAL)

### For Independent Traits:
If traits are statistically independent, joint rarity = product of individual rarities:
```
P(A AND B AND C) = P(A) × P(B) × P(C)
```

Example: Being top 10% on 3 independent traits:
- P = 0.10 × 0.10 × 0.10 = 0.001 = 1 in 1,000

### For Correlated Traits:
When traits correlate (r > 0), use multivariate normal distribution:
```
P(X₁ > c₁, X₂ > c₂, ..., Xₖ > cₖ) = ∫∫...∫ f(x; μ, Σ) dx
```
Where Σ is the correlation matrix.

Higher correlations → LESS rare combinations (because scoring high on one predicts scoring high on another)

### The Gignac (2024) Finding Applied:
- 3 traits at 2 SD above mean with average r = 0.3:
  - Independent assumption: (1/44)³ = 1 in 85,184
  - With r = 0.3 correlation: approximately 1 in 12,000
  - Correlation REDUCES rarity by ~7x

### AQAL's Effective Dimensionality:
- 22 measured dimensions
- Average inter-dimension correlation: r ≈ 0.15 (estimated)
- Effective independent dimensions: ~4-6 (after accounting for correlations)
- This means: being 2 SD above mean on all 22 dimensions ≈ being 2 SD on 4-6 independent dimensions
- Rarity: (1/44)⁴ to (1/44)⁶ = 1 in 3.7 million to 1 in 7.3 billion
- More conservatively (1.5 SD on effective dimensions): 1 in 10,000 to 1 in 1,000,000

### The Key Insight for AQAL:
Traditional IQ tests have HIGH inter-subtest correlations (r = 0.4-0.7) because they all load on g. This means being smart on one subtest strongly predicts being smart on another — low effective dimensionality.

AQAL dimensions have LOW inter-dimension correlations (r = 0.1-0.3) because cognitive ≠ emotional ≠ kinesthetic ≠ social. This means our dimensions are MORE independent, giving us HIGHER effective dimensionality and MORE legitimate rarity claims.

---

## 7. COMPARISON: IQ UNDERWRITING vs. AQAL UNDERWRITING

| Aspect | Traditional IQ | AQAL Platform |
|--------|---------------|---------------|
| Dimensions measured | 4-7 (all cognitive) | 22 (cognitive + emotional + social + physical + spiritual) |
| Inter-dimension correlation | High (r = 0.4-0.7) | Low (r = 0.1-0.3) |
| Effective independent dimensions | 1-2 (mostly g) | 4-6 |
| Standardization sample | 2,200-4,800 (one-time) | Growing continuously (every user adds data) |
| Norming method | Rank → z → IQ (forced normal) | Multi-dimensional profile + stage + burden |
| Rarity ceiling | ~IQ 160 (empirical) / ~176 (extrapolated) | No theoretical ceiling (more dimensions = more differentiation) |
| Re-norming | Every 7-15 years | Continuous (adaptive) |
| Measurement method | Timed, standardized tasks | Natural speech analysis (ecological validity) |
| What it misses | Creativity, emotional, social, physical, moral | Less precise on narrow cognitive abilities |
| Tail precision | Poor above 99.9th percentile | Better (more dimensions = more data points per person) |
| Burden adjustment | None (SAT Adversity Score was controversial) | Built-in multiplier system |
| Stage assessment | None | Integrated (developmental altitude) |

### AQAL's Structural Advantages:
1. **More dimensions** = more ways to differentiate people at the top
2. **Lower correlations** = higher effective dimensionality = more legitimate rarity claims
3. **Continuous norming** = no Flynn effect drift (always comparing to current population)
4. **Ecological validity** = measuring how people actually think (speech) vs. artificial tasks
5. **Stage integration** = captures vertical development that IQ completely misses
6. **Burden multiplier** = accounts for suppression effects that inflate true rarity

### AQAL's Structural Weaknesses (to address):
1. **No standardization sample yet** — need to build normative database from users
2. **Subjective scoring** — AI analysis vs. objective right/wrong answers
3. **No test-retest reliability data** — need longitudinal studies
4. **No criterion validity** — need to show scores predict real-world outcomes
5. **Self-selected sample** — early users are not representative of general population
