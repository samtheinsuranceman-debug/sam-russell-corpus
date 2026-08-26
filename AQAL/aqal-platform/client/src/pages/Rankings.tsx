// ============================================================
// RANKINGS — /rankings — all 156 protocols scored 0–100 by the
// open formula, full table, components on hover-free display.
// ============================================================
import { Link } from "wouter";
import { THERAPY_SCORES } from "@shared/therapyScores";
import { therapySlug, therapyDisplay } from "@shared/seo";
import { THERAPY_KIND } from "@shared/therapyKindMap";
import { KIND_PROFILES } from "@/lib/therapyKinds";
import { DeepFrame, DeepDisclosure, DeepCta, Body, H2, Card, CardText, Label, Gold, JADE, CHAMPAGNE, MUTED } from "@/components/DeepPage";

export default function Rankings() {
  return (
    <DeepFrame
      crumb={<><Gold href="/protocols">Protocol Library</Gold>{" · "}The Rankings</>}
      h1="Every protocol, scored: the open rankings"
      videoLabel="The Protocol Rankings"
    >
      <Body>
        All {THERAPY_SCORES.length} protocols in the library, scored 0–100 by one formula we publish in full:{" "}
        <b style={{ color: "#F1EADB" }}>40% evidence strength · 20% durability · 15% breadth · 15% speed ·
        10% ease of use</b>. Ease is deliberately the smallest weight — hard protocols that work outrank easy ones
        that don't. Every component is computed from the mapped data (roles, lines, kind profiles); nothing is
        hand-tuned, no protocol paid to be here, and protocols with identical mapped profiles score identically —
        ties are listed alphabetically and shown as what they are.
      </Body>
      <H2>How to read it</H2>
      <Body>
        The score answers "how good is this protocol at what it's for" — it does NOT answer "which should I run."
        That depends on which line is YOUR weakest load-bearing one, which is a{" "}
        <Gold href="/assessment">measurement question</Gold>. Each row links to the protocol's full scorecard —
        components, targeted lines, schedule, gain band, decay curve.
      </Body>
      <H2>The table</H2>
      <div style={{ overflowX: "auto" }}>
        {THERAPY_SCORES.map((s) => (
          <Card key={s.therapy} accent={s.rank <= 10 ? JADE : CHAMPAGNE}>
            <Label color={s.rank <= 10 ? JADE : CHAMPAGNE}>
              #{s.rank} · {s.total}/100 · {KIND_PROFILES[THERAPY_KIND[s.therapy] ?? "skill"]?.label ?? ""}
            </Label>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: "18px", color: "#F1EADB", margin: "0 0 4px" }}>
              <Link href={`/protocol/${therapySlug(s.therapy)}/score`} style={{ color: "#F1EADB" }}>
                {therapyDisplay(s.therapy).split(" (")[0]}
              </Link>
            </p>
            <p style={{ fontSize: "12.5px", lineHeight: 1.6, color: MUTED, margin: 0 }}>
              targets {s.primaryLines.length ? s.primaryLines.join(", ") : s.secondaryLines.join(", ")} ·
              {" "}E{s.components.evidence} D{s.components.durability} B{s.components.breadth} S{s.components.speed} Ease{s.components.ease} ·
              {" "}<Link href={`/protocol/${therapySlug(s.therapy)}/score`} style={{ color: "#E0C68C" }}>full scorecard →</Link>
            </p>
          </Card>
        ))}
      </div>
      <DeepDisclosure text={`Scores are the library's own composite over its mapped data — a transparent editorial instrument, not an outcome guarantee; per-study citations live on each protocol's evidence page.`} />
      <DeepCta heading="The #1 protocol for you isn't #1 on this list." body="It's the one aimed at your weakest load-bearing line. Measure all 32 first — then this table becomes a shopping list." />
    </DeepFrame>
  );
}
