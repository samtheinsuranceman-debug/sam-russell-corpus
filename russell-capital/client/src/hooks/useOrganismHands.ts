/**
 * THE FACE & HANDS — Section C: Client Experience (S71-S90) + Section D: Advisor Workflow (S91-S130)
 *
 * C71-C90: Client portal, progress, goals, documents, messaging, education, insights, actions
 * D91-D130: Quick switch, sessions, favorites, shortcuts, batch mode, templates, workflows,
 *           undo, meeting mode, print, comparison, segments, tasks, calendar, email, pipeline,
 *           revenue, health score, stale alerts, onboarding, search, dashboard, export, handoff,
 *           analytics, goals, communication, compliance, team, intake, timer, follow-up, survey,
 *           attribution, lifetime value, capacity, risk monitor, regulatory feed
 */

import { useCallback, useMemo, useState, useEffect, useRef } from "react";

// ═══════════════════════════════════════════════════════════════
// SECTION C: CLIENT EXPERIENCE (S71-S90)
// ═══════════════════════════════════════════════════════════════

/** S71: Client portal dashboard data aggregation */
export function useClientPortalDashboard(clientData: Record<string, any>, calcResults: Record<string, any>) {
  return useMemo(() => {
    const netWorth = clientData?.netWorth || 0;
    const income = clientData?.annualIncome || 0;
    const age = clientData?.age || 0;
    const calcsRun = Object.keys(calcResults).length;

    // S72: Progress tracker
    const planCompleteness = Math.min(100, Math.round(
      (calcsRun / 20) * 40 + // 40% from calculator coverage
      (clientData?.clientName ? 20 : 0) + // 20% from fact finder
      (calcResults["life-insurance-needs"] ? 10 : 0) + // 10% from insurance
      (calcResults["retirement-income-gap"] ? 10 : 0) + // 10% from retirement
      (calcResults["estate-tax-calculator"] ? 10 : 0) + // 10% from estate
      (calcResults["marginal-tax-rate"] ? 10 : 0) // 10% from tax
    ));

    // S73: Goal visualization data
    const goals = {
      retirement: {
        label: "Retirement Ready",
        current: calcResults["fire-calculator"]?.summary?.currentSavingsRate || 0,
        target: calcResults["fire-calculator"]?.summary?.requiredSavingsRate || 20,
        pct: 0,
      },
      taxOptimized: {
        label: "Tax Optimized",
        current: calcResults["marginal-tax-rate"]?.summary?.effectiveRate || 25,
        target: 18,
        pct: 0,
      },
      protected: {
        label: "Fully Protected",
        current: calcResults["life-insurance-needs"]?.summary?.currentCoverage || 0,
        target: calcResults["life-insurance-needs"]?.summary?.totalNeed || income * 10,
        pct: 0,
      },
    };
    goals.retirement.pct = Math.min(100, Math.round((goals.retirement.current / Math.max(1, goals.retirement.target)) * 100));
    goals.taxOptimized.pct = Math.min(100, Math.round(((30 - goals.taxOptimized.current) / (30 - goals.taxOptimized.target)) * 100));
    goals.protected.pct = Math.min(100, Math.round((goals.protected.current / Math.max(1, goals.protected.target)) * 100));

    // S78: Action items
    const actionItems: Array<{ title: string; priority: "high" | "medium" | "low"; route?: string }> = [];
    if (!calcResults["life-insurance-needs"] && clientData?.numberOfDependents > 0) {
      actionItems.push({ title: "Complete life insurance analysis", priority: "high", route: "life-insurance-needs" });
    }
    if (!calcResults["retirement-income-gap"] && age > 50) {
      actionItems.push({ title: "Run retirement income gap analysis", priority: "high", route: "retirement-income-gap" });
    }
    if (!calcResults["estate-tax-calculator"] && netWorth > 2000000) {
      actionItems.push({ title: "Complete estate tax analysis", priority: "medium", route: "estate-tax-calculator" });
    }
    if (calcsRun < 10) {
      actionItems.push({ title: `Run ${10 - calcsRun} more calculators for comprehensive plan`, priority: "medium" });
    }

    return { planCompleteness, goals, actionItems, calcsRun, netWorth, income, age };
  }, [clientData, calcResults]);
}

