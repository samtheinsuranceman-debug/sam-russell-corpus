=== Drass Wealth Tools ===
Contributors: russellholdings
Requires at least: 6.0
Tested up to: 6.7
Requires PHP: 7.4
Stable tag: 1.2.0
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
