import { build } from "esbuild";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const clientDir = path.join(root, "client");
const outDir = path.join(root, "dist", "public");
const assetsDir = path.join(outDir, "assets");

rmSync(outDir, { recursive: true, force: true });
mkdirSync(assetsDir, { recursive: true });

execFileSync(
  path.join(root, "node_modules", ".bin", "tailwindcss"),
  ["-i", path.join(clientDir, "src", "index.css"), "-o", path.join(assetsDir, "app.css"), "--minify"],
  { cwd: root, stdio: "inherit", env: { ...process.env, NODE_ENV: "production" } },
);

const viteEnv = Object.fromEntries(
  Object.entries(process.env)
    .filter(([key]) => key.startsWith("VITE_"))
    .map(([key, value]) => [key, value ?? ""]),
);

await build({
  absWorkingDir: root,
  entryPoints: [path.join(clientDir, "src", "main.tsx")],
  bundle: true,
  splitting: true,
  format: "esm",
  platform: "browser",
  target: ["es2019"],
  jsx: "automatic",
  outdir: outDir,
  entryNames: "assets/app",
  chunkNames: "assets/chunks/[name]-[hash]",
  assetNames: "assets/media/[name]-[hash]",
  minify: true,
  sourcemap: false,
  treeShaking: true,
  logLevel: "info",
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

let html = readFileSync(path.join(clientDir, "index.html"), "utf8");
html = html.replace('<script type="module" src="/src/main.tsx"></script>', '<script type="module" src="/assets/app.js"></script>');
html = html.replace("</head>", '  <link rel="stylesheet" href="/assets/app.css" />\n  </head>');

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
console.log("[build] Frontend emitted to dist/public with esbuild code splitting and compiled Tailwind CSS.");
