# The Twenty-Five Connections Worth Wiring Into Every AI

A field guide for adding the same tools to Grok, ChatGPT and Perplexity that Claude uses on Russell Capital Systems and AQAL. Ranked by importance to the work in front of us: building and shipping the two sites, protecting the patents, sourcing every figure, and reaching physicians.

**How to use this list.** Every entry gives the address to paste into an AI's connector or MCP settings, the sign-in method, five sentences on what it does and why it matters, and five scores from one to ten:

- **Service.** How much real capability it hands the AI.
- **Meaning.** How much it matters to the mission, not just convenience.
- **Use now.** How often it earns its keep on today's work.
- **Quality.** How good it is at its job compared with the alternatives.
- **Rarity.** How hard it is to replace with anything else.

**Where to paste.** ChatGPT: Settings, Connectors, add a custom connector with the address (Developer mode may need to be on). Perplexity: Settings, Connectors, add a custom connector. Grok: wherever the app offers connectors or custom MCP servers, paste the same address. Every address below was checked against the provider's own documentation this week. Two kinds of sign-in appear: **OAuth** means the AI opens a browser window and you approve; **API key** means you paste a key from that provider's dashboard as a bearer token. Keep every key in the provider's panel and the AI's connector settings only, never in a chat.

---

## 1. GitHub

**Address:** `https://api.githubcopilot.com/mcp/`  ·  **Sign-in:** OAuth

GitHub is the vault: every line of both sites, every pull request, every commit, and the history of who changed what and why. Connected, an AI can read the code, open pull requests, review diffs, watch checks, and search across the repository without anyone pasting files. Nothing else holds the actual product, so nothing else can substitute for it; a change that is not in GitHub does not exist. It is used on every single working session, and it is the record counsel will ask for when the patents are filed. The official server is first party, complete, and the standard every other tool measures against.

| Service | Meaning | Use now | Quality | Rarity |
|---|---|---|---|---|
| 10 | 10 | 10 | 10 | 10 |

## 2. Railway

**Address:** `https://mcp.railway.com`  ·  **Sign-in:** OAuth

Railway runs the Russell Capital Systems application, its database, and the variables panel that holds every key and password hash. Through the connection an AI can watch deployments, read logs, set variables, and diagnose a failed build without touching a dashboard. This is where a merged change becomes a live site, so it is the second half of GitHub. It is used every time something ships and every time something breaks. The hosted server is new and first party, and the AI-agent mode inside it can carry out multi-step operations most hosts still make you click through.

| Service | Meaning | Use now | Quality | Rarity |
|---|---|---|---|---|
| 9 | 9 | 9 | 8 | 7 |

## 3. Perplexity

**Address:** `https://api.perplexity.ai/mcp`  ·  **Sign-in:** API key (bearer header)

Perplexity is web-grounded research with citations: ask a question, get an answer with the sources it drew from. On this project it ran the prior-art screens for all sixteen patent families and the checks behind every sourced figure. It is the fastest way to find out whether an idea is already taken, whether a number is real, and what the closest competitor claims. It is used weekly for patents and daily for facts. It is not the only search tool, but it is the best at turning a messy question into a cited answer in one call.

| Service | Meaning | Use now | Quality | Rarity |
|---|---|---|---|---|
| 9 | 9 | 9 | 9 | 7 |

## 4. OpenRouter

**Address:** `https://mcp.openrouter.ai/mcp`  ·  **Sign-in:** OAuth or API key

OpenRouter is one door to hundreds of models from every major lab, on one bill, with one key. AQAL's eight-lab scoring panel and the eleven-provider council on Russell Capital Systems both run through it, which is what lets one question go to many minds and come back as a consensus. Without it, every extra model is another vendor account, another key, and another integration to maintain. It is used on every assessment scored and every council answer. Nothing else gives one address for the whole field with usage tracking built in.

| Service | Meaning | Use now | Quality | Rarity |
|---|---|---|---|---|
| 9 | 9 | 8 | 9 | 9 |

## 5. ElevenLabs

**Address:** `https://api.elevenlabs.io/v1/mcp`  ·  **Sign-in:** OAuth

ElevenLabs is the voice and the pictures: the founder's message on the homepage is read in the owner's cloned voice, and the twenty-one city plates behind the technologies were generated and edited through its creative tools. It also transcribes audio and runs conversational voice agents. The cloned voice cannot be bought anywhere else at this quality, and the image editing removed every word from four concept frames in one pass. It is used every time a new page, city, or spoken message is made. The voice work is the best in the field; the image side is a strong front door to several image models.

| Service | Meaning | Use now | Quality | Rarity |
|---|---|---|---|---|
| 9 | 8 | 8 | 9 | 9 |

