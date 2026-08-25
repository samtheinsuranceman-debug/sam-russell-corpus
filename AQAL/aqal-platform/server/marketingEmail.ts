// ============================================================
// MARKETING EMAIL — the one door every nudge/drip email goes
// through. Enforces CAN-SPAM: checks the recipient's opt-out
// flag, appends the working unsubscribe footer, and sets the
// RFC 8058 one-click List-Unsubscribe headers. Transactional
// mail (verify, reset, results, support) bypasses this and
// calls sendEmail directly — it's exempt and must always send.
// ============================================================
import { and, eq, isNotNull } from "drizzle-orm";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { sendEmail, unsubscribeUrl, withUnsubscribeFooter, type SendEmailResult } from "./platform/email";

export type MarketingEmailResult = SendEmailResult & { skipped?: boolean };

export async function sendMarketingEmail(
  to: string,
  subject: string,
  html: string,
  appUrl?: string,
): Promise<MarketingEmailResult> {
  // Any account holding this address that has opted out silences it entirely.
  try {
    const db = await getDb();
    if (db) {
      const optedOut = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.email, to), isNotNull(users.emailOptOutAt)))
        .limit(1);
      if (optedOut.length > 0) return { ok: false, mocked: false, skipped: true };
    }
  } catch {
    // If the opt-out check itself fails, do not send — err on the quiet side.
    return { ok: false, mocked: false, skipped: true, error: "opt-out check failed" };
  }
  const url = unsubscribeUrl(appUrl ?? "", to);
  return sendEmail(to, subject, withUnsubscribeFooter(html, url), {
    headers: {
      "List-Unsubscribe": `<${url}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  });
}
