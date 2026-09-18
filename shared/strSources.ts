// ============================================================
// SHORT-TERM RENTAL SOURCES — the protocol the AI follows when a plan needs
// a short-term rental: the sites it touches, in order, what each one
// publishes, how it can be reached (an API with a key on the host, a page the
// server can read, or a button the client presses), and what it must never
// do (invent a nightly rate, an occupancy, or a revenue figure).
//
// Every fact below was checked on 7 September 2026 against the site's own
// pages (the URL in `verifiedAt`). Where a site changes its terms, the row
// changes with it; nothing here is remembered from training.
// ============================================================

export type StrApi =
  | { status: "self-serve"; envKey: string; docs: string; note: string }   // key from the site's own dashboard; goes in the host env panel
  | { status: "contract"; envKey: string; docs: string; note: string }     // API exists but only under a signed agreement
  | { status: "own-listings"; envKey: string; docs: string; note: string } // API reaches only listings the account already manages
  | { status: "download"; docs: string; note: string }                     // public files, no key
  | { status: "none"; note: string };                                       // no developer access published

export type StrSource = {
  id: string;
  name: string;
  home: string;
  kind: "estimator" | "market" | "listings" | "dataset" | "pricing";
  /** What the site publishes, in its own words where possible. */
  publishes: string;
  /** Lookup URL with one of {address} {place} {zip} to fill in; null when the site has no deep link. */
  lookup: string | null;
  lookupBy: "address" | "place" | "zip" | "none";
  /** Can the server read the lookup page as text and quote it? Marketing pages yes; app pages rendered by scripts, no. */
  serverReadable: boolean;
  api: StrApi;
  verifiedAt: { date: string; url: string };
};