## 6. Resend

**Address:** `https://mcp.resend.com/mcp`  ·  **Sign-in:** OAuth or API key

Resend sends the mail: the lead alerts from the homepage estimator, the founding-member welcome on AQAL, the emailed PDFs from the every-page advisor. Connected, an AI can send, read, and trace a message, manage the sending domain, and see delivery and bounces. Email is how a lead becomes a conversation, so a broken sender is a silent revenue leak. It is used every day both sites are live. The service is plain, reliable, and built for developers, which is exactly what a transactional sender should be.

| Service | Meaning | Use now | Quality | Rarity |
|---|---|---|---|---|
| 8 | 8 | 8 | 8 | 5 |

## 7. Stripe

**Address:** `https://mcp.stripe.com`  ·  **Sign-in:** OAuth

Stripe is the till: AQAL's paid tiers and any future Russell Capital Systems billing run through it. Through the connection an AI can read the account, plan an implementation against Stripe's own documentation, create payment links, issue refunds, and manage subscriptions. Money is the part of the platform that must never be guessed at, and this gives the AI the real ledger instead of a description of it. Use is light until the paid cohorts open, then constant. Stripe is the category standard, and its first-party server is one of the most complete anywhere.

| Service | Meaning | Use now | Quality | Rarity |
|---|---|---|---|---|
| 9 | 9 | 5 | 10 | 8 |

## 8. Firecrawl

**Address:** `https://mcp.firecrawl.dev/v2/mcp`  (OAuth sign-in: `https://mcp.firecrawl.dev/v2/mcp-oauth`)  ·  **Sign-in:** OAuth or API key

Firecrawl turns any web page or whole site into clean text an AI can read, and searches the web with results already extracted. On this project it feeds the harvest that reads government pages for the Truth Stack, where a figure is only accepted if its exact sentence is found on the page. It handles pages that block ordinary fetchers and returns structured data against a schema when asked. It is used whenever a source must be read verbatim rather than summarised. Among scrapers it is the most reliable at getting the actual page, not a fragment.

| Service | Meaning | Use now | Quality | Rarity |
|---|---|---|---|---|
| 8 | 8 | 8 | 9 | 6 |

## 9. Exa

**Address:** `https://mcp.exa.ai/mcp`  ·  **Sign-in:** none required (rate limited), OAuth or API key for more

Exa searches by meaning rather than keywords, which finds the paper, filing, or competitor page that a keyword search misses. It is the tool for "find me every company doing something like this" and for pulling code and documentation context. In prior-art work it surfaced references that plain search did not. It is used on research passes and competitive scans. It works with no key at all, which makes it the easiest of the search tools to hand another AI.

| Service | Meaning | Use now | Quality | Rarity |
|---|---|---|---|---|
| 7 | 7 | 7 | 8 | 7 |

## 10. Parallel Search

**Address:** `https://search.parallel.ai/mcp`  ·  **Sign-in:** none required, API key for higher limits

Parallel returns search results with the relevant excerpts already pulled out, so an AI can answer from the results without opening every page, and it can fetch several pages against one objective in a single call. That makes it the cheapest way to check a fact or a competitor across many sources at once. It is a strong second opinion beside Perplexity when a figure must be confirmed twice. It is used on fact checks and research sweeps. Free without a key, which again makes it easy to give to every AI.

| Service | Meaning | Use now | Quality | Rarity |
|---|---|---|---|---|
| 7 | 7 | 7 | 8 | 6 |

## 11. Jina AI

**Address:** `https://mcp.jina.ai/v1`  ·  **Sign-in:** API key

Jina reads any URL into clean markdown, answers a question from just the relevant passages of a page, searches the live web, and searches arXiv and SSRN for papers. It is the tool that read academic prior art and reference pages during the patent consolidation. Asking it for only the passages that answer a question keeps the AI's memory clear on long documents. It is used on research days and whenever a PDF or long page must be read cheaply. Its paper search is the strongest of the search tools for academic work.

| Service | Meaning | Use now | Quality | Rarity |
|---|---|---|---|---|
| 7 | 7 | 6 | 8 | 7 |

## 12. Context7

**Address:** `https://mcp.context7.com/mcp`  ·  **Sign-in:** none required, OAuth optional

Context7 hands an AI the current, version-specific documentation for any library or framework in the code, so it writes against what the library does today rather than what it remembers. Both sites sit on fast-moving stacks, and a wrong remembered API is the most common way an AI breaks a build. It is used on every non-trivial coding session. It is free, needs no account, and nothing else keeps documentation this current for this many libraries.

| Service | Meaning | Use now | Quality | Rarity |
|---|---|---|---|---|
| 7 | 6 | 8 | 9 | 8 |

