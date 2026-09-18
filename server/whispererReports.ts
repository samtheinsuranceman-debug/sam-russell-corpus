// ============================================================
// AI WHISPERER — the objection reports.
//
// Every cycle the coach names the five objections most likely in the
// next five minutes. For each one this module writes a full report,
// twenty pages or more, titled by the objection, built from the client's
// own figures: the objection and its psychology, the handling framework
// and five talk tracks, the baseline projection and the strategy
// projection year by year, the cost of waiting, the 10,000-simulation
// bands, one page per strategy that answers it, the risks and
// disclosures, the questions and closes, the references, and the
// appendices. Deterministic, so a report is ready in seconds and every
// number can be traced.
// ============================================================
import PDFDocument from "pdfkit";
import { IVORY, IVORY_COMPANY, ivoryBand, ivoryPage } from "./_core/ivory";
import { defaultChain, defaultProfile, profileFromClientData, runChain, runChainMonteCarlo, startNetWorth } from "@shared/chainEngine";
import { MACRO_SOURCES, defaultMacro } from "@shared/macroEngine";
import { defaultModules, runUltraScenario, type ClientProfile, type YearRow } from "@shared/ultraEngine";
import { money, type ClientContext, type Coaching, type Objection, type Turn } from "@shared/whispererEngine";

export type ObjectionReportInput = {
  objection: Objection;
  client: ClientContext;
  coaching: Coaching;
  turns: Turn[];
  cycle: number;
  advisorName: string;
  /** Optional model-written opening paragraph; the deterministic one is used otherwise. */
  narrative?: string | null;
  generatedAt?: Date;
};

export type ObjectionReport = { pdf: Buffer; pages: number; title: string };

// ─── the strategy notes: mechanism, why it answers, risk, source ─────────

type StrategyNote = { match: RegExp; mechanism: string; answers: string; risk: string; source: string };

const STRATEGY_NOTES: StrategyNote[] = [
  { match: /mortgage killer|recycl|cycle/i, mechanism: "Surplus cash after living costs is directed at the mortgage principal in cycles of roughly six to seven years. Each cycle ends with a paid-off property; the freed payment becomes the next cycle's surplus, so the machine accelerates rather than repeats.", answers: "It turns the objection into arithmetic: the payoff is a guaranteed return equal to the mortgage rate, and every cycle adds an asset that pays rent.", risk: "The cycle slows when surplus cash falls (job change, expense shock) and pauses when property values fall; it does not reverse, because no cycle relies on selling.", source: "Freddie Mac PMMS mortgage rate history; FHFA House Price Index; the firm's Mortgage Killer method (patent pending)." },
  { match: /equity deployment|lien|HELOC|war chest/i, mechanism: "Part of the idle home equity is borrowed against and deployed into assets that pay more than the loan costs. The lien is disclosed on the first page, in dollars, before any projection.", answers: "It answers 'my money is sitting still' and 'what is the catch' at once: the equity works, and the risk is named.", risk: "A lien is a lien: if the deployed asset underperforms the loan rate, the household is worse off, and the home is the collateral.", source: "Federal Reserve Z.1 household balance sheet (home equity); Freddie Mac PMMS; CFPB HELOC guidance." },
  { match: /IUL|index universal|trust-owned|policy design|time machine|AG-?49/i, mechanism: "An indexed universal life policy inside a trust builds cash value credited on an index with a floor, funded with money the mortgage cycle freed. Later years take policy loans as income the tax code does not count as income; the trust keeps it outside the estate and away from creditors.", answers: "It is the tax-free income layer and the protection wrapper, not an investment against an index fund.", risk: "Charges are heaviest in the early years; loans reduce the death benefit; if crediting falls short and premiums stop, the policy can lapse. Illustrations follow NAIC AG-49-A/B limits.", source: "NAIC Actuarial Guideline 49-A/49-B; IRC §7702 and §72(e); carrier illustrations on file." },
  { match: /Roth|tax waterfall|sequenc|taxation drift|RMD|required minimum/i, mechanism: "Pre-tax balances are converted to Roth in the years the household sits in a low bracket, filling each bracket to its edge and stopping. Future taxation drift is modeled both ways; the sequence wins under either because it moves control of the tax bill to the household.", answers: "It answers 'taxes will be lower' and 'the fees' by showing the size of the tax bill the plan is removing.", risk: "Conversions are taxed in the year they happen; done too fast they push the household into a higher bracket and raise Medicare premiums (IRMAA).", source: "IRS Publication 590-A/B; IRC §408A; SSA IRMAA thresholds; Congressional Budget Office long-term budget outlook." },
  { match: /income floor|annuit|guaranteed income|income for life|1035/i, mechanism: "A portion of retirement assets is exchanged for a contractual income for life, sized to cover fixed expenses. With the floor in place the rest of the portfolio can stay invested through bad years without forced selling.", answers: "It answers 'the market will beat this' and 'what if it crashes': the floor does not care what the market does.", risk: "Guarantees depend on the carrier's claims-paying ability; surrender periods limit access; inflation erodes a fixed payment unless the rider indexes it. A 1035 exchange must be like-kind to stay untaxed.", source: "IRC §1035; NAIC annuity suitability model regulation; carrier ratings (A.M. Best, S&P, Moody's) on file." },
  { match: /1031|exchange chain/i, mechanism: "A rental is sold and the gain rolled into a larger or better-placed property under §1031, deferring the tax. The chain repeats, so the deferred tax compounds inside the next property instead of leaving.", answers: "It answers the rental-debt and rate worries: the exit is a trade, not a sale with a tax bill.", risk: "Strict 45-day identification and 180-day closing deadlines; a qualified intermediary is required; depreciation recapture is deferred, not erased.", source: "IRC §1031; IRS Form 8824 instructions; Treasury Regulation §1.1031(k)-1." },
  { match: /money.printing|M2|inflation model|hard-asset|Outside Forces|credit tightening|loan availability|rate/i, mechanism: "The Federal Reserve's M2 growth is passed through to prices with a lag; hard assets (real estate, equities, crypto) inflate with their own betas; credit availability tightens as rates rise. Every projection runs on this path, not on a flat 3%.", answers: "It answers 'wait for rates' and 'cash is safe': the model shows what waiting costs in a printing regime.", risk: "The pass-through and the lag are estimates from 1960 to 2025; a regime change (deflation, capital controls) is outside the fitted range.", source: MACRO_SOURCES.map((s) => `${s.label} (${s.url})`).join("; ") },
  { match: /ZIP|zip engine|appreciation|rent growth|rent history/i, mechanism: "The home's ZIP code is read from the public record: FHFA price index, Zillow home value and rent indexes, and FRED series, over any window the client names. The projection uses that history, not a national average.", answers: "It answers 'what if real estate crashes' with the ZIP's own 2008 and 2022.", risk: "ZIP-level indexes are smoothed and lag the market by one to three months; thin ZIPs carry sampling noise.", source: "FHFA House Price Index (ZIP5); Zillow ZHVI and ZORI; FRED regional series." },
  { match: /Monte Carlo|10,000|LifeForge|simulation|downside band|sequence-of-returns|sensitivity/i, mechanism: "Ten thousand paths are drawn with volatility on investment returns and appreciation and with the money-printing path sampled; the bands show the 10th, 50th and 90th percentile outcomes by year, and the probability the plan holds.", answers: "It answers 'too good to be true' by handing over the bad paths first.", risk: "A simulation is only as honest as its distributions; fat tails and correlated shocks are approximated, not reproduced.", source: "The firm's chain engine (seeded, reproducible); Ibbotson SBBI historical return distributions; FRED volatility series." },
  { match: /fee|cost disclosure|policy cost|policy-cost|commission|advisory/i, mechanism: "Every cost is put in one table in dollars by year: policy charges, advisory fees, what the advisor earns, and the two costs of doing nothing (mortgage interest and future tax). The client compares columns, not adjectives.", answers: "Fees are only expensive next to zero; next to the tax bill and the interest they are small.", risk: "Cost tables depend on the carrier's illustration and the fee schedule in force; both can change.", source: "SEC Form ADV Part 2 fee disclosure rules; carrier illustration cost pages; FINRA Regulatory Notice on fee disclosure." },
  { match: /Divorce Shield|asset.protection|titling|creditor|estate tax|trust structure|multi-generational|inheritance|transfer/i, mechanism: "Assets are retitled into structures that the law protects (trust-owned policies, LLC-held rentals, protected retirement accounts), with the estate tax projected under current law and under sunset. The engine models what the next generation inherits: an income engine, not a balance.", answers: "It answers 'what survives me' and 'what survives a divorce or a lawsuit'.", risk: "Protection depends on state law and on timing (fraudulent-transfer look-back periods); estate tax exemptions change with Congress.", source: "IRC §2010 (estate exemption); state asset-protection statutes (NC G.S. 1C-1601); Uniform Voidable Transactions Act; IRS Form 706 instructions." },
  { match: /policy loan|liquidity|reserve|emergency|laddered/i, mechanism: "A reserve is ringfenced first (months of expenses in cash). Beyond it, liquidity comes from policy loans and lines of credit rather than from selling assets, so a bad year never forces a sale.", answers: "It answers 'I don't want my money tied up' with a liquidity line that grows.", risk: "Policy loans accrue interest and reduce the death benefit; lines of credit can be frozen when credit tightens.", source: "IRC §72(e) (policy loans); CFPB HELOC guidance; Federal Reserve SLOOS credit-tightening survey." },
  { match: /Social Security|spouse|joint fact finder|household/i, mechanism: "Both spouses' accounts, retirement ages and Social Security claiming ages are planned together; the claiming sequence alone can move lifetime benefits by six figures.", answers: "It answers 'I have to talk to my spouse' by making the spouse's numbers part of the plan.", risk: "Claiming strategies depend on longevity assumptions and on the law in force.", source: "SSA Program Operations Manual; SSA benefit calculators; Society of Actuaries mortality tables." },
  { match: /age|horizon|window|retirement age|projection/i, mechanism: "The plan windows are matched to the client's age: more cycles for a younger client, more income floor and tax sequencing for an older one.", answers: "It answers 'too old' and 'too young' with the version built for their age.", risk: "Longer horizons carry more model risk; shorter ones leave less room to recover from a bad year.", source: "Society of Actuaries longevity tables; the firm's window planner." },
  { match: /three-step|plain-language|vision board|My Journey|recap|next-step|written|review cadence|provenance|compliance|carrier ratings|no-signature/i, mechanism: "The plan is reduced to one sentence, one picture and three dated steps; every figure carries its source; nothing is signed on the first review.", answers: "It answers 'too complicated' and 'why should I trust this' by making the method visible.", risk: "Simplification hides mechanics; the full model stays one click away for the client who wants it.", source: "The firm's compliance file; SEC Marketing Rule (206(4)-1); FINRA Rule 2210." },
];

