# AQAL Platform — Handoffs & Working Documents

Cross-AI coordination documents for the AQAL Intelligence Platform build
(Sam Russell × Claude × Manus × Perplexity × Grok), August 2026.

| File | What it is |
|------|------------|
| `AQAL_Perplexity_Work_Order.pdf` | 42 high-priority research/engineering tasks for Perplexity, with ground rules, deliverable JSON schemas, and a 4-week order of attack. Sections A–H (verification, layering, feedback loops, personas, goals, matching, new fronts, outside-the-box). |
| `AQAL_Reply_To_Perplexity.pdf` | Reply to Perplexity's blocked-tasks status: answers his question, maps the engine data handoff to each blocked task, and lists the return manifest (dozen reports, g-independence scorecard, four original deliverables, Myth Museum). |
| `AQAL_ENGINE_DATA_HANDOFF.json` | Verbatim export of the live engine: 32-line taxonomy with independence flags, all 136 therapy→line entries, 39 keystone practices, 32 live prescription scenarios + frequency table, goal templates + clock source, matching formula + source, library cluster schema. Unblocks work-order tasks 18, 20, 22, 23, 25, 27, 33, 35–40. |
| `AQAL_Top20_Homepage_Descriptions.pdf` | The 20 best homepage scripts (from 100 candidates, Claude × Manus), ordered for a homepage scroll. |
| `AQAL_50_Homepage_Scripts.md` | Full set of 50 homepage scripts written from Sam's dictated vision. |
| `AQAL_27_Questions_Print_Pack.md` | All 27 assessment questions with option-B and option-C backups per question — the tape-recorder answer pack. |
| `AQAL_100X_Strategy.md` | 25 growth suggestions, 20 high-value metrics, and overlooked protocols for making the platform 100X more effective and durable. |
| `AQAL_PATCH_AUG18_APPLY_INSTRUCTIONS.md` | Manus apply guide for the AUG18 delta patch (29 changed files on top of the AUG17 bundle): base fingerprint checks, copy step, checksum verify, mandatory `pnpm db:push` (new `crash_events`/`crash_signatures` tables + 4 `users` columns), new env vars (`RESEND_API_KEY`, `LLM_DAILY_BUDGET_USD`), post-deploy checklist. |
| `AQAL_PATCH_AUG18_WHATS_NEW.md` | Feature-by-feature description of the AUG18 delta: Line Encyclopedia popup, Black Box + Final Three, support-to-Sam, password reset + email verification, the Results launch experience, cost monitor, Terms 8B/8C + data sovereignty, claims fixes, Goals upgrades. |
| `AQAL_PATCH_AUG18_MANIFEST.sha256` | SHA-256 checksums of the 29 files in the AUG18 patch, for integrity verification after copying. |

Incoming Perplexity deliverables get verified by Claude (every DOI checked at
doi.org, sustain-or-concede against current platform numbers) before anything
enters the research library or flips a flag in `aqal-platform/shared/axisModes.ts`.
