// ============================================================
// /portal/sources — where every number comes from.
// Reads the registries back through sources.all; renders nothing it computes.
// ============================================================
import { AppShell } from "@/components/AppShell";
import { trpc } from "@/lib/trpc";

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
const usd = (n: number) => n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export default function Sources() {
  const q = trpc.sources.all.useQuery(undefined, { staleTime: 5 * 60_000 });
  const d = q.data;
  return (
    <AppShell title="Sources" subtitle="Every figure on this site, with the document it came from and the date it took effect.">
      <div className="mx-auto max-w-5xl space-y-8 p-4 text-sm">
        {q.isLoading && <p>Loading the registries…</p>}
        {q.error && <p className="text-amber-300">Could not read the registries: {q.error.message}</p>}
        {d && (
          <>
            <section aria-labelledby="rules">
              <h2 id="rules" className="mb-2 text-base font-semibold">Federal tax rule sets</h2>
              <div className="overflow-x-auto rounded-md border border-emerald-900/40">
                <table className="w-full tabular-nums">
                  <thead className="text-left text-xs uppercase tracking-wide text-emerald-200/70">
                    <tr><th className="p-2">Tax year</th><th className="p-2">Version</th><th className="p-2">Effective</th><th className="p-2">SS wage base</th><th className="p-2">COLA</th><th className="p-2">Source</th></tr>
                  </thead>
                  <tbody>
                    {d.taxRules.map((r) => (
                      <tr key={r.version} className={r.current ? "bg-emerald-950/40" : ""}>
                        <td className="p-2">{r.taxYear}{r.current ? " (current)" : ""}</td>
                        <td className="p-2 font-mono text-xs">{r.version}</td>
                        <td className="p-2">{r.effectiveFrom}</td>
                        <td className="p-2">{usd(r.socialSecurity.wageBase)}</td>
                        <td className="p-2">{pct(r.socialSecurity.cola)}</td>
                        <td className="p-2 text-xs">{r.source}<br /><span className="text-emerald-200/70">{r.socialSecurity.source}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section aria-labelledby="limits">
              <h2 id="limits" className="mb-2 text-base font-semibold">Retirement plan limits</h2>
              <p>{d.retirementLimits.count} limits for tax year {d.retirementLimits.taxYear}, from {d.retirementLimits.notice} ({d.retirementLimits.release}), effective {d.retirementLimits.effective}. <a className="underline" href={d.retirementLimits.url} target="_blank" rel="noreferrer">Notice</a></p>
              {d.retirementLimits.stale && <p className="mt-1 text-amber-300">{d.retirementLimits.note}</p>}
            </section>

            <section aria-labelledby="feeds">
              <h2 id="feeds" className="mb-2 text-base font-semibold">Live rate feeds</h2>
              <p className="mb-2">FRED {d.liveFeeds.fredConfigured ? "configured (API)" : "keyless (public CSV path)"} · {d.liveFeeds.benchmarks.length} benchmarks</p>
              <div className="overflow-x-auto rounded-md border border-emerald-900/40">
                <table className="w-full tabular-nums">
                  <tbody>
                    {d.liveFeeds.benchmarks.map((b, i) => (
                      <tr key={i}>
                        {Object.entries(b as Record<string, unknown>).map(([k, v]) => (
                          <td key={k} className="p-2"><span className="text-xs text-emerald-200/70">{k}: </span>{String(v)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section aria-labelledby="verifiers">
              <h2 id="verifiers" className="mb-2 text-base font-semibold">Verification engines (latest outcome the advisor knows)</h2>
              <ul className="grid gap-1 sm:grid-cols-2">
                {d.verifiers.map((v) => (
                  <li key={v.engine} className="flex items-center justify-between rounded border border-emerald-900/40 px-2 py-1">
                    <span className="font-mono text-xs">{v.engine}</span>
                    <span className={v.outcome === "pass" ? "text-emerald-300" : v.outcome === "fail" ? "text-red-300" : "text-emerald-200/60"}>
                      {v.outcome}{v.at ? ` · ${new Date(v.at).toLocaleDateString()}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-1 text-xs text-emerald-200/70">"unverified" means no CI run has reported into the hive yet (scripts/inform-verification.ts).</p>
            </section>

            <section aria-labelledby="authorities">
              <h2 id="authorities" className="mb-2 text-base font-semibold">Tax authority panel</h2>
              <ul className="grid gap-2 sm:grid-cols-2">
                {d.taxAuthorities.map((s) => (
                  <li key={s.id} className="rounded border border-emerald-900/40 p-2">
                    <a className="font-medium underline" href={s.url} target="_blank" rel="noreferrer">{s.name}</a>
                    <div className="text-xs text-emerald-200/70">{s.org} · {s.method}</div>
                    <div className="text-xs">{s.publishes}</div>
                  </li>
                ))}
              </ul>
            </section>
            <p className="text-xs text-emerald-200/60">Generated {new Date(d.generatedAt).toLocaleString()}. This page reads the registries; it computes nothing.</p>
          </>
        )}
      </div>
    </AppShell>
  );
}
