import { useMemo } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useClientData } from "@/contexts/ClientDataContext";

/**
 * PrintBrandHeader — Renders a branded "Russell Capital Solutions" header,
 * footer, and compliance disclaimer that are ONLY visible when printing
 * (Ctrl+P / Cmd+P). Hidden on screen via CSS (.print-header { display:none }).
 *
 * Automatically resolves:
 *  - Page title from the current route
 *  - Client name from ClientDataContext (if a client is selected)
 *  - Advisor name from useAuth
 *  - Current date formatted for print
 */

// Map of route segments → human-readable page titles
function routeToTitle(path: string): string {
  // Strip /portal/ prefix and trailing slashes
  const segment = path.replace(/^\/portal\/?/, "").replace(/\/$/, "");
  if (!segment) return "Dashboard";

  // Convert kebab-case to Title Case
  return segment
    .split("/")[0] // take first segment only
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function PrintBrandHeader() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { data: clientData, selectedClientId, clients } = useClientData();

  const pageTitle = useMemo(() => routeToTitle(location), [location]);

  const today = useMemo(() => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, []);

  const advisorName = user?.name || "Russell Capital Advisor";
  // Try clientData.clientName first, then fall back to clients list
  const selectedClient = clients.find((c) => c.id === selectedClientId);
  const clientName = clientData?.clientName || selectedClient?.name || null;

  return (
    <>
      {/* ── Branded Print Header ─────────────────────────────────────────── */}
      <div className="print-header">
        <div>
          <div className="brand">Russell Capital Solutions</div>
          <div className="tagline">Tax-Free Wealth Engineering</div>
          {clientName && (
            <div className="client-name">
              Prepared for: <strong>{clientName}</strong>
            </div>
          )}
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="page-title">{pageTitle}</div>
          <div className="date">{today}</div>
          <div className="advisor">Advisor: {advisorName}</div>
        </div>
      </div>

      {/* ── Print Footer (fixed to bottom of every page) ─────────────────── */}
      <div className="print-footer">
        Russell Capital Solutions &bull; www.RussellCap.com &bull; Confidential
        &mdash; For Authorized Use Only &bull; {today}
      </div>

      {/* ── Compliance Disclaimer (end of printed content) ───────────────── */}
      <div className="print-disclosure">
        <strong>Important Disclosure:</strong> The projections, calculations, and
        strategies presented herein are for illustrative and educational purposes
        only and do not constitute financial, tax, or legal advice. Past
        performance does not guarantee future results. All tax strategies
        reference applicable IRS codes and should be reviewed with a qualified
        tax professional. Russell Capital Solutions is a trade name of Russell
        Holdings Management LLC. &copy; {new Date().getFullYear()} Russell
        Holdings Management LLC. All rights reserved. www.RussellCapitalSolutions.com
      </div>
    </>
  );
}