export const STR_SOURCES: StrSource[] = [
  {
    id: "rabbu", name: "Rabbu", home: "https://rabbu.com", kind: "estimator",
    publishes: "Airbnb calculator for any U.S. address: average daily rate, occupancy and RevPAN over the next 30 days, a seasonalised monthly revenue projection, nearby comparable listings. Figures are gross: before cleaning, platform and management fees. Market pages for 3,500+ U.S. cities by city, county or zip, updated weekly from 1.1M+ active listings.",
    lookup: "https://rabbu.com/airbnb-calculator", lookupBy: "address", serverReadable: false,
    api: { status: "none", note: "No developer API is published on rabbu.com. The calculator and market pages are free and need no sign-in; the client reads the figure and types it in, dated." },
    verifiedAt: { date: "2026-09-07", url: "https://rabbu.com/airbnb-calculator" },
  },
  {
    id: "airdna", name: "AirDNA", home: "https://www.airdna.co", kind: "market",
    publishes: "Market analytics and individual-listing performance for short-term rentals worldwide; the Rentalizer estimates revenue for an address. Subscriptions from about $34 a month (Pro) per Rabbu's comparison; the API is priced separately.",
    lookup: "https://www.airdna.co/rentalizer", lookupBy: "address", serverReadable: false,
    api: { status: "contract", envKey: "AIRDNA_API_KEY", docs: "https://apidocs.airdna.co/", note: "REST API at api.airdna.co (property valuations, listing data, market data, market search, availability, smart rates). Tokens are private: 'Contact us to get your private token and provide payment details'; enterprise discounts above 5,000 calls a month. When AIRDNA_API_KEY is set on the host the platform can call it; until then the button opens the page." },
    verifiedAt: { date: "2026-09-07", url: "https://apidocs.airdna.co/" },
  },
  {
    id: "mashvisor", name: "Mashvisor", home: "https://www.mashvisor.com", kind: "market",
    publishes: "Airbnb calculator by address, city, zip or neighborhood: estimated income, occupancy, average daily rate, cash flow, cap rate, cash-on-cash, comparable listings, expense breakdown. Short-term rental regulations by city.",
    lookup: "https://www.mashvisor.com/airbnb-calculator", lookupBy: "address", serverReadable: false,
    api: { status: "self-serve", envKey: "MASHVISOR_API_KEY", docs: "https://www.mashvisor.com/api-doc-v2", note: "REST API with an x-api-key header; the key comes from the developer dashboard at mashvisor.com/explore/profile/developers; a free account carries a limited number of requests, paid plans are credit-based. Endpoints accept zip_code, city and neighborhood: occupancy rates, historical Airbnb performance, top-reviewed VRBO homes, short-term regulatory ratings." },
    verifiedAt: { date: "2026-09-07", url: "https://www.mashvisor.com/api-doc-v2/short-term-rentals" },
  },
  {
    id: "airroi", name: "AirROI", home: "https://www.airroi.com", kind: "market",
    publishes: "Free revenue calculator (enter an address; 50–100 comparable listings; monthly and annual projection), free market atlas and regional reports; 20M+ listings, 190+ countries, 15+ years of history claimed.",
    lookup: "https://www.airroi.com", lookupBy: "none", serverReadable: false,
    api: { status: "self-serve", envKey: "AIRROI_API_KEY", docs: "https://www.airroi.com/api", note: "REST API at api.airroi.com with an x-api-key header, pay-as-you-go from $0.01 a call, no contract or minimum; 22 endpoints: listing search by radius or polygon, market metrics (occupancy, ADR, RevPAR, revenue, supply growth, pacing, seasonality), revenue estimates, up to 60 months of history. An MCP server exposes the same data. The key is created on airroi.com and lives only in the host env panel." },
    verifiedAt: { date: "2026-09-07", url: "https://www.airroi.com/api" },
  },
  {
    id: "pricelabs", name: "PriceLabs", home: "https://pricelabs.co", kind: "pricing",
    publishes: "Dynamic pricing for listings the host manages; a Revenue Estimator API that returns revenue, ADR and occupancy estimates for a location.",
    lookup: "https://pricelabs.co", lookupBy: "none", serverReadable: false,
    api: { status: "self-serve", envKey: "PRICELABS_API_KEY", docs: "https://developers.pricelabs.co/", note: "developers.pricelabs.co documents three APIs: the Revenue Estimator API (estimates for a location), an Integration API for property-management systems, and an RM Partner API. Keys are issued from a PriceLabs account; pricing is per listing per month for the customer API." },
    verifiedAt: { date: "2026-09-07", url: "https://developers.pricelabs.co/" },
  },
  {
    id: "awning", name: "Awning", home: "https://www.awning.com", kind: "estimator",
    publishes: "Free Airbnb calculator for any U.S. address, no sign-up: estimated annual income, ADR, occupancy, seasonality curve and comparable active listings; the data comes from 20,000+ rentals managed by RedAwning rather than scraped listing prices.",
    lookup: "https://www.awning.com/airbnb-calculator", lookupBy: "address", serverReadable: true,
    api: { status: "none", note: "No developer API is published on awning.com. Free page; the client reads the figure and types it in, dated." },
    verifiedAt: { date: "2026-09-07", url: "https://www.awning.com/airbnb-calculator" },
  },
  {
    id: "airbnb", name: "Airbnb", home: "https://www.airbnb.com", kind: "listings",
    publishes: "The live listings themselves: nightly prices, calendars, reviews for any place. This is what a client actually competes with.",
    lookup: "https://www.airbnb.com/s/{place}/homes", lookupBy: "place", serverReadable: false,
    api: { status: "none", note: "Airbnb's official API (developer.withairbnb.com) is a closed partner programme for property-management and channel software; it carries bookings and messaging, not market analytics, and is not open to new applicants. The platform links the search page; it never scrapes it." },
    verifiedAt: { date: "2026-09-07", url: "https://www.airroi.com/airbnb-data/api" },
  },
  {
    id: "vrbo", name: "Vrbo", home: "https://www.vrbo.com", kind: "listings",
    publishes: "Whole-home listings with nightly prices and reviews for any destination.",
    lookup: "https://www.vrbo.com/search?destination={place}", lookupBy: "place", serverReadable: false,
    api: { status: "contract", envKey: "EXPEDIA_RAPID_API_KEY", docs: "https://developers.expediagroup.com/rapid/lodging/vacation-rentals/vrbo-integration-guide", note: "Vrbo supply is reachable through Expedia Group's Rapid API (supply_source=vrbo) for booking and content, under a partner agreement; it is not a market-analytics feed. Without an agreement the button opens the search page." },
    verifiedAt: { date: "2026-09-07", url: "https://developers.expediagroup.com/rapid/lodging/vacation-rentals/vrbo-integration-guide" },
  },
  {
    id: "insideairbnb", name: "Inside Airbnb", home: "https://insideairbnb.com", kind: "dataset",
    publishes: "Free quarterly snapshots of Airbnb listings for a fixed set of cities (listings, calendar, reviews as CSV) and country archives for the United States, Canada, the United Kingdom and others. Advocacy project; the only free listing-level record with a public download.",
    lookup: "https://insideairbnb.com/get-the-data", lookupBy: "none", serverReadable: true,
    api: { status: "download", docs: "https://insideairbnb.com/get-the-data", note: "Direct CSV downloads per city and date (data.insideairbnb.com/<country>/<state>/<city>/<date>/…). No key. Covers only the cities the project scrapes, so a client's town may be absent." },
    verifiedAt: { date: "2026-09-07", url: "https://insideairbnb.com/get-the-data" },
  },
  {
    id: "beyond", name: "Beyond Pricing", home: "https://www.beyondpricing.com", kind: "pricing",
    publishes: "Revenue management for listings the host runs: pricing, calendars, comp sets, recommendations.",
    lookup: "https://www.beyondpricing.com", lookupBy: "none", serverReadable: false,
    api: { status: "own-listings", envKey: "BEYOND_API_TOKEN", docs: "https://developers.beyondpricing.com/", note: "Partners API v1: OAuth2 client credentials for partners, a personal access token for an individual account; endpoints for listings, calendar, comp sets and recommendations on the listings the account manages. Useful once a client owns the property, not for choosing one." },
    verifiedAt: { date: "2026-09-07", url: "https://developers.beyondpricing.com/" },
  },
];

