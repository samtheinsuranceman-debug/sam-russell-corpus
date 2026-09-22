// ============================================================
// /portal/owner-panel — the hidden owner panel: 40 API-key slots and 40 MCP-URL
// slots that feed the hive. Admin role to see it; passphrase to open it; the
// secret never comes back from the server once stored (masked only).
// ============================================================
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { trpc } from "@/lib/trpc";

type Kind = "api" | "mcp";

/** The council's domains (shared/council/aiCouncil.ts `Domain`); a member marked strong in one is asked first for it. */
const COUNCIL_DOMAINS = ["policy-mechanics", "tax", "real-estate", "lending", "liquidity", "legacy", "compliance", "market-history", "patent", "health-evidence", "behavioural", "data-integrity"] as const;

export default function OwnerPanel() {
  const utils = trpc.useUtils();
  const status = trpc.ownerVault.status.useQuery();
  const providers = trpc.ownerVault.providers.useQuery(undefined, { enabled: !!status.data?.unlocked });
  const slots = trpc.ownerVault.slots.useQuery(undefined, { enabled: !!status.data?.unlocked, retry: false });
  const unlock = trpc.ownerVault.unlock.useMutation({ onSuccess: () => { utils.ownerVault.status.invalidate(); utils.ownerVault.slots.invalidate(); } });
  const lock = trpc.ownerVault.lock.useMutation({ onSuccess: () => utils.ownerVault.status.invalidate() });
  const setSlot = trpc.ownerVault.setSlot.useMutation({ onSuccess: () => { utils.ownerVault.slots.invalidate(); utils.ownerVault.status.invalidate(); } });
  const clearSlot = trpc.ownerVault.clearSlot.useMutation({ onSuccess: () => { utils.ownerVault.slots.invalidate(); utils.ownerVault.status.invalidate(); } });
  const setEnabled = trpc.ownerVault.setEnabled.useMutation({ onSuccess: () => utils.ownerVault.slots.invalidate() });
  const test = trpc.ownerVault.test.useMutation();

  const [passphrase, setPassphrase] = useState("");
  const [totp, setTotp] = useState("");
  const [draft, setDraft] = useState<{ kind: Kind; slot: number; providerId: string; label: string; secret: string; model: string; domains: string[] } | null>(null);
  const [testResult, setTestResult] = useState<string>("");

  const s = status.data;
  const byKey = new Map((slots.data ?? []).map((r) => [`${r.kind}:${r.slot}`, r]));

  function grid(kind: Kind, cap: number) {
    return (
      <div className="grid gap-1 sm:grid-cols-2">
        {Array.from({ length: cap }, (_, i) => i + 1).map((n) => {
          const r = byKey.get(`${kind}:${n}`);
          return (
            <div key={n} className={`flex items-center gap-2 rounded border px-2 py-1 text-xs ${r ? (r.enabled ? "border-emerald-700/60" : "border-amber-700/60 opacity-70") : "border-emerald-900/30"}`}>
              <span className="w-6 tabular-nums text-emerald-200/60">{n}</span>
              {r ? (
                <>
                  <span className="font-medium">{r.label}</span>
                  <span className="text-emerald-200/60">{r.providerId}</span>
                  <span className="font-mono text-emerald-200/60">{r.masked}</span>
                  {r.domains.length > 0 && <span className="text-emerald-300/80">{r.domains.join(", ")}</span>}
                  <span className="ml-auto flex gap-1">
                    {kind === "api" && <button type="button" className="underline" onClick={async () => { const t = await test.mutateAsync({ slot: n }); setTestResult(`${t.providerId} slot ${n}: ${t.ok ? `OK in ${t.ms} ms` : `failed (${t.error ?? "no text"})`}`); }}>test</button>}
                    <button type="button" className="underline" onClick={() => setEnabled.mutate({ kind, slot: n, enabled: !r.enabled })}>{r.enabled ? "park" : "enable"}</button>
                    <button type="button" className="underline" onClick={() => setDraft({ kind, slot: n, providerId: r.providerId, label: r.label, secret: "", model: r.model ?? "", domains: r.domains })}>replace</button>
                    <button type="button" className="text-red-300 underline" onClick={() => clearSlot.mutate({ kind, slot: n })}>clear</button>
                  </span>
                </>
              ) : (
                <button type="button" className="ml-auto underline" onClick={() => setDraft({ kind, slot: n, providerId: kind === "api" ? (providers.data?.[0]?.id ?? "") : "mcp", label: "", secret: "", model: "", domains: [] })}>add</button>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <AppShell title="Owner Panel" subtitle="AI keys and MCP servers that feed the hive. Nothing entered here is ever shown again in full.">
      <div className="mx-auto max-w-5xl space-y-6 p-4 text-sm">
        {status.isLoading && <p>Checking the vault…</p>}
        {status.error && <p className="text-amber-300">{status.error.message}</p>}
        {s && !s.vaultKeyConfigured && (
          <p className="rounded border border-amber-700/60 p-3 text-amber-200">OWNER_VAULT_KEY is not set on this host, so the vault cannot store anything. Generate 32 random bytes as hex and set it in the host's environment; keys already stored under another value cannot be read.</p>
        )}
        {s && !s.unlocked && (
          <form className="space-y-2 rounded border border-emerald-900/40 p-3" onSubmit={(e) => { e.preventDefault(); unlock.mutate({ passphrase, totp: totp || undefined }); }}>
            <label htmlFor="owner-passphrase" className="block font-medium">{s.passphraseConfigured ? "Owner passphrase (33+ characters or 16+ words)" : "Owner password"}</label>
            <input id="owner-passphrase" type="password" autoComplete="off" className="w-full rounded border border-emerald-900/40 bg-transparent px-2 py-1" value={passphrase} onChange={(e) => setPassphrase(e.target.value)} />
            {s.totpRequired && (
              <>
                <label htmlFor="owner-totp" className="block font-medium">Authenticator code</label>
                <input id="owner-totp" inputMode="numeric" className="w-40 rounded border border-emerald-900/40 bg-transparent px-2 py-1" value={totp} onChange={(e) => setTotp(e.target.value)} />
              </>
            )}
            <button type="submit" className="rounded bg-emerald-600 px-3 py-1 font-medium text-black" disabled={unlock.isPending}>Open the panel</button>
            {unlock.error && <p className="text-red-300">{unlock.error.message}</p>}
            <p className="text-xs text-emerald-200/60">Five attempts per fifteen minutes. The session stays open for fifteen minutes on this server only.</p>
          </form>
        )}
        {s?.unlocked && (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <span>API keys {s.enabled.api} enabled / {s.used.api} of {s.capacity.api}</span>
              <span>MCP servers {s.enabled.mcp} enabled / {s.used.mcp} of {s.capacity.mcp}</span>
              <button type="button" className="ml-auto underline" onClick={() => lock.mutate()}>Lock</button>
            </div>
            {testResult && <p className="text-xs">{testResult}</p>}
            {draft && (
              <form className="grid gap-2 rounded border border-emerald-700/60 p-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); setSlot.mutate({ kind: draft.kind, slot: draft.slot, providerId: draft.providerId, label: draft.label, secret: draft.secret, model: draft.model || undefined, domains: draft.domains }, { onSuccess: () => setDraft(null) }); }}>
                <div className="sm:col-span-2 font-medium">{draft.kind === "api" ? "API key" : "MCP server"} slot {draft.slot}</div>
                {draft.kind === "api" ? (
                  <label className="grid gap-1">Provider
                    <select className="rounded border border-emerald-900/40 bg-transparent px-2 py-1" value={draft.providerId} onChange={(e) => setDraft({ ...draft, providerId: e.target.value })}>
                      {(providers.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                    </select>
                  </label>
                ) : (
                  <label className="grid gap-1">Server id<input className="rounded border border-emerald-900/40 bg-transparent px-2 py-1" value={draft.providerId} onChange={(e) => setDraft({ ...draft, providerId: e.target.value })} /></label>
                )}
                <label className="grid gap-1">Label<input className="rounded border border-emerald-900/40 bg-transparent px-2 py-1" value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} /></label>
                <label className="grid gap-1 sm:col-span-2">{draft.kind === "api" ? "API key" : "Server URL"}<input type={draft.kind === "api" ? "password" : "url"} autoComplete="off" className="rounded border border-emerald-900/40 bg-transparent px-2 py-1" value={draft.secret} onChange={(e) => setDraft({ ...draft, secret: e.target.value })} /></label>
                {draft.kind === "api" && <label className="grid gap-1">Model override (optional)<input className="rounded border border-emerald-900/40 bg-transparent px-2 py-1" value={draft.model} onChange={(e) => setDraft({ ...draft, model: e.target.value })} /></label>}
                {draft.kind === "api" && (
                  <fieldset className="sm:col-span-2">
                    <legend className="mb-1">Strong in (the hive asks these members first for that domain; none = generalist)</legend>
                    <div className="flex flex-wrap gap-2">
                      {COUNCIL_DOMAINS.map((d) => (
                        <label key={d} className="flex items-center gap-1 text-xs">
                          <input type="checkbox" id={`dom-${draft.kind}-${draft.slot}-${d}`} checked={draft.domains.includes(d)} onChange={(e) => setDraft({ ...draft, domains: e.target.checked ? [...draft.domains, d] : draft.domains.filter((x) => x !== d) })} />
                          {d}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                )}
                <div className="flex gap-2 sm:col-span-2">
                  <button type="submit" className="rounded bg-emerald-600 px-3 py-1 font-medium text-black" disabled={setSlot.isPending}>Seal and store</button>
                  <button type="button" className="underline" onClick={() => setDraft(null)}>Cancel</button>
                </div>
                {setSlot.error && <p className="text-red-300 sm:col-span-2">{setSlot.error.message}</p>}
              </form>
            )}
            <section><h2 className="mb-1 font-semibold">API keys (40)</h2>{grid("api", s.capacity.api)}</section>
            <section><h2 className="mb-1 font-semibold">MCP servers (40)</h2>{grid("mcp", s.capacity.mcp)}</section>
            <p className="text-xs text-emerald-200/60">Every enabled API key becomes a hive member on the next question; every MCP server appears on the roster. The hive's address check at /portal/samuel-goldman shows the count.</p>
          </>
        )}
      </div>
    </AppShell>
  );
}
