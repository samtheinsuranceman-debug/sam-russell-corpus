/**
 * Email service using Resend.
 * Falls back gracefully (logs to console) when RESEND_API_KEY is not set,
 * so the app works in dev without an API key configured.
 */
import { Resend } from "resend";

let _resend: Resend | null = null;

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!_resend) _resend = new Resend(key);
  return _resend;
}

function sanitizeEmailHtml(html: string) {
  return html
    .replace(/<\s*(script|iframe|object|embed|form|input|button|svg|math|link|meta|base)\b[^>]*>[\s\S]*?<\/\s*\1\s*>/gi, "")
    .replace(/<\s*(iframe|object|embed|form|input|button|svg|math|link|meta|base)\b[^>]*\/?>/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\s+(href|src)\s*=\s*(["'])\s*(?:javascript|data|vbscript):[\s\S]*?\2/gi, ' $1="#"');
}

function emailStatus(event: string, ok: boolean) {
  const safeEvent = event.replace(/[^a-z0-9_-]/gi, "_").slice(0, 80);
  (ok ? console.info : console.warn)(`[Email] ${safeEvent}: ${ok ? "sent" : "not_sent"}`);
}

export interface InvitationEmailOptions {
  toEmail: string;
  toName?: string;
  inviterName: string;
  workspaceName: string;
  role: string;
  inviteUrl: string;
  expiresAt: Date;
}

/**
 * Sends a workspace invitation email.
 * Returns { sent: true } on success, { sent: false, reason } when email is skipped.
 */
export async function sendInvitationEmail(opts: InvitationEmailOptions): Promise<{ sent: boolean; reason?: string }> {
  const resend = getResend();

  const expiryStr = opts.expiresAt.toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const roleLabel = opts.role.charAt(0) + opts.role.slice(1).toLowerCase().replace("_", " ");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You're invited to ${opts.workspaceName}</title>
  <style>
    body { margin: 0; padding: 0; background: #060f1e; font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; color: #c8d8ec; }
    .container { max-width: 560px; margin: 40px auto; padding: 0 20px; }
    .card { background: #0b1628; border: 1px solid #12233e; border-radius: 16px; padding: 40px; }
    .logo { font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; margin-bottom: 32px; }
    .logo span { color: #4f8cff; }
    h1 { font-size: 24px; font-weight: 700; color: #ffffff; margin: 0 0 12px; }
    p { font-size: 15px; line-height: 1.6; color: #7a95b8; margin: 0 0 16px; }
    .role-badge { display: inline-block; background: #4f8cff1a; border: 1px solid #4f8cff33; color: #4f8cff; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 20px; margin-bottom: 24px; }
    .cta { display: block; background: #4f8cff; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 15px; text-align: center; padding: 14px 28px; border-radius: 10px; margin: 28px 0; }
    .cta:hover { background: #3a7aee; }
    .url-box { background: #060f1e; border: 1px solid #12233e; border-radius: 8px; padding: 12px 16px; font-size: 12px; color: #7a95b8; word-break: break-all; margin-bottom: 24px; }
    .footer { font-size: 12px; color: #3d5a7a; margin-top: 32px; text-align: center; }
    .divider { border: none; border-top: 1px solid #12233e; margin: 24px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">Russell<span>Capital</span></div>
      <h1>You've been invited</h1>
      <p><strong style="color:#ffffff">${opts.inviterName}</strong> has invited you to join <strong style="color:#ffffff">${opts.workspaceName}</strong> on Russell Capital Systems™.</p>
      <div class="role-badge">${roleLabel}</div>
      <p>Click the button below to accept your invitation and set up your account. This link expires on <strong style="color:#c8d8ec">${expiryStr}</strong>.</p>
      <a href="${opts.inviteUrl}" class="cta">Accept Invitation →</a>
      <p style="font-size:13px">Or copy this link into your browser:</p>
      <div class="url-box">${opts.inviteUrl}</div>
      <hr class="divider" />
      <p style="font-size:13px">If you weren't expecting this invitation, you can safely ignore this email. No account will be created without your action.</p>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} Russell Capital Systems™ · AI Wealth OS<br/>
      <a href="mailto:support@russellcapitalsystems.com" style="color:#3d5a7a">support@russellcapitalsystems.com</a>
    </div>
  </div>
</body>
</html>`;

  const text = `You've been invited to ${opts.workspaceName} on Russell Capital Systems™.

${opts.inviterName} has invited you as ${roleLabel}.

Accept your invitation here:
${opts.inviteUrl}

This link expires on ${expiryStr}.

If you weren't expecting this invitation, you can safely ignore this email.`;

  if (!resend) {
    // Dev fallback: log to console so developers can see the invite link
    emailStatus("resend_api_key_not_set", false);
    emailStatus("to", false);
    emailStatus("invite_url", false);
    emailStatus("expires", false);
    return { sent: false, reason: "RESEND_API_KEY not configured — invite URL logged to server console" };
  }

  try {
    const { error } = await resend.emails.send({
      from: "Russell Capital Systems™ <invites@russellcapitalsystems.com>",
      to: opts.toEmail,
      subject: `${opts.inviterName} invited you to ${opts.workspaceName}`,
      html: sanitizeEmailHtml(html),
      text,
    });

    if (error) {
      emailStatus("resend_error", false);
      return { sent: false, reason: "Email delivery failed" };
    }

    emailStatus("invitation_sent_to", true);
    return { sent: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    emailStatus("failed_to_send_invitation", false);
    return { sent: false, reason: "Email delivery failed" };
  }
}


// ─── Homepage Lead Acknowledgement ───────────────────────────────────────────

export interface LeadAckOptions {
  toEmail: string;
  firstName?: string | null;
}

/**
 * Sends a warm, non-committal acknowledgement to a prospect who completed the
 * homepage estimator. Intentionally contains NO figures, no advice, and makes
 * no promises — just confirms receipt and that an advisor will follow up.
 */
export async function sendLeadAcknowledgement(opts: LeadAckOptions): Promise<{ sent: boolean; reason?: string }> {
  const resend = getResend();
  const name = (opts.firstName ?? "").trim() || "there";
  const subject = "Thanks — your Russell Capital Systems estimate is on its way";
  const text =
    `Hi ${name},\n\n` +
    `Thank you for completing the Russell Capital Systems planning estimate. We've received your information ` +
    `and an advisor will reach out to schedule your thorough evaluation.\n\n` +
    `A note on what you saw: any strategies or figures are general education only — not tax, legal, or ` +
    `investment advice, and not guaranteed. Every result is reviewed by our tax professional team for ` +
    `suitability and compliance with applicable IRS statutes before anything is implemented, and your own ` +
    `results may differ.\n\n` +
    `Talk soon,\nRussell Capital Systems`;
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#060f1e;font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;color:#c8d8ec;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <h1 style="color:#34d399;font-size:20px;margin:0 0 16px;">Thanks, ${name} — we've got it.</h1>
    <p style="line-height:1.6;">Thank you for completing the Russell Capital Systems planning estimate. We've received your information and an advisor will reach out to schedule your thorough evaluation.</p>
    <p style="line-height:1.6;color:#8fa6c4;font-size:13px;border-top:1px solid #1b2a44;padding-top:16px;margin-top:24px;">Any strategies or figures you saw are general education only — not tax, legal, or investment advice, and not guaranteed. Every result is reviewed by our tax professional team for suitability and compliance with applicable IRS statutes before anything is implemented, and your own results may differ.</p>
    <p style="line-height:1.6;">Talk soon,<br/>Russell Capital Systems</p>
  </div>
</body></html>`;

  if (!resend) {
    emailStatus("lead_ack_skipped_no_key", false);
    return { sent: false, reason: "RESEND_API_KEY not configured" };
  }
  try {
    const { error } = await resend.emails.send({
      from: "Russell Capital Systems™ <hello@russellcapitalsystems.com>",
      to: opts.toEmail,
      subject,
      html: sanitizeEmailHtml(html),
      text,
    });
    if (error) {
      emailStatus("lead_ack_resend_error", false);
      return { sent: false, reason: "Email delivery failed" };
    }
    emailStatus("lead_ack_sent", true);
    return { sent: true };
  } catch {
    emailStatus("lead_ack_failed", false);
    return { sent: false, reason: "Email delivery failed" };
  }
}

// ─── Stale Client Digest Email ───────────────────────────────────────────────

export interface StaleClient {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  daysSinceContact: number;
  lastContact: Date;
}

export interface StaleDigestOptions {
  toEmail: string;
  toName?: string;
  workspaceName: string;
  staleClients: StaleClient[];
  staleDays: number;
}

/**
 * Sends a weekly stale client digest email summarizing clients not contacted recently.
 * Returns { sent: true } on success, { sent: false, reason } when email is skipped.
 */
export async function sendStaleClientDigest(opts: StaleDigestOptions): Promise<{ sent: boolean; reason?: string; clientCount: number }> {
  const resend = getResend();

  if (opts.staleClients.length === 0) {
    return { sent: false, reason: "No stale clients to report", clientCount: 0 };
  }

  const clientRows = opts.staleClients.slice(0, 25).map(c => {
    const lastDate = c.lastContact.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    return `<tr>
      <td style="padding:10px 12px;border-bottom:1px solid #12233e;color:#ffffff;font-weight:500">${c.name}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #12233e;color:#7a95b8">${c.email ?? "—"}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #12233e;color:#7a95b8">${lastDate}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #12233e;text-align:center"><span style="background:${c.daysSinceContact >= 60 ? '#ef44441a;color:#ef4444' : '#f59e0b1a;color:#f59e0b'};font-size:12px;font-weight:600;padding:3px 10px;border-radius:12px">${c.daysSinceContact}d</span></td>
    </tr>`;
  }).join("");

  const textRows = opts.staleClients.slice(0, 25).map(c => {
    const lastDate = c.lastContact.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    return `  • ${c.name} (${c.email ?? "no email"}) — ${c.daysSinceContact} days since last contact (${lastDate})`;
  }).join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Stale Client Digest — ${opts.workspaceName}</title>
  <style>
    body { margin:0; padding:0; background:#060f1e; font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif; color:#c8d8ec; }
    .container { max-width:640px; margin:40px auto; padding:0 20px; }
    .card { background:#0b1628; border:1px solid #12233e; border-radius:16px; padding:40px; }
    .logo { font-size:22px; font-weight:800; color:#ffffff; letter-spacing:-0.5px; margin-bottom:32px; }
    .logo span { color:#4f8cff; }
    h1 { font-size:22px; font-weight:700; color:#ffffff; margin:0 0 8px; }
    p { font-size:15px; line-height:1.6; color:#7a95b8; margin:0 0 16px; }
    .alert-badge { display:inline-block; background:#f59e0b1a; border:1px solid #f59e0b33; color:#f59e0b; font-size:13px; font-weight:600; padding:4px 14px; border-radius:20px; margin-bottom:20px; }
    table { width:100%; border-collapse:collapse; margin:20px 0; }
    th { text-align:left; padding:8px 12px; font-size:12px; font-weight:600; color:#3d5a7a; text-transform:uppercase; letter-spacing:0.5px; border-bottom:2px solid #12233e; }
    .footer { font-size:12px; color:#3d5a7a; margin-top:32px; text-align:center; }
    .divider { border:none; border-top:1px solid #12233e; margin:24px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">Russell<span>Capital</span></div>
      <h1>Stale Client Digest</h1>
      <div class="alert-badge">${opts.staleClients.length} client${opts.staleClients.length === 1 ? "" : "s"} need attention</div>
      <p>The following clients in <strong style="color:#ffffff">${opts.workspaceName}</strong> have not been contacted in <strong style="color:#ffffff">${opts.staleDays}+ days</strong>. Consider scheduling follow-ups to maintain engagement.</p>
      <table>
        <thead><tr>
          <th>Client</th><th>Email</th><th>Last Contact</th><th>Days</th>
        </tr></thead>
        <tbody>${clientRows}</tbody>
      </table>
      ${opts.staleClients.length > 25 ? `<p style="font-size:13px;color:#3d5a7a">Showing top 25 of ${opts.staleClients.length} stale clients.</p>` : ""}
      <hr class="divider" />
      <p style="font-size:13px">This digest is generated weekly. Log into Russell Capital Systems™ to review and take action on these clients.</p>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} Russell Capital Systems™ · AI Wealth OS<br/>
      <a href="mailto:support@russellcapitalsystems.com" style="color:#3d5a7a">support@russellcapitalsystems.com</a>
    </div>
  </div>
</body>
</html>`;

  const text = `Stale Client Digest — ${opts.workspaceName}

${opts.staleClients.length} client(s) have not been contacted in ${opts.staleDays}+ days:

${textRows}
${opts.staleClients.length > 25 ? `\n(Showing top 25 of ${opts.staleClients.length} stale clients)\n` : ""}
Log into Russell Capital Systems™ to review and take action on these clients.`;

  if (!resend) {
    emailStatus("resend_api_key_not_set", false);
    emailStatus("to", false);
    emailStatus("stale_clients", false);
    return { sent: false, reason: "RESEND_API_KEY not configured — digest logged to server console", clientCount: opts.staleClients.length };
  }

  try {
    const { error } = await resend.emails.send({
      from: "Russell Capital Systems™ <digest@russellcapitalsystems.com>",
      to: opts.toEmail,
      subject: `[Action Required] ${opts.staleClients.length} client${opts.staleClients.length === 1 ? "" : "s"} need follow-up — ${opts.workspaceName}`,
      html: sanitizeEmailHtml(html),
      text,
    });

    if (error) {
      emailStatus("resend_error", false);
      return { sent: false, reason: "Email delivery failed", clientCount: opts.staleClients.length };
    }

    emailStatus("stale_digest_sent_to", true);
    return { sent: true, clientCount: opts.staleClients.length };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    emailStatus("failed_to_send_stale_digest", false);
    return { sent: false, reason: "Email delivery failed", clientCount: opts.staleClients.length };
  }
}


// ─── Scheduled Client Report Email ──────────────────────────────────────────

export interface ReportEmailOptions {
  toEmail: string;
  toName?: string;
  clientName: string;
  workspaceName: string;
  pdfBuffer: Buffer;
}

/**
 * Sends a client performance report PDF as an email attachment.
 */
export async function sendClientReportEmail(opts: ReportEmailOptions): Promise<{ sent: boolean; reason?: string }> {
  const resend = getResend();

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Performance Report — ${opts.clientName}</title>
  <style>
    body { margin:0; padding:0; background:#060f1e; font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif; color:#c8d8ec; }
    .container { max-width:560px; margin:40px auto; padding:0 20px; }
    .card { background:#0b1628; border:1px solid #12233e; border-radius:16px; padding:40px; }
    .logo { font-size:22px; font-weight:800; color:#ffffff; letter-spacing:-0.5px; margin-bottom:32px; }
    .logo span { color:#4f8cff; }
    h1 { font-size:22px; font-weight:700; color:#ffffff; margin:0 0 12px; }
    p { font-size:15px; line-height:1.6; color:#7a95b8; margin:0 0 16px; }
    .footer { font-size:12px; color:#3d5a7a; margin-top:32px; text-align:center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">Russell<span>Capital</span></div>
      <h1>Performance Report</h1>
      <p>Hello${opts.toName ? ` ${opts.toName}` : ""},</p>
      <p>Please find attached the latest performance report for <strong style="color:#ffffff">${opts.clientName}</strong>, prepared by <strong style="color:#ffffff">${opts.workspaceName}</strong>.</p>
      <p>This report includes a financial profile summary, projections, strategy history, and recent activity notes.</p>
      <p style="font-size:13px;color:#3d5a7a">This report was auto-generated by Russell Capital Systems™. If you have questions, please contact your advisor.</p>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} Russell Capital Systems™ · AI Wealth OS<br/>
      <a href="mailto:support@russellcapitalsystems.com" style="color:#3d5a7a">support@russellcapitalsystems.com</a>
    </div>
  </div>
</body>
</html>`;

  const text = `Performance Report — ${opts.clientName}

Hello${opts.toName ? ` ${opts.toName}` : ""},

Please find attached the latest performance report for ${opts.clientName}, prepared by ${opts.workspaceName}.

This report was auto-generated by Russell Capital Systems™.`;

  if (!resend) {
    emailStatus("resend_api_key_not_set", false);
    emailStatus("to", false);
    emailStatus("client", false);
    emailStatus("pdf_size", false);
    return { sent: false, reason: "RESEND_API_KEY not configured" };
  }

  try {
    const { error } = await resend.emails.send({
      from: "Russell Capital Systems™ <reports@russellcapitalsystems.com>",
      to: opts.toEmail,
      subject: `Performance Report — ${opts.clientName} | ${opts.workspaceName}`,
      html: sanitizeEmailHtml(html),
      text,
      attachments: [{
        filename: `${opts.clientName.replace(/[^a-zA-Z0-9]/g, "_")}_Report_${new Date().toISOString().slice(0, 10)}.pdf`,
        content: opts.pdfBuffer,
      }],
    });

    if (error) {
      emailStatus("resend_error", false);
      return { sent: false, reason: "Email delivery failed" };
    }

    emailStatus("report_sent_to", true);
    return { sent: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    emailStatus("failed_to_send_report", false);
    return { sent: false, reason: "Email delivery failed" };
  }
}


// ─── Meeting Reminder Email ─────────────────────────────────────────────────

export interface MeetingReminderOptions {
  toEmail: string;
  toName?: string;
  clientName: string;
  meetingTitle: string;
  scheduledAt: Date;
  durationMin: number;
  location?: string | null;
  meetingType: string;
  advisorName?: string;
  workspaceName: string;
}

/**
 * Sends a meeting reminder email 24 hours before the scheduled meeting.
 */
export async function sendMeetingReminder(opts: MeetingReminderOptions): Promise<{ sent: boolean; reason?: string }> {
  const resend = getResend();

  const dateStr = opts.scheduledAt.toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  const timeStr = opts.scheduledAt.toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit", hour12: true,
  });

  const typeLabel = opts.meetingType === "IN_PERSON" ? "In-Person" :
    opts.meetingType === "VIDEO" ? "Video Call" :
    opts.meetingType === "PHONE" ? "Phone Call" : opts.meetingType;

  const locationLine = opts.location ? `<p style="font-size:14px;color:#7a95b8">📍 <strong style="color:#c8d8ec">${opts.location}</strong></p>` : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Meeting Reminder — ${opts.meetingTitle}</title>
  <style>
    body { margin:0; padding:0; background:#060f1e; font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif; color:#c8d8ec; }
    .container { max-width:560px; margin:40px auto; padding:0 20px; }
    .card { background:#0b1628; border:1px solid #12233e; border-radius:16px; padding:40px; }
    .logo { font-size:22px; font-weight:800; color:#ffffff; letter-spacing:-0.5px; margin-bottom:32px; }
    .logo span { color:#4f8cff; }
    h1 { font-size:22px; font-weight:700; color:#ffffff; margin:0 0 12px; }
    p { font-size:15px; line-height:1.6; color:#7a95b8; margin:0 0 16px; }
    .detail-box { background:#060f1e; border:1px solid #12233e; border-radius:12px; padding:20px; margin:20px 0; }
    .detail-row { display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid #12233e; }
    .detail-row:last-child { border-bottom:none; }
    .detail-label { font-size:13px; color:#3d5a7a; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; }
    .detail-value { font-size:14px; color:#ffffff; font-weight:500; }
    .reminder-badge { display:inline-block; background:#f59e0b1a; border:1px solid #f59e0b33; color:#f59e0b; font-size:13px; font-weight:600; padding:4px 14px; border-radius:20px; margin-bottom:20px; }
    .footer { font-size:12px; color:#3d5a7a; margin-top:32px; text-align:center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">Russell<span>Capital</span></div>
      <div class="reminder-badge">⏰ 24-Hour Reminder</div>
      <h1>${opts.meetingTitle}</h1>
      <p>This is a reminder that you have a meeting scheduled with <strong style="color:#ffffff">${opts.clientName}</strong> tomorrow.</p>
      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">Date</span><span class="detail-value">${dateStr}</span></div>
        <div class="detail-row"><span class="detail-label">Time</span><span class="detail-value">${timeStr}</span></div>
        <div class="detail-row"><span class="detail-label">Duration</span><span class="detail-value">${opts.durationMin} minutes</span></div>
        <div class="detail-row"><span class="detail-label">Type</span><span class="detail-value">${typeLabel}</span></div>
        ${opts.location ? `<div class="detail-row"><span class="detail-label">Location</span><span class="detail-value">${opts.location}</span></div>` : ""}
      </div>
      ${locationLine}
      <p style="font-size:13px;color:#3d5a7a">Log into Russell Capital Systems™ to review client details and prepare for your meeting.</p>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} Russell Capital Systems™ · AI Wealth OS<br/>
      <a href="mailto:support@russellcapitalsystems.com" style="color:#3d5a7a">support@russellcapitalsystems.com</a>
    </div>
  </div>
</body>
</html>`;

  const text = `Meeting Reminder — ${opts.meetingTitle}

You have a meeting scheduled with ${opts.clientName} tomorrow.

Date: ${dateStr}
Time: ${timeStr}
Duration: ${opts.durationMin} minutes
Type: ${typeLabel}
${opts.location ? `Location: ${opts.location}` : ""}

Log into Russell Capital Systems™ to review client details and prepare for your meeting.`;

  if (!resend) {
    emailStatus("resend_api_key_not_set", false);
    emailStatus("to", false);
    emailStatus("meeting", false);
    return { sent: false, reason: "RESEND_API_KEY not configured" };
  }

  try {
    const { error } = await resend.emails.send({
      from: "Russell Capital Systems™ <reminders@russellcapitalsystems.com>",
      to: opts.toEmail,
      subject: `⏰ Meeting Tomorrow: ${opts.meetingTitle} with ${opts.clientName}`,
      html: sanitizeEmailHtml(html),
      text,
    });

    if (error) {
      emailStatus("resend_error", false);
      return { sent: false, reason: "Email delivery failed" };
    }

    emailStatus("meeting_reminder_sent_to", true);
    return { sent: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    emailStatus("failed_to_send_meeting_reminder", false);
    return { sent: false, reason: "Email delivery failed" };
  }
}


// ═══════════════════════════════════════════════════════════════════════════
// ─── WEEKLY LEADERBOARD DIGEST EMAIL ────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

export interface LeaderboardDigestEntry {
  rank: number;
  name: string;
  email: string | null;
  score: number;
  aumManaged: number;
  dealsWon: number;
  closedValue: number;
  meetingsHeld: number;
  clientCount: number;
}

export interface LeaderboardDigestOptions {
  toEmail: string;
  toName?: string;
  workspaceName: string;
  period: string;
  entries: LeaderboardDigestEntry[];
  generatedAt: Date;
}

function fmtMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export async function sendLeaderboardDigest(opts: LeaderboardDigestOptions): Promise<{ sent: boolean; reason?: string }> {
  const resend = getResend();

  const dateStr = opts.generatedAt.toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const medalEmojis = ["🥇", "🥈", "🥉"];

  const tableRows = opts.entries.map((e, i) => {
    const medal = i < 3 ? medalEmojis[i] : `${e.rank}`;
    const bgColor = i % 2 === 0 ? "#0f1e35" : "#0b1628";
    return `
      <tr style="background:${bgColor}">
        <td style="padding:10px 14px;text-align:center;font-size:16px">${medal}</td>
        <td style="padding:10px 14px;color:#ffffff;font-weight:600">${e.name}</td>
        <td style="padding:10px 14px;color:#c8d8ec;text-align:right">${e.score}</td>
        <td style="padding:10px 14px;color:#c8d8ec;text-align:right">${fmtMoney(e.aumManaged)}</td>
        <td style="padding:10px 14px;color:#c8d8ec;text-align:center">${e.dealsWon}</td>
        <td style="padding:10px 14px;color:#c8d8ec;text-align:right">${fmtMoney(e.closedValue)}</td>
        <td style="padding:10px 14px;color:#c8d8ec;text-align:center">${e.meetingsHeld}</td>
        <td style="padding:10px 14px;color:#c8d8ec;text-align:center">${e.clientCount}</td>
      </tr>`;
  }).join("");

  const totalAum = opts.entries.reduce((s, e) => s + e.aumManaged, 0);
  const totalClosed = opts.entries.reduce((s, e) => s + e.closedValue, 0);
  const totalDeals = opts.entries.reduce((s, e) => s + e.dealsWon, 0);

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#060e1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:700px;margin:0 auto;padding:24px">
    <tr><td>
      <div style="background:linear-gradient(135deg,#0b1628 0%,#12233e 100%);border-radius:16px;border:1px solid #1a3050;overflow:hidden">
        <!-- Header -->
        <div style="padding:28px 32px;border-bottom:1px solid #1a3050;background:linear-gradient(90deg,#0b1628,#162a4a)">
          <div style="font-size:20px;font-weight:700;color:#ffffff;margin-bottom:4px">📊 Weekly Leaderboard Digest</div>
          <div style="font-size:13px;color:#7a95b8">${opts.workspaceName} — ${dateStr}</div>
        </div>

        <!-- Summary stats -->
        <div style="padding:20px 32px;display:flex;gap:16px;border-bottom:1px solid #1a3050">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="padding:12px;background:#0f1e35;border-radius:8px;text-align:center;width:33%">
              <div style="font-size:11px;color:#7a95b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Total AUM</div>
              <div style="font-size:18px;font-weight:700;color:#4f8cff">${fmtMoney(totalAum)}</div>
            </td>
            <td style="width:12px"></td>
            <td style="padding:12px;background:#0f1e35;border-radius:8px;text-align:center;width:33%">
              <div style="font-size:11px;color:#7a95b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Deals Won</div>
              <div style="font-size:18px;font-weight:700;color:#22c55e">${totalDeals}</div>
            </td>
            <td style="width:12px"></td>
            <td style="padding:12px;background:#0f1e35;border-radius:8px;text-align:center;width:33%">
              <div style="font-size:11px;color:#7a95b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Closed Value</div>
              <div style="font-size:18px;font-weight:700;color:#f0c040">${fmtMoney(totalClosed)}</div>
            </td>
          </tr></table>
        </div>

        <!-- Leaderboard table -->
        <div style="padding:20px 32px">
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-radius:8px;overflow:hidden">
            <thead>
              <tr style="background:#162a4a">
                <th style="padding:10px 14px;text-align:center;font-size:11px;color:#7a95b8;text-transform:uppercase;letter-spacing:1px">#</th>
                <th style="padding:10px 14px;text-align:left;font-size:11px;color:#7a95b8;text-transform:uppercase;letter-spacing:1px">Advisor</th>
                <th style="padding:10px 14px;text-align:right;font-size:11px;color:#7a95b8;text-transform:uppercase;letter-spacing:1px">Score</th>
                <th style="padding:10px 14px;text-align:right;font-size:11px;color:#7a95b8;text-transform:uppercase;letter-spacing:1px">AUM</th>
                <th style="padding:10px 14px;text-align:center;font-size:11px;color:#7a95b8;text-transform:uppercase;letter-spacing:1px">Deals</th>
                <th style="padding:10px 14px;text-align:right;font-size:11px;color:#7a95b8;text-transform:uppercase;letter-spacing:1px">Closed $</th>
                <th style="padding:10px 14px;text-align:center;font-size:11px;color:#7a95b8;text-transform:uppercase;letter-spacing:1px">Meetings</th>
                <th style="padding:10px 14px;text-align:center;font-size:11px;color:#7a95b8;text-transform:uppercase;letter-spacing:1px">Clients</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </div>

        <!-- Footer -->
        <div style="padding:20px 32px;border-top:1px solid #1a3050;text-align:center">
          <div style="font-size:12px;color:#7a95b8">This is an automated weekly digest from ${opts.workspaceName}.</div>
          <div style="font-size:11px;color:#4a6a8a;margin-top:4px">Russell Capital Systems™</div>
        </div>
      </div>
    </td></tr>
  </table>
</body>
</html>`;

  if (!resend) {
    emailStatus("leaderboard_digest", false);
    return { sent: false, reason: "RESEND_API_KEY not configured" };
  }

  try {
    await resend.emails.send({
      from: "Russell Capital Systems™ <leaderboard@russellcapitalsystems.com>",
      to: opts.toEmail,
      subject: `📊 Weekly Leaderboard — ${opts.workspaceName} (${dateStr})`,
      html: sanitizeEmailHtml(html),
    });
    return { sent: true };
  } catch (e: any) {
    emailStatus("leaderboard_digest_error", false);
    return { sent: false, reason: e.message ?? "Send failed" };
  }
}


// ═══════════════════════════════════════════════════════════════════════════
// ─── STRATEGY SAVED NOTIFICATION EMAIL ──────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

export interface StrategyNotificationOptions {
  toEmail: string;
  toName?: string;
  clientName: string;
  advisorName: string;
  strategyLabel: string;
  carrierName?: string;
  portalUrl: string;
  summary: {
    iulNetCash?: number;
    propertyEquity?: number;
    rentalIncome?: number;
    rothBalance?: number;
    netWorth?: number;
  };
  notes?: string;
}

function fmtDollar(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${Math.round(n).toLocaleString()}`;
}

/**
 * Sends a notification email to a client when their advisor saves a new strategy.
 * Includes a summary of key metrics and a link to the client portal.
 */
export async function sendStrategyNotification(opts: StrategyNotificationOptions): Promise<{ sent: boolean; reason?: string }> {
  const resend = getResend();

  const metricsRows = [
    opts.summary.iulNetCash != null ? { label: "IUL Net Cash Value", value: fmtDollar(opts.summary.iulNetCash), color: "#22c55e" } : null,
    opts.summary.propertyEquity != null ? { label: "Real Estate Equity", value: fmtDollar(opts.summary.propertyEquity), color: "#3b82f6" } : null,
    opts.summary.rentalIncome != null ? { label: "Total Rental Income", value: fmtDollar(opts.summary.rentalIncome), color: "#f59e0b" } : null,
    opts.summary.rothBalance != null ? { label: "Roth Balance", value: fmtDollar(opts.summary.rothBalance), color: "#a855f7" } : null,
    opts.summary.netWorth != null ? { label: "Estimated Net Worth", value: fmtDollar(opts.summary.netWorth), color: "#ffffff" } : null,
  ].filter(Boolean) as { label: string; value: string; color: string }[];

  const metricsHtml = metricsRows.map(r =>
    `<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #12233e">
      <span style="font-size:14px;color:#7a95b8">${r.label}</span>
      <span style="font-size:14px;font-weight:700;color:${r.color}">${r.value}</span>
    </div>`
  ).join("");

  const metricsText = metricsRows.map(r => `  ${r.label}: ${r.value}`).join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Strategy Analysis — ${opts.strategyLabel}</title>
  <style>
    body { margin:0; padding:0; background:#060f1e; font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif; color:#c8d8ec; }
    .container { max-width:560px; margin:40px auto; padding:0 20px; }
    .card { background:#0b1628; border:1px solid #12233e; border-radius:16px; padding:40px; }
    .logo { font-size:22px; font-weight:800; color:#ffffff; letter-spacing:-0.5px; margin-bottom:32px; }
    .logo span { color:#4f8cff; }
    h1 { font-size:22px; font-weight:700; color:#ffffff; margin:0 0 12px; }
    p { font-size:15px; line-height:1.6; color:#7a95b8; margin:0 0 16px; }
    .strategy-badge { display:inline-block; background:#22c55e1a; border:1px solid #22c55e33; color:#22c55e; font-size:13px; font-weight:600; padding:5px 16px; border-radius:20px; margin-bottom:20px; }
    .carrier-badge { display:inline-block; background:#3b82f61a; border:1px solid #3b82f633; color:#3b82f6; font-size:12px; font-weight:600; padding:3px 12px; border-radius:16px; margin-left:8px; }
    .metrics-box { background:#060f1e; border:1px solid #12233e; border-radius:12px; padding:16px 20px; margin:20px 0; }
    .cta { display:block; background:#22c55e; color:#ffffff !important; text-decoration:none; font-weight:700; font-size:15px; text-align:center; padding:14px 28px; border-radius:10px; margin:28px 0; }
    .cta:hover { background:#16a34a; }
    .notes-box { background:#f59e0b0d; border:1px solid #f59e0b33; border-radius:10px; padding:14px 18px; margin:16px 0; }
    .footer { font-size:12px; color:#3d5a7a; margin-top:32px; text-align:center; }
    .divider { border:none; border-top:1px solid #12233e; margin:24px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">Russell<span>Capital</span></div>
      <h1>New Strategy Analysis</h1>
      <div class="strategy-badge">${opts.strategyLabel}</div>
      ${opts.carrierName ? `<span class="carrier-badge">${opts.carrierName}</span>` : ""}
      <p>Hello${opts.toName ? ` ${opts.toName}` : ""},</p>
      <p>Your advisor <strong style="color:#ffffff">${opts.advisorName}</strong> has prepared a new financial strategy analysis for you. Here's a summary of the projected outcomes:</p>
      <div class="metrics-box">
        ${metricsHtml}
      </div>
      ${opts.notes ? `<div class="notes-box"><div style="font-size:12px;color:#f59e0b;font-weight:600;margin-bottom:6px">Advisor Notes</div><p style="font-size:14px;color:#c8d8ec;margin:0">${opts.notes}</p></div>` : ""}
      <a href="${opts.portalUrl}" class="cta">View Full Analysis →</a>
      <p style="font-size:13px">Or copy this link into your browser:</p>
      <div style="background:#060f1e;border:1px solid #12233e;border-radius:8px;padding:12px 16px;font-size:12px;color:#7a95b8;word-break:break-all;margin-bottom:24px">${opts.portalUrl}</div>
      <hr class="divider" />
      <p style="font-size:13px">This analysis was prepared using Russell Capital Systems™' financial modeling tools. For questions, please contact your advisor directly.</p>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} Russell Capital Systems™ · AI Wealth OS<br/>
      <a href="mailto:support@russellcapitalsystems.com" style="color:#3d5a7a">support@russellcapitalsystems.com</a>
    </div>
  </div>
</body>
</html>`;

  const text = `New Strategy Analysis — ${opts.strategyLabel}

Hello${opts.toName ? ` ${opts.toName}` : ""},

Your advisor ${opts.advisorName} has prepared a new financial strategy analysis for you.

Strategy: ${opts.strategyLabel}${opts.carrierName ? ` (${opts.carrierName})` : ""}

Projected Outcomes:
${metricsText}
${opts.notes ? `\nAdvisor Notes: ${opts.notes}` : ""}

View your full analysis here:
${opts.portalUrl}

This analysis was prepared using Russell Capital Systems™' financial modeling tools.`;

  if (!resend) {
    emailStatus("resend_api_key_not_set", false);
    emailStatus("to", false);
    emailStatus("strategy", false);
    emailStatus("portal_url", false);
    return { sent: false, reason: "RESEND_API_KEY not configured — notification logged to server console" };
  }

  try {
    const { error } = await resend.emails.send({
      from: "Russell Capital Systems™ <strategies@russellcapitalsystems.com>",
      to: opts.toEmail,
      subject: `New Strategy Analysis: ${opts.strategyLabel} — from ${opts.advisorName}`,
      html: sanitizeEmailHtml(html),
      text,
    });

    if (error) {
      emailStatus("resend_error", false);
      return { sent: false, reason: "Email delivery failed" };
    }

    emailStatus("strategy_notification_sent_to", true);
    return { sent: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    emailStatus("failed_to_send_strategy_notification", false);
    return { sent: false, reason: "Email delivery failed" };
  }
}


// ── Follow-Up Email for Shared Projections ──
export interface FollowUpEmailOptions {
  toEmail: string;
  toName?: string;
  advisorName: string;
  shareUrl: string;
  emailType: "3day" | "7day";
  projectionSummary?: string;
}

export async function sendProjectionFollowUp(opts: FollowUpEmailOptions): Promise<{ sent: boolean; reason?: string }> {
  const resend = getResend();

  const isReminder = opts.emailType === "7day";
  const subject = isReminder
    ? `Reminder: Your Financial Strategy Analysis is Ready — Russell Capital Systems™`
    : `Your Financial Strategy Analysis — Russell Capital Systems™`;
  const headline = isReminder ? "Friendly Reminder" : "Your Strategy Analysis is Ready";
  const bodyText = isReminder
    ? `Just a quick reminder — your personalized financial strategy analysis from <strong style="color:#ffffff">${opts.advisorName}</strong> is still available for review. Don't miss the opportunity to explore your projected outcomes.`
    : `Your advisor <strong style="color:#ffffff">${opts.advisorName}</strong> recently shared a personalized financial strategy analysis with you. Take a moment to review your projected outcomes and see how this strategy could work for you.`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
  <style>
    body { margin:0; padding:0; background:#060f1e; font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif; color:#c8d8ec; }
    .container { max-width:560px; margin:40px auto; padding:0 20px; }
    .card { background:#0b1628; border:1px solid #12233e; border-radius:16px; padding:40px; }
    .logo { font-size:22px; font-weight:800; color:#ffffff; letter-spacing:-0.5px; margin-bottom:32px; }
    .logo span { color:#4f8cff; }
    h1 { font-size:22px; font-weight:700; color:#ffffff; margin:0 0 12px; }
    p { font-size:15px; line-height:1.6; color:#7a95b8; margin:0 0 16px; }
    .cta { display:block; background:#22c55e; color:#ffffff !important; text-decoration:none; font-weight:700; font-size:15px; text-align:center; padding:14px 28px; border-radius:10px; margin:28px 0; }
    .cta:hover { background:#16a34a; }
    .book-cta { display:block; background:transparent; border:1px solid #3b82f6; color:#3b82f6 !important; text-decoration:none; font-weight:700; font-size:14px; text-align:center; padding:12px 24px; border-radius:10px; margin:12px 0; }
    .footer { font-size:12px; color:#3d5a7a; margin-top:32px; text-align:center; }
    .divider { border:none; border-top:1px solid #12233e; margin:24px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">Russell<span>Capital</span></div>
      <h1>${headline}</h1>
      <p>Hello${opts.toName ? ` ${opts.toName}` : ""},</p>
      <p>${bodyText}</p>
      ${opts.projectionSummary ? `<div style="background:#060f1e;border:1px solid #12233e;border-radius:12px;padding:16px 20px;margin:20px 0;font-size:14px;color:#c8d8ec">${opts.projectionSummary}</div>` : ""}
      <a href="${opts.shareUrl}" class="cta">View Your Strategy Analysis →</a>
      <hr class="divider" />
      <p style="font-size:14px;color:#ffffff;font-weight:600">Ready to discuss your options?</p>
      <p style="font-size:13px">Schedule a consultation with ${opts.advisorName} to walk through the analysis and answer any questions.</p>
      <a href="${opts.shareUrl.split('/shared/')[0]}/book" class="book-cta">Book a Consultation →</a>
      <hr class="divider" />
      <p style="font-size:12px;color:#3d5a7a">This link will expire in 30 days from the original share date. If you have any questions, please reach out to your advisor directly.</p>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} Russell Capital Systems™ · AI Wealth OS<br/>
      <a href="mailto:support@russellcapitalsystems.com" style="color:#3d5a7a">support@russellcapitalsystems.com</a>
    </div>
  </div>
</body>
</html>`;

  const text = `${headline}

Hello${opts.toName ? ` ${opts.toName}` : ""},

${isReminder ? `Just a quick reminder — your personalized financial strategy analysis from ${opts.advisorName} is still available for review.` : `Your advisor ${opts.advisorName} recently shared a personalized financial strategy analysis with you.`}

View your analysis: ${opts.shareUrl}

Ready to discuss? Book a consultation with ${opts.advisorName}.

This link will expire in 30 days from the original share date.

© ${new Date().getFullYear()} Russell Capital Systems™`;

  if (!resend) {
    emailStatus("resend_api_key_not_set", false);
    emailStatus("to", false);
    emailStatus("share_url", false);
    return { sent: false, reason: "RESEND_API_KEY not configured" };
  }

  try {
    const { error } = await resend.emails.send({
      from: "Russell Capital Systems™ <strategies@russellcapitalsystems.com>",
      to: opts.toEmail,
      subject,
      html: sanitizeEmailHtml(html),
      text,
    });
    if (error) {
      emailStatus("resend_error", false);
      return { sent: false, reason: "Email delivery failed" };
    }
    emailStatus("follow-up", true);
    return { sent: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    emailStatus("failed_to_send_follow-up", false);
    return { sent: false, reason: "Email delivery failed" };
  }
}

// ── Carrier Quote Request Notification ──
export interface QuoteRequestNotificationOptions {
  toEmail: string;
  advisorName: string;
  clientName: string;
  carrierName: string;
  productName: string;
  formSummary: string;
  quoteRequestId: number;
}

export async function sendQuoteRequestNotification(opts: QuoteRequestNotificationOptions): Promise<{ sent: boolean; reason?: string }> {
  const resend = getResend();

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Quote Request Submitted — ${opts.carrierName}</title>
  <style>
    body { margin:0; padding:0; background:#060f1e; font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif; color:#c8d8ec; }
    .container { max-width:560px; margin:40px auto; padding:0 20px; }
    .card { background:#0b1628; border:1px solid #12233e; border-radius:16px; padding:40px; }
    .logo { font-size:22px; font-weight:800; color:#ffffff; letter-spacing:-0.5px; margin-bottom:32px; }
    .logo span { color:#4f8cff; }
    h1 { font-size:22px; font-weight:700; color:#ffffff; margin:0 0 12px; }
    p { font-size:15px; line-height:1.6; color:#7a95b8; margin:0 0 16px; }
    .detail-box { background:#060f1e; border:1px solid #12233e; border-radius:12px; padding:16px 20px; margin:20px 0; }
    .detail-row { display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #12233e; }
    .detail-label { font-size:13px; color:#7a95b8; }
    .detail-value { font-size:13px; font-weight:600; color:#ffffff; }
    .footer { font-size:12px; color:#3d5a7a; margin-top:32px; text-align:center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">Russell<span>Capital</span></div>
      <h1>Quote Request Submitted</h1>
      <p>A formal quote request has been submitted for <strong style="color:#ffffff">${opts.clientName}</strong>.</p>
      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">Carrier</span><span class="detail-value">${opts.carrierName}</span></div>
        <div class="detail-row"><span class="detail-label">Product</span><span class="detail-value">${opts.productName}</span></div>
        <div class="detail-row"><span class="detail-label">Client</span><span class="detail-value">${opts.clientName}</span></div>
        <div class="detail-row"><span class="detail-label">Advisor</span><span class="detail-value">${opts.advisorName}</span></div>
        <div class="detail-row" style="border:none"><span class="detail-label">Request ID</span><span class="detail-value">#${opts.quoteRequestId}</span></div>
      </div>
      <p style="font-size:13px">${opts.formSummary}</p>
      <p style="font-size:13px;color:#3d5a7a">This is an automated notification. The quote request is now pending review.</p>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} Russell Capital Systems™ · AI Wealth OS<br/>
      <a href="mailto:support@russellcapitalsystems.com" style="color:#3d5a7a">support@russellcapitalsystems.com</a>
    </div>
  </div>
</body>
</html>`;

  const text = `Quote Request Submitted — ${opts.carrierName}

Client: ${opts.clientName}
Carrier: ${opts.carrierName}
Product: ${opts.productName}
Advisor: ${opts.advisorName}
Request ID: #${opts.quoteRequestId}

${opts.formSummary}

© ${new Date().getFullYear()} Russell Capital Systems™`;

  if (!resend) {
    emailStatus("resend_api_key_not_set", false);
    emailStatus("to", false);
    emailStatus("carrier", false);
    return { sent: false, reason: "RESEND_API_KEY not configured" };
  }

  try {
    const { error } = await resend.emails.send({
      from: "Russell Capital Systems™ <quotes@russellcapitalsystems.com>",
      to: opts.toEmail,
      subject: `Quote Request: ${opts.carrierName} — ${opts.clientName}`,
      html: sanitizeEmailHtml(html),
      text,
    });
    if (error) {
      emailStatus("resend_error", false);
      return { sent: false, reason: "Email delivery failed" };
    }
    emailStatus("quote_request_notification_sent_to", true);
    return { sent: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    emailStatus("failed_to_send_quote_request_notification", false);
    return { sent: false, reason: "Email delivery failed" };
  }
}


// ── Encouraging Email System ──

export interface EncouragingEmailOptions {
  toEmail: string;
  clientName: string;
  currentScore: number;
  currentLevel: number;
  levelName: string;
  levelEmoji: string;
  nextLevelName: string;
  nextLevelEmoji: string;
  pointsToNextLevel: number;
  topGoal?: string;
  topRecommendation?: string;
  weeklyTip: string;
  streakDays?: number;
}

const WEEKLY_TIPS = [
  "Review your monthly expenses and identify one area where you can save an extra $200/month. That's $2,400/year working for your future!",
  "Consider maximizing your employer 401(k) match — it's literally free money. Even a 1% increase compounds dramatically over time.",
  "Have you reviewed your insurance coverage lately? Life changes (marriage, kids, home purchase) often mean your coverage needs updating.",
  "Set up automatic transfers to your savings account on payday. What you don't see, you won't spend!",
  "Review your tax withholdings — are you getting a large refund? That money could be working for you throughout the year instead.",
  "Consider a Roth conversion while tax rates are historically low. Future you will thank present you!",
  "Estate planning isn't just for the wealthy. A basic will and beneficiary review protects your family at any asset level.",
  "Track your net worth monthly. Watching it grow is one of the most motivating financial habits you can build.",
  "Diversification isn't just stocks vs bonds — consider real estate, IUL, and alternative investments for true portfolio resilience.",
  "Review your credit report annually at annualcreditreport.com. Errors happen more often than you'd think!",
];

export async function sendEncouragingEmail(opts: EncouragingEmailOptions): Promise<{ sent: boolean; reason?: string }> {
  const resend = getResend();

  const progressPct = Math.min(100, Math.round((opts.currentScore / (opts.currentScore + opts.pointsToNextLevel)) * 100));

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Financial Journey Update</title>
  <style>
    body { margin: 0; padding: 0; background: #060f1e; font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; color: #c8d8ec; }
    .container { max-width: 560px; margin: 40px auto; padding: 0 20px; }
    .card { background: #0b1628; border: 1px solid #12233e; border-radius: 16px; padding: 40px; }
    .logo { font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; margin-bottom: 8px; }
    .badge { font-size: 48px; text-align: center; margin: 20px 0; }
    .score-bar { background: #1a2744; border-radius: 12px; height: 24px; overflow: hidden; margin: 16px 0; }
    .score-fill { background: linear-gradient(90deg, #10b981, #06d6a0); height: 100%; border-radius: 12px; transition: width 0.5s; }
    .tip-box { background: #0d1f3a; border: 1px solid #1a3a5c; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .cta { display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: #ffffff; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 15px; margin-top: 24px; }
    .footer { text-align: center; color: #4a6a8a; font-size: 12px; margin-top: 32px; }
    h2 { color: #ffffff; margin: 0 0 8px; }
    p { line-height: 1.6; margin: 8px 0; }
    .highlight { color: #10b981; font-weight: 700; }
    .level-up { background: linear-gradient(135deg, #fbbf24, #f59e0b); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 800; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">Russell Capital Systems™</div>
      <p style="color: #6b8ab5; font-size: 13px; margin-bottom: 24px;">Your Weekly Financial Journey Update</p>

      <h2>Hey ${opts.clientName}! ${opts.levelEmoji}</h2>
      <p>You're doing great on your financial journey! Here's your progress update:</p>

      <div class="badge">${opts.levelEmoji}</div>

      <div style="text-align: center;">
        <p style="font-size: 14px; color: #6b8ab5;">Current Level</p>
        <p style="font-size: 20px; font-weight: 800; color: #ffffff;">${opts.levelName}</p>
        <p style="font-size: 36px; font-weight: 800; color: #10b981;">${opts.currentScore}<span style="font-size: 16px; color: #6b8ab5;">/100</span></p>
      </div>

      <div class="score-bar">
        <div class="score-fill" style="width: ${progressPct}%;"></div>
      </div>
      <p style="text-align: center; font-size: 13px; color: #6b8ab5;">
        Only <span class="highlight">${opts.pointsToNextLevel} points</span> to reach ${opts.nextLevelEmoji} <span class="level-up">${opts.nextLevelName}</span>!
      </p>

      ${opts.topGoal ? `
      <div class="tip-box">
        <p style="font-size: 13px; color: #fbbf24; font-weight: 700; margin-bottom: 8px;">🎯 YOUR TOP GOAL</p>
        <p style="color: #ffffff; font-weight: 600;">${opts.topGoal}</p>
        <p style="font-size: 13px;">Stay focused — every smart decision brings you closer!</p>
      </div>` : ""}

      ${opts.topRecommendation ? `
      <div class="tip-box">
        <p style="font-size: 13px; color: #10b981; font-weight: 700; margin-bottom: 8px;">💡 RECOMMENDED ACTION</p>
        <p style="color: #ffffff; font-weight: 600;">${opts.topRecommendation}</p>
        <p style="font-size: 13px;">This could boost your score by <span class="highlight">+5 points</span> or more!</p>
      </div>` : ""}

      <div class="tip-box">
        <p style="font-size: 13px; color: #818cf8; font-weight: 700; margin-bottom: 8px;">📚 WEEKLY TIP</p>
        <p>${opts.weeklyTip}</p>
      </div>

      ${opts.streakDays ? `<p style="text-align: center; font-size: 14px;">🔥 <strong>${opts.streakDays}-day streak!</strong> Keep the momentum going!</p>` : ""}

      <div style="text-align: center;">
        <a href="https://www.RussellCapitalSystems.com/portal" class="cta">View Your Dashboard →</a>
      </div>

      <p style="text-align: center; font-size: 13px; color: #6b8ab5; margin-top: 24px;">
        "The best time to plant a tree was 20 years ago. The second best time is now."
      </p>
    </div>
    <div class="footer">
      <p>Russell Capital Systems™ — Building Your Financial Future</p>
      <p>You're receiving this because you signed up for financial planning updates.</p>
    </div>
  </div>
</body>
</html>`;

  const text = `Hey ${opts.clientName}! ${opts.levelEmoji}\n\nYour Financial Score: ${opts.currentScore}/100 (${opts.levelName})\nOnly ${opts.pointsToNextLevel} points to ${opts.nextLevelName}!\n\nWeekly Tip: ${opts.weeklyTip}\n\nVisit your dashboard: https://www.RussellCapitalSystems.com/portal`;

  if (!resend) {
    emailStatus("resend_api_key_not_set", false);
    emailStatus("to", false);
    return { sent: false, reason: "RESEND_API_KEY not configured" };
  }

  try {
    await resend.emails.send({
      from: "Russell Capital Systems™ <coach@updates.russellcapitalsystems.com>",
      to: opts.toEmail,
      subject: `${opts.levelEmoji} Your Financial Score: ${opts.currentScore}/100 — ${opts.pointsToNextLevel} pts to ${opts.nextLevelName}!`,
      html: sanitizeEmailHtml(html),
      text,
    });
    return { sent: true };
  } catch (err: any) {
    emailStatus("failed_to_send_encouraging_email", false);
    return { sent: false, reason: "Email delivery failed" };
  }
}

export function getRandomWeeklyTip(): string {
  return WEEKLY_TIPS[Math.floor(Math.random() * WEEKLY_TIPS.length)];
}

// ── AI Session Rating Email ──

export interface SessionRatingEmailOptions {
  toEmail: string;
  clientName: string;
  sessionDate: string;
  rating: number; // 1-10
  ratingEmoji: string;
  summary: string;
  keyBehaviors: string[];
  actionItems: string[];
  scoreImpact: number; // e.g. +0.3
  learningApproach: string;
}

export async function sendSessionRatingEmail(opts: SessionRatingEmailOptions): Promise<{ sent: boolean; reason?: string }> {
  const resend = getResend();

  const ratingColor = opts.rating >= 8 ? "#10b981" : opts.rating >= 5 ? "#fbbf24" : "#ef4444";
  const ratingLabel = opts.rating >= 8 ? "Excellent" : opts.rating >= 6 ? "Good" : opts.rating >= 4 ? "Fair" : "Needs Improvement";

  const behaviorsHtml = opts.keyBehaviors.map(b => `<li style="margin: 4px 0;">${b}</li>`).join("");
  const actionsHtml = opts.actionItems.map(a => `<li style="margin: 4px 0;">${a}</li>`).join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Session Summary</title>
  <style>
    body { margin: 0; padding: 0; background: #060f1e; font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; color: #c8d8ec; }
    .container { max-width: 560px; margin: 40px auto; padding: 0 20px; }
    .card { background: #0b1628; border: 1px solid #12233e; border-radius: 16px; padding: 40px; }
    .logo { font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; margin-bottom: 8px; }
    .rating-circle { width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 20px auto; font-size: 32px; font-weight: 800; color: #ffffff; }
    .section { background: #0d1f3a; border: 1px solid #1a3a5c; border-radius: 12px; padding: 20px; margin: 16px 0; }
    .cta { display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: #ffffff; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 15px; margin-top: 24px; }
    .footer { text-align: center; color: #4a6a8a; font-size: 12px; margin-top: 32px; }
    h2 { color: #ffffff; margin: 0 0 8px; }
    h3 { color: #ffffff; margin: 0 0 12px; font-size: 14px; }
    p { line-height: 1.6; margin: 8px 0; }
    ul { padding-left: 20px; margin: 8px 0; }
    li { line-height: 1.6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">Russell Capital Systems™</div>
      <p style="color: #6b8ab5; font-size: 13px; margin-bottom: 24px;">Session Summary — ${opts.sessionDate}</p>

      <h2>Session Review for ${opts.clientName}</h2>

      <div class="rating-circle" style="background: ${ratingColor};">
        ${opts.rating}/10
      </div>
      <p style="text-align: center; font-size: 16px; font-weight: 700; color: ${ratingColor};">${opts.ratingEmoji} ${ratingLabel}</p>

      <div class="section">
        <h3>📋 Session Summary</h3>
        <p>${opts.summary}</p>
      </div>

      <div class="section">
        <h3>🧠 Key Behaviors Observed</h3>
        <ul>${behaviorsHtml}</ul>
      </div>

      <div class="section">
        <h3>✅ Action Items</h3>
        <ul>${actionsHtml}</ul>
      </div>

      <div class="section">
        <h3>📈 Score Impact</h3>
        <p>This session ${opts.scoreImpact >= 0 ? "boosted" : "impacted"} your financial score by <strong style="color: ${opts.scoreImpact >= 0 ? "#10b981" : "#ef4444"};">${opts.scoreImpact >= 0 ? "+" : ""}${opts.scoreImpact.toFixed(1)}</strong> points.</p>
      </div>

      <div class="section">
        <h3>📚 Recommended Learning Approach</h3>
        <p>${opts.learningApproach}</p>
      </div>

      <div style="text-align: center;">
        <a href="https://www.RussellCapitalSystems.com/portal/recommendations" class="cta">View Recommendations →</a>
      </div>
    </div>
    <div class="footer">
      <p>Russell Capital Systems™ — Building Your Financial Future</p>
    </div>
  </div>
</body>
</html>`;

  const text = `Session Review for ${opts.clientName} — ${opts.sessionDate}\nRating: ${opts.rating}/10 (${ratingLabel})\n\nSummary: ${opts.summary}\n\nKey Behaviors:\n${opts.keyBehaviors.map(b => `- ${b}`).join("\n")}\n\nAction Items:\n${opts.actionItems.map(a => `- ${a}`).join("\n")}\n\nScore Impact: ${opts.scoreImpact >= 0 ? "+" : ""}${opts.scoreImpact.toFixed(1)} points\n\nLearning Approach: ${opts.learningApproach}`;

  if (!resend) {
    emailStatus("resend_api_key_not_set", false);
    emailStatus("to", false);
    return { sent: false, reason: "RESEND_API_KEY not configured" };
  }

  try {
    await resend.emails.send({
      from: "Russell Capital Systems™ <sessions@updates.russellcapitalsystems.com>",
      to: opts.toEmail,
      subject: `${opts.ratingEmoji} Session Summary: ${opts.rating}/10 — ${ratingLabel}`,
      html: sanitizeEmailHtml(html),
      text,
    });
    return { sent: true };
  } catch (err: any) {
    emailStatus("failed_to_send_session_rating_email", false);
    return { sent: false, reason: "Email delivery failed" };
  }
}


// ─── Campaign Email Dispatch ──────────────────────────────────────────────────

export interface CampaignEmailOptions {
  toEmail: string;
  toName?: string;
  subject: string;
  body: string;
  campaignName: string;
}

/**
 * Sends a campaign email to a client.
 * The body is expected to be HTML or plain text content from the campaign template.
 * Returns { sent: true } on success, { sent: false, reason } when email is skipped.
 */
export async function sendCampaignEmail(opts: CampaignEmailOptions): Promise<{ sent: boolean; reason?: string }> {
  const resend = getResend();

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:12px;overflow:hidden;border:1px solid #334155;">
  <!-- Header -->
  <tr><td style="background:linear-gradient(135deg,#065f46,#064e3b);padding:24px 32px;">
    <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">Russell Capital Systems™</h1>
    <p style="margin:4px 0 0;color:#6ee7b7;font-size:12px;text-transform:uppercase;letter-spacing:1px;">${opts.campaignName}</p>
  </td></tr>
  <!-- Body -->
  <tr><td style="padding:32px;color:#e2e8f0;font-size:15px;line-height:1.7;">
    ${opts.toName ? `<p style="margin:0 0 16px;color:#94a3b8;">Dear ${opts.toName},</p>` : ""}
    <div style="color:#e2e8f0;">${opts.body}</div>
  </td></tr>
  <!-- Footer -->
  <tr><td style="padding:16px 32px 24px;border-top:1px solid #334155;">
    <p style="margin:0;color:#64748b;font-size:11px;text-align:center;">
      This email was sent by Russell Capital Systems™. If you no longer wish to receive these emails, please contact your advisor.
    </p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  const text = `${opts.toName ? `Dear ${opts.toName},\n\n` : ""}${opts.body.replace(/<[^>]+>/g, "")}\n\n---\nRussell Capital Systems™\n${opts.campaignName}`;

  if (!resend) {
    emailStatus("campaign", false);
    return { sent: false, reason: "RESEND_API_KEY not configured" };
  }

  try {
    await resend.emails.send({
      from: "Russell Capital Systems™ <campaigns@updates.russellcapitalsystems.com>",
      to: opts.toEmail,
      subject: opts.subject,
      html: sanitizeEmailHtml(html),
      text,
    });
    return { sent: true };
  } catch (err: any) {
    emailStatus("failed_to_send_campaign_email", false);
    return { sent: false, reason: "Email delivery failed" };
  }
}


// ─── Password Reset Email ────────────────────────────────────────────────────
export interface PasswordResetEmailOptions {
  toEmail: string;
  userName: string;
  resetToken: string;
}

export async function sendPasswordResetEmail(opts: PasswordResetEmailOptions): Promise<{ sent: boolean; reason?: string }> {
  const resend = getResend();
  const resetUrl = `https://www.RussellCapitalSystems.com/reset-password?token=${opts.resetToken}`;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:12px;overflow:hidden;">
        <tr><td style="background:linear-gradient(135deg,#059669,#10b981);padding:32px;text-align:center;">
          <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">Russell Capital Systems™</h1>
          <p style="color:#d1fae5;margin:8px 0 0;font-size:14px;">Password Reset Request</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="color:#e2e8f0;font-size:16px;line-height:1.6;margin:0 0 16px;">Hi ${opts.userName},</p>
          <p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 24px;">We received a request to reset your password. Click the button below to create a new password. This link will expire in 1 hour.</p>
          <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0 24px;">
            <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#059669,#10b981);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;">Reset Password</a>
          </td></tr></table>
          <p style="color:#64748b;font-size:13px;line-height:1.6;margin:0 0 8px;">If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="color:#38bdf8;font-size:13px;word-break:break-all;margin:0 0 24px;">${resetUrl}</p>
          <p style="color:#64748b;font-size:13px;line-height:1.6;margin:0;">If you didn't request this reset, you can safely ignore this email. Your password will remain unchanged.</p>
        </td></tr>
        <tr><td style="padding:24px 32px;border-top:1px solid #334155;text-align:center;">
          <p style="color:#475569;font-size:12px;margin:0;">Russell Capital Systems™ &bull; www.RussellCapitalSystems.com</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  if (!resend) {
    emailStatus("password_reset_email", false);
    return { sent: false, reason: "Resend API key not configured" };
  }

  try {
    await resend.emails.send({
      from: "Russell Capital Systems™ <noreply@russellcap.com>",
      to: opts.toEmail,
      subject: "Reset Your Password — Russell Capital Systems™",
      html: sanitizeEmailHtml(html),
    });
    return { sent: true };
  } catch (error) {
    emailStatus("failed_to_send_password_reset", false);
    return { sent: false, reason: "Email delivery failed" };
  }
}

// ─── Risk Profile Drift Alert ────────────────────────────────────────────────
export interface DriftAlertEmailOptions {
  toEmail: string;
  advisorName: string;
  clientName: string;
  driftScore: number;
  direction: "more_aggressive" | "more_conservative";
  previousScore: number;
  currentScore: number;
  riskCategory?: string;
  dashboardUrl?: string;
}

export async function sendDriftAlertEmail(opts: DriftAlertEmailOptions): Promise<{ sent: boolean; reason?: string }> {
  const resend = getResend();
  const directionLabel = opts.direction === "more_aggressive" ? "More Aggressive" : "More Conservative";
  const urgency = opts.driftScore >= 20 ? "CRITICAL" : opts.driftScore >= 15 ? "HIGH" : "MODERATE";
  const urgencyColor = opts.driftScore >= 20 ? "#ef4444" : opts.driftScore >= 15 ? "#f59e0b" : "#3b82f6";

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a1628;font-family:'Inter',Arial,sans-serif">
<div style="max-width:600px;margin:0 auto;padding:32px 24px">
  <div style="text-align:center;margin-bottom:24px">
    <div style="display:inline-block;background:#22c55e;color:#fff;font-weight:800;font-size:14px;padding:8px 16px;border-radius:8px">RCS</div>
    <h2 style="color:#fff;margin:12px 0 4px">Risk Profile Drift Alert</h2>
    <span style="display:inline-block;background:${urgencyColor};color:#fff;font-size:12px;font-weight:700;padding:4px 12px;border-radius:12px">${urgency} PRIORITY</span>
  </div>
  <div style="background:#12233e;border-radius:12px;padding:24px;margin-bottom:16px">
    <p style="color:#7a95b8;margin:0 0 8px;font-size:14px">Client</p>
    <p style="color:#fff;margin:0 0 16px;font-size:18px;font-weight:700">${opts.clientName}</p>
    <div style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #1a3050">
      <span style="color:#7a95b8;font-size:14px">Previous Score</span>
      <span style="color:#fff;font-weight:700;font-size:14px">${opts.previousScore}</span>
    </div>
    <div style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #1a3050">
      <span style="color:#7a95b8;font-size:14px">Current Score</span>
      <span style="color:#fff;font-weight:700;font-size:14px">${opts.currentScore}</span>
    </div>
    <div style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #1a3050">
      <span style="color:#7a95b8;font-size:14px">Drift Magnitude</span>
      <span style="color:${urgencyColor};font-weight:700;font-size:14px">${opts.driftScore} points</span>
    </div>
    <div style="display:flex;justify-content:space-between;padding:12px 0">
      <span style="color:#7a95b8;font-size:14px">Direction</span>
      <span style="color:#fff;font-weight:700;font-size:14px">${directionLabel}</span>
    </div>
  </div>
  <div style="background:#1a3050;border-left:4px solid ${urgencyColor};border-radius:8px;padding:16px;margin-bottom:16px">
    <p style="color:#fff;margin:0;font-size:14px;font-weight:600">Recommended Action</p>
    <p style="color:#7a95b8;margin:8px 0 0;font-size:13px">${opts.driftScore >= 15 ? "Schedule a reassessment meeting with this client. Their risk tolerance has shifted significantly and current allocations may no longer be appropriate." : "Monitor this client closely. Consider discussing any life changes that may have influenced their risk perspective."}</p>
  </div>
  ${opts.dashboardUrl ? `<div style="text-align:center;margin-top:24px"><a href="${opts.dashboardUrl}" style="display:inline-block;background:#22c55e;color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:700;font-size:14px">View Client Profile</a></div>` : ""}
  <p style="color:#4a6585;font-size:11px;text-align:center;margin-top:32px">Russell Capital Systems™ — Turn Capital Into Income&trade;</p>
</div>
</body></html>`;

  const text = `RISK PROFILE DRIFT ALERT [${urgency}]\n\nClient: ${opts.clientName}\nPrevious Score: ${opts.previousScore}\nCurrent Score: ${opts.currentScore}\nDrift: ${opts.driftScore} points (${directionLabel})\n\n${opts.driftScore >= 15 ? "ACTION: Schedule reassessment meeting." : "ACTION: Monitor closely."}`;

  if (!resend) {
    emailStatus("drift_alert", false);
    return { sent: false, reason: "RESEND_API_KEY not configured" };
  }
  try {
    const { error } = await resend.emails.send({
      from: "Russell Capital <notifications@updates.russellcapitalsystems.com>",
      to: opts.toEmail,
      subject: `[${urgency}] Risk Drift Alert — ${opts.clientName} (${opts.driftScore}pt shift)`,
      html: sanitizeEmailHtml(html),
      text,
    });
    emailStatus("drift_alert_error", false);
    return { sent: true };
  } catch (error) {
    emailStatus("drift_alert_exception", false);
    return { sent: false, reason: "Email delivery failed" };
  }
}

// ─── Withdrawal Symptom Re-Engagement Emails ─────────────────────────────────
export interface WithdrawalEmailOptions {
  toEmail: string;
  userName: string;
  escalationLevel: "gentle" | "urgent" | "fomo";
  hoursInactive: number;
  petName?: string;
  petHappiness?: number;
  currentStreak?: number;
  expiringQuests?: number;
  dashboardUrl?: string;
}

export async function sendWithdrawalEmail(opts: WithdrawalEmailOptions): Promise<{ sent: boolean; reason?: string }> {
  const resend = getResend();
  const { toEmail, userName, escalationLevel, hoursInactive, petName, petHappiness, currentStreak, expiringQuests, dashboardUrl = "https://www.russellcap.com/portal" } = opts;
  const firstName = userName?.split(" ")[0] || "Advisor";

  const subjects: Record<string, string> = {
    gentle: `${firstName}, your dashboard misses you`,
    urgent: `${firstName} — your streak is at risk!`,
    fomo: `${firstName}, you're falling behind — competitors are pulling ahead`,
  };

  const urgencyColor: Record<string, string> = {
    gentle: "#3b82f6",
    urgent: "#f59e0b",
    fomo: "#ef4444",
  };

  const color = urgencyColor[escalationLevel];

  let contentBlocks = "";
  if (escalationLevel === "gentle") {
    contentBlocks = `<div style="background:#12233e;border-radius:12px;padding:24px;margin-bottom:16px">
      <h3 style="color:#fff;margin:0 0 12px;font-size:16px">It's been a while, ${firstName}</h3>
      <p style="color:#7a95b8;margin:0;font-size:14px;line-height:1.6">You haven't logged in for ${Math.round(hoursInactive)} hours. Your tools are ready and waiting &mdash; new market data has been processed and your calculators are primed with the latest rates.</p>
    </div>`;
  } else if (escalationLevel === "urgent") {
    contentBlocks = `<div style="background:#12233e;border-radius:12px;padding:24px;margin-bottom:16px">
      <h3 style="color:#f59e0b;margin:0 0 12px;font-size:16px">Your Progress Is At Risk</h3>
      <p style="color:#7a95b8;margin:0 0 16px;font-size:14px;line-height:1.6">You've been away for ${Math.round(hoursInactive)} hours. Here's what needs your attention:</p>
      <div style="border-left:3px solid #f59e0b;padding-left:12px;margin-bottom:12px">
        ${currentStreak ? `<p style="color:#fff;margin:0 0 8px;font-size:13px"><strong>${currentStreak}-day streak</strong> will reset at midnight!</p>` : ""}
        ${petName ? `<p style="color:#fff;margin:0 0 8px;font-size:13px"><strong>${petName}</strong> is ${petHappiness !== undefined && petHappiness < 30 ? "very sad" : "getting lonely"} (happiness: ${petHappiness}%)</p>` : ""}
        ${expiringQuests ? `<p style="color:#fff;margin:0;font-size:13px"><strong>${expiringQuests} quest${expiringQuests > 1 ? "s" : ""}</strong> expiring soon!</p>` : ""}
      </div>
    </div>`;
  } else {
    contentBlocks = `<div style="background:#12233e;border-radius:12px;padding:24px;margin-bottom:16px">
      <h3 style="color:#ef4444;margin:0 0 12px;font-size:16px">You're Falling Behind</h3>
      <p style="color:#7a95b8;margin:0 0 16px;font-size:14px;line-height:1.6">It's been ${Math.round(hoursInactive)} hours since your last session. While you've been away:</p>
      <div style="background:#1a3050;border-radius:8px;padding:16px;margin-bottom:12px">
        <p style="color:#fff;margin:0 0 8px;font-size:13px">Market conditions have shifted</p>
        <p style="color:#fff;margin:0 0 8px;font-size:13px">Other advisors have been closing deals</p>
        <p style="color:#fff;margin:0 0 8px;font-size:13px">New conversion windows may have opened</p>
        ${currentStreak ? `<p style="color:#ef4444;margin:0;font-size:13px;font-weight:700">Your ${currentStreak}-day streak is GONE if you don't act now</p>` : ""}
      </div>
    </div>`;
  }

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a1628;font-family:'Inter',Arial,sans-serif">
<div style="max-width:600px;margin:0 auto;padding:32px 24px">
  <div style="text-align:center;margin-bottom:24px">
    <div style="display:inline-block;background:#22c55e;color:#fff;font-weight:800;font-size:14px;padding:8px 16px;border-radius:8px">RCS</div>
    <h2 style="color:#fff;margin:12px 0 4px">${subjects[escalationLevel]}</h2>
    <span style="display:inline-block;background:${color};color:#fff;font-size:11px;font-weight:700;padding:3px 10px;border-radius:12px;text-transform:uppercase">${escalationLevel} reminder</span>
  </div>
  ${contentBlocks}
  <div style="text-align:center;margin-top:24px">
    <a href="${dashboardUrl}" style="display:inline-block;background:#22c55e;color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-weight:700;font-size:15px">Return to Dashboard</a>
  </div>
  <p style="color:#4a6585;font-size:11px;text-align:center;margin-top:32px">Russell Capital Systems&trade;</p>
</div></body></html>`;

  const text = `${subjects[escalationLevel]}\n\nHi ${firstName},\nYou haven't logged in for ${Math.round(hoursInactive)} hours.\n${currentStreak ? `Your ${currentStreak}-day streak is at risk!\n` : ""}${petName ? `${petName} misses you (happiness: ${petHappiness}%)\n` : ""}\nReturn: ${dashboardUrl}`;

  if (!resend) {
    emailStatus("withdrawal", false);
    return { sent: false, reason: "RESEND_API_KEY not configured" };
  }

  try {
    const { error } = await resend.emails.send({
      from: "Russell Capital <notifications@updates.russellcapitalsystems.com>",
      to: toEmail,
      subject: subjects[escalationLevel],
      html: sanitizeEmailHtml(html),
      text,
    });
    emailStatus("withdrawal_email_error", false);
    emailStatus("withdrawal", true);
    return { sent: true };
  } catch (error) {
    emailStatus("withdrawal_email_exception", false);
    return { sent: false, reason: "Email delivery failed" };
  }
}