## 13. Amass (PatentCore and the life-science cores)

**Address:** added from Claude's connector directory; platform at `https://platform.amass.tech`  ·  **Sign-in:** OAuth through the directory

Amass is a linked evidence layer: forty million biomedical papers, over a million clinical trials, drug and gene records, FDA and EMA authorisations, and a patent core of over 170 million patents with claims, families and ownership. For a patent portfolio that touches physicians, health and longevity, it is the one place to search patents and the science behind them in the same query. It also grounds every medical claim on the AQAL research library in real records. It is used on patent searches and whenever a health statement needs a citation. No other connector links patents to trials, drugs and papers in one graph.

| Service | Meaning | Use now | Quality | Rarity |
|---|---|---|---|---|
| 8 | 9 | 6 | 9 | 10 |

## 14. Notion

**Address:** `https://mcp.notion.com/mcp`  ·  **Sign-in:** OAuth

Notion is durable memory outside the chat: pages and databases that survive a session and can be shared with the team, counsel, or a designer. An AI can create and update pages, query databases, and read meeting notes. The patent portfolio, the handoff documents and the launch checklists belong somewhere people revisit, and this is that somewhere. It is used whenever a result should outlive the conversation. It is the strongest first-party knowledge server of its kind.

| Service | Meaning | Use now | Quality | Rarity |
|---|---|---|---|---|
| 8 | 7 | 6 | 9 | 6 |

## 15. Linear

**Address:** `https://mcp.linear.app/mcp`  ·  **Sign-in:** OAuth

Linear is the work queue: issues, projects, milestones, and releases, with an AI able to create, update, comment, and review diffs. The fifteen emergent patents each depend on a specific wiring change; a queue with owners and dates is how those actually happen. It is used to turn a plan into tracked work and to keep three AIs from doing the same task twice. Its server is fast and complete. Asana serves the same purpose for a non-engineering team.

| Service | Meaning | Use now | Quality | Rarity |
|---|---|---|---|---|
| 7 | 7 | 6 | 9 | 5 |

## 16. Cloudflare

**Address:** `https://mcp.cloudflare.com/mcp`  (documentation server: `https://docs.mcp.cloudflare.com/mcp`)  ·  **Sign-in:** OAuth

Cloudflare is the edge: DNS, certificates, caching, and a fleet of small services for storage, databases and workers. The domain question that came up this week, which host russellcapitalsystems.com actually points at, is exactly what this connection answers and changes. It also serves the static homepage copy faster than any origin. Use is occasional but decisive when it comes. Its family of servers is the broadest any infrastructure company has published.

| Service | Meaning | Use now | Quality | Rarity |
|---|---|---|---|---|
| 8 | 7 | 5 | 9 | 7 |

## 17. Supabase

**Address:** `https://mcp.supabase.com/mcp`  ·  **Sign-in:** OAuth or access token

Supabase is a full Postgres backend with auth, storage, edge functions, logs and security advisors, all reachable by an AI. It is the fastest way to stand up a new data product beside the two sites, and its advisors catch open tables before a client's data leaks. It is used when a new engine needs a home or when a database is being inspected. The server is first party and careful about destructive actions. Neon is the lighter alternative for pure Postgres.

| Service | Meaning | Use now | Quality | Rarity |
|---|---|---|---|---|
| 8 | 6 | 4 | 9 | 6 |

## 18. Neon

**Address:** `https://mcp.neon.tech/mcp`  ·  **Sign-in:** OAuth or API key

Neon is serverless Postgres with branching: a database can be copied like a code branch, tested, and merged or thrown away. That is the right way to try a schema change against real data without touching production. An AI can create projects, run SQL, tune slow queries, and manage branches. It is used on database experiments and migrations. Branching is the feature the others do not match.

| Service | Meaning | Use now | Quality | Rarity |
|---|---|---|---|---|
| 7 | 6 | 4 | 9 | 7 |

## 19. Sentry

**Address:** `https://mcp.sentry.dev/mcp`  ·  **Sign-in:** OAuth

Sentry catches errors in production and, through the connection, lets an AI read the stack trace, search events, and hand the issue to an automated fixer. A physician who hits a broken page never reports it; Sentry does. It turns "the site felt off" into a line number. It is used the moment either site has real traffic. Its server is mature and its automated root-cause analysis is a step ahead of the competition.

| Service | Meaning | Use now | Quality | Rarity |
|---|---|---|---|---|
| 7 | 7 | 5 | 9 | 6 |

## 20. Figma

**Address:** `https://mcp.figma.com/mcp`  ·  **Sign-in:** OAuth

