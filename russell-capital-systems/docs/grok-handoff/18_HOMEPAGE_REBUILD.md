# 18 — The homepage rebuild: clean pictures, one slogan, fifteen claims

`shared/homeManifesto.json` · `client/src/pages/Landing.tsx` ·
`live/rcs-live-homepage.template.html` + `live/build_live_homepage.py` →
`docs/index.html` · `server/founderVoice.ts` · `server/concept16Homepage.test.ts` ·
`docs/HOMEPAGE_SEQUENCES.md`

The owner's brief, September 2026: strip most of the content off the image
pages so the patent-pending technology is what stands out; keep the pictures
clean of white titles, buttons and forms; one slogan only, one line, at the
bottom of one or two image pages; fifteen technology claims, each two or
three bold glowing sentences a physician can read in ten minutes, stacked in
the order they build on one another; declarations about what exists only
here; the lead card last; no purple anywhere.

## One source of words
Everything the page says lives in `shared/homeManifesto.json`: `slogan`,
`declarations` (six), `expect` (five), `claims` (fifteen: `ref`, `name`,
`lead`, `detail`), `status`, `disclaimer`, `founderMessage`. The app imports
it (`resolveJsonModule` is on); the static builder injects it as a JSON
`<script>` and the page renders from it. Change the words once.

## The nine screens
1. The neon sign (hero). sr-only `h1`; nothing on the picture.
2. The horizon (`rcs-city-horizon.webp`, built from the harbour master with
   the water extended below and the sky above so the city sits low). The
   slogan drifts along the bottom on one line (`.rc-slogan-track`; still and
   wrapped under `prefers-reduced-motion`).
3. `#manifesto`: the six declarations, numbered, no image.
4. The skyway, clean (phones: the flagship towers).
5. `#claims`: the fifteen, `ref` / `name` / bold `lead` / quiet `detail`,
   "Only at RCS" on each, the disclaimer under them.
6. The expressway, clean (phones: the glass strip).
7. `#expect`: five declarations and the founder's voice.
8. The second sign (`rcs-neon-b`, the green-sky master) with the slogan again.
9. `HomeLeadFactFinder` (`#planning-estimator`), then the footer.

Removed from the homepage: the war-chest hero copy, the five-pillar strip,
both selector cards, the command-center calculator, the AI concierge section
(the mic button still floats on every page), the senior-partner band, how we
work, FAQ, the client-portal code box, the consultation card, the closing
"Keep more" card, the mobile sticky bar, the eight planning-area cards.

## The founder's voice
`GET /api/founder-message.mp3` synthesises `founderMessage` once per process
through ElevenLabs with `ELEVENLABS_API_KEY` + `ELEVENLABS_VOICE_ID` (the
owner's cloned voice) and caches it; 404 when unset, so the player stays
hidden. The static site points at the Railway origin for the same file.

## Purple
Every `violet-*`, `purple-*`, `fuchsia-*` class and purple hex/rgba/oklch value
in `client/src` was mapped to the emerald palette, including the portal theme
block in `index.css` and the sidebar override. The test greps for it.

## Tests
`server/concept16Homepage.test.ts` now checks: the hero and image pages carry
no headings, buttons, forms or selects; exactly two slogan pages; fifteen
claims of two or three sentences in ascending order; the declarations name
the competitors, the clinical-trials line and "speed of thought"; the founder
endpoint and player; the lead card last; anchors resolve; no purple; the
static template mirrors the ids, placeholders and words.
