/**
 * MCP presets — the forty connections worth wiring into the AI advisor (named in shared/aiAdvisor.ts).
 * ════════════════════════════════════════════════════════════════════════════
 *
 * A Model Context Protocol server exposes tools the advisor can call
 * mid-conversation. Each preset below is a known remote MCP endpoint: its
 * streamable-HTTP URL, how it authenticates, and what it is for on this
 * platform. Presets are starting points — the owner can change the URL, and
 * any MCP server not listed here can be added by hand.
 *
 * The list draws on docs/MCP_CONNECTIONS_TOP_25.md in the live build and the
 * connectors already attached to the owner's Claude workspace. URLs are the
 * public endpoints published by each vendor as of September 2026; a vendor
 * that has not published a remote endpoint is marked `url: ""` so the owner
 * pastes the one their account issues.
 *
 * Nothing here is secret. Tokens live in the vault, encrypted, never in this
 * file.
 */

export type McpAuth = "bearer" | "oauth" | "header" | "none";

export type McpPreset = {
  /** Stable slug. Doubles as the GCM binding for the stored token. */
  slug: string;
  label: string;
  /** Published remote MCP endpoint, or "" when the account issues its own. */
  url: string;
  auth: McpAuth;
  /** Which header carries the credential when `auth` is "header". */
  headerName?: string;
  /** What the advisor gains from this connection. */
  role: string;
  /** Where to get the token or read the setup page. */
  docsUrl: string;
  /** Category, for grouping in the hub. */
  category: "code" | "hosting" | "search" | "data" | "finance" | "crm" | "email" | "docs" | "design" | "ops" | "voice";
};

