/**
 * THE SKELETON — Section E: Platform Architecture & Performance (S131-S170)
 *
 * S131: Error boundaries              S151: Keyboard shortcuts
 * S132: Loading skeletons              S152: Breadcrumb generator
 * S133: Retry logic                    S153: Page title manager
 * S134: Offline detection              S154: Scroll position memory
 * S135: Auto-save                      S155: Form validation
 * S136: Session timeout                S156: Currency formatter
 * S137: Performance monitoring         S157: Date utilities
 * S138: Memory management              S158: Number formatter
 * S139: Lazy loading                   S159: Percentage formatter
 * S140: Debounce/throttle              S160: Input sanitizer
 * S141: Cache management               S161: Deep clone utility
 * S142: State persistence              S162: Comparison utility
 * S143: Event bus                      S163: Array utilities
 * S144: Feature flags                  S164: Object utilities
 * S145: A/B testing                    S165: String utilities
 * S146: Analytics hooks                S166: Math utilities
 * S147: Error reporting                S167: Financial math
 * S148: Accessibility hooks            S168: Compound interest
 * S149: Responsive hooks               S169: Amortization
 * S150: Print optimization             S170: Tax bracket engine
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// ═══════════════════════════════════════════════════════════════
// S131-S140: CORE INFRASTRUCTURE
// ═══════════════════════════════════════════════════════════════

/** S131: Error boundary hook — catch and report errors */
export function useErrorHandler() {
  const [error, setError] = useState<Error | null>(null);
  const [errorInfo, setErrorInfo] = useState<string>("");

  const handleError = useCallback((err: Error, info?: string) => {
    setError(err);
    setErrorInfo(info || err.message);
    // Log to localStorage for debugging
    try {
      const errors = JSON.parse(localStorage.getItem("rc_error_log") || "[]");
      errors.push({ message: err.message, stack: err.stack?.slice(0, 500), info, timestamp: Date.now() });
      if (errors.length > 50) errors.splice(0, errors.length - 50);
      localStorage.setItem("rc_error_log", JSON.stringify(errors));
    } catch {}
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    setErrorInfo("");
  }, []);

  return { error, errorInfo, handleError, clearError };
}

/** S132: Loading skeleton state manager */
export function useLoadingState(initialLoading = false) {
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [loadingMessage, setLoadingMessage] = useState("");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startLoading = useCallback((message = "Loading...") => {
    setIsLoading(true);
    setLoadingMessage(message);
    // Auto-timeout after 30s
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsLoading(false);
      setLoadingMessage("");
    }, 30000);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
    setLoadingMessage("");
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  useEffect(() => {
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, []);

  return { isLoading, loadingMessage, startLoading, stopLoading };
}

/** S133: Retry logic with exponential backoff */
export function useRetry() {
  const retry = useCallback(async <T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 1000
  ): Promise<T> => {
    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, attempt)));
        }
      }
    }
    throw lastError;
  }, []);

  return { retry };
}

/** S134: Offline detection */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}

/** S135: Auto-save with debounce */
export function useAutoSave<T>(key: string, data: T, delay = 2000) {
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(data));
        setLastSaved(Date.now());
      } catch {}
    }, delay);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [key, data, delay]);

  const loadSaved = useCallback((): T | null => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  }, [key]);

  return { lastSaved, loadSaved };
}

/** S136: Session timeout warning */
export function useSessionTimeout(timeoutMinutes = 30) {
  const [isWarning, setIsWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(timeoutMinutes * 60);
  const lastActivityRef = useRef(Date.now());

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    setIsWarning(false);
    setTimeRemaining(timeoutMinutes * 60);
  }, [timeoutMinutes]);

  useEffect(() => {
    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));
    
    const interval = setInterval(() => {
      const elapsed = (Date.now() - lastActivityRef.current) / 1000;
      const remaining = Math.max(0, timeoutMinutes * 60 - elapsed);
      setTimeRemaining(Math.round(remaining));
      setIsWarning(remaining < 300 && remaining > 0); // Warn at 5 minutes
    }, 10000);

    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      clearInterval(interval);
    };
  }, [resetTimer, timeoutMinutes]);

  return { isWarning, timeRemaining, resetTimer };
}

