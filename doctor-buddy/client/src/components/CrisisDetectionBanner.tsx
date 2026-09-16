/**
 * CrisisDetectionBanner + CrisisInterventionModal
 *
 * Full Crisis Detection & 988 Escalation System
 * Designed by: Grok-3 (strategy) + Claude (safety) + OpenAI (architecture)
 *
 * Tier 1 Emergency → Full-screen modal, 988 call button, nearest ER, grounding exercise
 * Tier 2 High Risk → Full-screen modal with resources + de-escalation
 * Tier 3 Elevated → Collapsible banner with support links
 */
import { useState, useCallback, useEffect, useRef } from "react";
import {
  AlertTriangle, Phone, X, Heart, Shield, ExternalLink,
  ChevronDown, ChevronUp, MapPin, Navigation, Activity,
  Wind, Eye, Hand, Ear, Clock, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useBrain } from "@/contexts/UnifiedDataBus";
import { assessCSSRS } from "@shared/engines/crisisDetection";

// ─── Grok-3 Crisis Keyword Taxonomy (46 keywords, 3 tiers) ───────────────────
const CRISIS_KEYWORDS = {
  tier1_emergency: [
    "kill myself", "end my life", "suicide", "suicidal", "want to die",
    "don't want to live", "no reason to live", "better off dead",
    "planning to hurt myself", "going to hurt myself", "overdose",
    "cut myself", "self-harm", "self harm", "hurting myself",
  ],
  tier2_high_risk: [
    "hopeless", "worthless", "can't go on", "can't take it anymore",
    "nobody cares", "no one would miss me", "disappear forever",
    "give up on life", "nothing left", "no way out", "trapped",
    "burden to everyone", "everyone would be better without me",
    "thinking about death", "death wish",
  ],
  tier3_elevated: [
    "depressed", "desperate", "alone", "empty inside", "numb",
    "can't cope", "falling apart", "breaking down", "lost all hope",
    "exhausted", "unbearable pain", "don't see the point",
    "feel like giving up", "not okay", "struggling badly",
    "dark thoughts",
  ],
};

export type CrisisTier = "tier1_emergency" | "tier2_high_risk" | "tier3_elevated" | null;

// ─── Crisis Detection Engine ──────────────────────────────────────────────────
/**
 * Tiering now runs on the C-SSRS engine (patent 09) rather than flat keyword
 * membership. The three-tier presentation below is kept — it is the right shape
 * for this banner — but the classification behind it changes in two ways that
 * matter:
 *
 *   - The old tier-1 list contained no plan or intent language at all. "I have a
 *     plan" and "I'm going to do it tonight" matched nothing and fell through to
 *     no tier, while the milder "want to die" was tier 1. The most dangerous
 *     disclosures were the ones it missed.
 *   - Tier 3 held words like "alone", "exhausted" and "not okay", which fire on
 *     ordinary conversation. A banner that appears constantly stops being read.
 *
 * C-SSRS levels map onto the existing tiers, so every consumer of this function
 * keeps working:
 *   level 2-5 (active ideation, intent, plan) → tier1_emergency
 *   level 1   (passive: wish to be dead)      → tier2_high_risk
 *   distress language, no ideation            → tier3_elevated
 */
const DISTRESS_LANGUAGE = CRISIS_KEYWORDS.tier2_high_risk.concat(CRISIS_KEYWORDS.tier3_elevated);

export function detectCrisisTier(text: string): { tier: CrisisTier; matchedKeywords: string[] } {
  const lower = text.toLowerCase();
  // One graded detector for both editions: the public wellness edition must
  // not be *less* likely to offer 988 than the clinical edition. Only the copy
  // around the banner differs by edition, never the sensitivity.
  const assessment = assessCSSRS(text);

  if (assessment.level >= 2) {
    return {
      tier: "tier1_emergency",
      // Return the phrases that actually triggered it, so the banner can show a
      // clinician why it fired rather than an opaque keyword.
      matchedKeywords: assessment.triggers.map((t) => t.phrase),
    };
  }

  if (assessment.level === 1) {
    return { tier: "tier2_high_risk", matchedKeywords: assessment.triggers.map((t) => t.phrase) };
  }

  const distress = DISTRESS_LANGUAGE.filter((kw) => lower.includes(kw));
  if (distress.length > 0) return { tier: "tier3_elevated", matchedKeywords: distress };

  return { tier: null, matchedKeywords: [] };
}

// ─── Nearest ER Finder ───────────────────────────────────────────────────────
interface NearbyER {
  name: string;
  address: string;
  distance: string;
  phone?: string;
  placeId?: string;
}

