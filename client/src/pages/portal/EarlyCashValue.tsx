// ============================================================
// /portal/early-cash-value — which surrender-charge schedule governs each
// way money comes out, and what the early-cash-value rider changes.
// The body lives in components/engines/EarlyCashValueView.tsx; the app shell
// adds the one-line policy disclosure and the engine's source footer.
// ============================================================
import { AppShell } from "@/components/AppShell";
import EarlyCashValueView from "@/components/engines/EarlyCashValueView";

export default function EarlyCashValue() {
  return (
    <AppShell title="Early Cash Value">
      <EarlyCashValueView />
    </AppShell>
  );
}