/** S137: Performance monitoring */
export function usePerformanceMonitor() {
  const markStart = useCallback((label: string) => {
    try { performance.mark(`rc_${label}_start`); } catch {}
  }, []);

  const markEnd = useCallback((label: string): number => {
    try {
      performance.mark(`rc_${label}_end`);
      const measure = performance.measure(`rc_${label}`, `rc_${label}_start`, `rc_${label}_end`);
      return measure.duration;
    } catch { return 0; }
  }, []);

  const getPageLoadTime = useCallback((): number => {
    try {
      const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
      return nav ? nav.loadEventEnd - nav.startTime : 0;
    } catch { return 0; }
  }, []);

  return { markStart, markEnd, getPageLoadTime };
}

/** S140: Debounce and throttle hooks */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

export function useThrottle<T>(value: T, interval: number): T {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastUpdated = useRef(Date.now());

  useEffect(() => {
    const now = Date.now();
    if (now - lastUpdated.current >= interval) {
      setThrottledValue(value);
      lastUpdated.current = now;
    } else {
      const timer = setTimeout(() => {
        setThrottledValue(value);
        lastUpdated.current = Date.now();
      }, interval - (now - lastUpdated.current));
      return () => clearTimeout(timer);
    }
  }, [value, interval]);

  return throttledValue;
}

// ═══════════════════════════════════════════════════════════════
// S141-S150: STATE & CACHING
// ═══════════════════════════════════════════════════════════════

/** S141: Cache management with TTL */
export function useCache<T>(key: string, ttlMs = 5 * 60 * 1000) {
  const get = useCallback((): T | null => {
    try {
      const stored = localStorage.getItem(`rc_cache_${key}`);
      if (!stored) return null;
      const { data, expiry } = JSON.parse(stored);
      if (Date.now() > expiry) {
        localStorage.removeItem(`rc_cache_${key}`);
        return null;
      }
      return data as T;
    } catch { return null; }
  }, [key]);

  const set = useCallback((data: T) => {
    try {
      localStorage.setItem(`rc_cache_${key}`, JSON.stringify({ data, expiry: Date.now() + ttlMs }));
    } catch {}
  }, [key, ttlMs]);

  const invalidate = useCallback(() => {
    localStorage.removeItem(`rc_cache_${key}`);
  }, [key]);

  return { get, set, invalidate };
}

