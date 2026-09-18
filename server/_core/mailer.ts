// ============================================================
// MAIL TRANSPORT — one sendMail() for the app, two ways to deliver:
//   1. Resend            RESEND_API_KEY (+ verified sender domain)
//   2. Plain SMTP        SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
//                        (Gmail with an app password, the host's own mail
//                        server, or any provider — nothing to verify first)
// With neither configured the message is not sent and the caller is told so.
//
// Deliverability is built in so mail lands in the inbox, not spam:
//   - every message has a plain-text part and a Reply-To (MAIL_REPLY_TO)
//   - marketing mail carries RFC 8058 one-click List-Unsubscribe headers and
//     an unsubscribe link; addresses that opted out are never sent marketing
//   - the From address is MAIL_FROM when set (must be on a domain whose SPF,
//     DKIM and DMARC records pass — check with `pnpm mail:check`)
// Secrets are read from the environment only.
// ============================================================
import { createHmac, timingSafeEqual } from "node:crypto";
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import type { Express, Request, Response } from "express";
import { isEmailOptedOut, recordEmailOptOut } from "../messagingDb";

export type MailAttachment = { filename: string; content: Buffer | string; contentType?: string };
export type MailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  from?: string;
  replyTo?: string;
  attachments?: MailAttachment[];
  headers?: Record<string, string>;
  /** marketing mail gets unsubscribe headers and honours opt-outs; default transactional */
  category?: "transactional" | "marketing";
};
export type MailResult = { sent: boolean; via?: "resend" | "smtp"; reason?: string; suppressed?: boolean };

export const DEFAULT_FROM = "Russell Capital Systems™ <hello@russellcapitalsystems.com>";

export type MailEnv = {
  RESEND_API_KEY?: string;
  SMTP_HOST?: string;
  SMTP_PORT?: string;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  SMTP_FROM?: string;
  SMTP_SECURE?: string;
  MAIL_FROM?: string;
  MAIL_REPLY_TO?: string;
  PUBLIC_BASE_URL?: string;
  JWT_SECRET?: string;
};

export function mailMode(env: MailEnv = process.env as MailEnv): "resend" | "smtp" | "none" {
  if (env.RESEND_API_KEY) return "resend";
  if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) return "smtp";
  return "none";
}

export function smtpOptions(env: MailEnv = process.env as MailEnv) {
  const port = Number(env.SMTP_PORT || 587);
  const secure = env.SMTP_SECURE ? env.SMTP_SECURE === "true" : port === 465;
  return { host: env.SMTP_HOST, port, secure, auth: { user: env.SMTP_USER!, pass: env.SMTP_PASS! } };
}

/** The From header: MAIL_FROM wins; SMTP providers usually require it to match the account. */
export function fromAddress(env: MailEnv = process.env as MailEnv): string {
  if (env.MAIL_FROM) return env.MAIL_FROM;
  if (mailMode(env) === "smtp") return env.SMTP_FROM || env.SMTP_USER!;
  return DEFAULT_FROM;
}

export function replyToAddress(env: MailEnv = process.env as MailEnv): string | undefined {
  return env.MAIL_REPLY_TO || undefined;
}

/** The bare address inside "Name <addr>" (or the string itself). */
export function bareAddress(from: string): string {
  const m = from.match(/<([^>]+)>/);
  return (m ? m[1] : from).trim();
}

export function senderDomain(env: MailEnv = process.env as MailEnv): string {
  return bareAddress(fromAddress(env)).split("@")[1] ?? "";
}

