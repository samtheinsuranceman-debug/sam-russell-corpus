/**
 * Email PIN Verification Service
 * Sends 6-digit codes to user emails before collecting payment.
 */
import { getDb } from "./db";
import { emailVerificationCodes } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";

function generatePin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send a 6-digit PIN to the given email address.
 */
export async function sendVerificationPin(email: string, purpose = "pre_checkout"): Promise<string | null> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  const code = generatePin();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await db.insert(emailVerificationCodes).values({
    email,
    code,
    purpose,
    expiresAt,
    verified: false,
    attempts: 0,
  });

  // Notify owner
  try {
    await notifyOwner({
      title: `Verification PIN for ${email}`,
      content: `A 6-digit verification PIN was requested by ${email}. Code: ${code}. Purpose: ${purpose}. Expires in 10 minutes.`,
    });
  } catch (e) {
    console.error("[EmailPIN] Failed to send notification:", e);
  }

  // Send via Resend if available
  try {
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Russell Capital Systems™ <noreply@russellcapitalsystems.com>",
          to: [email],
          subject: `Your Verification Code: ${code}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #1a1a2e;">Russell Capital Systems™</h2>
              <p>Your 6-digit verification code is:</p>
              <div style="background: #f0f0f0; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1a1a2e;">${code}</span>
              </div>
              <p style="color: #666; font-size: 14px;">This code expires in 10 minutes. Do not share it with anyone.</p>
              <p style="color: #666; font-size: 12px;">If you did not request this code, please ignore this email.</p>
            </div>
          `,
        }),
      });
      if (!res.ok) {
        console.error("[EmailPIN] Resend failed:", await res.text());
      }
    }
  } catch (e) {
    console.error("[EmailPIN] Resend error:", e);
  }

  return code;
}

/**
 * Verify a 6-digit PIN. Returns true if valid, false otherwise.
 * Locks out after 5 failed attempts.
 */
export async function verifyPin(email: string, code: string, purpose = "pre_checkout"): Promise<{ valid: boolean; error?: string }> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  const records = await db
    .select()
    .from(emailVerificationCodes)
    .where(
      and(
        eq(emailVerificationCodes.email, email),
        eq(emailVerificationCodes.purpose, purpose),
        eq(emailVerificationCodes.verified, false),
      )
    )
    .orderBy(desc(emailVerificationCodes.createdAt))
    .limit(1);

  if (records.length === 0) {
    return { valid: false, error: "No pending verification code found. Please request a new one." };
  }

  const record = records[0];

  if (record.attempts >= 5) {
    return { valid: false, error: "Too many failed attempts. Please request a new code." };
  }

  if (new Date() > record.expiresAt) {
    return { valid: false, error: "Verification code has expired. Please request a new one." };
  }

  if (record.code !== code) {
    await db
      .update(emailVerificationCodes)
      .set({ attempts: record.attempts + 1 })
      .where(eq(emailVerificationCodes.id, record.id));
    return { valid: false, error: `Incorrect code. ${4 - record.attempts} attempts remaining.` };
  }

  // Mark as verified
  await db
    .update(emailVerificationCodes)
    .set({ verified: true, verifiedAt: new Date() })
    .where(eq(emailVerificationCodes.id, record.id));

  return { valid: true };
}
