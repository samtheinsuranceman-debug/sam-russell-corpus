/**
 * Crypto Currency Corner — Full Cycle Engine
 * 
 * Covers: Bitcoin halving cycle history, cycle simulator (next 10 cycles),
 * IUL-funded crypto accumulation with DCA, real estate STR integration,
 * precious metals allocation, and 30-year wealth synthesis.
 */

// ─── Historical Cycle Data ──────────────────────────────────────────────────

export interface BitcoinCycle {
  cycle: number;
  halvingDate: string;
  halvingPrice: number;
  blockReward: number;
  supplyMined: number; // percentage
  bullATH: number;
  athDate: string;
  athMarketCap: number; // billions
  bearATL: number;
  atlDate: string;
  pctDropATHtoATL: number;
  pctGainATLtoNextATH: number | null;
  bullDurationMonths: number;
  bearDurationMonths: number;
}

export const BITCOIN_CYCLES: BitcoinCycle[] = [
  {
    cycle: 1,
    halvingDate: "2012-11-28",
    halvingPrice: 12.35,
    blockReward: 25,
    supplyMined: 75,
    bullATH: 1177,
    athDate: "2013-11-29",
    athMarketCap: 14,
    bearATL: 152,
    atlDate: "2015-01-14",
    pctDropATHtoATL: -87.1,
    pctGainATLtoNextATH: 12912,
    bullDurationMonths: 12,
    bearDurationMonths: 14,
  },
  {
    cycle: 2,
    halvingDate: "2016-07-09",
    halvingPrice: 650,
    blockReward: 12.5,
    supplyMined: 87.5,
    bullATH: 19783,
    athDate: "2017-12-17",
    athMarketCap: 330,
    bearATL: 3122,
    atlDate: "2018-12-15",
    pctDropATHtoATL: -84.2,
    pctGainATLtoNextATH: 2104,
    bullDurationMonths: 17,
    bearDurationMonths: 12,
  },
  {
    cycle: 3,
    halvingDate: "2020-05-11",
    halvingPrice: 8727,
    blockReward: 6.25,
    supplyMined: 93.75,
    bullATH: 68789,
    athDate: "2021-11-10",
    athMarketCap: 1300,
    bearATL: 15460,
    atlDate: "2022-11-21",
    pctDropATHtoATL: -77.5,
    pctGainATLtoNextATH: 716,
    bullDurationMonths: 18,
    bearDurationMonths: 12,
  },
  {
    cycle: 4,
    halvingDate: "2024-04-20",
    halvingPrice: 63800,
    blockReward: 3.125,
    supplyMined: 96.875,
    bullATH: 126200,
    athDate: "2025-10-06",
    athMarketCap: 2500,
    bearATL: 60000,
    atlDate: "2026-06-01",
    pctDropATHtoATL: -52.5,
    pctGainATLtoNextATH: null,
    bullDurationMonths: 18,
    bearDurationMonths: 12,
  },
];

// Where the cycle table comes from. Halving dates, heights and block rewards
// are protocol facts; prices are market prints, and different exchanges and
// indices print different numbers for the same day, so each is tied to the
// publication that carries it. Where no publication matches the figure, the
// note says so rather than leaving it looking sourced.

/** halvingDate and blockReward for all four cycles, and the 2028 next halving. */
const HALVING_SCHEDULE_SOURCE = {
  label:
    "CoinWarz, 'Bitcoin Halving Countdown': halving dates history by block height (210,000 on 2012-11-28, 25 BTC; 420,000 on 2016-07-09, 12.5 BTC; " +
    "630,000 on 2020-05-11, 6.25 BTC; 840,000 on 2024-04-20, 3.125 BTC) and the next halving at block 1,050,000 projected for April 2028",
  url: "https://www.coinwarz.com/bitcoin-halving",
  asOf: "read 2026-09-23",
};

/** halvingPrice for cycles 1 to 3, and the supplyMined column. */
const COINGECKO_HALVING_HISTORY_SOURCE = {
  label:
    "CoinGecko Research, 'Bitcoin Halving Price History': price at the first three halvings (about $12, about $650, about $8,727) " +
    "and the 'Total BTC Mined (%)' column 75, 87.5, 93.75, 96.875",
  url: "https://www.coingecko.com/research/publications/bitcoin-halving-price-history",
  asOf: "published 2024-04-02; read 2026-09-23",
  note:
    "supplyMined follows CoinGecko's column, which is the share mined by the end of each epoch. At the halving block itself the protocol " +
    "share is 50%, 75%, 87.5% and 93.75% (CoinGecko's own halving page: over 10 million of 21 million mined at the first halving).",
};

