import { Button } from "@/components/ui/button";
import { Link, useSearch } from "wouter";
import { motion } from "framer-motion";
import { XCircle, AlertCircle, ArrowLeft, HelpCircle } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";

export default function PaymentCancel() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const isFailed = params.get("reason") === "failed";

  useEffect(() => {
    if (isFailed) {
      toast.error("Payment failed. Please try again or contact support.");
    } else {
      toast.info("Payment cancelled. No charges were made.");
    }
  }, [isFailed]);
  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center">
      {/* Background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 40%, oklch(0.15 0.02 55) 0%, oklch(0.13 0.02 55) 40%, oklch(0.12 0.02 55) 100%)`,
        }}
      />

      <div className="relative z-10 px-4 w-full max-w-lg mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className="glass-card p-10 rounded-2xl"
        >
          {/* Icon */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
            style={{ background: isFailed ? "oklch(0.45 0.15 25 / 0.15)" : "oklch(0.5 0.1 25 / 0.12)", border: isFailed ? "2px solid oklch(0.55 0.18 25 / 0.4)" : "2px solid oklch(0.6 0.15 25 / 0.3)" }}
          >
            {isFailed ? (
              <AlertCircle className="w-10 h-10" style={{ color: "oklch(0.65 0.2 25)" }} />
            ) : (
              <XCircle className="w-10 h-10" style={{ color: "oklch(0.7 0.15 25)" }} />
            )}
          </motion.div>

          {/* Heading */}
          <h1
            className="text-2xl text-foreground mb-3"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}
          >
            {isFailed ? "Payment Failed" : "Payment Cancelled"}
          </h1>

          <p className="text-muted-foreground mb-8 leading-relaxed">
            {isFailed
              ? "There was an issue processing your payment. Please try again or use a different payment method."
              : "No worries \u2014 your assessment slot is still reserved. You can return to pricing whenever you're ready."}
          </p>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Link href="/pricing">
              <Button
                className="w-full bg-gradient-to-r from-primary to-primary/80 text-white font-semibold py-5 text-base hover:translate-y-[-1px] active:scale-[0.97] transition-all duration-150"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Pricing
              </Button>
            </Link>
            <Link href="/">
              <Button
                variant="ghost"
                className="w-full text-muted-foreground hover:text-foreground"
              >
                <HelpCircle className="w-4 h-4 mr-2" />
                Return Home
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
