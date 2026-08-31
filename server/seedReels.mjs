import 'dotenv/config';
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error('DATABASE_URL not set'); process.exit(1); }

const REELS = [
  // ─── MEGA REELS (every 6-7 cards) ─────────────────────────────────
  {
    category: "financial_wins", title: "The $47M IUL Play",
    hookText: "A dentist put $50K/yr into an IUL for 10 years. By 65, his cash value hit $47 million — tax-free.",
    slides: JSON.stringify([
      { order: 1, text: "Dr. James Chen, age 35, maxed out his 401(k) every year. Total at 65: $2.1M — taxable.", duration: 6 },
      { order: 2, text: "His IUL? $500K total premiums over 10 years. Cash value at 65: $4.7M. Tax-free loans for life.", duration: 7 },
      { order: 3, text: "Death benefit: $12M to his family, income-tax-free under IRC §101(a).", duration: 5 },
      { order: 4, text: "His 401(k) will lose 37% to taxes. His IUL loses 0%. That's the difference between rich and wealthy.", duration: 7 }
    ]),
    emotion: "triumphant", isMega: true, ctaText: "Run Your IUL Numbers", ctaAction: "/portal/iul-historical",
    musicMood: "epic", iconEmoji: "🦷", readTimeSeconds: 25, sortOrder: 1
  },
  {
    category: "tax_tips", title: "The $0 Tax Bill Strategy",
    hookText: "This surgeon earns $800K/year and pays $0 in federal income tax. Legally.",
    slides: JSON.stringify([
      { order: 1, text: "Step 1: Cost segregation on 3 rental properties → $340K in bonus depreciation.", duration: 6 },
      { order: 2, text: "Step 2: Oil & gas working interest → $180K deduction against active income.", duration: 6 },
      { order: 3, text: "Step 3: Defined benefit plan → $265K pre-tax contribution.", duration: 5 },
      { order: 4, text: "Step 4: Charitable remainder trust → $15K deduction + income stream for life.", duration: 6 },
      { order: 5, text: "Total deductions: $800K. Taxable income: $0. All legal. All documented. All repeatable.", duration: 7 }
    ]),
    emotion: "shocking", isMega: true, ctaText: "See All 100 Tax Combos", ctaAction: "/portal/tax-combos",
    musicMood: "dramatic", iconEmoji: "🏥", readTimeSeconds: 30, sortOrder: 7
  },
  {
    category: "real_estate", title: "The Infinite Property Machine",
    hookText: "He started with 1 house. In 8 years he owned 14 — using the same $150K over and over.",
    slides: JSON.stringify([
      { order: 1, text: "Year 1: Bought house #1 for $300K. Put $60K down. HELOC'd $105K of equity.", duration: 6 },
      { order: 2, text: "Moved HELOC into IUL. Year 3: borrowed $84K from IUL cash value. Bought house #2.", duration: 6 },
      { order: 3, text: "Repeated every 18 months. Each property appreciated 4-6% while tenants paid the mortgage.", duration: 6 },
      { order: 4, text: "Year 8: 14 properties. $4.2M in real estate. $890K in IUL cash value. Original investment: $150K.", duration: 7 },
      { order: 5, text: "The money never left the system. It just multiplied.", duration: 5 }
    ]),
    emotion: "exciting", isMega: true, ctaText: "Model Your Property Empire", ctaAction: "/portal/real-estate-mogul",
    musicMood: "epic", iconEmoji: "🏘️", readTimeSeconds: 30, sortOrder: 14
  },
  {
    category: "financial_comebacks", title: "Divorced, Broke, Then $8M",
    hookText: "She lost everything in the divorce at 42. By 55, she was worth $8.2 million.",
    slides: JSON.stringify([
      { order: 1, text: "Maria, 42. Divorce took half of everything. Left with $180K and a condo.", duration: 6 },
      { order: 2, text: "Her advisor put $36K/yr into an IUL inside an ILIT. Divorce-proof. Creditor-proof.", duration: 6 },
      { order: 3, text: "Year 5: IUL cash value hit $220K. She borrowed $176K to buy a duplex.", duration: 6 },
      { order: 4, text: "Year 10: 3 properties + $1.8M IUL cash value + $4.2M death benefit.", duration: 6 },
      { order: 5, text: "Year 13: Net worth $8.2M. All protected in trusts. No one can touch it again.", duration: 7 }
    ]),
    emotion: "inspiring", isMega: true, ctaText: "Divorce-Proof Your Wealth", ctaAction: "/portal/divorce-calculator",
    musicMood: "uplifting", iconEmoji: "👩‍⚖️", readTimeSeconds: 31, sortOrder: 21
  },
  {
    category: "money_secrets", title: "The Rothschild Rule",
    hookText: "The wealthiest families in history all follow one rule: Never spend principal. Ever.",
    slides: JSON.stringify([
      { order: 1, text: "The Rothschilds have been wealthy for 250+ years. Their secret? They never touch principal.", duration: 6 },
      { order: 2, text: "They borrow against assets. IUL policy loans. Lines of credit against portfolios. Margin loans.", duration: 6 },
      { order: 3, text: "The principal keeps compounding. The loans get repaid by the growth. The tax bill? $0.", duration: 6 },
      { order: 4, text: "This is exactly what an IUL does. Your cash value grows. You borrow against it. You never sell.", duration: 6 },
      { order: 5, text: "Buy, borrow, die. It's not a loophole. It's the tax code working as designed.", duration: 7 }
    ]),
    emotion: "mysterious", isMega: true, ctaText: "Learn the Policy Loan Strategy", ctaAction: "/portal/policy-loans",
    musicMood: "mysterious", iconEmoji: "🏛️", readTimeSeconds: 31, sortOrder: 28
  },
  {
    category: "financial_wins", title: "The $2.4M Mortgage Hack",
    hookText: "They paid off a $450K mortgage in 4.5 years — and built $2.4M in tax-free wealth doing it.",
    slides: JSON.stringify([
      { order: 1, text: "The Johnsons: $450K mortgage, $180K income. Traditional path: 30 years, $432K in interest.", duration: 6 },
      { order: 2, text: "Mortgage Killer strategy: HELOC → IUL premium → policy loan → principal-only payments.", duration: 6 },
      { order: 3, text: "4.5 years later: mortgage paid off. Interest saved: $389K.", duration: 5 },
      { order: 4, text: "IUL cash value at year 20: $2.4M. Death benefit: $7.2M. All tax-free.", duration: 6 },
      { order: 5, text: "Same income. Same house. Completely different financial future.", duration: 5 }
    ]),
    emotion: "triumphant", isMega: true, ctaText: "Run Mortgage Killer", ctaAction: "/portal/mortgage-killer",
    musicMood: "epic", iconEmoji: "🏠", readTimeSeconds: 28, sortOrder: 35
  },
  {
    category: "tax_tips", title: "The Dynasty Trust Secret",
    hookText: "This family will pass $50M to their grandchildren — and pay $0 in estate tax.",
    slides: JSON.stringify([
      { order: 1, text: "Federal estate tax: 40% on everything over $13.61M. That's $14.6M in taxes on a $50M estate.", duration: 7 },
      { order: 2, text: "Their solution: Dynasty Trust funded with IUL. Premiums paid with annual gift tax exclusions.", duration: 6 },
      { order: 3, text: "IUL death benefit: $50M. Paid to the trust. Estate tax: $0 (IRC §2042 — trust owns the policy).", duration: 7 },
      { order: 4, text: "The trust distributes income to 3 generations. No estate tax at each generation. No probate.", duration: 6 },
      { order: 5, text: "$50M preserved. $14.6M in taxes eliminated. That's the power of proper planning.", duration: 6 }
    ]),
    emotion: "educational", isMega: true, ctaText: "Explore Trust Structures", ctaAction: "/portal/trusts",
    musicMood: "dramatic", iconEmoji: "👨‍👩‍👧‍👦", readTimeSeconds: 32, sortOrder: 42
  },

  // ─── REGULAR REELS ─────────────────────────────────────────────────
  {
    category: "tax_tips", title: "The 401(k) Tax Trap",
    hookText: "Your 401(k) isn't saving you money. It's deferring a tax bomb.",
    slides: JSON.stringify([
      { order: 1, text: "You contribute $23K/yr pre-tax. Feels great. But you're just delaying the bill.", duration: 5 },
      { order: 2, text: "At 65, your $2M 401(k) will be taxed at ordinary income rates — potentially 37%.", duration: 6 },
      { order: 3, text: "That's $740K to the IRS. An IUL with the same growth? $0 in taxes on withdrawals.", duration: 6 }
    ]),
    emotion: "cautionary", isMega: false, ctaText: "Compare IUL vs 401(k)", ctaAction: "/portal/iul-vs-roth",
    musicMood: "tense", iconEmoji: "⏰", readTimeSeconds: 17, sortOrder: 2
  },
  {
    category: "iul_advantages", title: "The 0% Floor",
    hookText: "The market crashed 38% in 2008. IUL policyholders lost exactly 0%.",
    slides: JSON.stringify([
      { order: 1, text: "S&P 500 in 2008: -38.5%. IUL credited rate: 0%. Not negative. Zero.", duration: 5 },
      { order: 2, text: "2009 recovery: S&P +23.5%. IUL credited: 12% (with cap). Starting from a higher base.", duration: 6 },
      { order: 3, text: "Over 20 years, the 0% floor means you never have to recover from losses. That's the edge.", duration: 6 }
    ]),
    emotion: "educational", isMega: false, ctaText: "See Historical IUL Returns", ctaAction: "/portal/iul-historical",
    musicMood: "calm", iconEmoji: "🛡️", readTimeSeconds: 17, sortOrder: 3
  },
  {
    category: "wealthy_habits", title: "Rich vs. Wealthy",
    hookText: "Rich people earn money. Wealthy people's money earns money.",
    slides: JSON.stringify([
      { order: 1, text: "A doctor earning $500K/yr is rich. But if he stops working, the income stops.", duration: 5 },
      { order: 2, text: "A business owner with $3M in IUL cash value borrows $120K/yr tax-free. Forever.", duration: 6 },
      { order: 3, text: "The doctor pays 37% tax on every dollar. The business owner pays 0%. That's the difference.", duration: 6 }
    ]),
    emotion: "educational", isMega: false, ctaText: "Build Passive Income", ctaAction: "/portal/income-timeline",
    musicMood: "thoughtful", iconEmoji: "🎓", readTimeSeconds: 17, sortOrder: 4
  },
  {
    category: "financial_losses", title: "The $1.2M Mistake",
    hookText: "He maxed his 401(k) for 30 years. His neighbor funded an IUL. The difference? $1.2 million.",
    slides: JSON.stringify([
      { order: 1, text: "Both saved $23K/yr for 30 years. Same income. Same discipline.", duration: 5 },
      { order: 2, text: "401(k) at 65: $2.1M gross. After 32% tax: $1.43M net.", duration: 5 },
      { order: 3, text: "IUL at 65: $2.6M cash value. Tax-free loans for life. Net: $2.6M. Difference: $1.17M.", duration: 7 }
    ]),
    emotion: "devastating", isMega: false, ctaText: "Run the Comparison", ctaAction: "/portal/iul-vs-roth",
    musicMood: "somber", iconEmoji: "📉", readTimeSeconds: 17, sortOrder: 5
  },
  {
    category: "money_secrets", title: "Banks Use YOUR Money",
    hookText: "Banks take your deposits, buy life insurance with them, and keep the profits.",
    slides: JSON.stringify([
      { order: 1, text: "Bank-Owned Life Insurance (BOLI): Banks hold $182 billion in life insurance on their balance sheets.", duration: 6 },
      { order: 2, text: "They use YOUR deposits to fund these policies. The tax-free growth goes to the bank, not you.", duration: 6 },
      { order: 3, text: "If it's good enough for JPMorgan, Wells Fargo, and Bank of America — why aren't you doing it?", duration: 6 }
    ]),
    emotion: "shocking", isMega: false, ctaText: "See How Banks Profit", ctaAction: "/portal/strategy",
    musicMood: "dramatic", iconEmoji: "🏦", readTimeSeconds: 18, sortOrder: 6
  },
  {
    category: "annuity", title: "The 5.65% Guarantee",
    hookText: "While the market swings wildly, this MYGA pays 5.65% guaranteed for 5 years. No risk.",
    slides: JSON.stringify([
      { order: 1, text: "Multi-Year Guaranteed Annuity: 5.65% for 5 years. No market risk. No fees. Guaranteed.", duration: 5 },
      { order: 2, text: "$500K in a MYGA = $28,250/yr in guaranteed interest. That's $2,354/month, rain or shine.", duration: 6 },
      { order: 3, text: "Compare to a CD at 4.2%. Over 5 years, the MYGA earns $36,250 more. Tax-deferred.", duration: 6 }
    ]),
    emotion: "educational", isMega: false, ctaText: "Compare MYGA Rates", ctaAction: "/portal/myga-fixed-rate",
    musicMood: "calm", iconEmoji: "🔒", readTimeSeconds: 17, sortOrder: 8
  },
  {
    category: "crypto", title: "Bitcoin in an IUL?",
    hookText: "Yes, some IULs now offer crypto-linked index strategies. Here's what that means.",
    slides: JSON.stringify([
      { order: 1, text: "New index options track Bitcoin and crypto baskets — inside an IUL's tax-free wrapper.", duration: 6 },
      { order: 2, text: "You get upside participation with a floor of 0%. Bitcoin drops 50%? You lose nothing.", duration: 6 },
      { order: 3, text: "Bitcoin up 100%? You capture up to the cap (typically 20-30%). Inside a tax-free vehicle.", duration: 6 }
    ]),
    emotion: "exciting", isMega: false, ctaText: "Explore Index Strategies", ctaAction: "/portal/index-strategies",
    musicMood: "energetic", iconEmoji: "₿", readTimeSeconds: 18, sortOrder: 9
  },
  {
    category: "real_estate", title: "Dead Equity Kills Wealth",
    hookText: "Your home equity earns 0% return. It just sits there. Exposed to lawsuits and divorce.",
    slides: JSON.stringify([
      { order: 1, text: "$200K in home equity earns you exactly $0 per year. It's dead money.", duration: 5 },
      { order: 2, text: "A HELOC at 8.5% on $140K costs $11,900/yr. But deployed into an IUL at 7.5%...", duration: 6 },
      { order: 3, text: "Year 10: IUL cash value $215K. HELOC cost: $119K. Net gain: $96K. Plus tax-free income for life.", duration: 7 }
    ]),
    emotion: "cautionary", isMega: false, ctaText: "Unlock Your Equity", ctaAction: "/portal/reverse-heloc",
    musicMood: "urgent", iconEmoji: "🏚️", readTimeSeconds: 18, sortOrder: 10
  },
  {
    category: "financial_wins", title: "The Roth Conversion Trap",
    hookText: "Your advisor says convert to Roth. But there's a better way that saves 3x more.",
    slides: JSON.stringify([
      { order: 1, text: "Roth conversion: pay 32% tax now on $500K = $160K to the IRS upfront.", duration: 5 },
      { order: 2, text: "Alternative: Take that $160K and fund an IUL over 5 years. Tax-free growth + death benefit.", duration: 6 },
      { order: 3, text: "At 65: Roth = $1.8M. IUL = $2.4M + $6M death benefit. The math doesn't lie.", duration: 6 }
    ]),
    emotion: "shocking", isMega: false, ctaText: "Compare Roth vs IUL", ctaAction: "/portal/roth-conversion",
    musicMood: "dramatic", iconEmoji: "🔄", readTimeSeconds: 17, sortOrder: 11
  },
  {
    category: "iul_advantages", title: "Tax-Free Retirement Income",
    hookText: "He retired at 62 with $150K/yr in tax-free income. His neighbor with the same savings? $97K after taxes.",
    slides: JSON.stringify([
      { order: 1, text: "Both accumulated $3M by age 62. Same savings rate. Same discipline.", duration: 5 },
      { order: 2, text: "IRA withdrawals at $150K/yr: $53K goes to federal + state taxes. Net: $97K.", duration: 6 },
      { order: 3, text: "IUL policy loans at $150K/yr: $0 in taxes. Net: $150K. That's 55% more spending power.", duration: 6 }
    ]),
    emotion: "inspiring", isMega: false, ctaText: "Plan Your Tax-Free Retirement", ctaAction: "/portal/income-gap",
    musicMood: "uplifting", iconEmoji: "🏖️", readTimeSeconds: 17, sortOrder: 12
  },
  {
    category: "financial_losses", title: "The Divorce Devastation",
    hookText: "He built $4M over 20 years. She got half. Then the taxes hit. He was left with $800K.",
    slides: JSON.stringify([
      { order: 1, text: "$4M net worth. Divorce splits it 50/50. He gets $2M. Sounds fair, right?", duration: 5 },
      { order: 2, text: "But $1.2M was in a 401(k). Liquidation tax: $384K. Attorney fees: $180K. Selling the house: $120K in costs.", duration: 7 },
      { order: 3, text: "Net after divorce: $816K from $4M. If he'd had an IUL in an ILIT? $2.4M — untouchable.", duration: 7 }
    ]),
    emotion: "devastating", isMega: false, ctaText: "Divorce-Proof Your Wealth", ctaAction: "/portal/divorce-calculator",
    musicMood: "somber", iconEmoji: "💔", readTimeSeconds: 19, sortOrder: 13
  },
  {
    category: "tax_tips", title: "The Oil & Gas Deduction",
    hookText: "Invest $100K in oil & gas. Deduct $85K in year one. It's in the tax code.",
    slides: JSON.stringify([
      { order: 1, text: "IRC §263(c): Intangible Drilling Costs are 100% deductible in year one.", duration: 5 },
      { order: 2, text: "$100K investment → $85K deduction → $28K tax savings at 33% bracket. Day one.", duration: 6 },
      { order: 3, text: "Plus ongoing depletion allowances (IRC §613) and potential income from production.", duration: 5 }
    ]),
    emotion: "educational", isMega: false, ctaText: "See Tax Strategies", ctaAction: "/portal/secret-secrets",
    musicMood: "informative", iconEmoji: "🛢️", readTimeSeconds: 16, sortOrder: 15
  },
  {
    category: "wealthy_habits", title: "The 72-Hour Rule",
    hookText: "Every wealthy person I know follows this rule before any purchase over $500.",
    slides: JSON.stringify([
      { order: 1, text: "Before buying anything over $500: wait 72 hours. If you still want it, buy it.", duration: 5 },
      { order: 2, text: "This simple rule saves the average high-earner $18K-$35K per year in impulse purchases.", duration: 6 },
      { order: 3, text: "Redirect that $35K into an IUL. In 20 years: $1.2M in tax-free cash value.", duration: 6 }
    ]),
    emotion: "educational", isMega: false, ctaText: "Calculate Your Savings", ctaAction: "/portal/strategy",
    musicMood: "thoughtful", iconEmoji: "⏳", readTimeSeconds: 17, sortOrder: 16
  },
  {
    category: "financial_comebacks", title: "From $0 to $3.2M in 12 Years",
    hookText: "She was a single mom making $65K. Her advisor showed her one strategy. Everything changed.",
    slides: JSON.stringify([
      { order: 1, text: "Lisa, 33, single mom, teacher. $65K salary. $0 in savings. $42K in student loans.", duration: 5 },
      { order: 2, text: "Her advisor set up a small IUL: $400/month. Plus a side hustle selling insurance.", duration: 6 },
      { order: 3, text: "Year 5: IUL cash value $32K. Side income: $45K/yr. She bought her first rental property.", duration: 6 },
      { order: 4, text: "Year 12: 4 rentals + $680K IUL + $1.8M death benefit. Net worth: $3.2M. From $0.", duration: 6 }
    ]),
    emotion: "heartwarming", isMega: false, ctaText: "Start Your Journey", ctaAction: "/portal/strategy",
    musicMood: "uplifting", iconEmoji: "👩‍🏫", readTimeSeconds: 23, sortOrder: 17
  },
  {
    category: "money_secrets", title: "The Infinite Banking Concept",
    hookText: "Be your own bank. Borrow from yourself. Pay yourself back. Keep the interest.",
    slides: JSON.stringify([
      { order: 1, text: "Traditional loan: You pay the bank interest. They profit. You lose.", duration: 5 },
      { order: 2, text: "IUL policy loan: You borrow from your cash value. The full balance keeps earning.", duration: 6 },
      { order: 3, text: "You pay yourself back with interest. Your cash value grows. The bank gets nothing.", duration: 6 }
    ]),
    emotion: "educational", isMega: false, ctaText: "Explore Policy Loans", ctaAction: "/portal/policy-loans",
    musicMood: "thoughtful", iconEmoji: "🏦", readTimeSeconds: 17, sortOrder: 18
  },
  {
    category: "iul_advantages", title: "The Living Benefits Secret",
    hookText: "He was diagnosed with cancer. His IUL paid him $1.2M while he was still alive.",
    slides: JSON.stringify([
      { order: 1, text: "Critical illness rider: accelerated death benefit for terminal, chronic, or critical illness.", duration: 6 },
      { order: 2, text: "Mark, 52, diagnosed with stage 3 cancer. His $2M IUL paid $1.2M in living benefits.", duration: 6 },
      { order: 3, text: "He used it for treatment, family expenses, and bucket list. Tax-free. No strings attached.", duration: 6 }
    ]),
    emotion: "heartwarming", isMega: false, ctaText: "Learn About Living Benefits", ctaAction: "/portal/strategy",
    musicMood: "emotional", iconEmoji: "❤️‍🩹", readTimeSeconds: 18, sortOrder: 19
  },
  {
    category: "real_estate", title: "House Recycling 101",
    hookText: "Buy. Live. Rent. Repeat. How to build a real estate empire with $0 down after the first house.",
    slides: JSON.stringify([
      { order: 1, text: "Buy house #1 with 3.5% FHA. Live in it 1 year. Rent it out. Buy house #2 with FHA again.", duration: 7 },
      { order: 2, text: "Each house appreciates 4-5%/yr. Tenants pay the mortgage. You build equity passively.", duration: 6 },
      { order: 3, text: "After 5 houses: $150K+ in annual rental income. $800K+ in equity. Original investment: $15K.", duration: 6 }
    ]),
    emotion: "exciting", isMega: false, ctaText: "Model House Recycling", ctaAction: "/portal/house-recycling",
    musicMood: "energetic", iconEmoji: "♻️", readTimeSeconds: 19, sortOrder: 20
  },
  {
    category: "tax_tips", title: "Cost Segregation Magic",
    hookText: "Buy a $500K rental. Deduct $200K in year one. Thank the IRS for this gift.",
    slides: JSON.stringify([
      { order: 1, text: "Normal depreciation: $500K over 27.5 years = $18K/yr deduction. Boring.", duration: 5 },
      { order: 2, text: "Cost segregation study: reclassify 40% as 5/7/15-year property. Bonus depreciation: $200K in year 1.", duration: 7 },
      { order: 3, text: "At 37% bracket: $74K in tax savings. The study costs $8K. ROI: 825%. Do this on every property.", duration: 6 }
    ]),
    emotion: "educational", isMega: false, ctaText: "See Tax Strategies", ctaAction: "/portal/secret-secrets",
    musicMood: "informative", iconEmoji: "🏗️", readTimeSeconds: 18, sortOrder: 22
  },
  {
    category: "financial_losses", title: "The Social Security Trap",
    hookText: "You'll pay taxes on 85% of your Social Security. Unless you plan ahead.",
    slides: JSON.stringify([
      { order: 1, text: "If your combined income exceeds $44K (married), 85% of Social Security is taxable.", duration: 6 },
      { order: 2, text: "Average couple loses $3,200/yr to Social Security taxation. Over 25 years: $80K.", duration: 6 },
      { order: 3, text: "IUL policy loans don't count as income. They don't trigger Social Security taxation. Plan ahead.", duration: 6 }
    ]),
    emotion: "cautionary", isMega: false, ctaText: "Optimize Social Security", ctaAction: "/portal/social-security",
    musicMood: "urgent", iconEmoji: "🧓", readTimeSeconds: 18, sortOrder: 23
  },
  {
    category: "money_secrets", title: "The Velocity of Money",
    hookText: "The rich don't save money. They move it. Fast. Through multiple vehicles simultaneously.",
    slides: JSON.stringify([
      { order: 1, text: "Dollar velocity: how many times one dollar works for you simultaneously.", duration: 5 },
      { order: 2, text: "$100K in a savings account: velocity = 1. It earns 4% and sits there.", duration: 5 },
      { order: 3, text: "$100K through HELOC → IUL → policy loan → rental property: velocity = 4. Same dollar, 4 jobs.", duration: 7 }
    ]),
    emotion: "educational", isMega: false, ctaText: "Increase Your Dollar Velocity", ctaAction: "/portal/strategy",
    musicMood: "thoughtful", iconEmoji: "🚀", readTimeSeconds: 17, sortOrder: 24
  },
  {
    category: "iul_advantages", title: "The Premium Financing Play",
    hookText: "Borrow $2M from a bank to fund your IUL. The policy growth pays the loan. You keep the spread.",
    slides: JSON.stringify([
      { order: 1, text: "Premium financing: a bank lends you $2M to fund an IUL. Collateral: the policy itself.", duration: 6 },
      { order: 2, text: "Bank charges 5%. IUL earns 7.5%. You keep the 2.5% spread on $2M = $50K/yr.", duration: 6 },
      { order: 3, text: "Year 10: Pay off the loan. Keep $3.2M in cash value + $8M death benefit. Out of pocket: $0.", duration: 6 }
    ]),
    emotion: "exciting", isMega: false, ctaText: "Explore Premium Financing", ctaAction: "/portal/premium-financing",
    musicMood: "energetic", iconEmoji: "💰", readTimeSeconds: 18, sortOrder: 25
  },
  {
    category: "financial_wins", title: "The Estate Tax Eraser",
    hookText: "His $20M estate would have owed $5.2M in taxes. His family paid $0.",
    slides: JSON.stringify([
      { order: 1, text: "Federal estate tax: 40% on everything over $13.61M. On $20M: $2.56M in taxes.", duration: 6 },
      { order: 2, text: "Solution: ILIT-owned IUL. $8M death benefit. Trust pays the estate tax. Family keeps everything.", duration: 6 },
      { order: 3, text: "Annual premiums: $42K for 15 years = $630K total. Saved: $2.56M. ROI: 306%.", duration: 6 }
    ]),
    emotion: "triumphant", isMega: false, ctaText: "Plan Your Estate", ctaAction: "/portal/estate-tax",
    musicMood: "epic", iconEmoji: "🏰", readTimeSeconds: 18, sortOrder: 26
  },
  {
    category: "funny", title: "Your Financial Advisor's Secret",
    hookText: "Your advisor recommends mutual funds. Guess what they own personally? Life insurance.",
    slides: JSON.stringify([
      { order: 1, text: "73% of financial advisors own permanent life insurance. But only 12% recommend it to clients.", duration: 6 },
      { order: 2, text: "Why? Mutual funds generate ongoing AUM fees. Life insurance pays once and the client is set for life.", duration: 6 },
      { order: 3, text: "Ask your advisor: 'What do YOU own?' Watch their face. Then call us.", duration: 5 }
    ]),
    emotion: "funny", isMega: false, ctaText: "Get Honest Advice", ctaAction: "/portal/strategy",
    musicMood: "playful", iconEmoji: "🤫", readTimeSeconds: 17, sortOrder: 27
  },
  {
    category: "real_estate", title: "The HELOC Arbitrage",
    hookText: "Borrow at 8.5%. Earn at 7.5%. Lose money? No — because one is tax-free.",
    slides: JSON.stringify([
      { order: 1, text: "HELOC rate: 8.5%. IUL credited rate: 7.5%. Looks like you lose 1%. But wait.", duration: 5 },
      { order: 2, text: "HELOC interest may be tax-deductible. IUL growth is tax-free. After-tax spread: +2.1%.", duration: 6 },
      { order: 3, text: "Plus: IUL has a 0% floor. HELOC has no downside risk to your cash value. The math works.", duration: 6 }
    ]),
    emotion: "educational", isMega: false, ctaText: "Run the HELOC Numbers", ctaAction: "/portal/reverse-heloc",
    musicMood: "informative", iconEmoji: "📊", readTimeSeconds: 17, sortOrder: 29
  },
  {
    category: "tax_tips", title: "The Charitable Hack",
    hookText: "Donate $100K to charity. Get $100K deduction. Still receive $80K back in income. Legal.",
    slides: JSON.stringify([
      { order: 1, text: "Charitable Remainder Trust (CRT): Donate appreciated assets. Get immediate tax deduction.", duration: 6 },
      { order: 2, text: "The trust sells the assets — no capital gains tax. Invests the proceeds.", duration: 5 },
      { order: 3, text: "You receive income from the trust for life. Charity gets the remainder. Everyone wins.", duration: 6 }
    ]),
    emotion: "educational", isMega: false, ctaText: "Explore Charitable Strategies", ctaAction: "/portal/secret-secrets",
    musicMood: "uplifting", iconEmoji: "🎁", readTimeSeconds: 17, sortOrder: 30
  },
  {
    category: "financial_comebacks", title: "Bankrupt to $5M",
    hookText: "Filed bankruptcy at 38. Rebuilt everything using one vehicle. Worth $5M by 50.",
    slides: JSON.stringify([
      { order: 1, text: "Tom, 38. Business failed. Filed Chapter 7. Credit score: 480. Net worth: negative $120K.", duration: 6 },
      { order: 2, text: "Year 1 post-bankruptcy: started small IUL at $300/month. Rebuilt credit.", duration: 5 },
      { order: 3, text: "Year 5: IUL cash value $22K. Borrowed $17K for rental property down payment.", duration: 6 },
      { order: 4, text: "Year 12: 6 rentals + $1.8M IUL + insurance agency. Net worth: $5.1M. From bankruptcy.", duration: 6 }
    ]),
    emotion: "inspiring", isMega: false, ctaText: "Start Your Comeback", ctaAction: "/portal/strategy",
    musicMood: "uplifting", iconEmoji: "🔥", readTimeSeconds: 23, sortOrder: 31
  },
  {
    category: "money_secrets", title: "The Rule of 72",
    hookText: "Divide 72 by your interest rate. That's how many years to double your money.",
    slides: JSON.stringify([
      { order: 1, text: "72 ÷ 7.5% = 9.6 years to double. $500K becomes $1M in under 10 years.", duration: 5 },
      { order: 2, text: "In an IUL: that doubling is tax-free. In a 401(k): you'll lose 30%+ when you withdraw.", duration: 6 },
      { order: 3, text: "After 3 doublings (29 years): IUL = $4M tax-free. 401(k) = $4M minus $1.2M in taxes.", duration: 6 }
    ]),
    emotion: "educational", isMega: false, ctaText: "See Your Doubling Timeline", ctaAction: "/portal/strategy",
    musicMood: "informative", iconEmoji: "📐", readTimeSeconds: 17, sortOrder: 32
  },
  {
    category: "iul_advantages", title: "The Death Benefit Multiplier",
    hookText: "He paid $300K in premiums. His family received $4.5M. Tax-free. That's a 15x return.",
    slides: JSON.stringify([
      { order: 1, text: "IUL premium: $30K/yr for 10 years = $300K total investment.", duration: 5 },
      { order: 2, text: "Day 1 death benefit: $2M. By year 20: $4.5M. All income-tax-free under IRC §101(a).", duration: 6 },
      { order: 3, text: "No other financial vehicle gives you a 15x tax-free return on day one. None.", duration: 5 }
    ]),
    emotion: "triumphant", isMega: false, ctaText: "Calculate Your Death Benefit", ctaAction: "/portal/strategy",
    musicMood: "epic", iconEmoji: "🎯", readTimeSeconds: 16, sortOrder: 33
  },
  {
    category: "annuity", title: "FIA + Income Rider",
    hookText: "Guaranteed 7% rollup rate. Guaranteed income for life. Zero market risk.",
    slides: JSON.stringify([
      { order: 1, text: "Fixed Index Annuity with income rider: your income base grows at 7% guaranteed.", duration: 5 },
      { order: 2, text: "$500K at age 55. By 65: income base = $983K. Lifetime income: $59K/yr guaranteed.", duration: 6 },
      { order: 3, text: "Market crashes? Doesn't matter. Your income base never goes down. That's the guarantee.", duration: 6 }
    ]),
    emotion: "educational", isMega: false, ctaText: "Compare Income Annuities", ctaAction: "/portal/income-annuity-top10",
    musicMood: "calm", iconEmoji: "📈", readTimeSeconds: 17, sortOrder: 34
  },
  {
    category: "financial_losses", title: "The RMD Time Bomb",
    hookText: "At 73, the IRS forces you to withdraw from your IRA. Ready or not. Taxed or not.",
    slides: JSON.stringify([
      { order: 1, text: "Required Minimum Distributions start at 73. You MUST withdraw, even if you don't need the money.", duration: 6 },
      { order: 2, text: "$2M IRA at 73: RMD = $75K. At 32% bracket: $24K to the IRS. Every year. Increasing.", duration: 6 },
      { order: 3, text: "IUL has no RMDs. No forced withdrawals. No tax bombs. You control when and how much.", duration: 6 }
    ]),
    emotion: "cautionary", isMega: false, ctaText: "Avoid the RMD Trap", ctaAction: "/portal/roth-conversion",
    musicMood: "urgent", iconEmoji: "💣", readTimeSeconds: 18, sortOrder: 36
  },
  {
    category: "wealthy_habits", title: "The 10-10-10 Rule",
    hookText: "Save 10%. Invest 10%. Protect 10%. The formula every millionaire follows.",
    slides: JSON.stringify([
      { order: 1, text: "10% to liquid savings (emergency fund). 10% to growth (IUL/investments). 10% to protection (insurance).", duration: 7 },
      { order: 2, text: "On $150K income: $15K savings + $15K IUL + $15K protection = $45K/yr working for you.", duration: 6 },
      { order: 3, text: "In 20 years: $300K emergency fund + $520K IUL cash value + $2M death benefit. From 30% of income.", duration: 7 }
    ]),
    emotion: "educational", isMega: false, ctaText: "Build Your Plan", ctaAction: "/portal/strategy",
    musicMood: "thoughtful", iconEmoji: "💎", readTimeSeconds: 20, sortOrder: 37
  },
  {
    category: "money_secrets", title: "Why the Rich Buy Art",
    hookText: "It's not about aesthetics. It's about the tax deduction.",
    slides: JSON.stringify([
      { order: 1, text: "Buy art for $50K. Donate it 5 years later when it's worth $200K. Deduct $200K.", duration: 5 },
      { order: 2, text: "At 37% bracket: $74K tax savings on a $50K investment. Plus you enjoyed it for 5 years.", duration: 6 },
      { order: 3, text: "The ultra-wealthy use art, wine, and collectibles as tax-advantaged assets. Now you know why.", duration: 6 }
    ]),
    emotion: "mysterious", isMega: false, ctaText: "See More Tax Secrets", ctaAction: "/portal/secret-secrets",
    musicMood: "mysterious", iconEmoji: "🎨", readTimeSeconds: 17, sortOrder: 38
  },
  {
    category: "real_estate", title: "The 1031 Exchange Chain",
    hookText: "He's sold 12 properties and paid $0 in capital gains tax. Every time.",
    slides: JSON.stringify([
      { order: 1, text: "1031 Exchange: sell investment property, buy a like-kind replacement within 180 days. Defer all gains.", duration: 7 },
      { order: 2, text: "Started with a $200K condo. Exchanged up to $400K duplex. Then $800K fourplex. Then $1.6M apartment.", duration: 7 },
      { order: 3, text: "12 exchanges over 18 years. $0 in capital gains tax. Current property value: $4.8M.", duration: 6 }
    ]),
    emotion: "exciting", isMega: false, ctaText: "Plan Your Exchange", ctaAction: "/portal/real-estate-mogul",
    musicMood: "energetic", iconEmoji: "🔗", readTimeSeconds: 20, sortOrder: 39
  },
  {
    category: "tax_tips", title: "The Augusta Rule",
    hookText: "Rent your home to your business for 14 days. Earn up to $50K tax-free.",
    slides: JSON.stringify([
      { order: 1, text: "IRC §280A(g): Rent your home for 14 days or fewer per year. Income is completely tax-free.", duration: 6 },
      { order: 2, text: "Your S-Corp rents your home for board meetings at $3,500/day × 14 days = $49K.", duration: 6 },
      { order: 3, text: "The business deducts it. You receive it tax-free. $49K moved from taxable to tax-free. Legal.", duration: 6 }
    ]),
    emotion: "shocking", isMega: false, ctaText: "See All Tax Strategies", ctaAction: "/portal/secret-secrets",
    musicMood: "dramatic", iconEmoji: "🏡", readTimeSeconds: 18, sortOrder: 40
  },
  {
    category: "financial_comebacks", title: "The Teacher Who Retired Rich",
    hookText: "She made $52K/yr for 30 years. Retired with $2.8M. Her secret? She started at 25.",
    slides: JSON.stringify([
      { order: 1, text: "Sarah, 25, teacher. $52K salary. Started an IUL at $350/month. That's it.", duration: 5 },
      { order: 2, text: "She never increased her premium. Never panicked during crashes. Never touched the money.", duration: 5 },
      { order: 3, text: "Age 55: $2.8M cash value. $8.4M death benefit. Tax-free income of $112K/yr for life.", duration: 6 },
      { order: 4, text: "Her pension: $38K/yr taxable. Her IUL: $112K/yr tax-free. Starting early is the ultimate hack.", duration: 6 }
    ]),
    emotion: "heartwarming", isMega: false, ctaText: "Start Early Calculator", ctaAction: "/portal/strategy",
    musicMood: "uplifting", iconEmoji: "📚", readTimeSeconds: 22, sortOrder: 41
  },
  {
    category: "iul_advantages", title: "The Uninterrupted Compounding",
    hookText: "The S&P lost money in 7 of the last 25 years. IUL lost money in 0 of them.",
    slides: JSON.stringify([
      { order: 1, text: "S&P 500 negative years since 2000: 2000, 2001, 2002, 2008, 2018, 2022. Six years of losses.", duration: 6 },
      { order: 2, text: "IUL credited rate in those years: 0%, 0%, 0%, 0%, 0%, 0%. No losses. Ever.", duration: 6 },
      { order: 3, text: "Uninterrupted compounding means your base never shrinks. Over 25 years, that's worth millions.", duration: 6 }
    ]),
    emotion: "educational", isMega: false, ctaText: "See Historical Performance", ctaAction: "/portal/iul-historical",
    musicMood: "calm", iconEmoji: "📊", readTimeSeconds: 18, sortOrder: 43
  },
  {
    category: "money_secrets", title: "The Leverage Ladder",
    hookText: "Use $50K to control $500K in assets. That's 10:1 leverage. Here's how.",
    slides: JSON.stringify([
      { order: 1, text: "Step 1: $50K into IUL. Cash value year 3: $48K. Borrow $38K (80%).", duration: 5 },
      { order: 2, text: "Step 2: $38K + $12K savings = $50K down on $250K rental (20% down).", duration: 6 },
      { order: 3, text: "Step 3: Property appreciates. HELOC the equity. Fund more IUL. Buy more property. Repeat.", duration: 6 },
      { order: 4, text: "Year 10: $50K controls $500K+ in real estate + $180K IUL cash value. That's leverage.", duration: 6 }
    ]),
    emotion: "exciting", isMega: false, ctaText: "Build Your Leverage Ladder", ctaAction: "/portal/real-estate-mogul",
    musicMood: "energetic", iconEmoji: "🪜", readTimeSeconds: 23, sortOrder: 44
  },
  {
    category: "annuity", title: "The MYGA vs CD Showdown",
    hookText: "MYGAs beat CDs in every single category. Here's the proof.",
    slides: JSON.stringify([
      { order: 1, text: "5-year MYGA: 5.65%. 5-year CD: 4.2%. Difference on $500K: $36,250 over 5 years.", duration: 6 },
      { order: 2, text: "CD interest: taxed annually. MYGA interest: tax-deferred until withdrawal. More compounding.", duration: 6 },
      { order: 3, text: "CDs: FDIC insured up to $250K. MYGAs: backed by state guaranty funds + insurance company reserves.", duration: 6 }
    ]),
    emotion: "educational", isMega: false, ctaText: "Compare MYGA Rates", ctaAction: "/portal/myga-fixed-rate",
    musicMood: "informative", iconEmoji: "🏆", readTimeSeconds: 18, sortOrder: 45
  },
  {
    category: "financial_losses", title: "The Market Timing Myth",
    hookText: "Missing the 10 best days in the market over 20 years cuts your return by 54%.",
    slides: JSON.stringify([
      { order: 1, text: "$10K invested in S&P 500 for 20 years: $64K. Miss the 10 best days: $29K. That's 54% less.", duration: 7 },
      { order: 2, text: "The 10 best days often happen right after the worst days. You can't time them.", duration: 5 },
      { order: 3, text: "IUL solution: stay invested always. 0% floor catches the drops. Participation captures the ups.", duration: 6 }
    ]),
    emotion: "cautionary", isMega: false, ctaText: "See the Ibbotson Data", ctaAction: "/portal/ibbotson-charts",
    musicMood: "urgent", iconEmoji: "⏱️", readTimeSeconds: 18, sortOrder: 46
  },
  {
    category: "wealthy_habits", title: "The Two-Account System",
    hookText: "Every wealthy person has two accounts: one for today, one for forever.",
    slides: JSON.stringify([
      { order: 1, text: "Account 1: Liquid cash for 6-12 months of expenses. This is your 'sleep well' money.", duration: 5 },
      { order: 2, text: "Account 2: IUL or permanent life insurance. This is your 'never touch' money that compounds forever.", duration: 6 },
      { order: 3, text: "The wealthy never mix these. Account 1 handles emergencies. Account 2 builds dynasties.", duration: 6 }
    ]),
    emotion: "educational", isMega: false, ctaText: "Set Up Your System", ctaAction: "/portal/strategy",
    musicMood: "thoughtful", iconEmoji: "🗂️", readTimeSeconds: 17, sortOrder: 47
  },
  {
    category: "tax_tips", title: "The Backdoor Roth",
    hookText: "Too rich for a Roth IRA? There's a legal backdoor. And it's better with an IUL chaser.",
    slides: JSON.stringify([
      { order: 1, text: "Income over $161K (single)? Can't contribute to Roth directly. But you can go through the back door.", duration: 6 },
      { order: 2, text: "Contribute $7K to traditional IRA (non-deductible). Convert to Roth. Pay minimal tax on gains.", duration: 6 },
      { order: 3, text: "But Roth caps at $7K/yr. IUL? No contribution limits. $50K, $100K, $500K/yr. No ceiling.", duration: 6 }
    ]),
    emotion: "educational", isMega: false, ctaText: "Compare Roth vs IUL", ctaAction: "/portal/iul-vs-roth",
    musicMood: "informative", iconEmoji: "🚪", readTimeSeconds: 18, sortOrder: 48
  },
  {
    category: "financial_wins", title: "The Business Owner's Shield",
    hookText: "His business got sued for $3M. They couldn't touch his $2.1M in IUL cash value.",
    slides: JSON.stringify([
      { order: 1, text: "Lawsuit: $3M judgment against his LLC. Personal assets at risk.", duration: 5 },
      { order: 2, text: "His $2.1M IUL cash value? Protected by state creditor exemption laws.", duration: 5 },
      { order: 3, text: "His $800K in a brokerage account? Seized. His $400K in checking? Seized. IUL? Untouchable.", duration: 6 }
    ]),
    emotion: "triumphant", isMega: false, ctaText: "Protect Your Assets", ctaAction: "/portal/business-owner",
    musicMood: "epic", iconEmoji: "⚖️", readTimeSeconds: 16, sortOrder: 49
  },
  {
    category: "money_secrets", title: "The Compound Interest Illusion",
    hookText: "Einstein didn't call it the 8th wonder. But the math is still mind-blowing.",
    slides: JSON.stringify([
      { order: 1, text: "$1,000/month at 7.5% for 30 years = $1.3M. You only contributed $360K. Interest did the rest.", duration: 6 },
      { order: 2, text: "But here's the secret: 70% of that growth happens in the last 10 years. Patience is the real strategy.", duration: 6 },
      { order: 3, text: "In an IUL: that $1.3M is tax-free. In a 401(k): subtract $400K+ in taxes. Time + tax-free = wealth.", duration: 7 }
    ]),
    emotion: "educational", isMega: false, ctaText: "See the Growth Curves", ctaAction: "/portal/strategy",
    musicMood: "thoughtful", iconEmoji: "🧮", readTimeSeconds: 19, sortOrder: 50
  }
];

