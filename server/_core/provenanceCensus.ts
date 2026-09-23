/**
 * Provenance census — where each engine's numbers come from, measured from
 * the tree, never typed.
 *
 * Ported from the site-map session's packet W7 (`scripts/provenance-census.ts`
 * on the synthesis repo, tree 8a17807) so the counts can be asserted in CI
 * (server/provenanceCensus.test.ts) rather than read from a report. Three
 * refinements on the original:
 *
 *   - the engine set comes from the real catalogue (`CALCULATORS`), not a
 *     regex over its source, so a page maps to the engine it declares
 *   - an exported `*_SOURCE` or `*_SOURCES` constant counts as a source, as
 *     do `label`/`url` objects; the original only matched a list of
 *     institution names, and missed engines such as powerHistory that cite
 *     the Senate and the House
 *   - a page counts as printing a source when the app shell prints one for
 *     it: its route is a catalogue entry whose engine has a loader in
 *     shared/engineSources.ts (the EngineSourcesFooter), or a route that
 *     shared/pageSources.ts gives engines with loaders or its own sources
 *
 * Reads files only. Never evaluates an engine, never prints an environment
 * value, never reproduces a formula.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { CALCULATORS } from "@shared/calculatorCatalog";
import { ENGINES_WITH_SOURCE_LOADERS, ROUTES_WITH_SHELL_SOURCES } from "@shared/engineSources";

export interface SimulationFacts {
  seeded: boolean | null;
  unseededRandom: boolean;
  runs: number[];
  seeds: number[];
  bootstrapBlock: number | null;
  markers: string[];
}

export interface EngineRow {
  engine: string;
  exists: boolean;
  lines: number;
  cataloguePages: string[];
  memoryGroups: string[];
  pages: string[];
  serverImporters: string[];
  /** Deduplicated source strings: labels, URLs, institution mentions, exported source constants. [] means none. */
  sources: string[];
  sourceFields: string[];
  /** Names of exported `*_SOURCE` / `*_SOURCES` constants. */
  sourceExports: string[];
  lookback: string[];
  simulation: SimulationFacts;
  liveFeed: string[];
  provenanceOnPage: boolean;
  provenancePages: string[];
  hardCodedYears: number[];
  numericConstants: number;
  /** The shell prints this engine's sources (a loader is registered). */
  shellSourced: boolean;
}

export interface CensusSummary {
  engines: number;
  enginesFromCatalogue: number;
  enginesFromMemoryBank: number;
  enginesMissingOnDisk: string[];
  counts: {
    enginesWithZeroSources: number;
    numericEnginesWithZeroSources: number;
    enginesWithHardCodedYearsOlderThan2025: number;
    enginesWithUnseededRandomness: number;
    pagesImportingAnEngineWithNoProvenanceOnPage: number;
    pagesImportingAnEngine: number;
    enginesThatSimulate: number;
    enginesOnALiveFeed: number;
    enginesImportedByNoPageAndNoRouter: number;
    enginesWithoutShellSources: number;
  };
  lists: {
    enginesWithZeroSources: string[];
    numericEnginesWithZeroSources: string[];
    enginesWithHardCodedYearsOlderThan2025: string[];
    enginesWithUnseededRandomness: string[];
    pagesImportingAnEngineWithNoProvenanceOnPage: string[];
    enginesImportedByNoPageAndNoRouter: string[];
    enginesWithoutShellSources: string[];
  };
}

export interface Census {
  root: string;
  rows: EngineRow[];
  summary: CensusSummary;
}

const CENSUS_YEAR = 2026;

