import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { CONSUMER_HEALTH_CONSENT_VERSION } from "@shared/legalVersions";

const SESSION_KEY = "db_session_id";
const CONSENT_KEY = `db_health_data_consent_v${CONSUMER_HEALTH_CONSENT_VERSION}`;

function getSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    const randomId = typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    id = `sess_${randomId}`;
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

// Only truly public/legal surfaces bypass consent. Anything that may collect a
// journal entry, support prompt, symptom description or other health-related
// information requires the health-data notice first.
const BYPASS_EXACT_PATHS = [
  "/",
  "/privacy",
  "/health-data-privacy",
  "/terms",
  "/medical-disclaimer",
  "/subscription-terms",
  "/subscribe",
  "/settings",
  "/crisis",
  "/404",
];

export function bypassConsentGate(path: string) {
  const clean = (path.split("?")[0].split("#")[0].replace(/\/+$/, "") || "/").toLowerCase();
  return BYPASS_EXACT_PATHS.includes(clean);
}

export default function ConsumerHealthConsentModal() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"intro" | "form">("intro");
  const [isAdult, setIsAdult] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedHealthData, setAgreedHealthData] = useState(false);
  const [agreedWellnessBoundary, setAgreedWellnessBoundary] = useState(false);
  const [agreedActivity, setAgreedActivity] = useState(false);
  const [agreedAudio, setAgreedAudio] = useState(false);
  const [agreedVideo, setAgreedVideo] = useState(false);
  const [error, setError] = useState("");

  const sessionId = useMemo(() => getSessionId(), []);
  const { data: consentData } = trpc.consent.check.useQuery(
    { sessionId },
    { refetchOnWindowFocus: false, retry: false, enabled: !bypassConsentGate(location) }
  );

  const signMutation = trpc.consent.sign.useMutation({
    onSuccess: () => {
      localStorage.setItem(CONSENT_KEY, "1");
      setOpen(false);
    },
    onError: err => setError(err.message),
  });

  useEffect(() => {
    if (bypassConsentGate(location)) {
      setOpen(false);
      return;
    }
    if (consentData?.hasSigned) {
      localStorage.setItem(CONSENT_KEY, "1");
      setOpen(false);
      return;
    }
    if (consentData !== undefined && !consentData.hasSigned) {
      // Server state is authoritative. This also repairs stale browser state
      // after consent is withdrawn on another device or session.
      localStorage.removeItem(CONSENT_KEY);
      setOpen(true);
      return;
    }
    if (localStorage.getItem(CONSENT_KEY)) return;
  }, [consentData, location]);

  if (!open) return null;

  const handleSubmit = () => {
    setError("");
    if (!isAdult) return setError("Doctor Buddy's public edition is for adults age 18 and older.");
    if (!agreedTerms || !agreedHealthData || !agreedWellnessBoundary) {
      return setError("Please acknowledge each required item to continue.");
    }
    signMutation.mutate({
      sessionId,
      isAdult,
      agreedToTerms: agreedTerms,
      agreedToHealthData: agreedHealthData,
      agreedToWellnessBoundary: agreedWellnessBoundary,
      agreedToActivityLogging: agreedActivity,
      agreedToAudioAnalysis: agreedAudio,
      agreedToVideoAnalysis: agreedVideo,
    });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-[#0a1120] border border-white/15 rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-cyan-500/10 to-violet-500/10 border-b border-white/10 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">🔒</div>
            <div>
              <h2 className="text-white font-bold text-lg">Privacy, Health Data & Intended Use</h2>
              <p className="text-white/50 text-xs">Required before entering health-related or highly personal information</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5">
          {step === "intro" ? (
            <>
              <p className="text-white/70 text-sm leading-relaxed mb-4">
                Doctor Buddy's public edition is a <strong className="text-white">wellness, reflection, education and care-preparation tool</strong>.
                It is not a doctor, therapist, psychiatrist, medical service, emergency service, or substitute for licensed care.
              </p>
              <div className="space-y-3 mb-5">
                {[
                  ["🧠", "Communication styles", "Friend Zone, Therapist Zone and Psychiatrist Zone change tone and structure only. They do not turn the software into a licensed professional."],
                  ["🩺", "No diagnosis or prescribing", "The public edition does not diagnose conditions, prescribe treatment, choose medication, or give individualized dosing, tapering, start or stop instructions."],
                  ["🔐", "Health-data privacy", "We do not sell health data or use health-related activity for targeted advertising. Sensitive tools require your consent before collection."],
                  ["🗑️", "Your control", "You can request/export your information and delete consumer health data from account settings. Ephemeral support is the default where available."],
                ].map(([icon, title, desc]) => (
                  <div key={title} className="flex gap-3 bg-white/[0.03] rounded-lg p-3">
                    <span>{icon}</span>
                    <div><p className="text-white/85 text-xs font-semibold mb-0.5">{title}</p><p className="text-white/50 text-xs leading-relaxed">{desc}</p></div>
                  </div>
                ))}
              </div>
              <div className="text-[11px] text-white/45 leading-relaxed mb-4">
                Read: <Link href="/terms" className="text-cyan-300 underline">Terms</Link>, {" "}
                <Link href="/health-data-privacy" className="text-cyan-300 underline">Consumer Health Data Privacy Policy</Link>, and {" "}
                <Link href="/medical-disclaimer" className="text-cyan-300 underline">Wellness & Medical Disclaimer</Link>.
              </div>
              <button onClick={() => setStep("form")} className="w-full py-3 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-semibold text-sm hover:bg-cyan-500/30 transition-all">
                Review acknowledgements →
              </button>
            </>
          ) : (
            <>
              <p className="text-white/60 text-xs mb-4">We intentionally do not ask for a legal name or email just to record this acknowledgement.</p>
              <div className="space-y-3 mb-4">
                {[
                  { id: "adult", label: "I confirm I am at least 18 years old.", required: true, checked: isAdult, onChange: setIsAdult },
                  { id: "terms", label: "I agree to the Terms of Use, acknowledge the Privacy Policy, and agree to the Subscription Terms if I purchase a plan.", required: true, checked: agreedTerms, onChange: setAgreedTerms },
                  { id: "health", label: "I consent to Doctor Buddy collecting and using the health-related information I choose to enter and, when necessary to provide a feature I request, sending the minimum necessary information to the service providers identified in the Consumer Health Data Privacy Policy (including the configured AI processor for AI features).", required: true, checked: agreedHealthData, onChange: setAgreedHealthData },
                  { id: "boundary", label: "I understand Doctor Buddy is a wellness/support product and the Friend, Therapist and Psychiatrist Zones are communication styles only—not licensed care, diagnosis, psychotherapy, psychiatry, or prescribing.", required: true, checked: agreedWellnessBoundary, onChange: setAgreedWellnessBoundary },
                  { id: "activity", label: "Optional: I allow product-usage logging that excludes the content of my health reflections and support messages.", required: false, checked: agreedActivity, onChange: setAgreedActivity },
                  { id: "audio", label: "Optional: in the Companion, I agree that my voice may be analysed in real time (tone and energy, in my browser) so the companion can notice how I sound, not only what I say. No audio recording is stored.", required: false, checked: agreedAudio, onChange: setAgreedAudio },
                  { id: "video", label: "Optional: in the Companion, I agree that my camera may be analysed in real time (posture and expression). A frame is sent to the configured AI processor about every twenty seconds and is not stored; only a short text description is kept for the session. I can turn this off at any time.", required: false, checked: agreedVideo, onChange: setAgreedVideo },
                ].map(item => (
                  <label key={item.id} className="flex items-start gap-3 cursor-pointer group">
                    <input type="checkbox" checked={item.checked} onChange={e => item.onChange(e.target.checked)} className="mt-0.5 accent-cyan-400" />
                    <span className="text-xs text-white/65 leading-relaxed">{item.label}{item.required && <span className="text-red-400 ml-1">*</span>}</span>
                  </label>
                ))}
              </div>
              {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-xs text-red-300 mb-3">{error}</div>}
              <div className="flex gap-2">
                <button onClick={() => setStep("intro")} className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/55 text-sm">← Back</button>
                <button onClick={handleSubmit} disabled={signMutation.isPending} className="flex-[2] py-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-semibold text-sm disabled:opacity-50">
                  {signMutation.isPending ? "Saving…" : "Agree & Continue →"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