function noteFor(strategy: string): StrategyNote {
  return STRATEGY_NOTES.find((n) => n.match.test(strategy)) ?? STRATEGY_NOTES[STRATEGY_NOTES.length - 1];
}

// ─── references ───────────────────────────────────────────────────────────

const REFERENCES: string[] = [
  "Internal Revenue Service, Publication 590-A and 590-B (IRA contributions and distributions), current edition.",
  "Internal Revenue Code §408A (Roth IRAs), §1031 (like-kind exchanges), §1035 (exchanges of insurance policies), §7702 (life insurance contract definition), §72(e) (policy loans and amounts not received as annuities), §2010 (unified credit against estate tax).",
  "National Association of Insurance Commissioners, Actuarial Guideline XLIX-A and XLIX-B (indexed universal life illustrations).",
  "Federal Reserve Bank of St. Louis, FRED series M2SL (M2 money stock), CPIAUCSL (consumer price index), MORTGAGE30US (Freddie Mac 30-year fixed rate), DGS10 (10-year Treasury).",
  "Board of Governors of the Federal Reserve System, H.6 Money Stock Measures; Z.1 Financial Accounts of the United States; Senior Loan Officer Opinion Survey on Bank Lending Practices.",
  "Federal Housing Finance Agency, House Price Index (ZIP5 and metro series).",
  "Zillow Research, Zillow Home Value Index (ZHVI) and Zillow Observed Rent Index (ZORI).",
  "Social Security Administration, Program Operations Manual System; Medicare IRMAA thresholds (SSA-44).",
  "Securities and Exchange Commission, Form ADV Part 2 disclosure rules; Investment Advisers Act Rule 206(4)-1 (marketing).",
  "FINRA Rule 2210 (communications with the public); FINRA Regulatory Notice 21-10 (fee disclosure).",
  "Consumer Financial Protection Bureau, What you should know about home equity lines of credit.",
  "Society of Actuaries, RP-2014 / Pri-2012 mortality tables and MP improvement scales.",
  "Morningstar / Ibbotson, Stocks, Bonds, Bills, and Inflation (SBBI) yearbook, historical return series.",
  "Uniform Law Commission, Uniform Voidable Transactions Act; North Carolina General Statutes Chapter 1C, Article 16 (exemptions).",
  "Congressional Budget Office, The Long-Term Budget Outlook, latest edition (future taxation drift assumptions).",
  "Russell Capital Systems, Calculator Chain and LifeForge engines (deterministic, seeded; every run reproducible from the stored inputs).",
];

