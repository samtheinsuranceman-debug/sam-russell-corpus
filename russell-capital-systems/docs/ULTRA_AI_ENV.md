# Ultra Calculator — AI Environment Variables

The Ultra Calculator's AI team and voice output read API keys **only from
the server's environment**. Keys are never accepted from the browser, never
echoed in responses, never logged, and must NEVER be committed to this
repository or pasted into any chat.

Set these in the hosting provider's environment-variables panel
(Railway → service → Variables, cPanel → Setup Node.js App → Environment
Variables, etc.), then restart the app.

| Variable | Powers | Required? |
|---|---|---|
| `ANTHROPIC_API_KEY` | Claude — the lead model that tethers the site: module triage, the every-page advisor, panel synthesis | Recommended (the system falls back to the built-in LLM, then to deterministic rules) |
| `OPENAI_API_KEY` | ChatGPT seat on the multi-AI panel | Optional |
| `XAI_API_KEY` | Grok seat on the panel | Optional |
| `GEMINI_API_KEY` | Gemini seat on the panel | Optional |
| `PERPLEXITY_API_KEY` | Perplexity seat on the panel | Optional |
| `OPENROUTER_API_KEY` | OpenRouter seat (routes to many additional models) | Optional |
| `ELEVENLABS_API_KEY` | Spoken answers in the configured voice | Optional |
| `ELEVENLABS_VOICE_ID` | Which ElevenLabs voice speaks (the owner's cloned voice ID) | Required if voice output is wanted |

Notes:

- **Graceful degradation is designed in.** With zero keys set, the Ultra
  Calculator still runs fully (the math is client-side and deterministic);
  module triage falls back to rule-based logic, and the advisor button
  reports itself as not configured instead of failing.
- Providers without keys are shown as "not configured" in the UI and are
  never faked in panel results.
- "Manus" has no public inference API; additional models can be reached
  through `OPENROUTER_API_KEY`.
- Voice INPUT uses the browser's built-in speech recognition — no key, and
  the audio never leaves the visitor's machine; only the transcribed text
  is sent to the server.
- If any key is ever pasted into a chat, an email, or a commit, treat it as
  burned: rotate it at the provider immediately.
