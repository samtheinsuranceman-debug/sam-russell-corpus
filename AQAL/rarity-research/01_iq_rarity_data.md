# IQ Rarity Distribution Data

## Key Reference: Normal Distribution (Wechsler Scale, Mean=100, SD=15)

Formula: z = (IQ - 100) / 15, then use normal CDF for percentile
Rarity = 1 / (1 - CDF(z))

## IQ Rarity Table (Key Benchmarks)

| IQ | Percentile | Rarity (1 in X) | Classification |
|----|-----------|-----------------|----------------|
| 100 | 50.0% | 1 in 2 | Average |
| 110 | 74.8% | 1 in 4 | High Average |
| 115 | 84.1% | 1 in 6 | High Average |
| 120 | 90.9% | 1 in 11 | Superior |
| 125 | 95.2% | 1 in 21 | Superior |
| 130 | 97.7% | 1 in 44 | Very Superior |
| 135 | 99.0% | 1 in 102 | Very Superior |
| 140 | 99.6% | 1 in 261 | Very Superior |
| 145 | 99.87% | 1 in 741 | Very Superior |
| 150 | 99.96% | 1 in 2,330 | Very Superior |
| 155 | 99.99% | 1 in 8,137 | Very Superior |
| 160 | 99.997% | 1 in 31,560 | Very Superior |
| 165 | 99.9993% | 1 in 136,074 | Very Superior |
| 170 | 99.9998% | 1 in 652,598 | Very Superior |
| 175 | 99.99997% | 1 in 3,483,046 | Very Superior |
| 180 | 99.999995% | 1 in 20,696,863 | Very Superior |

## Key Insight: Each 15 points (1 SD) = roughly 5-10x rarer

- 100 → 115: 2 → 6 (3x)
- 115 → 130: 6 → 44 (7x)
- 130 → 145: 44 → 741 (17x)
- 145 → 160: 741 → 31,560 (43x)

The rarity accelerates exponentially at the tails.

## Source
- Wechsler Adult Intelligence Scale (WAIS-IV), Pearson Clinical 2008
- Normal distribution CDF with M=100, SD=15
- cogn-iq.org percentile table
- lifearchitect.ai IQ rarity chart (Rodrigo de la Jara archive)
