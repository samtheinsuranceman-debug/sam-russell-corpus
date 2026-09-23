import { defineConfig } from "vitest/config";
import path from "path";

const templateRoot = path.resolve(import.meta.dirname);

export default defineConfig({
  root: templateRoot,
  resolve: {
    alias: {
      "@": path.resolve(templateRoot, "client", "src"),
      "@shared": path.resolve(templateRoot, "shared"),
      "@assets": path.resolve(templateRoot, "attached_assets"),
    },
  },
  test: {
    environment: "node",
    include: ["server/**/*.test.ts", "server/**/*.spec.ts"],
    // The first `import("./routers")` in a file loads the whole app router,
    // which takes 5-8 s on a cold worker now that it carries the macro layer
    // and build 3; vitest's 5 s default made that a timing flake (round31 was
    // patched per test on 22 Sep, round41-42 tripped on 23 Sep). One ceiling
    // for every file instead of a patch per file.
    testTimeout: 30_000,
  },
});
