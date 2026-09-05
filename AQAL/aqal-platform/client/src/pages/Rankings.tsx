import { Link } from "wouter";
import { THERAPY_SCORES } from "@shared/therapyScores";
import { therapySlug, therapyDisplay } from "@shared/seo";
import { THERAPY_KIND } from "@shared/therapyKindMap";
import { KIND_PROFILES } from "@/lib/therapyKinds";
import { DeepFrame, DeepDisclosure, DeepCta, Body, H2, Card, Label, Gold, JADE, CHAMPAGNE, MUTED } from "@/components/DeepPage";

export default function Rankings() {
  return (
    <DeepFrame
      crumb={<><Gold href="/protocols">Protocol Library</Gold>{" · "}The Rankings</>}
      h1="Every protocol, scored: the open rankings"
      videoLabel="The Protocol Rankings"
    >
      <Body>
        All {THERAPY_SCORES.length} mapped protocols, scored 0–100 by one published editorial formula:{" "}
        <b style={{ color: "#F1EADB" }}>40% evidence component · 20% durability · 15% breadth · 15% speed · 10% ease</b>.
        Every component comes from the library's mapped roles, lines, and kind profiles; nothing is a customer rating,
        paid placement, or personal-outcome prediction. Identical mapped profiles tie and sort alphabetically.
      </Body>
      <H2>How to read it</H2>
      <Body>
        The score summarizes this library's model; it does not decide which protocol any person should use. Fit depends
        on the target line, context, contraindications, burden, preferences, and qualified guidance where clinical care
        is involved. Each row links to the full scorecard and the protocol's evidence page.
      </Body>
      <H2>The table</H2>
      <div style={{ overflowX: "auto" }}>
        {THERAPY_SCORES.map((score) => (
          <Card key={score.therapy} accent={score.rank <= 10 ? JADE : CHAMPAGNE}>
            <Label color={score.rank <= 10 ? JADE : CHAMPAGNE}>
              #{score.rank} · {score.total}/100 · {KIND_PROFILES[THERAPY_KIND[score.therapy] ?? "skill"]?.label ?? ""}
            </Label>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: "18px", color: "#F1EADB", margin: "0 0 4px" }}>
              <Link href={`/protocol/${therapySlug(score.therapy)}/score`} style={{ color: "#F1EADB" }}>
                {therapyDisplay(score.therapy).split(" (")[0]}
              </Link>
            </p>
            <p style={{ fontSize: "12.5px", lineHeight: 1.6, color: MUTED, margin: 0 }}>
              targets {score.primaryLines.length ? score.primaryLines.join(", ") : score.secondaryLines.join(", ")} ·{" "}
              E{score.components.evidence} D{score.components.durability} B{score.components.breadth} S{score.components.speed} Ease{score.components.ease} ·{" "}
              <Link href={`/protocol/${therapySlug(score.therapy)}/score`} style={{ color: "#E0C68C" }}>full scorecard →</Link>
            </p>
          </Card>
        ))}
      </div>
      <DeepDisclosure text="Scores are AQAL's transparent editorial composite over mapped data — not customer ratings, clinical recommendations, or outcome guarantees. Per-study citations remain on each protocol's evidence page." />
      <DeepCta heading="The highest editorial score is not automatically the right fit." body="Measure the target, review the evidence and burden, and use qualified clinical guidance where applicable." />
    </DeepFrame>
  );
}
