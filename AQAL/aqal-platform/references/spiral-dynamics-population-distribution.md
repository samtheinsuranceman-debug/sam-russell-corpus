# Spiral Dynamics Population Distribution Research

Source: Ken Wilber's "A Theory of Everything" via Don Beck & Christopher Cowan's Spiral Dynamics model.
Cross-referenced from multiple sources including masculinity-movies.com, writerpainter.com (2002 figures).

## Population Percentages by Stage (Global Adult Population)

| Stage | Color | % Population | % Power | Key Trait |
|-------|-------|-------------|---------|-----------|
| Beige | Archaic-Instinctual | 0.1% | 0% | Survival |
| Purple | Magic-Animistic | 10% | 1% | Tribal/Magic |
| Red | Egocentric | 20% | 5% | Power/Respect |
| Blue | Mythic-Order | 40% | 30% | Purpose/Justice |
| Orange | Rational-Achievement | 30% | 50% | Skill/Merit |
| Green | Pluralistic-Sensitive | 10% | 15% | Equality/Deconstruct |
| Yellow | Integrative (2nd Tier) | 1% | 5% | Flexibility/Integration |
| Turquoise | Holistic (2nd Tier) | 0.1% | 1% | Global Consciousness |

## Cumulative Rarity (from top down)

| At or above... | Cumulative % | Rarity (1 in X) |
|----------------|-------------|-----------------|
| Turquoise | 0.1% | 1 in 1,000 |
| Yellow | 1.1% | 1 in 91 |
| Green | 11.1% | 1 in 9 |
| Orange | 41.1% | 1 in 2.4 |
| Blue | 81.1% | 1 in 1.2 |
| Red | 99.1% | basically everyone |
| Purple | 99.9% | basically everyone |

## Key Insight for Scoring Algorithm

- If someone demonstrates primarily ORANGE thinking (achievement, merit, rational) → they are in the top 41% but NOT rare. Rarity score should be ~2-3 (1 in 2-3 people think this way).
- If someone demonstrates primarily GREEN thinking (pluralistic, sensitive, deconstructive) → they are in the top 11%. Rarity score should be ~9 (1 in 9).
- ONLY Yellow/Turquoise responses (integrative, systemic, holistic) should produce high rarity scores.
- Within each stage, there are gradations — someone at the LEADING EDGE of Green transitioning to Yellow is rarer than someone solidly in mid-Green.

## Implications for Our 22-Axis Scoring

The composite rarity should NOT be a single LLM-generated number. It should be:

1. Each axis scored 0.0-1.0 based on developmental altitude demonstrated
2. Scores mapped to population percentile using the distribution above
3. Composite rarity = product of individual axis rarities (with correlation correction)
4. Bullshit detection: short answers, incoherent responses, low word count → scores capped at Orange level maximum

## Response Quality Indicators (Bullshit Detection)

- Response < 10 seconds: Cap at 0.4 (Orange max)
- Response < 5 words transcript: Cap at 0.3 (Blue max)
- Incoherent/joke responses: Cap at 0.2
- No evidence of self-reflection: Cap at 0.5 (Green max)
- Evidence of systems thinking + self-awareness + integration: Allow 0.7+ (Yellow)
- Evidence of universal perspective + paradox tolerance: Allow 0.9+ (Turquoise)
