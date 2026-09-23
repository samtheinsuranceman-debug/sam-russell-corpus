// ============================================================
// /portal/credit-line-sequencing — the head of the chain.
// The body lives in components/engines/CreditLineSequencingView.tsx; the app
// shell adds the one-line policy disclosure and the engine's source footer.
// ============================================================
import { AppShell } from "@/components/AppShell";
import CreditLineSequencingView from "@/components/engines/CreditLineSequencingView";

export default function CreditLineSequencing() {
  return (
    <AppShell title="Credit-Line Sequencing">
      <CreditLineSequencingView />
    </AppShell>
  );
}