/** S74: Document vault — track client documents */
export function useDocumentVault() {
  const [documents, setDocuments] = useState<Array<{
    id: string;
    name: string;
    type: string;
    uploadedAt: number;
    category: string;
    size?: number;
  }>>(() => {
    try { return JSON.parse(localStorage.getItem("rc_documents") || "[]"); } catch { return []; }
  });

  const addDocument = useCallback((doc: { name: string; type: string; category: string; size?: number }) => {
    setDocuments(prev => {
      const next = [...prev, { ...doc, id: `doc_${Date.now()}`, uploadedAt: Date.now() }];
      localStorage.setItem("rc_documents", JSON.stringify(next));
      return next;
    });
  }, []);

  const removeDocument = useCallback((docId: string) => {
    setDocuments(prev => {
      const next = prev.filter(d => d.id !== docId);
      localStorage.setItem("rc_documents", JSON.stringify(next));
      return next;
    });
  }, []);

  // S81: Document checklist
  const checklist = useMemo(() => {
    const required = [
      { name: "Tax Returns (Last 3 Years)", category: "tax" },
      { name: "Investment Statements", category: "investment" },
      { name: "Insurance Policies", category: "insurance" },
      { name: "Estate Documents (Will/Trust)", category: "estate" },
      { name: "Social Security Statement", category: "retirement" },
      { name: "Employer Benefits Summary", category: "employment" },
      { name: "Mortgage Statement", category: "debt" },
      { name: "Business Tax Returns", category: "business" },
    ];
    return required.map(r => ({
      ...r,
      uploaded: documents.some(d => d.category === r.category),
    }));
  }, [documents]);

  return { documents, addDocument, removeDocument, checklist };
}

/** S75: Secure messaging system */
export function useSecureMessaging() {
  const [messages, setMessages] = useState<Array<{
    id: string;
    from: string;
    to: string;
    subject: string;
    body: string;
    timestamp: number;
    read: boolean;
  }>>(() => {
    try { return JSON.parse(localStorage.getItem("rc_messages") || "[]"); } catch { return []; }
  });

  const sendMessage = useCallback((msg: { from: string; to: string; subject: string; body: string }) => {
    setMessages(prev => {
      const next = [...prev, { ...msg, id: `msg_${Date.now()}`, timestamp: Date.now(), read: false }];
      localStorage.setItem("rc_messages", JSON.stringify(next));
      return next;
    });
  }, []);

  const markRead = useCallback((msgId: string) => {
    setMessages(prev => {
      const next = prev.map(m => m.id === msgId ? { ...m, read: true } : m);
      localStorage.setItem("rc_messages", JSON.stringify(next));
      return next;
    });
  }, []);

  const unreadCount = messages.filter(m => !m.read).length;

  return { messages, sendMessage, markRead, unreadCount };
}

/** S76: Educational content tracker */
export function useEducationalContent() {
  const [completedModules, setCompletedModules] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem("rc_education_completed");
      return new Set(stored ? JSON.parse(stored) : []);
    } catch { return new Set(); }
  });

  const modules = useMemo(() => [
    { id: "tax-basics", title: "Tax Planning Fundamentals", category: "Tax", duration: "15 min" },
    { id: "roth-strategy", title: "Roth Conversion Strategies", category: "Tax", duration: "20 min" },
    { id: "iul-explained", title: "IUL — How It Works", category: "Insurance", duration: "25 min" },
    { id: "estate-101", title: "Estate Planning 101", category: "Estate", duration: "20 min" },
    { id: "retirement-income", title: "Building Retirement Income", category: "Retirement", duration: "30 min" },
    { id: "risk-management", title: "Risk Management Essentials", category: "Insurance", duration: "15 min" },
    { id: "social-security", title: "Social Security Optimization", category: "Retirement", duration: "20 min" },
    { id: "real-estate-tax", title: "Real Estate Tax Strategies", category: "Tax", duration: "25 min" },
  ], []);

  const completeModule = useCallback((moduleId: string) => {
    setCompletedModules(prev => {
      const next = new Set(prev);
      next.add(moduleId);
      localStorage.setItem("rc_education_completed", JSON.stringify(Array.from(next)));
      return next;
    });
  }, []);

  const progress = modules.length > 0 ? completedModules.size / modules.length : 0;

  return { modules, completedModules, completeModule, progress };
}

