# API Catalogue — 160 feeds Thomas Goldman can be wired to

Ranked for the mission: predict Treasury liquidation by Japan and China, oil
leaving the dollar, sovereign distress, a Taiwan strike — and everything those
ripple into. Each row: what it gives, how it is reached, whether a key is
needed, and a priority.

Priority: **P1** wire this month (moves a model), **P2** wire this quarter
(adds coverage or corroboration), **P3** when a client asks (nice, not
necessary). Sources already in `shared/macro/sources.ts` are marked ★.

Access: `open` = no key; `key` = free key; `paid` = subscription; `page` =
HTML parse; `mcp` = a Model Context Protocol server exists (the Brain Hub can
take it as one of its forty slots).

## A. United States — Treasury market, Fed, fiscal (24)

| # | Feed | Gives | Access | Pri |
|---|---|---|---|---|
| 1 | ★ Treasury TIC Major Foreign Holders (mfh.txt) | Holdings by country, monthly | open | P1 |
| 2 | ★ TIC monthly press release + SLT tables | Net official vs private flows, transaction basis | page | P1 |
| 3 | ★ FRED API | 800k series: DGS10, MORTGAGE30US, DTWEXBGS, GFDEGDQ188S, FDHBFIN | key | P1 |
| 4 | ★ Fed H.4.1 custody holdings | Weekly foreign official custody — 4 weeks ahead of TIC | open | P1 |
| 5 | ★ FIMA repo facility | Foreign official dollar borrowing against Treasuries | open | P1 |
| 6 | ★ TreasuryDirect / Fiscal Data auctions API | Indirect bidder share per auction | open | P1 |
| 7 | ★ Fiscal Data — Debt to the Penny, interest expense, MTS | Daily debt, monthly interest | open | P1 |
| 8 | ★ CBO outlooks | 10-year debt path | page | P2 |
| 9 | Fed FOMC statements / minutes / SEP | Policy path, balance-sheet stance | page | P1 |
| 10 | NY Fed ACM term premium | Daily 10-year term premium | open | P1 |
| 11 | NY Fed SOMA holdings | Fed's own Treasury book, weekly | open | P2 |
| 12 | NY Fed primary dealer statistics | Dealer positions and financing | open | P2 |
| 13 | SIFMA Treasury trading volume | Daily volume, the liquidity denominator | page | P2 |
| 14 | Treasury Quarterly Refunding statement + TBAC | Issuance mix, buybacks | page | P2 |
| 15 | OFR Financial Stress Index | Daily composite stress | open | P2 |
| 16 | OFR Hedge Fund Monitor | Basis-trade leverage — the amplifier of any foreign sale | open | P2 |
| 17 | CFTC Commitments of Traders (Treasury futures) | Leveraged fund short in futures | open | P2 |
| 18 | ★ OFAC SDN list + general licences | Sanctions — the trigger for reserve diversification | open | P1 |
| 19 | BEA international transactions | Quarterly BoP incl. official reserve flows | open | P3 |
| 20 | ★ ODNI Annual Threat Assessment | Stated Taiwan judgement | page | P1 |
| 21 | ★ DoD China Military Power Report | PLA capability milestones | page | P2 |
| 22 | USTR / Commerce BIS entity list | Export controls on China | open | P2 |
| 23 | Congress.gov API | Bills naming Taiwan, Treasuries, China sanctions | key | P2 |
| 24 | Federal Register API | Final rules and executive orders | open | P2 |

## B. Japan (18)

| # | Feed | Gives | Access | Pri |
|---|---|---|---|---|
| 25 | ★ MOF international reserves | Monthly reserves; the foreign-securities line | page | P1 |
| 26 | ★ MOF intervention operations | Confirmed amounts, day by day quarterly | page | P1 |
| 27 | ★ MOF weekly portfolio flows | Foreign bond purchases by investor type | page | P1 |
| 28 | ★ MOF JGB auctions and plan | Domestic yield pull | page | P1 |
| 29 | ★ MOF minister press conferences | Signalling; FIMA, coordination | page | P1 |
| 30 | ★ BOJ MPM statements / Outlook | Rate path, taper | page | P1 |
| 31 | ★ BOJ time-series statistics | Flow of funds, BoP | open | P2 |
| 32 | ★ GPIF quarterly | Foreign bond weight | page | P2 |
| 33 | ★ Life Insurance Association / nine majors' plans | Hedged-vs-unhedged intentions | manual | P1 |
| 34 | ★ FSA | ESR solvency regime | page | P3 |
| 35 | ★ Kantei speeches | Cabinet signalling | page | P2 |
| 36 | ★ Diet proceedings (kokkai.ndl.go.jp API) | Ministers under questioning | open | P2 |
| 37 | ★ e-Gov law search / Kanpō | Enacted law feed | page | P2 |
| 38 | ★ JSDA bond trading by investor | Domestic mirror | page | P3 |
| 39 | ★ Nikkei Asia | Best-sourced Japan reporting | manual | P1 |
| 40 | ★ Japan Times RSS | English wire | open | P2 |
| 41 | Japan Exchange Group (JPX) statistics | Foreign investor equity flows | open | P3 |
| 42 | Japan Post Bank / Norinchukin disclosures | Two very large foreign-bond books | page | P2 |

