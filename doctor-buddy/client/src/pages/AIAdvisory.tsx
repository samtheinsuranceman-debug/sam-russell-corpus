import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Sparkles, ArrowLeft, Send, BookOpen, Pill, Dumbbell,
  Brain, Leaf, Moon, AlertTriangle, RefreshCw, User, Bot
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Streamdown } from "streamdown";
import { detectCrisisTier, CrisisDetectionBanner, type CrisisTier } from "@/components/CrisisDetectionBanner";
import { SupportModeSelector } from "@/components/SupportModeSelector";
import { SUPPORT_MODE_COPY, useSupportMode } from "@/contexts/SupportModeContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

type Message = {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

const QUICK_PROMPTS = [
  { icon: Brain, label: "Everyday calm strategies", prompt: "What low-risk everyday strategies are commonly used to support calm and functioning? Keep this general and do not diagnose me." },
  { icon: Moon, label: "Sleep routine basics", prompt: "Explain general sleep-routine habits that may support wellbeing, and what questions I could bring to a licensed professional if sleep problems persist." },
  { icon: Dumbbell, label: "Movement and wellbeing", prompt: "Explain the general evidence linking regular movement with wellbeing without presenting exercise as a treatment prescription for me." },
  { icon: Pill, label: "Prepare medication questions", prompt: "Help me prepare neutral questions to ask my prescriber or pharmacist about benefits, risks, side effects, and alternatives. Do not tell me to start, stop, or change medication." },
  { icon: Leaf, label: "Nutrition basics", prompt: "Explain general nutrition and wellbeing concepts without prescribing a diet or claiming to treat a mental-health condition." },
  { icon: BookOpen, label: "Prepare for a therapy discussion", prompt: "Explain, at a high level, common licensed-therapy approaches I could ask a professional about. Do not recommend a treatment plan for me." },
];


export default function AIAdvisory() {
  const { mode } = useSupportMode();
  const { isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `# Welcome to Doctor Buddy AI Advisory

I'm an AI support and health-education tool. You can choose Friend, Therapist, or Psychiatrist Zone to change how I communicate while keeping the same safety boundaries.

**I can help you with:**
- General education about mental-health concepts and psychiatric terminology
- Research-backed wellness information and questions to bring to a licensed professional
- Reflection, values, decision-making, and communication exercises
- Organizing your own observations and goals
- Finding relevant peer-reviewed research for a topic

> **Important:** Friend/Therapist/Psychiatrist Zone changes communication style only. I am not a licensed clinician, and I do not diagnose, prescribe, or direct medication changes.

What would you like to explore today?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const advisoryMutation = trpc.advisory.chat.useMutation({
    onSuccess: (data) => {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      }]);
      setIsLoading(false);
      setStreamingContent("");
    },
    onError: () => {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "I encountered an error processing your request. Please try again.",
        timestamp: new Date(),
      }]);
      setIsLoading(false);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const [crisisTier, setCrisisTier] = useState<CrisisTier>(null);

  const handleSend = (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;
    if (!isAuthenticated) {
      window.location.href = getLoginUrl("/ai-advisory");
      return;
    }
    // Crisis detection on every user message
    const { tier } = detectCrisisTier(messageText);
    if (tier) setCrisisTier(tier);

    const userMessage: Message = {
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    const history = messages.map(m => ({ role: m.role, content: m.content }));
    advisoryMutation.mutate({
      message: messageText,
      history,
      supportMode: mode,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border/30 bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Back
              </Button>
            </Link>
            <div className="w-px h-5 bg-border" />
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-400" />
              <h1 className="font-bold text-lg">AI Advisory</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-violet-400/30 text-violet-400 bg-violet-400/5 text-xs font-mono">
              EDUCATIONAL + RESEARCH-AWARE
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMessages([{
                role: "assistant",
                content: "Session cleared. Choose the communication style you want and tell me what would be useful.",
                timestamp: new Date(),
              }])}
              className="text-muted-foreground"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 container py-6 flex flex-col max-w-4xl mx-auto w-full">
        <div className="mb-5">
          <SupportModeSelector />
          <p className="text-[11px] text-muted-foreground mt-2">{SUPPORT_MODE_COPY[mode].boundary}</p>
        </div>
        {/* Quick Prompts */}
        <div className="mb-6">
          <p className="text-xs text-muted-foreground mb-3 font-mono">SUGGESTED TOPICS</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_PROMPTS.map(({ icon: Icon, label, prompt }) => (
              <button
                key={label}
                onClick={() => handleSend(prompt)}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/50 text-xs text-muted-foreground hover:text-foreground hover:border-violet-400/30 hover:bg-violet-400/5 transition-colors disabled:opacity-50"
              >
                <Icon className="w-3 h-3 text-violet-400" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-6 mb-6 overflow-y-auto">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === "assistant"
                  ? "bg-violet-400/10 border border-violet-400/30"
                  : "bg-primary/10 border border-primary/30"
              }`}>
                {msg.role === "assistant"
                  ? <Bot className="w-4 h-4 text-violet-400" />
                  : <User className="w-4 h-4 text-primary" />
                }
              </div>
              <div className={`flex-1 max-w-[85%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col`}>
                <Card className={`${
                  msg.role === "assistant"
                    ? "bg-card border-border/50"
                    : "bg-primary/10 border-primary/20"
                }`}>
                  <CardContent className="p-4">
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm prose-invert max-w-none text-sm leading-relaxed">
                        <Streamdown>{msg.content}</Streamdown>
                      </div>
                    ) : (
                      <p className="text-sm text-foreground">{msg.content}</p>
                    )}
                  </CardContent>
                </Card>
                <span className="text-xs text-muted-foreground mt-1 px-1">
                  {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-violet-400/10 border border-violet-400/30 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-violet-400" />
              </div>
              <Card className="bg-card border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="flex gap-1">
                      {[0, 1, 2].map(i => (
                        <div
                          key={i}
                          className="w-2 h-2 rounded-full bg-violet-400/60 animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-mono">Preparing an educational response...</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Crisis Detection Banner */}
        {crisisTier && (
          <div className="mb-4">
            <CrisisDetectionBanner tier={crisisTier} onDismiss={() => setCrisisTier(null)} />
          </div>
        )}

        {/* Input */}
        <div className="sticky bottom-0 bg-background pt-4 border-t border-border/30">
          <div className="flex gap-3">
            <Textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask for general education, reflection, or questions to bring to a licensed professional... (Shift+Enter for new line)"
              className="flex-1 min-h-[80px] max-h-[200px] bg-card border-border/50 resize-none text-sm focus:border-violet-400/40"
              disabled={isLoading}
            />
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="bg-violet-600 hover:bg-violet-700 text-white self-end h-10 px-4"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3" />
            Educational AI only. Not a substitute for professional medical advice, diagnosis, or treatment.
          </p>
        </div>
      </div>
    </div>
  );
}
