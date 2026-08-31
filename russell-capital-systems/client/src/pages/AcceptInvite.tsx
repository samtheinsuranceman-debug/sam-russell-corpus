import { trpc } from "@/lib/trpc";
import { CheckCircle, XCircle, Loader2, Shield } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function AcceptInvite() {
  const [, navigate] = useLocation();

  const params = new URLSearchParams(window.location.search);
  const token = params.get("token") ?? "";

  const acceptQuery = trpc.team.acceptInvite.useQuery(
    { token },
    { enabled: !!token, retry: false }
  );

  useEffect(() => {
    if (acceptQuery.data?.valid) {
      const timer = setTimeout(() => navigate("/portal"), 3000);
      return () => clearTimeout(timer);
    }
  }, [acceptQuery.data, navigate]);

  const inv = acceptQuery.data?.valid ? acceptQuery.data.invitation : null;

  return (
    <div className="min-h-screen bg-[#060f20] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#22c55e] flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
            <span className="text-white font-extrabold text-lg" style={{ fontFamily: "DM Sans, sans-serif" }}>
              Russell Capital Systems™
            </span>
          </div>
        </div>

        <div className="rc-card text-center">
          {!token && (
            <>
              <XCircle size={48} className="text-[#ef4444] mx-auto mb-4" />
              <h2 className="text-white font-bold text-xl mb-2">Invalid Invitation Link</h2>
              <p className="text-[#7a95b8] text-sm mb-6">
                This invitation link is missing a token. Please use the link from your invitation email.
              </p>
              <a href="/" className="rc-btn rc-btn-primary inline-flex">Go to Homepage</a>
            </>
          )}

          {token && acceptQuery.isLoading && (
            <>
              <Loader2 size={48} className="text-[#22c55e] mx-auto mb-4 animate-spin" />
              <h2 className="text-white font-bold text-xl mb-2">Verifying Invitation</h2>
              <p className="text-[#7a95b8] text-sm">Checking your invitation token…</p>
            </>
          )}

          {token && acceptQuery.isError && (
            <>
              <XCircle size={48} className="text-[#ef4444] mx-auto mb-4" />
              <h2 className="text-white font-bold text-xl mb-2">Invitation Invalid or Expired</h2>
              <p className="text-[#7a95b8] text-sm mb-6">
                This invitation link may have expired or already been used. Please ask your workspace admin to send a new invitation.
              </p>
              <a href="/" className="rc-btn rc-btn-primary inline-flex">Go to Homepage</a>
            </>
          )}

          {token && acceptQuery.data && !acceptQuery.data.valid && (
            <>
              <XCircle size={48} className="text-[#ef4444] mx-auto mb-4" />
              <h2 className="text-white font-bold text-xl mb-2">Invitation Invalid or Expired</h2>
              <p className="text-[#7a95b8] text-sm mb-6">
                This invitation link has expired or already been used. Please ask your workspace admin to send a new invitation.
              </p>
              <a href="/" className="rc-btn rc-btn-primary inline-flex">Go to Homepage</a>
            </>
          )}

          {token && acceptQuery.data?.valid && inv && (
            <>
              <CheckCircle size={48} className="text-[#22c55e] mx-auto mb-4" />
              <h2 className="text-white font-bold text-xl mb-2">Invitation Verified!</h2>
              <p className="text-[#7a95b8] text-sm mb-2">
                You have been invited as{" "}
                <span className="text-[#22c55e] font-semibold">{inv.role}</span>.
              </p>
              {inv.firstName && (
                <p className="text-white text-sm mb-4">
                  Welcome, <span className="font-semibold">{inv.firstName} {inv.lastName ?? ""}</span>!
                </p>
              )}
              <p className="text-xs text-[#7a95b8] mb-4">Sign in to complete joining your workspace. Redirecting in 3 seconds…</p>
              <a href="/portal" className="rc-btn rc-btn-primary inline-flex">Go to Dashboard</a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
