// ============================================================
// THE SPHERE — the whole site as one shape. Twelve meridians (domains of a
// financial life) around, four latitudes (Facts → Erosion → Moves → Proof)
// in, the Plan Ledger at the centre. Every page is a point; click a point
// to go there, click a cell to zoom.
// ============================================================
import { useState } from "react";
import { Link } from "wouter";
import { AppShell } from "@/components/AppShell";
import { LATITUDES, MERIDIANS, SPHERE_POINTS, pointsAt, projectPoint, type LatitudeId, type MeridianId } from "@shared/sphere";

const CARD = "rounded-2xl border border-sky-400/20 bg-white/[0.04]";

export default function Sphere() {
  const [focus, setFocus] = useState<{ m: MeridianId; l: LatitudeId } | null>(null);
  const size = 560, c = size / 2, R = c - 24;
  return (
    <AppShell title="The Sphere">
      <div className="mx-auto max-w-6xl space-y-6 pb-16">
        <div className={`${CARD} p-6`}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-300/80">One shape</p>
          <h1 className="mt-1 text-2xl font-semibold text-white">The Sphere</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-300">Every page on this site is a point with two coordinates: the domain of your financial life (around) and the layer of work (in): what is true, what is eating it, what to do, and what the ledger proves happened. The same record sits at the centre of every point. Even on every side; zoom into any point and the structure repeats.</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
          <div className={`${CARD} p-4`}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="The Sphere navigator">
              {LATITUDES.map((l, i) => { const r = R * (1 - i / LATITUDES.length); return <circle key={l.id} cx={c} cy={c} r={r} fill="none" stroke="rgba(148,163,184,0.25)" />; })}
              {MERIDIANS.map((m) => { const a = (m.degree - 90) * (Math.PI / 180); return <g key={m.id}><line x1={c} y1={c} x2={c + Math.cos(a) * R} y2={c + Math.sin(a) * R} stroke="rgba(148,163,184,0.18)" /><text x={c + Math.cos(a) * (R + 14)} y={c + Math.sin(a) * (R + 14)} fontSize="10" fill="#cbd5e1" textAnchor="middle" dominantBaseline="middle">{m.label}</text></g>; })}
              {LATITUDES.map((l, i) => { const r = R * (1 - (i + 0.5) / LATITUDES.length); return <text key={l.id} x={c + 4} y={c - r} fontSize="9" fill="#64748b">{l.label}</text>; })}
              <circle cx={c} cy={c} r={10} fill="#a78bfa" /><text x={c} y={c + 24} fontSize="9" fill="#c4b5fd" textAnchor="middle">Plan Ledger</text>
              {SPHERE_POINTS.map((p) => { const xy = projectPoint(p); const x = c + xy.x * R, y = c + xy.y * R; return <Link key={p.path} href={p.path}><circle cx={x} cy={y} r={p.core ? 6 : 4} fill={p.core ? "#fbbf24" : "#38bdf8"} stroke="#0f172a" strokeWidth={1} className="cursor-pointer"><title>{p.title}</title></circle></Link>; })}
            </svg>
          </div>
          <div className="space-y-3">
            <div className={`${CARD} p-4`}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Zoom: pick a cell</p>
              <div className="mt-2 grid grid-cols-[auto_repeat(4,1fr)] gap-1 text-[11px]">
                <div />{LATITUDES.map((l) => <div key={l.id} className="text-center text-slate-400" title={l.question}>{l.label}</div>)}
                {MERIDIANS.map((m) => (<>
                  <div key={m.id} className="pr-2 text-right text-slate-300">{m.label}</div>
                  {LATITUDES.map((l) => { const n = pointsAt(m.id, l.id).length; const on = focus?.m === m.id && focus?.l === l.id; return <button key={`${m.id}-${l.id}`} type="button" onClick={() => setFocus({ m: m.id, l: l.id })} className={`rounded border px-1 py-1 ${on ? "border-sky-400/60 bg-sky-500/20 text-white" : n ? "border-white/10 text-slate-200 hover:bg-white/5" : "border-white/5 text-slate-600"}`}>{n || "·"}</button>; })}
                </>))}
              </div>
            </div>
            <div className={`${CARD} p-4`}>
              {focus ? (<>
                <p className="text-sm font-semibold text-white">{MERIDIANS.find((m) => m.id === focus.m)?.label} · {LATITUDES.find((l) => l.id === focus.l)?.label}</p>
                <p className="text-xs text-slate-400">{LATITUDES.find((l) => l.id === focus.l)?.question}</p>
                <ul className="mt-2 space-y-1 text-sm">{pointsAt(focus.m, focus.l).map((p) => <li key={p.path}><Link href={p.path} className="text-sky-300 hover:underline">{p.title}</Link>{p.core ? <span className="ml-2 rounded-full border border-amber-400/40 px-1.5 text-[10px] text-amber-300">core</span> : null}</li>)}{pointsAt(focus.m, focus.l).length === 0 && <li className="text-xs text-slate-500">Nothing placed here yet. This is where the next page for this domain and layer belongs.</li>}</ul>
              </>) : <p className="text-xs text-slate-500">{SPHERE_POINTS.length} pages placed on {MERIDIANS.length} × {LATITUDES.length} coordinates. The rest of the site is reached by zooming into the nearest point.</p>}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