// ─── Unsubscribe tokens + headers ────────────────────────────────────────────
function secret(env: MailEnv): string {
  return env.JWT_SECRET || "rcs-unsubscribe";
}
export function unsubscribeToken(email: string, env: MailEnv = process.env as MailEnv): string {
  return createHmac("sha256", secret(env)).update(email.trim().toLowerCase()).digest("hex").slice(0, 32);
}
export function verifyUnsubscribeToken(email: string, token: string, env: MailEnv = process.env as MailEnv): boolean {
  const expected = Buffer.from(unsubscribeToken(email, env));
  const given = Buffer.from(String(token ?? ""));
  return expected.length === given.length && timingSafeEqual(expected, given);
}
export function publicBaseUrl(env: MailEnv = process.env as MailEnv): string {
  return (env.PUBLIC_BASE_URL || "https://russellcapitalsystems.com").replace(/\/+$/, "");
}
export function unsubscribeUrl(email: string, env: MailEnv = process.env as MailEnv): string {
  const e = email.trim().toLowerCase();
  return `${publicBaseUrl(env)}/api/mail/unsubscribe?e=${encodeURIComponent(e)}&t=${unsubscribeToken(e, env)}`;
}
/** RFC 8058 one-click headers (Gmail/Yahoo bulk-sender requirement). */
export function unsubscribeHeaders(email: string, env: MailEnv = process.env as MailEnv): Record<string, string> {
  const url = unsubscribeUrl(email, env);
  const mailto = replyToAddress(env) ?? bareAddress(fromAddress(env));
  return {
    "List-Unsubscribe": `<${url}>, <mailto:${mailto}?subject=unsubscribe>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}
/** Footer appended to marketing mail (text + html variants). */
export function unsubscribeFooter(email: string, env: MailEnv = process.env as MailEnv): { text: string; html: string } {
  const url = unsubscribeUrl(email, env);
  return {
    text: `\n\nYou are receiving this because you asked Russell Capital Systems for a planning estimate. Unsubscribe: ${url}`,
    html: `<p style="font-size:12px;color:#5b6b82;margin-top:24px;">You are receiving this because you asked Russell Capital Systems for a planning estimate. <a href="${url}" style="color:#5b6b82;">Unsubscribe</a></p>`,
  };
}

let _transport: Transporter | null = null;
function smtpTransport(): Transporter {
  if (!_transport) _transport = nodemailer.createTransport(smtpOptions());
  return _transport;
}
export function _resetTransportForTests(t: Transporter | null = null) { _transport = t; }

type ResendSendInput = { from: string; to: string; subject: string; text: string; html?: string; replyTo?: string; headers?: Record<string, string>; attachments?: Array<{ filename: string; content: Buffer | string; contentType?: string }> };
type ResendLike = { emails: { send: (m: ResendSendInput) => Promise<{ error?: unknown }> } };
let _resend: ResendLike | null = null;
async function resendClient(): Promise<ResendLike> {
  if (!_resend) {
    const { Resend } = await import("resend");
    _resend = new Resend(process.env.RESEND_API_KEY) as unknown as ResendLike;
  }
  return _resend;
}
export function _resetResendForTests(r: ResendLike | null = null) { _resend = r; }

export async function sendMail(msg: MailMessage): Promise<MailResult> {
  const mode = mailMode();
  if (mode === "none") return { sent: false, reason: "No mail transport configured (set RESEND_API_KEY or SMTP_*)" };
  const category = msg.category ?? "transactional";
  const to = msg.to.trim();
  if (category === "marketing" && (await isEmailOptedOut(to))) return { sent: false, reason: "This address has unsubscribed", suppressed: true };

  const from = msg.from ?? fromAddress();
  const replyTo = msg.replyTo ?? replyToAddress();
  const headers = { ...(msg.headers ?? {}) };
  let text = msg.text;
  let html = msg.html;
  if (category === "marketing") {
    Object.assign(headers, unsubscribeHeaders(to));
    const footer = unsubscribeFooter(to);
    text += footer.text;
    if (html) html = html.includes("</body>") ? html.replace("</body>", `${footer.html}</body>`) : html + footer.html;
  }
  try {
    if (mode === "resend") {
      const { error } = await (await resendClient()).emails.send({ from, to, subject: msg.subject, text, html, replyTo, headers, attachments: msg.attachments });
      if (error) return { sent: false, via: "resend", reason: "Email delivery failed" };
      return { sent: true, via: "resend" };
    }
    await smtpTransport().sendMail({ from, to, subject: msg.subject, text, html, replyTo, headers, attachments: msg.attachments });
    return { sent: true, via: "smtp" };
  } catch (error) {
    console.warn("[Mail] delivery failed via", mode, String(error).slice(0, 200));
    return { sent: false, via: mode, reason: "Email delivery failed" };
  }
}

// ─── Unsubscribe endpoint (GET confirms; POST is the one-click path) ─────────
function unsubscribePage(title: string, body: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;background:#060f1e;color:#c8d8ec;font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;"><div style="max-width:520px;margin:64px auto;padding:32px;background:#0b1628;border:1px solid #12233e;border-radius:16px;">
<div style="font-size:20px;font-weight:800;color:#fff;margin-bottom:16px;">Russell<span style="color:#4f8cff">Capital</span></div><h1 style="font-size:20px;color:#fff;margin:0 0 12px;">${title}</h1>${body}</div></body></html>`;
}
export function registerMailRoutes(app: Express): void {
  const handle = async (req: Request, res: Response, confirmOnly: boolean) => {
    const e = String((req.query.e ?? (req.body as Record<string, unknown> | undefined)?.e ?? "")).trim().toLowerCase();
    const t = String(req.query.t ?? (req.body as Record<string, unknown> | undefined)?.t ?? "");
    if (!e || !verifyUnsubscribeToken(e, t)) { res.status(400).send(unsubscribePage("Link not valid", "<p>This unsubscribe link is not valid. Reply to any of our emails with the word <strong>unsubscribe</strong> and we will remove you by hand.</p>")); return; }
    if (confirmOnly) {
      res.send(unsubscribePage("Unsubscribe?", `<p>Stop receiving follow-up emails at <strong style="color:#fff">${e.replace(/[<>&]/g, "")}</strong>? Reports and messages you ask for directly will still arrive.</p><form method="post" action="/api/mail/unsubscribe"><input type="hidden" name="e" value="${e.replace(/"/g, "&quot;")}"><input type="hidden" name="t" value="${t.replace(/"/g, "&quot;")}"><button type="submit" style="background:#4f8cff;color:#fff;border:0;border-radius:10px;padding:12px 24px;font-weight:700;cursor:pointer;">Yes, unsubscribe</button></form>`));
      return;
    }
    await recordEmailOptOut(e, "link");
    res.send(unsubscribePage("You're unsubscribed", "<p>No more follow-up emails will be sent to this address.</p>"));
  };
  app.get("/api/mail/unsubscribe", (req, res) => void handle(req, res, true));
  app.post("/api/mail/unsubscribe", (req, res) => void handle(req, res, false));
}