/** S83: Educational tooltips — context-aware help text */
export const FINANCIAL_TOOLTIPS: Record<string, string> = {
  "marginal-tax-rate": "The tax rate applied to your last dollar of income. Higher brackets don't mean all income is taxed at that rate.",
  "effective-tax-rate": "Your actual average tax rate across all income. Usually much lower than your marginal rate.",
  "roth-conversion": "Moving money from a traditional IRA to a Roth IRA. You pay taxes now but get tax-free growth and withdrawals later.",
  "iul": "Indexed Universal Life — a permanent life insurance policy with cash value growth linked to a market index, with downside protection.",
  "fia": "Fixed Indexed Annuity — an insurance contract that provides guaranteed income with growth potential linked to a market index.",
  "rmd": "Required Minimum Distribution — mandatory withdrawals from traditional IRAs starting at age 72 (73 for those born 1951-1959).",
  "fire": "Financial Independence, Retire Early — a movement focused on aggressive saving and investing to achieve early retirement.",
  "safe-withdrawal-rate": "The percentage of your portfolio you can withdraw annually without running out of money. The '4% rule' is a common benchmark.",
  "estate-tax-exemption": "The amount you can pass to heirs tax-free. Currently $13.61M per person (2024), but set to drop ~50% after 2025.",
  "ilit": "Irrevocable Life Insurance Trust — removes life insurance proceeds from your taxable estate, potentially saving millions in estate taxes.",
  "grat": "Grantor Retained Annuity Trust — transfers appreciating assets to heirs with minimal gift tax, ideal for assets expected to grow significantly.",
  "backdoor-roth": "A strategy for high earners to contribute to a Roth IRA by first contributing to a traditional IRA and then converting.",
  "mega-backdoor-roth": "Contributing after-tax dollars to a 401k and converting to Roth — allows up to $46,500 additional Roth savings annually.",
  "cost-segregation": "An engineering-based study that reclassifies building components for accelerated depreciation, creating immediate tax deductions.",
  "1031-exchange": "Deferring capital gains taxes by reinvesting real estate sale proceeds into a like-kind property within specific timeframes.",
  "dynasty-trust": "A trust designed to pass wealth through multiple generations while minimizing estate and gift taxes at each generational transfer.",
  "qcd": "Qualified Charitable Distribution — donating directly from your IRA to charity, satisfying RMDs without increasing taxable income.",
  "irmaa": "Income-Related Monthly Adjustment Amount — a Medicare surcharge for high earners that increases Part B and D premiums.",
  "sequence-of-returns-risk": "The danger that poor market returns early in retirement can permanently deplete a portfolio, even if average returns are acceptable.",
  "tax-loss-harvesting": "Selling investments at a loss to offset capital gains, reducing your tax bill while maintaining your investment strategy.",
};

/** S84: Referral system */
export function useReferralSystem() {
  const [referrals, setReferrals] = useState<Array<{
    id: string;
    referrerName: string;
    referredName: string;
    status: "pending" | "contacted" | "converted";
    date: number;
  }>>(() => {
    try { return JSON.parse(localStorage.getItem("rc_referrals") || "[]"); } catch { return []; }
  });

  const addReferral = useCallback((referrerName: string, referredName: string) => {
    setReferrals(prev => {
      const next = [...prev, { id: `ref_${Date.now()}`, referrerName, referredName, status: "pending" as const, date: Date.now() }];
      localStorage.setItem("rc_referrals", JSON.stringify(next));
      return next;
    });
  }, []);

  const updateStatus = useCallback((refId: string, status: "pending" | "contacted" | "converted") => {
    setReferrals(prev => {
      const next = prev.map(r => r.id === refId ? { ...r, status } : r);
      localStorage.setItem("rc_referrals", JSON.stringify(next));
      return next;
    });
  }, []);

  return { referrals, addReferral, updateStatus };
}

/** S89: Client satisfaction survey */
export function useClientSatisfaction() {
  const [surveys, setSurveys] = useState<Array<{
    id: string;
    clientName: string;
    rating: number;
    feedback: string;
    date: number;
  }>>(() => {
    try { return JSON.parse(localStorage.getItem("rc_satisfaction") || "[]"); } catch { return []; }
  });

  const submitSurvey = useCallback((clientName: string, rating: number, feedback: string) => {
    setSurveys(prev => {
      const next = [...prev, { id: `survey_${Date.now()}`, clientName, rating, feedback, date: Date.now() }];
      localStorage.setItem("rc_satisfaction", JSON.stringify(next));
      return next;
    });
  }, []);

  const averageRating = surveys.length > 0 ? surveys.reduce((sum, s) => sum + s.rating, 0) / surveys.length : 0;
  const nps = surveys.length > 0 ? Math.round(
    ((surveys.filter(s => s.rating >= 9).length - surveys.filter(s => s.rating <= 6).length) / surveys.length) * 100
  ) : 0;

  return { surveys, submitSurvey, averageRating, nps };
}

