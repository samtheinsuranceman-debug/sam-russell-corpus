// ============================================================
// KIND DETAIL — /kind/:id — one page per protocol kind: the
// literature-typical dose, intensity, and durability profile,
// plus every protocol in the library belonging to the kind.
// ============================================================
import { Link, useParams } from "wouter";
import { PublicHeader, PublicFooter } from "@/components/PublicLayout";
import { KIND_PROFILES, THERAPY_KIND } from "@/lib/therapyKinds";
import { THERAPY_LINE_MAP } from "@shared/therapyLineMap";
import { therapySlug, therapyDisplay, KIND_IDS } from "@shared/seo";
import NotFound from "@/pages/NotFound";

const INK = "#141009";
const CREAM = "#F1EADB";
const CREAM2 = "#CFC5B0";
const MUTED = "#9C8F79";
const CHAMPAGNE = "#E0C68C";
const JADE = "#9BC0B2";
const LINE_C = "rgba(241,234,219,0.12)";
const mono = { fontFamily: "'JetBrains Mono', monospace" } as const;
const serif = { fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 } as const;

function Label({ children, color = CHAMPAGNE }: { children: React.ReactNode; color?: string }) {
  return <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color, margin: "0 0 8px" }}>{children}</p>;
}

export default function KindDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id ?? "";
  const profile = KIND_PROFILES[id];
  if (!profile || !KIND_IDS.includes(id)) return <NotFound />;
  const members = Object.entries(THERAPY_KIND)
    .filter(([, k]) => k === id)
    .map(([name]) => name)
    .sort();
  const idx = KIND_IDS.indexOf(id);
  const prev = KIND_IDS[(idx + KIND_IDS.length - 1) % KIND_IDS.length];
  const next = KIND_IDS[(idx + 1) % KIND_IDS.length];
  const lineCount = (name: string) => THERAPY_LINE_MAP.filter((e) => e.therapy === name).length;

  return (
    <div className="min-h-screen" style={{ background: INK }}>
      <PublicHeader />
      <div className="max-w-[760px] mx-auto px-6 py-14">
        <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.26em", textTransform: "uppercase", color: CHAMPAGNE, marginBottom: "10px" }}>
          Protocol kinds · {idx + 1} of {KIND_IDS.length} · <Link href="/protocols" style={{ color: CHAMPAGNE }}>full library</Link>
        </p>
        <h1 style={{ ...serif, fontSize: "clamp(28px,5vw,46px)", lineHeight: 1.08, color: CREAM, margin: "0 0 14px" }}>
          {profile.label}
        </h1>
        <p style={{ fontSize: "15px", lineHeight: 1.8, color: CREAM2, margin: "0 0 26px" }}>{profile.what}</p>

        <div className="space-y-4 mb-8">
          <div className="rounded-2xl p-6" style={{ border: `1px solid ${LINE_C}`, background: "rgba(241,234,219,0.02)" }}>
            <Label>The typical dose</Label>
            <p style={{ fontSize: "14px", lineHeight: 1.75, color: CREAM2, margin: 0 }}>{profile.dose}</p>
          </div>
          <div className="rounded-2xl p-6" style={{ border: `1px solid ${LINE_C}`, background: "rgba(241,234,219,0.02)" }}>
            <Label>What it demands — honestly</Label>
            <p style={{ fontSize: "14px", lineHeight: 1.75, color: CREAM2, margin: 0 }}>{profile.intensity}</p>
          </div>
          <div className="rounded-2xl p-6" style={{ border: `1px solid ${JADE}33`, borderLeft: `3px solid ${JADE}`, background: "rgba(155,192,178,0.04)" }}>
            <Label color={JADE}>How long gains last — honestly</Label>
            <p style={{ fontSize: "14px", lineHeight: 1.75, color: CREAM2, margin: 0 }}>{profile.durability}</p>
          </div>
        </div>

        <p style={{ ...mono, fontSize: "10px", lineHeight: 1.7, color: MUTED, margin: "0 0 18px" }}>
          Literature-typical characterizations — typical, never personal guarantees. Protocols with well-pinned schedules
          carry their own overrides on their pages.
        </p>

        <Label>Every protocol of this kind — {members.length} in the library</Label>
        <div className="grid sm:grid-cols-2 gap-3 mb-8">
          {members.map((name) => (
            <Link key={name} href={`/protocol/${therapySlug(name)}`}
              className="rounded-xl border p-4 block"
              style={{ borderColor: LINE_C, background: "rgba(241,234,219,0.02)" }}>
              <p style={{ ...serif, fontSize: "15.5px", color: CREAM, margin: "0 0 4px" }}>{therapyDisplay(name).split(" (")[0]}</p>
              <p style={{ ...mono, fontSize: "9.5px", letterSpacing: "0.1em", textTransform: "uppercase", color: MUTED, margin: 0 }}>
                {lineCount(name)} line mapping{lineCount(name) === 1 ? "" : "s"} · cited
              </p>
            </Link>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Link href={`/kind/${prev}`} style={{ ...mono, fontSize: "10.5px", letterSpacing: "0.08em", textTransform: "uppercase", color: CHAMPAGNE }}>← {KIND_PROFILES[prev]?.label.split(" — ")[0].split(" / ")[0]}</Link>
          <Link href="/protocols" style={{ ...mono, fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: MUTED }}>all protocols</Link>
          <Link href={`/kind/${next}`} style={{ ...mono, fontSize: "10.5px", letterSpacing: "0.08em", textTransform: "uppercase", color: CHAMPAGNE }}>{KIND_PROFILES[next]?.label.split(" — ")[0].split(" / ")[0]} →</Link>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
