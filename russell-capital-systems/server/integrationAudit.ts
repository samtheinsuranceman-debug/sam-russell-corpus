// ============================================================
// THE INTEGRATION AUDIT — how wired is each page, computed from the code.
//
// ## Why computed
//
// A hand-written integration matrix is a brochure the day after it is
// written: someone adds a page, forgets the memory group, and the matrix
// still says green. This reads the repository — the router, the catalogue,
// the page components' imports, the memory bank's module lists, the test
// files, the genome's related paths, the sphere, the provenance traces, and
// which tRPC routers fetch from external data sources — and scores each
// catalogue page on ten dimensions that sum to ten. Every missing point is
// returned as a concrete to-do naming the file to change.
//
// ## The ten dimensions
//
//   routed          1.0  the path resolves in App.tsx (literal or :param pattern)
//   engine          1.0  the catalogue names an engine and the file exists
//   pageImports     1.0  the page imports a real shared engine (taxBracketEngine
//                        alone is boilerplate on ~60 pages and does not count
//                        unless it is the declared engine)
//   brain           1.5  the engine, or a module the page imports, is in a
//                        memory-bank group — the twelve channels can use it
//   tested          1.0  the engine has a test file
//   genome          1.0  a genome strategy names this path — the predictive
//                        layer can route a household here
//   crossLinked     1.0  two or more other surfaces link to it
//   sphere          0.5  placed on the sphere
//   liveData        1.0  a tRPC router it calls fetches an external data source
//   provenance      1.0  a figure trace names this path or engine
//
// The weights are a judgement and they are visible. The brain gets 1.5
// because a page the channels cannot use is a page the client has to find
// alone; the sphere gets 0.5 because it is navigation, not capability.
// ============================================================

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { CALCULATORS, type CalculatorEntry } from "@shared/calculatorCatalog";
import { MEMORY_GROUPS } from "@shared/aiMemoryBank";
import { STRATEGIES } from "@shared/genomeStrategies";
import { FIGURE_TRACES } from "@shared/provenance";

const here = (import.meta as { dirname?: string }).dirname ?? (typeof __dirname !== "undefined" ? __dirname : join(process.cwd(), "server"));
const root = join(here, "..");
const read = (p: string) => readFileSync(join(root, p), "utf8");
/** matchAll as an array — the project's TS target will not iterate the iterator directly. */
const all = (text: string, re: RegExp): RegExpExecArray[] => Array.from(text.matchAll(re));

export type DimensionId =
  | "routed" | "engine" | "pageImports" | "brain" | "tested"
  | "genome" | "crossLinked" | "sphere" | "liveData" | "provenance";

export const DIMENSION_WEIGHT: Record<DimensionId, number> = {
  routed: 1, engine: 1, pageImports: 1, brain: 1.5, tested: 1,
  genome: 1, crossLinked: 1, sphere: 0.5, liveData: 1, provenance: 1,
};

export const DIMENSION_LABEL: Record<DimensionId, string> = {
  routed: "Routed", engine: "Engine declared", pageImports: "Page uses an engine", brain: "In the AI brain",
  tested: "Engine tested", genome: "Genome routes here", crossLinked: "Cross-linked", sphere: "On the sphere",
  liveData: "Live external data", provenance: "Figure trace",
};

export interface PageAudit {
  readonly path: string;
  readonly name: string;
  readonly category: string;
  readonly engine?: string;
  readonly featured: boolean;
  readonly score: number;
  readonly dims: Record<DimensionId, boolean>;
  /** Concrete to-dos, one per missing dimension, naming the file to change. */
  readonly missing: readonly string[];
  /** Evidence behind each true dimension, so a reader can check it. */
  readonly evidence: Partial<Record<DimensionId, string>>;
}

/* ───────── the repository, read once ───────── */

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if ([".ts", ".tsx"].includes(extname(name))) out.push(full);
  }
  return out;
}