/** halvingPrice for cycle 4 and the halving-day table. */
const BITCOIN_COM_PRICE_HISTORY_SOURCE = {
  label: "Bitcoin.com, 'Bitcoin Price History: Charts, Trends, and Analysis': price on halving day about $63,800 (April 2024) and the 2021 peak of $68,789",
  url: "https://www.bitcoin.com/get-started/bitcoin/basics/bitcoin-price-history/",
  asOf: "published 2026-08-12; read 2026-09-23",
};

/** bullATH 19783 on 2017-12-17 and the 2015 and 2018 lows. */
const DRAWDOWN_HISTORY_SOURCE = {
  label:
    "Paybis, 'Bitcoin Crash History': 2013 peak $1,163 (Nov 30, 2013) to $152 (Jan 2015); $19,783 (CoinDesk index, Dec 17, 2017) to $3,122 (Dec 2018); " +
    "2011 fall from $31.50 to $2.01 (93.6%)",
  url: "https://paybis.com/blog/bitcoin-crash-history/",
  asOf: "published 2026-02-10; read 2026-09-23",
  note:
    "bullATH 1177 on 2013-11-29 matches no publication found: Bitstamp printed $1,163 on Nov 30, CoinGecko $1,127 on Nov 30 and CoinMarketCap $1,156.10 in December 2013. " +
    "historicalGains 53650 (2011 low to 2013 peak) disagrees with about 58,000% computed from the $1.99 to $2.01 low and a $1,163 to $1,177 peak.",
};

/** bearATL 15460 on 2022-11-21. */
const CNBC_2022_LOW_SOURCE = {
  label: "CNBC, 'Bitcoin hits 2-year low as FTX collapse contagion fears linger': low of $15,480 per Coin Metrics, Nov 22, 2022 (U.S. time)",
  url: "https://www.cnbc.com/2022/11/22/bitcoin-btc-hits-2-year-low-as-ftx-collapse-contagion-fears-linger.html",
  asOf: "published 2022-11-22; read 2026-09-23",
  note: "The code's 15,460 is $20 under this print; other trackers give $15,476 to $15,479 on Nov 21 (UTC).",
};

/** bullATH 126200 on 2025-10-06 (the $126,198 print, rounded) and the 2,500 billion market cap at that peak. */
const ATH_2025_SOURCE = {
  label: "Investor's Business Daily, 'Bitcoin Hits Record Above $126,000': record high of $126,198 on Oct 6, 2025, according to CoinMarketCap data",
  url: "https://www.investors.com/news/bitcoin-hits-new-record-above-125000-crypto-prices-figure-coverage-buy-rating-figr-stock/",
  asOf: "published 2025-10-06; read 2026-09-23",
};

/** bearATL 60000 on 2026-06-01. */
const LOW_2026_SOURCE = {
  label:
    "CNBC, 'Bitcoin cracks $60,000, sinking to lowest level since October 2024' (low $59,099.25 on 2026-06-05) and " +
    "'Bitcoin falls back under $60,000' (low $59,023.98 on 2026-06-24); BBC reported a fall to $60,000 on 2026-02-05",
  url: "https://www.cnbc.com/2026/06/24/bitcoin-falls-back-under-60000-hitting-its-lowest-level-since-october-2024.html",
  asOf: "read 2026-09-23",
  note:
    "The code's 60,000 on 2026-06-01 matches no print: the 2026 lows found are about $60,000 (Feb 5), $59,099 (Jun 5) and $59,024 (Jun 24), " +
    "and IG cites Bloomberg for about $58,076 in late June. The cycle-4 bear market may not be over, so bearATL and bearDurationMonths 12 " +
    "(October 2025 to June 2026 is about 8 months) are provisional.",
};

/** athMarketCap, pctDrop, pctGain and duration columns. */
const CYCLE_ARITHMETIC_NOTE = {
  label:
    "Derived by the firm from the prices and dates above: athMarketCap is peak price times coins then outstanding, pctDropATHtoATL and " +
    "pctGainATLtoNextATH are the percentage moves between the listed prints, and the durations are months between the listed dates",
};

// ─── Cycle Simulator ────────────────────────────────────────────────────────