const INSTITUTIONS = [
  "IRS", "Internal Revenue", "SSA", "Social Security Administration", "CMS", "Medicare", "FRED", "St. Louis Fed", "Federal Reserve",
  "Treasury", "BLS", "Bureau of Labor", "Census", "HUD", "FHFA", "Freddie Mac", "Fannie Mae", "Zillow", "Shiller", "Case-Shiller",
  "Ibbotson", "SBBI", "Morningstar", "S&P", "Standard & Poor", "Nasdaq", "Russell 2000", "Bloomberg", "MSCI", "EIA", "Comtrade",
  "NAIC", "LIMRA", "AM Best", "A.M. Best", "Moody", "Fitch", "Comdex", "NOLHGA", "Genworth", "CareScout", "LongTermCare.gov",
  "Eviction Lab", "AHS", "American Housing Survey", "Redfin", "Realtor.com", "Rabbu", "AirDNA", "Unison", "Point", "Hometap",
  "Congressional Budget", "CBO", "JCT", "Tax Foundation", "Kitces", "Vanguard", "BlackRock", "iShares", "Fidelity", "Schwab",
  "Pacific Life", "Nationwide", "Allianz", "Athene", "F&G", "Securian", "Minnesota Life", "Symetra", "Lincoln", "Prudential",
  "MassMutual", "New York Life", "Penn Mutual", "Transamerica", "National Life", "Corebridge", "Global Atlantic", "North American",
  "Midland", "Sammons", "Mutual of Omaha", "John Hancock", "Guardian", "Northwestern", "Ameritas", "Columbus Life", "Equitable",
  "Trustees Report", "Period Life Table", "Rev. Proc", "Revenue Procedure", "Notice 20", "Publication", "Pub. ", "IRC", "26 U.S.C",
  "U.S. Senate", "U.S. House", "White House", "Office of the Historian", "Congress", "Federal Register", "GAO", "OECD", "IMF", "World Bank",
];
const INSTITUTION_RE = new RegExp(INSTITUTIONS.map(s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"), "i");
const URL_RE = /https?:\/\/[^\s"'`)\]]+/g;
const STRING_LITERAL_RE = /"([^"\\\n]{6,400})"|'([^'\\\n]{6,400})'|`([^`\\\n$]{6,400})`/g;
const SOURCE_EXPORT_RE = /export\s+const\s+([A-Z][A-Z0-9_]*_SOURCES?)\b/g;
const PROVENANCE_UI = /DataFeedBadge|EvidencePanel|sourceNote|FigureTrace|HowAFigureIsMade|EngineSourcesFooter|asOf\b|as of\b|Source:|source=|provenance/i;

function walk(dir: string, exts: string[], acc: string[] = []): string[] {
  if (!existsSync(dir)) return acc;
  for (const e of readdirSync(dir)) {
    if (e === "node_modules" || e.startsWith(".")) continue;
    const p = path.join(dir, e);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, exts, acc);
    else if (exts.some(x => e.endsWith(x))) acc.push(p);
  }
  return acc;
}

function stripComments(text: string): string {
  return text.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
}

function moduleSpecifiers(engine: string): string[] {
  const noExt = engine.replace(/\.ts$/, "");
  if (!noExt.startsWith("shared/")) return [];
  const base = noExt.slice("shared/".length).replace(/\/index$/, "");
  return [`@shared/${base}`, `../shared/${base}`, `../../shared/${base}`, `../../../shared/${base}`];
}

