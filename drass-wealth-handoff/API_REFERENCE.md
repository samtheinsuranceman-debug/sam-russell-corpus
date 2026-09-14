# The RCS partner API

Twelve endpoints. Everything the plugin draws comes from one of these.

A captured response from each one is in `api-samples/`, so you can build and
style the front end before a key exists. `api-samples/INDEX.json` maps every
sample to the exact request that produced it.

## Basics

- **Base URL:** `https://www.russellcapitalsystems.com/api/partner`
- **Auth:** `Authorization: Bearer <PARTNER_API_KEY>` on every request. No key, no data — see *Refusals*.
- **Method:** GET for all twelve.
- **Response:** JSON.
- **Caching:** the WordPress client caches each distinct URL for 5 minutes (`DWT_API::CACHE_TTL`). Raise it if you put a tool on a high-traffic page.
- **Timeout:** 12 seconds (`DWT_API::TIMEOUT`).

## The endpoints

### `GET /health`
Liveness and configuration. Returns `ok`, `configured`, `indices`,
`originsConfigured`. Reveals no figures — safe to poll from monitoring.

### `GET /catalog`
The engine catalogue: what the platform offers, with patent counts and status.
`?include=roadmap` adds engines under development, under a separate `roadmap`
key so they can never be presented as working.

### `GET /index-history?index=SP500&years=30`
Raw annual index changes. Returns `index`, `index_age_years`, `years[]` of
`{year, change}`, and `basis`.

Refuses (422) for an index with under 10 years of history, and never returns
fewer than 10 years even if asked for fewer — a short series is too easy to
table misleadingly.

### `GET /index-segments?account=bia-2yr&from=2019&to=2025&threshold=40`
**The newest endpoint, and the one with a trap in it.** Multi-year index
segments over a window that steps one year at a time.

| Parameter | Default | Notes |
|---|---|---|
| `account` | `bia-2yr` | `bia-2yr`, `par110-annual`, `par105-annual`, `cap10-annual`. 404 lists them. |
| `from` / `to` | last 6 years | Clamped to the series range (currently 1994–2025). |
| `threshold` | `40` | Counted against the **segment** credit. |

Each entry in `segments[]` carries `credited_pct`, `annualized_pct` and
`term_years` **together**, and that is not decoration:

```json
{ "start_year": 2020, "end_year": 2021, "term_years": 2,
  "index_cumulative_pct": 48.06, "credited_pct": 47.97, "annualized_pct": 21.64 }
```

`credited_pct` is the credit for the **whole two-year term**. Rendering 47.97%
against a row labelled with a single year tells the reader the account returned
48% in a year. It returned **21.64% a year**. Show `annualized_pct` beside it,
always, and label the term.

`reading_note` and `basis` both state this in prose, ready to print.

`sourced: false` on an account means its terms came from no carrier document.
Say so on screen — `par110-annual` is one of these.

### `GET /crediting?optionId=…&startYear=…&endYear=…`
Year-by-year crediting for one index option, with rolling-window comparisons,
floor-held and cap-limited counts, and the source.

For a multi-year option (`bm-sp500-2yr-balanced`) every rate is the
**annualized** credit of the segment ending that year, never the segment credit.

### `GET /time-machine?premium=&fundingYears=&age=&years=&ag49Rate=&index=&startYear=`
Both panels together: the AG 49 flat-rate illustration and the historical
disclosure. Returns `boring`, `historical`, `creditHistory`, `strategies`,
`floorProtectedYears`, `capLimitedYears`, `notice`.

The geometric average is deliberately withheld. Do not compute one from
`creditHistory` and print it — above the maximum illustrated rate it may not be
shown at all.

### `GET /accumulation?premium=&fundingYears=&age=&years=`
Accumulation across index strategies with an allocation breakdown.

### `GET /monte-carlo?balance=&withdrawal=&years=&equityPct=`
Ten thousand paths. Returns `summary`, `bands`, `basis`.

### `GET /tax?income=&state=&filing=`
Federal and state income tax: effective and marginal rates, the marginal
bracket, and the full breakdown.

### `GET /estate-tax?estate=&state=&married=`
Federal estate tax, exemption, net to heirs, shrinkage percentage.

### `GET /mortgage?balance=&rate=&termMonths=&payment=&homeValue=&income=&age=`
Mortgage elimination. **`balance` and `homeValue` are both required**; the rest
have defaults. Omitting either returns 400 with a `required` list — see
`api-samples/` for the shape.

## Refusals

The boundary refuses rather than degrades. Both captured in `api-samples/`:

| File | Case | Status |
|---|---|---|
| `_refusal-no-key.json` | No `Authorization` header | 401 |
| `_refusal-unknown-account.json` | Unknown segment account | 404, with `available[]` |

Others you will meet: **422** for an index with too little history, **400** for
missing required inputs, **403** for a rejected key.

The WordPress client turns every one of these into a short sentence on the page
and draws nothing else. It never fills in a default. Preserve that.

## A note on what this API will not give you

There is no endpoint that returns a client's policy values, and no endpoint that
accepts client-identifying data. Everything here is carrier structure,
arithmetic and public index history. If a future page needs real client figures,
that is a different system with different controls, not an extra parameter on
one of these.