/** The simulator's shaping constants are the firm's model, not history. */
const CYCLE_SIMULATOR_ASSUMPTIONS = [
  { label: "Assumption: drawdown decay = 0.88 per cycle and gain decay = 0.38 per cycle, chosen by the firm to extend the shrinking drawdowns and gains in the cycle table; no external source" },
  { label: "Assumption: floors of a 50% gain and a 30% drawdown per future cycle, chosen by the firm so the projection never implies a cycle with no bull or bear phase; no external source" },
  { label: "Assumption: halving-day price = 1.3 times the prior low, chosen by the firm from the pattern in the cycle table; no external source" },
  { label: "Assumption: supply for market cap = 20.5 million BTC, chosen by the firm as a round figure for coins outstanding in the projected cycles (21 million is the protocol cap); no external source" },
  { label: "Assumption: fallback prices of $60,000 (low), $63,800 (halving) and $100,000 (no cycle matched), chosen by the firm to keep the price path defined outside the table; no external source" },
] as const;

export interface SimulatedCycle {
  cycle: number;
  halvingYear: number;
  halvingPrice: number;
  bullATH: number;
  athYear: number;
  bearATL: number;
  atlYear: number;
  pctDropATHtoATL: number;
  pctGainATLtoNextATH: number;
  marketCapBillions: number;
  blockReward: number;
}

export function simulateNextCycles(numCycles: number = 10): SimulatedCycle[] {
  // Diminishing returns model based on historical patterns
  const historicalDrops = [93.7, 87.1, 84.2, 77.5, 52.5];
  const historicalGains = [53650, 12912, 2104, 716];
  
  // Calculate decay rates
  const dropDecayRate = 0.88; // drops shrink ~12% each cycle
  const gainDecayRate = 0.38; // gains shrink ~62% each cycle (diminishing returns)
  
  const lastCycle = BITCOIN_CYCLES[BITCOIN_CYCLES.length - 1];
  let prevATL = lastCycle.bearATL;
  let halvingYear = 2028; // next halving
  let blockReward = lastCycle.blockReward / 2;
  let lastDrop = historicalDrops[historicalDrops.length - 1];
  let lastGain = historicalGains[historicalGains.length - 1];
  
  const simulated: SimulatedCycle[] = [];
  
  for (let i = 0; i < numCycles; i++) {
    const cycleNum = 5 + i;
    
    // Project gain from previous ATL to next ATH (diminishing)
    const projectedGain = Math.max(lastGain * gainDecayRate, 50); // floor at 50%
    const bullATH = Math.round(prevATL * (1 + projectedGain / 100));
    
    // Project drop from ATH to next ATL (diminishing)
    const projectedDrop = Math.max(lastDrop * dropDecayRate, 30); // floor at 30%
    const bearATL = Math.round(bullATH * (1 - projectedDrop / 100));
    
    // Market cap estimate (BTC supply ~21M, ~98%+ mined)
    const supplyFactor = 20_500_000;
    const marketCap = Math.round(bullATH * supplyFactor / 1_000_000_000);
    
    simulated.push({
      cycle: cycleNum,
      halvingYear,
      halvingPrice: Math.round(prevATL * 1.3), // typically 30% above ATL at halving
      bullATH,
      athYear: halvingYear + 1,
      bearATL,
      atlYear: halvingYear + 2,
      pctDropATHtoATL: -projectedDrop,
      pctGainATLtoNextATH: projectedGain,
      marketCapBillions: marketCap,
      blockReward,
    });
    
    prevATL = bearATL;
    halvingYear += 4;
    blockReward /= 2;
    lastDrop *= dropDecayRate;
    lastGain *= gainDecayRate;
  }
  
  return simulated;
}

// ─── IUL-Funded Crypto Accumulation Engine ──────────────────────────────────

export interface CryptoAccumulationInput {
  // IUL Policy
  iulCashValue: number;
  iulGrowthRate: number; // e.g. 0.07
  iulLoanRate: number; // e.g. 0.05
  iulMaxLoanToValue: number; // e.g. 0.90
  annualPremium: number;
  premiumYearsRemaining: number;
  
  // Crypto Strategy
  loanPctForCrypto: number; // 0-100, what % of available loan to use for crypto
  dcaBearMonths: number; // months to DCA buy during bear (default 24)
  dcaBullMonths: number; // months to DCA sell during bull (default 12)
  
  // Profit Allocation (must sum to 100)
  pctToSilver: number;
  pctToGold: number;
  pctToMortgagePaydown: number;
  // remainder goes to IUL loan repayment first
  
