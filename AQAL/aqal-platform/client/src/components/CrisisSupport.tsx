// ============================================================
// CRISIS SUPPORT — shown when the safety net catches crisis language
// ============================================================
// Warm, direct, zero judgment. Real resources first; the platform's coaching
// voice steps back. Dismissible — support offered, never forced.

import { CRISIS_RESOURCES } from "@shared/growthEngine";

export default function CrisisSupport({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" style={{ background: "rgba(10,8,5,0.85)" }}>
      <div className="w-full max-w-md rounded-2xl border p-6" style={{ background: "#1B1610", borderColor: "rgba(155,192,178,0.4)" }}>
        <p className="text-[0.62rem] uppercase tracking-[0.2em] mb-2" style={{ fontFamily: "'JetBrains Mono', monospace", color: "#9BC0B2" }}>
          Before anything else
        </p>
        <h3 className="text-xl mb-2" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, color: "#F1EADB" }}>
          What you just shared matters more than any assessment.
        </h3>
        <p className="text-sm leading-relaxed mb-4" style={{ color: "#CFC5B0" }}>
          Something in what you wrote sounds heavy — maybe heavier than an app should be holding alone. Talking to a
          real human, today, is the strongest move available. These are free, confidential, and answered by people who
          do this well:
        </p>
        <div className="space-y-2 mb-4">
          {CRISIS_RESOURCES.map((r) => (
            <a key={r.name} href={r.url} target="_blank" rel="noreferrer"
              className="block rounded-lg border px-3 py-2 no-underline hover:opacity-90"
              style={{ borderColor: "rgba(241,234,219,0.12)", background: "rgba(155,192,178,0.06)" }}>
              <span className="block text-sm font-semibold" style={{ color: "#F1EADB" }}>{r.name}</span>
              <span className="block text-xs" style={{ fontFamily: "'JetBrains Mono', monospace", color: "#9BC0B2" }}>{r.contact}</span>
            </a>
          ))}
        </div>
        <p className="text-xs leading-relaxed mb-4" style={{ color: "#9C8F79" }}>
          Your answer is saved and nothing about your membership changes. If we misread the moment — that happens —
          just close this and carry on.
        </p>
        <button onClick={onClose}
          className="w-full rounded-lg py-3 text-xs uppercase tracking-widest font-bold"
          style={{ fontFamily: "'JetBrains Mono', monospace", background: "rgba(241,234,219,0.08)", color: "#F1EADB", border: "1px solid rgba(241,234,219,0.15)" }}>
          I'm okay — continue
        </button>
      </div>
    </div>
  );
}
