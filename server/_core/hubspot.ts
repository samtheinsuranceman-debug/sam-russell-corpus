// ============================================================
// HUBSPOT — every lead and client becomes a contact, best-effort, keyed by
// email. Private-app token in HUBSPOT_ACCESS_TOKEN. Never throws.
// ============================================================
export type HubSpotContact = { email: string; firstname?: string | null; lastname?: string | null; phone?: string | null; lifecyclestage?: string; rcs_status?: string; rcs_source?: string };
export type HubSpotResult = { ok: boolean; id?: string; reason?: string };

type Fetcher = typeof fetch;
let _fetch: Fetcher = (...a) => fetch(...a);
export function _setFetchForTests(f: Fetcher | null) { _fetch = f ?? ((...a) => fetch(...a)); }

export function hubspotConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env.HUBSPOT_ACCESS_TOKEN);
}

/** Create the contact, or update it if HubSpot says the email already exists (409 carries the existing id). */
export async function upsertContact(c: HubSpotContact, env: NodeJS.ProcessEnv = process.env): Promise<HubSpotResult> {
  const token = env.HUBSPOT_ACCESS_TOKEN;
  if (!token) return { ok: false, reason: "HUBSPOT_ACCESS_TOKEN not set" };
  const properties: Record<string, string> = { email: c.email.trim().toLowerCase() };
  if (c.firstname) properties.firstname = c.firstname;
  if (c.lastname) properties.lastname = c.lastname;
  if (c.phone) properties.phone = c.phone;
  if (c.lifecyclestage) properties.lifecyclestage = c.lifecyclestage;
  const headers = { authorization: `Bearer ${token}`, "content-type": "application/json" };
  try {
    const create = await _fetch("https://api.hubapi.com/crm/v3/objects/contacts", { method: "POST", headers, body: JSON.stringify({ properties }), signal: AbortSignal.timeout(10000) });
    if (create.ok) { const j = (await create.json()) as { id?: string }; return { ok: true, id: j.id }; }
    if (create.status === 409) {
      const j = (await create.json().catch(() => ({}))) as { message?: string };
      const id = (j.message ?? "").match(/Existing ID:\s*(\d+)/)?.[1];
      if (id) {
        const patch = await _fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${id}`, { method: "PATCH", headers, body: JSON.stringify({ properties }), signal: AbortSignal.timeout(10000) });
        return patch.ok ? { ok: true, id } : { ok: false, reason: `HubSpot update failed (${patch.status})` };
      }
    }
    return { ok: false, reason: `HubSpot rejected the contact (${create.status})` };
  } catch (error) {
    return { ok: false, reason: `HubSpot unreachable: ${String(error).slice(0, 80)}` };
  }
}
