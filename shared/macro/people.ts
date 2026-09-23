/**
 * Tracked offices for the follow-through ledger (W8).
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The ledger is extended from Beijing's official channels to any person or
 * institution whose words move the models: central bankers, finance
 * ministers, heads of government, the multilaterals, the WEF. This table
 * names OFFICES, not people. Names are resolved at run time from Wikidata
 * (the office item's current holder) so nothing here goes stale and nothing
 * here is typed from memory. GDELT is queried with the office title, which is
 * how the press refers to the holder.
 *
 * Data only. `server/macroLedger.ts` does the fetching.
 */
import type { Jurisdiction } from "./types";
import type { StatementCategory } from "./statementFollowThrough";

export type TrackedOffice = {
  id: string;
  /** Office title as Wikidata labels it (searched, then the item's P1308 officeholder is read). */
  office: string;
  institution: string;
  jurisdiction: Jurisdiction;
  /** GDELT DOC API query for statements by this office. Quoted phrases; keep narrow. */
  gdeltQuery: string;
  /** Default ledger category for a claim from this office; the review can recode it. */
  category: StatementCategory;
  /** Registry source id credited when the claim is found through GDELT. */
  sourceId: "gdelt-doc-api";
};

const o = (id: string, office: string, institution: string, jurisdiction: Jurisdiction, gdeltQuery: string, category: StatementCategory): TrackedOffice =>
  ({ id, office, institution, jurisdiction, gdeltQuery, category, sourceId: "gdelt-doc-api" });

export const TRACKED_OFFICES: TrackedOffice[] = [
  o("fed-chair", "Chair of the Federal Reserve", "Federal Reserve Board", "US", "\"Fed chair\" (said OR says OR warned OR signaled)", "rate-guidance"),
  o("us-treasury-secretary", "United States Secretary of the Treasury", "U.S. Treasury", "US", "\"Treasury Secretary\" (said OR says OR warned OR pledged)", "fiscal-commitment"),
  o("us-president", "President of the United States", "White House", "US", "\"President\" (\"tariff\" OR \"Treasuries\" OR \"China\" OR \"Taiwan\") (said OR says OR warned)", "trade-measure"),
  o("ustr", "United States Trade Representative", "USTR", "US", "\"Trade Representative\" (said OR announced OR warned)", "trade-measure"),
  o("nyfed-president", "President of the Federal Reserve Bank of New York", "Federal Reserve Bank of New York", "US", "\"New York Fed\" president (said OR says)", "rate-guidance"),
  o("ecb-president", "President of the European Central Bank", "European Central Bank", "EU", "\"ECB president\" (said OR says OR warned)", "rate-guidance"),
  o("boe-governor", "Governor of the Bank of England", "Bank of England", "GB", "\"Bank of England\" governor (said OR says OR warned)", "rate-guidance"),
  o("boj-governor", "Governor of the Bank of Japan", "Bank of Japan", "JP", "\"Bank of Japan\" governor (said OR says OR signaled)", "rate-guidance"),
  o("jp-finance-minister", "Minister of Finance (Japan)", "Ministry of Finance, Japan", "JP", "\"Japan\" \"finance minister\" (yen OR intervention OR Treasuries)", "currency-policy"),
  o("pboc-governor", "Governor of the People's Bank of China", "People's Bank of China", "CN", "\"People's Bank of China\" governor (said OR says)", "currency-policy"),
  o("cn-premier", "Premier of the State Council of the People's Republic of China", "State Council", "CN", "\"Chinese premier\" (growth OR target OR economy) (said OR says)", "growth-target"),
  o("cn-mofa-spokesperson", "Spokesperson of the Ministry of Foreign Affairs of the People's Republic of China", "Ministry of Foreign Affairs, PRC", "CN", "\"Chinese Foreign Ministry\" spokesperson (Taiwan OR sanctions OR countermeasures)", "diplomatic-warning"),
  o("imf-md", "Managing Director of the International Monetary Fund", "International Monetary Fund", "INTL", "\"IMF\" \"managing director\" (said OR warned OR urged)", "consensus-forecast"),
  o("wb-president", "President of the World Bank Group", "World Bank", "INTL", "\"World Bank\" president (said OR warned)", "consensus-forecast"),
  o("bis-gm", "General Manager of the Bank for International Settlements", "Bank for International Settlements", "INTL", "\"BIS\" \"general manager\" (said OR warned)", "regulatory-rule"),
  o("opec-sg", "Secretary General of OPEC", "OPEC", "SA", "\"OPEC\" \"secretary general\" (said OR production OR cut)", "quota-decision"),
  o("sa-energy-minister", "Minister of Energy (Saudi Arabia)", "Saudi Ministry of Energy", "SA", "\"Saudi\" \"energy minister\" (said OR production OR cut)", "quota-decision"),
  o("rbi-governor", "Governor of the Reserve Bank of India", "Reserve Bank of India", "IN", "\"RBI governor\" (said OR says OR rupee)", "rate-guidance"),
  o("bcb-president", "President of the Central Bank of Brazil", "Banco Central do Brasil", "BR", "\"Brazil\" \"central bank\" president (said OR Selic)", "rate-guidance"),
  o("un-sg", "Secretary-General of the United Nations", "United Nations", "INTL", "\"UN secretary-general\" (warned OR said OR urged)", "security-commitment"),
  o("nato-sg", "Secretary General of NATO", "NATO", "INTL", "\"NATO\" \"secretary general\" (said OR warned OR pledged)", "security-commitment"),
  o("eu-commission-president", "President of the European Commission", "European Commission", "EU", "\"Commission president\" (tariff OR sanctions OR said)", "sanctions-designation"),
  o("wef-chair", "Executive Chairman of the World Economic Forum", "World Economic Forum", "CH", "\"World Economic Forum\" (said OR warned OR outlook)", "consensus-forecast"),
  o("tw-president", "President of the Republic of China", "Presidential Office, Taiwan", "TW", "\"Taiwan\" president (said OR warned OR defense)", "security-commitment"),
];

export const TRACKED_OFFICE_BY_ID: ReadonlyMap<string, TrackedOffice> = new Map(TRACKED_OFFICES.map(t => [t.id, t]));
