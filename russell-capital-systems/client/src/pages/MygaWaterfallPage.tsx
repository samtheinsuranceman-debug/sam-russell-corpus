// FILE: client/src/pages/MygaWaterfallPage.tsx
// Was an unfinished stub: hard-coded "Projected Cycles" ($100,000 → $121,000 → $146,410) that ignored the
// inputs, four "Placeholder" tabs, "Initial Investment" for an annuity premium, and a fabricated
// fixed "insights score". Replaced 23 Sep 2026 with a pointer to the working waterfall.
import EngineMovedNotice from "@/components/EngineMovedNotice";

export default function MygaWaterfallPage() {
  return (
    <EngineMovedNotice
      title="MYGA Waterfall Laddering"
      summary="The MYGA waterfall runs on the MYGA page (the Amazing MYGA Waterfall tab): premiums into multi-year guaranteed annuity contracts at the rates you enter, each rate guaranteed only for its term, with every later cycle shown as hypothetical."
      href="/portal/myga-fixed-rate"
      linkLabel="Open the MYGA Waterfall"
    />
  );
}
