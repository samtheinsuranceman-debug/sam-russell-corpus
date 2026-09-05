import { Button } from "@/components/ui/button";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 40%, oklch(0.15 0.02 55) 0%, oklch(0.13 0.02 55) 50%, oklch(0.12 0.02 55) 100%)`,
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        className="relative z-10 text-center max-w-md"
      >
        {/* 404 number */}
        <motion.p
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-8xl sm:text-9xl font-black text-primary/[0.15] mb-[-1rem]"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          404
        </motion.p>

        <h1
          className="text-2xl sm:text-3xl text-foreground mb-3"
          style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}
        >
          Lost in the Dimensions
        </h1>

        <p className="text-muted-foreground/90 text-sm leading-relaxed mb-8">
          This page doesn't exist in any of the 32 dimensions we measure.
          <br />
          Let's get you back to mapped territory.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => setLocation("/")}
            className="bg-primary text-black glow-gold hover:translate-y-[-1px] active:scale-[0.97] transition-all duration-150"
          >
            Return Home
          </Button>
          <Link href="/assessment">
            <Button
              variant="outline"
              className="border-accent/20 text-accent hover:bg-accent/[0.06]"
            >
              Take Assessment
            </Button>
          </Link>
        </div>

        {/* Subtle brand */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-xs text-muted-foreground/30"
        >
          AQAL Intelligence
        </motion.p>
      </motion.div>
    </div>
  );
}
