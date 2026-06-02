import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { Clock, X, CreditCard, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

const HEARTBEAT_INTERVAL_MS = 60_000; // Send heartbeat every 60 seconds
const NOTIFICATION_INTERVAL_S = 30 * 60; // Show notification every 30 minutes (1800s)

interface TrialTimerState {
  accessTier: string;
  trialSecondsUsed: number;
  trialSecondsRemaining: number | null;
  expired: boolean;
}

export default function TrialTimer() {
  const [, navigate] = useLocation();
  const [state, setState] = useState<TrialTimerState | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const lastNotificationAt = useRef<number>(0);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const localElapsedRef = useRef(0);

  // Don't render anything for unlimited/subscriber users
  const accessTier = localStorage.getItem("rc_access_tier");
  const isTrialActive = localStorage.getItem("rc_trial_active") === "true";

  const sendHeartbeat = useCallback(async () => {
    try {
      const res = await fetch("/api/trial/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ elapsedSeconds: 60 }),
        credentials: "include",
      });
      if (!res.ok) return;
      const data: TrialTimerState = await res.json();
      setState(data);

      // Check if trial expired
      if (data.expired) {
        setShowExpiredModal(true);
        if (heartbeatRef.current) {
          clearInterval(heartbeatRef.current);
          heartbeatRef.current = null;
        }
        return;
      }

      // Check if we should show a 30-minute notification
      if (data.accessTier === "trial" && data.trialSecondsRemaining != null) {
        const totalUsed = data.trialSecondsUsed;
        // Calculate which 30-min milestone we just passed
        const currentMilestone = Math.floor(totalUsed / NOTIFICATION_INTERVAL_S);
        const lastMilestone = Math.floor(lastNotificationAt.current / NOTIFICATION_INTERVAL_S);

        if (currentMilestone > lastMilestone && lastNotificationAt.current > 0) {
          const remaining = data.trialSecondsRemaining;
          const hours = Math.floor(remaining / 3600);
          const minutes = Math.floor((remaining % 3600) / 60);
          let timeStr = "";
          if (hours > 0) timeStr += `${hours} hour${hours > 1 ? "s" : ""} `;
          if (minutes > 0) timeStr += `${minutes} minute${minutes > 1 ? "s" : ""}`;
          if (!timeStr) timeStr = "less than 1 minute";

          setNotification(`You have ${timeStr.trim()} remaining in your free trial.`);
          // Auto-dismiss after 10 seconds
          setTimeout(() => setNotification(null), 10000);
        }
        lastNotificationAt.current = totalUsed;
      }
    } catch (err) {
      // Silently fail — don't disrupt the user experience
    }
  }, []);

  useEffect(() => {
    if (!isTrialActive) return;
    if (accessTier === "unlimited") return;

    // Initialize lastNotificationAt from stored seconds
    const storedRemaining = localStorage.getItem("rc_trial_seconds_remaining");
    if (storedRemaining) {
      const totalLimit = 10800; // 3 hours
      const remaining = parseInt(storedRemaining, 10);
      lastNotificationAt.current = totalLimit - remaining;
    }

    // Send initial heartbeat after 5 seconds
    const initialTimeout = setTimeout(() => {
      sendHeartbeat();
    }, 5000);

    // Then every 60 seconds
    heartbeatRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);

    return () => {
      clearTimeout(initialTimeout);
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
    };
  }, [isTrialActive, accessTier, sendHeartbeat]);

  const handleSubscribe = async () => {
    setSubscribing(true);
    try {
      const res = await fetch("/api/trial/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        window.open(data.checkoutUrl, "_blank");
      }
    } catch (err) {
      // Silently fail
    } finally {
      setSubscribing(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/trial/logout", { method: "POST", credentials: "include" });
    } catch {}
    localStorage.removeItem("rc_trial_active");
    localStorage.removeItem("rc_trial_expires");
    localStorage.removeItem("rc_trial_email");
    localStorage.removeItem("rc_access_tier");
    localStorage.removeItem("rc_trial_seconds_remaining");
    navigate("/trial");
  };

  // Don't render for unlimited/subscriber users
  if (!isTrialActive || accessTier === "unlimited") return null;

  return (
    <>
      {/* Trial time indicator bar (always visible for trial users) */}
      {state && state.accessTier === "trial" && state.trialSecondsRemaining != null && (
        <div className="fixed bottom-0 left-0 right-0 z-[9998] bg-slate-900/95 border-t border-slate-700 px-4 py-2 flex items-center justify-between text-sm backdrop-blur-sm">
          <div className="flex items-center gap-2 text-slate-300">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>
              Trial: <strong className="text-white">{formatTimeCompact(state.trialSecondsRemaining)}</strong> remaining
            </span>
            <div className="w-32 h-1.5 bg-slate-700 rounded-full overflow-hidden ml-2">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${Math.max(0, (state.trialSecondsRemaining / 10800) * 100)}%`,
                  backgroundColor: state.trialSecondsRemaining < 1800 ? "#ef4444" : state.trialSecondsRemaining < 3600 ? "#f59e0b" : "#10b981",
                }}
              />
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleSubscribe}
            className="border-emerald-600 text-emerald-400 hover:bg-emerald-600/20 text-xs h-7"
          >
            <CreditCard className="w-3 h-3 mr-1" /> Subscribe
          </Button>
        </div>
      )}

      {/* 30-minute notification toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-[9999] max-w-sm animate-in slide-in-from-right fade-in duration-300">
          <div className="bg-amber-900/95 border border-amber-600/50 rounded-lg p-4 shadow-2xl backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-amber-300 font-semibold text-sm mb-1">Trial Time Update</h4>
                <p className="text-amber-100/80 text-sm">{notification}</p>
              </div>
              <button
                onClick={() => setNotification(null)}
                className="text-amber-400/60 hover:text-amber-300 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trial expired modal overlay */}
      {showExpiredModal && (
        <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111c32] border border-amber-600/50 rounded-2xl max-w-md w-full p-8 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-amber-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Trial Period Expired</h2>
              <p className="text-slate-400">
                Your 3-hour free trial has been fully used. Subscribe to continue accessing the Advisor Portal.
              </p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mb-6">
              <h4 className="text-emerald-400 font-semibold mb-1">Russell Capital Solutions™ — Advisor Portal</h4>
              <p className="text-white text-2xl font-bold">$99<span className="text-slate-400 text-base font-normal">/month</span></p>
              <p className="text-slate-400 text-sm mt-1">Full access to all tools, calculators, and strategy engines</p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleSubscribe}
                disabled={subscribing}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3"
              >
                {subscribing ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Redirecting...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" /> Subscribe Now — $99/mo
                  </span>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={handleLogout}
                className="w-full border-slate-600 text-slate-300 hover:bg-slate-700/50"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function formatTimeCompact(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