  // Precious Metals Prices
  goldPricePerOz: number;
  silverPricePerOz: number;
  
  // Real Estate
  strPurchasePrice: number; // default $500,000
  strDownPaymentPct: number; // default 0.30
  strGrossIncomePct: number; // default 0.20
  strAppreciationRate: number; // default 0.05
  strFirstYearDepreciation: number; // default 0.40
  strPurchaseEveryYears: number; // default 7
  
  // Simulation
  simulationYears: number; // default 30
  startYear: number; // default 2026
}

export interface YearlySnapshot {
  year: number;
  cyclePhase: "bear" | "bull" | "accumulation" | "distribution";
  
  // IUL
  iulCashValue: number;
  iulLoanBalance: number;
  iulNetValue: number;
  iulPremiumPaid: number;
  
  // Crypto
  btcPrice: number;
  btcHeld: number;
  btcValue: number;
  cryptoBuyAmount: number;
  cryptoSellAmount: number;
  cryptoProfit: number;
  
  // Precious Metals
  goldOz: number;
  goldValue: number;
  silverOz: number;
  silverValue: number;
  
  // Real Estate
  properties: PropertySnapshot[];
  totalPropertyValue: number;
  totalPropertyEquity: number;
  totalRentalIncome: number;
  
  // Taxes
  capitalGains: number;
  depreciationOffset: number;
  netTaxableGain: number;
  
  // Totals
  totalNetWorth: number;
  totalDebt: number;
  annualCashFlow: number;
}

export interface PropertySnapshot {
  id: number;
  purchaseYear: number;
  purchasePrice: number;
  currentValue: number;
  loanBalance: number;
  equity: number;
  annualRentalIncome: number;
  monthlyPayment: number;
  yearOfOwnership: number;
}

export interface RealEstateSpreadsheet {
  propertyId: number;
  purchaseYear: number;
  purchasePrice: number;
  downPayment: number;
  loanAmount: number;
  fundingSources: {
    cryptoProfits: number;
    iulLoan: number;
    helocLoan: number;
  };
  years: {
    year: number;
    yearOfOwnership: number;
    propertyValue: number;
    loanBalance: number;
    equity: number;
    rentalIncome: number;
    interestPayment: number;
    depreciation: number;
  }[];
}

export interface AccumulationResult {
  yearlySnapshots: YearlySnapshot[];
  realEstateSpreadsheets: RealEstateSpreadsheet[];
  summary: {
    totalCryptoProfit: number;
    totalRentalIncome: number;
    totalPropertyValue: number;
    totalPropertyEquity: number;
    totalGoldValue: number;
    totalSilverValue: number;
    finalIULValue: number;
    finalNetWorth: number;
    propertiesOwned: number;
    totalDepreciationUsed: number;
    totalCapitalGains: number;
    netTaxSaved: number;
  };
  thirtyYearSynthesis: {
    year: number;
    totalPropertyValue: number;
    totalEquity: number;
    totalRentalIncome: number;
    totalLoanBalance: number;
    propertyCount: number;
  }[];
}

// Where the accumulation engine's typed-in rates come from.

/** loanRate 0.065 and the 0.065 interest charge on each property loan. */
const MORTGAGE_RATE_SOURCE = {
  label: "Freddie Mac, Primary Mortgage Market Survey, 30-Year Fixed Rate Mortgage Average (MORTGAGE30US), via FRED: 6.66% for the week of 2026-08-27",
  url: "https://fred.stlouisfed.org/series/MORTGAGE30US",
  asOf: "read 2026-09-23",
  note:
    "The engine's 6.5% is a round figure 0.16 points under the latest survey reading, and the survey prices owner-occupied loans; " +
    "an investment or short-term rental loan is usually priced higher.",
};

/** 0.0364 straight-line depreciation after year one. */
const DEPRECIATION_SOURCE = {
  label:
    "IRS Publication 946, 'How To Depreciate Property': residential rental property is recovered straight line over 27.5 years " +
    "(1/27.5 = 3.64% a year); a dwelling unit does not include a unit in an establishment where more than half the units are used on a transient basis",
  url: "https://www.irs.gov/publications/p946",
  asOf: "2025 edition; read 2026-09-23",
  note: "A short-term rental used on a transient basis may fall in the 39-year nonresidential class instead (about 2.56% a year); the client's tax adviser decides.",
};

