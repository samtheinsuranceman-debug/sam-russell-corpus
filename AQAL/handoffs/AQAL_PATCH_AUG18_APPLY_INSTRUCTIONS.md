# AQAL PATCH — AUG 18O (changes only) — SUPERSEDES ALL EARLIER AUG-18 PATCHES

**To: Manus. From: Claude (merge side).**

This is a **delta patch**, not a full bundle. It contains ONLY the 76 files that
changed since the AUG17 bundle you confirmed you had "fully unpacked, built,
verified." Everything else in your working copy stays exactly as it is.

**If you received ANY earlier AUG-18 patch (18 through 18N): throw it away and
apply this one instead.** It contains everything they did plus the therapy
library expansion to 156 protocols, the Myth Museum expansion to 191 sourced
exhibits, and the four new browse families — capacities, kinds, wings,
verdicts (2,466 public pages). Applying this over an already-applied earlier patch is
also fine — files simply overwrite to identical or newer versions.

- 48 new files (add them)
- 28 modified files (overwrite yours with these)
- 0 deletions (nothing to remove)

The full 9MB AQAL-DEPLOY-AUG18.zip remains the fallback if anything below
doesn't match — if a fingerprint check fails, STOP and use the full bundle
instead of guessing.

---

## Step 0 — Verify you're on the right base

Run these checks against YOUR current working copy **before** copying anything.
All four must pass:

1. `grep -c "SixteenAxesSection" client/src/pages/Home.tsx` → **2 or more**
   (the Sixteen Axes section is already in your base).
2. `grep -c "LineInfoModal" client/src/pages/Home.tsx` → **0**
   (the encyclopedia popup is NOT yet in your base — this patch adds it).
3. `grep '"db:push"' package.json` → shows `"drizzle-kit push"`
   (your base already has the corrected script — you found that one yourself).
4. `server/blackBox.ts` does **not** exist yet.

If any check fails, your base is not the AUG17 bundle → use the full zip.

## Step 1 — Copy the files

Copy everything under `aqal-patch/` into the project root, preserving paths,
overwriting on collision. Example:

```
cp -r aqal-patch/. /path/to/aqal-platform/
```

(`MANIFEST.sha256` will land in the project root — harmless; delete it after
verifying, see Step 2.)

## Step 2 — Verify integrity

From the project root:

```
sha256sum -c MANIFEST.sha256
```

All 76 lines must say OK. Then remove the manifest file.

## Step 3 — Database push (MANDATORY — new tables and columns)

(Nothing in 18L through 18O touches the schema — if you already applied any AUG-18
patch and ran `db:push`, this run will be a fast no-op. Run it anyway.)

This patch changes `drizzle/schema.ts`:

- **New tables:** `crash_events`, `crash_signatures` (the Black Box module)
- **New columns on `users`:** `reset_token_hash`, `reset_token_expires_at`,
  `email_verified_at`, `verify_token_hash` (password reset + email verification)
- **New column on `goals`:** `premortem` (the Pre-Mortem engine)

So the deploy sequence is:

```
backup the DB  →  pnpm install (no new deps, but run it)  →  pnpm db:push  →  pnpm build
```

`db:push` is the true `drizzle-kit push` (schema diff, no journal replay) — the
script you already fixed. It will ADD the tables/columns; nothing is dropped.

## Step 4 — Environment variables (set in the deployment env, never in code)

Two NEW vars this patch reads:

- `RESEND_API_KEY` — email verification, password reset, support-forwarding,
  and welcome emails all send through Resend. Without it, emails log to console
  (mock mode) and users can't actually verify or reset. **Needed for launch.**
- `LLM_DAILY_BUDGET_USD` — optional. If set (e.g. `25`), the cost monitor
  emails Sam once per day when panel spend crosses it. Unset = no alarm.

Existing vars unchanged (OPENAI/ANTHROPIC/GOOGLE-or-GEMINI/XAI/GROQ/MISTRAL/
COHERE-or-AI21-via-OPENROUTER keys, etc.). As always: keys live in env vars
only — never in the codebase, never in chat.

