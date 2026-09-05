// @ts-nocheck
/**
 * AI Wealth Concierge
 * Grok-recommended Feature 30 (Impact 9, ASSISTANCE CAPSTONE)
 * Conversational AI assistant guiding users across all platform features.
 */
import { useState, useRef, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { Brain, Send, Sparkles, ArrowRight, Zap, Shield, TrendingUp, Users, Heart, Target, BarChart3, Clock, Star, MessageCircle, ChevronRight, Lightbulb, BookOpen, Calculator, FileText, Icon} from 'lucide-react';
import { useReportToHub } from "@/contexts/UnifiedDataBusContext";
import { PageInsights } from "@/components/PageInsights";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  suggestions?: Suggestion[];
  timestamp: Date;
}

interface Suggestion {
  label: string;
  path: string;
  icon: typeof Brain;
  color: string;
  description: string;
}

interface QuickPrompt {
  label: string;
  prompt: string;
  icon: typeof Brain;
  color: string;
}

const QUICK_PROMPTS: QuickPrompt[] = [
  { label: "Run a full portfolio analysis", prompt: "I need a comprehensive analysis of my client's portfolio including risk, compliance, and growth opportunities.", icon: BarChart3, color: "emerald" },
  { label: "Check compliance status", prompt: "What's the current compliance status across all my client portfolios?", icon: Shield, color: "red" },
  { label: "Find at-risk clients", prompt: "Which clients have declining engagement scores or are at risk of churning?", icon: Heart, color: "amber" },
  { label: "Generate a client proposal", prompt: "Help me create a comprehensive financial proposal for a new physician client.", icon: FileText, color: "blue" },
  { label: "Market update briefing", prompt: "Give me a quick briefing on today's market conditions and how they affect my physician clients.", icon: TrendingUp, color: "purple" },
  { label: "Optimize a strategy chain", prompt: "I want to run a multi-engine strategy analysis for estate planning optimization.", icon: Brain, color: "emerald" },
];

const FEATURE_SUGGESTIONS: Record<string, Suggestion[]> = {
  analysis: [
    { label: "Risk Dashboard", path: "/portal/risk-dashboard", icon: Shield, color: "red", description: "Real-time compliance and risk heatmap" },
    { label: "Strategy Lab Pro", path: "/portal/strategy-lab", icon: Brain, color: "emerald", description: "Multi-engine chain analysis" },
    { label: "Wealth Canvas", path: "/portal/wealth-canvas", icon: BarChart3, color: "blue", description: "3D portfolio visualization" },
  ],
  compliance: [
    { label: "Compliance Center", path: "/portal/compliance-center", icon: Shield, color: "red", description: "Automated regulatory workflows" },
    { label: "Risk Dashboard", path: "/portal/risk-dashboard", icon: Shield, color: "amber", description: "Live compliance scoring" },
  ],
  clients: [
    { label: "Journey Navigator", path: "/portal/journey-navigator", icon: Users, color: "blue", description: "Full client lifecycle management" },
    { label: "Client Retention", path: "/portal/client-retention", icon: Heart, color: "amber", description: "Churn prediction and engagement" },
    { label: "Deal Closer", path: "/portal/deal-closer", icon: Target, color: "emerald", description: "AI-powered proposal generation" },
  ],
  proposal: [
    { label: "Deal Closer", path: "/portal/deal-closer", icon: Target, color: "emerald", description: "Interactive client proposals" },
    { label: "Presentation Vault", path: "/portal/presentation-vault", icon: FileText, color: "amber", description: "Drag-and-drop presentations" },
  ],
  market: [
    { label: "Market Pulse", path: "/portal/market-pulse", icon: TrendingUp, color: "purple", description: "Real-time market intelligence" },
    { label: "Predictive Arena", path: "/portal/lab", icon: Sparkles, color: "blue", description: "AI scenario forecasting" },
  ],
  strategy: [
    { label: "Strategy Lab Pro", path: "/portal/strategy-lab", icon: Brain, color: "emerald", description: "Auto-chain multi-scenario plans" },
    { label: "Engine Fusion Lab", path: "/portal/engine-fusion", icon: Zap, color: "purple", description: "Custom engine combinations" },
    { label: "Synergy Hub", path: "/portal/synergy-hub", icon: Target, color: "blue", description: "Collaborative strategy canvas" },
  ],
};