export function strSource(id: string): StrSource | undefined { return STR_SOURCES.find((s) => s.id === id); }

/** The site's lookup URL for the client's place, zip or address; the home page when the site has no deep link. */
export function strLookupUrl(source: StrSource, q: { place?: string; zip?: string; address?: string }): string {
  if (!source.lookup) return source.home;
  const fill = (v: string | undefined) => (v ? encodeURIComponent(v.trim()) : null);
  switch (source.lookupBy) {
    case "place": { const v = fill(q.place ?? q.zip); return v ? source.lookup.replace("{place}", v) : source.home; }
    case "zip": { const v = fill(q.zip); return v ? source.lookup.replace("{zip}", v) : source.home; }
    case "address": return source.lookup; // address calculators take the address on the page, not in the URL
    default: return source.lookup;
  }
}

/** Which registry APIs have a key on the host. Names only; the key never leaves the env panel. */
export function configuredStrApis(env: Record<string, string | undefined>): Array<{ id: string; name: string; envKey: string }> {
  return STR_SOURCES.flatMap((s) => ("envKey" in s.api && env[s.api.envKey] ? [{ id: s.id, name: s.name, envKey: s.api.envKey }] : []));
}

/** One line for the advisor's prompt: which registry APIs this host can call. Names only, never key material. */
export function strApiLine(env: Record<string, string | undefined>): string {
  const on = configuredStrApis(env);
  return on.length
    ? `Short-term rental sources with an API key on this host: ${on.map((a) => a.name).join(", ")}. The other registry sites are buttons on /portal/short-term-rentals.`
    : "No short-term rental API key is set on this host; every registry site is a button on /portal/short-term-rentals and figures must be read from the page, dated.";
}

// ─── What the client said, read for places ──────────────────────────────────
const STATES = "AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY";
const STATE_NAMES = ["Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"];
const STOP = new Set(["I", "We", "My", "Our", "The", "A", "An", "In", "To", "At", "Near", "On", "And", "Or", "But", "It", "If", "When", "Then", "Also", "Maybe", "Yes", "No", "Not", "Love", "Like", "Go", "Visit", "Retire", "Move", "Live", "Buy", "Own", "Every", "Each", "Year", "Summer", "Winter", "Spring", "Fall", "Weekend", "Airbnb", "Vrbo", "Roth", "Social", "Medicare"]);
const WORD = "[A-Z][a-zA-Z']+";

/** Place names mentioned in free text: "City, ST" pairs, capitalised phrases after in/to/near/at/around/visit/love/maybe, full state names, and five-digit zips. Deterministic; the AI reads the same text for context. */
export function placesFromText(text: string): { places: string[]; zips: string[] } {
  const places = new Set<string>();
  const zips = new Set<string>();
  const t = text.replace(/\s+/g, " ");
  Array.from(t.matchAll(/\b(\d{5})\b/g)).forEach((m) => zips.add(m[1]!));
  const add = (p: string) => {
    const first = p.split(" ")[0]!;
    if (STOP.has(first)) return;
    if (Array.from(places).some((x) => x === p || x.startsWith(p + ","))) return; // already captured, or captured with its state
    places.add(p);
  };
  // "Asheville, NC" / "Gulf Shores, Alabama"
  const cityState = new RegExp(`\\b(${WORD}(?: ${WORD}){0,3}),\\s*((?:${STATES})\\b|${STATE_NAMES.join("|")})\\b`, "g");
  Array.from(t.matchAll(cityState)).forEach((m) => { if (!STOP.has(m[1]!.split(" ")[0]!)) places.add(`${m[1]!.trim()}, ${m[2]!.trim()}`); });
  // "in Sedona", "to the Outer Banks", "near Lake Tahoe", "love Destin", "maybe Destin"
  const phrase = new RegExp(`\\b(?:in|to|near|at|around|visit(?:ing)?|love|loves|like|likes|maybe|perhaps|go to|going to|retire (?:in|to)|move (?:to|near))\\s+(?:the\\s+)?(${WORD}(?: (?:of |de )?${WORD}){0,3})`, "g");
  Array.from(t.matchAll(phrase)).forEach((m) => add(m[1]!.trim()));
  // A state named on its own ("Florida, maybe Destin")
  const stateAlone = new RegExp(`\\b(${STATE_NAMES.join("|")})\\b`, "g");
  Array.from(t.matchAll(stateAlone)).forEach((m) => { const s = m[1]!; if (!Array.from(places).some((x) => x.endsWith(", " + s))) add(s); });
  return { places: Array.from(places).slice(0, 12), zips: Array.from(zips).slice(0, 12) };
}

