import { Link } from "wouter";
import { citationHref, citationLabel, type CitationKey } from "@shared/citations";

// A small superscript "check me" marker. Renders next to a scientific claim and
// links to the exact Research Library cluster that backs it. Deliberately quiet
// in the layout, loud in what it signals: every claim here is verifiable.
export function Cite({ k, n }: { k: CitationKey; n?: number }) {
  return (
    <Link href={citationHref(k)}>
      <sup
        title={`Evidence: ${citationLabel(k)}`}
        className="cite-marker"
        style={{
          cursor: "pointer",
          color: "oklch(0.78 0.12 85)",
          fontSize: "0.62em",
          fontWeight: 700,
          marginLeft: "1px",
          padding: "0 1px",
          verticalAlign: "super",
          textDecoration: "none",
        }}
      >
        [{n ?? "▪"}]
      </sup>
    </Link>
  );
}