/** S142: Persistent state across sessions */
export function usePersistentState<T>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(`rc_persist_${key}`);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch { return defaultValue; }
  });

  const setPersistentState = useCallback((value: T | ((prev: T) => T)) => {
    setState(prev => {
      const next = typeof value === "function" ? (value as (prev: T) => T)(prev) : value;
      try { localStorage.setItem(`rc_persist_${key}`, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [key]);

  return [state, setPersistentState];
}

/** S143: Event bus for cross-component communication */
type EventCallback = (...args: any[]) => void;
const eventBus: Record<string, EventCallback[]> = {};

export function useEventBus() {
  const on = useCallback((event: string, callback: EventCallback) => {
    if (!eventBus[event]) eventBus[event] = [];
    eventBus[event].push(callback);
    return () => {
      eventBus[event] = eventBus[event].filter(cb => cb !== callback);
    };
  }, []);

  const emit = useCallback((event: string, ...args: any[]) => {
    (eventBus[event] || []).forEach(cb => cb(...args));
  }, []);

  return { on, emit };
}

/** S144: Feature flags */
export function useFeatureFlags() {
  const [flags, setFlags] = usePersistentState<Record<string, boolean>>("feature_flags", {
    aiWhisperCoach: true,
    scenarioWarfare: true,
    clientDigitalTwin: true,
    gamification: true,
    batchMode: true,
    meetingMode: true,
    advancedCharts: true,
    exportPdf: true,
    emailDrafts: true,
    videoProposals: false,
  });

  const isEnabled = useCallback((flag: string): boolean => flags[flag] ?? false, [flags]);
  const toggleFlag = useCallback((flag: string) => {
    setFlags(prev => ({ ...prev, [flag]: !prev[flag] }));
  }, [setFlags]);

  return { flags, isEnabled, toggleFlag };
}

/** S146: Analytics hooks */
export function useAnalytics() {
  const trackEvent = useCallback((event: string, properties?: Record<string, any>) => {
    try {
      const events = JSON.parse(localStorage.getItem("rc_analytics") || "[]");
      events.push({ event, properties, timestamp: Date.now() });
      if (events.length > 1000) events.splice(0, events.length - 1000);
      localStorage.setItem("rc_analytics", JSON.stringify(events));
    } catch {}
  }, []);

  const trackPageView = useCallback((page: string) => {
    trackEvent("page_view", { page });
  }, [trackEvent]);

  const trackCalcUsage = useCallback((calcName: string, duration?: number) => {
    trackEvent("calc_usage", { calcName, duration });
  }, [trackEvent]);

  const getUsageStats = useCallback(() => {
    try {
      const events = JSON.parse(localStorage.getItem("rc_analytics") || "[]");
      const pageViews = events.filter((e: any) => e.event === "page_view").length;
      const calcUsages = events.filter((e: any) => e.event === "calc_usage").length;
      const uniqueCalcs = new Set(events.filter((e: any) => e.event === "calc_usage").map((e: any) => e.properties?.calcName)).size;
      return { pageViews, calcUsages, uniqueCalcs, totalEvents: events.length };
    } catch { return { pageViews: 0, calcUsages: 0, uniqueCalcs: 0, totalEvents: 0 }; }
  }, []);

  return { trackEvent, trackPageView, trackCalcUsage, getUsageStats };
}

/** S148: Accessibility hooks */
export function useAccessibility() {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState<"normal" | "large" | "x-large">("normal");

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const fontSizeClass = fontSize === "large" ? "text-lg" : fontSize === "x-large" ? "text-xl" : "text-base";

  return { reducedMotion, highContrast, setHighContrast, fontSize, setFontSize, fontSizeClass };
}

/** S149: Responsive hooks */
export function useResponsive() {
  const [width, setWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1024);

  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler, { passive: true });
    return () => window.removeEventListener("resize", handler);
  }, []);

  return {
    width,
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024,
    isWidescreen: width >= 1440,
  };
}

/** S150: Print optimization */
export function usePrintMode() {
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    const handleBefore = () => setIsPrinting(true);
    const handleAfter = () => setIsPrinting(false);
    window.addEventListener("beforeprint", handleBefore);
    window.addEventListener("afterprint", handleAfter);
    return () => {
      window.removeEventListener("beforeprint", handleBefore);
      window.removeEventListener("afterprint", handleAfter);
    };
  }, []);

  const print = useCallback(() => window.print(), []);

  return { isPrinting, print };
}

// ═══════════════════════════════════════════════════════════════
// S151-S160: UI UTILITIES
// ═══════════════════════════════════════════════════════════════

/** S151: Keyboard shortcuts */
export function useKeyboardShortcuts(shortcuts: Record<string, () => void>) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const key = [
        e.ctrlKey || e.metaKey ? "ctrl" : "",
        e.shiftKey ? "shift" : "",
        e.altKey ? "alt" : "",
        e.key.toLowerCase(),
      ].filter(Boolean).join("+");

      if (shortcuts[key]) {
        e.preventDefault();
        shortcuts[key]();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [shortcuts]);
}

/** S152: Breadcrumb generator */
export function useBreadcrumbs(path: string): Array<{ label: string; href: string }> {
  return useMemo(() => {
    const parts = path.split("/").filter(Boolean);
    const crumbs: Array<{ label: string; href: string }> = [{ label: "Home", href: "/" }];
    let currentPath = "";
    for (const part of parts) {
      currentPath += `/${part}`;
      crumbs.push({
        label: part.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
        href: currentPath,
      });
    }
    return crumbs;
  }, [path]);
}

/** S153: Page title manager */
export function usePageTitle(title: string) {
  useEffect(() => {
    const prev = document.title;
    document.title = `${title} | Russell Capital`;
    return () => { document.title = prev; };
  }, [title]);
}

