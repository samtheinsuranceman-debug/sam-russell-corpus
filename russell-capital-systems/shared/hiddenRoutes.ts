/**
 * Routes deliberately kept out of every menu. Each still resolves if typed, but
 * none is advertised. The owner hid the fake-data and broken pages on
 * 23 Sep 2026 ("Hide those 8") until each one is rebuilt on real data.
 * The navigation tests read this list, and require every entry to be a real
 * route with a real reason, so the list cannot grow quietly.
 */
export const NOT_IN_NAVIGATION: Record<string, string> = {
  "/portal/interior":
    "The design-system reference. It shows the shared primitives against sample content for whoever is building screens, and has nothing on it a client would want. Reachable by anyone who types the URL; not advertised.",
  "/portal/black-mirror":
    "Hidden by the owner (23 Sep 2026): nearly every tab showed invented clients, commissions and wealth figures. Back in the menu once it runs on real records.",
  "/portal/batch-illustration":
    "Hidden by the owner (23 Sep 2026): the batch runner is not connected to the illustration engine yet, so the page can only show an empty worksheet.",
  "/portal/client-self-service":
    "Hidden by the owner (23 Sep 2026): it calls three server procedures that do not exist, so its panels cannot load real data.",
  "/portal/interop-engine":
    "Hidden by the owner (23 Sep 2026): its copy describes an impact report and live flows that the platform does not produce yet.",
  "/portal/lead-generator":
    "Hidden by the owner (23 Sep 2026): no lead source is connected, and it used to invent people and phone numbers.",
  "/portal/compliance-monitoring":
    "Hidden by the owner (23 Sep 2026): it repeats Compliance Alerts and most of its panels are empty until real monitoring data exists.",
  "/portal/admin":
    "Hidden by the owner (23 Sep 2026): the Enterprise Admin page fails to load (missing imports) and its analytics had no real data behind them.",
  "/portal/enterprise":
    "Hidden by the owner (23 Sep 2026): the same Enterprise Admin page as /portal/admin, which fails to load and had no real analytics behind it.",
  "/portal/genome-intake":
    "The Wealth Genome intake (consent, then the mind and money questions). Reached from the START HERE plate after sign-in and from the Wealth Genome page, never from a menu: it is behind GENOME_INTAKE_LIVE until counsel has reviewed it, and only the owner can open it as a preview.",
  "/portal/social":
    "Hidden by the owner (23 Sep 2026): a concept page with fictional live advisors, viewer counts and chat, labelled as sample data.",
};
