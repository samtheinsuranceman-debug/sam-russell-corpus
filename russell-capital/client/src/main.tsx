import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import { AccessProvider } from "@/contexts/AccessContext";
import superjson from "superjson";
import App from "./App";
import { ClientDataProvider } from "./contexts/ClientDataContext";
import { StrategyProvider } from "./contexts/StrategyContext";
import { CalculatorResultsProvider } from "./components/CalculatorIntegration";
import { CalcDataBusBridge } from "./components/CalcDataBusBridge";
import { DisclaimerProvider } from "./contexts/DisclaimerContext";
import { UnifiedDataBusProvider } from "./contexts/UnifiedDataBusContext";
import { AIBrainProvider } from "./contexts/AIBrainContext";
import { OrganismProvider } from "./contexts/OrganismContext";
import { getLoginUrl } from "./const";
import "./index.css";

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

  // Don't redirect to login for portal pages — they are publicly accessible
  // Only redirect for pages that explicitly require auth (e.g. /portal/welcome onboarding wizard)
  const path = window.location.pathname;
  if (path.startsWith("/portal")) return;

  window.location.href = getLoginUrl(window.location.pathname);
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
      url: "/api/rpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <UnifiedDataBusProvider>
        <AccessProvider>
          <DisclaimerProvider>
            <ClientDataProvider>
              <CalculatorResultsProvider>
                <CalcDataBusBridge />
                <StrategyProvider>
                  <AIBrainProvider>
                    <OrganismProvider>
                      <App />
                    </OrganismProvider>
                  </AIBrainProvider>
                </StrategyProvider>
              </CalculatorResultsProvider>
            </ClientDataProvider>
          </DisclaimerProvider>
        </AccessProvider>
      </UnifiedDataBusProvider>
    </QueryClientProvider>
  </trpc.Provider>
);
