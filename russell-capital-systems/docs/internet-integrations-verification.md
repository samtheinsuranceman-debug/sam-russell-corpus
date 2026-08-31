# Core Internet Integrations Verification

The unified portal now routes the three highest-value advisor AI workflows—strategy generation, closing scripts, and advisor chat—through `server/portalAI.ts`. This server-only adapter calls the managed model gateway, enforces a 45-second default timeout with a 30-second closing-script limit, rejects empty model output, logs sanitized failure categories, and returns a retryable message that confirms saved data was not changed. A live readiness call succeeded through `gemini-3.5-flash-lite`; no credential or generated content was recorded.

The shared market quote API no longer creates randomized fallback prices. Bitcoin is requested from CoinGecko with a five-second timeout and payload validation. A live verification returned HTTP 200 with both USD price and 24-hour-change fields. Gold and silver use the existing data-feed service and retain `live`, `cached`, or `static` provenance. SPY and QQQ now report `unavailable` until a verified live equity source is configured rather than displaying invented values.

The shared Market Data widget now has loading, retryable failure, unavailable, source, timestamp, and reference-snapshot states. The Market Data Dashboard distinguishes live, cached, reference, loading, and unavailable sources; explains that curated equity scenarios are not live quotes; and exports the actual received CPI, Treasury, commodity, and MYGA feed snapshot immediately as CSV instead of simulating a delayed success.

Validation completed:

| Check | Result |
|---|---|
| Portal AI live readiness | Passed |
| CoinGecko live endpoint | HTTP 200; required fields present |
| AI adapter unit tests | 4 passed |
| Internet integration safeguards | 4 passed |
| Client/dashboard regression safeguards | 5 passed |
| TypeScript after AI and market changes | Passed |

The broader page audit will still identify presentation-only buttons and simulated behavior elsewhere in the 231-route application. Those pages will receive explicit usefulness and disposition recommendations rather than being silently deleted.
