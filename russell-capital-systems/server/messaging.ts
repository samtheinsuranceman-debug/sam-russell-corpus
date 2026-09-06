// ============================================================
// MESSAGING — one deliver() for every email or text the platform sends to a
// lead or client, by hand or by automation. Chooses the transport, honours
// opt-outs, writes the outbound log, and never puts figures in a message.
// Templates are plain, short, and end with the compliance line.
// ============================================================
import { publicBaseUrl, sendMail } from "./_core/mailer";
import { sendSms, smsMode } from "./_core/sms";
import { mailMode } from "./_core/mailer";
import { logOutboundMessage } from "./messagingDb";
import { logClientActivity } from "./db";

export type Channel = "email" | "sms";
export type Category = "transactional" | "marketing";

export type DeliverInput = {
  channel: Channel;
  to: string;
  subject?: string;
  body: string;        // plain text; html is derived
  html?: string;
  category?: Category;
  template?: string;
  clientId?: number | null;
  leadId?: number | null;
  workspaceId?: number | null;
  userId?: number | null;
  actorName?: string;
};
export type DeliverResult = { sent: boolean; via?: string; reason?: string; suppressed?: boolean; logId: number | null };

export const COMPLIANCE_LINE = "General education only — not tax, legal, or investment advice. Every strategy is reviewed by a licensed advisor and the tax professional team before anything is implemented.";

const esc = (v: string) => v.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));