/** Routes → page file, parsed from App.tsx (`lazy(() => import("./pages/x"))` and `<Route path="..." component={X}`). */
function routeFiles(appSrc: string): Map<string, string> {
  const compFile = new Map<string, string>();
  for (const m of Array.from(appSrc.matchAll(/const\s+(\w+)\s*=\s*lazy\(\(\)\s*=>\s*import\("\.\/([^"]+)"\)\)/g))) {
    compFile.set(m[1]!, `client/src/${m[2]}${m[2]!.endsWith(".tsx") ? "" : ".tsx"}`);
  }
  for (const m of Array.from(appSrc.matchAll(/import\s+(\w+)\s+from\s+"\.\/([^"]+)"/g))) {
    if (!compFile.has(m[1]!)) compFile.set(m[1]!, `client/src/${m[2]}${m[2]!.endsWith(".tsx") ? "" : ".tsx"}`);
  }
  const out = new Map<string, string>();
  for (const m of Array.from(appSrc.matchAll(/<Route\s+path="([^"]+)"[^>]*component=\{\s*(?:gated\(\s*)?(\w+)/g))) {
    const file = compFile.get(m[2]!);
    if (file) out.set(m[1]!, file);
  }
  return out;
}

export function censusTree(root: string): Census {
  const read = (relPath: string) => readFileSync(path.join(root, relPath), "utf8");
  const rel = (abs: string) => path.relative(root, abs).split(path.sep).join("/");

  // 1. Engine set: catalogue bindings (from the real module) + memory-bank modules (from source).
  const catalogueEngines = new Map<string, string[]>();
  for (const c of CALCULATORS) {
    if (!c.engine) continue;
    const arr = catalogueEngines.get(c.engine) ?? [];
    arr.push(c.path);
    catalogueEngines.set(c.engine, arr);
  }
  const memoryBank = existsSync(path.join(root, "shared/aiMemoryBank.ts")) ? read("shared/aiMemoryBank.ts") : "";
  const memoryGroups = new Map<string, string[]>();
  for (const g of Array.from(memoryBank.matchAll(/id:\s*"([^"]+)"[\s\S]*?modules:\s*\[([^\]]*)\]/g))) {
    for (const mod of Array.from(g[2]!.matchAll(/"([^"]+)"/g))) {
      const arr = memoryGroups.get(mod[1]!) ?? [];
      if (!arr.includes(g[1]!)) arr.push(g[1]!);
      memoryGroups.set(mod[1]!, arr);
    }
  }
  const engineFiles = Array.from(new Set([...Array.from(catalogueEngines.keys()), ...Array.from(memoryGroups.keys())])).sort();

  // 2. Pages, components, routers.
  const pageText = new Map<string, string>();
  for (const f of [...walk(path.join(root, "client/src/pages"), [".tsx"]), ...walk(path.join(root, "client/src/components"), [".tsx"])]) {
    pageText.set(rel(f), readFileSync(f, "utf8"));
  }
  const serverText = new Map<string, string>();
  for (const f of walk(path.join(root, "server"), [".ts"])) if (!f.endsWith(".test.ts")) serverText.set(rel(f), readFileSync(f, "utf8"));

  const appSrc = existsSync(path.join(root, "client/src/App.tsx")) ? read("client/src/App.tsx") : "";
  const routes = routeFiles(appSrc);
  // Page files the shell prints a source list for: any of their routes is a catalogue path whose engine has a loader.
  const shellSourcedFiles = new Set<string>();
  for (const c of CALCULATORS) {
    const file = routes.get(c.path);
    if (file && c.engine && ENGINES_WITH_SOURCE_LOADERS.includes(c.engine)) shellSourcedFiles.add(file);
  }
  // …and any route shared/pageSources.ts gives a source list (engines with loaders, or the page's own sources).
  for (const r of ROUTES_WITH_SHELL_SOURCES) {
    const file = routes.get(r);
    if (file) shellSourcedFiles.add(file);
  }

  const importers = (engine: string, texts: Map<string, string>) => {
    const specs = moduleSpecifiers(engine);
    const out: string[] = [];
    for (const [file, text] of Array.from(texts.entries())) {
      if (specs.some(s => text.includes(`"${s}"`) || text.includes(`'${s}'`) || text.includes(`"${s}/index"`))) out.push(file);
    }
    return out.sort();
  };
  const pagePrintsSource = (file: string) => PROVENANCE_UI.test(pageText.get(file) ?? "") || shellSourcedFiles.has(file);

  // 3. One engine.
  const analyse = (engine: string): EngineRow => {
    const abs = path.join(root, engine);
    const exists = existsSync(abs);
    const text = exists ? readFileSync(abs, "utf8") : "";
    const lines = text ? text.split("\n").length : 0;

    const sourceFields: string[] = [];
    for (const [label, re] of [
      ["source", /\bsource\s*:/], ["sourceUrl", /\bsourceUrl\s*:/], ["asOf", /\basOf\s*:/], ["citation", /\bcitations?\s*:/],
      ["Verified<T>", /Verified</], ["LIMITS_SOURCE", /LIMITS_SOURCE/], ["*_SOURCE", /\b[A-Z_]+_SOURCES?\b/], ["RULES_VERSION", /RULES_VERSION/],
      ["neverPrinted", /neverPrinted/], ["verified:", /\bverified\s*:/], ["url:", /\burl\s*:/], ["note:", /\bnote\s*:/],
    ] as const) if (re.test(text)) sourceFields.push(label);

    const sourceExports = Array.from(text.matchAll(SOURCE_EXPORT_RE)).map(m => m[1]!);
    const sources = new Set<string>();
    for (const u of Array.from(text.matchAll(URL_RE))) sources.add(u[0].replace(/[.,;:]+$/, ""));
    for (const m of Array.from(text.matchAll(STRING_LITERAL_RE))) {
      const s = (m[1] ?? m[2] ?? m[3] ?? "").trim();
      if (INSTITUTION_RE.test(s) && !/^\s*(import|export)\b/.test(s)) sources.add(s.length > 160 ? s.slice(0, 157) + "…" : s);
    }
    for (const e of sourceExports) sources.add(`export ${e}`);

    const lookback = new Set<string>();
    for (const m of Array.from(text.matchAll(/\b(1[89]\d{2}|20\d{2})\s*[–—-]\s*(19\d{2}|20\d{2}|present|today)\b/g))) lookback.add(`${m[1]}–${m[2]}`);
    for (const m of Array.from(text.matchAll(/\bsince\s+(1[89]\d{2}|20\d{2})\b/gi))) lookback.add(`since ${m[1]}`);
    for (const m of Array.from(text.matchAll(/\b([A-Z_]*(START|END|FROM|TO|BASE|FIRST|LAST)_YEAR)\s*=\s*(\d{4})/g))) lookback.add(`${m[1]} = ${m[3]}`);
    for (const m of Array.from(text.matchAll(/observation_start["']?\s*[:=]\s*["']?(\d{4}-\d{2}-\d{2})/g))) lookback.add(`observation_start ${m[1]}`);
    for (const m of Array.from(text.matchAll(/\b(rolling|trailing)\s+(\d{1,3})[- ]year/gi))) lookback.add(`${m[1]!.toLowerCase()} ${m[2]}-year`);
    for (const m of Array.from(text.matchAll(/\b(\d{2,3})\s*years? of (history|data|returns)/gi))) lookback.add(`${m[1]} years of ${m[2]!.toLowerCase()}`);

    const code = stripComments(text);
    const runs = Array.from(text.matchAll(/\b(runs|paths|iterations|simulations|nRuns|numRuns|N_RUNS|RUNS)\s*[:=]\s*(\d[\d_]*)/g)).map(m => Number(m[2]!.replace(/_/g, "")));
    const seeds = Array.from(text.matchAll(/\bseed\s*[:=]\s*(\d[\d_]*)/g)).map(m => Number(m[1]!.replace(/_/g, "")));
    const mulberrySeeds = Array.from(text.matchAll(/mulberry32\((\d+)\)/g)).map(m => Number(m[1]));
    const blockM = text.match(/block(?:Size)?\s*[:=]\s*(\d+)/) ?? text.match(/blockBootstrapPaths\([^)]*,\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*(\d+)\)/);
    const markers: string[] = [];
    for (const [label, re] of [
      ["mulberry32", /mulberry32/], ["xorshift", /xorshift/i], ["blockBootstrapPaths", /blockBootstrapPaths/], ["Box-Muller", /box[- ]?muller/i],
      ["Cholesky", /cholesky/i], ["Monte Carlo", /monte\s*carlo/i], ["bootstrap", /bootstrap/i], ["percentile", /p10|p90|percentile/i],
    ] as const) if (re.test(text)) markers.push(label);
    const unseededRandom = /Math\.random\(\)/.test(code);
    const seededMarkers = /mulberry32|xorshift|seed\s*[:=]/i.test(text);
    const seeded: boolean | null = markers.length === 0 && !unseededRandom ? null : seededMarkers && !unseededRandom ? true : seededMarkers && unseededRandom ? true : false;

    const liveFeed: string[] = [];
    for (const [label, re] of [
      ["_core/fred", /_core\/fred/], ["dataFeedService", /dataFeedService/], ["taxSources", /taxSources/], ["taxRules", /taxRules/],
      ["macroConnectors", /macroConnectors/], ["rentalMarket adapters", /rentalMarket(Adapters|Sources|Engine)/], ["fetch()", /\bfetch\(/],
    ] as const) if (re.test(text)) liveFeed.push(label);

    const pages = exists ? importers(engine, pageText) : [];
    const provenancePages = pages.filter(pagePrintsSource);

    const years = new Set<number>();
    for (const m of Array.from(text.matchAll(/\b(20[01]\d|202[0-5])\b/g))) { const y = Number(m[1]); if (y < CENSUS_YEAR) years.add(y); }

    const numericConstants = (code.match(/(?<![\w.])(?:\d{1,3}(?:_\d{3})+|\d{4,}|\d+\.\d+)(?![\w])/g) ?? []).length;

    return {
      engine, exists, lines,
      cataloguePages: catalogueEngines.get(engine) ?? [],
      memoryGroups: memoryGroups.get(engine) ?? [],
      pages, serverImporters: exists ? importers(engine, serverText) : [],
      sources: Array.from(sources).sort(), sourceFields, sourceExports,
      lookback: Array.from(lookback).sort(),
      simulation: { seeded, unseededRandom, runs: Array.from(new Set(runs)).sort((a, b) => a - b), seeds: Array.from(new Set([...seeds, ...mulberrySeeds])).sort((a, b) => a - b), bootstrapBlock: blockM ? Number(blockM[1]) : null, markers },
      liveFeed,
      provenanceOnPage: provenancePages.length > 0, provenancePages,
      hardCodedYears: Array.from(years).sort((a, b) => a - b),
      numericConstants,
      shellSourced: ENGINES_WITH_SOURCE_LOADERS.includes(engine),
    };
  };

  const rows = engineFiles.map(analyse);

  // 4. Summary counts, computed.
  // Zero sources: names nothing AND carries typed-in numbers. A file with no numeric literals has nothing to source.
  const zeroSources = rows.filter(r => r.exists && r.sources.length === 0 && r.numericConstants > 0);
  const staleYears = rows.filter(r => r.exists && r.hardCodedYears.some(y => y < CENSUS_YEAR - 1));
  const unseeded = rows.filter(r => r.exists && r.simulation.unseededRandom);
  const pagesNoSource = new Set<string>();
  for (const r of rows) for (const p of r.pages) if (!pagePrintsSource(p)) pagesNoSource.add(p);
  const pagesTotal = new Set(rows.flatMap(r => r.pages));
  const simulating = rows.filter(r => r.exists && r.simulation.markers.length > 0);
  const liveFed = rows.filter(r => r.exists && r.liveFeed.length > 0);
  const orphanEngines = rows.filter(r => r.exists && r.pages.length === 0 && r.serverImporters.length === 0);
  const missingFiles = rows.filter(r => !r.exists);
  const numericZeroSources = zeroSources.filter(r => r.numericConstants >= 20);
  const noShell = rows.filter(r => r.exists && r.cataloguePages.length > 0 && !r.shellSourced);

  const summary: CensusSummary = {
    engines: rows.length,
    enginesFromCatalogue: catalogueEngines.size,
    enginesFromMemoryBank: memoryGroups.size,
    enginesMissingOnDisk: missingFiles.map(r => r.engine),
    counts: {
      enginesWithZeroSources: zeroSources.length,
      numericEnginesWithZeroSources: numericZeroSources.length,
      enginesWithHardCodedYearsOlderThan2025: staleYears.length,
      enginesWithUnseededRandomness: unseeded.length,
      pagesImportingAnEngineWithNoProvenanceOnPage: pagesNoSource.size,
      pagesImportingAnEngine: pagesTotal.size,
      enginesThatSimulate: simulating.length,
      enginesOnALiveFeed: liveFed.length,
      enginesImportedByNoPageAndNoRouter: orphanEngines.length,
      enginesWithoutShellSources: noShell.length,
    },
    lists: {
      enginesWithZeroSources: zeroSources.map(r => r.engine),
      numericEnginesWithZeroSources: numericZeroSources.map(r => r.engine),
      enginesWithHardCodedYearsOlderThan2025: staleYears.map(r => `${r.engine} (${r.hardCodedYears.filter(y => y < CENSUS_YEAR - 1).join(", ")})`),
      enginesWithUnseededRandomness: unseeded.map(r => r.engine),
      pagesImportingAnEngineWithNoProvenanceOnPage: Array.from(pagesNoSource).sort(),
      enginesImportedByNoPageAndNoRouter: orphanEngines.map(r => r.engine),
      enginesWithoutShellSources: noShell.map(r => r.engine),
    },
  };

  return { root, rows, summary };
}