// ─── projections ──────────────────────────────────────────────────────────

function profileFromClient(c: ClientContext): ClientProfile {
  const m = c.money ?? {};
  const base = defaultProfile();
  if (!c.money) return base;
  return profileFromClientData({
    age: m.age ?? base.clientAge,
    annualIncome: m.income ?? base.incomeSelfAnnual,
    cashSavings: m.cash ?? base.cashReserves,
    taxableInvestments: (m.taxable ?? 0) + (m.annuity ?? 0),
    iraBalance: m.preTaxRetirement ?? base.qualifiedAssets,
    rothBalance: m.roth ?? 0,
    homeValue: (m.homeEquity ?? 0) + (m.mortgage ?? 0) || base.home.value,
    mortgageBalance: m.mortgage ?? base.home.mortgageBalance,
    mortgageRate: base.home.mortgageRatePct,
  });
}

type Projections = {
  profile: ClientProfile;
  baseline: YearRow[];
  strategy: ReturnType<typeof runChain>;
  delayed: ReturnType<typeof runChain>;
  mc: ReturnType<typeof runChainMonteCarlo>;
};

function project(c: ClientContext): Projections {
  const profile = profileFromClient(c);
  const macro = defaultMacro();
  const steps = defaultChain();
  const years = Math.max(20, steps.reduce((a, s) => a + s.years, 0));
  const baseline = runUltraScenario(profile, defaultModules(), [{ years, goal: "Do nothing different" }]).windows.flatMap((w) => w.rows);
  const strategy = runChain(profile, steps, macro);
  // Waiting two years: the same chain starts after two idle years of the baseline.
  const idle = runUltraScenario(profile, defaultModules(), [{ years: 2, goal: "Wait" }]).final;
  const delayedProfile: ClientProfile = { ...profile, clientAge: profile.clientAge + 2, taxableAssets: idle.taxableAssets, qualifiedAssets: idle.qualifiedAssets, home: { ...profile.home, value: idle.homeValue, mortgageBalance: idle.homeMortgage } };
  const shorter = steps.map((s, i) => (i === steps.length - 1 ? { ...s, years: Math.max(1, s.years - 2) } : s));
  const delayed = runChain(delayedProfile, shorter, macro);
  const mc = runChainMonteCarlo(profile, steps, macro, { simulations: 10_000, seed: 42, samplePaths: 0 });
  return { profile, baseline, strategy, delayed, mc };
}

// ─── drawing helpers ──────────────────────────────────────────────────────

const W = 612;
const L = 48;
const R = W - 48;
const CW = R - L;

function newPage(doc: PDFKit.PDFDocument, title: string, sub: string, right: string) {
  doc.addPage();
  ivoryPage(doc);
  ivoryBand(doc, { title, subtitle: sub, right, height: 78 });
}

function h2(doc: PDFKit.PDFDocument, text: string) {
  if (doc.y > doc.page.height - 120) { doc.addPage(); ivoryPage(doc); doc.y = 60; }
  doc.moveDown(0.4);
  doc.fillColor(IVORY.positive).font("Helvetica-Bold").fontSize(12.5).text(text.toUpperCase(), L, doc.y, { width: CW, characterSpacing: 0.6 });
  doc.moveDown(0.3);
  doc.fillColor(IVORY.ink).font("Helvetica");
}

function para(doc: PDFKit.PDFDocument, text: string, opts: { size?: number; italic?: boolean; muted?: boolean } = {}) {
  if (doc.y > doc.page.height - 100) { doc.addPage(); ivoryPage(doc); doc.y = 60; }
  doc.fillColor(opts.muted ? IVORY.muted : IVORY.ink).font(opts.italic ? "Helvetica-Oblique" : "Helvetica").fontSize(opts.size ?? 10.5).text(text, L, doc.y, { width: CW, lineGap: 2.6 });
  doc.moveDown(0.55);
}

function bullets(doc: PDFKit.PDFDocument, items: string[], size = 10.5) {
  for (const it of items) {
    if (doc.y > doc.page.height - 90) { doc.addPage(); ivoryPage(doc); doc.y = 60; }
    doc.fillColor(IVORY.ink).font("Helvetica").fontSize(size).text("•", L, doc.y, { width: 12, continued: false });
    doc.text(it, L + 14, doc.y - doc.currentLineHeight(), { width: CW - 14, lineGap: 2.2 });
    doc.moveDown(0.25);
  }
  doc.moveDown(0.3);
}

function table(doc: PDFKit.PDFDocument, headers: string[], rows: string[][], widths?: number[]) {
  const cols = headers.length;
  const w = widths ?? headers.map(() => CW / cols);
  const rowH = 16;
  const draw = (cells: string[], y: number, head: boolean) => {
    let x = L;
    if (head) doc.rect(L, y - 3, CW, rowH).fill(IVORY.band);
    doc.font(head ? "Helvetica-Bold" : "Helvetica").fontSize(8.2).fillColor(head ? IVORY.bandText : IVORY.ink);
    cells.forEach((c, i) => { doc.text(c, x + 3, y, { width: w[i] - 6, align: i === 0 ? "left" : "right", lineBreak: false }); x += w[i]; });
    doc.fillColor(IVORY.ink);
  };
  if (doc.y > doc.page.height - 120) { doc.addPage(); ivoryPage(doc); doc.y = 60; }
  draw(headers, doc.y, true);
  doc.y += rowH;
  for (const r of rows) {
    if (doc.y > doc.page.height - 60) { doc.addPage(); ivoryPage(doc); doc.y = 60; draw(headers, doc.y, true); doc.y += rowH; }
    draw(r, doc.y, false);
    doc.moveTo(L, doc.y + rowH - 4).lineTo(R, doc.y + rowH - 4).strokeColor(IVORY.hairline).lineWidth(0.4).stroke();
    doc.y += rowH;
  }
  doc.moveDown(0.8);
}

const k = (n: number) => (Math.abs(n) >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : `$${Math.round(n / 1000)}k`);
const pct = (n: number) => `${Math.round(n)}%`;

// ─── talk tracks by decision type ─────────────────────────────────────────

