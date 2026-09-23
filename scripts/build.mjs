import { build } from "esbuild";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import path from "node:path";

const root = process.cwd();
const clientDir = path.join(root, "client");
const outDir = path.join(root, "dist", "public");
const assetsDir = path.join(outDir, "assets");

rmSync(outDir, { recursive: true, force: true });
mkdirSync(assetsDir, { recursive: true });

// ── Stylesheet ────────────────────────────────────────────────────────────
// Every stylesheet main.tsx imports ships, in import order (esbuild stubs CSS
// imports below). index.css goes through Tailwind; the rest (styles/interior.css,
// "loaded AFTER index.css so it settles the cascade") are compiled and appended
// after it. Before this, interior.css existed in dev only.
const tailwind = (input, output) => execFileSync(
  path.join(root, "node_modules", ".bin", "tailwindcss"),
  ["-i", input, "-o", output, "--minify"],
  { cwd: root, stdio: "inherit", env: { ...process.env, NODE_ENV: "production" } },
);
const mainSource = readFileSync(path.join(clientDir, "src", "main.tsx"), "utf8");
const cssImports = Array.from(mainSource.matchAll(/^import\s+["'](\.[^"']+\.css)["'];?\s*$/gm), (m) => path.join(clientDir, "src", m[1]));
if (!cssImports.length || path.basename(cssImports[0]) !== "index.css") throw new Error("[build] main.tsx must import ./index.css first");
const cssParts = [];
for (const [i, input] of cssImports.entries()) {
  const out = path.join(assetsDir, `.part-${i}.css`);
  tailwind(input, out);
  cssParts.push(readFileSync(out, "utf8"));
  rmSync(out);
}
const css = cssParts.join("\n");
// Content-hashed so the server can cache it for a year (cacheControlFor marks app-XXXXXXXX.* immutable).
const cssName = `app-${createHash("sha256").update(css).digest("hex").slice(0, 8).toUpperCase()}.css`;
writeFileSync(path.join(assetsDir, cssName), css);
console.log(`[build] ${cssImports.map((f) => path.relative(clientDir, f)).join(" + ")} -> assets/${cssName}`);

const viteEnv = Object.fromEntries(
  Object.entries(process.env)
    .filter(([key]) => key.startsWith("VITE_"))
    .map(([key, value]) => [key, value ?? ""]),
);

const result = await build({
  absWorkingDir: root,
  entryPoints: [path.join(clientDir, "src", "main.tsx")],
  bundle: true,
  splitting: true,
  format: "esm",
  platform: "browser",
  target: ["es2019"],
  jsx: "automatic",
  outdir: outDir,
  entryNames: "assets/app-[hash]",
  chunkNames: "assets/chunks/[name]-[hash]",
  assetNames: "assets/media/[name]-[hash]",
  minify: true,
  sourcemap: false,
  treeShaking: true,
  logLevel: "info",
  metafile: true,
  tsconfig: path.join(root, "tsconfig.json"),
  inject: [path.join(root, "scripts", "react-runtime-inject.mjs")],
  define: {
    "process.env.NODE_ENV": '"production"',
    "import.meta.env": JSON.stringify(viteEnv),
  },
  loader: {
    ".png": "file",
    ".jpg": "file",
    ".jpeg": "file",
    ".gif": "file",
    ".svg": "file",
    ".webp": "file",
    ".woff": "file",
    ".woff2": "file",
  },
  plugins: [
    {
      name: "external-compiled-styles",
      setup(builder) {
        builder.onResolve({ filter: /\.css$/ }, args => ({ path: args.path, namespace: "compiled-style" }));
        builder.onLoad({ filter: /.*/, namespace: "compiled-style" }, () => ({ contents: "export default {};", loader: "js" }));
      },
    },
  ],
});

const publicDir = path.join(clientDir, "public");
if (existsSync(publicDir)) cpSync(publicDir, outDir, { recursive: true, force: true });

// ── Entry script and its static import closure ───────────────────────────
// The entry is content-hashed. Every chunk it (transitively) imports statically
// is announced with <link rel="modulepreload">, so the browser fetches them in
// parallel instead of discovering them one import level at a time.
const outputs = result.metafile.outputs;
const toUrl = (out) => "/" + path.relative(outDir, path.join(root, out)).split(path.sep).join("/");
const entryOut = Object.keys(outputs).find((o) => outputs[o].entryPoint && /main\.tsx$/.test(outputs[o].entryPoint));
if (!entryOut) throw new Error("[build] esbuild metafile has no output for main.tsx");
const preload = [];
const seen = new Set([entryOut]);
const queue = [entryOut];
while (queue.length) {
  const cur = queue.shift();
  for (const imp of outputs[cur]?.imports ?? []) {
    if (imp.kind !== "import-statement" || imp.external || seen.has(imp.path)) continue;
    seen.add(imp.path);
    queue.push(imp.path);
    preload.push(toUrl(imp.path));
  }
}
const entryUrl = toUrl(entryOut);

let html = readFileSync(path.join(clientDir, "index.html"), "utf8");
html = html.replace('<script type="module" src="/src/main.tsx"></script>', `<script type="module" src="${entryUrl}"></script>`);
html = html.replace("</head>", [
  `  <link rel="stylesheet" href="/assets/${cssName}" />`,
  ...preload.map((u) => `  <link rel="modulepreload" href="${u}" />`),
  "  </head>",
].join("\n"));
console.log(`[build] entry ${entryUrl} with ${preload.length} modulepreload hints`);

const analyticsEndpoint = process.env.VITE_ANALYTICS_ENDPOINT;
const analyticsWebsiteId = process.env.VITE_ANALYTICS_WEBSITE_ID;
if (analyticsEndpoint && analyticsWebsiteId) {
  html = html
    .replaceAll("%VITE_ANALYTICS_ENDPOINT%", analyticsEndpoint)
    .replaceAll("%VITE_ANALYTICS_WEBSITE_ID%", analyticsWebsiteId);
} else {
  html = html.replace(/\s*<script\s+defer\s+src="%VITE_ANALYTICS_ENDPOINT%\/umami"[\s\S]*?<\/script>/, "");
}

writeFileSync(path.join(outDir, "index.html"), html);

// Every route the app declares, so the server can answer a real 404 for the
// paths it does not know instead of serving the shell with status 200.
const appSource = readFileSync(path.join(clientDir, "src", "App.tsx"), "utf8");
const routes = Array.from(new Set(Array.from(appSource.matchAll(/<Route\s+path="([^"]+)"/g), (m) => m[1])));
writeFileSync(path.join(outDir, "routes.json"), JSON.stringify({ generatedAt: new Date().toISOString(), routes }, null, 0));
console.log(`[build] ${routes.length} route patterns written to dist/public/routes.json`);
console.log("[build] Frontend emitted to dist/public with esbuild code splitting and compiled Tailwind CSS.");
