// ============================================================
// MAIL TRANSPORT — one sendMail() for the app, two ways to deliver:
//   1. Resend            RESEND_API_KEY (+ verified sender domain)
//   2. Plain SMTP        SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
//                        (Gmail with an app password, the host's own mail
//                        server, or any provider — nothing to verify first)
// With neither configured the message is not sent and the caller is told so.
// Secrets are read from the environment only.
// ============================================================
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

export type MailMessage = { to: string; subject: string; text: string; html?: string; from?: string };
export type MailResult = { sent: boolean; via?: "resend" | "smtp"; reason?: string };

export const DEFAULT_FROM = "Russell Capital Systems™ <hello@russellcapitalsystems.com>";

export type MailEnv = {
  RESEND_API_KEY?: string;
  SMTP_HOST?: string;
  SMTP_PORT?: string;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  SMTP_FROM?: string;
  SMTP_SECURE?: string;
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

/** The From header: SMTP providers usually require it to match the account. */
export function fromAddress(env: MailEnv = process.env as MailEnv): string {
  if (mailMode(env) === "smtp") return env.SMTP_FROM || env.SMTP_USER!;
  return DEFAULT_FROM;
}

let _transport: Transporter | null = null;
function smtpTransport(): Transporter {
  if (!_transport) _transport = nodemailer.createTransport(smtpOptions());
  return _transport;
}
export function _resetTransportForTests(t: Transporter | null = null) { _transport = t; }

type ResendLike = { emails: { send: (m: { from: string; to: string; subject: string; text: string; html?: string }) => Promise<{ error?: unknown }> } };
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
  const from = msg.from ?? fromAddress();
  try {
    if (mode === "resend") {
      const { error } = await (await resendClient()).emails.send({ from, to: msg.to, subject: msg.subject, text: msg.text, html: msg.html });
      if (error) return { sent: false, via: "resend", reason: "Email delivery failed" };
      return { sent: true, via: "resend" };
    }
    await smtpTransport().sendMail({ from, to: msg.to, subject: msg.subject, text: msg.text, html: msg.html });
    return { sent: true, via: "smtp" };
  } catch (error) {
    console.warn("[Mail] delivery failed via", mode, String(error).slice(0, 200));
    return { sent: false, via: mode, reason: "Email delivery failed" };
  }
}
