# Visual Validation

Desktop full-page verification was completed at 1440×1200 after the final production build.

| Route | Result |
|---|---|
| `/` | Passed. The high-resolution city-at-night skyline is visible beneath dark navy masks and emerald illumination; navigation, hero, feature, pricing, consultation, CTA, and footer sections remain readable. |
| `/login` | Passed. The managed OAuth page uses the intended dark purple split layout, clear sign-in action, retired-password explanation, and return-home link. |
| `/portal/planning-cases` | Route resolves; the application correctly presents the mandatory modeling disclosure before portal content. |
| `/portal/secondary-information` | Route resolves; the application correctly presents the mandatory modeling disclosure before portal content. |
| `/portal/system-health` | Route resolves; the application correctly presents the mandatory modeling disclosure before portal content. |
| `/portal/the-map` | Route resolves; the application correctly presents the mandatory modeling disclosure before portal content. |

The first screenshot pass exposed a global onboarding tour obscuring public and deep-link pages. `OnboardingTour` is now limited to authenticated `/portal/dashboard`, and a regression test enforces that scope. The second pass confirmed the public homepage and login page are unobstructed.

The remaining portal screenshots stop at the existing **Historical Index Modeling & Disclosure Center**, which requires an explicit user acknowledgment. The validation process did not accept legal terms or bypass the acknowledgment on the user’s behalf. Authenticated post-acknowledgment visual checks remain an owner-session follow-up; source-level module loading, routing, TypeScript, and automated safeguards pass for these pages.

Mobile full-page verification at 390×844 passed for `/` and `/login`. The homepage collapses into a single-column hero, metrics, portal-access form, feature cards, pricing cards, consultation panel, CTA, and footer without horizontal overflow. The managed sign-in card remains centered and readable with a full-width purple action.

Desktop verification at 1280×900 passed for `/login`, `/register`, `/forgot-password`, `/reset-password`, and `/trial`. Each route now presents a consistent dark-purple managed-identity page, explicitly explains that local password or trial-code access has been retired, and provides one secure sign-in action plus a homepage escape route.
