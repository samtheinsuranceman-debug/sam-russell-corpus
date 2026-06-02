// @ts-nocheck
import { AlertTriangle, RotateCcw, Home, Bug, Copy, Check } from "lucide-react";
import { Component, ReactNode, useState } from "react";

interface Props {
  children: ReactNode;
  fallbackRoute?: string;
}
interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
  reported: boolean;
}

/** Report error to backend for tracking */
async function reportError(error: Error, errorInfo?: any, metadata?: Record<string, unknown>) {
  try {
    await fetch("/api/rpc/errorTracking.logClientError", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        "0": {
          json: {
            message: error.message || "Unknown error",
            stack: error.stack || "",
            componentStack: errorInfo?.componentStack || "",
            url: window.location.href,
            userAgent: navigator.userAgent,
            metadata: {
              ...metadata,
              timestamp: Date.now(),
              viewport: `${window.innerWidth}x${window.innerHeight}`,
            },
          },
        },
      }),
    });
  } catch {
    // Silent fail — don't crash the error boundary
  }
}

/** Global unhandled error listener */
if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    reportError(
      event.error || new Error(event.message),
      null,
      { type: "unhandled_error", filename: event.filename, lineno: event.lineno, colno: event.colno }
    );
  });

  window.addEventListener("unhandledrejection", (event) => {
    const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
    reportError(error, null, { type: "unhandled_promise_rejection" });
  });
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, reported: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    this.setState({ errorInfo });
    reportError(error, errorInfo, { type: "react_error_boundary" });
    this.setState({ reported: true });
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          reported={this.state.reported}
          onReset={() => this.setState({ hasError: false, error: null, errorInfo: null, reported: false })}
          fallbackRoute={this.props.fallbackRoute}
        />
      );
    }
    return this.props.children;
  }
}

function ErrorFallback({ error, errorInfo, reported, onReset, fallbackRoute }: {
  error: Error | null;
  errorInfo: any;
  reported: boolean;
  onReset: () => void;
  fallbackRoute?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [showStack, setShowStack] = useState(false);

  const errorText = [
    `Error: ${error?.message || "Unknown"}`,
    error?.stack ? `\nStack:\n${error.stack}` : "",
    errorInfo?.componentStack ? `\nComponent Stack:\n${errorInfo.componentStack}` : "",
    `\nURL: ${window.location.href}`,
    `\nTime: ${new Date().toISOString()}`,
  ].join("");

  const copyError = async () => {
    try {
      await navigator.clipboard.writeText(errorText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-8 bg-[#0a0f1a]">
      <div className="flex flex-col items-center w-full max-w-2xl p-8">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-red-500/10 rounded-full blur-xl animate-pulse" style={{ width: 80, height: 80, top: -8, left: -8 }} />
          <div className="w-16 h-16 rounded-full border border-red-500/30 flex items-center justify-center bg-[#0d1526]">
            <AlertTriangle size={32} className="text-red-400" />
          </div>
        </div>

        <h2 className="text-xl font-semibold text-white mb-2">Something went wrong</h2>
        <p className="text-[#7a95b8] mb-4 text-center">
          An unexpected error occurred. The error has been {reported ? "automatically reported" : "logged"} for investigation.
        </p>

        {reported && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
            <Bug size={14} className="text-emerald-400" />
            <span className="text-xs text-emerald-400">Error reported to development team</span>
          </div>
        )}

        <div className="w-full mb-4">
          <button
            onClick={() => setShowStack(!showStack)}
            className="text-xs text-[#7a95b8] hover:text-white transition-colors mb-2"
          >
            {showStack ? "Hide" : "Show"} technical details
          </button>
          {showStack && (
            <div className="p-4 w-full rounded-lg bg-[#0d1526] border border-[#1e3a5f]/50 overflow-auto max-h-48 relative">
              <button
                onClick={copyError}
                className="absolute top-2 right-2 p-1.5 rounded bg-[#1e3a5f]/50 hover:bg-[#1e3a5f] transition-colors"
                title="Copy error details"
              >
                {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} className="text-[#7a95b8]" />}
              </button>
              <pre className="text-xs text-red-300/70 whitespace-break-spaces font-mono pr-8">
                {error?.message || "Unknown error"}
                {error?.stack && `\n\n${error.stack}`}
              </pre>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => window.location.href = fallbackRoute || "/portal"}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[#1e3a5f] text-[#7a95b8] hover:text-white hover:border-emerald-500/50 transition-colors text-sm"
          >
            <Home size={16} />
            Dashboard
          </button>
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[#1e3a5f] text-[#7a95b8] hover:text-white hover:border-blue-500/50 transition-colors text-sm"
          >
            <RotateCcw size={16} />
            Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors text-sm"
          >
            <RotateCcw size={16} />
            Reload Page
          </button>
        </div>
      </div>
    </div>
  );
}

export default ErrorBoundary;
export { reportError };