## C. China and Hong Kong (24)

| # | Feed | Gives | Access | Pri |
|---|---|---|---|---|
| 43 | ★ SAFE official reserves | FX reserves and gold, monthly | page | P1 |
| 44 | ★ SAFE BoP / IIP | Flow basis; portfolio abroad | page | P2 |
| 45 | ★ PBOC gold announcements | The 22-month streak | page | P1 |
| 46 | ★ PBOC MPC statements | Yuan and reserve stance | page | P2 |
| 47 | ★ PBOC RMB Internationalization Report | Yuan settlement volumes | page | P2 |
| 48 | ★ CIPS statistics | Yuan clearing plumbing | page | P1 |
| 49 | ★ State Council gazette | Law and mandate feed | page | P1 |
| 50 | ★ NPC laws | Anti-Secession, Foreign Relations, Anti-Sanctions | page | P1 |
| 51 | ★ MFA daily briefings | Declared positions | page | P1 |
| 52 | ★ MOFCOM announcements | Export controls, UEL | page | P1 |
| 53 | ★ Taiwan Affairs Office | Taiwan messaging | page | P1 |
| 54 | ★ MND / Eastern Theater Command | Exercise announcements | page | P1 |
| 55 | ★ NBS | GDP, output, trade | open | P2 |
| 56 | ★ MOF China | Fiscal and LGB data | page | P2 |
| 57 | ★ Xinhua RSS | Verbatim positions | open | P1 |
| 58 | ★ People's Daily / Qiushi | Party line | manual | P2 |
| 59 | ★ Global Times | Sabre-rattling channel | open | P2 |
| 60 | ★ HKMA data | HK Treasury holdings, CNH pool | open | P2 |
| 61 | ★ GACC customs | Crude imports by origin | page | P1 |
| 62 | ★ Shanghai INE | Yuan crude futures | page | P1 |
| 63 | ★ SGE | International board gold | page | P1 |
| 64 | CFETS | CNY fixing and basket | page | P2 |
| 65 | China Bond (ChinaBond / CCDC) | Foreign holdings of CGBs — the mirror image of China's Treasury sales | page | P2 |
| 66 | Hong Kong CSD / Bond Connect statistics | Foreign flows into yuan bonds | open | P3 |

## D. Taiwan (10)

| # | Feed | Gives | Access | Pri |
|---|---|---|---|---|
| 67 | ★ MND Taiwan daily PLA activity | The heartbeat series | page | P1 |
| 68 | ★ Coast Guard Administration | Kinmen/Matsu incursions | page | P1 |
| 69 | ★ Mainland Affairs Council | Statements, polling | page | P2 |
| 70 | ★ CBC Taiwan | Reserves, TWD | page | P2 |
| 71 | ★ TSMC IR | On-island share of advanced nodes | page | P2 |
| 72 | Taiwan MOEA export orders | Chip-order tell | open | P3 |
| 73 | Taiwan Stock Exchange foreign flows | Capital-flight tell | open | P2 |
| 74 | ★ Japan MOD Joint Staff releases | Miyako transits | page | P2 |
| 75 | Philippines DND / AFP releases | Southern flank, Bashi Channel | page | P3 |
| 76 | US INDOPACOM releases | Carrier presence, transits | page | P2 |

## E. Oil and energy (22)