/** netTaxSaved at the 37% bracket. */
const TOP_BRACKET_SOURCE = {
  label: "IRS Rev. Proc. 2025-32, section 4.01, 2026 tax rate tables: top marginal rate 37%",
  url: "https://www.irs.gov/pub/irs-drop/rp-25-32.pdf",
  asOf: "tax year 2026; read 2026-09-23",
};

/** Gold's 5% growth is checked against the long-run gold column. */
const GOLD_RETURN_SOURCE = {
  label:
    "Aswath Damodaran, NYU Stern, 'Historical Returns on Stocks, Bonds and Bills: 1928-2025', Gold column: $100 in 1928 grew to $21,025 by 2025, " +
    "a geometric average of 5.6% a year, above the engine's 5%",
  url: "https://pages.stern.nyu.edu/~adamodar/New_Home_Page/datafile/histretSP.html",
  asOf: "page updated January 5, 2026; read 2026-09-23",
};

/** The accumulation engine's strategy constants: the firm's choices, said in words. */
const ACCUMULATION_ASSUMPTIONS = [
  { label: "Assumption: 30% of rental income goes to bitcoin in bear phases and 60% of holdings are sold in bull phases, chosen by the firm as the strategy being illustrated; no external source" },
  { label: "Assumption: maximum IUL loan = 90% of cash value, chosen by the firm as a typical carrier loan limit; the policy contract governs; no external source" },
  { label: "Assumption: up to 50% of a year's crypto proceeds fund a property down payment, chosen by the firm as the strategy being illustrated; no external source" },
  { label: "Assumption: rent grows 3% a year and silver 3% a year, chosen by the firm as rates near long-run inflation; no external source" },
  { label: "Assumption: 5% cost on total debt in the cash-flow line, chosen by the firm as a blended borrowing cost; no external source" },
  { label: "Assumption: each property is projected for 30 years, chosen by the firm to match the 30-year synthesis; no external source" },
] as const;

