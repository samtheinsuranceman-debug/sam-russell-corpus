import { defineConfig } from "vitest/config";
import path from "path";

const templateRoot = path.resolve(import.meta.dirname);

export default defineConfig({
  root: templateRoot,
  // Page components under test use JSX without importing React; match the
  // app build's automatic runtime instead of esbuild's classic default.
  esbuild: { jsx: "automatic" },
  resolve: {
    alias: {
      "@": path.resolve(templateRoot, "client", "src"),
      "@shared": path.resolve(templateRoot, "shared"),
      "@assets": path.resolve(templateRoot, "attached_assets"),
    },
  },
  test: {
    environment: "node",
    include: [
      "server/**/*.test.ts",
      "server/**/*.spec.ts",
      "shared/**/*.test.ts",
      // Pure-data integrity tests (no DOM) can live under client/ too.
      "client/src/components/PageErrorBoundary.test.tsx",
      "client/src/pages/archetypesData.test.ts",
      "client/src/pages/researchLibraryData.corrections.test.ts",
      "client/src/lib/deepPageExpansion.test.ts",
      "client/src/lib/deepPageNavigationContracts.test.ts",
      "client/src/lib/expansion203Contracts.test.ts",
      "client/src/lib/expansion500Contracts.test.ts",
      "client/src/lib/nestedAnchors.test.ts",
      "client/src/lib/homeCounts.test.ts",
      "client/src/lib/pageShorts.test.ts",
      "client/src/lib/routeMetaFor.test.ts",
    ],
  },
});
