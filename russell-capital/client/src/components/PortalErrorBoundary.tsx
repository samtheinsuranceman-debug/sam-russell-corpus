import React from "react";
import { AlertTriangle, RefreshCcw, RotateCcw, Home, Copy, ChevronDown, ChevronUp } from "lucide-react";

/**
 * Per-page error boundary for portal routes.
 * Catches render errors in individual pages and shows a branded
 * retry card instead of taking down the entire application.
 */

interface Props {
  children: React.ReactNode;
  pageName?: string;
  pagePath?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  reported: boolean;
}

function reportPageError(error: Error, pagePath: string, source: string = "portal_page") {
  try {
    fetch("/api/trpc/errorLog.report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        json: {
          message: error.message,
          stack: error.stack?.slice(0, 2000),
          url: window.location.href,
          source,
          metadata: { pagePath },
        },
      }),
    }).catch(() => {});
  } catch {}
}

class PortalErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, reported: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo, reported: true });
    reportPageError(error, this.props.pagePath || window.location.pathname, "portal_page");
  }

  onReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, reported: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          pageName={this.props.pageName}
          pagePath={this.props.pagePath}
          onReset={this.onReset}
        />
      );
    }
    return this.props.children;
  }
}

function ErrorFallback({
  error,
  errorInfo,
  pageName,
  pagePath,
  onReset,
}: {
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  pageName?: string;
  pagePath?: string;
  onReset: () => void;
}) {
  const [showStack, setShowStack] = React.useState(false);
  const navigate = (path: string) => { window.location.href = path; };

  const copyError = () => {
    const text = `Page: ${pageName || pagePath || "unknown"}\nError: ${error?.message}\n\nStack:\n${error?.stack || "N/A"}`;
    navigator.clipboard.writeText(text).catch(() => {});
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <div className="max-w-lg w-full rounded-2xl border border-red-500/20 bg-red-500/5 p-6 sm:p-8 text-center space-y-5">
        <div className="mx-auto w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center">
          <AlertTriangle size={28} className="text-red-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white mb-1">Something went wrong</h2>
          <p className="text-sm text-[#7a95b8]">
            {pageName ? `The "${pageName}" page` : "This page"} encountered an error.
            The rest of the app is still working.
          </p>
        </div>
        {error?.message && (
          <div className="rounded-lg bg-[#0d1526] border border-[#1e3a5f]/30 p-3 text-left">
            <p className="text-xs text-red-300/80 font-mono break-all">{error.message}</p>
          </div>
        )}
        {error?.stack && (
          <div>
            <button
              onClick={() => setShowStack(!showStack)}
              className="flex items-center gap-1 mx-auto text-xs text-[#7a95b8] hover:text-white transition-colors"
            >
              {showStack ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {showStack ? "Hide" : "Show"} technical details
            </button>
            {showStack && (
              <div className="mt-2 rounded-lg bg-[#0d1526] border border-[#1e3a5f]/30 p-3 text-left max-h-48 overflow-y-auto">
                <pre className="text-[10px] text-[#7a95b8] font-mono whitespace-pre-wrap break-all">
                  {error.stack}
                </pre>
                <button
                  onClick={copyError}
                  className="mt-2 flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300"
                >
                  <Copy size={10} /> Copy error
                </button>
              </div>
            )}
          </div>
        )}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors text-sm font-medium"
          >
            <RefreshCcw size={15} />
            Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[#1e3a5f] text-[#7a95b8] hover:text-white hover:border-blue-500/50 transition-colors text-sm"
          >
            <RotateCcw size={15} />
            Reload Page
          </button>
          <button
            onClick={() => navigate("/portal/dashboard")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[#1e3a5f] text-[#7a95b8] hover:text-white hover:border-emerald-500/50 transition-colors text-sm"
          >
            <Home size={15} />
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default PortalErrorBoundary;
export { reportPageError };