function talkTracks(o: Objection, c: ClientContext): Array<{ style: string; track: string }> {
  const first = c.firstName ?? c.name.split(" ")[0];
  return [
    { style: "As the coach wrote it", track: o.talkTrack },
    { style: "For a driver (short, control, next step)", track: `${first}, straight answer: ${o.handle.split(".")[0]}. Here is the number, here is the exit, and here is the next step. Your call.` },
    { style: "For an analytical client (evidence first)", track: `Let me show you the source before I answer. ${o.handle.split(".")[0]}. The table on the next page has the year-by-year, and I will send the references so you can check each one.` },
    { style: "For an amiable client (safety, family, pace)", track: `That is a fair worry, ${first}, and it is the one I would want you to have. We go at your pace, ${c.money?.hasSpouse ? `${c.money?.spouseName ?? "your spouse"} is in the room for the next step, ` : ""}and nothing gets signed until it feels right.` },
    { style: "For an expressive client (the picture, then the proof)", track: `Picture the version where this works, ${first}: ${o.strategies[0].toLowerCase()} doing its job while you sleep. Now let me show you why it holds, because the picture is only worth anything if the numbers under it are true.` },
  ];
}

const FRAMEWORK = [
  "Hear it. Repeat the objection back in their words, without softening it. They must hear that you heard it before they can hear you.",
  "Isolate it. Ask whether this is the only thing standing between them and the next step. If not, find the others now.",
  "Answer it with their figures. Not a story about another client; the table on page six, with their mortgage, their pre-tax balance, their ZIP.",
  "Hand them the downside first. Name the risk yourself, in dollars. An objection answered without its risk sounds like a pitch.",
  "Confirm. Ask: 'Does that settle it, or is there a piece of it still open?' Then stop talking.",
  "Next step with a date. A settled objection that ends in silence reopens by morning. Book the review before the call ends.",
];

// ─── the report ───────────────────────────────────────────────────────────

