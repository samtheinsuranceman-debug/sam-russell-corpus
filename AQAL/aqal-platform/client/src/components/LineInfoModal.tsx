// ============================================================
// LINE INFO MODAL — the click-to-learn popup for any of the 32
// lines: definition, the researchers behind it, how measurable it
// is, its relationship to g, and whether the visitor has likely
// ever been tested for it. Closes on backdrop, X, or Escape.
// ============================================================
import { useEffect } from "react";
import { LINE_ENCYCLOPEDIA, G_BAND_LABEL } from "@/lib/lineEncyclopedia";
import { LINE_MEANING } from "@/lib/lineMeaning";

const INK = "#141009";
const INK2 = "#1B1610";
const CREAM = "#F1EADB";
const CREAM2 = "#CFC5B0";
const MUTED = "#9C8F79";
const CHAMPAGNE = "#E0C68C";
const EMBER = "#E2604A";
const LINE_C = "rgba(241,234,219,0.12)";
const mono = { fontFamily: "'JetBrains Mono', monospace" } as const;
const serif = { fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 } as const;

export default function LineInfoModal({ line, onClose }: { line: string | null; onClose: () => void }) {
  useEffect(() => {
    if (!line) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [line, onClose]);

  if (!line) return null;
  const info = LINE_ENCYCLOPEDIA[line];
  if (!info) return null;
  const band = G_BAND_LABEL[info.g];
  const JADE = "#9BC0B2";
  // Plain-English verdict on the g relationship — no jargon required.
  const gVerdict =
    info.g === "g-cluster" ? "Part of general intelligence (g) — IQ tests DO measure this line."
    : info.g === "partially-linked" ? "Partially overlaps g — an IQ score hints at it but doesn't capture it."
    : "NOT part of general intelligence — an IQ test cannot see this line at all.";
  const oddsPct = Math.min(100, Math.max(0.4, (info.testedOdds / 1000) * 100));
  const meaning = LINE_MEANING[line];

  return (
    <div className="fixed inset-0 z-[9990] flex items-start justify-center p-2 pt-2 sm:p-4 sm:pt-3"
      role="dialog" aria-modal="true" aria-label={`About the ${line} line`}
      onClick={onClose}
      style={{ background: "rgba(10,8,5,0.82)", backdropFilter: "blur(3px)" }}>
      <div onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[680px] max-h-[96vh] overflow-y-auto rounded-2xl overscroll-contain"
        style={{ background: `linear-gradient(180deg,${INK2},${INK})`, border: `1px solid ${CHAMPAGNE}44`, boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}>
        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-1">
            <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.24em", textTransform: "uppercase", color: CHAMPAGNE }}>
              One of the thirty-two lines
            </p>
            <button onClick={onClose} aria-label="Close"
              style={{ ...mono, fontSize: "16px", color: MUTED, background: "none", border: 0, cursor: "pointer", lineHeight: 1 }}>
              ✕
            </button>
          </div>
          <h2 style={{ ...serif, fontSize: "clamp(28px,4.5vw,40px)", lineHeight: 1.05, color: CREAM, margin: "0 0 12px" }}>{line}</h2>

          {/* Definition */}
          <p style={{ color: CREAM2, fontSize: "15.5px", lineHeight: 1.65, marginBottom: "20px" }}>{info.def}</p>

          {/* The researchers */}
          <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: CHAMPAGNE, marginBottom: "8px" }}>
            The research behind it
          </p>
          <div className="space-y-2 mb-5">
            {info.researchers.map((r) => (
              <p key={r.name} style={{ fontSize: "13.5px", lineHeight: 1.55, color: CREAM2, margin: 0 }}>
                <b style={{ color: CREAM }}>{r.name}</b> — {r.note}
              </p>
            ))}
          </div>

          {/* How it's measured */}
          <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: CHAMPAGNE, marginBottom: "6px" }}>
            How measurable is it?
          </p>
          <p style={{ color: CREAM2, fontSize: "13.5px", lineHeight: 1.6, marginBottom: "18px" }}>{info.measurement}</p>

          {/* g relationship */}
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span style={{ ...mono, fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", padding: "6px 12px", borderRadius: "999px", color: band.color, border: `1px solid ${band.color}55`, background: `${band.color}11` }}>
              {band.label}
            </span>
          </div>
          <p style={{ color: CREAM, fontSize: "13.5px", lineHeight: 1.6, marginBottom: "4px", fontWeight: 600 }}>{gVerdict}</p>
          <p style={{ color: CREAM2, fontSize: "13.5px", lineHeight: 1.6, marginBottom: "18px" }}>{info.gNote}</p>

          {/* Ever tested? — the 1-in-1,000 odds meter */}
          <div style={{ border: `1px solid ${EMBER}44`, borderLeft: `3px solid ${EMBER}`, borderRadius: "10px", background: "rgba(226,96,74,0.05)", padding: "14px 16px", marginBottom: "16px" }}>
            <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: EMBER, marginBottom: "5px" }}>
              Have you ever been tested for this?
            </p>
            <div className="flex items-baseline gap-2 flex-wrap" style={{ marginBottom: "6px" }}>
              <span style={{ ...serif, fontSize: "26px", color: CREAM, lineHeight: 1 }}>
                ~{info.testedOdds.toLocaleString()} in 1,000
              </span>
              <span style={{ ...mono, fontSize: "10px", color: MUTED }}>
                adults have ever been formally measured on this line (our estimate)
              </span>
            </div>
            <div aria-hidden="true" style={{ height: "6px", borderRadius: "999px", background: "rgba(241,234,219,0.10)", overflow: "hidden", marginBottom: "8px" }}>
              <div style={{ height: "100%", width: `${oddsPct}%`, borderRadius: "999px", background: info.testedOdds >= 500 ? JADE : EMBER }} />
            </div>
            <p style={{ color: CREAM2, fontSize: "13.5px", lineHeight: 1.6, margin: 0 }}>{info.everTested}</p>
          </div>

          {/* Why measure it */}
          <div style={{ border: `1px solid ${CHAMPAGNE}33`, borderLeft: `3px solid ${CHAMPAGNE}`, borderRadius: "10px", background: "rgba(224,198,140,0.05)", padding: "14px 16px", marginBottom: "20px" }}>
            <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: CHAMPAGNE, marginBottom: "5px" }}>
              What a measurement buys you
            </p>
            <p style={{ color: CREAM2, fontSize: "13.5px", lineHeight: 1.6, margin: 0 }}>{info.benefit}</p>
          </div>

          {meaning && (
            <>
              <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: CHAMPAGNE, margin: "0 0 10px", paddingTop: "6px", borderTop: `1px solid ${LINE_C}` }}>
                Keep reading — what this line could mean for you
              </p>
              <div className="space-y-4" style={{ marginBottom: "20px" }}>
                <div>
                  <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: JADE, margin: "0 0 4px" }}>For your life and outcomes</p>
                  <p style={{ color: CREAM2, fontSize: "13.5px", lineHeight: 1.65, margin: 0 }}>{meaning.forYou}</p>
                </div>
                <div>
                  <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: JADE, margin: "0 0 4px" }}>Used consciously, every day</p>
                  <p style={{ color: CREAM2, fontSize: "13.5px", lineHeight: 1.65, margin: 0 }}>{meaning.lived}</p>
                </div>
                <div>
                  <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: JADE, margin: "0 0 4px" }}>What it changes for the people you love</p>
                  <p style={{ color: CREAM2, fontSize: "13.5px", lineHeight: 1.65, margin: 0 }}>{meaning.others}</p>
                </div>
                <div>
                  <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: EMBER, margin: "0 0 4px" }}>The cost of never measuring it</p>
                  <p style={{ color: CREAM2, fontSize: "13.5px", lineHeight: 1.65, margin: 0 }}>{meaning.cost}</p>
                </div>
                <div>
                  <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: CHAMPAGNE, margin: "0 0 4px" }}>How new is this science?</p>
                  <p style={{ color: CREAM2, fontSize: "13.5px", lineHeight: 1.65, margin: 0 }}>{meaning.history}</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {meaning.personas.map((pe) => (
                    <div key={pe.tag} style={{ border: `1px solid ${LINE_C}`, borderRadius: "10px", background: "rgba(241,234,219,0.02)", padding: "12px 14px" }}>
                      <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: CHAMPAGNE, margin: "0 0 5px" }}>{pe.tag}</p>
                      <p style={{ color: CREAM2, fontSize: "12.5px", lineHeight: 1.6, margin: 0 }}>{pe.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* CTA */}
          <div className="flex items-center gap-3 flex-wrap">
            <a href={`/line/${line.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
              style={{ ...mono, fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, padding: "12px 18px", borderRadius: "8px", background: CHAMPAGNE, color: INK, textDecoration: "none" }}>
              Read the full breakdown →
            </a>
            <a href="/assessment"
              style={{ ...mono, fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, padding: "12px 18px", borderRadius: "8px", background: "transparent", color: CHAMPAGNE, border: `1px solid ${CHAMPAGNE}66`, textDecoration: "none" }}>
              Measure yours
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