function NearestERFinder() {
  const [ers, setErs] = useState<NearbyER[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const findNearestERs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Get user's location
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
      });
      const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setUserLocation(loc);

      // Use Google Maps Places API to find nearest ERs
      const mapDiv = document.createElement("div");
      const map = new google.maps.Map(mapDiv, { center: loc, zoom: 14 });
      const service = new google.maps.places.PlacesService(map);

      const results = await new Promise<google.maps.places.PlaceResult[]>((resolve, reject) => {
        service.nearbySearch(
          {
            location: loc,
            radius: 16000, // 10 miles
            keyword: "emergency room hospital ER",
            type: "hospital",
          },
          (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results) {
              resolve(results);
            } else {
              reject(new Error("Could not find nearby hospitals"));
            }
          }
        );
      });

      // Calculate distances and sort
      const erList: NearbyER[] = results.slice(0, 5).map((place) => {
        const placeLoc = place.geometry?.location;
        let dist = "Unknown";
        if (placeLoc) {
          const meters = google.maps.geometry.spherical.computeDistanceBetween(
            new google.maps.LatLng(loc.lat, loc.lng),
            placeLoc
          );
          dist = meters < 1609 ? `${(meters / 1609).toFixed(1)} mi` : `${(meters / 1609).toFixed(1)} mi`;
        }
        return {
          name: place.name ?? "Hospital",
          address: place.vicinity ?? "",
          distance: dist,
          phone: place.formatted_phone_number,
          placeId: place.place_id,
        };
      });

      setErs(erList);
    } catch (err: any) {
      if (err?.code === 1) {
        setError("Location access denied. Please enable location services to find nearest ERs.");
      } else {
        setError("Could not determine your location. Please call 911 for the nearest ER.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    findNearestERs();
  }, [findNearestERs]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <MapPin className="h-4 w-4 text-red-400" />
        Nearest Emergency Rooms
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <div className="h-4 w-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
          Finding nearest emergency rooms...
        </div>
      )}

      {error && (
        <div className="text-sm text-yellow-300 bg-yellow-950/40 rounded-lg p-3">
          <p>{error}</p>
          <a href="tel:911" className="mt-2 inline-flex items-center gap-1 text-red-300 font-semibold hover:underline">
            <Phone className="h-3.5 w-3.5" /> Call 911 for emergency assistance
          </a>
        </div>
      )}

      {ers.length > 0 && (
        <div className="space-y-2">
          {ers.map((er, i) => (
            <div key={i} className="flex items-start gap-3 bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors">
              <div className="shrink-0 w-8 h-8 rounded-full bg-red-600/20 flex items-center justify-center text-red-400 text-sm font-bold">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{er.name}</p>
                <p className="text-xs text-gray-400 truncate">{er.address}</p>
              </div>
              <div className="shrink-0 text-right">
                <span className="text-sm font-semibold text-red-300">{er.distance}</span>
                {userLocation && er.placeId && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${encodeURIComponent(er.name + " " + er.address)}&travelmode=driving`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block mt-1"
                  >
                    <Button size="sm" variant="outline" className="h-6 text-xs border-red-700 text-red-300 hover:bg-red-900/50">
                      <Navigation className="h-3 w-3 mr-1" /> Directions
                    </Button>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 5-4-3-2-1 Grounding Exercise ───────────────────────────────────────────
function GroundingExercise({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [breathCount, setBreatheCount] = useState(0);

  const steps = [
    {
      count: 5, sense: "SEE", icon: Eye, color: "text-blue-400",
      instruction: "Look around and name 5 things you can see right now.",
      examples: "A wall, a window, your hands, a light, a door..."
    },
    {
      count: 4, sense: "TOUCH", icon: Hand, color: "text-green-400",
      instruction: "Notice 4 things you can physically feel.",
      examples: "Your feet on the floor, fabric on your skin, air on your face, a surface under your hands..."
    },
    {
      count: 3, sense: "HEAR", icon: Ear, color: "text-purple-400",
      instruction: "Listen for 3 sounds around you.",
      examples: "Traffic, a fan humming, your own breathing..."
    },
    {
      count: 2, sense: "SMELL", icon: Wind, color: "text-yellow-400",
      instruction: "Notice 2 things you can smell.",
      examples: "Fresh air, soap, food, fabric..."
    },
    {
      count: 1, sense: "TASTE", icon: Activity, color: "text-pink-400",
      instruction: "Notice 1 thing you can taste.",
      examples: "The taste in your mouth, a recent drink, toothpaste..."
    },
  ];

  if (step >= steps.length) {
    return (
      <div className="text-center space-y-3 py-4">
        <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto" />
        <h4 className="text-lg font-semibold text-white">Grounding Complete</h4>
        <p className="text-sm text-gray-300">
          Take a few deep breaths. You are here, you are safe, and help is available.
        </p>
        <Button onClick={onComplete} className="bg-green-700 hover:bg-green-600 text-white">
          I'm feeling more grounded
        </Button>
      </div>
    );
  }

  const current = steps[step];
  const Icon = current.icon;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-white flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-400" />
          5-4-3-2-1 Grounding Exercise
        </h4>
        <span className="text-xs text-gray-500">Step {step + 1} of {steps.length}</span>
      </div>

      {/* Progress bar */}
      <div className="flex gap-1">
        {steps.map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-blue-500" : "bg-gray-700"}`} />
        ))}
      </div>

      <div className="bg-white/5 rounded-xl p-5 text-center space-y-3">
        <Icon className={`h-10 w-10 mx-auto ${current.color}`} />
        <div className="text-3xl font-bold text-white">{current.count}</div>
        <div className={`text-sm font-semibold ${current.color}`}>Things you can {current.sense}</div>
        <p className="text-sm text-gray-300">{current.instruction}</p>
        <p className="text-xs text-gray-500 italic">{current.examples}</p>
      </div>

      <div className="flex justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => step > 0 && setStep(step - 1)}
          disabled={step === 0}
          className="border-gray-700 text-gray-300"
        >
          Back
        </Button>
        <Button
          size="sm"
          onClick={() => setStep(step + 1)}
          className="bg-blue-700 hover:bg-blue-600 text-white"
        >
          {step < steps.length - 1 ? "Next →" : "Complete"}
        </Button>
      </div>
    </div>
  );
}