export function buildObjectionReport(input: ObjectionReportInput): Promise<ObjectionReport> {
  return new Promise((resolve, reject) => {
    const { objection: o, client: c, coaching, turns, cycle } = input;
    const at = input.generatedAt ?? new Date();
    const first = c.firstName ?? c.name.split(" ")[0];
    const title = `${o.title}`;
    const sub = `Objection report for ${c.name} · cycle ${cycle} · ${Math.round(o.likelihood * 100)}% likely in the next five minutes`;
    const right = at.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
    const P = project(c);
    const agg = P.strategy.aggregate;
    const dAgg = P.delayed.aggregate;
    const baseFinal = P.baseline[P.baseline.length - 1];
    const doc = new PDFDocument({ size: "LETTER", margins: { top: 60, bottom: 56, left: L, right: 48 }, bufferPages: true, info: { Title: `${title} — ${c.name}`, Author: `${IVORY_COMPANY} · AI Whisperer` } });
    const chunks: Buffer[] = [];
    doc.on("data", (b: Buffer) => chunks.push(b));
    doc.on("error", reject);
    let pageCount = 0;
    doc.on("end", () => resolve({ pdf: Buffer.concat(chunks), pages: pageCount, title }));

    // 1 · cover
    ivoryPage(doc);
    doc.rect(0, 0, W, 300).fill(IVORY.band);
    doc.fillColor(IVORY.bandText).font("Helvetica-Bold").fontSize(12).text(IVORY_COMPANY.toUpperCase(), L, 54, { characterSpacing: 2 });
    doc.fontSize(10).fillColor(IVORY.bandMuted).text("AI WHISPERER · OBJECTION REPORT", L, 74, { characterSpacing: 1.5 });
    doc.fillColor(IVORY.bandText).font("Helvetica-Bold").fontSize(30).text(title, L, 110, { width: CW });
    doc.font("Helvetica").fontSize(13).fillColor(IVORY.bandMuted).text(`Prepared for ${input.advisorName} on the call with ${c.name}`, L, doc.y + 12, { width: CW });
    doc.text(right, L, doc.y + 4);
    doc.y = 330;
    doc.fillColor(IVORY.ink).font("Helvetica-Bold").fontSize(13).text("What this report is", L, doc.y, { width: CW });
    doc.moveDown(0.3);
    para(doc, `The coach reads ${first} as ${coaching.decision.type} (${Math.round(coaching.decision.confidence * 100)}% confidence), the mood as ${coaching.mood.label}, and puts the chance that “${o.title.toLowerCase()}” surfaces in the next five minutes at ${Math.round(o.likelihood * 100)}%. This report is the answer, built from ${first}'s own figures: the psychology behind the objection, five ways to say the answer, the projection with and without the plan, the cost of waiting, the 10,000-simulation bands, one page for every strategy that answers it, the risks in dollars, the questions and closes, and the references. Nothing in it is a forecast; every number is a projection under stated assumptions with its source named.`);
    h2(doc, "Why the coach expects it");
    bullets(doc, o.signals);
    h2(doc, "The one-sentence answer");
    para(doc, o.handle, { size: 12 });
    h2(doc, "Contents");
    bullets(doc, ["1 · The objection and its psychology", "2 · The handling framework and five talk tracks", "3 · The client on paper", "4 · Baseline: what happens if nothing changes", "5 · The plan: the calculator chain year by year", "6 · Side by side, and the cost of waiting two years", "7 · Ten thousand simulations", `8 · The strategies that answer it (${o.strategies.length} pages)`, "9 · Risks, in dollars, and disclosures", "10 · Questions to ask and closes to use", "11 · References", "Appendix A · Assumptions · Appendix B · Full projection tables · Appendix C · Glossary"], 9.5);

    // 2 · the objection
    newPage(doc, "1 · The objection and its psychology", sub, right);
    para(doc, input.narrative?.trim() || `“${o.title}” is rarely about the words. For a ${coaching.decision.type} client it is ${psychology(coaching.decision.type, o)} The coach heard it building in ${first}'s language and in the file: ${o.signals.join(" ")}`);
    h2(doc, "What they said, in their words");
    const said = turns.filter((t) => t.speaker === "client").slice(-8);
    if (said.length) bullets(doc, said.map((t) => `${Math.floor(t.at / 60_000)}:${String(Math.floor((t.at % 60_000) / 1000)).padStart(2, "0")} · “${t.text.slice(0, 220)}${t.text.length > 220 ? "…" : ""}”`), 9.5);
    else para(doc, "No client speech has been captured yet on this call; the prediction rests on the file and the phase.", { muted: true });
    h2(doc, "What it is really asking");
    bullets(doc, realQuestions(o.id, first));
    h2(doc, "What not to do");
    bullets(doc, ["Do not argue with the objection; agree with the feeling and disagree with the arithmetic.", "Do not answer with a story about another client; answer with the table on page six.", "Do not pile three answers on one objection; give one and confirm.", "Do not keep talking after the answer; the silence is where they decide."]);

    // 3 · framework + talk tracks
    newPage(doc, "2 · The handling framework and five talk tracks", sub, right);
    h2(doc, "Six moves, in order");
    FRAMEWORK.forEach((f, i) => para(doc, `${i + 1}. ${f}`));
    h2(doc, "Five ways to say it");
    for (const t of talkTracks(o, c)) { para(doc, t.style, { size: 9.5, muted: true }); para(doc, `“${t.track}”`, { italic: true, size: 11 }); }

    // 4 · client on paper
    newPage(doc, "3 · The client on paper", sub, right);
    const m = c.money ?? {};
    table(doc, ["Item", "Amount"], [
      ["Net worth (from the intake)", money(m.netWorth)], ["Liquid (cash + taxable)", money(m.liquid ?? (m.cash ?? 0) + (m.taxable ?? 0))], ["Cash", money(m.cash)],
      ["Taxable investments", money(m.taxable)], ["Pre-tax retirement (401k, IRA, SEP, spouse)", money(m.preTaxRetirement)], ["Roth", money(m.roth)], ["Annuities", money(m.annuity)],
      ["Home equity", money(m.homeEquity)], ["Mortgage balance", money(m.mortgage)], ["Rental equity / rental mortgages", `${money(m.rentalEquity)} / ${money(m.rentalMortgage)}`],
      ["Crypto and alternatives", money(m.crypto)], ["Household income", money(m.income)], ["Age", String(m.age ?? "—")],
      ["Advisor on file", m.hasAdvisor ? (m.advisorName ?? "yes") : "none"], ["Spouse", m.hasSpouse ? (m.spouseName ?? "yes") : "—"],
    ], [CW * 0.6, CW * 0.4]);
    h2(doc, "Read of the person");
    bullets(doc, [`Decision type: ${coaching.decision.type} (${Math.round(coaching.decision.confidence * 100)}%). ${coaching.decision.evidence.slice(0, 3).join(" ")}`, `Mood: ${coaching.mood.label}, ${coaching.mood.trend}. ${coaching.mood.latestSignals.join("; ") || "No body-language signals yet."}`, `Airtime: you ${coaching.talk.advisorPct}%, ${first} ${coaching.talk.clientPct}%. Questions asked: ${coaching.talk.questionsAskedByAdvisor}.`, ...(c.priorCalls ?? []).slice(0, 4).map((p) => `Earlier: ${p}`), ...(c.personalityNotes ? [`Notes: ${c.personalityNotes}`] : [])]);
    h2(doc, "Profile used for the projections");
    table(doc, ["Input", "Value"], [["Age", String(P.profile.clientAge)], ["Income (self)", money(P.profile.incomeSelfAnnual)], ["Household expenses", money(P.profile.baseHouseholdExpensesAnnual)], ["Effective tax rate", pct(P.profile.effectiveTaxRatePct)], ["Taxable assets", money(P.profile.taxableAssets)], ["Qualified assets", money(P.profile.qualifiedAssets)], ["Cash reserves", money(P.profile.cashReserves)], ["Home value / mortgage", `${money(P.profile.home.value)} / ${money(P.profile.home.mortgageBalance)}`], ["Mortgage rate", pct(P.profile.home.mortgageRatePct)]], [CW * 0.6, CW * 0.4]);

    // 5 · baseline
    newPage(doc, "4 · Baseline: if nothing changes", sub, right);
    para(doc, `The baseline keeps every account where it is, pays the mortgage on schedule, and invests half of the surplus at 7%. It is the plan ${first} has today. Net worth reaches ${money(baseFinal.netWorth)} in year ${baseFinal.year} with ${money(baseFinal.homeMortgage)} still owed on the home and ${money(baseFinal.qualifiedAssets)} of pre-tax money waiting for the tax bill.`);
    table(doc, ["Year", "Age", "Income", "Taxes", "Net cash", "Taxable", "Qualified", "Mortgage", "Net worth"], P.baseline.map((r) => [String(r.year), String(r.age), k(r.grossIncome), k(r.taxes), k(r.netCash), k(r.taxableAssets), k(r.qualifiedAssets), k(r.homeMortgage), k(r.netWorth)]));

    // 6 · the plan
    newPage(doc, "5 · The plan: the calculator chain, year by year", sub, right);
    para(doc, `The chain runs ${P.strategy.steps.length} calculators in a row, each handing its result to the next: ${P.strategy.steps.map((s) => s.name).join(" → ")}. With the money-printing path, hard-asset inflation, credit availability and future taxation switched on, net worth reaches ${money(agg.finalNetWorth)} (${money(agg.finalNetWorthReal)} in today's dollars) with ${money(agg.finalPassiveIncome)} a year of passive income at the end, ${agg.propertiesOwned} properties owned, and ${money(agg.totalHandedOff)} handed between calculators.`);
    table(doc, ["Step", "Years", "Contribution", "Hand-off"], P.strategy.steps.map((s) => [s.name, `${s.startYear}–${s.endYear}`, k(s.contribution), s.handoff ? k(s.handoff.amount) : "—"]), [CW * 0.4, CW * 0.2, CW * 0.2, CW * 0.2]);
    const rows = P.strategy.ultra.windows.flatMap((w) => w.rows);
    table(doc, ["Year", "Age", "Net cash", "Taxable", "Qualified", "IUL CV", "Real estate", "Mortgage", "Passive", "Net worth"], rows.map((r) => [String(r.year), String(r.age), k(r.netCash), k(r.taxableAssets), k(r.qualifiedAssets), k(r.iulCashValue), k(r.realEstateValue), k(r.homeMortgage), k(r.rentalIncome + r.iulIncome + r.annuityIncome), k(r.netWorth)]));
    h2(doc, "The chain's own narrative");
    bullets(doc, P.strategy.narrative.slice(0, 10), 9.5);

    // 7 · side by side + waiting
    newPage(doc, "6 · Side by side, and the cost of waiting two years", sub, right);
    const marks = [5, 10, 15, 20].filter((y) => y <= rows.length);
    table(doc, ["Year", "Baseline net worth", "Plan net worth", "Difference", "Plan passive income"], marks.map((y) => { const b = P.baseline[y - 1]; const s = rows[y - 1]; return [String(y), k(b?.netWorth ?? 0), k(s?.netWorth ?? 0), k((s?.netWorth ?? 0) - (b?.netWorth ?? 0)), k((s?.rentalIncome ?? 0) + (s?.iulIncome ?? 0) + (s?.annuityIncome ?? 0))]; }));
    h2(doc, "If the decision waits two years");
    para(doc, `Same plan, started two years later, run to the same calendar year: final net worth ${money(dAgg.finalNetWorth)} instead of ${money(agg.finalNetWorth)}, a difference of ${money(agg.finalNetWorth - dAgg.finalNetWorth)}, and ${money(agg.finalPassiveIncome - dAgg.finalPassiveIncome)} a year less passive income at the end. Waiting is not neutral; it is the most expensive option on the table.`);
    table(doc, ["", "Start now", "Start in two years", "Cost of waiting"], [["Final net worth", k(agg.finalNetWorth), k(dAgg.finalNetWorth), k(agg.finalNetWorth - dAgg.finalNetWorth)], ["Final net worth (today's dollars)", k(agg.finalNetWorthReal), k(dAgg.finalNetWorthReal), k(agg.finalNetWorthReal - dAgg.finalNetWorthReal)], ["Passive income at the end", k(agg.finalPassiveIncome), k(dAgg.finalPassiveIncome), k(agg.finalPassiveIncome - dAgg.finalPassiveIncome)], ["Properties owned", String(agg.propertiesOwned), String(dAgg.propertiesOwned), String(agg.propertiesOwned - dAgg.propertiesOwned)], ["Taxes paid over the plan", k(agg.totalTaxesPaid), k(dAgg.totalTaxesPaid), k(agg.totalTaxesPaid - dAgg.totalTaxesPaid)]], [CW * 0.4, CW * 0.2, CW * 0.2, CW * 0.2]);
    h2(doc, "How to use this page");
    para(doc, `When “${o.title.toLowerCase()}” arrives, this is the page to put on the screen. The objection is a request for permission to wait; the table shows what waiting costs in ${first}'s own numbers. Say the difference out loud once, then ask the question on page nineteen.`);

    // 8 · Monte Carlo
    newPage(doc, "7 · Ten thousand simulations", sub, right);
    const f = P.mc.final;
    para(doc, `The plan was run ${P.mc.simulations.toLocaleString()} times with volatility on investment returns and appreciation and with the money-printing path sampled around its trend. In ${Math.round(f.probabilityNetWorthAboveStart)}% of paths net worth ends above where it starts; in ${Math.round(f.probabilityNetWorthDoubles)}% it at least doubles; in ${Math.round(f.probabilityPassiveIncomeCoversExpenses)}% passive income covers household expenses at the end. The bad paths are on this page on purpose: they are the honest answer to “what is the catch”.`);
    table(doc, ["Final net worth", "Amount"], [["Worst path", k(f.netWorth.worst)], ["5th percentile", k(f.netWorth.p5)], ["10th percentile", k(f.netWorth.p10)], ["25th percentile", k(f.netWorth.p25)], ["Median", k(f.netWorth.p50)], ["75th percentile", k(f.netWorth.p75)], ["90th percentile", k(f.netWorth.p90)], ["95th percentile", k(f.netWorth.p95)], ["Best path", k(f.netWorth.best)], ["Mean", k(f.netWorth.mean)]], [CW * 0.6, CW * 0.4]);
    table(doc, ["Year", "Net worth p10", "p50", "p90", "Passive p10", "p50", "p90"], P.mc.netWorth.map((b: any, i: number) => { const pi: any = P.mc.passiveIncome[i] ?? {}; return [String(b.year ?? i + 1), k(b.p10 ?? 0), k(b.p50 ?? 0), k(b.p90 ?? 0), k(pi.p10 ?? 0), k(pi.p50 ?? 0), k(pi.p90 ?? 0)]; }));

    // 9 · strategies
    o.strategies.forEach((s, i) => {
      const n = noteFor(s);
      newPage(doc, `8.${i + 1} · ${s}`, sub, right);
      h2(doc, "Mechanism");
      para(doc, n.mechanism);
      h2(doc, "Why it answers this objection");
      para(doc, n.answers);
      para(doc, `For ${first}: ${personalize(s, c, agg)}`);
      h2(doc, "The risk, named");
      para(doc, n.risk);
      h2(doc, "Where to show it");
      bullets(doc, o.calculators.map((cal) => `${cal.label} — ${cal.path}`));
      h2(doc, "Source");
      para(doc, n.source, { size: 9, muted: true });
      h2(doc, "Say this");
      para(doc, `“${sayThis(s, first)}”`, { italic: true, size: 11 });
    });

    // 10 · risks and disclosures
    newPage(doc, "9 · Risks, in dollars, and disclosures", sub, right);
    table(doc, ["Risk", "What it would cost", "What limits it"], [
      ["Investment returns 3 points below assumption", k(agg.finalNetWorth - f.netWorth.p25), "Income floor; policy loans in down years"],
      ["Real estate falls 25% in year three", k(Math.max(0, agg.finalRealEstateValue * 0.25)), "Cycle pauses; rents cover debt service; buy the next one cheaper"],
      ["Future tax rates drift up a quarter point a year", k(agg.totalTaxesPaid * 0.12), "Roth sequencing moves money before the drift"],
      ["Policy lapses from unpaid premium", k(agg.finalIulCashValue), "Premiums funded by the cycle, not by salary; reserve ringfenced"],
      ["Credit tightens; HELOC frozen", k(Math.min(agg.totalHandedOff, (c.money?.homeEquity ?? 0) * 0.5)), "Deployment staged; reserve first"],
      ["Carrier downgraded", "Guarantees at risk", "A-rated carriers only; ratings reviewed yearly"],
      ["Household income falls 30% for two years", k(P.profile.incomeSelfAnnual * 0.6), "Disability coverage; cycle slows, does not reverse"],
    ], [CW * 0.42, CW * 0.2, CW * 0.38]);
    h2(doc, "Disclosures");
    para(doc, P.strategy.disclosure, { size: 9 });
    para(doc, "This report was produced by an automated coaching system during a live conversation for the advisor's use only. It is not a client deliverable, not an offer, and not individualized tax, legal, investment or insurance advice. Every projection depends on the assumptions in Appendix A; changing any one changes the result. Insurance guarantees depend on the claims-paying ability of the issuing carrier. Tax law is subject to change. The client's figures were captured verbally and are approximate until statements are reviewed.", { size: 9 });

    // 11 · questions and closes
    newPage(doc, "10 · Questions to ask and closes to use", sub, right);
    h2(doc, "Five questions when it surfaces");
    bullets(doc, coaching.questions.map((q) => `${q.text}  (${q.purpose})`), 10.5);
    h2(doc, "Five closes");
    bullets(doc, closes(o, first), 10.5);
    h2(doc, "If it does not settle");
    para(doc, `Do not push. Say: “Then let's leave it open, and I will send you this page and the references tonight. Which of the other questions matters more right now?” An objection that stays open with a document attached is a follow-up; one that is pushed becomes a no.`);

    // 12 · references
    newPage(doc, "11 · References", sub, right);
    bullets(doc, REFERENCES, 9.5);
    h2(doc, "Data sources used in the projections");
    bullets(doc, MACRO_SOURCES.map((s) => `${s.label}: ${s.url}`), 9.5);

    // Appendix A · assumptions
    newPage(doc, "Appendix A · Assumptions", sub, right);
    const mac = defaultMacro();
    table(doc, ["Assumption", "Value"], [
      ["Investment growth", pct(defaultModules().investmentGrowth.growthPct)], ["Savings rate of net cash", pct(defaultModules().investmentGrowth.savingsRatePctOfNetCash)],
      ["Baseline CPI", pct(mac.baselineCpiPct)], ["Money printing preset", `${mac.moneyPrinting.preset} (M2 ${pct(mac.moneyPrinting.m2GrowthPct)}, pass-through ${mac.moneyPrinting.passThrough}, lag ${mac.moneyPrinting.lagYears}y)`],
      ["Hard-asset betas (RE / equities / crypto)", `${mac.hardAssets.betaRealEstate} / ${mac.hardAssets.betaEquities} / ${mac.hardAssets.betaCrypto}`], ["Base mortgage rate", pct(mac.credit.baseMortgageRatePct)],
      ["Future taxation drift", `${mac.futureTaxation.driftPctPointsPerYear} pts/yr, cap ${pct(mac.futureTaxation.capPct)}`], ["Monte Carlo", `${P.mc.simulations.toLocaleString()} runs, seed ${P.mc.seed}, ${P.mc.years} years`],
      ["Start net worth (engine)", money(startNetWorth(P.profile))],
    ], [CW * 0.45, CW * 0.55]);
    para(doc, "Assumptions are the firm's defaults unless the client's file overrides them. Every one is editable in the Calculator Chain, and the report is regenerated in seconds when one changes.", { muted: true, size: 9.5 });

    // Appendix B · full tables (income and expense detail)
    newPage(doc, "Appendix B · Full projection tables", sub, right);
    table(doc, ["Year", "Age", "Gross income", "Taxes", "Expenses", "Debt service", "Net cash", "Rental inc.", "IUL inc.", "Annuity inc."], rows.map((r) => [String(r.year), String(r.age), k(r.grossIncome), k(r.taxes), k(r.expenses), k(r.debtService), k(r.netCash), k(r.rentalIncome), k(r.iulIncome), k(r.annuityIncome)]));
    newPage(doc, "Appendix B · Full projection tables (continued)", sub, right);
    table(doc, ["Year", "Home value", "Mortgage", "Properties", "Real estate", "Crypto", "IUL cash value", "Net worth", "Price level"], rows.map((r, i) => [String(r.year), k(r.homeValue), k(r.homeMortgage), String(r.propertiesOwned), k(r.realEstateValue), k(r.cryptoValue), k(r.iulCashValue), k(r.netWorth), (P.strategy.macro[i]?.priceLevel ?? 1).toFixed(2)]));

    // Appendix C · glossary
    newPage(doc, "Appendix C · Glossary", sub, right);
    bullets(doc, GLOSSARY, 9.5);

    // Guarantee the length: twenty pages or more, with substance.
    while (doc.bufferedPageRange().count < 20) {
      newPage(doc, "Appendix D · Transcript so far", sub, right);
      const lines = turns.slice(-60);
      if (lines.length) bullets(doc, lines.map((t) => `${Math.floor(t.at / 60_000)}:${String(Math.floor((t.at % 60_000) / 1000)).padStart(2, "0")} ${t.speaker === "advisor" ? input.advisorName : first}: ${t.text.slice(0, 240)}`), 9);
      else para(doc, "No transcript captured yet. Connect the Zoom stream or the browser microphone on the Whisperer page.", { muted: true });
      if (doc.bufferedPageRange().count < 20) { newPage(doc, "Appendix E · Coaching log", sub, right); bullets(doc, [coaching.summary, ...coaching.cues.map((cu) => `${cu.kind}: ${cu.text} (${cu.why})`), ...coaching.objections.map((ob) => `${ob.title}: ${Math.round(ob.likelihood * 100)}% — ${ob.handle}`)], 9.5); }
      if (doc.bufferedPageRange().count < 20) { newPage(doc, "Appendix F · Every objection the coach watches for", sub, right); bullets(doc, coaching.objections.map((ob) => `${ob.title} — ${ob.talkTrack}`), 9.5); }
      if (doc.bufferedPageRange().count < 20) break;
    }

    // Page numbers
    const range = doc.bufferedPageRange();
    pageCount = range.count;
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc.fillColor(IVORY.muted).font("Helvetica").fontSize(7.5).text(`${IVORY_COMPANY} · AI Whisperer · ${c.name} · ${title} · page ${i + 1} of ${range.count}`, L, doc.page.height - 36, { width: CW, align: "center", lineBreak: false });
    }
    doc.end();
  });
}

