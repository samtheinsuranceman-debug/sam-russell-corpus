import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const roots = [path.join(root, "client", "src", "pages", "portal"), path.join(root, "client", "src", "components")];
const files = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const file = path.join(dir, name);
    if (statSync(file).isDirectory()) walk(file);
    else if (/\.(tsx?|css)$/.test(name)) files.push(file);
  }
}

roots.forEach(walk);
const tokenPattern = /#[0-9a-fA-F]{3,8}\b|\b(?:bg|text|border|ring|from|via|to)-(?:purple|violet|fuchsia|emerald|green|teal|blue|sky|cyan|red|rose|amber|yellow|orange|slate|gray|zinc|neutral)-\d{2,3}\b/g;
const counts = new Map();
const filesByToken = new Map();

for (const file of files) {
  const source = readFileSync(file, "utf8");
  for (const token of source.match(tokenPattern) ?? []) {
    const normalized = token.toLowerCase();
    counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
    const set = filesByToken.get(normalized) ?? new Set();
    set.add(path.relative(root, file));
    filesByToken.set(normalized, set);
  }
}

function category(token) {
  if (/purple|violet|fuchsia|#8b5cf6|#7c3aed|#a855f7|#c4b5fd/.test(token)) return "Scoped Purple System";
  if (/red|rose|amber|yellow|orange/.test(token)) return "Semantic Status / Warning";
  if (/emerald|green|teal|#22c55e|#10b981|#14b8a6/.test(token)) return "Finance Positive / Legacy Green";
  if (/slate|gray|zinc|neutral|#0b|#0f|#11|#12|#17|#1e|#334155/.test(token)) return "Legacy Surface / Neutral";
  if (/blue|sky|cyan/.test(token)) return "Informational Accent";
  return "Other Hardcoded Token";
}

const rows = [...counts.entries()]
  .map(([token, count]) => ({ token, count, category: category(token), files: [...filesByToken.get(token)].length }))
  .sort((a, b) => b.count - a.count || a.token.localeCompare(b.token));

const csv = ["token,count,file_count,category", ...rows.map(row => `${row.token},${row.count},${row.files},${row.category}`)].join("\n");
writeFileSync(path.join(root, "audit", "interior-color-token-inventory.csv"), `${csv}\n`);

const totals = rows.reduce((acc, row) => {
  acc[row.category] = (acc[row.category] ?? 0) + row.count;
  return acc;
}, {});
writeFileSync(path.join(root, "audit", "interior-color-token-summary.json"), JSON.stringify({ filesScanned: files.length, uniqueTokens: rows.length, totals }, null, 2));
console.log(JSON.stringify({ filesScanned: files.length, uniqueTokens: rows.length, totals }, null, 2));