// ─── Full-Screen Crisis Intervention Modal ───────────────────────────────────
interface CrisisModalProps {
  tier: CrisisTier;
  onDismiss?: () => void;
  context?: string;
  matchedKeywords?: string[];
}

/**
 * The full-screen crisis modal.
 *
 * A tier-1 alert must be unmissable. It must not be inescapable. This modal
 * previously rendered its close control only for non-tier-1, so a patient who
 * disclosed daily suicidal ideation mid-intake was locked out of the form with
 * no way forward — and because the intake restores its draft, reloading put
 * them back on the same question and the same wall. The patient at highest risk
 * was the only one who could not finish.
 *
 * Dismissal never erases the disclosure: the crisis event is already logged by
 * the effect above before any of this renders, the escalation stands, and the
 * intake still routes the endorsement to its safety path. Closing the modal
 * only lets the person keep using the product.
 */
function CrisisInterventionModal({ tier, onDismiss, context, matchedKeywords }: CrisisModalProps) {
  const [activeTab, setActiveTab] = useState<"resources" | "grounding" | "er">("resources");
  const [deescalationUsed, setDeescalationUsed] = useState(false);
  const logCrisis = trpc.drBuddy.logCrisisEvent.useMutation();
  const hasLogged = useRef(false);

  useEffect(() => {
    if (!tier || hasLogged.current) return;
    hasLogged.current = true;
    logCrisis.mutate({
      tier,
      triggerSource: context ?? "unknown",
      matchedKeywords: matchedKeywords ?? [],
    });
  }, [tier]);

  if (!tier || tier === "tier3_elevated") return null;

  const isTier1 = tier === "tier1_emergency";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.85)" }}>
      <div
        className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ${
          isTier1 ? "bg-gradient-to-b from-red-950 to-gray-950 border-2 border-red-700" : "bg-gradient-to-b from-orange-950 to-gray-950 border-2 border-orange-700"
        }`}
        style={{ animation: "slideUp 0.4s ease-out" }}
      >
        {/* Header */}
        <div className={`sticky top-0 z-10 px-6 py-5 ${isTier1 ? "bg-red-950/95" : "bg-orange-950/95"} backdrop-blur-sm border-b border-white/10`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${isTier1 ? "bg-red-600 animate-pulse" : "bg-orange-600"}`}>
                {isTier1 ? <AlertTriangle className="h-6 w-6 text-white" /> : <Heart className="h-6 w-6 text-white" />}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {isTier1 ? "Immediate Support Needed" : "We're Here to Help"}
                </h2>
                <p className="text-sm text-gray-300 mt-0.5">
                  {isTier1
                    ? "Your safety is our top priority. Help is available right now."
                    : "It sounds like you're going through a difficult time. You're not alone."}
                </p>
              </div>
            </div>
            {onDismiss && (
              <button
                onClick={onDismiss}
                aria-label="Close"
                className="p-2 text-gray-500 hover:text-gray-300 rounded-lg hover:bg-white/5 shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Emergency Call Buttons */}
        <div className="px-6 py-4 space-y-3">
          <a href="tel:988" className="block">
            <Button className={`w-full h-14 text-lg font-bold ${isTier1 ? "bg-red-600 hover:bg-red-500 animate-pulse" : "bg-orange-600 hover:bg-orange-500"} text-white rounded-xl`}>
              <Phone className="h-5 w-5 mr-2" />
              Call 988 — Suicide & Crisis Lifeline
            </Button>
          </a>
          <div className="grid grid-cols-2 gap-3">
            <a href="sms:741741?body=HOME" className="block">
              <Button variant="outline" className="w-full h-11 border-gray-600 text-gray-200 hover:bg-white/10 rounded-xl">
                <Phone className="h-4 w-4 mr-2" />
                Text HOME to 741741
              </Button>
            </a>
            <a href="tel:911" className="block">
              <Button variant="outline" className="w-full h-11 border-gray-600 text-gray-200 hover:bg-white/10 rounded-xl">
                <Phone className="h-4 w-4 mr-2" />
                Call 911
              </Button>
            </a>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 flex gap-1 border-b border-white/10">
          {[
            { id: "resources" as const, label: "Safety Plan", icon: Shield },
            { id: "grounding" as const, label: "Grounding Exercise", icon: Activity },
            { id: "er" as const, label: "Nearest ER", icon: MapPin },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === "er") {
                  logCrisis.mutate({ tier: tier!, triggerSource: context, nearestErShown: true });
                }
              }}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-white text-white"
                  : "border-transparent text-gray-500 hover:text-gray-300"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="px-6 py-5">
          {activeTab === "resources" && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white">Your Safety Plan</h3>
              <div className="space-y-3">
                {[
                  { step: 1, text: "Call 988 (Suicide & Crisis Lifeline) — available 24/7", urgent: true },
                  { step: 2, text: "Remove access to means of self-harm if possible" },
                  { step: 3, text: "Stay with a trusted person until the crisis passes" },
                  { step: 4, text: "Go to your nearest emergency room if in immediate danger" },
                  { step: 5, text: "Use the grounding exercise (next tab) to help regulate" },
                  { step: 6, text: "Contact a trusted person or licensed professional when able" },
                ].map((item) => (
                  <div key={item.step} className={`flex items-start gap-3 p-3 rounded-lg ${item.urgent ? "bg-red-950/50 border border-red-800/50" : "bg-white/5"}`}>
                    <span className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${item.urgent ? "bg-red-600 text-white" : "bg-gray-700 text-gray-300"}`}>
                      {item.step}
                    </span>
                    <p className={`text-sm ${item.urgent ? "text-red-200 font-medium" : "text-gray-300"}`}>{item.text}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-4 bg-blue-950/30 rounded-lg border border-blue-800/30">
                <h4 className="text-sm font-semibold text-blue-300 mb-2">Additional Resources</h4>
                <div className="space-y-2 text-sm">
                  <a href="https://www.veteranscrisisline.net/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-300 hover:text-white">
                    <ExternalLink className="h-3.5 w-3.5" /> Veterans Crisis Line: 1-800-273-8255 (Press 1)
                  </a>
                  <a href="https://www.thetrevorproject.org/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-300 hover:text-white">
                    <ExternalLink className="h-3.5 w-3.5" /> Trevor Project (LGBTQ+): 1-866-488-7386
                  </a>
                  <a href="https://www.samhsa.gov/find-help/national-helpline" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-300 hover:text-white">
                    <ExternalLink className="h-3.5 w-3.5" /> SAMHSA Helpline: 1-800-662-4357
                  </a>
                  <a href="/crisis" className="flex items-center gap-2 text-gray-300 hover:text-white">
                    <Shield className="h-3.5 w-3.5" /> Full Crisis Resources Page →
                  </a>
                </div>
              </div>
            </div>
          )}

          {activeTab === "grounding" && (
            <GroundingExercise
              onComplete={() => {
                setDeescalationUsed(true);
                logCrisis.mutate({ tier: tier!, triggerSource: context, deescalationUsed: true });
                setActiveTab("resources");
              }}
            />
          )}

          {activeTab === "er" && <NearestERFinder />}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 px-6 py-4 bg-gray-950/95 backdrop-blur-sm border-t border-white/10 space-y-3">
          {onDismiss && (
            <Button
              onClick={onDismiss}
              variant="outline"
              className="w-full border-white/20 text-gray-300 hover:bg-white/5"
            >
              I\u2019ve read this \u2014 continue
            </Button>
          )}
          <p className="text-xs text-gray-500 text-center">
            Doctor Buddy is not a substitute for professional medical care. If you are in immediate danger, call 911.
            {context && <span className="block mt-1 italic">Detected in: {context}</span>}
          </p>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ─── Banner Component (Tier 3 only) ─────────────────────────────────────────
interface CrisisDetectionBannerProps {
  tier: CrisisTier;
  onDismiss?: () => void;
  context?: string;
  matchedKeywords?: string[];
}

export function CrisisDetectionBanner({ tier, onDismiss, context, matchedKeywords }: CrisisDetectionBannerProps) {
  const [expanded, setExpanded] = useState(true);
  const [safetyPlanOpen, setSafetyPlanOpen] = useState(false);

  if (!tier) return null;

  // Tier 1 and Tier 2 → Full-screen modal
  if (tier === "tier1_emergency" || tier === "tier2_high_risk") {
    return <CrisisInterventionModal tier={tier} onDismiss={onDismiss} context={context} matchedKeywords={matchedKeywords} />;
  }

  // Tier 3 → Collapsible banner
  return (
    <div className="relative rounded-xl border p-4 bg-yellow-950/60 border-yellow-700/60 shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-sm text-yellow-300">Elevated Distress Noticed</h3>
            <p className="text-xs text-gray-400 mt-0.5">Support resources are available</p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => setExpanded(!expanded)} className="p-1 text-gray-500 hover:text-gray-300">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {onDismiss && (
            <button onClick={onDismiss} className="p-1 text-gray-500 hover:text-gray-300">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="mt-3 space-y-3">
          <p className="text-xs text-gray-300 leading-relaxed">
            It sounds like you're going through a difficult time. Support is available whenever you need it.
          </p>
          <div className="flex flex-wrap gap-2">
            <a href="tel:988">
              <Button size="sm" className="bg-yellow-700 hover:bg-yellow-600 text-white text-xs h-8">
                <Phone className="h-3.5 w-3.5 mr-1.5" /> 988 Lifeline
              </Button>
            </a>
            <a href="/crisis">
              <Button size="sm" className="bg-gray-700 hover:bg-gray-600 text-white text-xs h-8">
                <Shield className="h-3.5 w-3.5 mr-1.5" /> Crisis Resources
              </Button>
            </a>
          </div>

          <button
            onClick={() => setSafetyPlanOpen(!safetyPlanOpen)}
            className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1"
          >
            {safetyPlanOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {safetyPlanOpen ? "Hide" : "Show"} Safety Tips
          </button>

          {safetyPlanOpen && (
            <div className="space-y-1.5 pl-2 border-l-2 border-gray-700">
              {[
                "Talk to someone you trust about how you're feeling",
                "Consider reaching out to a mental health professional",
                "Practice self-care: sleep, nutrition, gentle movement",
                "Use the Dr. Buddy check-in to track your mood",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-xs text-gray-600 shrink-0 mt-0.5">{i + 1}.</span>
                  <p className="text-xs text-gray-400">{step}</p>
                </div>
              ))}
            </div>
          )}

          {context && <p className="text-xs text-gray-600 italic">Detected in: {context}</p>}
        </div>
      )}
    </div>
  );
}

// ─── Hook: useCrisisDetection ─────────────────────────────────────────────────
export function useCrisisDetection() {
  const [activeTier, setActiveTier] = useState<CrisisTier>(null);
  const [matchedKw, setMatchedKw] = useState<string[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const { report } = useBrain();
  const emitMutation = trpc.drBuddy.emitEvent.useMutation();

  const checkText = useCallback(
    (text: string, context?: string) => {
      const { tier, matchedKeywords } = detectCrisisTier(text);
      if (tier) {
        setActiveTier(tier);
        setMatchedKw(matchedKeywords);
        setDismissed(false);

        // Emit to UnifiedDataBus
        report("crisis_detected", {
          tier,
          matchedKeywords,
          context: context ?? "unknown",
          timestamp: Date.now(),
        });

        // Persist to brain_events
        emitMutation.mutate({
          featureId: "crisis",
          category: "crisis",
          eventType: "crisis_detected",
          payload: { tier, matchedKeywords, context },
        });
      }
      return tier;
    },
    [report, emitMutation]
  );

  const dismiss = useCallback(() => {
    if (activeTier !== "tier1_emergency") {
      setDismissed(true);
    }
  }, [activeTier]);

  const reset = useCallback(() => {
    setActiveTier(null);
    setMatchedKw([]);
    setDismissed(false);
  }, []);

  return {
    activeTier: dismissed ? null : activeTier,
    matchedKeywords: matchedKw,
    checkText,
    dismiss,
    reset,
  };
}