// ═══════════════════════════════════════════════════════════════
// SECTION D: ADVISOR WORKFLOW & PRODUCTIVITY (S91-S130)
// ═══════════════════════════════════════════════════════════════

/** S91: Quick client switch */
export function useQuickClientSwitch() {
  const [recentClients, setRecentClients] = useState<Array<{
    id: string;
    name: string;
    lastAccessed: number;
  }>>(() => {
    try { return JSON.parse(localStorage.getItem("rc_recent_clients") || "[]"); } catch { return []; }
  });

  const switchToClient = useCallback((clientId: string, clientName: string) => {
    setRecentClients(prev => {
      const filtered = prev.filter(c => c.id !== clientId);
      const next = [{ id: clientId, name: clientName, lastAccessed: Date.now() }, ...filtered].slice(0, 10);
      localStorage.setItem("rc_recent_clients", JSON.stringify(next));
      return next;
    });
  }, []);

  return { recentClients, switchToClient };
}

/** S92: Client session management */
export function useClientSession() {
  const [activeClient, setActiveClient] = useState<{
    id: string;
    name: string;
    startedAt: number;
    calcsRun: string[];
  } | null>(() => {
    try {
      const stored = sessionStorage.getItem("rc_active_session");
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  const startSession = useCallback((clientId: string, clientName: string) => {
    const session = { id: clientId, name: clientName, startedAt: Date.now(), calcsRun: [] };
    setActiveClient(session);
    sessionStorage.setItem("rc_active_session", JSON.stringify(session));
  }, []);

  const trackCalcRun = useCallback((calcRoute: string) => {
    setActiveClient(prev => {
      if (!prev) return prev;
      const next = { ...prev, calcsRun: [...prev.calcsRun, calcRoute] };
      sessionStorage.setItem("rc_active_session", JSON.stringify(next));
      return next;
    });
  }, []);

  const endSession = useCallback(() => {
    if (activeClient) {
      // Save session history
      try {
        const history = JSON.parse(localStorage.getItem("rc_session_history") || "[]");
        history.push({ ...activeClient, endedAt: Date.now() });
        if (history.length > 100) history.splice(0, history.length - 100);
        localStorage.setItem("rc_session_history", JSON.stringify(history));
      } catch {}
    }
    setActiveClient(null);
    sessionStorage.removeItem("rc_active_session");
  }, [activeClient]);

  const sessionDuration = activeClient ? Math.floor((Date.now() - activeClient.startedAt) / 60000) : 0;

  return { activeClient, startSession, trackCalcRun, endSession, sessionDuration };
}

/** S93: Favorites system */
export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("rc_favorites") || "[]"); } catch { return []; }
  });

  const toggleFavorite = useCallback((route: string) => {
    setFavorites(prev => {
      const next = prev.includes(route) ? prev.filter(r => r !== route) : [...prev, route];
      localStorage.setItem("rc_favorites", JSON.stringify(next));
      return next;
    });
  }, []);

  const isFavorite = useCallback((route: string) => favorites.includes(route), [favorites]);

  return { favorites, toggleFavorite, isFavorite };
}

/** S94: Recent calculations tracker */
export function useRecentCalculations() {
  const [recent, setRecent] = useState<Array<{ route: string; name: string; timestamp: number }>>(() => {
    try { return JSON.parse(localStorage.getItem("rc_recent_calcs") || "[]"); } catch { return []; }
  });

  const trackCalc = useCallback((route: string, name: string) => {
    setRecent(prev => {
      const filtered = prev.filter(r => r.route !== route);
      const next = [{ route, name, timestamp: Date.now() }, ...filtered].slice(0, 20);
      localStorage.setItem("rc_recent_calcs", JSON.stringify(next));
      return next;
    });
  }, []);

  return { recent, trackCalc };
}

