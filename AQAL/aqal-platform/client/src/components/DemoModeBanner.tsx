import { trpc } from "@/lib/trpc";

/**
 * A slim, honest strip shown ONLY when no live AI provider is connected — i.e.
 * the backend is running on the built-in mock, so any "analysis" is a simulated
 * sample, not a live AI read. It self-removes the moment a real OPENAI_API_KEY
 * (or other provider) is wired, so production deployments never see it.
 */
export default function DemoModeBanner() {
  const status = trpc.platform.status.useQuery(undefined, {
    staleTime: 5 * 60_000,
    retry: false,
  });

  // Only render when we KNOW the LLM is on the mock. While loading or on error,
  // render nothing (fail quiet — never falsely accuse a live deployment).
  if (!status.data || status.data.liveLLM) return null;

  return (
    <div
      role="status"
      className="w-full text-center px-4 py-1.5 border-b"
      style={{
        background: "oklch(0.72 0.12 75 / 0.10)",
        borderColor: "oklch(0.72 0.12 75 / 0.22)",
        color: "oklch(0.82 0.09 75)",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "0.62rem",
        letterSpacing: "0.08em",
      }}
    >
      PREVIEW MODE · Scores are simulated samples, not a live AI analysis. Live
      scoring activates when the AI provider is connected.
    </div>
  );
}