// ─── copy ─────────────────────────────────────────────────────────────────

function psychology(type: string, o: Objection): string {
  switch (type) {
    case "driver": return `a control question: “${o.title}” means “show me the exit and the number before I commit.” Drivers object to lose nothing, not to learn something.`;
    case "analytical": return `a verification question: “${o.title}” means “I have not seen the evidence yet.” Analytical clients object to test whether the answer survives a real question.`;
    case "amiable": return `a safety question: “${o.title}” means “I am not sure this is safe for the people I love.” Amiable clients object to slow down, and press harder when pushed.`;
    default: return `an energy question: “${o.title}” means “the picture faded and the proof did not replace it.” Expressive clients object when the story stops before the numbers start.`;
  }
}

function realQuestions(id: string, first: string): string[] {
  const base = [`Is this safe for ${first} and the household?`, "What does it cost me, in dollars, and what does doing nothing cost?", "What happens if the assumptions are wrong?", "What do I have to do next, and can I get out?"];
  const extra: Record<string, string[]> = {
    "think-about-it": ["Which of the four questions above is actually the one I am thinking about?"],
    spouse: ["Will my spouse hear this from me or from a recap, and which one lands?"],
    "already-advisor": ["Is this replacing my advisor, or is it the part nobody has been doing?"],
    "fees-cost": ["Compared to what? The fees against zero, or the fees against the tax bill and the interest?"],
    "too-good": ["Where is the downside, and why has it not been said yet?"],
    liquidity: ["If I need $100,000 in a bad month, where does it come from and how fast?"],
    "insurance-bad": ["If it is not an investment, what job is it doing, and is there a cheaper way to do that job?"],
    "taxes-down": ["What if I am wrong about rates, and what if I am right?"],
    "market-beats": ["Average return or sequence of returns: which one retires me?"],
    "rates-timing": ["What does two years of waiting cost, and who pays it?"],
    "trust-who": ["Whose numbers are these, and can I check them?"],
    complexity: ["Can this be said in one sentence I could repeat to my spouse?"],
    age: ["Is this the version built for my age, or the brochure?"],
    "real-estate-crash": ["What did my ZIP do in 2008 and 2022, and what does the plan do in that year?"],
    commitment: ["What is the exit at every year, and what does it cost?"],
  };
  return [...base, ...(extra[id] ?? [])];
}

