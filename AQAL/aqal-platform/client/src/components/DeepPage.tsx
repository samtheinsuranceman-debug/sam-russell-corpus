// ============================================================
// DEEP-PAGE KIT — the shared frame for the Aug-2026 deep-page
// families (myth/pair/line/practice/goal/kind/wing/capacity
// sub-pages + best-protocol combos). One palette, one layout
// grammar, one honesty-disclosure pattern, one CTA — so ~3,000
// pages stay visually and ethically consistent from one file.
// ============================================================
import { Link } from "wouter";
import { PublicHeader, PublicFooter } from "@/components/PublicLayout";
import PageVideo from "@/components/PageVideo";

export const INK = "#141009";
export const CREAM = "#F1EADB";
export const CREAM2 = "#CFC5B0";
export const MUTED = "#9C8F79";
export const CHAMPAGNE = "#E0C68C";
export const JADE = "#9BC0B2";
export const EMBER = "#E2604A";
export const LINE_C = "rgba(241,234,219,0.12)";
export const mono = { fontFamily: "'JetBrains Mono', monospace" } as const;
export const serif = { fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 } as const;

export function Label({ children, color = CHAMPAGNE }: { children: React.ReactNode; color?: string }) {
  return <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color, margin: "0 0 8px" }}>{children}</p>;
}

export function Card({ children, accent }: { children: React.ReactNode; accent?: string }) {
  return (
    <div className="rounded-xl p-4 mb-3" style={{ border: `1px solid ${LINE_C}`, borderLeft: accent ? `3px solid ${accent}` : `1px solid ${LINE_C}`, background: "rgba(241,234,219,0.02)" }}>
      {children}
    </div>
  );
}

export function Body({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: "14.5px", lineHeight: 1.72, color: CREAM2, margin: "0 0 14px" }}>{children}</p>;
}

export function H2({ children }: { children: React.ReactNode }) {
  return <h2 style={{ ...serif, fontSize: "26px", color: CREAM, margin: "30px 0 10px" }}>{children}</h2>;
}

export function CardText({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: "14px", lineHeight: 1.7, color: CREAM2, margin: 0 }}>{children}</p>;
}

export function Gold({ children, href }: { children: React.ReactNode; href: string }) {
  return <Link href={href} style={{ color: CHAMPAGNE }}>{children}</Link>;
}

export function SiblingNav({ base, subs, current, labels }: { base: string; subs: readonly string[]; current: string; labels: Record<string, string> }) {
  return (
    <div className="flex items-center gap-2 flex-wrap mb-8">
      {subs.map((s) => (
        <Link key={s} href={`${base}/${s}`}
          style={{ ...mono, fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", padding: "6px 12px", borderRadius: "999px", textDecoration: "none",
            color: s === current ? INK : CHAMPAGNE, background: s === current ? CHAMPAGNE : `${CHAMPAGNE}11`, border: `1px solid ${CHAMPAGNE}55` }}>
          {labels[s]}
        </Link>
      ))}
    </div>
  );
}

export function DeepDisclosure({ text }: { text: string }) {
  return (
    <p style={{ ...mono, fontSize: "10.5px", lineHeight: 1.7, color: MUTED, margin: "26px 0 0", borderTop: `1px solid ${LINE_C}`, paddingTop: "14px" }}>
      HONESTY NOTE — {text} Characterizations are literature-typical or labeled analysis, never personal guarantees;
      your numbers come from your assessment, not from a page.
    </p>
  );
}

export function DeepCta({ heading, body }: { heading: string; body: string }) {
  return (
    <div className="mt-10 rounded-2xl p-6 text-center" style={{ border: `1px solid ${CHAMPAGNE}44`, background: `${CHAMPAGNE}0a` }}>
      <p style={{ ...serif, fontSize: "22px", color: CREAM, margin: "0 0 6px" }}>{heading}</p>
      <p style={{ fontSize: "13.5px", lineHeight: 1.65, color: CREAM2, margin: "0 0 14px" }}>{body}</p>
      <Link href="/assessment" style={{ ...mono, display: "inline-block", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", padding: "12px 22px", borderRadius: "6px", background: CHAMPAGNE, color: INK, textDecoration: "none", fontWeight: 600 }}>
        Begin the assessment
      </Link>
    </div>
  );
}

// "Go deeper" strip for PARENT pages — links each detail page to its
// deep sub-pages so the ~3,000 new URLs are internally linked, not
// sitemap-only. Renders as a compact chip row above the footer.
export function GoDeeper({ base, subs, labels }: { base: string; subs: readonly string[]; labels: Record<string, string> }) {
  return (
    <div className="max-w-[860px] mx-auto px-6 pb-12">
      <div className="rounded-xl p-4" style={{ border: `1px solid ${LINE_C}`, background: "rgba(241,234,219,0.02)" }}>
        <Label>Go deeper on this page</Label>
        <div className="flex items-center gap-2 flex-wrap">
          {subs.map((s) => (
            <Link key={s} href={`${base}/${s}`}
              style={{ ...mono, fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", padding: "6px 12px", borderRadius: "999px", textDecoration: "none", color: CHAMPAGNE, border: `1px solid ${CHAMPAGNE}55`, background: `${CHAMPAGNE}0d` }}>
              {labels[s]}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DeepFrame({ crumb, h1, videoLabel, children }: {
  crumb: React.ReactNode; h1: string; videoLabel: string; children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen" style={{ background: INK }}>
      <PublicHeader />
      <div className="max-w-[860px] mx-auto px-6 py-14">
        <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.26em", textTransform: "uppercase", color: CHAMPAGNE, marginBottom: "10px" }}>{crumb}</p>
        <h1 style={{ ...serif, fontSize: "clamp(30px,5vw,48px)", lineHeight: 1.06, color: CREAM, margin: "0 0 12px" }}>{h1}</h1>
        <PageVideo label={videoLabel} />
        {children}
      </div>
      <PublicFooter />
    </div>
  );
}
