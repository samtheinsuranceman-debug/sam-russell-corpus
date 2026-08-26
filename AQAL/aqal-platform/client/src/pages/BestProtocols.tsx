// ============================================================
// BEST-PROTOCOLS COMBO PAGES — /best/:kind/:line (88 URLs, one
// per (kind, line) combination that exists in the evidence map).
// "Best physical protocols for the Empathic capacity" — the
// library's honest answer to the searches people actually run.
// ============================================================
import { useParams } from "wouter";
import { bestComboFromSlug, engineLineSlug, therapySlug, therapyDisplay } from "@shared/seo";
import { THERAPY_KIND } from "@shared/therapyKindMap";
import { KIND_PROFILES } from "@/lib/therapyKinds";
import { THERAPY_LINE_MAP } from "@shared/therapyLineMap";
import { DeepFrame, DeepDisclosure, DeepCta, Card, CardText, Body, H2, Label, Gold, JADE, CHAMPAGNE } from "@/components/DeepPage";
import NotFound from "@/pages/NotFound";

export default function BestProtocols() {
  const params = useParams<{ kind: string; line: string }>();
  const combo = bestComboFromSlug(params.kind ?? "", params.line ?? "");
  if (!combo) return <NotFound />;
  const { kind, line } = combo;
  const prof = KIND_PROFILES[kind];
  if (!prof) return <NotFound />;
  const rank = { PRIMARY: 0, SECONDARY: 1, TERTIARY: 2 } as Record<string, number>;
  const matches = THERAPY_LINE_MAP
    .filter((t) => t.line === line && (THERAPY_KIND[t.therapy] ?? "skill") === kind)
    .sort((x, y) => rank[x.role] - rank[y.role]);
  if (matches.length === 0) return <NotFound />;

  return (
    <DeepFrame
      crumb={<><Gold href="/protocols">Protocol Library</Gold>{" · "}<Gold href={`/kind/${kind}`}>{prof.label}</Gold>{" · "}{line}</>}
      h1={`The best ${kind} protocols for ${line}`}
      videoLabel={`${prof.label} for ${line}`}
    >
      <Body>
        "Best" earns its place in this title the only way we allow: every protocol below is a{" "}
        {prof.label.toLowerCase()} intervention with a peer-reviewed mapping to the {line} capacity — ranked by the
        strength of its mapped role, not by popularity or payout. {matches.length === 1
          ? "The evidence map holds exactly one qualifying protocol, and honesty says so rather than padding the list."
          : `${matches.length} protocols qualify.`}
      </Body>
      <H2>The ranked list</H2>
      {matches.map((m, i) => (
        <Card key={m.therapy} accent={m.role === "PRIMARY" ? JADE : CHAMPAGNE}>
          <Label color={m.role === "PRIMARY" ? JADE : CHAMPAGNE}>#{i + 1} · {m.role} mapping</Label>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: "18px", color: "#F1EADB", margin: "0 0 4px" }}>
            <Gold href={`/protocol/${therapySlug(m.therapy)}`}>{therapyDisplay(m.therapy).split(" (")[0]}</Gold>
          </p>
          <CardText>{m.capacity} — finding: {m.finding}</CardText>
        </Card>
      ))}
      <H2>What this kind demands</H2>
      <Body>
        Family-typical dose: {prof.dose} Honest demands: {prof.intensity} Durability: {prof.durability} Each
        protocol's own page carries its seven deep pages — first week, evidence, dose, who it's for, mistakes,
        results, and stack.
      </Body>
      <H2>The honest caveat on "best"</H2>
      <Body>
        Best for the {line} capacity is not best for YOU unless {line} is actually your weakest load-bearing line —
        the most disciplined way to waste a season is a great protocol aimed at the wrong target. Other kinds also
        build this capacity; the <Gold href={`/capacity/${engineLineSlug(line)}`}>full {line} page</Gold> shows every
        mapped route.
      </Body>
      <DeepDisclosure text={`Rankings order the map's cited roles (primary before secondary before adjunct) within one protocol kind.`} />
      <DeepCta heading={`Is ${line} where your season should go?`} body="Measure all 32 lines first. Then this list stops being content and becomes a prescription." />
    </DeepFrame>
  );
}
