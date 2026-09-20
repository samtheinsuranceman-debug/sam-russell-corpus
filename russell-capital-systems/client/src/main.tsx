import { apiFetch, apiUrl } from "@/lib/api";
import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import { AccessProvider } from "@/contexts/AccessContext";
import superjson from "superjson";
import App from "./App";
import { ClientDataProvider } from "./contexts/ClientDataContext";
import { FinancialDataProvider } from "./contexts/FinancialDataContext";
import { UnifiedDataBusProvider } from "./contexts/UnifiedDataBusContext";
import { CalculatorResultsProvider } from "./components/CalculatorIntegration";
import { StrategyProvider } from "./contexts/StrategyContext";
import { DisclaimerProvider } from "./contexts/DisclaimerContext";
import { startLogin } from "./const";
import "./index.css";
import "./styles/interior.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,       // Data stays fresh for 60s — prevents redundant refetches on navigation
      gcTime: 5 * 60_000,      // Keep unused data in cache for 5 min
      refetchOnWindowFocus: false, // Don't refetch when user tabs back
      retry: 1,                // Only retry once on failure
    },
  },
});

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  startLogin(window.location.pathname);
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    // Don't spam console with expected UNAUTHORIZED errors on public portal pages
    if (error instanceof TRPCClientError && error.message === UNAUTHED_ERR_MSG && window.location.pathname.startsWith("/portal")) return;
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    // Don't spam console with expected UNAUTHORIZED errors on public portal pages
    if (error instanceof TRPCClientError && error.message === UNAUTHED_ERR_MSG && window.location.pathname.startsWith("/portal")) return;
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: apiUrl("/api/trpc"),
      transformer: superjson,
      fetch(input, init) {
        return apiFetch(input as RequestInfo | URL, (init ?? {}) as RequestInit);
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <AccessProvider>
        <DisclaimerProvider>
          <ClientDataProvider>
            {/* Shared calculator-data layer (PR-3a).
                FinancialData  — one dataset every tool reads/writes via useSharedField.
                UnifiedDataBus — features publish results other features can read.
                CalcResults    — per-calculator results feeding the health score.
                All three sit INSIDE ClientDataProvider because the auto-fill hook
                seeds them from the selected client's Fact Finder. Each hook also
                works outside its provider, so mounting order is not load-bearing. */}
            <FinancialDataProvider>
              <UnifiedDataBusProvider>
                <CalculatorResultsProvider>
                  <StrategyProvider>
                    <App />
                  </StrategyProvider>
                </CalculatorResultsProvider>
              </UnifiedDataBusProvider>
            </FinancialDataProvider>
          </ClientDataProvider>
        </DisclaimerProvider>
      </AccessProvider>
    </QueryClientProvider>
  </trpc.Provider>
);
