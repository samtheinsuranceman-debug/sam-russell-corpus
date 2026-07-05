import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  pageName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Page-level error boundary — wraps individual routes so a crash
 * in one page doesn't take down the entire app. Offers retry + home.
 */
class PageErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[60vh] p-8">
          <div className="flex flex-col items-center w-full max-w-md text-center">
            <AlertTriangle
              size={40}
              className="text-amber-500 mb-4 flex-shrink-0"
            />

            <h2 className="text-lg text-foreground mb-2">
              {this.props.pageName
                ? `Something went wrong on ${this.props.pageName}`
                : "Something went wrong"}
            </h2>

            <p className="text-sm text-muted-foreground mb-6">
              This page encountered an error. You can try again or return home.
            </p>

            <div className="p-3 w-full rounded bg-muted/50 overflow-auto mb-6 max-h-32">
              <pre className="text-xs text-muted-foreground/70 whitespace-break-spaces text-left">
                {this.state.error?.message}
              </pre>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={this.handleRetry}
                variant="outline"
                size="sm"
                className="gap-1.5"
              >
                <RotateCcw size={14} />
                Try Again
              </Button>
              <a href="/">
                <Button size="sm" className="gap-1.5 bg-primary text-white hover:bg-primary/90">
                  <Home size={14} />
                  Go Home
                </Button>
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default PageErrorBoundary;