/** S96: Batch mode — run multiple calcs with same inputs */
export function useBatchMode() {
  const [batchQueue, setBatchQueue] = useState<string[]>([]);
  const [batchInputs, setBatchInputs] = useState<Record<string, any>>({});
  const [batchResults, setBatchResults] = useState<Record<string, any>>({});
  const [isRunning, setIsRunning] = useState(false);

  const addToQueue = useCallback((calcRoute: string) => {
    setBatchQueue(prev => prev.includes(calcRoute) ? prev : [...prev, calcRoute]);
  }, []);

  const removeFromQueue = useCallback((calcRoute: string) => {
    setBatchQueue(prev => prev.filter(r => r !== calcRoute));
  }, []);

  const setInputs = useCallback((inputs: Record<string, any>) => {
    setBatchInputs(inputs);
  }, []);

  const clearBatch = useCallback(() => {
    setBatchQueue([]);
    setBatchInputs({});
    setBatchResults({});
    setIsRunning(false);
  }, []);

  return { batchQueue, batchInputs, batchResults, isRunning, addToQueue, removeFromQueue, setInputs, clearBatch };
}

/** S97: Workflow templates */
export function useWorkflowTemplates() {
  const templates = useMemo(() => [
    {
      id: "new-client",
      name: "New Client Onboarding",
      steps: ["fact-finder", "net-worth-tracker", "marginal-tax-rate", "life-insurance-needs", "retirement-income-gap", "iul-projection"],
      description: "Complete intake and baseline analysis for new clients",
    },
    {
      id: "annual-review",
      name: "Annual Review",
      steps: ["net-worth-tracker", "marginal-tax-rate", "retirement-income-gap", "life-insurance-needs", "estate-tax-calculator"],
      description: "Comprehensive annual financial review",
    },
    {
      id: "tax-optimization",
      name: "Tax Optimization Sprint",
      steps: ["marginal-tax-rate", "deduction-optimizer", "roth-vs-traditional", "mega-backdoor-roth", "tax-loss-harvest-calc", "charitable-giving-optimizer"],
      description: "Maximize tax efficiency across all strategies",
    },
    {
      id: "retirement-planning",
      name: "Retirement Deep Dive",
      steps: ["retirement-income-gap", "social-security-optimizer", "fire-calculator", "safe-withdrawal-rate", "annuity-income-planner", "lifetime-income-planner"],
      description: "Comprehensive retirement income planning",
    },
    {
      id: "estate-planning",
      name: "Estate Planning Suite",
      steps: ["estate-tax-calculator", "ilit-calculator", "grat-calculator", "dynasty-trust-calculator", "daf-vs-direct-giving"],
      description: "Complete estate and legacy planning",
    },
    {
      id: "physician-special",
      name: "Physician Wealth Builder",
      steps: ["physician-income-gap", "physician-student-loan", "physician-tax-strategy", "physician-disability", "physician-retirement", "iul-projection"],
      description: "Specialized planning for physicians",
    },
    {
      id: "iul-deep-dive",
      name: "IUL Deep Dive",
      steps: ["iul-projection", "iul-historical", "iul-vs-401k", "iul-vs-buy-term-invest", "iul-income-rider", "iul-estate-planning"],
      description: "Complete IUL analysis from every angle",
    },
    {
      id: "real-estate",
      name: "Real Estate Investor",
      steps: ["real-estate-roi", "rental-property-calc", "cost-segregation-calculator", "1031-exchange-calc", "mortgage-killer-v3", "house-recycling"],
      description: "Real estate investment analysis suite",
    },
  ], []);

  return { templates };
}

/** S98: Undo system */
export function useUndoSystem<T>(initialState: T) {
  const [history, setHistory] = useState<T[]>([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const pushState = useCallback((state: T) => {
    setHistory(prev => {
      const next = [...prev.slice(0, currentIndex + 1), state];
      if (next.length > 50) next.shift();
      return next;
    });
    setCurrentIndex(prev => Math.min(prev + 1, 49));
  }, [currentIndex]);

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      return history[currentIndex - 1];
    }
    return history[currentIndex];
  }, [currentIndex, history]);

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(prev => prev + 1);
      return history[currentIndex + 1];
    }
    return history[currentIndex];
  }, [currentIndex, history]);

  return {
    currentState: history[currentIndex],
    pushState,
    undo,
    redo,
    canUndo: currentIndex > 0,
    canRedo: currentIndex < history.length - 1,
  };
}

