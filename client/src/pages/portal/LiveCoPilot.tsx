// @ts-nocheck
import { useState, useRef, useEffect } from "react";
import { useCalculatorIntegration } from "@/hooks/useCalculatorIntegration";
import { ClientSelectorBar } from "@/components/ClientSelectorBar";
import { CalculationSyncBar } from "@/components/CalculationSyncBar";
import { GenerateOutcomeTab } from "@/components/GenerateOutcomeTab";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Bot,
  Send,
  User,
  Brain,
  Lightbulb,
  Target,
  DollarSign,
  Shield,
  TrendingUp,
  Loader2,
  Copy,
  Zap,
  Crown,
} from "lucide-react";


interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  context?: string;
}

const QUICK_PROMPTS = [
  { label: "Roth Conversion Pitch", prompt: "Help me pitch a Roth conversion to a 62-year-old client with $800K in a traditional IRA.", icon: DollarSign, color: "text-green-400" },
  { label: "Overcome Objection", prompt: "My client says 'I'll think about it.' How do I respond?", icon: Shield, color: "text-blue-400" },
  { label: "IUL Explanation", prompt: "Explain IUL benefits in simple terms for a skeptical client.", icon: Lightbulb, color: "text-amber-400" },
  { label: "Estate Planning Opener", prompt: "What's the best way to start an estate planning conversation?", icon: Target, color: "text-purple-400" },
  { label: "Tax Strategy", prompt: "Client has $2M in pre-tax accounts. What's the optimal tax strategy?", icon: TrendingUp, color: "text-teal-400" },
  { label: "Close the Deal", prompt: "I've presented the numbers. Client is interested but hesitant. How do I close?", icon: Zap, color: "text-orange-400" },
];

