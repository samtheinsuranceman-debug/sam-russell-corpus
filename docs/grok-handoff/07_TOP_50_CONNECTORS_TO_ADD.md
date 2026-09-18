# The fifty connectors to add next, ranked (owner checklist)

Verified on 2026-09-06 against the Claude connector directory and each
vendor's own documentation. Score is value to Russell Capital Systems on a
1–10 scale. Two ways to add:

- **Directory:** open the link (claude.ai → Settings → Connectors → search
  the name works the same), click Connect, authorise. No URL needed.
- **Custom URL:** claude.ai → Settings → Connectors → Add → Custom → Web →
  paste the URL. Only listed where the vendor publishes one.

Where a vendor publishes no remote URL the directory is the only route.
Nothing below is guessed; "directory only" means exactly that.

| # | Score | Connector | Why it matters here | Add via |
|---|---|---|---|---|
| 1 | 10 | **Zapier** | Bridges the site to every app below without code: lead → CRM, meeting → notes, report → drive | Directory: https://claude.ai/directory/connectors/1f6f271e-3d29-4241-b35e-8abe6def4891 · URL `https://mcp.zapier.com/api/v1/connect` |
| 2 | 10 | **Plaid** | Account aggregation: the self-filling Financial Assessment (balances, mortgages, recurring premiums) | Directory: https://claude.ai/directory/connectors/bacac1ad-ccb1-401e-a5d7-915da9742dce · URL `https://api.dashboard.plaid.com/mcp/` (developer dashboard; runtime aggregation uses the Plaid API with your own keys) |
| 3 | 10 | **Stripe** | Client billing, subscriptions, invoices; the platform already has Stripe env vars | Directory: https://claude.ai/directory/connectors/de127013-63f1-43d0-8dd2-b6cb5b4e5d1b · URL `https://mcp.stripe.com` |
| 4 | 9 | **HubSpot** | The clients table already carries a HubSpot contact id; two-way CRM sync | Directory: https://claude.ai/directory/connectors/875dee50-9b3f-452b-af8c-fbc839966273 · URL `https://mcp.hubspot.com` |
| 5 | 9 | **Docusign** | Engagement letters, advisory agreements, consent forms signed from the portal | Directory: https://claude.ai/directory/connectors/a876b642-2b05-4808-a565-deeb271802fd · URL `https://mcp-d.docusign.com/mcp` (beta; needs an integration key) |
| 6 | 9 | **Aiwyn Tax (Column Tax)** | A real federal + state tax engine: replaces hand-typed brackets in 15 files | Directory: https://claude.ai/directory/connectors/550d0dd8-46bf-4d76-a938-866afa15841d |
| 7 | 9 | **Morningstar** | Fund research, screeners, holdings for every allocation and drift page | Directory: https://claude.ai/directory/connectors/2e98be30-8dba-486e-94a9-9a01d34678e2 (already installed, needs reconnect) |
| 8 | 9 | **PostHog** | Product analytics for 216 pages: which tools clients use, where they drop | Directory: https://claude.ai/directory/connectors/50688846-553c-4a12-bc21-df94d2173734 · URL `https://mcp.posthog.com/mcp` |
| 9 | 9 | **Sentry** | Error tracking for the client bundle and server; item 54 of the hundred | Directory: https://claude.ai/directory/connectors/46d6322a-5f75-4822-b739-f49261805e9c · URL `https://mcp.sentry.dev/mcp` |
| 10 | 8 | **Intuit QuickBooks** | Practice-owner clients' books and Sam's own; cash-flow and P&L into the assessment | Directory: https://claude.ai/directory/connectors/a933e343-3389-4a82-beeb-7d5f5c2c4f25 |
| 11 | 8 | **Alpha Vantage** | Stocks, options, fundamentals, indices, commodities, FX for the market pages | Directory: https://claude.ai/directory/connectors/0f1d77a7-9e03-438a-824d-d66c6dd0f0d5 · URL `https://mcp.alphavantage.co/mcp` |
| 12 | 8 | **Bigdata.com** | Cited financial research: SEC filings, earnings, news, plus your own documents | Directory: https://claude.ai/directory/connectors/e463df16-b3d7-4bb9-953d-b652a073c764 |
| 13 | 8 | **Customer.io** | Behaviour-triggered journeys (assessment abandoned → nudge) across email and SMS | Directory: https://claude.ai/directory/connectors/e46d22da-f472-465a-ae46-52f6ac61a97f · URL `https://mcp.customer.io/mcp` |
| 14 | 8 | **Sumsub** | KYC and identity verification before a client portal is issued | Directory: https://claude.ai/directory/connectors/72396321-bc37-4407-88e5-c07339b80704 |
| 15 | 8 | **n8n** | Self-hosted automation you own; runs the follow-up sequence on any host | Directory: https://claude.ai/directory/connectors/d86fa999-100c-4212-ad7f-2fefea661ef1 (URL is your own n8n instance) |
| 16 | 8 | **Slack** | Lead alerts, compliance flags and daily digests into a channel | Directory: https://claude.ai/directory/connectors/597f662f-36de-437e-836e-5a81013cbfbe · URL `https://mcp.slack.com/mcp` |
| 17 | 7 | **Twilio** | Runtime SMS uses the Twilio API with your keys; this connector is API documentation search | Directory: https://claude.ai/directory/connectors/0f28b719-ce6a-4597-83a6-ff5b2d5b17c5 · URL `https://mcp.twilio.com/docs` |
| 18 | 7 | **Interactive Brokers** | Live positions and balances for clients who custody there | Directory: https://claude.ai/directory/connectors/d445461d-2337-4e00-b285-b43d111d2912 |
| 19 | 7 | **Close** | Lightweight sales CRM with calling, if HubSpot is too heavy | Directory: https://claude.ai/directory/connectors/3e12bb5c-11e5-409c-8e73-64d4b625b498 |
| 20 | 7 | **Microsoft 365** | Outlook, Teams, SharePoint for advisors on Microsoft | Directory: https://claude.ai/directory/connectors/ce0c9cda-5ea5-44c5-9cf2-40810dfa6582 |
| 21 | 7 | **Dropbox** | Client statements and returns straight into the Document Vault | Directory: https://claude.ai/directory/connectors/1e4280cc-037c-47f0-9873-56bea1871bdb |
| 22 | 7 | **Klaviyo** | Segmented marketing with consent tracking | Directory: https://claude.ai/directory/connectors/b1a89151-dc5f-4d75-baa7-9da291b81a0c · URL `https://mcp.klaviyo.com/mcp` |
| 23 | 7 | **Intercom** | Client support inbox and help centre for the portal | Directory: https://claude.ai/directory/connectors/b2def8dc-ae47-4d46-877a-19b6a6ebb771 · URL `https://mcp.intercom.com/mcp` |
| 24 | 7 | **Airtable** | Lightweight operational tables (carrier rates, playbooks) editable by non-developers | Directory: https://claude.ai/directory/connectors/cb504fab-e494-490f-bff8-bb3ab23a2209 · URL `https://mcp.airtable.com/mcp` |
| 25 | 7 | **Make** | Visual automation, alternative to Zapier | Directory: https://claude.ai/directory/connectors/038318ff-ed0d-45f8-a453-b01de0071561 · URL `https://<your-zone>.make.com/mcp/api/v1/sse` (token) |
| 26 | 7 | **PandaDoc** | Proposals and quotes with e-sign, generated from a scenario | Directory: https://claude.ai/directory/connectors/56998cd4-9a3a-4f40-8aa9-5019da8bf96e |
| 27 | 7 | **Tiller** | Transactions from a client's spreadsheet into the assessment | Directory: https://claude.ai/directory/connectors/ddd60d1b-2e30-4751-808c-b0ac43bf4ce3 |
| 28 | 6 | **Salesforce** | Enterprise CRM if an agency adopts the platform | Directory: https://claude.ai/directory/connectors/a352dbf6-c732-43d4-84c1-0bbb389d3921 · URL `https://api.salesforce.com/platform/mcp/v1/<server>` (needs an External Client App) |
| 29 | 6 | **Attio** | Modern CRM with call recordings and notes | Directory: https://claude.ai/directory/connectors/ae5afdb9-e3c6-4b64-a13a-420e7a8d8124 |
| 30 | 6 | **Clear Street** | Stock and options analytics for the market pages | Directory: https://claude.ai/directory/connectors/8ab3421a-b3c7-4198-967f-94db261d2f51 |
| 31 | 6 | **viaNexus** | Real-time and historical prices from licensed providers | Directory: https://claude.ai/directory/connectors/01c43f47-7757-4ae7-91f2-310eff8bb58d |
| 32 | 6 | **MT Newswires** | Real-time financial news by security for client briefings | Directory: https://claude.ai/directory/connectors/441c79ad-8a68-4d73-9263-7cfcadd5d8cf |
| 33 | 6 | **Box** | Enterprise document store with Box AI over statements | Directory: https://claude.ai/directory/connectors/a5380429-c773-4180-b642-301418240c8c · URL `https://mcp.box.com` (admin must enable) |
| 34 | 6 | **Mixpanel** | Funnel analytics, alternative to PostHog | Directory: https://claude.ai/directory/connectors/29d60a67-6f16-489b-8a1e-efdcece8d1f6 · URL `https://mcp.mixpanel.com/mcp` |
| 35 | 6 | **Meridian for QuickBooks** | Write access to QuickBooks Online (bills, deposits, customers) | Directory: https://claude.ai/directory/connectors/72e8740e-8922-4d91-a850-d4d47d3f8ab4 |
| 36 | 6 | **Tally** | Beautiful intake forms that feed the assessment | Directory: https://claude.ai/directory/connectors/b1c26807-986e-4cf5-99ca-362e5abb7feb |
| 37 | 6 | **Jotform** | Forms with submissions, including Jotform Sign for e-signature | Directory: https://claude.ai/directory/connectors/aed7e2be-868e-4046-9e12-5c917b4e6b97 |
| 38 | 6 | **Yardi Matrix** | Real-estate market intelligence for the property and STR pages | Directory: https://claude.ai/directory/connectors/2b245db2-8a73-491a-9849-8f44b9ce9488 |
| 39 | 6 | **ZoomInfo** | Physician prospect enrichment and intent signals | Directory: https://claude.ai/directory/connectors/f2cdf1b8-2f75-48a4-8d8c-8d9cce1b8643 |
| 40 | 6 | **Midpage Legal Research** | Case law for asset-protection and trust questions | Directory: https://claude.ai/directory/connectors/1a6a40cd-43c9-4752-9052-fed9c5e8c45c |
| 41 | 6 | **TaxAct** | Refund estimates, document checklists, deadlines for client education | Directory: https://claude.ai/directory/connectors/f7a0d75b-946d-4e65-bb32-7a7fc98d5497 |
| 42 | 6 | **Metricool** | Schedule and measure social posts for the Wealth Reels | Directory: https://claude.ai/directory/connectors/70ba6d62-7e98-4ef4-9073-d161d900a95f |
| 43 | 6 | **Mailchimp** | Newsletter campaigns if Resend broadcasts are not enough | Directory: https://claude.ai/directory/connectors/3a7fa2ac-d655-4479-bce3-8e10fcc26f96 |
| 44 | 5 | **PayPal** | Alternative client payments and invoices | Directory: https://claude.ai/directory/connectors/001103b7-bcde-4b9c-b5d4-f209c2fed1f3 · URL `https://mcp.paypal.com/http` |
| 45 | 5 | **Square** | In-person payments at seminars | Directory: https://claude.ai/directory/connectors/25d61b20-3ba1-4477-b51a-a743d1ca65fb · URL `https://mcp.squareup.com/sse` |
| 46 | 5 | **Xero** | Accounting alternative to QuickBooks (local MCP only, no remote URL) | Directory: https://claude.ai/directory/connectors/4c1fcb68-c482-46c5-a677-659eaf2f2c85 |
| 47 | 5 | **Datadog** | Full observability once traffic justifies it | Directory: https://claude.ai/directory/connectors/68268024-1a91-4316-a9e1-14ecb814cb18 · URL `https://mcp.datadoghq.com/api/unstable/mcp-server/mcp` (US1 site) |
| 48 | 5 | **SurveyMonkey** | Client satisfaction and post-meeting surveys | Directory: https://claude.ai/directory/connectors/58ff478e-b9b7-47c9-8253-78fb9364513a |
| 49 | 5 | **Sprinto** | SOC 2 style controls and evidence when an agency asks for them | Directory: https://claude.ai/directory/connectors/d1e853bb-e524-4771-bb2c-21cef5c67805 |
| 50 | 5 | **Riverside** | Record, edit and publish the podcast and video content | Directory: https://claude.ai/directory/connectors/3366d1e9-5d1d-49b1-a758-677949a84fd9 |

## Already installed but not active in this session (reconnect these first)

HubSpot, Xero, PayPal, Intercom, Morningstar show as installed with unknown
status; Tavily and Gal AI need reconnecting. Open Settings → Connectors and
click Reconnect on each.

## What the top ten unlock together

Zapier + Plaid + Stripe + HubSpot + Docusign + Aiwyn Tax + Morningstar +
PostHog + Sentry + QuickBooks cover the five pillars the hundred-item review
called for: gathering (Plaid, QuickBooks, Tiller), accuracy (Aiwyn Tax,
Morningstar, Alpha Vantage), reaching people (Customer.io, Slack, Intercom),
closing (Docusign, Stripe, HubSpot), and knowing what works (PostHog, Sentry).