| # | Feed | Gives | Access | Pri |
|---|---|---|---|---|
| 77 | ★ EIA API v2 | Prices, production, consumption, imports | key | P1 |
| 78 | ★ IEA Oil Market Report | Trade flows | page | P1 |
| 79 | ★ OPEC MOMR | Member exports, ORB | page | P2 |
| 80 | ★ JODI | Country-reported oil data | open | P1 |
| 81 | ★ UN Comtrade | Bilateral trade, 1962– | key | P1 |
| 82 | ★ Kpler | Cargo tracking | paid | P1 |
| 83 | ★ Vortexa | Seaborne flows | paid | P1 |
| 84 | ★ Argus | Assessments incl. Urals | paid | P2 |
| 85 | ★ Platts | Benchmarks, yuan settlement estimate | paid | P2 |
| 86 | ★ Saudi SAMA bulletin | Reserves | page | P1 |
| 87 | ★ Saudi Aramco IR | Sales by region | page | P2 |
| 88 | ★ CBUAE | Swap lines | page | P1 |
| 89 | ★ ICE Futures Abu Dhabi (Murban) | Benchmark | page | P3 |
| 90 | ★ RBI | Vostro rupee settlement | page | P1 |
| 91 | ★ PPAC India | Import mix | page | P1 |
| 92 | ★ Bank of Russia settlement-currency stats | Export settlement by currency | page | P1 |
| 93 | ★ MOEX | CNY/RUB turnover | page | P2 |
| 94 | ★ Banco Central do Brasil | Yuan clearing | open | P3 |
| 95 | ★ Lloyd's JWC | War-risk areas | page | P1 |
| 96 | ★ MarineTraffic / Windward AIS | Transits, dark periods | paid | P2 |
| 97 | Baker Hughes rig count | Supply response | open | P3 |
| 98 | Dubai Mercantile Exchange (Oman) | Middle East benchmark | page | P3 |

## F. Multilateral and reserves (16)

| # | Feed | Gives | Access | Pri |
|---|---|---|---|---|
| 99 | ★ IMF WEO datamapper API | Debt/GDP, 196 economies | open | P1 |
| 100 | ★ IMF Fiscal Monitor | Interest burdens, financing needs | page | P1 |
| 101 | ★ IMF Article IV | DSAs, China augmented debt | page | P2 |
| 102 | ★ IMF COFER | Reserve currency shares | open | P1 |
| 103 | IMF IFS / SDMX API | Reserves, rates, 190 countries | open | P2 |
| 104 | IMF Global Debt Database | Private + public debt, 1950– | open | P2 |
| 105 | ★ World Bank WDI / IDS API | Debt, external debt | open | P1 |
| 106 | ★ BIS total credit | Non-financial debt/GDP (China 300 %) | open | P1 |
| 107 | ★ BIS Triennial FX survey | Currency turnover | open | P3 |
| 108 | BIS international banking statistics | Cross-border dollar claims | open | P2 |
| 109 | BIS debt securities statistics | Sovereign issuance by currency | open | P2 |
| 110 | ★ OECD sovereign borrowing | Refinancing walls | open | P2 |
| 111 | ★ Eurostat gov finance API | Quarterly Maastricht debt | open | P1 |
| 112 | ★ UNCTAD World of Debt | Distress list | page | P3 |
| 113 | ★ IIF Global Debt Monitor | Total global debt | manual | P2 |
| 114 | ★ SWIFT RMB Tracker | Payment shares | page | P1 |

## G. Markets and pricing (16)

| # | Feed | Gives | Access | Pri |
|---|---|---|---|---|
| 115 | ★ S&P Global sovereign CDS | Market-implied default odds | paid | P1 |
| 116 | ★ Fitch / Moody's / S&P rating actions | Rating changes | manual | P1 |
| 117 | Alpha Vantage | FX, commodities, equities; free tier | key | P2 |
| 118 | Twelve Data | FX and index intraday | key | P3 |
| 119 | Polygon.io | US equities, options | key/paid | P3 |
| 120 | Finnhub | News, economic calendar | key | P2 |
| 121 | Trading Economics API | 20M indicators, calendar, forecasts | paid | P1 |
| 122 | Nasdaq Data Link | Commodity and macro datasets | key | P3 |
| 123 | Tullett Prebon / Refinitiv term rates | Swap rates | paid | P3 |
| 124 | CME FedWatch | Rate-path probabilities | page | P2 |
| 125 | ICE / CME Treasury futures OI | Positioning | page | P3 |
| 126 | World Gold Council API | Central-bank gold demand | key | P1 |
| 127 | LBMA gold prices | Benchmark fixes | open | P2 |
| 128 | ★ Zacks Data (MCP) | Fundamentals, ETF holdings incl. Treasury ETFs | mcp | P2 |
| 129 | Bloomberg B-PIPE / BLPAPI | Everything, at Bloomberg prices | paid | P3 |
| 130 | Refinitiv / LSEG Data Platform | Everything else | paid | P3 |

