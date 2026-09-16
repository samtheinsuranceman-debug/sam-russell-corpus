/**
 * Dr. Buddy — Adaptive AI Support Widget
 * Present on every page, context-aware via UnifiedDataBus.
 * Uses only the context permitted by the active deployment mode.
 */
import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { MessageCircle, X, Send, Bot, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useBrain } from "@/contexts/UnifiedDataBus";
import { useAuth } from "@/_core/hooks/useAuth";
import { cn } from "@/lib/utils";
import { detectCrisisTier, CrisisDetectionBanner, type CrisisTier } from "./CrisisDetectionBanner";
import { SupportModeSelector } from "./SupportModeSelector";
import { SUPPORT_MODE_COPY, useSupportMode } from "@/contexts/SupportModeContext";
import { getLoginUrl } from "@/const";
import { PAID_SUBSCRIPTIONS_ENABLED, PUBLIC_WELLNESS_MODE } from "@/lib/releasePolicy";
import { toast } from "sonner";
import { CONSUMER_HEALTH_CONSENT_VERSION } from "@shared/legalVersions";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  isCrisis?: boolean;
}

export function DrBuddyWidget() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello, I'm Doctor Buddy — an AI support companion. Choose Friend, Therapist, or Psychiatrist Zone to control how I communicate. Those are communication styles, not licensed roles. What would be most useful right now?",
      timestamp: Date.now(),
    },
  ]);
  const [crisisTier, setCrisisTier] = useState<CrisisTier>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const brain = useBrain();
  const { user } = useAuth();
  const { mode } = useSupportMode();
  const [location] = useLocation();
  const subscription = trpc.subscription.me.useQuery(undefined, {
    enabled: Boolean(user && PAID_SUBSCRIPTIONS_ENABLED),
    retry: false,
  });

  const chatMutation = trpc.drBuddy.chat.useMutation({
    onSuccess: (data) => {
      const assistantMsg: Message = {
        id: `msg_${Date.now()}`,
        role: "assistant",
        content: data.reply,
        timestamp: Date.now(),
        isCrisis: data.crisisDetected,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      if (data.crisisDetected) {
        setCrisisTier((prev) => prev ?? (data.urgent ? "tier1_emergency" : data.cssrsLevel >= 2 ? "tier2_high_risk" : "tier3_elevated"));
        brain.report("crisis_detected", { source: "dr_buddy_chat" });
      }
    },
    onError: (error) => {
      if (error.message.includes("SUBSCRIPTION_REQUIRED")) {
        window.location.href = "/subscribe";
        return;
      }
      if (error.message.includes("HEALTH_DATA_CONSENT_REQUIRED")) {
        localStorage.removeItem(`db_health_data_consent_v${CONSUMER_HEALTH_CONSENT_VERSION}`);
        window.location.href = "/ai-advisory";
        return;
      }
      toast.error("Doctor Buddy could not send that message. Please try again.");
    },
  });

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  useEffect(() => {
    if (open) {
      brain.report("dr_buddy_opened");
    }
  }, [open]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || chatMutation.isPending) return;
    if (!user) {
      window.location.href = getLoginUrl(window.location.pathname);
      return;
    }
    if (PAID_SUBSCRIPTIONS_ENABLED && !["active", "trialing"].includes(subscription.data?.status || "")) {
      window.location.href = "/subscribe";
      return;
    }
    if (PUBLIC_WELLNESS_MODE && !localStorage.getItem(`db_health_data_consent_v${CONSUMER_HEALTH_CONSENT_VERSION}`)) {
      // The floating widget never bypasses the health-data notice just because
      // it was opened from a public/legal page.
      window.location.href = "/ai-advisory";
      return;
    }

    const { tier } = detectCrisisTier(text);
    if (tier) setCrisisTier(tier);
    const isCrisis = tier !== null;

    const userMsg: Message = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: text,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    brain.report("dr_buddy_message_sent", { messageLength: text.length, isCrisis, crisisTier: tier });

    // Build context from the UnifiedDataBus
    const contextSummary = brain.getSummary();
    const recentEvents = brain.getRecentEntries(10).map((e) => ({
      type: e.type,
      payload: e.payload,
      timestamp: e.timestamp,
    }));

    chatMutation.mutate({
      message: text,
      sessionId: sessionId ? Number(sessionId) : undefined,
      supportMode: mode,
      history: messages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
        timestamp: new Date(m.timestamp).toISOString(),
      })),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const HIDDEN_ON = new Set(["/privacy", "/health-data-privacy", "/terms", "/medical-disclaimer", "/subscription-terms", "/subscribe", "/settings", "/crisis"]);
  if (HIDDEN_ON.has(location)) return null;

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-4 py-3 rounded-full shadow-2xl shadow-violet-900/50 transition-all duration-200 hover:scale-105 group"
          aria-label="Open Dr. Buddy"
        >
          <Bot className="h-5 w-5" />
          <span className="text-sm font-semibold">Dr. Buddy</span>
          {crisisTier && (
            <span className={`absolute -top-1 -right-1 h-3 w-3 rounded-full animate-pulse ${
              crisisTier === "tier1_emergency" ? "bg-red-500" :
              crisisTier === "tier2_high_risk" ? "bg-orange-500" : "bg-yellow-500"
            }`} />
          )}
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div
          className={cn(
            "fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] bg-gray-900 border border-violet-800/50 rounded-2xl shadow-2xl shadow-violet-900/40 flex flex-col transition-all duration-300",
            minimized ? "h-14" : "h-[520px]"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-violet-800/40 bg-violet-900/30 rounded-t-2xl">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Bot className="h-5 w-5 text-violet-400" />
                <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 bg-green-400 rounded-full border border-gray-900" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Dr. Buddy</p>
                <p className="text-xs text-violet-400">{SUPPORT_MODE_COPY[mode].label} · AI support</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {crisisTier && (
                <Badge variant="destructive" className="text-xs px-2 py-0.5 animate-pulse">
                  {crisisTier === "tier1_emergency" ? "Emergency" :
                   crisisTier === "tier2_high_risk" ? (PUBLIC_WELLNESS_MODE ? "Support Now" : "High Risk") : "Distress"}
                </Badge>
              )}
              <button
                onClick={() => setMinimized((m) => !m)}
                className="p-1.5 hover:bg-violet-800/40 rounded-lg transition-colors text-gray-400 hover:text-white"
              >
                <ChevronDown className={cn("h-4 w-4 transition-transform", minimized && "rotate-180")} />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 hover:bg-violet-800/40 rounded-lg transition-colors text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              <div className="px-3 pt-3">
                <SupportModeSelector compact />
                <p className="text-[10px] text-gray-500 mt-1.5">{SUPPORT_MODE_COPY[mode].boundary}</p>
              </div>

              {/* Crisis banner — tiered 988 escalation protocol */}
              {crisisTier && (
                <div className="mx-3 mt-3">
                  <CrisisDetectionBanner
                    tier={crisisTier}
                    context="Dr. Buddy chat"
                    onDismiss={() => setCrisisTier(null)}
                  />
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 scrollbar-thin scrollbar-thumb-violet-800">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex",
                      msg.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {msg.role === "assistant" && (
                      <div className="h-6 w-6 rounded-full bg-violet-700 flex items-center justify-center mr-2 mt-0.5 shrink-0">
                        <Bot className="h-3.5 w-3.5 text-white" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[78%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                        msg.role === "user"
                          ? "bg-violet-600 text-white rounded-tr-sm"
                          : msg.isCrisis
                          ? "bg-red-900/50 border border-red-700/40 text-red-100 rounded-tl-sm"
                          : "bg-gray-800 text-gray-100 rounded-tl-sm"
                      )}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {chatMutation.isPending && (
                  <div className="flex justify-start">
                    <div className="h-6 w-6 rounded-full bg-violet-700 flex items-center justify-center mr-2 mt-0.5 shrink-0">
                      <Bot className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div className="bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-2.5 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:0ms]" />
                      <span className="h-1.5 w-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:150ms]" />
                      <span className="h-1.5 w-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="px-3 pb-3 pt-2 border-t border-violet-800/30">
                <div className="flex gap-2 items-end">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={SUPPORT_MODE_COPY[mode].placeholder}
                    className="resize-none min-h-[40px] max-h-[100px] bg-gray-800 border-violet-800/40 text-sm text-white placeholder:text-gray-500 focus:border-violet-500 rounded-xl"
                    rows={1}
                  />
                  <Button
                    size="icon"
                    onClick={handleSend}
                    disabled={!input.trim() || chatMutation.isPending}
                    className="bg-violet-600 hover:bg-violet-500 shrink-0 h-10 w-10 rounded-xl"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-600 mt-1.5 text-center">
                  Doctor Buddy is AI, not a licensed clinician. Modes change communication style only. For emergencies call 911 or 988.
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
