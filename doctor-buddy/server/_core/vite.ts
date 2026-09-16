import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";

export async function setupVite(app: Express, server: Server) {
  // vite is a devDependency: the production image does not carry it, so it
  // is loaded here, on the development path only, never at module load.
  const { createServer: createViteServer, createLogger } = await import("vite");
  const { default: viteConfig } = await import("../../vite.config");
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
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.CLIENT_DIST_DIR
      ? path.resolve(process.env.CLIENT_DIST_DIR)
      : process.env.NODE_ENV === "development"
        ? path.resolve(import.meta.dirname, "../..", "dist", "public")
        : path.resolve(import.meta.dirname, "public");
  const indexFile = path.resolve(distPath, "index.html");
  if (!fs.existsSync(indexFile)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
    app.use("*", (_req, res) => {
      res.status(503).json({ error: "The application is not built on this host" });
    });
    return;
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist; only a GET or HEAD
  // can ask for a page, anything else is refused in JSON
  app.use("*", (req, res) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.setHeader("Allow", "GET, HEAD");
      return res.status(405).json({ error: "Method not allowed" });
    }
    res.sendFile(indexFile);
  });
}