export default function LiveCoPilot() {
  const { user } = useAuth();
  const calcIntegration = useCalculatorIntegration({
    calculatorName: "LiveCoPilot",
    strategyType: "live-copilot",
  });
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Hey ${user?.name?.split(" ")[0] ?? "there"}! I'm your Live Co-Pilot — think of me as Sam Russell whispering in your ear during every client meeting.\n\nAsk me anything:\n- How to pitch a strategy\n- How to overcome objections\n- How to close a deal\n- What Sam would do in your situation\n\nI've studied thousands of successful advisor interactions. Let's make you unstoppable.`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "wwsd">("chat");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatMutation = trpc.liveCoPilot.chat.useMutation();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const conversationHistory = [...messages.filter(m => m.id !== "welcome"), userMsg]
        .filter(m => m.role === "user" || m.role === "assistant")
        .map(m => ({ role: m.role as "user" | "assistant", content: m.content }));

      const result = await chatMutation.mutateAsync({
        messages: conversationHistory,
        mode: activeTab === "wwsd" ? "wwsd" : "copilot",
      });

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: result.content,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
      toast.error("Failed to get response");
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <AppShell>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Integration Bar */}
        <div className="container py-2">
          <CalculationSyncBar />
          <ClientSelectorBar
            clients={calcIntegration.clients}
            clientsLoading={calcIntegration.clientsLoading}
            selectedClientId={calcIntegration.selectedClientId}
            selectedClientName={calcIntegration.selectedClientName}
            onSelectClient={calcIntegration.selectClient}
            scenarios={calcIntegration.scenarios}
            scenariosLoading={calcIntegration.scenariosLoading}
            scenarioName={calcIntegration.scenarioName}
            onSetScenarioName={calcIntegration.setScenarioName}
            onSave={() => calcIntegration.saveScenario({ messages: messages.length }, {})}
            onLoad={(s) => calcIntegration.loadScenario(s)}
            isSaving={calcIntegration.isSaving}
            lastSavedAt={calcIntegration.lastSavedAt}
            calculatorName="LiveCoPilot"
          />
        </div>
        {/* Header */}
        <div className="border-b border-border/30 bg-gradient-to-r from-violet-500/5 via-background to-blue-500/5">
          <div className="container py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white flex items-center gap-2">
                    {activeTab === "chat" ? "Live Co-Pilot" : "What Would Sam Do?"}
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">AI LIVE</Badge>
                  </h1>
                  <p className="text-xs text-muted-foreground">Real-time AI coaching powered by Russell Capital Intelligence</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={activeTab === "chat" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab("chat")}
                  className={activeTab === "chat" ? "bg-violet-600 hover:bg-violet-700" : ""}
                >
                  <Bot className="w-4 h-4 mr-1" /> Co-Pilot
                </Button>
                <Button
                  variant={activeTab === "wwsd" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab("wwsd")}
                  className={activeTab === "wwsd" ? "bg-amber-600 hover:bg-amber-700" : ""}
                >
                  <Crown className="w-4 h-4 mr-1" /> WWSD?
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Prompts */}
        <div className="border-b border-border/20">
          <div className="container py-3">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {QUICK_PROMPTS.map((qp) => {
                const Icon = qp.icon;
                return (
                  <button
                    key={qp.label}
                    onClick={() => sendMessage(qp.prompt)}
                    disabled={isTyping}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-border/30 text-xs text-muted-foreground hover:text-white transition-all whitespace-nowrap shrink-0 disabled:opacity-50"
                  >
                    <Icon className={`w-3 h-3 ${qp.color}`} />
                    {qp.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="container py-6 max-w-3xl mx-auto space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center shrink-0 mt-1">
                    {activeTab === "wwsd" ? <Crown className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
                  </div>
                )}
                <div className={`max-w-[80%] ${msg.role === "user" ? "bg-emerald-600/20 border border-emerald-500/30" : "bg-white/5 border border-border/30"} rounded-xl p-4`}>
                  <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {msg.content.split("\n").map((line, i) => {
                      if (line.startsWith("**") && line.includes(":**")) {
                        const [bold, rest] = line.split(":**");
                        return <p key={i} className="mt-2"><strong className="text-white">{bold.replace(/\*\*/g, "")}:</strong>{rest}</p>;
                      }
                      if (line.startsWith("**")) return <p key={i} className="mt-2 font-bold text-white">{line.replace(/\*\*/g, "")}</p>;
                      if (line.startsWith("*") && line.endsWith("*")) return <p key={i} className="italic text-emerald-400/80 mt-1">{line.replace(/\*/g, "")}</p>;
                      if (line.startsWith("- ") || line.match(/^\d\./)) return <p key={i} className="ml-4 text-muted-foreground">{line}</p>;
                      if (line.trim() === "") return <br key={i} />;
                      return <p key={i} className="text-muted-foreground">{line}</p>;
                    })}
                  </div>
                  {msg.role === "assistant" && msg.id !== "welcome" && (
                    <div className="mt-3 pt-2 border-t border-border/20 flex gap-2">
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { navigator.clipboard.writeText(msg.content.replace(/\*\*/g, "")); toast.success("Copied!"); }}>
                        <Copy className="w-3 h-3 mr-1" /> Copy
                      </Button>
                    </div>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0 mt-1">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white/5 border border-border/30 rounded-xl p-4">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    <span className="text-xs text-muted-foreground ml-2">
                      {activeTab === "wwsd" ? "Sam is thinking..." : "Co-Pilot is analyzing..."}
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="border-t border-border/30 bg-background/80 backdrop-blur-xl">
          <div className="container py-4 max-w-3xl mx-auto">
            <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="flex gap-3">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={activeTab === "wwsd" ? "Ask Sam anything..." : "Ask your Co-Pilot..."}
                className="flex-1"
                disabled={isTyping}
              />
              <Button type="submit" disabled={!input.trim() || isTyping} className="bg-violet-600 hover:bg-violet-700">
                {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </form>
            <p className="text-[10px] text-muted-foreground mt-2 text-center">
              Powered by Russell Capital Systems™ Intelligence — responses are AI-generated coaching suggestions
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
