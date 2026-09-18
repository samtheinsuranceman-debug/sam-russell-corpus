/**
 * Slack slash command handler for two-way integration.
 * Supports commands like:
 *   /rc client <name>     — Search for a client
 *   /rc pipeline           — Show deal pipeline summary
 *   /rc stats              — Show workspace stats
 *   /rc help               — Show available commands
 */
import { searchClientsByName, getPipelineSummary, getWorkspaceStats, getSlackIntegration } from "./db";

interface SlackCommandPayload {
  token: string;
  team_id: string;
  channel_id: string;
  user_id: string;
  user_name: string;
  command: string;
  text: string;
  response_url: string;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function buildClientBlock(c: any) {
  const netWorth = Number(c.iraBalance ?? 0) + Number(c.rothBalance ?? 0) +
    Number(c.taxableAssets ?? 0) + Number(c.realEstateEquity ?? 0) +
    Number(c.lifeInsuranceCv ?? 0);
  return {
    type: "section",
    text: {
      type: "mrkdwn",
      text: [
        `*${c.name}*${c.age ? ` (Age ${c.age})` : ""}`,
        c.email ? `📧 ${c.email}` : null,
        c.phone ? `📱 ${c.phone}` : null,
        `💰 Net Worth: ${fmt(netWorth)}`,
        c.income ? `📊 Income: ${fmt(Number(c.income))}` : null,
        c.filingStatus ? `📋 Filing: ${c.filingStatus}` : null,
      ].filter(Boolean).join("\n"),
    },
  };
}

export async function handleSlackCommand(payload: SlackCommandPayload, workspaceId: number) {
  const text = (payload.text ?? "").trim();
  const [subCommand, ...args] = text.split(/\s+/);
  const argText = args.join(" ").trim();

  // /rc help
  if (!subCommand || subCommand === "help") {
    return {
      response_type: "ephemeral",
      blocks: [
        { type: "header", text: { type: "plain_text", text: "Russell Capital Systems™ — Slack Commands" } },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: [
              "`/rc client <name>` — Search for a client by name",
              "`/rc pipeline` — Show deal pipeline summary",
              "`/rc stats` — Show workspace statistics",
              "`/rc help` — Show this help message",
            ].join("\n"),
          },
        },
      ],
    };
  }

  // /rc client <name>
  if (subCommand === "client") {
    if (!argText) {
      return { response_type: "ephemeral", text: "Usage: `/rc client <name>`\nExample: `/rc client John Smith`" };
    }
    const clients = await searchClientsByName(workspaceId, argText);
    if (clients.length === 0) {
      return { response_type: "ephemeral", text: `No clients found matching "${argText}".` };
    }
    return {
      response_type: "ephemeral",
      blocks: [
        { type: "header", text: { type: "plain_text", text: `Client Search: "${argText}"` } },
        ...clients.map(buildClientBlock),
        { type: "context", elements: [{ type: "mrkdwn", text: `Found ${clients.length} result${clients.length === 1 ? "" : "s"}` }] },
      ],
    };
  }

  // /rc pipeline
  if (subCommand === "pipeline") {
    const stages = await getPipelineSummary(workspaceId);
    if (stages.length === 0) {
      return { response_type: "ephemeral", text: "No deals in the pipeline yet." };
    }
    const stageEmoji: Record<string, string> = {
      LEAD: "🔵", QUALIFIED: "🟡", PROPOSAL: "🟠", NEGOTIATION: "🔶", CLOSED_WON: "🟢", CLOSED_LOST: "🔴",
    };
    const lines = stages.map(s => {
      const emoji = stageEmoji[s.stage] ?? "⚪";
      return `${emoji} *${s.stage}*: ${s.count} deal${Number(s.count) === 1 ? "" : "s"} — ${fmt(Number(s.totalValue ?? 0))}`;
    });
    return {
      response_type: "ephemeral",
      blocks: [
        { type: "header", text: { type: "plain_text", text: "Deal Pipeline Summary" } },
        { type: "section", text: { type: "mrkdwn", text: lines.join("\n") } },
      ],
    };
  }

  // /rc stats
  if (subCommand === "stats") {
    const stats = await getWorkspaceStats(workspaceId);
    return {
      response_type: "ephemeral",
      blocks: [
        { type: "header", text: { type: "plain_text", text: "Workspace Statistics" } },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: [
              `👥 *Clients:* ${stats.clientCount}`,
              `💼 *Deals:* ${stats.dealCount}`,
              `🧠 *Strategies:* ${stats.strategyCount}`,
            ].join("\n"),
          },
        },
      ],
    };
  }

  return { response_type: "ephemeral", text: `Unknown command: \`${subCommand}\`. Type \`/rc help\` for available commands.` };
}

/**
 * Resolve workspace from Slack team_id.
 */
export async function resolveWorkspaceFromSlack(teamId: string): Promise<number | null> {
  // We need to look up which workspace has this Slack team_id
  const { getDb } = await import("./db");
  const { slackIntegrations } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  const db = await getDb();
  if (!db) return null;
  const [integration] = await db.select().from(slackIntegrations).where(eq(slackIntegrations.teamId, teamId)).limit(1);
  return integration?.workspaceId ?? null;
}
