// ============================================================
// MATCHES — pre-computed complementarity + Request Connection
// ============================================================
// The schematic's Month-1 network page: top matches by the four-component
// complementarity formula, "Request Connection" buttons, incoming requests,
// and mutual-accept → email reveal. Members only (completed assessment).

import { Link } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { PublicHeader, PublicFooter } from "@/components/PublicLayout";

const INK = "#141009";
const CREAM = "#F1EADB";
const CREAM2 = "#CFC5B0";
const MUTED = "#9C8F79";
const LINE_C = "rgba(241,234,219,0.10)";
const CHAMPAGNE = "#E0C68C";
const JADE = "#9BC0B2";
const EMBER = "#E2604A";

const mono = { fontFamily: "'JetBrains Mono', monospace" } as const;
const serif = { fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 } as const;

function axisLine(a: { axis: string; direction: string }) {
  return a.direction === "they_fill"
    ? `Their ${a.axis} strength fills your gap`
    : `Your ${a.axis} strength fills their gap`;
}

export default function Matches() {
  const { user, loading } = useAuth();
  const utils = trpc.useUtils();
  const q = trpc.connections.myMatches.useQuery(undefined, { enabled: !!user, retry: false });
  const request = trpc.connections.request.useMutation({
    onSuccess: (res) => {
      toast.success(res.status === "accepted" ? "It's mutual — connection made." : "Connection requested.");
      utils.connections.myMatches.invalidate();
    },
    onError: (e) => toast.error(e.message || "Couldn't send the request."),
  });
  const respond = trpc.connections.respond.useMutation({
    onSuccess: () => utils.connections.myMatches.invalidate(),
  });

  const data = q.data;
  const outgoingIds = new Set((data?.connections.outgoing ?? []).map((o) => o.userId));
  const acceptedById = new Map((data?.connections.accepted ?? []).map((a) => [a.userId, a]));
  const incomingByUser = new Map((data?.connections.incoming ?? []).map((i) => [i.userId, i]));

  return (
    <div className="min-h-screen relative" style={{ background: INK }}>
      <PublicHeader />
      <div className="relative z-10 max-w-[1000px] mx-auto px-[clamp(20px,5vw,56px)] py-[clamp(40px,6vw,80px)]">
        <div style={{ ...mono, fontSize: "10px", letterSpacing: "0.26em", textTransform: "uppercase", color: CHAMPAGNE, marginBottom: "14px" }}>
          The network · complementary matching
        </div>
        <h1 style={{ ...serif, fontSize: "clamp(30px,5vw,52px)", lineHeight: 1.04, color: CREAM, margin: "0 0 12px" }}>
          Minds that complete yours.
        </h1>
        <p style={{ color: CREAM2, fontSize: "clamp(15px,1.6vw,17px)", lineHeight: 1.65, maxWidth: "44em", marginBottom: "34px" }}>
          Scored across all measured lines: how much of the full spectrum you cover <i>together</i>, how dramatically
          each of you fills the other&rsquo;s gaps, the common ground you can actually relate on, and the mentorship
          headroom in both directions. Only quality matches are shown. A connection request reveals nothing — a{" "}
          <b style={{ color: CREAM }}>mutual</b> accept shares your emails with each other.
        </p>

        {(loading || q.isLoading) && <p style={{ color: MUTED }}>Loading your matches…</p>}

        {!loading && !user && (
          <div style={{ border: `1px solid ${LINE_C}`, borderRadius: "12px", padding: "26px", color: CREAM2 }}>
            <Link href="/login" style={{ color: CHAMPAGNE }}>Sign in</Link> to see your matches.
          </div>
        )}

        {data && !data.eligible && (
          <div style={{ border: `1px solid ${LINE_C}`, borderRadius: "12px", padding: "26px", color: CREAM2 }}>
            Matching unlocks when your assessment is complete — it&rsquo;s computed from your 32-line profile.{" "}
            <Link href="/assessment" style={{ color: CHAMPAGNE }}>Finish your assessment →</Link>
          </div>
        )}

        {/* Incoming requests first — the highest-signal action on the page */}
        {data && data.connections.incoming.length > 0 && (
          <div style={{ border: `1px solid ${CHAMPAGNE}44`, background: "rgba(224,198,140,0.05)", borderRadius: "12px", padding: "20px", marginBottom: "26px" }}>
            <div style={{ ...mono, fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: CHAMPAGNE, marginBottom: "12px" }}>
              Wants to connect with you
            </div>
            {data.connections.incoming.map((r) => (
              <div key={r.requestId} className="flex items-center justify-between gap-3 py-2">
                <span style={{ color: CREAM, fontSize: "15px" }}>{r.name}</span>
                <span className="flex gap-2">
                  <button onClick={() => respond.mutate({ requestId: r.requestId, accept: true })}
                    style={{ ...mono, fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", padding: "8px 14px", background: CHAMPAGNE, color: INK, border: 0, borderRadius: "4px", cursor: "pointer", fontWeight: 600 }}>
                    Accept
                  </button>
                  <button onClick={() => respond.mutate({ requestId: r.requestId, accept: false })}
                    style={{ ...mono, fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", padding: "8px 14px", background: "transparent", color: CREAM2, border: `1px solid ${LINE_C}`, borderRadius: "4px", cursor: "pointer" }}>
                    Decline
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Accepted connections — emails revealed */}
        {data && data.connections.accepted.length > 0 && (
          <div style={{ border: `1px solid ${JADE}44`, background: "rgba(155,192,178,0.05)", borderRadius: "12px", padding: "20px", marginBottom: "26px" }}>
            <div style={{ ...mono, fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: JADE, marginBottom: "12px" }}>
              Your connections
            </div>
            {data.connections.accepted.map((c) => (
              <div key={c.userId} className="flex items-center justify-between gap-3 py-2 flex-wrap">
                <span style={{ color: CREAM, fontSize: "15px" }}>{c.name}</span>
                <span className="flex items-center gap-3">
                  {c.email && <a href={`mailto:${c.email}`} style={{ ...mono, fontSize: "12px", color: JADE }}>{c.email}</a>}
                  <Link href="/messages" style={{ ...mono, fontSize: "11px", letterSpacing: "0.06em", textTransform: "uppercase", color: CHAMPAGNE }}>Message →</Link>
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Match cards */}
        {data && data.eligible && (
          data.matches.length === 0 ? (
            <div style={{ border: `1px solid ${LINE_C}`, borderRadius: "12px", padding: "26px", color: CREAM2 }}>
              No quality matches yet — the network is young. As more founding members complete their assessments,
              your matches appear here automatically. Check back soon.
            </div>
          ) : (
            <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))" }}>
              {data.matches.map((m) => {
                const accepted = acceptedById.get(m.userId);
                const incoming = incomingByUser.get(m.userId);
                const requested = outgoingIds.has(m.userId);
                return (
                  <div key={m.userId} className="transition-all duration-200 hover:-translate-y-[2px]"
                    style={{ border: `1px solid ${LINE_C}`, borderRadius: "14px", padding: "22px", background: "rgba(241,234,219,0.03)" }}>
                    <div className="flex items-baseline justify-between gap-3 mb-1">
                      <div style={{ ...serif, fontSize: "21px", color: CREAM }}>{m.name}</div>
                      <div style={{ ...serif, fontSize: "24px", color: CHAMPAGNE }}>{m.percent}%</div>
                    </div>
                    {m.tier && (
                      <div style={{ ...mono, fontSize: "9.5px", letterSpacing: "0.14em", textTransform: "uppercase", color: m.percent >= 85 ? EMBER : CHAMPAGNE, marginBottom: "10px" }}>
                        {m.tier.label}
                      </div>
                    )}
                    <div style={{ marginBottom: "14px" }}>
                      {m.topAxes.map((a) => (
                        <div key={a.axis} style={{ color: CREAM2, fontSize: "12.5px", lineHeight: 1.5 }}>
                          <span style={{ color: a.direction === "they_fill" ? JADE : CHAMPAGNE }}>◇ </span>
                          {axisLine(a)}
                        </div>
                      ))}
                      {m.topAxes.length === 0 && m.tier && (
                        <div style={{ color: MUTED, fontSize: "12.5px" }}>{m.tier.blurb}</div>
                      )}
                    </div>
                    {accepted ? (
                      <Link href="/messages"
                        style={{ ...mono, fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", color: JADE }}>
                        Connected · Message →
                      </Link>
                    ) : incoming ? (
                      <button onClick={() => respond.mutate({ requestId: incoming.requestId, accept: true })}
                        style={{ ...mono, fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", padding: "10px 16px", background: CHAMPAGNE, color: INK, border: 0, borderRadius: "4px", cursor: "pointer", fontWeight: 600 }}>
                        Accept their request
                      </button>
                    ) : requested ? (
                      <span style={{ ...mono, fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", color: MUTED }}>
                        Requested — awaiting accept
                      </span>
                    ) : (
                      <button disabled={request.isPending}
                        onClick={() => request.mutate({ toUserId: m.userId })}
                        style={{ ...mono, fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", padding: "10px 16px", background: "transparent", color: CHAMPAGNE, border: `1px solid ${CHAMPAGNE}66`, borderRadius: "4px", cursor: "pointer" }}>
                        Request connection
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
      <PublicFooter />
    </div>
  );
}
