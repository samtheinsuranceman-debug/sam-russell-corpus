# Drass Wealth Management — complete handoff

Everything built for the Drass site, in one folder. Read this page first.

## Start here: why the plugin is small, and what that means for you

The installable plugin is about **39 KB**. That is not a truncated download and
nothing is missing from it. It is small on purpose, and the reason decides how
you should build against it.

**The calculators are not in the plugin.** The plugin is a renderer. Every
engine — the index-segment arithmetic, the Monte Carlo, the tax and estate-tax
brackets, the mortgage analysis, the Time Machine — runs on the Russell Capital
Systems platform and is reached over HTTPS. WordPress receives JSON and draws it.

That split is deliberate. These engines are corrected continuously as carrier
documents and rate sheets come in. A PHP copy living inside a WordPress plugin
would be a second set of numbers to correct, and within a quarter it would be
telling clients something the platform no longer believes. One engine, corrected
once.

So the practical consequences for whoever installs this:

- **The plugin needs network access to the RCS API.** With no API base URL set,
  or no key, every tool renders a plain "not connected" message instead of
  numbers. That is by design — see *The refusals* below.
- **Almost all the work of this project is not in this folder.** It is server
  code on the RCS platform. This folder is the part Drass hosts.
- **Nothing here has any client data in it**, and there is nothing to seed.

If what you actually wanted was a self-contained plugin that computes
everything locally with no API call, that is a different build and a much larger
one. It is possible. It is not what this is, and I would argue against it for
the reason above — but it is your call, not mine.

## What's in this folder

| Path | What it is |
|---|---|
| `drass-wealth-tools-1.3.0.zip` | **The installable.** This is the file you upload to WordPress. |
| `plugin-source/drass-wealth-tools/` | The same plugin unzipped, for reading and diffing. |
| `INSTALL.md` | Step-by-step installation and configuration. |
| `SHORTCODES.md` | Every shortcode, its attributes, and where to place it. |
| `API_REFERENCE.md` | The twelve API endpoints the plugin calls. |
| `api-samples/` | **A real captured response from every endpoint**, so the front end can be built and styled before a key exists. |

## Before this goes in front of a client: the index series is not verified

The figures these tools produce are computed from an S&P 500 series that
carries no source and **does not reconcile to the carrier's own published
claims about that index**:

| The carrier published | This series measures |
|---|---|
| 8.06% average annual return, 1994–2023 | 8.29% |
| 18 of 30 years above a 10% cap | 16 years |
| exceeding the cap by 12.23% on average | 13.66% |

A 30-year average that is close while the year count is wrong by two is the
signature of individual years being wrong in offsetting directions. Every
segment figure is built from the **years**, not the average.

The method is right. The inputs are not established. Both platforms now say so
on screen — a red banner above the table, driven by
`series_verified: false` in the API — and the figures should not go into a
proposal until the series is replaced with a sourced one.

## The tools

Nine shortcodes. Activation creates one **draft** page per tool — draft, never
published, because this plugin is installed on a site it does not own and
publishing pages on somebody's live site without being asked is not acceptable
behaviour for an installer.

| Shortcode | What it shows |
|---|---|
| `[dwt_index_segments]` | **New in 1.2.0, corrected in 1.3.0.** Multi-year index segments — a segment credit beside what it is per year. |
| `[dwt_index_history]` | Historical index changes against a cap, floor and participation rate. |
| `[dwt_time_machine]` | The AG 49 illustration beside its required historical disclosure. |
| `[dwt_monte_carlo]` | Ten thousand modelled retirements — will the money last. |
| `[dwt_tax]` | Federal and state income tax with the bracket breakdown. |
| `[dwt_estate_tax]` | What the estate owes and what reaches the heirs. |
| `[dwt_mortgage]` | Mortgage elimination, seven headline values. |
| `[dwt_concierge]` | Ask by voice or text. Speech recognition stays in the visitor's browser. |
| `[dwt_catalog]` | The engine catalogue, pulled live from the platform. |

## Two things the installer must know

**1. The refusals are a feature.** When the API is unreachable, unconfigured, or
rejects the key, every calculator prints a short explanation and stops. It never
falls back to a plausible-looking default. A calculator that quietly substitutes
a made-up number for a real one is worse than one that says it is unavailable,
because nobody re-checks a figure that looks right. Do not "improve" this by
adding fallback values.

**2. The carrier's published basis is per-year and net of the spread.** The
flier's own chart assumptions read: *"the vertical axis represents the
annualized return for the relevant hold period, after the deduction of the
strategy spread."* So the per-year column is the carrier's basis and the only
one that may be set beside a carrier document.

Two consequences. A figure read off a carrier chart **already has
participation and the spread in it** — feeding one back through the crediting
method deducts the spread twice and understates the account by about 1.5
points. And "annualized" means the geometric root, not half: a 48% two-year
credit is 21.64% a year, not 24.00%.

**3. A multi-year segment credit is not an annual return.** The `[dwt_index_segments]`
view exists because of this, and it constrains how its output may be restyled.
The two-year balanced account credited 47.97% over 2020–2021. That is **21.64% a
year**. If a redesign drops the "over 2 yrs" tag, or shows the credited column
without the per-year column beside it, the page will tell a reader that an
account returned 48% in a year. It did not. Keep both columns.

The same rule governs the summary line: it counts **segments** over a threshold,
never years.

## Compliance

The historical views are built to the NAIC AG 49-A amendment adopted
21 November 2025. `includes/class-dwt-compliance.php` holds the gate, and it
refuses rather than warns. It blocks a historical view from rendering beside an
illustration of a real policy, blocks an index with too little history, and
blocks a geometric average above the maximum illustrated rate.

Those are enforced in code before a row is drawn. They are not comments, and
they should not be relaxed to make a layout work.

## Credentials

Two settings, both under **Settings → Drass Wealth Tools**:

- **API base URL** — `https://www.russellcapitalsystems.com/api/partner`
- **API key** — supplied separately by Sam Russell.

The key is stored in WordPress options and used **server-side only**. It is
never printed into a script tag and never reaches the visitor's browser. Keep it
that way; if a future change needs the browser to call the API directly, proxy
it through WordPress instead of shipping the key to the client.

The key is not in this folder, and it is not in the repository. As of this
writing it has not yet been set on the platform, so the tools will show the
"not connected" message until Sam sets `PARTNER_API_KEY` in Railway and gives
you the same value.

## Version

**1.3.0.** Changelog in `plugin-source/drass-wealth-tools/readme.txt`.

Requires WordPress 6.0+, PHP 7.4+. Creates no database tables, modifies no
existing content, registers no public write endpoints. Deactivating removes
every tool cleanly.