## Step 5 — Post-deploy verification

1. `pnpm check` (tsc) and `pnpm build` — both must be green.
2. Visit `/launch-check` as admin — every row should be green or explained
   (it now includes an LLM-budget-guard row).
3. Homepage, desktop: REST THE MOUSE on any point of the hero ring or the
   32-line dial — the encyclopedia popup opens by itself (definition,
   researchers, the "~N in 1,000 ever tested" meter, the benefit box, the
   g verdict); Escape closes it and it stays closed. On phone: tap any point → the
   encyclopedia popup opens (definition, researchers, measurability,
   g-correlation, "have you ever been tested for this?").
4. Complete a test assessment → after question 27 the "Final Three" optional
   crash-recollection screen appears before the CTAs.
5. `/black-box`, `/sample-report`, `/help`, `/reset-password`, `/verify-email`,
   `/corrections`, and `/runbook` all load.
6. The floating "? Support" button (bottom-left, every public page) sends to
   sam@russellcapitalsystems.com.
6a. The 32 line pages: /line/logical, /line/interoceptive, /line/street-smarts
   (and 29 more) each load as a full landing page; clicking any dial or ring
   point twice navigates there. The protocol library: /protocols lists 156
   protocols and /protocol/emdr, /protocol/mbsr etc. each load fully. Pair pages: /pairs picker loads and /pair/logical--strategic renders
   fully (reversed order /pair/strategic--logical also resolves). Practice
   pages: /practices lists 54 and /practice/sleep renders fully. Wave three: /goal/focus, /weak/interoceptive, /gift/spatial,
   /build/adaptive/emdr, and a /compare/ page all render fully. The Myth Museum: /myths lists 191
   exhibits and /myth/therapeutic-touch, /why-we-fall render fully. The sitemap
   lists 2,466 URLs — and every URL in it must say https://www.joinaqal.com.
   The header's new "Explore" menu must appear on deep pages (e.g.
   /protocol/emdr), desktop and mobile. View-source any page after JS loads:
   og:description must be a one-liner under 60 characters.
6b. SEO layer: `https://www.joinaqal.com/robots.txt` and `/sitemap.xml` both serve;
   the browser tab title CHANGES per page (e.g. /pricing vs /help); view-source
   on / shows the Organization JSON-LD; response headers include
   Strict-Transport-Security and X-Content-Type-Options. `http://` and
   bare `joinaqal.com` URLs 301 onto `https://www.joinaqal.com` — this
   REQUIRES `CANONICAL_HOST=www.joinaqal.com` in the deployment env plus a
   www DNS record. www is the canonical host everywhere now.
6c. New in 18L: /protocol/acceptance-and-commitment-therapy,
   /protocol/unified-protocol, /protocol/triple-p,
   /protocol/high-intensity-interval-training, and
   /build/adaptive/acceptance-and-commitment-therapy all render fully.
6d. New in 18M: /myth/laetrile, /myth/prevagen, /myth/ionic-footbath, and
   /myth/marshmallow-destiny all render fully, each showing the four-part
   "anatomy of this family" section; the Corrections Ledger's top two
   entries are dated 2026-08-22 (the 119-exhibit and 64-protocol
   pending-audit disclosures).
6e. New in 18N: /capacity/adaptive, /kind/psychotherapy,
   /wing/miracle-cure, and /verdict/harmful all render fully; /protocols
   shows the "hidden axes" strip and its title says 156 (not 92);
   /myths shows the "walk the museum by wing" strip.
6f. New in 18O: og:description on / must read "IQ graded 4 lines of
   you. We measure all 32." (the full-site description rewrite);
   /protocol/emdr shows the slim "film briefing - in production" strip
   under the title (the video slot: Sam's uploads go into
   client/src/lib/pageVideos.ts, one line per video, then redeploy);
   view-source on /protocol/emdr after JS loads shows a BreadcrumbList
   JSON-LD script (id ld-breadcrumb); the header Explore menu includes
   The Hidden Axes entry.
7. Screenshot `/launch-check` back to Sam.

See `WHATS_NEW.md` for the feature-by-feature description of what changed.
