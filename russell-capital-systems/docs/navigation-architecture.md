# Navigation Architecture

The active portal shell uses a single left-side navigation with **primary workflow groups** and one visually distinct **Secondary Information** group. Existing sidebar capabilities—collapsible groups, subgroup counts, active-route highlighting, favorites, global search, breadcrumbs, command palette, mobile drawer behavior, client selection, and workspace selection—remain in the shared `AppShell` rather than being reimplemented per page.

The seven added client-journey pages are presented as an ordered primary workflow. The Secondary Information group links to the searchable Secondary Library, Tool Explorer, Knowledge Library, Video Library, and Patent Portfolio. Duplicate Video Library and Patent Portfolio placements were removed from Tax Secrets; their routes remain unchanged.

The Secondary Library is generated from the live router and primary navigation. It currently exposes **85 static portal routes** that are not in the primary sidebar, organized into Advanced Analysis, Reports & Documents, Reference & Education, Operations & Administration, Experience & Experimental, and Additional Tools. Every static portal route is therefore discoverable through either the primary sidebar or the Secondary Library. Dynamic detail routes remain reachable through their parent workflows.

Deterministic validation in `server/navigation-organization.test.ts` confirms that primary sidebar destinations are unique, secondary catalog entries are routable and disjoint from primary navigation, every static portal route is discoverable, and the Secondary Library includes search, filters, counts, and no-deletion guidance.