const AI_RESPONSES: Record<string, { text: string; category: string }> = {
  analysis: {
    text: "I'll help you run a comprehensive portfolio analysis. Based on your current client base, I recommend starting with the **Risk & Compliance Dashboard** for an immediate health check, then feeding results into the **AI Strategy Lab Pro** for multi-engine optimization. Here are the tools I'd suggest:",
    category: "analysis",
  },
  compliance: {
    text: "Let me check your compliance landscape. Your overall compliance score is **97%** across 121 active clients. There are **2 policies** flagged for annual review and **1 carrier strength alert** from the recent Nationwide cap rate reduction. Here's where you can take action:",
    category: "compliance",
  },
  clients: {
    text: "I've identified **3 clients** with declining engagement scores. Dr. Emily Thompson's score dropped to 45% — she hasn't been contacted in 45 days. I recommend an immediate personalized outreach. Here are the tools to manage this:",
    category: "clients",
  },
  proposal: {
    text: "Great choice! For a new physician client proposal, I recommend the **AI Deal Closer** which will auto-generate personalized recommendations based on their specialty, income, and goals. You can then polish it in the **Presentation Vault**. Let me guide you:",
    category: "proposal",
  },
  market: {
    text: "Here's your market briefing: **S&P 500** is up 0.40% today. The **Fed rate decision** is imminent with 72% probability of a 25bp cut — this directly impacts IUL crediting rates. **Pacific Life** was just upgraded to A++. Two critical alerts need your attention:",
    category: "market",
  },
  strategy: {
    text: "For estate planning optimization, I recommend chaining these engines: **Generational Wealth → CRT Analysis → Tax Optimization → Family Tree**. The AI Strategy Lab Pro can run this automatically and generate a comprehensive report. Here's where to start:",
    category: "strategy",
  },
};

function getAIResponse(input: string): { text: string; suggestions: Suggestion[] } {
  const _reportToHub = useReportToHub("ai-pro-wealth-concierge", "AI Wealth Concierge", "ai-pro-suite", "/portal/ai-wealth-concierge");
  useEffect(() => {
    _reportToHub({ visited: true, timestamp: Date.now() });
  }, [_reportToHub]);
  const lower = input.toLowerCase();
  if (lower.includes("analysis") || lower.includes("portfolio") || lower.includes("comprehensive")) {
    return { text: AI_RESPONSES.analysis.text, suggestions: FEATURE_SUGGESTIONS.analysis };
  }
  if (lower.includes("compliance") || lower.includes("regulatory") || lower.includes("audit")) {
    return { text: AI_RESPONSES.compliance.text, suggestions: FEATURE_SUGGESTIONS.compliance };
  }
  if (lower.includes("client") || lower.includes("engagement") || lower.includes("risk") || lower.includes("churn")) {
    return { text: AI_RESPONSES.clients.text, suggestions: FEATURE_SUGGESTIONS.clients };
  }
  if (lower.includes("proposal") || lower.includes("presentation") || lower.includes("pitch")) {
    return { text: AI_RESPONSES.proposal.text, suggestions: FEATURE_SUGGESTIONS.proposal };
  }
  if (lower.includes("market") || lower.includes("briefing") || lower.includes("rate") || lower.includes("fed")) {
    return { text: AI_RESPONSES.market.text, suggestions: FEATURE_SUGGESTIONS.market };
  }
  if (lower.includes("strategy") || lower.includes("chain") || lower.includes("engine") || lower.includes("estate")) {
    return { text: AI_RESPONSES.strategy.text, suggestions: FEATURE_SUGGESTIONS.strategy };
  }
  return {
    text: "I can help you navigate the entire Russell Capital platform. Try asking about portfolio analysis, compliance checks, client management, proposal generation, market updates, or strategy optimization. What would you like to explore?",
    suggestions: [
      ...FEATURE_SUGGESTIONS.analysis.slice(0, 1),
      ...FEATURE_SUGGESTIONS.clients.slice(0, 1),
      ...FEATURE_SUGGESTIONS.market.slice(0, 1),
    ],
  };
}