interface Repo {
  app: string;
  routePatterns: string[];
  lazyFiles: Map<string, string>;
  routeComponent: Map<string, string>;
  pageSource: Map<string, string>;
  hrefCounts: Map<string, number>;
  sphere: string;
  testImports: Set<string>;
  routerFiles: Map<string, string>;
  dataRouters: Set<string>;
  memoryModules: Set<string>;
  genomePaths: Set<string>;
  provenanceText: string;
}

let cached: Repo | null = null;

const DATA_HOST = /\.(gov|edu)\b|fred\.stlouisfed|zillow|fema|freddiemac|fanniemae|polymarket|kalshi|coingecko|bls\.gov|census|bea\.gov|fhfa|imf\.org|bis\.org|urban\.org|taxfoundation|str\.com|spglobal|fitchratings/;

function repo(): Repo {
  if (cached) return cached;
  const app = read("client/src/App.tsx");
  const routePatterns = (app.match(/path="\/[A-Za-z0-9/_:-]*"/g) ?? []).map((m) => m.slice(6, -1));
  const lazyFiles = new Map<string, string>();
  for (const m of all(app, /const (\w+) = lazy\(\(\) => import\("([^"]+)"\)/g)) lazyFiles.set(m[1], m[2]);
  for (const m of all(app, /^import (\w+) from "([^"]+)";/gm)) lazyFiles.set(m[1], m[2]);
  const routeComponent = new Map<string, string>();
  for (const m of all(app, /<Route path="([^"]+)" component=\{(?:gated\()?(\w+)/g)) routeComponent.set(m[1], m[2]);

  const pageSource = new Map<string, string>();
  const hrefCounts = new Map<string, number>();
  for (const f of walk(join(root, "client/src"))) {
    const s = readFileSync(f, "utf8");
    pageSource.set(f.slice(root.length + 1), s);
    for (const m of all(s, /href=\{?"?(\/portal\/[a-z0-9/-]+|\/ultra-calculator)/g)) {
      hrefCounts.set(m[1], (hrefCounts.get(m[1]) ?? 0) + 1);
    }
  }

  const sphere = existsSync(join(root, "shared/sphere.ts")) ? read("shared/sphere.ts") : "";

  const testImports = new Set<string>();
  for (const f of readdirSync(join(root, "server")).filter((n) => n.endsWith(".test.ts"))) {
    const s = read(`server/${f}`);
    for (const m of all(s, /@shared\/([A-Za-z0-9/]+)/g)) testImports.add(`shared/${m[1]}.ts`);
    for (const m of all(s, /\.\.\/shared\/([A-Za-z0-9/]+)/g)) testImports.add(`shared/${m[1]}.ts`);
  }

  const routers = read("server/routers.ts");
  const importFile = new Map<string, string>();
  for (const m of all(routers, /import \{([^}]+)\} from "\.\/([^"]+)"/g)) {
    for (const name of m[1].split(",").map((x) => x.trim()).filter(Boolean)) importFile.set(name, m[2]);
  }
  const routerFiles = new Map<string, string>();
  const body = routers.slice(routers.indexOf("export const appRouter"));
  for (const m of all(body, /^\s*(\w+):\s*(\w+Router)\b/gm)) {
    const file = importFile.get(m[2]);
    if (file) routerFiles.set(m[1], file);
  }
  const dataRouters = new Set<string>();
  for (const [name, file] of Array.from(routerFiles)) {
    const candidates = [`server/${file}.ts`, `server/${file}/index.ts`];
    const f = candidates.find((c) => existsSync(join(root, c)));
    if (!f) continue;
    const s = read(f);
    // The router and its immediate local imports: a router that delegates to a
    // sources file still counts, which is how most data routers are written.
    const locals = all(s, /from "\.\/([A-Za-z0-9_]+)"/g).map((m) => `server/${m[1]}.ts`).filter((p) => existsSync(join(root, p)));
    const text = s + locals.map((p) => read(p)).join("\n");
    if (DATA_HOST.test(text)) dataRouters.add(name);
  }

  const memoryModules = new Set<string>();
  for (const g of MEMORY_GROUPS) for (const m of g.modules) memoryModules.add(m);

  const genomePaths = new Set<string>();
  for (const s of STRATEGIES as ReadonlyArray<{ relatedPaths?: readonly string[] }>) for (const p of s.relatedPaths ?? []) genomePaths.add(p);

  const provenanceText = JSON.stringify(FIGURE_TRACES) + read("shared/provenance.ts");

  cached = { app, routePatterns, lazyFiles, routeComponent, pageSource, hrefCounts, sphere, testImports, routerFiles, dataRouters, memoryModules, genomePaths, provenanceText };
  return cached;
}

function patternFor(r: Repo, path: string): string | undefined {
  if (r.routePatterns.includes(path)) return path;
  const parts = path.split("/");
  return r.routePatterns.find((p) => {
    const pp = p.split("/");
    return pp.length === parts.length && pp.every((seg, i) => seg.startsWith(":") || seg === parts[i]);
  });
}

function pageFile(r: Repo, path: string): string | undefined {
  const pattern = patternFor(r, path);
  if (!pattern) return undefined;
  const comp = r.routeComponent.get(pattern);
  const rel = comp ? r.lazyFiles.get(comp) : undefined;
  if (!rel) return undefined;
  const base = rel.replace(/^@\//, "client/src/").replace(/^\.\//, "client/src/");
  return [`${base}.tsx`, `${base}.ts`].find((f) => r.pageSource.has(f));
}

/* ───────── the audit ───────── */

export function auditPage(c: CalculatorEntry): PageAudit {
  const r = repo();
  const dims = {} as Record<DimensionId, boolean>;
  const evidence: Partial<Record<DimensionId, string>> = {};
  const missing: string[] = [];

  const pattern = patternFor(r, c.path);
  dims.routed = Boolean(pattern);
  if (pattern) evidence.routed = `App.tsx path="${pattern}"`; else missing.push(`Add a <Route path="${c.path}"> in client/src/App.tsx.`);

  const engineExists = Boolean(c.engine && existsSync(join(root, c.engine)));
  dims.engine = engineExists;
  if (engineExists) evidence.engine = c.engine!; else missing.push(c.engine ? `Engine ${c.engine} is named in the catalogue but is not on disk.` : `Name the engine in shared/calculatorCatalog.ts (engine: "shared/….ts") so provenance and the brain can cite it.`);

  const file = pageFile(r, c.path);
  const src = file ? r.pageSource.get(file) ?? "" : "";
  const imports = all(src, /from "@shared\/([A-Za-z0-9/]+)"/g).map((m) => `shared/${m[1]}.ts`);
  const realImports = imports.filter((m) => m !== "shared/taxBracketEngine.ts" || c.engine === m);
  dims.pageImports = realImports.length > 0;
  if (dims.pageImports) evidence.pageImports = realImports.slice(0, 3).join(", "); else missing.push(file ? `${file} imports no shared engine — the page's figures are not reproducible outside it. Move the arithmetic to shared/ and import it.` : `No page file resolves for ${c.path}.`);

  const brainHits = [c.engine, ...realImports].filter((m): m is string => typeof m === "string" && r.memoryModules.has(m));
  dims.brain = brainHits.length > 0;
  if (dims.brain) evidence.brain = brainHits[0]; else missing.push(`Add ${c.engine ?? realImports[0] ?? "its engine"} to a group in shared/aiMemoryBank.ts so the twelve channels can use it.`);

  const testHits = [c.engine, ...realImports].filter((m): m is string => typeof m === "string" && r.testImports.has(m));
  dims.tested = testHits.length > 0;
  if (dims.tested) evidence.tested = testHits[0]; else missing.push(`No server/*.test.ts imports ${c.engine ?? realImports[0] ?? "the engine"}. Add one that reproduces a figure the page shows.`);

  dims.genome = r.genomePaths.has(c.path);
  if (dims.genome) evidence.genome = "named in a genome strategy's relatedPaths"; else missing.push(`No strategy in shared/genomeStrategies.ts names ${c.path} in relatedPaths — the predictive layer cannot route a household here.`);

  const inbound = (r.hrefCounts.get(c.path) ?? 0) - (src.includes(`"${c.path}"`) ? 1 : 0);
  dims.crossLinked = inbound >= 2;
  evidence.crossLinked = `${Math.max(0, inbound)} inbound link${inbound === 1 ? "" : "s"}`;
  if (!dims.crossLinked) missing.push(`Only ${Math.max(0, inbound)} other surface${inbound === 1 ? "" : "s"} link to ${c.path}. Add it where a reader would need it next (a related page's footer, the relevant dossier, the planner).`);

  dims.sphere = r.sphere.includes(`"${c.path}"`) || r.sphere.includes(`'${c.path}'`);
  if (dims.sphere) evidence.sphere = "shared/sphere.ts"; else missing.push(`Place ${c.path} on the sphere in shared/sphere.ts.`);

  const routersUsed = all(src, /trpc\.(\w+)\./g).map((m) => m[1]);
  const live = routersUsed.filter((n) => r.dataRouters.has(n));
  dims.liveData = live.length > 0;
  if (dims.liveData) evidence.liveData = `trpc.${live[0]} → server/${r.routerFiles.get(live[0]) ?? "?"}.ts fetches an external source`; else missing.push(routersUsed.length ? `Calls trpc.${routersUsed[0]} (server/${r.routerFiles.get(routersUsed[0]) ?? routersUsed[0]}.ts) but that router fetches no external data source. Wire a sourced series (FRED, BLS, FHFA, Zillow) into it, or state on the page that the figures are static.` : `No tRPC call from ${file ?? c.path} — every figure is client-side and cannot be refreshed from a source. Add a router under server/ that supplies dated inputs.`);

  dims.provenance = r.provenanceText.includes(c.path) || Boolean(c.engine && r.provenanceText.includes(c.engine));
  if (dims.provenance) evidence.provenance = "shared/provenance.ts"; else missing.push(`No FigureTrace in shared/provenance.ts covers ${c.path}. Add one so a client can see how its headline figure is made.`);

  const score = (Object.keys(DIMENSION_WEIGHT) as DimensionId[]).reduce((n, d) => n + (dims[d] ? DIMENSION_WEIGHT[d] : 0), 0);
  return { path: c.path, name: c.name, category: c.category, engine: c.engine, featured: Boolean(c.featured), score: Math.round(score * 10) / 10, dims, missing, evidence };
}

export function auditCatalogue(): PageAudit[] {
  return CALCULATORS.map(auditPage).sort((a, b) => b.score - a.score || a.path.localeCompare(b.path));
}

export interface AuditSummary {
  readonly pages: number;
  readonly mean: number;
  readonly perfect: number;
  readonly below5: number;
  /** How many pages miss each dimension — where the system-wide gaps are. */
  readonly gaps: Record<DimensionId, number>;
  readonly dataRouters: string[];
}

export function auditSummary(audits = auditCatalogue()): AuditSummary {
  const gaps = {} as Record<DimensionId, number>;
  for (const d of Object.keys(DIMENSION_WEIGHT) as DimensionId[]) gaps[d] = audits.filter((a) => !a.dims[d]).length;
  return {
    pages: audits.length,
    mean: Math.round((audits.reduce((n, a) => n + a.score, 0) / Math.max(1, audits.length)) * 10) / 10,
    perfect: audits.filter((a) => a.score >= 10).length,
    below5: audits.filter((a) => a.score < 5).length,
    gaps,
    dataRouters: Array.from(repo().dataRouters).sort(),
  };
}

/** Drop the cache — tests that mutate fixtures need a fresh read. */
export function resetAuditCache(): void { cached = null; }
