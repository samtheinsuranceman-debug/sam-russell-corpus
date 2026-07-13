import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { REQUIRE_AGREEMENT_EVENT, setAgreementAccepted, consumePendingAction } from "@/lib/agreement";

// Global, one-time user-agreement gate. Mounted once in App. When any sign-in
// entry point calls beginAuth() without a prior acceptance, it dispatches
// REQUIRE_AGREEMENT_EVENT and this modal appears. Accepting records consent and
// continues to the login flow; declining simply closes.
export default function UserAgreementModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onRequire = () => setOpen(true);
    window.addEventListener(REQUIRE_AGREEMENT_EVENT, onRequire);
    return () => window.removeEventListener(REQUIRE_AGREEMENT_EVENT, onRequire);
  }, []);

  const accept = () => {
    setAgreementAccepted();
    setOpen(false);
    const action = consumePendingAction();
    if (action) action();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[9998] flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="User Agreement"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="relative z-10 w-full max-w-md glass-card rounded-2xl border border-white/[0.08] p-7"
          >
            <p
              className="text-[0.6rem] uppercase tracking-[0.2em] text-primary/60 mb-2"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Before you continue
            </p>
            <h2
              className="text-2xl text-foreground mb-4"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}
            >
              User Agreement
            </h2>

            <ul className="space-y-2.5 text-sm text-muted-foreground/85 leading-relaxed mb-5">
              <li>• <span className="text-foreground/90">We never sell your personal information.</span></li>
              <li>• Your voice is transcribed, then discarded — we keep only your scores and text responses.</li>
              <li>• You grant AQAL a license to store and process your data, and to use de-identified, aggregated data to operate and improve the service. AQAL owns the assessment data and models.</li>
              <li>• Results are informational estimates — not medical, psychological, or professional advice.</li>
              <li>• <span className="text-foreground/90">Founding &amp; free members:</span> your core assessment, profile, and network access are complimentary and won't be charged. Ongoing coaching, monthly re-measurement, progress tracking, and other premium features are a separate paid membership.</li>
              <li>• We may add or change paid tiers, pricing, and features over time; changes are announced in advance and never revoke the free core access described above.</li>
              <li>• You confirm you are 18 or older.</li>
            </ul>

            <p className="text-xs text-muted-foreground/50 mb-6 leading-relaxed">
              This applies to free and paid accounts alike. Full{" "}
              <Link href="/terms"><span className="text-primary/80 hover:text-primary underline cursor-pointer">Terms of Service</span></Link>{" "}and{" "}
              <Link href="/privacy"><span className="text-primary/80 hover:text-primary underline cursor-pointer">Privacy Policy</span></Link>.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={accept}
                className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/20 hover:translate-y-[-1px] active:scale-[0.97] transition-all duration-150"
              >
                Accept &amp; Continue
              </button>
              <button
                onClick={() => setOpen(false)}
                className="flex-1 h-11 rounded-xl border border-white/[0.12] text-muted-foreground/70 text-sm hover:text-foreground hover:border-white/20 transition-colors"
              >
                Decline
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