export default function AIWealthConcierge() {
  const [, setLocation] = useLocation();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Welcome to the AI Wealth Concierge. I'm your intelligent guide across all 32 platform features. I can help you run analyses, check compliance, manage clients, generate proposals, and much more. What would you like to do today?",
      suggestions: [
        { label: "Command Center", path: "/portal/command-center", icon: BarChart3, color: "emerald", description: "Your unified executive dashboard" },
        { label: "Market Pulse", path: "/portal/market-pulse", icon: TrendingUp, color: "purple", description: "Today's market intelligence" },
        { label: "Journey Navigator", path: "/portal/journey-navigator", icon: Users, color: "blue", description: "Client lifecycle management" },
      ],
      timestamp: new Date(),
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (text?: string) => {
    const msg = text || input;
    if (!msg.trim()) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: msg,
      timestamp: new Date(),
    };

    const response = getAIResponse(msg);
    const assistantMsg: Message = {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content: response.text,
      suggestions: response.suggestions,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setInput("");
  };

  return (
    <AppShell title="AI Wealth Concierge" subtitle="Your intelligent guide across all 32 platform features">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-12rem)]">
        {/* Chat Area */}
        <div className="lg:col-span-3 flex flex-col">
          <Card className="bg-[#0d1526]/50 border-[#1e3a5f]/50 flex-1 flex flex-col overflow-hidden">
            <CardHeader className="pb-2 shrink-0">
              <CardTitle className="text-sm text-emerald-400 flex items-center gap-2">
                <Brain className="h-4 w-4" /> Concierge Chat
                <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">AI-Powered</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-3 pb-2">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] ${msg.role === "user" ? "order-1" : ""}`}>
                    <div className={`p-3 rounded-lg ${
                      msg.role === "user"
                        ? "bg-emerald-600/20 border border-emerald-500/30 text-white"
                        : "bg-[#0a0f1a]/80 border border-[#1e3a5f]/50 text-[#94a3b8]"
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                    {msg.suggestions && msg.suggestions.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {msg.suggestions.map(sug => {
                          const Icon = sug.icon;
                          return (
                            <div key={sug.path} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all hover:border-${sug.color}-500/30 bg-[#0a0f1a]/50 border-[#1e3a5f]/50`}
                              onClick={() => setLocation(sug.path)}>
                              <div className={`w-6 h-6 rounded bg-${sug.color}-500/20 flex items-center justify-center shrink-0`}>
                                <Icon className={`h-3 w-3 text-${sug.color}-400`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-white font-medium">{sug.label}</p>
                                <p className="text-xs text-slate-500 truncate">{sug.description}</p>
                              </div>
                              <ArrowRight className="h-3 w-3 text-slate-500 shrink-0" />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </CardContent>
            <div className="p-3 border-t border-[#1e3a5f]/50 shrink-0">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSend()}
                  placeholder="Ask me anything about your financial practice..."
                  className="bg-[#0a0f1a]/50 border-[#1e3a5f] text-white placeholder:text-slate-500"
                />
                <Button onClick={() => handleSend()} className="bg-emerald-600 hover:bg-emerald-500 text-white shrink-0">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
      <PageInsights section="a-i-wealth-concierge" />
        </div>

        {/* Quick Prompts Sidebar */}
        <div className="space-y-4">
          <Card className="bg-[#0d1526]/50 border-[#1e3a5f]/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-purple-400 flex items-center gap-2">
                <Lightbulb className="h-4 w-4" /> Quick Prompts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {QUICK_PROMPTS.map(qp => {
                const Icon = qp.icon;
                return (
                  <Button key={qp.label} size="sm" variant="outline"
                    className={`w-full justify-start text-xs border-[#1e3a5f] text-[#7a95b8] hover:text-${qp.color}-400 h-auto py-2`}
                    onClick={() => handleSend(qp.prompt)}>
                    <Icon className={`h-3 w-3 mr-2 text-${qp.color}-400 shrink-0`} />
                    <span className="text-left">{qp.label}</span>
                  </Button>
                );
              })}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500/10 via-slate-800 to-purple-500/10 border-emerald-500/20">
            <CardContent className="py-3 px-3 text-center">
              <Sparkles className="h-5 w-5 text-emerald-400 mx-auto mb-1" />
              <p className="text-xs text-white font-medium">AI-Powered Navigation</p>
              <p className="text-xs text-slate-500 mt-1">The concierge understands context and can guide you to the right tool for any task.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