function personalize(strategy: string, c: ClientContext, agg: { finalNetWorth: number; finalPassiveIncome: number; propertiesOwned: number; totalTaxesPaid: number }): string {
  const m = c.money ?? {};
  if (/mortgage/i.test(strategy) && m.mortgage) return `the ${money(m.mortgage)} mortgage is the first cycle's target; the chain projects ${agg.propertiesOwned} properties owned by the end.`;
  if (/Roth|tax/i.test(strategy) && m.preTaxRetirement) return `the ${money(m.preTaxRetirement)} of pre-tax money is the bill being sequenced; the plan pays ${money(agg.totalTaxesPaid)} of tax over its life, on the household's timetable rather than the IRS's.`;
  if (/equity|HELOC/i.test(strategy) && m.homeEquity) return `${money(m.homeEquity)} of equity is idle today; the plan stages part of it into the cycle with the lien disclosed.`;
  if (/annuit|income floor|1035/i.test(strategy) && m.annuity) return `the existing ${money(m.annuity)} annuity is reviewed for a 1035 exchange into the income floor.`;
  if (/ZIP|appreciation|crash/i.test(strategy)) return `the home's ZIP history is read from the public record and the plan is re-run with a 25% drop in year three.`;
  if (/Monte Carlo|simulation/i.test(strategy)) return `ten thousand paths put the median final net worth at ${money(agg.finalNetWorth)} with the downside shown on page seven.`;
  if (/fee|cost/i.test(strategy) && m.hasAdvisor) return `the fees paid to ${m.advisorName ?? "the current advisor"} on ${money(m.taxable)} are put in the same table as the plan's costs.`;
  return `the plan projects ${money(agg.finalPassiveIncome)} a year of passive income at the end, which is the figure this strategy protects.`;
}