/** S99: Meeting mode — focused view with timer */
export function useMeetingMode() {
  const [isActive, setIsActive] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [notes, setNotes] = useState<string[]>([]);
  const [actionItems, setActionItems] = useState<string[]>([]);

  const startMeeting = useCallback((clientName?: string) => {
    setIsActive(true);
    setStartTime(Date.now());
    setNotes([]);
    setActionItems([]);
    if (clientName) setNotes([`Meeting with ${clientName} — ${new Date().toLocaleDateString()}`]);
  }, []);

  const endMeeting = useCallback(() => {
    setIsActive(false);
    // Save meeting record
    if (startTime) {
      try {
        const meetings = JSON.parse(localStorage.getItem("rc_meetings") || "[]");
        meetings.push({
          startTime,
          endTime: Date.now(),
          duration: Math.floor((Date.now() - startTime) / 60000),
          notes,
          actionItems,
        });
        localStorage.setItem("rc_meetings", JSON.stringify(meetings));
      } catch {}
    }
  }, [startTime, notes, actionItems]);

  const addNote = useCallback((note: string) => setNotes(prev => [...prev, note]), []);
  const addActionItem = useCallback((item: string) => setActionItems(prev => [...prev, item]), []);

  const elapsed = startTime ? Math.floor((Date.now() - startTime) / 60000) : 0;

  return { isActive, startMeeting, endMeeting, addNote, addActionItem, notes, actionItems, elapsed };
}

/** S101: Client comparison */
export function useClientComparison() {
  const [selectedClients, setSelectedClients] = useState<string[]>([]);

  const addClient = useCallback((clientId: string) => {
    setSelectedClients(prev => prev.includes(clientId) ? prev : [...prev, clientId].slice(0, 4));
  }, []);

  const removeClient = useCallback((clientId: string) => {
    setSelectedClients(prev => prev.filter(c => c !== clientId));
  }, []);

  return { selectedClients, addClient, removeClient };
}

/** S104: Client segments */
export function useClientSegments() {
  const [segments] = useState([
    { id: "high-net-worth", name: "High Net Worth", criteria: "Net worth > $1M", color: "bg-purple-500" },
    { id: "pre-retiree", name: "Pre-Retiree", criteria: "Age 55-65", color: "bg-blue-500" },
    { id: "physician", name: "Physician", criteria: "Profession = Physician", color: "bg-green-500" },
    { id: "business-owner", name: "Business Owner", criteria: "Has business income", color: "bg-amber-500" },
    { id: "young-professional", name: "Young Professional", criteria: "Age < 40, Income > $100K", color: "bg-cyan-500" },
    { id: "retiree", name: "Retiree", criteria: "Age > 65", color: "bg-rose-500" },
  ]);

  const getSegment = useCallback((clientData: Record<string, any>): string[] => {
    const matches: string[] = [];
    const age = clientData?.age || 0;
    const income = clientData?.annualIncome || 0;
    const netWorth = clientData?.netWorth || 0;

    if (netWorth > 1000000) matches.push("high-net-worth");
    if (age >= 55 && age <= 65) matches.push("pre-retiree");
    if (age > 65) matches.push("retiree");
    if (clientData?.profession?.toLowerCase().includes("physician")) matches.push("physician");
    if (clientData?.businessIncome > 0) matches.push("business-owner");
    if (age < 40 && income > 100000) matches.push("young-professional");

    return matches;
  }, []);

  return { segments, getSegment };
}

/** S105: Task manager */
export function useTaskManager() {
  const [tasks, setTasks] = useState<Array<{
    id: string;
    title: string;
    clientId?: string;
    dueDate?: number;
    priority: "high" | "medium" | "low";
    status: "pending" | "in-progress" | "completed";
    createdAt: number;
  }>>(() => {
    try { return JSON.parse(localStorage.getItem("rc_tasks") || "[]"); } catch { return []; }
  });

  const addTask = useCallback((task: { title: string; clientId?: string; dueDate?: number; priority: "high" | "medium" | "low" }) => {
    setTasks(prev => {
      const next = [...prev, { ...task, id: `task_${Date.now()}`, status: "pending" as const, createdAt: Date.now() }];
      localStorage.setItem("rc_tasks", JSON.stringify(next));
      return next;
    });
  }, []);

  const updateTask = useCallback((taskId: string, updates: Partial<{ status: "pending" | "in-progress" | "completed"; priority: "high" | "medium" | "low" }>) => {
    setTasks(prev => {
      const next = prev.map(t => t.id === taskId ? { ...t, ...updates } : t);
      localStorage.setItem("rc_tasks", JSON.stringify(next));
      return next;
    });
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    setTasks(prev => {
      const next = prev.filter(t => t.id !== taskId);
      localStorage.setItem("rc_tasks", JSON.stringify(next));
      return next;
    });
  }, []);

  const pendingCount = tasks.filter(t => t.status !== "completed").length;
  const overdue = tasks.filter(t => t.dueDate && t.dueDate < Date.now() && t.status !== "completed");

  return { tasks, addTask, updateTask, deleteTask, pendingCount, overdue };
}

