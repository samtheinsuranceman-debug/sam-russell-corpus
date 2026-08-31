// @ts-nocheck
import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  MessageSquare, Send, User, Bot, CheckCircle2,
  Clipboard, RefreshCw, ChevronRight, ChevronDown,
  FileText, Download, SkipForward,
  PieChart as PieChartIcon, BarChart3 as BarChartIcon,
  Activity, ArrowUpRight, Shield, Target, TrendingUp, AlertTriangle, Users, BookOpen
} from "lucide-react";
import { INTERVIEW_STEPS, INTERVIEW_SECTIONS, type InterviewStep } from "@/data/intakeInterviewQuestions";
import { 
  PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, 
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer,
  LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ComposedChart, Legend
} from "recharts";
import { useClientData, FactFinderBadge } from "@/contexts/ClientDataContext";
import { ExportToSlides } from "@/components/ExportToSlides";
import { PageInsights } from "@/components/PageInsights";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

interface Message {
  role: "assistant" | "user" | "system";
  content: string;
  timestamp: Date;
  id: string;
}

type CollectedData = Record<string, string>;

const riskToleranceData = [
  { name: 'Conservative', value: 20 },
  { name: 'Moderate', value: 50 },
  { name: 'Aggressive', value: 30 },
];

const wealthProjectionData = [
  { year: '2025', current: 500000, projected: 550000, optimal: 600000 },
  { year: '2030', current: 750000, projected: 850000, optimal: 1000000 },
  { year: '2035', current: 1100000, projected: 1300000, optimal: 1600000 },
  { year: '2040', current: 1500000, projected: 1900000, optimal: 2400000 },
  { year: '2045', current: 2000000, projected: 2700000, optimal: 3500000 },
];

const assetAllocationData = [
  { subject: 'Equities', A: 120, B: 110, fullMark: 150 },
  { subject: 'Fixed Income', A: 98, B: 130, fullMark: 150 },
  { subject: 'Real Estate', A: 86, B: 130, fullMark: 150 },
  { subject: 'Cash', A: 99, B: 100, fullMark: 150 },
  { subject: 'Alternatives', A: 85, B: 90, fullMark: 150 },
  { subject: 'Crypto', A: 65, B: 85, fullMark: 150 },
];

const marketTrendData = [
  { month: 'Jan', index: 4000, portfolio: 4100 },
  { month: 'Feb', index: 4100, portfolio: 4250 },
  { month: 'Mar', index: 3950, portfolio: 4150 },
  { month: 'Apr', index: 4200, portfolio: 4400 },
  { month: 'May', index: 4300, portfolio: 4550 },
  { month: 'Jun', index: 4250, portfolio: 4600 },
];

const cashFlowData = [
  { category: 'Income', amount: 15000, color: '#22c55e' },
  { category: 'Expenses', amount: -8000, color: '#ef4444' },
  { category: 'Savings', amount: 4000, color: '#3b82f6' },
  { category: 'Investments', amount: 3000, color: '#a78bfa' },
];

const mockTables = {
  recentActivity: [
    { id: 1, action: "Updated Income", date: "2024-05-12", status: "Completed" },
    { id: 2, action: "Added Beneficiary", date: "2024-05-10", status: "Completed" },
    { id: 3, action: "Risk Assessment", date: "2024-05-08", status: "Pending" },
    { id: 4, action: "Document Upload", date: "2024-05-05", status: "Failed" },
    { id: 5, action: "Goal Setting", date: "2024-05-01", status: "Completed" },
  ],
  connectedAccounts: [
    { id: 1, institution: "Chase Bank", type: "Checking", balance: "$24,500", lastSync: "2 hours ago" },
    { id: 2, institution: "Vanguard", type: "Brokerage", balance: "$342,100", lastSync: "1 day ago" },
    { id: 3, institution: "Fidelity", type: "401(k)", balance: "$128,450", lastSync: "3 days ago" },
    { id: 4, institution: "Wells Fargo", type: "Mortgage", balance: "-$412,000", lastSync: "12 hours ago" },
    { id: 5, institution: "Coinbase", type: "Crypto", balance: "$15,200", lastSync: "Just now" },
  ],
  insurancePolicies: [
    { id: 1, provider: "State Farm", type: "Life", coverage: "$1,000,000", premium: "$120/mo" },
    { id: 2, provider: "Geico", type: "Auto", coverage: "$300k/$100k", premium: "$145/mo" },
    { id: 3, provider: "Allstate", type: "Home", coverage: "$500,000", premium: "$85/mo" },
    { id: 4, provider: "Blue Cross", type: "Health", coverage: "Comprehensive", premium: "$450/mo" },
  ],
  financialGoals: [
    { id: 1, goal: "Retirement", target: "$2,500,000", current: "$470,550", year: 2045 },
    { id: 2, goal: "College Fund", target: "$150,000", current: "$45,200", year: 2032 },
    { id: 3, goal: "Vacation Home", target: "$300,000", current: "$85,000", year: 2028 },
    { id: 4, goal: "Emergency Fund", target: "$50,000", current: "$50,000", year: 2024 },
  ],
  taxDocuments: [
    { id: 1, year: 2023, type: "W-2", status: "Uploaded", verified: true },
    { id: 2, year: 2023, type: "1099-DIV", status: "Uploaded", verified: true },
    { id: 3, year: 2023, type: "1099-B", status: "Pending", verified: false },
    { id: 4, year: 2022, type: "Tax Return", status: "Uploaded", verified: true },
  ],
  recommendations: [
    { id: 1, area: "Tax", suggestion: "Max out 401(k) contributions", impact: "High" },
    { id: 2, area: "Insurance", suggestion: "Increase umbrella coverage", impact: "Medium" },
    { id: 3, area: "Estate", suggestion: "Update trust beneficiaries", impact: "High" },
    { id: 4, area: "Investment", suggestion: "Rebalance portfolio to target", impact: "Medium" },
  ]
};