## H. Prediction, sentiment, alt-data (12)

| # | Feed | Gives | Access | Pri |
|---|---|---|---|---|
| 131 | ★ Polymarket Gamma API | Crowd odds on Taiwan, Fed, elections | open | P1 |
| 132 | Metaculus API | Forecaster community odds | open | P2 |
| 133 | Kalshi API | Regulated event contracts | key | P2 |
| 134 | GDELT 2.0 API | Global event/tone database, 15-min | open | P1 |
| 135 | ACLED | Conflict events | key | P2 |
| 136 | Google Trends (pytrends) | Search-interest tells | open | P3 |
| 137 | X / Twitter API | Official-account posts (MFA, MOF) | paid | P3 |
| 138 | Telegram public channels | Russian/Chinese trade chatter | open | P3 |
| 139 | Planet Labs / Sentinel Hub | Satellite: SPR fill, port activity, amphibious staging | paid | P3 |
| 140 | Flightradar24 / ADS-B Exchange | Military transports, Gulf VIP flights | paid/open | P3 |
| 141 | Marine cable-fault registries (ICPC) | Cable incidents | page | P3 |
| 142 | Cloudflare Radar API | Internet disruption (Taiwan, Iran) | open | P2 |

## I. Research, wire, retrieval (14)

| # | Feed | Gives | Access | Pri |
|---|---|---|---|---|
| 143 | ★ Perplexity Sonar API (MCP) | Cited retrieval — the research arm | key/mcp | P1 |
| 144 | ★ Exa (MCP) | Neural search with dates | key/mcp | P1 |
| 145 | ★ Firecrawl (MCP) | Structured scrape of the `page` sources above | key/mcp | P1 |
| 146 | ★ Jina Reader / Search (MCP) | Page-to-markdown for MOF/SAFE pages | key/mcp | P1 |
| 147 | ★ Parallel web search (MCP) | Multi-query research | key/mcp | P2 |
| 148 | ★ Reuters (via wire licence or search) | Deal-level reporting | paid | P1 |
| 149 | ★ Bloomberg (terminal / news API) | Flow analysis | paid | P2 |
| 150 | ★ Carnegie / CSIS / Rhodium / Atlantic Council | Sourced research | manual | P1 |
| 151 | NewsAPI.org | Headline aggregation | key | P3 |
| 152 | Diffbot / Semantic Scholar API | Paper retrieval for the 75-reference footer | key | P2 |
| 153 | arXiv / SSRN search (MCP) | Working papers on price impact | open | P2 |
| 154 | Anthropic Economic Index (MCP) | AI-usage context, not macro | mcp | P3 |
| 155 | Context7 (MCP) | Library docs for connector work | mcp | P3 |
| 156 | GitHub (MCP) | This repo's own state | mcp | P2 |

## J. Platform plumbing these run on (4)

| # | Feed | Gives | Access | Pri |
|---|---|---|---|---|
| 157 | Railway cron | The daily `/api/cron/macro-refresh` hit | key | P1 |
| 158 | Make.com scenario (already connected) | Backup scheduler + DNS | mcp | P2 |
| 159 | Resend (already connected) | Daily brief email with the 75-reference footer | key | P2 |
| 160 | ElevenLabs (already connected) | Thomas reads the brief aloud at the blue button | key | P2 |

## Wiring order (the first thirty days)

1. Keys on Railway: `FRED_API_KEY`, `EIA_API_KEY`, `COMTRADE_API_KEY`, `CRON_SECRET`. Cron: daily.
2. Turn the `page` sources for MOF Japan, SAFE, PBOC gold, TAO and MND Taiwan into Firecrawl/Jina scrapes; each becomes a connector with a recorded fixture and a test.
3. Add GDELT and Polymarket (open, high-signal) as connectors.
4. Add the World Gold Council and NY Fed ACM term premium.
5. Kpler or Vortexa — one of the two — for the corridor ledger; without tanker data the non-dollar share stays an estimate.
6. Sovereign CDS: one paid feed, or Trading Economics as a cheaper composite.
7. Then the alt-data tier as clients ask for it.