export const MCP_PRESETS: McpPreset[] = [
  // ─── Code and hosting ───────────────────────────────────────────────────
  { slug: "github", label: "GitHub", url: "https://api.githubcopilot.com/mcp/", auth: "bearer", role: "Read the repos, open PRs, check CI — GitHub is the single source of truth.", docsUrl: "https://github.com/github/github-mcp-server", category: "code" },
  { slug: "railway", label: "Railway", url: "https://mcp.railway.com/mcp", auth: "oauth", role: "Deploys, logs, variables and domains for the live service.", docsUrl: "https://docs.railway.com/reference/mcp-server", category: "hosting" },
  { slug: "vercel", label: "Vercel", url: "https://mcp.vercel.com", auth: "oauth", role: "The russell-capital-app project and its deployments.", docsUrl: "https://vercel.com/docs/mcp", category: "hosting" },
  { slug: "cloudflare", label: "Cloudflare", url: "https://docs.mcp.cloudflare.com/mcp", auth: "oauth", role: "DNS, Workers and R2 once the nameservers move.", docsUrl: "https://developers.cloudflare.com/agents/model-context-protocol/mcp-servers-for-cloudflare/", category: "hosting" },
  { slug: "neon", label: "Neon Postgres", url: "https://mcp.neon.tech/mcp", auth: "oauth", role: "Serverless Postgres branches for the Postgres port.", docsUrl: "https://neon.com/docs/ai/neon-mcp-server", category: "data" },
  { slug: "supabase", label: "Supabase", url: "https://mcp.supabase.com/mcp", auth: "oauth", role: "Postgres, auth and edge functions for satellite apps.", docsUrl: "https://supabase.com/docs/guides/getting-started/mcp", category: "data" },
  { slug: "sentry", label: "Sentry", url: "https://mcp.sentry.dev/mcp", auth: "oauth", role: "Production errors, straight into the advisor's hands.", docsUrl: "https://docs.sentry.io/product/sentry-mcp/", category: "ops" },
  { slug: "context7", label: "Context7", url: "https://mcp.context7.com/mcp", auth: "header", headerName: "CONTEXT7_API_KEY", role: "Current library documentation so generated code is not stale.", docsUrl: "https://context7.com", category: "code" },
  { slug: "replit", label: "Replit", url: "https://mcp.replit.com/mcp", auth: "oauth", role: "Build and publish satellite apps from a prompt.", docsUrl: "https://docs.replit.com", category: "code" },
  { slug: "lovable", label: "Lovable", url: "https://mcp.lovable.dev/mcp", auth: "oauth", role: "Full-stack prototype generation with a live preview.", docsUrl: "https://docs.lovable.dev", category: "code" },

  // ─── Search and research ────────────────────────────────────────────────
  { slug: "perplexity", label: "Perplexity", url: "https://mcp.perplexity.ai/mcp", auth: "bearer", role: "Cited web answers: carrier rates, statutes, card terms.", docsUrl: "https://docs.perplexity.ai/guides/mcp-server", category: "search" },
  { slug: "exa", label: "Exa", url: "https://mcp.exa.ai/mcp", auth: "header", headerName: "x-api-key", role: "Neural web search and page fetch for research packs.", docsUrl: "https://docs.exa.ai/reference/exa-mcp", category: "search" },
  { slug: "firecrawl", label: "Firecrawl", url: "https://mcp.firecrawl.dev/mcp", auth: "bearer", role: "Scrape carrier sites and issuer agreements into clean text.", docsUrl: "https://docs.firecrawl.dev/mcp-server", category: "search" },
  { slug: "jina", label: "Jina AI", url: "https://mcp.jina.ai/v1", auth: "bearer", role: "Read any URL as markdown; search arXiv and SSRN for the research library.", docsUrl: "https://jina.ai/mcp", category: "search" },
  { slug: "parallel", label: "Parallel Search", url: "https://mcp.parallel.ai/v1beta/search_mcp/", auth: "header", headerName: "x-api-key", role: "Answer-ready search excerpts for fact checks.", docsUrl: "https://docs.parallel.ai/integrations/mcp", category: "search" },
  { slug: "semrush", label: "Semrush", url: "https://mcp.semrush.com/v1/mcp", auth: "oauth", role: "SEO and traffic intelligence for the public site.", docsUrl: "https://developer.semrush.com/mcp/", category: "search" },
  { slug: "ahrefs", label: "Ahrefs", url: "https://api.ahrefs.com/mcp/mcp", auth: "bearer", role: "Backlinks and rank tracking for russellcapitalsystems.com.", docsUrl: "https://docs.ahrefs.com/docs/api/mcp", category: "search" },

  // ─── Finance and data ───────────────────────────────────────────────────
  { slug: "zacks", label: "Zacks Data", url: "", auth: "bearer", role: "Financial statements, ETF holdings and analyst research.", docsUrl: "https://www.zacks.com", category: "finance" },
  { slug: "stripe", label: "Stripe", url: "https://mcp.stripe.com", auth: "bearer", role: "Subscriptions, invoices and the pay.russellcapitalsystems.com flow.", docsUrl: "https://docs.stripe.com/mcp", category: "finance" },
  { slug: "airtable", label: "Airtable", url: "https://mcp.airtable.com/mcp", auth: "oauth", role: "Carrier rate sheets and card registries as editable bases.", docsUrl: "https://airtable.com/developers", category: "data" },
  { slug: "llamaparse", label: "LlamaParse", url: "https://mcp.cloud.llamaindex.ai/mcp", auth: "bearer", role: "Parse policy illustrations and statements into structured data.", docsUrl: "https://docs.cloud.llamaindex.ai/llamacloud/mcp", category: "data" },

  // ─── CRM, outreach, scheduling ──────────────────────────────────────────
  { slug: "hubspot", label: "HubSpot", url: "https://mcp.hubspot.com/anthropic", auth: "oauth", role: "Contacts, deals and the sync already wired in server/routers.ts.", docsUrl: "https://developers.hubspot.com/mcp", category: "crm" },
  { slug: "apollo", label: "Apollo.io", url: "https://mcp.apollo.io/mcp", auth: "oauth", role: "Prospect search and sequences for the practice-revenue engine.", docsUrl: "https://docs.apollo.io", category: "crm" },
  { slug: "clay", label: "Clay", url: "https://mcp.clay.com/mcp", auth: "oauth", role: "Enrichment of prospects and accounts.", docsUrl: "https://www.clay.com", category: "crm" },
  { slug: "calendly", label: "Calendly", url: "https://mcp.calendly.com/mcp", auth: "oauth", role: "The sixty-minute booking link on every page.", docsUrl: "https://developer.calendly.com/mcp", category: "crm" },
  { slug: "google-calendar", label: "Google Calendar", url: "", auth: "oauth", role: "Advisor meetings and reminders.", docsUrl: "https://developers.google.com/calendar", category: "crm" },
  { slug: "zoom", label: "Zoom", url: "https://mcp.zoom.us/mcp", auth: "oauth", role: "Meeting recordings and transcripts into client working memory.", docsUrl: "https://developers.zoom.us/docs/mcp/", category: "crm" },

  // ─── Email and documents ────────────────────────────────────────────────
  { slug: "resend", label: "Resend", url: "https://mcp.resend.com/mcp", auth: "bearer", role: "Transactional mail: PIN codes, PDFs, follow-ups.", docsUrl: "https://resend.com/docs/knowledge-base/mcp-server", category: "email" },
  { slug: "gmail", label: "Gmail", url: "", auth: "oauth", role: "The owner's inbox for lead replies and carrier correspondence.", docsUrl: "https://developers.google.com/gmail/api", category: "email" },
  { slug: "google-drive", label: "Google Drive", url: "", auth: "oauth", role: "Client documents and the patent portfolio files.", docsUrl: "https://developers.google.com/drive", category: "docs" },
  { slug: "dropbox", label: "Dropbox", url: "https://mcp.dropbox.com/mcp", auth: "oauth", role: "Archived illustrations and the 750-page site snapshots.", docsUrl: "https://www.dropbox.com/developers", category: "docs" },
  { slug: "notion", label: "Notion", url: "https://mcp.notion.com/mcp", auth: "oauth", role: "Durable pages: MASTER_SUMMARY, standing orders, continuity reports.", docsUrl: "https://developers.notion.com/docs/mcp", category: "docs" },
  { slug: "linear", label: "Linear", url: "https://mcp.linear.app/mcp", auth: "oauth", role: "The task board, mirrored where every brother can see it.", docsUrl: "https://linear.app/docs/mcp", category: "ops" },
  { slug: "asana", label: "Asana", url: "https://mcp.asana.com/v2/mcp", auth: "oauth", role: "Project tracking for the merge sequence.", docsUrl: "https://developers.asana.com/docs/using-asanas-model-control-protocol-mcp-server", category: "ops" },
  { slug: "zapier", label: "Zapier", url: "https://mcp.zapier.com/api/mcp/mcp", auth: "bearer", role: "Nine thousand apps behind one endpoint for anything not listed here.", docsUrl: "https://zapier.com/mcp", category: "ops" },
  { slug: "make", label: "Make", url: "https://mcp.make.com/mcp", auth: "bearer", role: "Scenarios, including the GoDaddy DNS read/apply for russellcapitalsystems.com.", docsUrl: "https://developers.make.com/mcp-server", category: "ops" },

  // ─── Voice and design ───────────────────────────────────────────────────
  { slug: "elevenlabs", label: "ElevenLabs", url: "https://mcp.elevenlabs.io/mcp", auth: "bearer", role: "The advisor's spoken voice, and the owner's cloned voice.", docsUrl: "https://elevenlabs.io/docs/mcp", category: "voice" },
  { slug: "heygen", label: "HeyGen HyperFrames", url: "https://mcp.heygen.com/mcp", auth: "oauth", role: "Avatar video renders for the homepage and the mortgage-killer explainers.", docsUrl: "https://docs.heygen.com", category: "voice" },
  { slug: "figma", label: "Figma", url: "https://mcp.figma.com/mcp", auth: "oauth", role: "Design context for the dark-forest-and-gold system.", docsUrl: "https://help.figma.com/hc/en-us/articles/32132100833559", category: "design" },
  { slug: "canva", label: "Canva", url: "https://mcp.canva.com/mcp", auth: "oauth", role: "Client-facing one-pagers from the strategy engines.", docsUrl: "https://www.canva.dev/docs/connect/mcp-server/", category: "design" },
];

export function getMcpPreset(slug: string): McpPreset | undefined {
  return MCP_PRESETS.find(p => p.slug === slug);
}

/** Group presets for the hub's accordion. */
export function mcpPresetsByCategory(): Record<McpPreset["category"], McpPreset[]> {
  const groups = {} as Record<McpPreset["category"], McpPreset[]>;
  for (const preset of MCP_PRESETS) {
    (groups[preset.category] ??= []).push(preset);
  }
  return groups;
}