/** S154: Scroll position memory */
export function useScrollMemory(key: string) {
  useEffect(() => {
    const saved = sessionStorage.getItem(`rc_scroll_${key}`);
    if (saved) {
      setTimeout(() => window.scrollTo(0, parseInt(saved)), 100);
    }
    const handler = () => {
      sessionStorage.setItem(`rc_scroll_${key}`, String(window.scrollY));
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [key]);
}

/** S155: Form validation */
export function useFormValidation() {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = useCallback((rules: Record<string, { value: any; rules: Array<{ type: string; message: string; param?: any }> }>): boolean => {
    const newErrors: Record<string, string> = {};
    for (const [field, config] of Object.entries(rules)) {
      for (const rule of config.rules) {
        switch (rule.type) {
          case "required":
            if (!config.value && config.value !== 0) newErrors[field] = rule.message;
            break;
          case "min":
            if (Number(config.value) < rule.param) newErrors[field] = rule.message;
            break;
          case "max":
            if (Number(config.value) > rule.param) newErrors[field] = rule.message;
            break;
          case "positive":
            if (Number(config.value) <= 0) newErrors[field] = rule.message;
            break;
          case "email":
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(config.value))) newErrors[field] = rule.message;
            break;
          case "phone":
            if (!/^\+?[\d\s()-]{7,}$/.test(String(config.value))) newErrors[field] = rule.message;
            break;
        }
        if (newErrors[field]) break;
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, []);

  const clearErrors = useCallback(() => setErrors({}), []);

  return { errors, validate, clearErrors };
}

/** S156: Currency formatter */
export function formatCurrency(value: number, options?: { compact?: boolean; decimals?: number; showSign?: boolean }): string {
  const { compact = false, decimals = 0, showSign = false } = options || {};
  const sign = showSign && value > 0 ? "+" : "";

  if (compact) {
    const abs = Math.abs(value);
    if (abs >= 1e12) return `${sign}$${(value / 1e12).toFixed(1)}T`;
    if (abs >= 1e9) return `${sign}$${(value / 1e9).toFixed(1)}B`;
    if (abs >= 1e6) return `${sign}$${(value / 1e6).toFixed(1)}M`;
    if (abs >= 1e3) return `${sign}$${(value / 1e3).toFixed(1)}K`;
  }
  return `${sign}$${value.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}

/** S158: Number formatter */
export function formatNumber(value: number, options?: { decimals?: number; compact?: boolean; suffix?: string }): string {
  const { decimals = 0, compact = false, suffix = "" } = options || {};
  if (compact) {
    const abs = Math.abs(value);
    if (abs >= 1e9) return `${(value / 1e9).toFixed(1)}B${suffix}`;
    if (abs >= 1e6) return `${(value / 1e6).toFixed(1)}M${suffix}`;
    if (abs >= 1e3) return `${(value / 1e3).toFixed(1)}K${suffix}`;
  }
  return `${value.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`;
}

/** S159: Percentage formatter */
export function formatPercentage(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/** S160: Input sanitizer */
export function sanitizeInput(input: string): string {
  return input.replace(/[<>'"&]/g, (char) => {
    const map: Record<string, string> = { "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;", "&": "&amp;" };
    return map[char] || char;
  });
}

// ═══════════════════════════════════════════════════════════════
// S161-S170: FINANCIAL MATH UTILITIES
// ═══════════════════════════════════════════════════════════════

/** S161: Deep clone */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/** S167: Financial math utilities */
export const FinancialMath = {
  /** S168: Compound interest — future value */
  futureValue(principal: number, rate: number, years: number, compoundsPerYear = 12): number {
    return principal * Math.pow(1 + rate / compoundsPerYear, compoundsPerYear * years);
  },

  /** Present value */
  presentValue(futureValue: number, rate: number, years: number): number {
    return futureValue / Math.pow(1 + rate, years);
  },

  /** Future value of annuity (regular contributions) */
  futureValueAnnuity(payment: number, rate: number, years: number, compoundsPerYear = 12): number {
    const r = rate / compoundsPerYear;
    const n = compoundsPerYear * years;
    return payment * ((Math.pow(1 + r, n) - 1) / r);
  },

  /** S169: Amortization schedule */
  amortize(principal: number, annualRate: number, years: number): Array<{
    month: number;
    payment: number;
    principal: number;
    interest: number;
    balance: number;
    totalInterest: number;
  }> {
    const monthlyRate = annualRate / 12;
    const numPayments = years * 12;
    const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
    
    const schedule: Array<{ month: number; payment: number; principal: number; interest: number; balance: number; totalInterest: number }> = [];
    let balance = principal;
    let totalInterest = 0;

    for (let m = 1; m <= numPayments; m++) {
      const interest = balance * monthlyRate;
      const principalPaid = payment - interest;
      balance -= principalPaid;
      totalInterest += interest;
      schedule.push({
        month: m,
        payment: Math.round(payment * 100) / 100,
        principal: Math.round(principalPaid * 100) / 100,
        interest: Math.round(interest * 100) / 100,
        balance: Math.max(0, Math.round(balance * 100) / 100),
        totalInterest: Math.round(totalInterest * 100) / 100,
      });
    }
    return schedule;
  },

  /** S170: Tax bracket engine */
  calculateTax(income: number, filingStatus: "single" | "married" | "head" = "single", year = 2024): {
    totalTax: number;
    effectiveRate: number;
    marginalRate: number;
    bracketBreakdown: Array<{ bracket: number; taxableInBracket: number; taxInBracket: number }>;
  } {
    const brackets: Record<string, Array<[number, number]>> = {
      single: [[11600, 0.10], [47150, 0.12], [100525, 0.22], [191950, 0.24], [243725, 0.32], [609350, 0.35], [Infinity, 0.37]],
      married: [[23200, 0.10], [94300, 0.12], [201050, 0.22], [383900, 0.24], [487450, 0.32], [731200, 0.35], [Infinity, 0.37]],
      head: [[16550, 0.10], [63100, 0.12], [100500, 0.22], [191950, 0.24], [243700, 0.32], [609350, 0.35], [Infinity, 0.37]],
    };

    const schedule = brackets[filingStatus] || brackets.single;
    let totalTax = 0;
    let prevLimit = 0;
    let marginalRate = 0.10;
    const breakdown: Array<{ bracket: number; taxableInBracket: number; taxInBracket: number }> = [];

    for (const [limit, rate] of schedule) {
      if (income <= prevLimit) break;
      const taxableInBracket = Math.min(income, limit) - prevLimit;
      const taxInBracket = taxableInBracket * rate;
      totalTax += taxInBracket;
      marginalRate = rate;
      breakdown.push({ bracket: rate, taxableInBracket: Math.round(taxableInBracket), taxInBracket: Math.round(taxInBracket * 100) / 100 });
      prevLimit = limit;
    }

    return {
      totalTax: Math.round(totalTax * 100) / 100,
      effectiveRate: income > 0 ? Math.round((totalTax / income) * 10000) / 10000 : 0,
      marginalRate,
      bracketBreakdown: breakdown,
    };
  },

  /** Rule of 72 — years to double */
  yearsToDouble(rate: number): number {
    return rate > 0 ? 72 / (rate * 100) : Infinity;
  },

  /** Inflation-adjusted value */
  inflationAdjusted(value: number, inflationRate: number, years: number): number {
    return value / Math.pow(1 + inflationRate, years);
  },

  /** Required savings rate for retirement goal */
  requiredSavingsRate(
    currentAge: number,
    retirementAge: number,
    currentSavings: number,
    retirementGoal: number,
    annualIncome: number,
    expectedReturn: number
  ): number {
    const years = retirementAge - currentAge;
    if (years <= 0 || annualIncome <= 0) return 0;
    const fvCurrent = currentSavings * Math.pow(1 + expectedReturn, years);
    const gap = retirementGoal - fvCurrent;
    if (gap <= 0) return 0;
    const annuityFactor = ((Math.pow(1 + expectedReturn, years) - 1) / expectedReturn);
    const requiredAnnual = gap / annuityFactor;
    return Math.max(0, Math.min(1, requiredAnnual / annualIncome));
  },

  /** Safe withdrawal amount */
  safeWithdrawal(portfolio: number, rate = 0.04): number {
    return portfolio * rate;
  },

  /** RMD calculation (simplified) */
  calculateRMD(accountBalance: number, age: number): number {
    // Simplified Uniform Lifetime Table
    const factors: Record<number, number> = {
      72: 27.4, 73: 26.5, 74: 25.5, 75: 24.6, 76: 23.7, 77: 22.9, 78: 22.0,
      79: 21.1, 80: 20.2, 81: 19.4, 82: 18.5, 83: 17.7, 84: 16.8, 85: 16.0,
      86: 15.2, 87: 14.4, 88: 13.7, 89: 12.9, 90: 12.2, 91: 11.5, 92: 10.8,
      93: 10.1, 94: 9.5, 95: 8.9,
    };
    const factor = factors[age] || (age < 72 ? 0 : 8.0);
    return factor > 0 ? Math.round(accountBalance / factor) : 0;
  },
};