export function runCryptoAccumulation(input: CryptoAccumulationInput): AccumulationResult {
  const {
    iulCashValue: startCV, iulGrowthRate, iulLoanRate, iulMaxLoanToValue,
    annualPremium, premiumYearsRemaining,
    loanPctForCrypto, dcaBearMonths, dcaBullMonths,
    pctToSilver, pctToGold, pctToMortgagePaydown,
    goldPricePerOz, silverPricePerOz,
    strPurchasePrice, strDownPaymentPct, strGrossIncomePct,
    strAppreciationRate, strFirstYearDepreciation, strPurchaseEveryYears,
    simulationYears, startYear,
  } = input;
  
  // Generate cycle price projections
  const allCycles = [...BITCOIN_CYCLES, ...simulateNextCycles(10)];
  
  // Build year-by-year BTC price model
  function getBtcPriceAndPhase(year: number): { price: number; phase: "bear" | "bull" | "accumulation" | "distribution" } {
    // Find the relevant cycle
    for (const c of allCycles) {
      const halvingYr = "halvingYear" in c ? (c as SimulatedCycle).halvingYear : parseInt(c.halvingDate.split("-")[0]);
      const athYr = "athYear" in c ? (c as SimulatedCycle).athYear : parseInt(c.athDate.split("-")[0]);
      const atlYr = "atlYear" in c ? (c as SimulatedCycle).atlYear : halvingYr + 2;
      
      if (year >= halvingYr - 1 && year <= halvingYr + 3) {
        if (year <= halvingYr) {
          // Late bear / early accumulation
          const atl = "bearATL" in c ? c.bearATL : 60000;
          const halvPrice = "halvingPrice" in c ? c.halvingPrice : 63800;
          const t = (year - (halvingYr - 1));
          return { price: Math.round(atl + (halvPrice - atl) * t), phase: "accumulation" };
        } else if (year <= athYr) {
          // Bull run
          const halvPrice = "halvingPrice" in c ? c.halvingPrice : 63800;
          const ath = c.bullATH;
          const t = (year - halvingYr) / (athYr - halvingYr);
          return { price: Math.round(halvPrice + (ath - halvPrice) * t * t), phase: "bull" };
        } else {
          // Bear market
          const ath = c.bullATH;
          const atl = c.bearATL;
          const t = (year - athYr) / Math.max(1, atlYr - athYr);
          return { price: Math.round(ath - (ath - atl) * Math.min(t, 1)), phase: "bear" };
        }
      }
    }
    // Fallback
    return { price: 100000, phase: "accumulation" };
  }
  
  // State tracking
  let iulCV = startCV;
  let iulLoanBalance = 0;
  let btcHeld = 0;
  let goldOz = 0;
  let silverOz = 0;
  let premiumYearsLeft = premiumYearsRemaining;
  
  const properties: { id: number; purchaseYear: number; purchasePrice: number; loanBalance: number; loanRate: number }[] = [];
  let nextPropertyYear = startYear + strPurchaseEveryYears;
  let propertyIdCounter = 1;
  
  const yearlySnapshots: YearlySnapshot[] = [];
  const realEstateSpreadsheets: RealEstateSpreadsheet[] = [];
  
  let totalCryptoProfit = 0;
  let totalRentalIncome = 0;
  let totalDepreciationUsed = 0;
  let totalCapitalGains = 0;
  let cumulativeCryptoCost = 0;
  
  for (let yr = 0; yr < simulationYears; yr++) {
    const year = startYear + yr;
    const { price: btcPrice, phase } = getBtcPriceAndPhase(year);
    
    // ── IUL Growth ──
    if (premiumYearsLeft > 0) {
      iulCV += annualPremium;
      premiumYearsLeft--;
    }
    iulCV *= (1 + iulGrowthRate);
    
    // Loan interest accrues
    iulLoanBalance *= (1 + iulLoanRate);
    
    // ── Available loan capacity ──
    const maxLoan = iulCV * iulMaxLoanToValue;
    const availableLoan = Math.max(0, maxLoan - iulLoanBalance);
    const cryptoLoanAmount = availableLoan * (loanPctForCrypto / 100);
    
    let cryptoBuy = 0;
    let cryptoSell = 0;
    let yearProfit = 0;
    let yearCapGains = 0;
    
    // ── Bear Phase: DCA Buy ──
    if (phase === "bear" || phase === "accumulation") {
      if (cryptoLoanAmount > 0) {
        cryptoBuy = cryptoLoanAmount;
        const btcBought = cryptoBuy / btcPrice;
        btcHeld += btcBought;
        iulLoanBalance += cryptoBuy;
        cumulativeCryptoCost += cryptoBuy;
      }
      
      // Also use rental income to DCA buy
      const rentalForCrypto = properties.reduce((sum, p) => {
        return sum + p.purchasePrice * strGrossIncomePct * 0.3; // 30% of rental income to crypto
      }, 0);
      if (rentalForCrypto > 0) {
        const btcFromRental = rentalForCrypto / btcPrice;
        btcHeld += btcFromRental;
        cumulativeCryptoCost += rentalForCrypto;
        cryptoBuy += rentalForCrypto;
      }
    }
    
    // ── Bull Phase: DCA Sell ──
    if (phase === "bull" || phase === "distribution") {
      if (btcHeld > 0) {
        const sellPct = 0.6; // sell 60% during bull
        const btcToSell = btcHeld * sellPct;
        cryptoSell = btcToSell * btcPrice;
        const costBasis = cumulativeCryptoCost * (btcToSell / Math.max(btcHeld, 0.001));
        yearCapGains = Math.max(0, cryptoSell - costBasis);
        yearProfit = cryptoSell;
        btcHeld -= btcToSell;
        cumulativeCryptoCost -= costBasis;
        totalCryptoProfit += yearProfit;
        totalCapitalGains += yearCapGains;
        
        // ── Profit Allocation ──
        let remainingProfit = yearProfit;
        
        // 1. Repay IUL loans first until max funded
        const loanRepayment = Math.min(remainingProfit, iulLoanBalance);
        iulLoanBalance -= loanRepayment;
        remainingProfit -= loanRepayment;
        
        // 2. Allocate remaining profits
        if (remainingProfit > 0) {
          const silverAlloc = remainingProfit * (pctToSilver / 100);
          const goldAlloc = remainingProfit * (pctToGold / 100);
          const mortgageAlloc = remainingProfit * (pctToMortgagePaydown / 100);
          
          silverOz += silverAlloc / silverPricePerOz;
          goldOz += goldAlloc / goldPricePerOz;
          
          // Pay down mortgages
          if (mortgageAlloc > 0 && properties.length > 0) {
            const perProperty = mortgageAlloc / properties.length;
            for (const p of properties) {
              p.loanBalance = Math.max(0, p.loanBalance - perProperty);
            }
          }
        }
      }
    }
    
    // ── Real Estate Purchase (every N years) ──
    let yearDepreciation = 0;
    if (year >= nextPropertyYear) {
      const downPayment = strPurchasePrice * strDownPaymentPct;
      let fundFromProfit = Math.min(yearProfit * 0.5, downPayment);
      let fundFromIUL = 0;
      let fundFromHELOC = 0;
      
      const remaining1 = downPayment - fundFromProfit;
      if (remaining1 > 0) {
        // Take 90% IUL loan
        const iulLoanAvail = Math.max(0, iulCV * 0.90 - iulLoanBalance);
        fundFromIUL = Math.min(remaining1, iulLoanAvail);
        iulLoanBalance += fundFromIUL;
        
        const remaining2 = remaining1 - fundFromIUL;
        if (remaining2 > 0) {
          // HELOC from existing properties
          fundFromHELOC = remaining2;
        }
      }
      
      const loanAmount = strPurchasePrice - downPayment;
      properties.push({
        id: propertyIdCounter,
        purchaseYear: year,
        purchasePrice: strPurchasePrice,
        loanBalance: loanAmount + fundFromHELOC,
        loanRate: 0.065,
      });
      
      // First year 40% depreciation
      yearDepreciation = strPurchasePrice * strFirstYearDepreciation;
      totalDepreciationUsed += yearDepreciation;
      
      // Create spreadsheet for this property
      const propSpreadsheet: RealEstateSpreadsheet = {
        propertyId: propertyIdCounter,
        purchaseYear: year,
        purchasePrice: strPurchasePrice,
        downPayment,
        loanAmount: loanAmount + fundFromHELOC,
        fundingSources: { cryptoProfits: fundFromProfit, iulLoan: fundFromIUL, helocLoan: fundFromHELOC },
        years: [],
      };
      
      // Project 30 years for this property
      let propValue = strPurchasePrice;
      let propLoan = loanAmount + fundFromHELOC;
      for (let py = 0; py < 30; py++) {
        const propYear = year + py;
        if (propYear > startYear + simulationYears) break;
        propValue *= (1 + strAppreciationRate);
        const interestPmt = propLoan * 0.065;
        const rentalInc = strPurchasePrice * strGrossIncomePct * Math.pow(1.03, py);
        const deprec = py === 0 ? strPurchasePrice * strFirstYearDepreciation : strPurchasePrice * 0.0364; // straight line after year 1
        
        propSpreadsheet.years.push({
          year: propYear,
          yearOfOwnership: py + 1,
          propertyValue: Math.round(propValue),
          loanBalance: Math.round(propLoan),
          equity: Math.round(propValue - propLoan),
          rentalIncome: Math.round(rentalInc),
          interestPayment: Math.round(interestPmt),
          depreciation: Math.round(deprec),
        });
      }
      
      realEstateSpreadsheets.push(propSpreadsheet);
      propertyIdCounter++;
      nextPropertyYear = year + strPurchaseEveryYears;
    }
    
    // ── Property Updates ──
    const propertySnapshots: PropertySnapshot[] = properties.map(p => {
      const yearsOwned = year - p.purchaseYear;
      const currentValue = p.purchasePrice * Math.pow(1 + strAppreciationRate, yearsOwned);
      const rentalIncome = p.purchasePrice * strGrossIncomePct * Math.pow(1.03, yearsOwned);
      const interestPmt = p.loanBalance * 0.065;
      totalRentalIncome += rentalIncome;
      
      return {
        id: p.id,
        purchaseYear: p.purchaseYear,
        purchasePrice: p.purchasePrice,
        currentValue: Math.round(currentValue),
        loanBalance: Math.round(p.loanBalance),
        equity: Math.round(currentValue - p.loanBalance),
        annualRentalIncome: Math.round(rentalIncome),
        monthlyPayment: Math.round(interestPmt / 12),
        yearOfOwnership: yearsOwned,
      };
    });
    
    const totalPropertyValue = propertySnapshots.reduce((s, p) => s + p.currentValue, 0);
    const totalPropertyEquity = propertySnapshots.reduce((s, p) => s + p.equity, 0);
    const totalRentalInc = propertySnapshots.reduce((s, p) => s + p.annualRentalIncome, 0);
    
    // Net taxable gain (offset by depreciation)
    const netTaxableGain = Math.max(0, yearCapGains - yearDepreciation);
    
    // Gold/Silver appreciation (conservative 5% and 3%)
    const goldValue = goldOz * goldPricePerOz * Math.pow(1.05, yr);
    const silverValue = silverOz * silverPricePerOz * Math.pow(1.03, yr);
    
    const totalNetWorth = iulCV - iulLoanBalance + btcHeld * btcPrice + goldValue + silverValue + totalPropertyEquity;
    const totalDebt = iulLoanBalance + properties.reduce((s, p) => s + p.loanBalance, 0);
    
    yearlySnapshots.push({
      year,
      cyclePhase: phase,
      iulCashValue: Math.round(iulCV),
      iulLoanBalance: Math.round(iulLoanBalance),
      iulNetValue: Math.round(iulCV - iulLoanBalance),
      iulPremiumPaid: premiumYearsLeft < premiumYearsRemaining ? annualPremium : 0,
      btcPrice: Math.round(btcPrice),
      btcHeld: parseFloat(btcHeld.toFixed(4)),
      btcValue: Math.round(btcHeld * btcPrice),
      cryptoBuyAmount: Math.round(cryptoBuy),
      cryptoSellAmount: Math.round(cryptoSell),
      cryptoProfit: Math.round(yearProfit),
      goldOz: parseFloat(goldOz.toFixed(2)),
      goldValue: Math.round(goldValue),
      silverOz: parseFloat(silverOz.toFixed(2)),
      silverValue: Math.round(silverValue),
      properties: propertySnapshots,
      totalPropertyValue: Math.round(totalPropertyValue),
      totalPropertyEquity: Math.round(totalPropertyEquity),
      totalRentalIncome: Math.round(totalRentalInc),
      capitalGains: Math.round(yearCapGains),
      depreciationOffset: Math.round(yearDepreciation),
      netTaxableGain: Math.round(netTaxableGain),
      totalNetWorth: Math.round(totalNetWorth),
      totalDebt: Math.round(totalDebt),
      annualCashFlow: Math.round(totalRentalInc + cryptoSell - (totalDebt * 0.05)),
    });
  }
  
  // ── 30-Year Synthesis ──
  const thirtyYearSynthesis = yearlySnapshots.map(snap => ({
    year: snap.year,
    totalPropertyValue: snap.totalPropertyValue,
    totalEquity: snap.totalPropertyEquity,
    totalRentalIncome: snap.totalRentalIncome,
    totalLoanBalance: snap.properties.reduce((s, p) => s + p.loanBalance, 0),
    propertyCount: snap.properties.length,
  }));
  
  const lastSnap = yearlySnapshots[yearlySnapshots.length - 1];
  
  return {
    yearlySnapshots,
    realEstateSpreadsheets,
    summary: {
      totalCryptoProfit: Math.round(totalCryptoProfit),
      totalRentalIncome: Math.round(totalRentalIncome),
      totalPropertyValue: lastSnap?.totalPropertyValue ?? 0,
      totalPropertyEquity: lastSnap?.totalPropertyEquity ?? 0,
      totalGoldValue: lastSnap?.goldValue ?? 0,
      totalSilverValue: lastSnap?.silverValue ?? 0,
      finalIULValue: Math.round(iulCV - iulLoanBalance),
      finalNetWorth: lastSnap?.totalNetWorth ?? 0,
      propertiesOwned: properties.length,
      totalDepreciationUsed: Math.round(totalDepreciationUsed),
      totalCapitalGains: Math.round(totalCapitalGains),
      netTaxSaved: Math.round(totalDepreciationUsed * 0.37), // est 37% bracket
    },
    thirtyYearSynthesis,
  };
}

// ─── Formatting Helpers ─────────────────────────────────────────────────────

export function fmtCurrency(n: number): string {
  if (Math.abs(n) >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export function fmtPct(n: number): string {
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
}

// ─── Sources ────────────────────────────────────────────────────────────────

/** Every source and declared assumption behind this engine, for the shell's source footer. */
export const CRYPTO_CYCLE_SOURCES: readonly { label: string; url?: string; asOf?: string; note?: string }[] = [
  HALVING_SCHEDULE_SOURCE,
  COINGECKO_HALVING_HISTORY_SOURCE,
  BITCOIN_COM_PRICE_HISTORY_SOURCE,
  DRAWDOWN_HISTORY_SOURCE,
  CNBC_2022_LOW_SOURCE,
  ATH_2025_SOURCE,
  LOW_2026_SOURCE,
  CYCLE_ARITHMETIC_NOTE,
  ...CYCLE_SIMULATOR_ASSUMPTIONS,
  MORTGAGE_RATE_SOURCE,
  DEPRECIATION_SOURCE,
  TOP_BRACKET_SOURCE,
  GOLD_RETURN_SOURCE,
  ...ACCUMULATION_ASSUMPTIONS,
];
