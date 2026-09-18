# Russell Capital Unified Source Manifest

**Audit date:** 2026-08-26  
**Purpose:** Establish immutable source identities and the verified application boundary before any managed-project import.

| Role | Uploaded archive | Exact size | SHA-256 | Status |
|---|---|---:|---|---|
| Primary source | `russell-capital-solutions-complete(4).zip` | 41,782,994 bytes | `e2d3ecaff235fd6ddf933d2f2634c2e0e956a6a21f0b787ed859a90a40e5ba27` | Frozen read-only |
| Additional pages | `Russell_Capital_FULL_SITE_GROK_JSON.zip` | 7,331,308 bytes | `d254351fe8927dcf4858c525b34ea856e403db4a47adc40037414b53a0eacca8` | Frozen read-only |

The latest `(4)` primary upload is byte-for-byte identical to the earlier `russell-capital-solutions-complete.zip`, so the latest filename is used while preserving a single canonical content identity. The primary archive contains two applications. The correct full platform is the directory named `russell-capital`; the directory named `russell-capital-solutions` is the much smaller marketing application and is retained only as reference material.

| Primary platform metric | Verified value |
|---|---:|
| Files | 744 |
| Explicit routed pages | 222 |
| TSX page modules | 260 |
| Vitest files | 90 |
| SQL migration files | 58 |
| Bundled local media files | 0 |
| Root lockfiles | 0 |

The primary platform is a React 19, TypeScript, Vite, Express, tRPC, Drizzle/MySQL application with managed authentication, storage helpers, PDF and PowerPoint generation libraries, spreadsheet export, email, Stripe dependencies, and an extensive test suite. Its archive was inventoried without executing bundled scripts.

## Additional-page delta

The Grok archive is a JSON-wrapped snapshot whose reconstructed source differs from the related large source build by eight modules: seven routed page components and one shared visual kit.

| Added route module | Shared dependency |
|---|---|
| `TheArrival.tsx` | `portal/_genome/GenomeKit.tsx` |
| `TheMirror.tsx` | `portal/_genome/GenomeKit.tsx` |
| `TheStrategyTable.tsx` | `portal/_genome/GenomeKit.tsx` |
| `TheField.tsx` | `portal/_genome/GenomeKit.tsx` |
| `TheMap.tsx` | `portal/_genome/GenomeKit.tsx` |
| `TheLegacy.tsx` | `portal/_genome/GenomeKit.tsx` |
| `TheBrotherhood.tsx` | `portal/_genome/GenomeKit.tsx` |

## Import and security rules

The uploaded ZIPs remain untouched under `/home/ubuntu/russell-capital-unified-sources/archives`. Code is imported only from extracted reference copies. No archive-provided environment file, embedded credential, dependency directory, database, or runtime process is trusted automatically. The managed project’s OAuth, database connection, storage, analytics, and secret injection remain authoritative. All direct-provider keys are server-side only, and no API key is permitted in browser bundles, route source, logs, or audit exports.

## Verified release-copy workspace

The import source is separated from both the immutable archive files and their broad extraction directories. The verified primary release is located at `/home/ubuntu/russell-capital-unified-sources/release/primary` and contains the complete 744-file `russell-capital` platform selected from the primary archive. The verified addition release is located at `/home/ubuntu/russell-capital-unified-sources/release/addition` and contains only the eight source modules proven to be additive: the seven Sacred Seven page components and their shared `GenomeKit.tsx` component.

The eight-file addition release is intentionally a delta rather than another complete application. The untouched Grok archive remains the authoritative raw source, and `/home/ubuntu/work/grok_render` is the reconstructed full snapshot used for route, test, migration, and credential-risk inventory. Restricting the canonical import release to the eight verified additive modules prevents older or conflicting framework, database, authentication, and server files from overwriting the selected primary platform.

The source application has no bundled media files, so the existing homepage’s city asset is an external reference rather than a deploy-blocking local file. Any retained external media will be verified and moved to persistent project asset storage before the final checkpoint.