/** Wrap plain text in the site's email frame. Paragraphs split on blank lines; URLs become links. */
export function textToHtml(text: string, title = "Russell Capital Systems"): string {
  const paras = text.trim().split(/\n\s*\n/).map((p) => {
    const withLinks = esc(p).replace(/(https?:\/\/[^\s<]+)/g, (u) => `<a href="${u}" style="color:#34d399;">${u}</a>`).replace(/\n/g, "<br/>");
    return `<p style="line-height:1.6;margin:0 0 14px;">${withLinks}</p>`;
  }).join("");
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:#060f1e;font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;color:#c8d8ec;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <div style="font-size:18px;font-weight:800;color:#fff;margin-bottom:20px;">Russell<span style="color:#4f8cff">Capital</span></div>
    ${paras}
    <p style="line-height:1.6;color:#8fa6c4;font-size:12px;border-top:1px solid #1b2a44;padding-top:14px;margin-top:20px;">${esc(COMPLIANCE_LINE)}</p>
  </div>
</body></html>`;
}

export function messagingStatus() {
  return { email: mailMode(), sms: smsMode(), emailConfigured: mailMode() !== "none", smsConfigured: smsMode() !== "none", baseUrl: publicBaseUrl() };
}

export async function deliver(input: DeliverInput): Promise<DeliverResult> {
  const category = input.category ?? "transactional";
  let result: { sent: boolean; via?: string; reason?: string; suppressed?: boolean };
  if (input.channel === "email") {
    const subject = (input.subject ?? "A note from Russell Capital Systems").slice(0, 300);
    result = await sendMail({ to: input.to, subject, text: `${input.body.trim()}\n\n${COMPLIANCE_LINE}`, html: input.html ?? textToHtml(input.body, subject), category });
  } else {
    const r = await sendSms({ to: input.to, body: input.body, category });
    result = { sent: r.sent, via: r.via, reason: r.reason, suppressed: r.reason?.includes("opted out") };
  }
  const logId = await logOutboundMessage({
    workspaceId: input.workspaceId ?? null,
    clientId: input.clientId ?? null,
    leadId: input.leadId ?? null,
    userId: input.userId ?? null,
    channel: input.channel,
    category,
    toAddress: input.to.slice(0, 320),
    subject: input.channel === "email" ? (input.subject ?? null) : null,
    body: input.body,
    template: input.template ?? null,
    status: result.sent ? "sent" : result.suppressed ? "suppressed" : "failed",
    via: result.via ?? null,
    reason: result.reason ?? null,
  });
  if (input.clientId && input.workspaceId) {
    try {
      await logClientActivity({
        clientId: input.clientId, workspaceId: input.workspaceId, action: input.channel === "email" ? "email" : "sms",
        actorName: input.actorName ?? "Automation", actorUserId: input.userId ?? undefined, entityType: "message", entityId: logId ?? undefined,
        summary: `${input.channel === "email" ? "Email" : "Text"} ${result.sent ? "sent" : "not sent"}${input.template ? ` (${input.template})` : ""}${input.subject ? `: ${input.subject}` : ""}`,
      });
    } catch { /* activity log is best-effort */ }
  }
  return { ...result, logId };
}

// ─── Templates the advisor can pick from ─────────────────────────────────────
export type TemplateVars = { firstName: string; advisorName: string; baseUrl: string };
export type MessageTemplate = { id: string; label: string; subject: string; email: (v: TemplateVars) => string; sms: (v: TemplateVars) => string };

export const MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    id: "check_in", label: "Friendly check-in", subject: "Checking in",
    email: (v) => `Hi ${v.firstName},\n\nJust checking in. If anything has changed — income, a move, a new practice, a question that has been on your mind — reply to this email and we will work it into the plan.\n\nTalk soon,\n${v.advisorName}`,
    sms: (v) => `Hi ${v.firstName}, ${v.advisorName} at Russell Capital Systems. Checking in — anything changed, or a question on your mind? Reply here anytime.`,
  },
  {
    id: "assessment_reminder", label: "Finish your Financial Assessment", subject: "Your Financial Assessment is waiting",
    email: (v) => `Hi ${v.firstName},\n\nYour Financial Assessment is the foundation for everything we build. It takes about twenty minutes and saves as you go:\n\n${v.baseUrl}/portal/financial-assessment\n\nOnce it is complete, the AI Financial Advisor can answer your questions and lay out your customized journey through the site.\n\n${v.advisorName}`,
    sms: (v) => `Hi ${v.firstName}, your Financial Assessment is waiting (about 20 min, saves as you go): ${v.baseUrl}/portal/financial-assessment — ${v.advisorName}`,
  },
  {
    id: "journey_ready", label: "Your secret journey is ready", subject: "Your customized journey is ready",
    email: (v) => `Hi ${v.firstName},\n\nYour questions have been boiled down to their core, and the librarian has laid out a page-by-page journey through the site that answers them in order — calculators included, pre-filled from your assessment.\n\nStart here: ${v.baseUrl}/portal/my-journey\n\n${v.advisorName}`,
    sms: (v) => `Hi ${v.firstName}, your customized journey is ready — a page-by-page path that answers your questions in order: ${v.baseUrl}/portal/my-journey — ${v.advisorName}`,
  },
  {
    id: "report_ready", label: "A report is ready in your portal", subject: "A new report is ready for you",
    email: (v) => `Hi ${v.firstName},\n\nA new report has been posted to your client portal. Sign in to review it, and reply with any question — no detail is too small.\n\n${v.baseUrl}/portal\n\n${v.advisorName}`,
    sms: (v) => `Hi ${v.firstName}, a new report is ready in your Russell Capital Systems portal: ${v.baseUrl}/portal — ${v.advisorName}`,
  },
  {
    id: "meeting_reminder", label: "Meeting reminder", subject: "Reminder: our meeting",
    email: (v) => `Hi ${v.firstName},\n\nA quick reminder about our upcoming meeting. If you have recent tax returns or statements handy, have them nearby — we will use them.\n\nNeed to move it? Reply to this email.\n\n${v.advisorName}`,
    sms: (v) => `Hi ${v.firstName}, reminder about our upcoming meeting with ${v.advisorName}. Have recent returns or statements nearby if you can. Need to move it? Reply here.`,
  },
  {
    id: "thank_you", label: "Thank you after a meeting", subject: "Thank you",
    email: (v) => `Hi ${v.firstName},\n\nThank you for the time today. The next steps we discussed are being written up, and you will see them in your portal shortly.\n\n${v.baseUrl}/portal\n\n${v.advisorName}`,
    sms: (v) => `Hi ${v.firstName}, thank you for today. The next steps are being written up and will be in your portal shortly. — ${v.advisorName}`,
  },
];

export function renderTemplate(id: string, channel: Channel, vars: Partial<TemplateVars>): { subject: string; body: string } | null {
  const t = MESSAGE_TEMPLATES.find((x) => x.id === id);
  if (!t) return null;
  const v: TemplateVars = { firstName: vars.firstName?.trim() || "there", advisorName: vars.advisorName?.trim() || "Russell Capital Systems", baseUrl: vars.baseUrl ?? publicBaseUrl() };
  return { subject: t.subject, body: channel === "email" ? t.email(v) : t.sms(v) };
}
