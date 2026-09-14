# Shortcodes

Nine tools. Place a shortcode on any page or in any block; no template edits.

Activation creates one **draft** page per tool, each already holding its
shortcode. They are drafts, never published — nothing appears on the live site
until somebody publishes it deliberately.

---

## `[dwt_index_segments]` — new in 1.2.0

Multi-year index segments: a segment credit next to what it actually is per year.

| Attribute | Default | Notes |
|---|---|---|
| `account` | `bia-2yr` | `bia-2yr` (2-year balanced, sourced), `par110-annual`, `par105-annual`, `cap10-annual` |
| `from` | last 6 years | Calendar year. Clamped to the series (1994–2025). |
| `to` | latest | Calendar year. |
| `threshold` | `40` | Counts **segments** whose credit reaches this, not years. |

```
[dwt_index_segments]
[dwt_index_segments account="bia-2yr" from="1994" to="2025" threshold="34"]
```

**Read this before restyling it.** The table prints three columns: the index
over the segment, the credit for the segment (tagged `over 2 yrs`), and the
per-year figure. All three must stay. The two-year account credited 47.97% over
2020–2021 — that is **21.64% a year**. Drop the tag or the per-year column and
the page tells a reader an account returned 48% in a year.

An account with `sourced: false` prints a warning block above the table saying
its terms came from no carrier document. That block is not decoration and must
not be moved into a footnote.

---

## `[dwt_index_history]`

Historical index changes against a cap, floor and participation rate.

| Attribute | Default |
|---|---|
| `index` | `SP500` |
| `cap` | `9.5` |
| `floor` | `0` |
| `participation` | `100` |
| `years` | `30` |

```
[dwt_index_history index="SP500" cap="9.5" participation="100" years="30"]
```

Prints no geometric average, deliberately. Year-by-year is both more compliant
and more useful than an aggregate, and an aggregate above the AG 49 maximum
illustrated rate may not be shown at all.

---

## `[dwt_time_machine]`

The AG 49 flat-rate illustration beside its required historical disclosure.

| Attribute | Default |
|---|---|
| `premium` | `25000` |
| `funding_years` | `5` |
| `age` | `45` |
| `years` | `30` |
| `ag49_rate` | `6.0` |
| `index` | `SP500` |
| `start_year` | `1994` |

```
[dwt_time_machine premium="50000" funding_years="7" age="52"]
```

---

## `[dwt_monte_carlo]`

Ten thousand modelled retirements. Visitor enters starting balance, annual
contribution or withdrawal, years, expected return, volatility.

| Attribute | Default |
|---|---|
| `heading` | `Will the money last?` |

---

## `[dwt_tax]`

Federal and state income tax with the bracket breakdown. Visitor enters gross
income, filing status, state.

| Attribute | Default |
|---|---|
| `heading` | `What will you actually pay?` |
| `state` | `TX` |

---

## `[dwt_estate_tax]`

What the estate owes and what reaches the heirs. Visitor enters total estate,
debts, charitable bequests, filing status.

| Attribute | Default |
|---|---|
| `heading` | `What reaches your heirs?` |

---

## `[dwt_mortgage]`

Mortgage elimination, seven headline values with more detail optional. Visitor
enters balance, rate, months remaining, payment, home value, income, age.

| Attribute | Default |
|---|---|
| `heading` | `What is the mortgage really costing you?` |

---

## `[dwt_concierge]`

Ask by voice or text.

| Attribute | Default |
|---|---|
| `heading` | `Ask us anything` |
| `placeholder` | `Ask about Roth conversions, retirement income, taxes in retirement…` |
| `cta` | `Book a conversation` |

Speech recognition runs in the visitor's own browser via the Web Speech API. No
audio is uploaded anywhere. The transcribed text goes to the platform through
WordPress `admin-ajax`, so the API key stays server-side.

---

## `[dwt_catalog]`

The planning engines the platform offers, pulled live.

| Attribute | Default |
|---|---|
| `heading` | `Planning engines` |
| `columns` | `2` |

---

## When a tool is not configured

Every shortcode checks the API is configured before rendering, and prints a
short sentence instead if it is not. Nothing half-drawn, no zeros, no
placeholder numbers.

If you see *"This tool is not yet connected"* on a page, the API base URL or key
is missing under **Settings → Drass Wealth Tools** — the shortcode is fine.