Figma is where a design becomes a shared object rather than a description: an AI can read a design into code, push a page into Figma, generate mockups from a design system, and keep components mapped to the code that renders them. The homepage went through several rounds of card and font decisions that would have been faster on a shared canvas. It is used whenever a screen is being redesigned with a human in the loop. Its remote server is the most complete design-to-code bridge available.

| Service | Meaning | Use now | Quality | Rarity |
|---|---|---|---|---|
| 8 | 6 | 5 | 9 | 8 |

## 21. Canva

**Address:** `https://mcp.canva.com/mcp`  ·  **Sign-in:** OAuth

Canva makes finished marketing pieces: social cards, one-pagers, decks, and print, with brand kits and exports in every format. An AI can generate a design from a brief, edit it, comment on it, and export it. The share card, the physician one-pagers, and anything that goes out on paper belong here. It is used on marketing days. It is the fastest route from copy to a polished graphic for someone who is not a designer.

| Service | Meaning | Use now | Quality | Rarity |
|---|---|---|---|---|
| 7 | 6 | 5 | 8 | 5 |

## 22. Zapier

**Address:** `https://mcp.zapier.com/api/v1/connect`  ·  **Sign-in:** OAuth

Zapier connects an AI to thousands of apps that have no connector of their own, through one address, and can run whole workflows on a trigger. When a lead lands, a Zap can write it to a spreadsheet, text a phone, and add it to a calendar in one motion. It is the glue for everything on this list that is not yet wired together. It is used to automate the boring parts of a launch. Make is the alternative when a workflow needs more branching.

| Service | Meaning | Use now | Quality | Rarity |
|---|---|---|---|---|
| 8 | 6 | 5 | 8 | 6 |

## 23. Make

**Address:** `https://<your Make zone>/mcp/api/v1/u/<your MCP token>/sse` (the zone and token come from your Make profile)  ·  **Sign-in:** MCP token from Make

Make runs scenarios: multi-step automations with real branching, and it is already doing a real job here, holding the two DNS scenarios that read and apply the records for russellcapitalsystems.com. An AI can list, run, and inspect scenarios and read their execution logs. It is the operations layer for anything that must happen on a schedule or in response to an event. It is used whenever DNS or a scheduled job is touched. The address is unique to your account, so it is the one on this list nobody can copy from someone else.

| Service | Meaning | Use now | Quality | Rarity |
|---|---|---|---|---|
| 7 | 7 | 5 | 8 | 6 |

## 24. Calendly

**Address:** `https://mcp.calendly.com/`  ·  **Sign-in:** OAuth

Calendly is the booking link on every page of the site, the "Book a Review" that turns a reader into a meeting. Connected, an AI can read availability, list upcoming meetings and invitees, create single-use links, and reschedule. It is the last step of the funnel and the first minute of the client relationship. It is used the moment a lead is ready to talk. It is the standard for scheduling and its server is first party.

| Service | Meaning | Use now | Quality | Rarity |
|---|---|---|---|---|
| 6 | 7 | 5 | 8 | 4 |

## 25. Apollo.io

**Address:** `https://mcp.apollo.io/mcp`  ·  **Sign-in:** OAuth

Apollo is the prospect list: physicians, practice owners and specialists by title, specialty, city and practice size, with verified contact details, sequences, and a CRM. An AI can search people and companies, enrich a record, build a sequence, and log calls. It is how the specialist landing pages get an audience instead of waiting for one. It is used the day outreach begins and every week after. Clay does deeper enrichment; Apollo is the larger reachable database.

| Service | Meaning | Use now | Quality | Rarity |
|---|---|---|---|---|
| 7 | 8 | 4 | 8 | 6 |

---

## Five more worth having

| Tool | Address | Sign-in | Why |
|---|---|---|---|
| Semrush | `https://mcp.semrush.com/v2/mcp` | OAuth | Keyword, backlink and competitor data for the physician pages. |
| Ahrefs | `https://api.ahrefs.com/mcp/mcp` | OAuth or key | Site audit and backlinks; the AI-visibility reports show which answers cite the site. |
| Vercel | `https://mcp.vercel.com` | OAuth | A second host with analytics, if the static homepage ever moves off GitHub Pages. |
| Asana | `https://mcp.asana.com/v2/mcp` | OAuth | Task tracking for a non-engineering team. |
| Gamma | `https://mcp.gamma.app/mcp` | OAuth | Decks and one-page documents from an outline, for counsel and investors. |

## Not on the list on purpose

Gmail, Google Calendar and Google Drive are built into Claude, ChatGPT and Perplexity as native connectors and have no public address to paste; turn them on inside each app. Perplexity's own research runs through Perplexity, so it is listed as a connector for the other AIs rather than for itself.