/** S108: Pipeline dashboard */
export function usePipelineDashboard() {
  const [pipeline, setPipeline] = useState<Array<{
    id: string;
    clientName: string;
    stage: "prospect" | "discovery" | "analysis" | "proposal" | "closing" | "onboarded";
    estimatedValue: number;
    lastActivity: number;
    notes: string;
  }>>(() => {
    try { return JSON.parse(localStorage.getItem("rc_pipeline") || "[]"); } catch { return []; }
  });

  const addProspect = useCallback((prospect: { clientName: string; estimatedValue: number; notes: string }) => {
    setPipeline(prev => {
      const next = [...prev, { ...prospect, id: `pipe_${Date.now()}`, stage: "prospect" as const, lastActivity: Date.now() }];
      localStorage.setItem("rc_pipeline", JSON.stringify(next));
      return next;
    });
  }, []);

  const advanceStage = useCallback((prospectId: string) => {
    const stages: Array<"prospect" | "discovery" | "analysis" | "proposal" | "closing" | "onboarded"> = ["prospect", "discovery", "analysis", "proposal", "closing", "onboarded"];
    setPipeline(prev => {
      const next = prev.map(p => {
        if (p.id !== prospectId) return p;
        const currentIdx = stages.indexOf(p.stage);
        const nextStage = currentIdx < stages.length - 1 ? stages[currentIdx + 1] : p.stage;
        return { ...p, stage: nextStage, lastActivity: Date.now() };
      });
      localStorage.setItem("rc_pipeline", JSON.stringify(next));
      return next;
    });
  }, []);

  const totalPipelineValue = pipeline.reduce((sum, p) => sum + p.estimatedValue, 0);
  const byStage = useMemo(() => {
    const stages = { prospect: 0, discovery: 0, analysis: 0, proposal: 0, closing: 0, onboarded: 0 };
    pipeline.forEach(p => { stages[p.stage]++; });
    return stages;
  }, [pipeline]);

  return { pipeline, addProspect, advanceStage, totalPipelineValue, byStage };
}

/** S110: Client health score */
export function calculateClientHealthScore(clientData: Record<string, any>, calcResults: Record<string, any>): {
  score: number;
  grade: string;
  factors: Array<{ name: string; score: number; weight: number }>;
} {
  const factors: Array<{ name: string; score: number; weight: number }> = [];

  // Data completeness
  const dataFields = ["clientName", "age", "annualIncome", "netWorth", "riskTolerance", "retirementAge"];
  const filled = dataFields.filter(f => clientData?.[f]).length;
  factors.push({ name: "Data Completeness", score: Math.round((filled / dataFields.length) * 100), weight: 0.15 });

  // Calculator coverage
  const calcsRun = Object.keys(calcResults).length;
  factors.push({ name: "Analysis Coverage", score: Math.min(100, calcsRun * 5), weight: 0.2 });

  // Protection score
  let protection = 0;
  if (calcResults["life-insurance-needs"]) protection += 33;
  if (calcResults["disability-insurance-needs"]) protection += 33;
  if (calcResults["estate-tax-calculator"]) protection += 34;
  factors.push({ name: "Protection Planning", score: protection, weight: 0.2 });

  // Tax optimization
  let tax = 50;
  if (calcResults["marginal-tax-rate"]) tax += 15;
  if (calcResults["roth-vs-traditional"]) tax += 15;
  if (calcResults["deduction-optimizer"]) tax += 20;
  factors.push({ name: "Tax Optimization", score: Math.min(100, tax), weight: 0.2 });

  // Retirement readiness
  let retire = 30;
  if (calcResults["retirement-income-gap"]) retire += 25;
  if (calcResults["social-security-optimizer"]) retire += 20;
  if (calcResults["fire-calculator"]) retire += 25;
  factors.push({ name: "Retirement Readiness", score: Math.min(100, retire), weight: 0.25 });

  const score = Math.round(factors.reduce((sum, f) => sum + f.score * f.weight, 0));
  const grade = score >= 90 ? "A+" : score >= 80 ? "A" : score >= 70 ? "B" : score >= 60 ? "C" : score >= 50 ? "D" : "F";

  return { score, grade, factors };
}

