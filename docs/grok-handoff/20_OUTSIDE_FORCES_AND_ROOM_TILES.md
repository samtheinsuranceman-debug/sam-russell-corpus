# 20 — Outside Forces, and the HeyGen room tiles

## Outside Forces (`/portal/outside-forces`, the Calculus wing)

The six things a plan cannot vote on, read live: prices, the money itself, the house,
credit, the federal balance sheet, cars, and travel. Seven forces on one page.

| Piece | File |
|---|---|
| Registry, readers, weighted panels | `server/outsideForces.ts` |
| Router (`outsideForces.registry / all / one / status`) | `server/outsideForcesRouter.ts` |
| Page | `client/src/pages/portal/OutsideForces.tsx` |
| Tests | `server/outsideForces.test.ts` |

**How a number gets on the page.** Every series is a public statistical series read through
the same FRED helper the inflation ladder uses (keyless CSV, or the keyed API when
`FRED_API_KEY` is set). The reading carries the as-of date, the latest value, the change
over 1, 5, 10, 20 and 40 years (annualised for indexes and dollar levels, in points for
rates and shares), and one observation a year for the 40-year line. The last good reading
is kept in `market_data_points` under `of:<series>:…` so a restart shows the last value
with its date. A series that has never answered says "unavailable" and shows nothing.

**The series.** All-items and core CPI and the 10-year breakeven (prices). M2, the Fed's
balance sheet, total public debt, Case-Shiller and CPI side by side (the money). The
homeownership rate, median sales price, real median household income, the 30-year
mortgage rate, Case-Shiller (the house). Fed funds, the SLOOS net-tightening share, H.8
loans and leases, the Chicago Fed NFCI, the high-yield spread (credit). Debt to GDP,
foreign-held debt, total debt, the 10-2 curve, the high-yield spread (the balance sheet).
Total and light-vehicle sales, new- and used-vehicle CPI (cars). Vehicle miles travelled,
airline-fare CPI, and one candidate feed, air revenue passenger miles, which is shown only
once it has answered (travel).

**The panels.** Each force carries twelve institutions that publish on it, weighted
evidence × (½ + ½·track record) × (½ + ½·consistency), the same arithmetic as the tax
forecasters. Track record starts at ½ for every voice. The panel says whose record to lean
on; it does not manufacture a forecast, and each force's caveat says what the record does
not support.

**Not a feed.** The under-35 homeownership rate (Census HVS Table 19) and international
trip counts (NTTO I-94 arrivals, I-92 departures) are published as tables. They come in
through the harvest path with the verbatim-quote guard and owner approval, like the
governors and legislatures on the power card.

## The HeyGen room tiles

The twelve rooms from HEYGEN_SHOT_LISTS_12_ROOMS.md are wired; the videos are not made.

| Piece | File |
|---|---|
| The rooms, placements, integral cues, file names | `shared/roomVideos.ts` |
| `GET /api/site/room-videos` | `server/_core/roomVideos.ts` |
| The tile | `client/src/components/rooms/RoomVideoTile.tsx` (rendered by the shell) |
| Tests | `server/roomVideos.test.ts` |

Set `ROOM_VIDEO_URLS` on the host as a JSON map of room key → https URL, and optionally
`ROOM_VIDEO_POSTERS` for stills. A tile appears on that room's pages the next time they
load: tax on every tax route, engines on every calculator, prediction on the Calculus wing,
journey and relief on the welcome list, estate on trusts and drafting, observatory on the
mirrors, cockpit on the dashboard and command center only, public on pricing. Never on
login, billing, compliance, vault, health or the 404. The voice never autoplays: the visitor
taps "Listen". The cover tile on the homepage waits for the copy re-paste.

Production order from the brief: engines first (it ships on the most pages), then cover
and relief, then tax, then journey. File name `rcs-heygen-{room}-{duration}-v1.mp4`.
