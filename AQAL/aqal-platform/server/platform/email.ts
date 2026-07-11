// ============================================================
// Email seam — send transactional email (e.g. a user's results)
// ============================================================
// Resend by default; empty key = mock (logs), so the app runs with no vendor.
// Swap seam mirrors the LLM/STT/storage providers: real when configured,
// safe deterministic fallback otherwise.

import { RESEND_API_KEY, EMAIL_FROM, emailProvider } from "./config";

export type SendEmailResult = { ok: boolean; mocked: boolean; error?: string };

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
): Promise<SendEmailResult> {
  if (emailProvider() === "mock") {
    console.log(`[email:mock] → ${to} · ${subject}`);
    return { ok: true, mocked: true };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: EMAIL_FROM, to, subject, html }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, mocked: false, error: `Resend ${res.status}: ${body.slice(0, 200)}` };
    }
    return { ok: true, mocked: false };
  } catch (err) {
    return { ok: false, mocked: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// Minimal branded HTML for the free, voice-based result email.
export function resultEmailHtml(opts: {
  rarity: number;
  cohortRarity?: number | null;
  generation?: string | null;
  confidenceTier: string;
}): string {
  const { rarity, cohortRarity, generation, confidenceTier } = opts;
  const cohortLine =
    cohortRarity && generation
      ? `<p style="margin:6px 0 0;color:#b9b2a6;font-size:14px;">1 in ${cohortRarity.toLocaleString()} among ${generation}</p>`
      : "";
  return `<!doctype html><html><body style="margin:0;background:#161310;font-family:Georgia,serif;color:#efe9dc;">
  <div style="max-width:520px;margin:0 auto;padding:40px 28px;">
    <div style="font-family:monospace;font-size:11px;letter-spacing:.24em;color:#c9a24b;text-transform:uppercase;margin-bottom:18px;">AQAL Intelligence</div>
    <h1 style="font-size:24px;font-weight:600;margin:0 0 16px;">Your voice-based result</h1>
    <div style="border:1px solid rgba(201,162,75,.2);border-radius:14px;padding:24px;text-align:center;background:rgba(201,162,75,.05);">
      <div style="font-family:monospace;font-size:10px;letter-spacing:.2em;color:#c9a24b;text-transform:uppercase;">Composite rarity</div>
      <div style="font-size:40px;font-weight:600;color:#e0c68c;margin:8px 0 0;">1 in ${rarity.toLocaleString()}</div>
      ${cohortLine}
      <div style="font-family:monospace;font-size:11px;color:#8c857a;margin-top:14px;">Confidence: ${confidenceTier} · voice-only estimate</div>
    </div>
    <p style="color:#b9b2a6;font-size:14px;line-height:1.6;margin:22px 0 0;">
      This is a model-based estimate, not a measured percentile. To verify your full
      32-line profile and raise it to high confidence, complete evidence-based verification in the app.
    </p>
    <p style="color:#6f6a60;font-size:12px;margin-top:26px;">You received this because you requested AQAL free access. We never sell your personal information.</p>
  </div></body></html>`;
}
