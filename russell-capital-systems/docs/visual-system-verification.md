# Visual System Verification

The public homepage now uses a persistent 4181×2793 city-at-night image stored at `/manus-storage/russell-capital-city-night_0cb0b970.jpeg`. Layered dark masks, emerald color blending, radial green illumination, and text shadows preserve readability while delivering the requested illuminated skyline appearance. The previous external CloudFront URL, which rendered as a blank background in the managed preview, has been removed.

Portal interiors are wrapped by `.rc-portal-theme`, which scopes Grok-inspired violet tokens, dark plum surfaces, purple gradients, focus rings, active sidebar states, card borders, buttons, mobile tabs, scrollbars, and background texture to `AppShell`. The public homepage remains outside this class and retains the black, navy, and emerald identity.

Desktop browser verification passed for `/` and `/login`. Deterministic validation in `server/design-system.test.ts` confirms the persistent hero asset, emerald illumination, scoped purple theme, and separation between public and portal palettes.
