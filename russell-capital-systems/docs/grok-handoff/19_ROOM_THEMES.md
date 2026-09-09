# 19 — The rooms: Grok's theme map, built

Companion to `docs/PAGE_ROLES_FOR_THEMING.md` (the 8 roles and 12 sections) and the
three uploaded briefs: THEME_MAP_12_SECTIONS.md, SITE_PERSONALITY_SYSTEM.md and
HEYGEN_SHOT_LISTS_12_ROOMS.md.

## What is in the code

| Piece | File | What it does |
|---|---|---|
| Theme table | `shared/themes.ts` | The ten themes as the same 14 token roles with different values; the needle map for every engine; `routeToTheme(path)` → `{ theme, needle, quiet, section, cast }`; `roomAttributes(path)` |
| Reveal copy | `shared/revealCopy.ts` | Master micro and macro, the seven needle specialisations, the three public-engine whispers, the Ivory form, the forbidden phrases |
| Room sync | `client/src/components/rooms/RoomTheme.tsx` | `<RoomSync />` stamps `data-room`, `data-needle`, `data-quiet`, `data-light`, `data-cast` on `<html>` from the route; `useRoom()`; `<CastBadge />` |
| Energy line | `client/src/components/rooms/IntegralLine.tsx` | One SVG stroke, draws 1.1s on mount, breathes at 4%, snaps for reduced motion, takes the room's wavelength |
| Reveal layer | `client/src/components/rooms/Reveal.tsx` | `<QuestionWhy />`, `<OutputWhy />`, `<EngineWhyFooter />` |
| Stylesheet | `client/src/index.css` — "THE ROOMS" section | Tokens per room, the shell remap, the five voices, textures, the light-room remap, the quiet pass |
| Type rack | `client/index.html` | Fraunces (display), IBM Plex Sans (UI), IBM Plex Mono (mono); DM Sans stays for the cover |
| Tests | `server/themes.test.ts` | Route → room for every section, needle coverage, stylesheet ↔ table agreement, type rack, reveal-copy rules |

## How a page gets its room

Nothing per page. `RoomSync` sits beside `SeoSync` in `App.tsx`; on every route change it
reads `routeToTheme()` and writes the attributes. The stylesheet keys everything on
`html[data-room="…"]`, so all 257 routes are dressed by the same rules:

- **AppShell** (`.rc-portal-theme`) remaps the shell's own variables (`--card-bg`,
  `--muted-text`, `--primary`, sidebar, topbar, bottom tabs) to the room tokens. The
  emerald block that came before is still there and still passes its safeguard test;
  the room rules simply win on specificity.
- **Tabs** (`[role="tab"]`): UI sans, 13/450/0.04em, active 600 with a 2px rule in the
  room's line; 11px uppercase with a needle pip on calculators; 14px sentence case on
  the journey; forest rule in Tax.
- **Titles**: sans + gold 48px hairline in Navy; serif in Quiet Luxury, Tax (with the
  forest 64px rule), Estate (gold hairline); cyan tick and grid in Calculus; needle pip
  and a 30px H1 on the carbon chassis; sans 24 and nothing else on quiet pages.
- **Money** (`.rc-stat-value`, `.rc-money`): tabular lining figures in the room's money
  colour; the climax number on an engine gets the slight gold gradient.
- **Calculate** (`.rc-btn-primary`, `.rc-calculate`, and anything on `bg-primary`):
  15/600/0.04em ivory on Burnt Copper `#C45C26`, 48px tall, radius 10, 1px lift and an
  8px glow at 20% on hover; seal brown `#8B5A2B` in Tax; navy in Ivory.
- **Textures**: paper grain at 4% (Quiet Luxury), 8% (Tax), 3% (Ivory); a coordinate grid
  in Calculus (8%) and on the carbon chassis (4%); a far horizon wash on the journey;
  nothing in Navy, Oxblood or Indigo. City photographs are hidden in the rooms that
  forbid them.
- **Light rooms** (`data-light`): Tax and Ivory. The pages were written in dark-room
  utilities (`text-white`, `bg-slate-900`, `text-emerald-400`), so the stylesheet remaps
  those families to ink, paper, forest and antique gold. Anything hand-coloured inline
  is untouched.
- **Quiet** (`data-quiet`): accent at 60%, no grain, no breathing, no metallic, no line.
- **Cast**: the shell shows the room's badge as an eyebrow above the page — Physician on
  Tax and Estate, Recovery & Relief on the journey, Psychiatrist on the mirrors. The
  homepage keeps the full tiles; nothing else does.

## The reveal layer

`EngineWhyFooter` renders on every Theme 9 page from the shell, and on the three public
engines. `QuestionWhy` sits under the Ultra Calculator and Fact Finder titles;
`OutputWhy` (with the line) sits under the Ultra Calculator's chained projection.
Other engines can drop the two components anywhere; the copy comes from the room's
needle unless the page passes one.

The copy is Grok's, unchanged. The tests refuse "secret", "don't want you to know",
"guaranteed unique" and "nobody else has this".

## The cover

Theme 1 is stamped on `/` and nothing else. The homepage's stacked city plates are the
owner's call and stay as they are; the room system does not touch `Landing.tsx` or the
static mirror. `.rc-metal` is available for the one metallic word when the copy is
re-pasted.

## Not in this pass

- **Ivory on PDFs and emails.** The tokens exist (`THEMES.theme10`) and the shared
  token pages wear them; the twelve document generators still use their own colours.
- **Per-question `QuestionWhy` on the 59 portal engines.** The footer covers every one;
  the whisper under each question is a page-by-page pass.
- **HeyGen tiles.** The shot lists are production briefs for the avatar videos, not code.
  The tile slots can be added to each room's header once the videos exist.

## Rules that stayed

Only mutual carriers, no fabricated figures, patent-pending only, no purple or violet
anywhere (the Indigo room is `#6F74C9`, named indigo), no secrets in the repo.