// ─── Affordability from the Fact Finder, arithmetic shown ───────────────────
export type Affordability = {
  annualIncome: number;
  cashAvailable: number;
  /** Cash ÷ (down% + closing%) — the price the cash on hand can carry at the stated down payment. Not a lender's decision. */
  cashLimitedPrice: number;
  downPct: number; closingPct: number;
  lines: string[];
};

/** Purchase price × building share: the depreciable basis the STR Tax Strategy page will accelerate. */
export function depreciableBasis(price: number, buildingSharePct: number): number { return price * (buildingSharePct / 100); }

const num = (v: unknown) => { const n = Number(String(v ?? "").replace(/[^0-9.-]/g, "")); return Number.isFinite(n) ? n : 0; };

export function affordabilityFromFactFinder(ff: { sections?: Record<string, Record<string, unknown>> } | null | undefined, opts: { downPct?: number; closingPct?: number } = {}): Affordability {
  const inc = ff?.sections?.income ?? {}, cash = ff?.sections?.cash ?? {};
  const incomeKeys = ["w2Income", "bonusIncome", "contractorIncome", "practiceDistributions", "rsuOrEquityComp", "spouseIncome", "rentalIncome"];
  const cashKeys = ["checking", "savings", "moneyMarketCds"];
  const annualIncome = incomeKeys.reduce((s, k) => s + num(inc[k]), 0);
  const cashAvailable = cashKeys.reduce((s, k) => s + num(cash[k]), 0);
  const downPct = opts.downPct ?? 20, closingPct = opts.closingPct ?? 3;
  const carry = (downPct + closingPct) / 100;
  const cashLimitedPrice = carry > 0 ? Math.floor(cashAvailable / carry) : 0;
  const lines = [
    `Annual income on the Fact Finder: ${incomeKeys.filter((k) => num(inc[k]) > 0).length} lines, total ${Math.round(annualIncome).toLocaleString("en-US")}.`,
    `Cash on hand (checking, savings, money market/CDs): ${Math.round(cashAvailable).toLocaleString("en-US")}.`,
    `At ${downPct}% down plus ${closingPct}% closing, that cash carries a price of ${cashLimitedPrice.toLocaleString("en-US")} (cash ÷ ${carry.toFixed(2)}). A lender's debt-to-income test is separate and is not computed here.`,
  ];
  return { annualIncome, cashAvailable, cashLimitedPrice, downPct, closingPct, lines };
}

/** The paragraph the advisor works under whenever a plan touches a short-term rental. Kept here so the page, the docs and the prompt say the same thing. */
export const STR_PROTOCOL =
  "SHORT-TERM RENTAL PROTOCOL. When the client mentions rental income, a second home, a place they love to visit, or the need for depreciation, follow this order: " +
  "(1) Take the places from what they said (their goals, relocation plans, and anything spoken) and the zips already on their Fact Finder. " +
  "(2) Size the purchase from their own numbers: cash on hand at the stated down payment and closing costs gives the cash-limited price; say that a lender's debt-to-income test is separate. " +
  "(3) For each place, name the sources in the registry the platform carries — Rabbu first (free calculator and market pages), then AirDNA, Mashvisor, AirROI, PriceLabs, Awning, Airbnb and Vrbo search, Inside Airbnb's public files, Beyond Pricing — and say which ones the host has an API key for (the platform tells you) and which are buttons the client presses. " +
  "(4) Never state a nightly rate, occupancy, revenue or yield for a place unless it was read from one of those sources on a stated date, and then quote it as that source's figure with the date. If nothing has been read, say so and point to the buttons. " +
  "(5) Hand the figures to the Short-Term Rentals page (price, nightly rate, occupancy, the zip's own appreciation and rent trend from the Zip Engine) and the depreciation to the STR Tax Strategy page; the plan is the arithmetic on those inputs, not a forecast.";
