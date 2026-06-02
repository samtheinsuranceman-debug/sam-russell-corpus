import { Suspense, useState, type ComponentType, type LazyExoticComponent } from "react";

export type HubTab = {
  id: string;
  label: string;
  element: LazyExoticComponent<ComponentType<any>>;
};

/**
 * ToggleHub — mounts several existing tool pages as toggles/tabs under one parent route.
 * The child pages are unchanged; this only nests them so they share one window.
 */
export default function ToggleHub({ title, subtitle, tabs }: { title: string; subtitle?: string; tabs: HubTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id);
  const Active = tabs.find((t) => t.id === active)?.element;
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="border-b border-slate-800 px-6 py-5">
        <h1 className="text-2xl font-semibold text-amber-400">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
      </div>
      <div className="flex flex-wrap gap-2 border-b border-slate-800 bg-slate-900/40 px-6 py-3">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            aria-selected={active === t.id}
            className={
              "rounded-full px-4 py-1.5 text-sm transition " +
              (active === t.id ? "bg-amber-500 text-slate-950 font-medium" : "bg-slate-800 text-slate-300 hover:bg-slate-700")
            }
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="p-2">
        <Suspense fallback={<div className="p-10 text-center text-slate-400">Loading…</div>}>
          {Active && <Active />}
        </Suspense>
      </div>
    </div>
  );
}
