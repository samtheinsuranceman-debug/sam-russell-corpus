// ============================================================
// Claim → Evidence registry
// ============================================================
// Turns "trust me" into "check me." Every scientific claim the report and the
// coaching make maps to a real cluster in the Research Library. A <Cite> in the
// UI links straight to that cluster's anchor, so a reader can verify the science
// behind a sentence in one click. No competitor can copy this — it requires a
// real, verified library on the other end of the link.
//
// Each entry's `cluster` MUST be a real id rendered in ResearchLibrary.tsx
// (TRAINABILITY_CLUSTERS or PRACTICE_EVIDENCE). The library reads the URL hash
// #src-<cluster>, switches to the right tab, opens the cluster, and scrolls.

export type CitationKey =
  | "weakest-link"
  | "oring"
  | "liebig"
  | "toc"
  | "centrality"
  | "keystone"
  | "leverage"
  | "matching"
  | "trainable-volition"
  | "trainable-emotional"
  | "trainable-social"
  | "trainable-fluid"
  | "trainable-spatial";

type CitationRef = {
  cluster: string; // real cluster id (anchor = src-<cluster>)
  label: string;   // short human label for the tooltip
};

export const CITATIONS: Record<CitationKey, CitationRef> = {
  "weakest-link": { cluster: "sys-weakest-link", label: "Weakest-link & bottleneck theory (Liebig, O-Ring, Theory of Constraints)" },
  oring:          { cluster: "sys-weakest-link", label: "Kremer's O-Ring — multiplicative quality" },
  liebig:         { cluster: "sys-weakest-link", label: "Liebig's Law of the Minimum — the limiting resource" },
  toc:            { cluster: "sys-weakest-link", label: "Theory of Constraints — the throughput bottleneck" },
  centrality:     { cluster: "sys-centrality", label: "Network centrality — controlling & bridge nodes" },
  keystone:       { cluster: "sys-mutualism-keystone", label: "Keystone & mutualism effects" },
  leverage:       { cluster: "sys-leverage", label: "Leverage-point theory" },
  matching:       { cluster: "sys-matching", label: "Complementary matching" },
  "trainable-volition":   { cluster: "volitional", label: "Volition & self-regulation are trainable" },
  "trainable-emotional":  { cluster: "emotional", label: "Emotional intelligence is trainable" },
  "trainable-social":     { cluster: "interpersonal", label: "Interpersonal skill is trainable" },
  "trainable-fluid":      { cluster: "fluid-intelligence", label: "Fluid reasoning is trainable (with honest limits)" },
  "trainable-spatial":    { cluster: "spatial", label: "Spatial intelligence is trainable and transfers" },
};

// The route + anchor a citation points at.
export function citationHref(key: CitationKey): string {
  const ref = CITATIONS[key];
  return `/research-library#src-${ref.cluster}`;
}

export function citationLabel(key: CitationKey): string {
  return CITATIONS[key]?.label ?? "Research Library";
}
