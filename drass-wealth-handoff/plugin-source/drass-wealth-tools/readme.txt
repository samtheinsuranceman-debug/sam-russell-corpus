=== Drass Wealth Tools ===
Contributors: russellholdings
Requires at least: 6.0
Tested up to: 6.7
Requires PHP: 7.4
Stable tag: 1.4.0
License: Proprietary — licensed to Drass Wealth Management

Retirement, tax and insurance calculators for Drass Wealth Management.

== Description ==

Adds calculators to the site as shortcodes. Calculation engines run on the
Russell Capital Systems platform; this plugin renders them inside WordPress.

Creates no database tables. Modifies no existing content. Registers no public
write endpoints. Deactivating removes every tool cleanly.

== Installation ==

1. Plugins > Add New > Upload Plugin > select the .zip > Activate.
2. Settings > Drass Wealth Tools > paste the API base URL supplied with the
   package.

== Changelog ==

= 1.4.0 =
* The index series behind every figure is now sourced and reconciles to the
  carrier's own published claims about the S&P 500 (8.05% vs a published 8.06%
  thirty-year average; 12.29% vs a published 12.23% average excess above a 10%
  cap). The previous series was unsourced and missed those by 0.23 points and
  1.43 points.
* Because of that, the segment figures changed materially. Over 2019-2025 the
  two-year balanced account credited 49.51%, 47.32%, 0%, 0%, 53.42% and 43.07%
  — four of six at 40% or more, and two at nothing. Discard any figure taken
  from an earlier build.
* The provenance warning added in 1.3.0 no longer shows, because the series now
  passes. The check still runs on every build.

= 1.3.0 =
* Index segments now lead with the carrier's own published basis: annualized
  and net of the segment spread. The carrier's chart plots that figure, so it
  is the only column that may be set beside a carrier document.
* A figure read off a carrier chart already has participation and the spread
  in it. Feeding one back through the crediting method would deduct the spread
  twice and understate the account by about 1.5 points. The tool builds from
  raw index data instead.
* The platform reports whether the index series reconciles to the carrier's
  published claims about that index. It currently does not, and the tool now
  says so at the top of the view rather than in a footnote.
* Index options carry their product generation (II, III), because successive
  generations of the same product carry different caps on identically-named
  options.

= 1.2.0 =
* Index segments [dwt_index_segments]. A multi-year index segment credits once
  across its whole term, so a two-year credit of 48% is 21.64% a year. This view
  prints the segment credit with its term and the per-year equivalent side by
  side, and states the count of SEGMENTS over a threshold rather than years, so
  a segment credit cannot be read as an annual return.
* An account whose terms came from no carrier document is labelled unsourced
  above the table, not in a footnote.

= 1.1.0 =
* Monte Carlo, income tax, estate tax and mortgage elimination tools; Time
  Machine dual view; concierge; engine catalogue.

= 1.0.0 =
* First release. Index history (educational), built to the NAIC AG 49-A
  amendment adopted 21 November 2025.
