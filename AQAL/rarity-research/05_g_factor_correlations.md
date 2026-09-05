# The g-Factor, Positive Manifold, and Inter-Intelligence Correlations

## The Positive Manifold (Key Finding)
All cognitive tests positively correlate with each other. This is the most replicated finding in psychometrics.
- Average inter-subtest correlation on WAIS: ~0.3 to 0.6
- g-factor accounts for 40-50% of variance across all cognitive tests
- This means: if you're good at one thing, you're SOMEWHAT likely to be good at others

## WAIS-IV Subtest Intercorrelations
Typical correlation range between WAIS subtests: 0.3 - 0.7
- Highest correlations: between similar subtests (e.g., Vocabulary ↔ Information: ~0.7)
- Lowest correlations: between dissimilar subtests (e.g., Processing Speed ↔ Vocabulary: ~0.3)
- Average across all pairs: ~0.45

## What This Means for Multi-Dimensional Rarity

### If dimensions were INDEPENDENT (correlation = 0):
- Top 10% on 22 dimensions = (0.10)^22 = 1 in 10^22 (absurdly rare, impossible)
- This is clearly wrong — nobody would score top 10% on ALL 22 dimensions

### If dimensions were PERFECTLY CORRELATED (correlation = 1):
- Top 10% on 22 dimensions = same as top 10% on 1 dimension = 1 in 10
- This is also wrong — it collapses everything to a single score

### REALITY: Moderate correlations (r ≈ 0.3-0.5)
The effective number of independent dimensions is LESS than 22 but MORE than 1.

**Effective dimensionality formula:**
- With average r = 0.3 across 22 dimensions:
  - Effective independent dimensions ≈ 22 / (1 + 21 × 0.3) ≈ 22 / 7.3 ≈ 3
- With average r = 0.5 across 22 dimensions:
  - Effective independent dimensions ≈ 22 / (1 + 21 × 0.5) ≈ 22 / 11.5 ≈ 1.9

BUT: Our 22 dimensions span DIFFERENT DOMAINS (cognitive, emotional, somatic, social, spiritual)
- Cross-domain correlations are MUCH LOWER than within-domain
- Cognitive ↔ Cognitive: r ≈ 0.5-0.7 (high, due to g-factor)
- Cognitive ↔ Emotional: r ≈ 0.1-0.3 (low)
- Cognitive ↔ Somatic/Kinesthetic: r ≈ 0.0-0.2 (very low)
- Emotional ↔ Interpersonal: r ≈ 0.3-0.5 (moderate)
- Spiritual ↔ Cognitive: r ≈ 0.0-0.2 (very low)

## KEY INSIGHT: Our Model Has LOWER Average Correlations Than IQ

Because we span 4 quadrants (UL, UR, LL, LR) and multiple domains:
- Estimated average cross-dimension correlation: r ≈ 0.15-0.25
- This gives effective independent dimensions ≈ 22 / (1 + 21 × 0.2) ≈ 22 / 5.2 ≈ 4.2

So our 22-dimension model behaves like ~4 truly independent dimensions.

### Rarity calculation with 4 effective independent dimensions:
- Top 10% on all 4: (0.10)^4 = 1 in 10,000
- Top 5% on all 4: (0.05)^4 = 1 in 160,000
- Top 2% on all 4: (0.02)^4 = 1 in 625,000
- Top 1% on all 4: (0.01)^4 = 1 in 100,000,000

## CRITICAL DISTINCTION: Profile Rarity vs. Level Rarity

**Level Rarity** (IQ model): "How high is your OVERALL score?"
- Simple: one number, one distribution
- Limitation: loses all profile information

**Profile Rarity** (Our model): "How rare is your SPECIFIC COMBINATION of highs and lows?"
- Complex: considers the SHAPE of the profile, not just the height
- Advantage: two people with the same "average" can have wildly different rarity
- Example: Someone who is top 1% in kinesthetic + top 1% in spiritual + bottom 30% in logical
  is MUCH rarer than someone who is top 5% across all dimensions evenly

## The Mahalanobis Distance Approach

For our model, the best statistical framework is:
1. Establish population means and covariance matrix across 22 dimensions
2. For each person, calculate their Mahalanobis distance from the population centroid
3. Convert Mahalanobis distance to a chi-squared percentile (with df = effective dimensions)
4. This gives a principled rarity score that accounts for correlations

Formula: D² = (x - μ)ᵀ Σ⁻¹ (x - μ)
Where:
- x = person's 22-dimensional score vector
- μ = population mean vector
- Σ = population covariance matrix
- D² follows chi-squared distribution with k degrees of freedom

This is the GOLD STANDARD for multi-dimensional rarity assessment.