async function seed() {
  const conn = await mysql.createConnection(DATABASE_URL);
  
  // Check if reels already exist
  const [existing] = await conn.execute('SELECT COUNT(*) as cnt FROM financial_reels');
  const count = existing[0].cnt;
  
  if (count > 0) {
    console.log(`Already ${count} reels in database. Skipping seed.`);
    await conn.end();
    return;
  }

  console.log(`Seeding ${REELS.length} financial reels...`);
  
  for (const reel of REELS) {
    await conn.execute(
      `INSERT INTO financial_reels (category, title, hook_text, slides, emotion, is_mega, cta_text, cta_action, music_mood, icon_emoji, read_time_seconds, sort_order, view_count, like_count, save_count, share_count, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        reel.category, reel.title, reel.hookText, reel.slides,
        reel.emotion, reel.isMega ? 1 : 0, reel.ctaText, reel.ctaAction,
        reel.musicMood, reel.iconEmoji, reel.readTimeSeconds, reel.sortOrder,
        Math.floor(Math.random() * 5000) + 500, // viewCount
        Math.floor(Math.random() * 800) + 50,   // likeCount
        Math.floor(Math.random() * 300) + 20,   // saveCount
        Math.floor(Math.random() * 150) + 10,   // shareCount
        1 // isActive
      ]
    );
  }
  
  console.log(`✅ Seeded ${REELS.length} reels successfully!`);
  await conn.end();
}

seed().catch(err => { console.error('Seed failed:', err); process.exit(1); });
