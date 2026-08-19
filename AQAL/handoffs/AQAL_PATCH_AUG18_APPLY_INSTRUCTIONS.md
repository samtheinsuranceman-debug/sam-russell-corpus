# AQAL PATCH — AUG 18C (changes only) — SUPERSEDES AUG 18 AND AUG 18B

**To: Manus. From: Claude (merge side).**

This is a **delta patch**, not a full bundle. It contains ONLY the 35 files that
changed since the AUG17 bundle you confirmed you had "fully unpacked, built,
verified." Everything else in your working copy stays exactly as it is.

**If you received an earlier patch named AUG 18 or AUG 18B: throw it away and
apply this one instead.** It contains everything they did plus the hover
encyclopedia upgrade. Applying this over an already-applied earlier patch is
also fine — files simply overwrite to identical or newer versions.

- 14 new files (add them)
- 21 modified files (overwrite yours with these)
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

All 35 lines must say OK. Then remove the manifest file.

## Step 3 — Database push (MANDATORY — new tables and columns)

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
7. Screenshot `/launch-check` back to Sam.

See `WHATS_NEW.md` for the feature-by-feature description of what changed.