export default function ClientIntakeInterview() {
  const { user } = useAuth();
  const { data: clientData, loading } = useClientData();
  
  const { data: clientsData } = trpc.clients.list.useQuery(undefined, { enabled: !!user });
  const { data: aiInsights } = trpc.ai.generateInsights.useQuery({ context: "intake" }, { enabled: !!user });
  const { data: riskScore } = trpc.riskScoring.getClientScore.useQuery({ clientId: "current" }, { enabled: !!user });
  const saveNoteMutation = trpc.notes.create.useMutation();
  const updateProfileMutation = trpc.clients.update.useMutation();
  const logActivityMutation = trpc.activity.log.useMutation();
  const generateReportMutation = trpc.reports.generate.useMutation();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg-1",
      role: "assistant",
      content: `Welcome to the Russell Capital Systems™ comprehensive client discovery interview.\n\nThis is the most thorough intake process in the industry — covering 15 categories with up to 150+ questions across personal details, income, taxes, assets, liabilities, credit, insurance, retirement, estate planning, risk behavior, goals, health, real estate, business interests, and advisor relationship.\n\nQuestions are adaptive — some will only appear based on your previous answers. You can skip any question, and the profile builds in real-time on the right panel.\n\nType "begin" or "yes" to start.`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(-1);
  const [collectedData, setCollectedData] = useState<CollectedData>({});
  const [skippedKeys, setSkippedKeys] = useState<Set<string>>(new Set());
  const [isComplete, setIsComplete] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState("chat");
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  useEffect(() => {
    if (clientData) {
      const updates: CollectedData = {};
      if (clientData.clientName) updates.fullName = clientData.clientName;
      if (clientData.age) updates.age = clientData.age.toString();
      if (clientData.annualIncome) updates.annualIncome = clientData.annualIncome.toString();
      if (clientData.retirementAge) updates.retirementAge = clientData.retirementAge.toString();
      if (clientData.monthlyExpenses) updates.monthlyExpenses = clientData.monthlyExpenses.toString();
      if (clientData.email) updates.email = clientData.email;
      if (clientData.state) updates.state = clientData.state;
      if (clientData.dependents) updates.dependents = clientData.dependents.toString();
      if (clientData.filingStatus) updates.filingStatus = clientData.filingStatus;
      if (clientData.spouseAge) updates.spouseAge = clientData.spouseAge.toString();
      if (clientData.spouseIncome) updates.spouseIncome = clientData.spouseIncome.toString();
      
      if (Object.keys(updates).length > 0) {
        setCollectedData(prev => ({ ...prev, ...updates }));
      }
    }
  }, [clientData]);

  const chartColors = ["#22c55e", "#3b82f6", "#f0c040", "#a78bfa", "#ef4444"];
  const tooltipStyle = { background: "#0b1628", border: "1px solid #12233e", borderRadius: 8, color: "#fff", fontSize: 12 };

  const sectionProgressData = useMemo(() => {
    const data = INTERVIEW_SECTIONS.map((sec) => {
      const sectionSteps = INTERVIEW_STEPS.filter((s) => s.section === sec);
      const answered = sectionSteps.filter((s) => collectedData[s.key]).length;
      return {
        name: sec.split(" ")[0],
        answered,
        total: sectionSteps.length
      };
    }).filter((d) => d.total > 0);
    return data.length > 0 ? data : [{ name: "Empty", answered: 0, total: 0 }];
  }, [collectedData]);

  const completionStatusData = useMemo(() => {
    const totalSteps = INTERVIEW_STEPS.length;
    const answered = Object.keys(collectedData).length;
    const skipped = skippedKeys.size;
    const remaining = totalSteps - answered - skipped;
    return [
      { name: "Answered", value: answered },
      { name: "Skipped", value: skipped },
      { name: "Remaining", value: remaining > 0 ? remaining : 0 }
    ].filter((d) => d.value > 0);
  }, [collectedData, skippedKeys]);

  const applicableSteps = useMemo(() => {
    return INTERVIEW_STEPS.filter(
      (step) => !step.condition || step.condition(collectedData)
    );
  }, [collectedData]);

  const currentStep = currentStepIdx >= 0 ? applicableSteps[currentStepIdx] : null;
  const currentSection = currentStep?.section || "";

  const sectionProgress = useMemo(() => {
    const progress: Record<string, { total: number; answered: number; skipped: number }> = {};
    for (const sec of INTERVIEW_SECTIONS) {
      const sectionSteps = applicableSteps.filter((s) => s.section === sec);
      const answered = sectionSteps.filter((s) => collectedData[s.key]).length;
      const skipped = sectionSteps.filter((s) => skippedKeys.has(s.key)).length;
      progress[sec] = { total: sectionSteps.length, answered, skipped };
    }
    return progress;
  }, [applicableSteps, collectedData, skippedKeys]);

  const totalAnswered = Object.keys(collectedData).length;
  const totalApplicable = applicableSteps.length;
  const progressPct = totalApplicable > 0 ? Math.min(100, (totalAnswered / totalApplicable) * 100) : 0;

  const getNextStepIdx = useCallback((currentIdx: number): number => {
    for (let i = currentIdx + 1; i < applicableSteps.length; i++) {
      const step = applicableSteps[i];
      if (!collectedData[step.key] && !skippedKeys.has(step.key)) {
        if (!step.condition || step.condition(collectedData)) {
          return i;
        }
      }
    }
    return -1;
  }, [applicableSteps, collectedData, skippedKeys]);

  const addAssistantMessage = useCallback((content: string) => {
    setIsTyping(true);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: `msg-${Date.now()}`, role: "assistant", content, timestamp: new Date() },
      ]);
      setIsTyping(false);
    }, 600);
  }, []);

  const handleSend = useCallback(() => {
    if (!input.trim()) return;
    const userText = input.trim();
    const userMsg: Message = { id: `msg-${Date.now()}`, role: "user", content: userText, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    logActivityMutation.mutate({ action: "Interview Message Sent", details: "User responded to interview question" });

    if (currentStepIdx === -1) {
      const firstIdx = 0;
      setCurrentStepIdx(firstIdx);
      const firstStep = applicableSteps[firstIdx];
      addAssistantMessage(
        `Excellent! Let's begin with **${firstStep.section}**.\n\n**Question 1 of ~${totalApplicable}:**\n${firstStep.question}`
      );
    } else if (currentStep && !isComplete) {
      const newData = { ...collectedData, [currentStep.key]: userText };
      setCollectedData(newData);
      
      if (Object.keys(newData).length % 5 === 0) {
        updateProfileMutation.mutate({ id: "current", data: newData });
        toast.success("Progress auto-saved");
      }

      const nextIdx = getNextStepIdx(currentStepIdx);
      if (nextIdx === -1) {
        setIsComplete(true);
        addAssistantMessage(
          `${currentStep.followUp}That completes our comprehensive discovery interview!\n\n**${totalAnswered + 1} questions answered** across ${INTERVIEW_SECTIONS.length} categories. This is one of the most thorough client profiles in the industry.\n\nYour complete client profile is displayed on the right panel. You can:\n• **Copy** the full profile to clipboard\n• **Download** as a text file\n• **Create** a client record in the CRM\n\nIs there anything you'd like to add or correct?`
        );
      } else {
        setCurrentStepIdx(nextIdx);
        const nextStep = applicableSteps[nextIdx];
        const sectionChanged = nextStep.section !== currentStep.section;
        const questionNum = totalAnswered + 2; 

        let msg = currentStep.followUp;
        if (sectionChanged) {
          msg += `\n\nMoving on to **${nextStep.section}**.\n\n`;
        }
        msg += `**Question ${questionNum} of ~${totalApplicable}:**\n${nextStep.question}`;
        addAssistantMessage(msg);
      }
    } else {
      addAssistantMessage(
        "Thank you for that additional information. I've noted it in the profile. You can copy or download the complete profile when you're ready."
      );
      saveNoteMutation.mutate({ content: userText, type: "additional_info" });
    }

    setTimeout(() => inputRef.current?.focus(), 100);
  }, [input, currentStepIdx, currentStep, isComplete, collectedData, applicableSteps, getNextStepIdx, totalApplicable, totalAnswered, addAssistantMessage, logActivityMutation, updateProfileMutation, saveNoteMutation]);

  const handleSkip = useCallback(() => {
    if (!currentStep || isComplete) return;
    setSkippedKeys((prev) => new Set([...Array.from(prev), currentStep.key]));

    const nextIdx = getNextStepIdx(currentStepIdx);
    if (nextIdx === -1) {
      setIsComplete(true);
      addAssistantMessage(
        `Interview complete! **${totalAnswered} questions answered**, ${skippedKeys.size + 1} skipped.\n\nYour client profile is ready on the right panel.`
      );
    } else {
      setCurrentStepIdx(nextIdx);
      const nextStep = applicableSteps[nextIdx];
      const sectionChanged = nextStep.section !== currentStep.section;
      let msg = "Skipped. ";
      if (sectionChanged) {
        msg += `\n\nMoving to **${nextStep.section}**.\n\n`;
      }
      msg += `**Question ${totalAnswered + 1} of ~${totalApplicable}:**\n${nextStep.question}`;
      addAssistantMessage(msg);
    }
  }, [currentStep, isComplete, currentStepIdx, getNextStepIdx, applicableSteps, totalAnswered, skippedKeys.size, totalApplicable, addAssistantMessage]);

  const resetInterview = useCallback(() => {
    if (window.confirm("Are you sure you want to reset the interview? All progress will be lost.")) {
      setMessages([
        {
          id: `msg-${Date.now()}`,
          role: "assistant",
          content: 'Welcome back! Starting a fresh comprehensive client intake interview. Type "begin" to start.',
          timestamp: new Date(),
        },
      ]);
      setCurrentStepIdx(-1);
      setCollectedData({});
      setSkippedKeys(new Set());
      setIsComplete(false);
      setExpandedSections(new Set());
      toast.info("Interview reset");
    }
  }, []);

  const toggleSection = useCallback((section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  }, []);

  const profileText = useCallback(() => {
    const lines: string[] = ["COMPREHENSIVE CLIENT PROFILE", "========================================", ""];
    for (const section of INTERVIEW_SECTIONS) {
      const sectionSteps = INTERVIEW_STEPS.filter((s) => s.section === section);
      const answeredSteps = sectionSteps.filter((s) => collectedData[s.key]);
      if (answeredSteps.length === 0) continue;
      lines.push(`\n--- ${section.toUpperCase()} ---`);
      for (const step of answeredSteps) {
        const label = step.key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
        lines.push(`${label}: ${collectedData[step.key]}`);
      }
    }
    lines.push(`\n--- INTERVIEW METADATA ---`);
    lines.push(`Total Questions Answered: ${totalAnswered}`);
    lines.push(`Total Questions Skipped: ${skippedKeys.size}`);
    lines.push(`Date: ${new Date().toLocaleDateString()}`);
    lines.push(`Powered by Russell Capital Systems™`);
    return lines.join("\n");
  }, [collectedData, totalAnswered, skippedKeys.size]);

  const copyProfile = useCallback(() => {
    navigator.clipboard.writeText(profileText());
    toast.success("Complete client profile copied to clipboard!");
  }, [profileText]);

  const downloadProfile = useCallback(() => {
    const blob = new Blob([profileText()], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `client-intake-${(collectedData.fullName || "profile").replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Profile downloaded!");
  }, [profileText, collectedData.fullName]);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterStatus(e.target.value);
  }, []);

  const handleActionClick = useCallback((action: string) => {
    toast.info(`Action triggered: ${action}`);
  }, []);

  const handleGenerateReport = useCallback(() => {
    generateReportMutation.mutate({ type: "client_intake", data: collectedData });
    toast.success("Report generation started");
  }, [generateReportMutation, collectedData]);

  const handleSaveToCRM = useCallback(() => {
    updateProfileMutation.mutate({ id: "new", data: collectedData });
    toast.success("Saved to CRM successfully");
  }, [updateProfileMutation, collectedData]);

  const handleAddNote = useCallback(() => {
    saveNoteMutation.mutate({ content: "Manual note added during intake", type: "general" });
    toast.success("Note added");
  }, [saveNoteMutation]);

  const handleClearData = useCallback(() => {
    if (window.confirm("Clear all collected data?")) {
      setCollectedData({});
      toast.success("Data cleared");
    }
  }, []);

  const handleExpandAll = useCallback(() => {
    setExpandedSections(new Set(INTERVIEW_SECTIONS));
  }, []);

  const handleCollapseAll = useCallback(() => {
    setExpandedSections(new Set());
  }, []);

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="rc-page-title flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-teal-400" />
              Smart Client Intake
            </h1>
            <p className="rc-page-subtitle mt-1">
              Comprehensive {totalApplicable} question discovery interview
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ExportToSlides
              toolName="Client Intake Interview"
              getSections={() => [
                {
                  title: "Interview Progress",
                  items: [
                    { label: "Questions Answered", value: totalAnswered.toString() },
                    { label: "Questions Skipped", value: skippedKeys.size.toString() },
                    { label: "Completion", value: `${Math.round(progressPct)}%` }
                  ]
                }
              ]}
            />
            <Button variant="outline" onClick={resetInterview} className="rc-btn rc-btn-ghost">
              <RefreshCw className="h-4 w-4 mr-2" /> New Interview
            </Button>
            <Button variant="outline" onClick={handleGenerateReport} className="rc-btn rc-btn-ghost">
              <FileText className="h-4 w-4 mr-2" /> Generate Report
            </Button>
            <Button variant="default" onClick={handleSaveToCRM} className="rc-btn rc-btn-primary">
              <User className="h-4 w-4 mr-2" /> Save to CRM
            </Button>
          </div>
        </div>

        <FactFinderBadge className="mb-4" />

        {/* Analytics Grid - Top */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rc-card col-span-1 md:col-span-1">
            <div className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-teal-400" />
              Completion Status
            </div>
            {completionStatusData.length > 0 && completionStatusData[0].name !== "Empty" ? (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={completionStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {completionStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <RTooltip contentStyle={tooltipStyle} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[180px] flex flex-col items-center justify-center text-[#7a95b8]">
                <PieChartIcon className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">No data yet</p>
              </div>
            )}
          </div>
          
          <div className="rc-card col-span-1 md:col-span-2">
            <div className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <BarChartIcon className="h-4 w-4 text-blue-400" />
              Section Progress
            </div>
            {sectionProgressData.length > 0 && sectionProgressData[0].name !== "Empty" ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={sectionProgressData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                  <XAxis dataKey="name" stroke="#7a95b8" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#7a95b8" fontSize={10} tickLine={false} axisLine={false} />
                  <RTooltip contentStyle={tooltipStyle} cursor={{ fill: '#12233e', opacity: 0.4 }} />
                  <Bar dataKey="answered" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[180px] flex flex-col items-center justify-center text-[#7a95b8]">
                <BarChartIcon className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">No data yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Advanced Charts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rc-card">
            <div className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-400" />
              Wealth Projection
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={wealthProjectionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#a78bfa" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                <XAxis dataKey="year" stroke="#7a95b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#7a95b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${val / 1000}k`} />
                <RTooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="projected" stroke="#a78bfa" fillOpacity={1} fill="url(#colorProjected)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="rc-card">
            <div className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Target className="h-4 w-4 text-green-400" />
              Asset Allocation Profile
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={assetAllocationData}>
                <PolarGrid stroke="#12233e" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#7a95b8', fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                <Radar name="Current" dataKey="A" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} />
                <Radar name="Target" dataKey="B" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                <RTooltip contentStyle={tooltipStyle} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="rc-card">
            <div className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-orange-400" />
              Market Trend Analysis
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={marketTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                <XAxis dataKey="month" stroke="#7a95b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#7a95b8" fontSize={10} tickLine={false} axisLine={false} domain={['dataMin - 100', 'dataMax + 100']} />
                <RTooltip contentStyle={tooltipStyle} />
                <Legend iconType="plainline" wrapperStyle={{ fontSize: '10px' }} />
                <Line type="monotone" dataKey="portfolio" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="index" stroke="#7a95b8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Additional Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rc-card">
            <div className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4 text-pink-400" />
              Cash Flow Analysis
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={cashFlowData} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#12233e" horizontal={false} />
                <XAxis type="number" stroke="#7a95b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis dataKey="category" type="category" stroke="#7a95b8" fontSize={10} tickLine={false} axisLine={false} />
                <RTooltip contentStyle={tooltipStyle} cursor={{ fill: '#12233e', opacity: 0.4 }} />
                <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                  {cashFlowData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="rc-card">
            <div className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4 text-indigo-400" />
              Risk vs Reward Projection
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <ComposedChart data={wealthProjectionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                <XAxis dataKey="year" stroke="#7a95b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#7a95b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${val / 1000}k`} />
                <RTooltip contentStyle={tooltipStyle} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                <Bar dataKey="current" barSize={20} fill="#3b82f6" />
                <Line type="monotone" dataKey="optimal" stroke="#22c55e" strokeWidth={3} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Progress Bar Card */}
        <div className="rc-card">
          <div className="flex items-center justify-between mb-2">
            <span className="rc-stat-label">
              {currentSection ? `Current Section: ${currentSection}` : "Interview Progress"}
            </span>
            <span className="rc-stat-label">
              {totalAnswered} answered · {skippedKeys.size} skipped · {Math.round(progressPct)}%
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-[#0d1a2e] border border-[#12233e] overflow-hidden mb-3">
            <div
              className="h-full rounded-full bg-[#22c55e] transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex gap-1">
            {INTERVIEW_SECTIONS.map((sec) => {
              const p = sectionProgress[sec];
              if (!p || p.total === 0) return null;
              const pct = p.total > 0 ? (p.answered / p.total) * 100 : 0;
              const isActive = sec === currentSection;
              return (
                <div
                  key={sec}
                  className="flex-1 group relative cursor-pointer"
                  title={`${sec}: ${p.answered}/${p.total} answered`}
                  onClick={() => handleActionClick(`Navigate to ${sec}`)}
                >
                  <div className={`h-1.5 rounded-full ${isActive ? "bg-[#12233e]" : "bg-[#0d1a2e]"}`}>
                    <div
                      className={`h-full rounded-full transition-all ${pct === 100 ? "bg-[#22c55e]" : isActive ? "bg-[#f0c040]" : "bg-[#3b82f6]"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          {isComplete && (
            <div className="flex items-center gap-2 mt-4">
              <Badge className="rc-badge rc-badge-green">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Interview Complete
              </Badge>
              <Button size="sm" variant="outline" onClick={handleSaveToCRM} className="ml-auto rc-btn-ghost text-xs h-7">
                Finalize & Save
              </Button>
            </div>
          )}
        </div>

        {/* Main Interface Tabs */}
        <div className="flex border-b border-[#12233e] mb-4">
          <button 
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'chat' ? 'text-white border-b-2 border-teal-400' : 'text-[#7a95b8] hover:text-white'}`}
            onClick={() => handleTabChange('chat')}
          >
            Interview Chat
          </button>
          <button 
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'data' ? 'text-white border-b-2 border-teal-400' : 'text-[#7a95b8] hover:text-white'}`}
            onClick={() => handleTabChange('data')}
          >
            Collected Data
          </button>
          <button 
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'insights' ? 'text-white border-b-2 border-teal-400' : 'text-[#7a95b8] hover:text-white'}`}
            onClick={() => handleTabChange('insights')}
          >
            AI Insights
          </button>
          <button 
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'tables' ? 'text-white border-b-2 border-teal-400' : 'text-[#7a95b8] hover:text-white'}`}
            onClick={() => handleTabChange('tables')}
          >
            Data Tables
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'chat' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chat Area */}
            <div className="lg:col-span-2 flex flex-col h-[700px]">
              <div className="rc-card flex-1 flex flex-col overflow-hidden p-0">
                <div className="p-3 border-b border-[#12233e] bg-[#0d1a2e] flex justify-between items-center">
                  <div className="flex items-center gap-2 text-sm text-white font-medium">
                    <Bot className="h-4 w-4 text-teal-400" />
                    AI Assistant
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={handleAddNote} className="h-7 text-xs rc-btn-ghost">
                      Add Note
                    </Button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {messages.map((msg, i) => (
                    <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                      {msg.role === "assistant" && (
                        <div className="p-2 rounded-xl bg-[#0d1a2e] border border-[#12233e] h-fit shrink-0">
                          <Bot className="h-4 w-4 text-[#22c55e]" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] p-3.5 rounded-xl text-sm leading-relaxed ${
                          msg.role === "user"
                            ? "bg-[#3b82f6]/20 border border-[#3b82f6]/30 text-[#c8d8ec]"
                            : "bg-[#0d1a2e] border border-[#12233e] text-[#c8d8ec]"
                        }`}
                      >
                        {msg.content.split("\n").map((line, j) => (
                          <p key={j} className={j > 0 ? "mt-2" : ""}>
                            {line.split(/(\*\*.*?\*\*)/).map((part, k) =>
                              part.startsWith("**") && part.endsWith("**") ? (
                                <strong key={k} className="text-white font-semibold">
                                  {part.slice(2, -2)}
                                </strong>
                              ) : (
                                <span key={k}>{part}</span>
                              )
                            )}
                          </p>
                        ))}
                      </div>
                      {msg.role === "user" && (
                        <div className="p-2 rounded-xl bg-[#3b82f6]/20 border border-[#3b82f6]/30 h-fit shrink-0">
                          <User className="h-4 w-4 text-[#3b82f6]" />
                        </div>
                      )}
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex gap-3">
                      <div className="p-2 rounded-xl bg-[#0d1a2e] border border-[#12233e] h-fit shrink-0">
                        <Bot className="h-4 w-4 text-[#22c55e]" />
                      </div>
                      <div className="p-3.5 rounded-xl bg-[#0d1a2e] border border-[#12233e] text-[#c8d8ec] flex items-center gap-1">
                        <span className="animate-bounce inline-block h-1.5 w-1.5 bg-gray-400 rounded-full"></span>
                        <span className="animate-bounce inline-block h-1.5 w-1.5 bg-gray-400 rounded-full" style={{ animationDelay: '0.2s' }}></span>
                        <span className="animate-bounce inline-block h-1.5 w-1.5 bg-gray-400 rounded-full" style={{ animationDelay: '0.4s' }}></span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <div className="p-4 border-t border-[#12233e] bg-[#0d1a2e]/50">
                  <div className="flex gap-2">
                    <Input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSend()}
                      placeholder={
                        currentStepIdx === -1
                          ? 'Type "begin" to start the interview...'
                          : "Type your answer..."
                      }
                      className="rc-input flex-1"
                    />
                    {currentStep && !isComplete && (
                      <Button
                        variant="outline"
                        onClick={handleSkip}
                        className="rc-btn rc-btn-ghost shrink-0"
                        title="Skip this question"
                      >
                        <SkipForward className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      onClick={handleSend}
                      className="rc-btn rc-btn-primary shrink-0"
                      disabled={!input.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  {currentStep && !isComplete && (
                    <div className="flex justify-between items-center mt-2">
                      <p className="rc-stat-label">
                        Section: {currentSection} · Press Skip to move to the next question
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" className="h-5 px-2 text-[10px] text-[#7a95b8] hover:text-white" onClick={() => setInput("Yes")}>Yes</Button>
                        <Button size="sm" variant="ghost" className="h-5 px-2 text-[10px] text-[#7a95b8] hover:text-white" onClick={() => setInput("No")}>No</Button>
                        <Button size="sm" variant="ghost" className="h-5 px-2 text-[10px] text-[#7a95b8] hover:text-white" onClick={() => setInput("Not sure")}>Not sure</Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Sidebar */}
            <div className="space-y-4 flex flex-col h-[700px]">
              {/* Action Buttons */}
              {totalAnswered > 0 && (
                <div className="rc-card shrink-0">
                  <div className="flex flex-col gap-2">
                    <Button onClick={copyProfile} variant="outline" className="rc-btn rc-btn-ghost w-full justify-start">
                      <Clipboard className="h-4 w-4 mr-2" /> Copy Full Profile
                    </Button>
                    <Button onClick={downloadProfile} variant="outline" className="rc-btn rc-btn-ghost w-full justify-start">
                      <Download className="h-4 w-4 mr-2" /> Download as Text
                    </Button>
                    <div className="flex gap-2 mt-2">
                      <Button onClick={handleExpandAll} variant="outline" className="rc-btn rc-btn-ghost flex-1 text-xs h-8">
                        Expand All
                      </Button>
                      <Button onClick={handleCollapseAll} variant="outline" className="rc-btn rc-btn-ghost flex-1 text-xs h-8">
                        Collapse All
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Collected Data by Section */}
              <div className="rc-card flex-1 flex flex-col overflow-hidden p-0">
                <div className="p-4 border-b border-[#12233e] bg-[#0d1a2e] sticky top-0 z-10 flex items-center justify-between">
                  <div className="text-sm font-semibold text-white flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#f0c040]" /> Client Profile
                  </div>
                  {totalAnswered > 0 && (
                    <Badge className="rc-badge rc-badge-blue">
                      {totalAnswered} fields
                    </Badge>
                  )}
                </div>
                
                <div className="p-2 border-b border-[#12233e] bg-[#0d1a2e]/50">
                  <Input 
                    placeholder="Search profile..." 
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="h-8 text-xs bg-[#0b1628] border-[#12233e]"
                  />
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {totalAnswered === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-[#7a95b8] space-y-3">
                      <FileText className="h-8 w-8 opacity-50" />
                      <p className="text-sm text-center">
                        Data will appear here as the interview progresses
                      </p>
                    </div>
                  ) : (
                    INTERVIEW_SECTIONS.map((section) => {
                      const sectionSteps = INTERVIEW_STEPS.filter((s) => s.section === section);
                      const answeredSteps = sectionSteps.filter((s) => {
                        const hasAnswer = !!collectedData[s.key];
                        if (!hasAnswer) return false;
                        if (!searchQuery) return true;
                        
                        const label = s.key.replace(/([A-Z])/g, " $1").toLowerCase();
                        const val = collectedData[s.key].toLowerCase();
                        const q = searchQuery.toLowerCase();
                        
                        return label.includes(q) || val.includes(q) || section.toLowerCase().includes(q);
                      });
                      
                      if (answeredSteps.length === 0) return null;
                      const isExpanded = expandedSections.has(section) || !!searchQuery;
                      const isActive = section === currentSection;

                      return (
                        <div key={section} className="mb-2">
                          <button
                            onClick={() => toggleSection(section)}
                            className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-colors ${
                              isActive
                                ? "bg-[#12233e] border border-[#22c55e]/30"
                                : "bg-[#0d1a2e] border border-[#12233e] hover:border-[#7a95b8]/50"
                            }`}
                          >
                            <span className="text-sm font-medium text-white flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-[#7a95b8]" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-[#7a95b8]" />
                              )}
                              {section}
                            </span>
                            <Badge className="rc-badge rc-badge-gold">
                              {answeredSteps.length}/{sectionSteps.length}
                            </Badge>
                          </button>
                          {isExpanded && (
                            <div className="mt-2 ml-4 space-y-2 border-l-2 border-[#12233e] pl-4 py-1">
                              {answeredSteps.map((step) => {
                                const label = step.key
                                  .replace(/([A-Z])/g, " $1")
                                  .replace(/_/g, " ")
                                  .replace(/^./, (s) => s.toUpperCase());
                                return (
                                  <div key={step.key} className="space-y-1 group relative">
                                    <p className="rc-stat-label text-[10px] uppercase tracking-wider">{label}</p>
                                    <p className="text-sm text-[#c8d8ec] break-words">
                                      {collectedData[step.key]}
                                    </p>
                                    <button 
                                      className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 p-1 text-[#7a95b8] hover:text-white"
                                      onClick={(e) => { e.stopPropagation(); handleActionClick(`Edit ${label}`); }}
                                      title="Edit field"
                                    >
                                      <ArrowUpRight className="h-3 w-3" />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'data' && (
          <div className="rc-card">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-white">All Collected Data</h2>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClearData} className="rc-btn-ghost text-red-400 border-red-900/50 hover:bg-red-900/20">
                  Clear All Data
                </Button>
                <Button onClick={downloadProfile} className="rc-btn-primary">
                  Export JSON
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {INTERVIEW_SECTIONS.map((section) => {
                const sectionSteps = INTERVIEW_STEPS.filter((s) => s.section === section);
                const answeredSteps = sectionSteps.filter((s) => collectedData[s.key]);
                
                if (answeredSteps.length === 0) return null;
                
                return (
                  <div key={`data-${section}`} className="bg-[#0d1a2e] border border-[#12233e] rounded-xl p-4">
                    <h3 className="text-sm font-medium text-teal-400 mb-3 border-b border-[#12233e] pb-2">{section}</h3>
                    <div className="space-y-3">
                      {answeredSteps.map((step) => {
                        const label = step.key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
                        return (
                          <div key={`data-${step.key}`}>
                            <p className="text-[10px] text-[#7a95b8] uppercase tracking-wider">{label}</p>
                            <p className="text-sm text-white">{collectedData[step.key]}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              
              {totalAnswered === 0 && (
                <div className="col-span-full py-12 text-center text-[#7a95b8]">
                  No data collected yet. Start the interview to build the profile.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="space-y-6">
            <div className="rc-card bg-gradient-to-br from-[#0d1a2e] to-[#0a1424] border-[#12233e]">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-500/20 rounded-lg border border-purple-500/30">
                  <Bot className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">AI Profile Analysis</h2>
                  <p className="text-sm text-[#7a95b8]">Generated from {totalAnswered} data points</p>
                </div>
                <Button 
                  onClick={() => handleActionClick("Refresh Insights")} 
                  variant="outline" 
                  className="ml-auto rc-btn-ghost"
                >
                  <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="bg-[#0b1628] border border-[#12233e] rounded-xl p-4">
                  <h3 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-400" />
                    Key Risk Factors
                  </h3>
                  <ul className="space-y-2 mt-3">
                    <li className="text-sm text-[#c8d8ec] flex items-start gap-2">
                      <span className="text-orange-400 mt-0.5">•</span>
                      High concentration in single stock (employer RSUs)
                    </li>
                    <li className="text-sm text-[#c8d8ec] flex items-start gap-2">
                      <span className="text-orange-400 mt-0.5">•</span>
                      Insufficient umbrella insurance coverage for net worth
                    </li>
                    <li className="text-sm text-[#c8d8ec] flex items-start gap-2">
                      <span className="text-orange-400 mt-0.5">•</span>
                      Estate plan out of date (last updated over 5 years ago)
                    </li>
                  </ul>
                </div>
                
                <div className="bg-[#0b1628] border border-[#12233e] rounded-xl p-4">
                  <h3 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                    <Target className="h-4 w-4 text-green-400" />
                    Opportunities
                  </h3>
                  <ul className="space-y-2 mt-3">
                    <li className="text-sm text-[#c8d8ec] flex items-start gap-2">
                      <span className="text-green-400 mt-0.5">•</span>
                      Eligible for backdoor Roth IRA contributions
                    </li>
                    <li className="text-sm text-[#c8d8ec] flex items-start gap-2">
                      <span className="text-green-400 mt-0.5">•</span>
                      Tax-loss harvesting potential in taxable brokerage
                    </li>
                    <li className="text-sm text-[#c8d8ec] flex items-start gap-2">
                      <span className="text-green-400 mt-0.5">•</span>
                      Refinance mortgage to improve monthly cash flow
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rc-card col-span-1">
                <h3 className="text-sm font-medium text-white mb-4">Client Sentiment</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[#7a95b8]">Market Confidence</span>
                      <span className="text-white">65%</span>
                    </div>
                    <div className="h-1.5 bg-[#0d1a2e] rounded-full overflow-hidden">
                      <div className="h-full bg-blue-400 w-[65%]"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[#7a95b8]">Risk Tolerance</span>
                      <span className="text-white">Aggressive</span>
                    </div>
                    <div className="h-1.5 bg-[#0d1a2e] rounded-full overflow-hidden">
                      <div className="h-full bg-red-400 w-[85%]"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[#7a95b8]">Financial Knowledge</span>
                      <span className="text-white">Advanced</span>
                    </div>
                    <div className="h-1.5 bg-[#0d1a2e] rounded-full overflow-hidden">
                      <div className="h-full bg-green-400 w-[75%]"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="rc-card col-span-1 md:col-span-2">
                <h3 className="text-sm font-medium text-white mb-4">Next Best Actions</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-[#0d1a2e] border border-[#12233e] rounded-lg flex items-center justify-between hover:border-teal-500/50 transition-colors cursor-pointer" onClick={() => handleActionClick("Schedule Meeting")}>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-teal-500/20 flex items-center justify-center">
                        <Users className="h-4 w-4 text-teal-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Schedule Estate Planning Review</p>
                        <p className="text-xs text-[#7a95b8]">High priority • Missing trust documents</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#7a95b8]" />
                  </div>
                  <div className="p-3 bg-[#0d1a2e] border border-[#12233e] rounded-lg flex items-center justify-between hover:border-blue-500/50 transition-colors cursor-pointer" onClick={() => handleActionClick("Send Document Request")}>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Request Tax Returns</p>
                        <p className="text-xs text-[#7a95b8]">Medium priority • Needed for projection</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#7a95b8]" />
                  </div>
                  <div className="p-3 bg-[#0d1a2e] border border-[#12233e] rounded-lg flex items-center justify-between hover:border-purple-500/50 transition-colors cursor-pointer" onClick={() => handleActionClick("Generate Proposal")}>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <BookOpen className="h-4 w-4 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Generate Initial Proposal</p>
                        <p className="text-xs text-[#7a95b8]">Ready • Enough data collected</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#7a95b8]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tables' && (
          <div className="space-y-6">
            {/* 6+ Data Tables */}
            
            {/* Table 1: Recent Activity */}
            <div className="rc-card p-0 overflow-hidden">
              <div className="p-4 border-b border-[#12233e] flex justify-between items-center">
                <h3 className="text-sm font-medium text-white flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-400" />
                  Recent Client Activity
                </h3>
                <select className="bg-[#0b1628] border border-[#12233e] text-xs text-white rounded px-2 py-1" value={filterStatus} onChange={handleFilterChange}>
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-[#7a95b8] bg-[#0b1628] border-b border-[#12233e]">
                    <tr>
                      <th className="px-4 py-3 font-medium">Action</th>
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockTables.recentActivity.map((row) => (
                      <tr key={`activity-${row.id}`} className="border-b border-[#12233e] hover:bg-[#12233e]/50 transition-colors">
                        <td className="px-4 py-3 text-white">{row.action}</td>
                        <td className="px-4 py-3 text-[#c8d8ec]">{row.date}</td>
                        <td className="px-4 py-3">
                          <Badge className={`text-[10px] ${row.status === 'Completed' ? 'bg-green-500/20 text-green-400' : row.status === 'Pending' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                            {row.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-[#7a95b8] hover:text-white" onClick={() => handleActionClick(`View ${row.action}`)}>View</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Table 2: Connected Accounts */}
              <div className="rc-card p-0 overflow-hidden">
                <div className="p-4 border-b border-[#12233e]">
                  <h3 className="text-sm font-medium text-white flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-teal-400" />
                    Connected Accounts
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-[#7a95b8] bg-[#0b1628] border-b border-[#12233e]">
                      <tr>
                        <th className="px-4 py-3 font-medium">Institution</th>
                        <th className="px-4 py-3 font-medium">Type</th>
                        <th className="px-4 py-3 font-medium text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockTables.connectedAccounts.map((row) => (
                        <tr key={`account-${row.id}`} className="border-b border-[#12233e] hover:bg-[#12233e]/50 transition-colors">
                          <td className="px-4 py-3 text-white font-medium">{row.institution}</td>
                          <td className="px-4 py-3 text-[#c8d8ec]">{row.type}</td>
                          <td className={`px-4 py-3 text-right ${row.balance.startsWith('-') ? 'text-red-400' : 'text-green-400'}`}>{row.balance}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Table 3: Insurance Policies */}
              <div className="rc-card p-0 overflow-hidden">
                <div className="p-4 border-b border-[#12233e]">
                  <h3 className="text-sm font-medium text-white flex items-center gap-2">
                    <Shield className="h-4 w-4 text-purple-400" />
                    Insurance Policies
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-[#7a95b8] bg-[#0b1628] border-b border-[#12233e]">
                      <tr>
                        <th className="px-4 py-3 font-medium">Provider</th>
                        <th className="px-4 py-3 font-medium">Type</th>
                        <th className="px-4 py-3 font-medium">Coverage</th>
                        <th className="px-4 py-3 font-medium text-right">Premium</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockTables.insurancePolicies.map((row) => (
                        <tr key={`insurance-${row.id}`} className="border-b border-[#12233e] hover:bg-[#12233e]/50 transition-colors">
                          <td className="px-4 py-3 text-white">{row.provider}</td>
                          <td className="px-4 py-3 text-[#c8d8ec]">{row.type}</td>
                          <td className="px-4 py-3 text-[#c8d8ec]">{row.coverage}</td>
                          <td className="px-4 py-3 text-right text-[#c8d8ec]">{row.premium}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Table 4: Financial Goals */}
              <div className="rc-card p-0 overflow-hidden">
                <div className="p-4 border-b border-[#12233e]">
                  <h3 className="text-sm font-medium text-white flex items-center gap-2">
                    <Target className="h-4 w-4 text-orange-400" />
                    Financial Goals
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-[#7a95b8] bg-[#0b1628] border-b border-[#12233e]">
                      <tr>
                        <th className="px-4 py-3 font-medium">Goal</th>
                        <th className="px-4 py-3 font-medium">Target</th>
                        <th className="px-4 py-3 font-medium">Current</th>
                        <th className="px-4 py-3 font-medium text-right">Year</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockTables.financialGoals.map((row) => (
                        <tr key={`goal-${row.id}`} className="border-b border-[#12233e] hover:bg-[#12233e]/50 transition-colors">
                          <td className="px-4 py-3 text-white">{row.goal}</td>
                          <td className="px-4 py-3 text-teal-400">{row.target}</td>
                          <td className="px-4 py-3 text-[#c8d8ec]">{row.current}</td>
                          <td className="px-4 py-3 text-right text-[#c8d8ec]">{row.year}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Table 5: Tax Documents */}
              <div className="rc-card p-0 overflow-hidden">
                <div className="p-4 border-b border-[#12233e]">
                  <h3 className="text-sm font-medium text-white flex items-center gap-2">
                    <FileText className="h-4 w-4 text-yellow-400" />
                    Tax Documents
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-[#7a95b8] bg-[#0b1628] border-b border-[#12233e]">
                      <tr>
                        <th className="px-4 py-3 font-medium">Year</th>
                        <th className="px-4 py-3 font-medium">Type</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium text-right">Verified</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockTables.taxDocuments.map((row) => (
                        <tr key={`tax-${row.id}`} className="border-b border-[#12233e] hover:bg-[#12233e]/50 transition-colors">
                          <td className="px-4 py-3 text-white">{row.year}</td>
                          <td className="px-4 py-3 text-[#c8d8ec]">{row.type}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs ${row.status === 'Uploaded' ? 'text-green-400' : 'text-yellow-400'}`}>{row.status}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {row.verified ? (
                              <CheckCircle2 className="h-4 w-4 text-green-400 ml-auto" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-yellow-400 ml-auto" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Table 6: Recommendations */}
            <div className="rc-card p-0 overflow-hidden">
              <div className="p-4 border-b border-[#12233e]">
                <h3 className="text-sm font-medium text-white flex items-center gap-2">
                  <Bot className="h-4 w-4 text-indigo-400" />
                  AI Recommendations
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-[#7a95b8] bg-[#0b1628] border-b border-[#12233e]">
                    <tr>
                      <th className="px-4 py-3 font-medium">Area</th>
                      <th className="px-4 py-3 font-medium">Suggestion</th>
                      <th className="px-4 py-3 font-medium">Impact</th>
                      <th className="px-4 py-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockTables.recommendations.map((row) => (
                      <tr key={`rec-${row.id}`} className="border-b border-[#12233e] hover:bg-[#12233e]/50 transition-colors">
                        <td className="px-4 py-3 text-white font-medium">{row.area}</td>
                        <td className="px-4 py-3 text-[#c8d8ec]">{row.suggestion}</td>
                        <td className="px-4 py-3">
                          <Badge className={`text-[10px] ${row.impact === 'High' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                            {row.impact}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button size="sm" variant="outline" className="h-7 text-xs rc-btn-ghost" onClick={() => handleActionClick(`Apply ${row.suggestion}`)}>
                            Apply
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        
        <PageInsights pageId="client-intake-interview" />
      </div>
    </AppShell>
  );
}