/** S109: Revenue forecast */
export function useRevenueForecasting() {
  return useMemo(() => {
    try {
      const pipeline = JSON.parse(localStorage.getItem("rc_pipeline") || "[]");
      const conversionRates: Record<string, number> = {
        prospect: 0.1, discovery: 0.25, analysis: 0.5, proposal: 0.7, closing: 0.9, onboarded: 1.0,
      };
      
      let weightedRevenue = 0;
      let bestCase = 0;
      let worstCase = 0;
      
      for (const p of pipeline) {
        const rate = conversionRates[p.stage] || 0;
        weightedRevenue += p.estimatedValue * rate;
        bestCase += p.estimatedValue;
        worstCase += p.estimatedValue * rate * 0.5;
      }

      return {
        weighted: Math.round(weightedRevenue),
        bestCase: Math.round(bestCase),
        worstCase: Math.round(worstCase),
        pipelineCount: pipeline.length,
      };
    } catch {
      return { weighted: 0, bestCase: 0, worstCase: 0, pipelineCount: 0 };
    }
  }, []);
}

/** S120: Communication log */
export function useCommunicationLog() {
  const [logs, setLogs] = useState<Array<{
    id: string;
    clientId: string;
    type: "call" | "email" | "meeting" | "text" | "note";
    summary: string;
    timestamp: number;
  }>>(() => {
    try { return JSON.parse(localStorage.getItem("rc_comm_log") || "[]"); } catch { return []; }
  });

  const addLog = useCallback((entry: { clientId: string; type: "call" | "email" | "meeting" | "text" | "note"; summary: string }) => {
    setLogs(prev => {
      const next = [...prev, { ...entry, id: `log_${Date.now()}`, timestamp: Date.now() }];
      localStorage.setItem("rc_comm_log", JSON.stringify(next));
      return next;
    });
  }, []);

  const getClientLogs = useCallback((clientId: string) => {
    return logs.filter(l => l.clientId === clientId).sort((a, b) => b.timestamp - a.timestamp);
  }, [logs]);

  return { logs, addLog, getClientLogs };
}

/** S127: Client lifetime value calculator */
export function calculateClientLifetimeValue(
  annualRevenue: number,
  retentionRate: number = 0.9,
  discountRate: number = 0.1,
  years: number = 20
): { ltv: number; yearlyValues: number[] } {
  const yearlyValues: number[] = [];
  let ltv = 0;
  let currentRevenue = annualRevenue;

  for (let y = 1; y <= years; y++) {
    currentRevenue *= retentionRate;
    const discountedValue = currentRevenue / Math.pow(1 + discountRate, y);
    ltv += discountedValue;
    yearlyValues.push(Math.round(discountedValue));
  }

  return { ltv: Math.round(ltv), yearlyValues };
}

/** S128: Capacity planning */
export function useCapacityPlanning() {
  return useMemo(() => {
    try {
      const sessions = JSON.parse(localStorage.getItem("rc_session_history") || "[]");
      const thisMonth = sessions.filter((s: any) => Date.now() - s.startTime < 30 * 24 * 60 * 60 * 1000);
      
      const avgSessionMinutes = thisMonth.length > 0
        ? thisMonth.reduce((sum: number, s: any) => sum + ((s.endedAt - s.startTime) / 60000), 0) / thisMonth.length
        : 60;

      const monthlyHoursUsed = (thisMonth.length * avgSessionMinutes) / 60;
      const maxMonthlyHours = 160; // 40 hrs/week * 4 weeks
      const utilizationRate = Math.round((monthlyHoursUsed / maxMonthlyHours) * 100);

      return {
        clientsThisMonth: thisMonth.length,
        avgSessionMinutes: Math.round(avgSessionMinutes),
        monthlyHoursUsed: Math.round(monthlyHoursUsed),
        utilizationRate,
        capacityRemaining: Math.max(0, maxMonthlyHours - monthlyHoursUsed),
        canTakeNewClients: utilizationRate < 80,
      };
    } catch {
      return {
        clientsThisMonth: 0, avgSessionMinutes: 0, monthlyHoursUsed: 0,
        utilizationRate: 0, capacityRemaining: 160, canTakeNewClients: true,
      };
    }
  }, []);
}
