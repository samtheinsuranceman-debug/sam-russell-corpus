# Role logins, role dashboards, and the spoken AI fact finder

Shipped 2026-09-16 on master (commit 9c727d8, probe 5fc7ad4).

## Three doors
- Landing header: **Physician Login**, **Client Login**, **Advisor Login** (the mobile menu has the same three). Signed-in visitors see **Dashboard**.
- `/login?role=physician|client|advisor` shows the three role buttons on the sign-in card; the chosen role sets where the visitor lands.
- Dashboards: `/portal/physician`, `/portal/client`, `/portal/advisor` (gated: auth + compliance + ChainDock). Each has a role switcher, the 12-AI panel, the blue microphone, and role shortcuts. `?talk=1` opens the microphone and starts talking on arrival.

## The 12-AI system
Eleven configured model voices (`ultra.providers`) plus the always-on Russell rule engine. The panel box fans a question out through `ultra.panel` and shows the synthesis plus every voice; unconfigured voices are listed, never faked.

## The spoken fact finder
- Script: `shared/aiIntakeScript.ts` (`INTAKE_STEPS`, branching via `askIf`, `nextStep`, `parseAnswer`, `buildRecap`, `applyIntakeToFactFinder`, `buildThreeQuestions`, `PERMISSION_ASK`).
- Order: cash (money market, CDs, checking, savings, rate) → stocks outside the IRA (value, who manages, advisor first name, years) → bonds (value, rate) → mutual funds → annuities (carrier, year or years ago, value, guaranteed for life? → monthly income, else average return) → home (owns, value, mortgage, ZIP) → rentals (count, one mortgage total, interest-only payments, equity, net rent) → retirement (401k, IRA/SEP, Roth, spouse) → unusual (crypto, gold/silver, hard assets + description).
- Then: recap ("Did I get that right?" → no lets them tap the answer to fix), priorities, three magic wishes (accounts, future, outcomes), the permission ask, the three horizon questions (5/10/15 years) each with evidence in their own figures, the strategies engaged, and calculator links (always includes the Calculator Chain).
- Component: `client/src/components/AiIntake.tsx`. Voice out: ElevenLabs via `ultra.speak` when configured, otherwise the browser's own `speechSynthesis`. Voice in: browser SpeechRecognition (audio never leaves the machine). Typed fallback always present. Hands-free loop re-listens after each prompt. Progress persists in `localStorage` (`rcs_intake_v1`).
- Server: `server/intakeRouter.ts` — `intake.script`, `intake.recap`, `intake.threeQuestions` (deterministic first; `leadModel` rewrites the wording as spoken paragraphs when a key is configured; `via` reports which), `intake.save` (protected; merges into the signed-in user's Financial Assessment without erasing other answers, ledgered).

## Tests and probes
- `server/aiIntake.test.ts` (9): parsing, branching, recap, mapping, three questions.
- Smoke tests expect 264 routes. Sidebar Home section lists the three dashboards and the chain (navigation test).
- Live probe: GitHub Action **Intake API probe** (`.github/workflows/intake-probe.yml`, script `.github/audit/intake-probe.mjs`): the five pages serve the app, script ≥ 40 steps, recap, three questions, and `intake.save` returns 401 unauthenticated.
