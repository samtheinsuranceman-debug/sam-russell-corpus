import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { cacheControlFor, isKnownRoute, loadRoutePatterns, renderHtml, requestFacts, siteOrigin } from "./siteHardening";

export async function setupVite(app: Express, server: Server) {
  // Loaded on demand: vite and the vite config (and its plugins) are dev-only
  // dependencies. Importing them at the top would make the production bundle
  // crash on hosts installed with `--omit=dev`.
  // (The config path is a variable so esbuild leaves it out of the production
  // bundle instead of inlining the config and its plugin imports.)
  const viteConfigPath = "../../vite.config";
  const [{ createServer: createViteServer }, { default: viteConfig }] = await Promise.all([
    import("vite"),
    import(viteConfigPath) as Promise<{ default: Record<string, unknown> }>,
  ]);
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const facts = requestFacts(req);
      const rendered = renderHtml({ template, path: facts.path, origin: siteOrigin(facts) });
      const page = await vite.transformIndexHtml(url, rendered.html);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  // Static files with a cache policy per asset class; index.html is never
  // served raw — it goes through renderHtml so every route carries its own
  // title, description, canonical link and structured data.
  app.use(express.static(distPath, {
    index: false,
    etag: true,
    lastModified: true,
    setHeaders(res, filePath) {
      const rel = "/" + path.relative(distPath, filePath).split(path.sep).join("/");
      res.setHeader("Cache-Control", cacheControlFor(rel));
    },
  }));

  const routes = loadRoutePatterns(distPath);
  if (routes.length) console.log(`[site] ${routes.length} route patterns loaded; unknown paths answer 404`);
  const templatePath = path.resolve(distPath, "index.html");
  let template: string | null = null;
  const readTemplate = () => {
    if (template === null || process.env.NODE_ENV === "development") template = fs.existsSync(templatePath) ? fs.readFileSync(templatePath, "utf8") : "";
    return template;
  };

  // fall through to index.html if the file doesn't exist
  app.use("*", (req, res) => {
    const facts = requestFacts(req);
    // A missing file (something.png, .map, .php probes) is a plain 404, not the app shell.
    if (/\.[a-z0-9]{1,8}$/i.test(facts.path) && !facts.path.endsWith(".html")) {
      res.status(404).type("text/plain").send("Not found");
      return;
    }
    const tpl = readTemplate();
    if (!tpl) { res.status(503).type("text/plain").send("The site is not built yet."); return; }
    const known = isKnownRoute(facts.path, routes);
    const { html, status } = renderHtml({ template: tpl, path: facts.path, origin: siteOrigin(facts), known });
    res.status(status).setHeader("Cache-Control", cacheControlFor(facts.path));
    res.type("text/html").send(html);
  });
}