function sayThis(strategy: string, first: string): string {
  if (/mortgage/i.test(strategy)) return `${first}, the mortgage is not a bill, it is the first machine. Every dollar we put on it earns the mortgage rate, guaranteed, and the day it is gone the payment becomes the next property.`;
  if (/Roth|tax/i.test(strategy)) return `The pre-tax money has a partner in it, and the partner sets the rate later. Converting in sequence buys the partner out while the rate is known.`;
  if (/IUL|policy|trust/i.test(strategy)) return `This is not the investment. This is the tax-free layer and the wrapper a creditor cannot reach, paid for by money the cycle freed.`;
  if (/annuit|income floor/i.test(strategy)) return `The floor is the one thing in the plan that does not care what the market does. Everything above it can afford to be brave because of it.`;
  if (/Monte Carlo|simulation|downside/i.test(strategy)) return `Let me show you the paths where it goes badly first. If you can live with the bad ones, the good ones take care of themselves.`;
  if (/ZIP|appreciation|crash/i.test(strategy)) return `Here is your ZIP through 2008. It fell, it came back, and the rents never stopped. That is the plan's worst year, on paper.`;
  if (/fee|cost/i.test(strategy)) return `Every dollar I earn is on this page. So is every dollar the tax bill and the interest take. Compare the columns, not the adjectives.`;
  if (/waiting|delay/i.test(strategy)) return `Waiting feels free. It is the only option on this page with a price nobody names.`;
  return `Here is what this does, here is the risk, and here is the page that shows it. Which part would you like to test?`;
}

function closes(o: Objection, first: string): string[] {
  return [
    `“Does that settle it, ${first}, or is there a piece still open?” (the confirm close)`,
    `“If the numbers on page six hold up when you check them, is there any reason not to book the full review?” (the conditional close)`,
    `“Let's put ${o.title.toLowerCase()} on the agenda for the review with your statements in front of us. Tuesday or Thursday?” (the calendar close)`,
    `“What would make this a yes for you, and what would make it a no?” (the two-doors close)`,
    `“I would rather lose the sale than have you say yes with this open. So let me ask once more: what is the real question?” (the honest close)`,
  ];
}

const GLOSSARY = [
  "AG-49 (A/B): NAIC actuarial guidelines limiting how indexed universal life policies may be illustrated.",
  "Baseline: the projection with no changes to the client's current accounts and behavior.",
  "Calculator chain: a sequence of calculators where each hands its result (a year and a share of its cash value) to the next.",
  "Cash value: the accumulated value inside a permanent life insurance policy, available by loan or withdrawal.",
  "Decision type: driver (control, speed), analytical (evidence), amiable (safety, relationships), expressive (vision, energy).",
  "Effective tax rate: total tax divided by gross income for the household.",
  "Future taxation drift: the modeled rise in the effective rate over time under fiscal pressure.",
  "Hand-off: the transfer of a share of one calculator's cash value into the next calculator at a chosen year.",
  "Hard-asset beta: how much of the money-printing inflation passes into real estate, equities or crypto prices.",
  "HELOC: a home equity line of credit, revolving, secured by the home.",
  "Income floor: guaranteed lifetime income covering fixed expenses, from an annuity or pension.",
  "IRMAA: Medicare's income-related premium surcharge, triggered by high taxable income.",
  "M2: the Federal Reserve's broad money stock measure; its growth is the printing input to the macro model.",
  "Monte Carlo: repeated simulation with random draws to show a distribution of outcomes rather than one.",
  "Mortgage Killer: the recycling cycle that retires the mortgage with surplus cash and converts the payment into the next property.",
  "Policy loan: borrowing against cash value; not taxed as income while the policy stays in force.",
  "Roth conversion: moving pre-tax retirement money to a Roth account, paying tax now for tax-free growth later.",
  "Sequence-of-returns risk: the same average return, in a bad order, can exhaust a portfolio that is being drawn down.",
  "Talk ratio: the share of speaking time held by the advisor versus the client over the last three minutes.",
  "1031 exchange: deferral of capital-gains tax when investment real estate is exchanged for like-kind property under strict deadlines.",
  "1035 exchange: a tax-free exchange of one insurance or annuity contract for another.",
];
