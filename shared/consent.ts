// ============================================================
// CONSENT LEDGER — pure logic, shared by client and server.
//
// A consent grant says: this grantee (a person, an AI agent, an outside
// integration, or the advisor) may use these scopes of the client's data,
// for this purpose, from this moment until it expires or is revoked. Every
// grant and every revocation is also a "consent" event on the Plan Ledger,
// so the history of who could see what is as tamper-evident as the plan.
// Nothing reads a scoped source without passing checkConsent().
// ============================================================

export const CONSENT_SCOPES = {
  "facts:read": { label: "Read the assessment", description: "See the answers in the Financial Assessment." },
  "facts:write": { label: "Suggest assessment changes", description: "Propose values the client confirms field by field. Never writes directly." },
  "documents:read": { label: "Read documents", description: "Open files in the Document Vault." },
  "documents:write": { label: "Add documents", description: "Add files to the Document Vault (with provenance)." },
  "ledger:read": { label: "Read the Plan Ledger", description: "See the timeline of facts, decisions and messages." },
  "health:coverage": { label: "Health coverage", description: "Read insurance coverage records from a health-data (FHIR) source." },
  "health:claims": { label: "Health claims", description: "Read claims and explanation-of-benefits records from a health-data (FHIR) source." },
  "tax:transcripts": { label: "Tax transcripts", description: "Read machine-readable tax records (transcripts, information returns)." },
  "accounts:balances": { label: "Account balances", description: "Read balances from linked financial accounts." },
  "accounts:transactions": { label: "Account transactions", description: "Read transactions from linked financial accounts." },
  "messages:send": { label: "Send messages", description: "Send email or text to the client on the platform's behalf." },
  "money:propose": { label: "Propose money movement", description: "Propose transfers or payments that the Fiduciary Transaction Firewall then decides." },
} as const;
export type ConsentScope = keyof typeof CONSENT_SCOPES;
export const CONSENT_SCOPE_LIST = Object.keys(CONSENT_SCOPES) as ConsentScope[];

export const GRANTEE_TYPES = ["person", "agent", "integration", "advisor"] as const;
export type GranteeType = (typeof GRANTEE_TYPES)[number];

export type ConsentGrantLike = {
  id: number;
  granteeType: GranteeType | string;
  granteeId: string;
  granteeLabel?: string | null;
  scopes: string[];
  purpose?: string | null;
  startsAt: Date;
  expiresAt: Date | null;
  revokedAt: Date | null;
};

export function isValidScope(s: string): s is ConsentScope {
  return s in CONSENT_SCOPES;
}

/** A grant is active when it has started, has not expired, and has not been revoked. */
export function isGrantActive(g: Pick<ConsentGrantLike, "startsAt" | "expiresAt" | "revokedAt">, now: Date = new Date()): boolean {
  if (g.revokedAt && g.revokedAt.getTime() <= now.getTime()) return false;
  if (g.startsAt.getTime() > now.getTime()) return false;
  if (g.expiresAt && g.expiresAt.getTime() <= now.getTime()) return false;
  return true;
}

/** "health:*" covers "health:claims"; "*" covers everything; otherwise exact match. */
export function scopeCovered(granted: string[], needed: string): boolean {
  for (const g of granted) {
    if (g === "*" || g === needed) return true;
    if (g.endsWith(":*") && needed.startsWith(g.slice(0, -1))) return true;
  }
  return false;
}

export type ConsentCheck = { allowed: boolean; grant: ConsentGrantLike | null; reason: string };

/** Find the first active grant for this grantee that covers the scope. */
export function checkConsent(grants: ConsentGrantLike[], granteeId: string, scope: string, now: Date = new Date()): ConsentCheck {
  const forGrantee = grants.filter((g) => g.granteeId === granteeId);
  if (!forGrantee.length) return { allowed: false, grant: null, reason: `no consent recorded for ${granteeId}` };
  const active = forGrantee.filter((g) => isGrantActive(g, now));
  if (!active.length) return { allowed: false, grant: null, reason: `consent for ${granteeId} has expired or was revoked` };
  const match = active.find((g) => scopeCovered(g.scopes, scope));
  if (!match) return { allowed: false, grant: null, reason: `${granteeId} is not allowed "${scope}"` };
  return { allowed: true, grant: match, reason: "ok" };
}

export function describeGrant(g: ConsentGrantLike): string {
  const who = g.granteeLabel ? `${g.granteeLabel} (${g.granteeId})` : g.granteeId;
  const until = g.expiresAt ? ` until ${g.expiresAt.toISOString().slice(0, 10)}` : " until revoked";
  return `${who} may ${g.scopes.map((s) => (isValidScope(s) ? CONSENT_SCOPES[s].label.toLowerCase() : s)).join(", ")}${until}${g.purpose ? ` — ${g.purpose}` : ""}`;
}
