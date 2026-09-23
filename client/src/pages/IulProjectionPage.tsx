// FILE: client/src/pages/IulProjectionPage.tsx
// Was an unfinished stub ("Placeholder", "coming soon", a fixed 8% cap label and a fabricated
// fixed "insights score"). Replaced 23 Sep 2026 with a pointer to the working engine.
import EngineMovedNotice from "@/components/EngineMovedNotice";

export default function IulProjectionPage() {
  return (
    <EngineMovedNotice
      title="IUL Projection"
      summary="IUL projections run in the IUL Engine: an indexed universal life insurance policy's account value at the assumed crediting rate you set, with the charges shown and past index history kept separate."
      href="/portal/iul-engine"
      linkLabel="Open the IUL Engine"
    />
  );
}
