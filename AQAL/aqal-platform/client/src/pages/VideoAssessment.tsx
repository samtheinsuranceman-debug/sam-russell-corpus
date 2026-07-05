import { useState, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PublicHeader, PublicFooter } from "@/components/PublicLayout";
import { toast } from "sonner";
import { useLocation } from "wouter";

// ============================================================
// VIDEO ASSESSMENT — Platinum-tier multimodal analysis
// Body language, eye-accessing cues, behavioral fusion
// ============================================================

// Eye pattern position labels
const EYE_POSITIONS = [
  { key: "visualConstruct", label: "Visual Construct", position: "Up-Left", desc: "Creating new images" },
  { key: "visualRecall", label: "Visual Recall", position: "Up-Right", desc: "Remembering images" },
  { key: "auditoryConstruct", label: "Auditory Construct", position: "Level-Left", desc: "Creating sounds/words" },
  { key: "auditoryRecall", label: "Auditory Recall", position: "Level-Right", desc: "Remembering sounds" },
  { key: "kinesthetic", label: "Kinesthetic", position: "Down-Right", desc: "Accessing feelings" },
  { key: "internalDialogue", label: "Internal Dialogue", position: "Down-Left", desc: "Self-talk" },
];

// Body language metric labels
const BODY_METRICS = [
  { key: "openness", label: "Openness", desc: "Posture and gestural openness" },
  { key: "confidence", label: "Confidence", desc: "Self-assurance through posture and voice" },
  { key: "engagement", label: "Engagement", desc: "Active involvement in conversation" },
  { key: "dominance", label: "Dominance", desc: "Power dynamics and space-taking" },
  { key: "nervousness", label: "Nervousness", desc: "Self-soothing and fidgeting" },
  { key: "congruence", label: "Congruence", desc: "Body-word alignment" },
];

export default function VideoAssessment() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"record" | "results">("record");
  const [recording, setRecording] = useState(false);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [currentAssessmentId, setCurrentAssessmentId] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Fetch existing video assessments
  const videoList = trpc.video.list.useQuery(undefined, { enabled: !!user });
  const currentResult = trpc.video.get.useQuery(
    { id: currentAssessmentId! },
    { enabled: !!currentAssessmentId, refetchInterval: (query) => (query.state.data as any)?.status === "processing" ? 5000 : false }
  );

  const startAnalysis = trpc.video.startAnalysis.useMutation({
    onSuccess: (data) => {
      setCurrentAssessmentId(data.id);
      setActiveTab("results");
      toast.success("Analysis started! Results will appear shortly.");
    },
    onError: (e) => {
      toast.error(e.message);
      setProcessing(false);
    },
  });

  // Check access
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <PublicHeader />
        <div className="pt-32 text-center">
          <p className="text-muted-foreground">Please sign in to access video assessment.</p>
        </div>
        <PublicFooter />
      </div>
    );
  }

  if (user.membershipTier !== "platinum" && user.role !== "admin") {
    return (
      <div className="min-h-screen bg-background">
        <PublicHeader />
        <div className="pt-32 text-center max-w-lg mx-auto px-4">
          <div className="text-5xl mb-4">🎥</div>
          <h1 className="text-2xl font-display text-foreground mb-3">Platinum Tier Required</h1>
          <p className="text-muted-foreground mb-6">
            Video assessment with body language analysis, eye-accessing cue mapping, and full behavioral profiling
            is available exclusively to Platinum Diamond members.
          </p>
          <Button onClick={() => navigate("/pricing")} className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black">
            View Pricing
          </Button>
        </div>
        <PublicFooter />
      </div>
    );
  }

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm" });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        setVideoBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
        if (videoRef.current) {
          videoRef.current.srcObject = null;
          videoRef.current.src = URL.createObjectURL(blob);
        }
      };

      mediaRecorder.start(1000);
      setRecording(true);
      toast.info("Recording started. Speak naturally for 2-5 minutes.");
    } catch (err: any) {
      toast.error("Camera access denied. Please allow camera and microphone access.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const uploadVideo = trpc.video.upload.useMutation({
    onError: (e) => {
      toast.error(`Upload failed: ${e.message}`);
      setProcessing(false);
    },
  });

  const submitForAnalysis = async () => {
    if (!videoBlob) return;
    setProcessing(true);

    try {
      // Convert blob to base64 for upload via tRPC
      const arrayBuffer = await videoBlob.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
      );

      // Upload to S3 via the video.upload mutation
      const { url, key } = await uploadVideo.mutateAsync({
        videoBase64: base64,
        mimeType: "video/webm",
        filename: `video-${Date.now()}.webm`,
      });

      // Start analysis with the real storage URL
      startAnalysis.mutate({
        videoUrl: url,
        videoKey: key,
        durationMs: Math.round(videoBlob.size / 1000),
      });
    } catch (err: any) {
      toast.error("Failed to upload video");
      setProcessing(false);
    }
  };

  const result = currentResult.data as any;

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <p className="font-mono text-[11px] tracking-[0.28em] uppercase text-accent mb-2">Platinum Diamond</p>
            <h1 className="text-3xl font-display text-foreground mb-2">Video Assessment</h1>
            <p className="text-muted-foreground max-w-2xl">
              Full multimodal analysis: body language patterns, NLP eye-accessing cues, and behavioral fusion
              across 200+ markers. Record a 2-5 minute conversation for comprehensive profiling.
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 mb-8 border-b border-border pb-3">
            <button
              onClick={() => setActiveTab("record")}
              className={`font-mono text-[11px] tracking-[0.1em] uppercase px-4 py-2 rounded transition-colors cursor-pointer ${activeTab === "record" ? "bg-accent/10 text-accent" : "text-muted-foreground hover:text-foreground"}`}
            >
              Record
            </button>
            <button
              onClick={() => setActiveTab("results")}
              className={`font-mono text-[11px] tracking-[0.1em] uppercase px-4 py-2 rounded transition-colors cursor-pointer ${activeTab === "results" ? "bg-accent/10 text-accent" : "text-muted-foreground hover:text-foreground"}`}
            >
              Results
            </button>
            {videoList.data && videoList.data.length > 0 && (
              <span className="font-mono text-[10px] text-muted-foreground self-center ml-auto">
                {videoList.data.length} assessment{videoList.data.length > 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Record Tab */}
          {activeTab === "record" && (
            <div className="grid md:grid-cols-2 gap-8">
              {/* Video Preview */}
              <div>
                <div className="aspect-video bg-secondary border border-border rounded-lg overflow-hidden relative">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    muted={recording}
                    controls={!recording && !!videoBlob}
                  />
                  {!recording && !videoBlob && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-full border-2 border-accent/40 grid place-items-center mx-auto mb-3">
                          <svg className="w-6 h-6 text-accent" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
                          </svg>
                        </div>
                        <p className="text-[12px] text-muted-foreground">Camera preview will appear here</p>
                      </div>
                    </div>
                  )}
                  {recording && (
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                      <span className="font-mono text-[10px] text-red-400 tracking-wider">RECORDING</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-4">
                  {!recording && !videoBlob && (
                    <Button onClick={startRecording} className="flex-1 bg-accent text-black hover:bg-accent/90">
                      Start Recording
                    </Button>
                  )}
                  {recording && (
                    <Button onClick={stopRecording} variant="destructive" className="flex-1">
                      Stop Recording
                    </Button>
                  )}
                  {videoBlob && !processing && (
                    <>
                      <Button onClick={submitForAnalysis} className="flex-1 bg-accent text-black hover:bg-accent/90">
                        Submit for Analysis
                      </Button>
                      <Button onClick={() => { setVideoBlob(null); if (videoRef.current) videoRef.current.src = ""; }} variant="outline" className="border-border">
                        Re-record
                      </Button>
                    </>
                  )}
                  {processing && (
                    <Button disabled className="flex-1">
                      <span className="animate-pulse">Processing...</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-4">
                <Card className="p-5 bg-secondary border-border">
                  <h3 className="font-mono text-[11px] tracking-[0.15em] uppercase text-accent mb-3">Recording Guidelines</h3>
                  <ul className="space-y-2 text-[13px] text-muted-foreground">
                    <li className="flex gap-2"><span className="text-accent">1.</span> Ensure good lighting on your face</li>
                    <li className="flex gap-2"><span className="text-accent">2.</span> Position camera at eye level</li>
                    <li className="flex gap-2"><span className="text-accent">3.</span> Speak naturally for 2-5 minutes</li>
                    <li className="flex gap-2"><span className="text-accent">4.</span> Discuss a topic you're passionate about</li>
                    <li className="flex gap-2"><span className="text-accent">5.</span> Include moments of reflection (pauses)</li>
                  </ul>
                </Card>

                <Card className="p-5 bg-secondary border-border">
                  <h3 className="font-mono text-[11px] tracking-[0.15em] uppercase text-accent mb-3">What We Analyze</h3>
                  <div className="space-y-3 text-[13px] text-muted-foreground">
                    <div>
                      <span className="text-foreground font-medium">Body Language</span>
                      <p className="mt-0.5">Posture, gestures, micro-expressions, and movement patterns</p>
                    </div>
                    <div>
                      <span className="text-foreground font-medium">Eye-Accessing Cues</span>
                      <p className="mt-0.5">NLP eye movement patterns revealing internal processing strategies</p>
                    </div>
                    <div>
                      <span className="text-foreground font-medium">Behavioral Fusion</span>
                      <p className="mt-0.5">200+ markers combining visual, auditory, and kinesthetic signals</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* Results Tab */}
          {activeTab === "results" && (
            <div>
              {/* Processing state */}
              {result?.status === "processing" && (
                <Card className="p-8 bg-secondary border-border text-center">
                  <div className="animate-pulse mb-4">
                    <div className="w-16 h-16 rounded-full border-2 border-accent/40 grid place-items-center mx-auto">
                      <svg className="w-6 h-6 text-accent animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-lg text-foreground mb-2">Analyzing Your Video</h3>
                  <p className="text-muted-foreground text-sm">
                    Our AI is processing body language, eye patterns, and behavioral markers.
                    This typically takes 30-60 seconds.
                  </p>
                </Card>
              )}

              {/* Completed results */}
              {result?.status === "complete" && (
                <div className="space-y-8">
                  {/* Body Language Panel */}
                  <section>
                    <h2 className="font-display text-xl text-foreground mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-accent" />
                      Body Language Analysis
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {BODY_METRICS.map((metric) => {
                        const value = (result.bodyLanguage as any)?.[metric.key] ?? 0;
                        return (
                          <Card key={metric.key} className="p-4 bg-secondary border-border">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[12px] text-foreground font-medium">{metric.label}</span>
                              <span className="font-mono text-[11px] text-accent">{Math.round(value * 100)}%</span>
                            </div>
                            <div className="h-1.5 bg-background rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${value * 100}%`, backgroundColor: "var(--accent)" }}
                              />
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1.5">{metric.desc}</p>
                          </Card>
                        );
                      })}
                    </div>

                    {/* Gesture Patterns */}
                    {result.gesturePatterns && (result.gesturePatterns as any[]).length > 0 && (
                      <div className="mt-4">
                        <h3 className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-2">Gesture Patterns</h3>
                        <div className="flex flex-wrap gap-2">
                          {(result.gesturePatterns as any[]).map((g: any, i: number) => (
                            <span key={i} className="font-mono text-[10px] text-muted-foreground bg-background border border-border rounded px-2.5 py-1">
                              {String(g.type)} ({String(g.frequency)})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </section>

                  {/* Eye-Accessing Cues Panel */}
                  <section>
                    <h2 className="font-display text-xl text-foreground mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#7B9EA8]" />
                      Eye-Accessing Cue Map
                    </h2>

                    {/* Eye diagram */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <Card className="p-6 bg-secondary border-border">
                        <div className="relative w-full aspect-square max-w-[280px] mx-auto">
                          {/* Central eye icon */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full border-2 border-accent/30 grid place-items-center">
                              <span className="text-lg">👁️</span>
                            </div>
                          </div>
                          {/* Position labels around the eye */}
                          {EYE_POSITIONS.map((pos, i) => {
                            const value = (result.eyePatterns as any)?.[pos.key] ?? 0;
                            const positions = [
                              "top-0 left-0", "top-0 right-0",
                              "top-1/2 -translate-y-1/2 left-0", "top-1/2 -translate-y-1/2 right-0",
                              "bottom-0 right-0", "bottom-0 left-0",
                            ];
                            return (
                              <div key={pos.key} className={`absolute ${positions[i]} w-[45%] text-center`}>
                                <div className="font-mono text-[10px] text-foreground">{pos.label}</div>
                                <div className="font-mono text-[18px] text-accent">{value}%</div>
                                <div className="font-mono text-[8px] text-muted-foreground">{pos.position}</div>
                              </div>
                            );
                          })}
                        </div>
                      </Card>

                      <div className="space-y-4">
                        <Card className="p-4 bg-secondary border-border">
                          <h4 className="font-mono text-[10px] tracking-[0.12em] uppercase text-muted-foreground mb-1">Dominant Pattern</h4>
                          <p className="text-foreground font-medium capitalize">
                            {(result.dominantAccessPattern || "unknown").replace(/_/g, " ")}
                          </p>
                        </Card>
                        <Card className="p-4 bg-secondary border-border">
                          <h4 className="font-mono text-[10px] tracking-[0.12em] uppercase text-muted-foreground mb-1">Lead System</h4>
                          <p className="text-foreground font-medium capitalize">
                            {result.leadSystem || "unknown"}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-1">
                            The first eye movement before speaking — reveals primary processing entry point.
                          </p>
                        </Card>

                        {/* Eye movement sequences */}
                        {result.eyeMovementSequences && (result.eyeMovementSequences as any[]).length > 0 && (
                          <Card className="p-4 bg-secondary border-border">
                            <h4 className="font-mono text-[10px] tracking-[0.12em] uppercase text-muted-foreground mb-2">Key Sequences</h4>
                            <div className="space-y-2">
                              {(result.eyeMovementSequences as any[]).slice(0, 3).map((seq: any, i: number) => (
                                <div key={i} className="text-[11px]">
                                  <div className="flex gap-1 mb-0.5">
                                    {(seq.sequence || []).map((s: string, j: number) => (
                                      <span key={j} className="font-mono text-[9px] bg-accent/10 text-accent px-1.5 py-0.5 rounded">{String(s)}</span>
                                    ))}
                                  </div>
                                  <p className="text-muted-foreground">{String(seq.interpretation)}</p>
                                </div>
                              ))}
                            </div>
                          </Card>
                        )}
                      </div>
                    </div>
                  </section>

                  {/* Behavioral Fusion Panel */}
                  <section>
                    <h2 className="font-display text-xl text-foreground mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#9FB98C]" />
                      Behavioral Fusion Profile
                    </h2>

                    <div className="grid md:grid-cols-3 gap-4">
                      {/* Congruence Score */}
                      <Card className="p-5 bg-secondary border-border text-center">
                        <div className="font-display text-[36px] text-accent">
                          {Math.round((result.congruenceScore ?? 0) * 100)}%
                        </div>
                        <p className="font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground">Congruence Score</p>
                        <p className="text-[11px] text-muted-foreground mt-2">
                          Alignment between verbal content, tone, and body language
                        </p>
                      </Card>

                      {/* Behavioral Profile Summary */}
                      {result.behavioralProfile && (
                        <>
                          <Card className="p-5 bg-secondary border-border">
                            <h4 className="font-mono text-[10px] tracking-[0.12em] uppercase text-muted-foreground mb-3">Communication</h4>
                            <div className="space-y-2">
                              <MetricBar label="Directness" value={(result.behavioralProfile as any)?.communicationStyle?.directness} />
                              <MetricBar label="Abstraction" value={(result.behavioralProfile as any)?.communicationStyle?.abstractionLevel} />
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-2">
                              Sensory: {(result.behavioralProfile as any)?.communicationStyle?.sensoryLanguage || "mixed"}
                            </p>
                          </Card>

                          <Card className="p-5 bg-secondary border-border">
                            <h4 className="font-mono text-[10px] tracking-[0.12em] uppercase text-muted-foreground mb-3">Decision Making</h4>
                            <div className="space-y-2">
                              <MetricBar label="Toward/Away" value={(result.behavioralProfile as any)?.decisionMaking?.towardAway} />
                              <MetricBar label="Options/Procedures" value={(result.behavioralProfile as any)?.decisionMaking?.optionsProcedures} />
                              <MetricBar label="Internal/External" value={(result.behavioralProfile as any)?.decisionMaking?.internalExternal} />
                            </div>
                          </Card>
                        </>
                      )}
                    </div>

                    {/* Authenticity Markers */}
                    {result.authenticityMarkers && (result.authenticityMarkers as any[]).length > 0 && (
                      <div className="mt-4">
                        <h3 className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-2">Authenticity Markers</h3>
                        <div className="grid md:grid-cols-2 gap-3">
                          {(result.authenticityMarkers as any[]).slice(0, 4).map((m: any, i: number) => (
                            <Card key={i} className="p-3 bg-secondary border-border">
                              <div className="flex items-center justify-between">
                                <span className="text-[12px] text-foreground">{String(m.marker)}</span>
                                <span className="font-mono text-[10px] text-accent">{Math.round((m.confidence || 0) * 100)}%</span>
                              </div>
                              <p className="text-[10px] text-muted-foreground mt-1">{String(m.evidence)}</p>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Axis Adjustments */}
                    {result.axisAdjustments && (result.axisAdjustments as any[]).length > 0 && (
                      <div className="mt-4">
                        <h3 className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-2">Profile Adjustments Suggested</h3>
                        <div className="flex flex-wrap gap-2">
                          {(result.axisAdjustments as any[]).map((adj: any, i: number) => (
                            <span key={i} className="font-mono text-[10px] bg-background border border-border rounded px-2.5 py-1.5">
                              Axis {String(adj.axisIndex)}: {adj.adjustment > 0 ? "+" : ""}{String(adj.adjustment)} — {String(adj.reason)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Marker count */}
                    <div className="mt-6 flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#9FB98C]" style={{ boxShadow: "0 0 6px #9FB98C" }} />
                      {(result.behavioralProfile as any)?.markerCount || 200}+ behavioral markers analyzed across all modalities
                    </div>
                  </section>
                </div>
              )}

              {/* Failed state */}
              {result?.status === "failed" && (
                <Card className="p-8 bg-secondary border-border text-center">
                  <div className="text-3xl mb-3">⚠️</div>
                  <h3 className="text-lg text-foreground mb-2">Analysis Failed</h3>
                  <p className="text-muted-foreground text-sm mb-4">{result.errorMessage || "An unexpected error occurred."}</p>
                  <Button onClick={() => setActiveTab("record")} variant="outline">Try Again</Button>
                </Card>
              )}

              {/* No results yet */}
              {!result && !currentAssessmentId && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No video assessments yet. Record a video to get started.</p>
                  <Button onClick={() => setActiveTab("record")} className="mt-4" variant="outline">
                    Go to Recording
                  </Button>
                </div>
              )}

              {/* Previous assessments */}
              {videoList.data && videoList.data.length > 0 && (
                <div className="mt-8">
                  <h3 className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-3">Previous Assessments</h3>
                  <div className="space-y-2">
                    {videoList.data.map((v: any) => (
                      <button
                        key={v.id}
                        onClick={() => setCurrentAssessmentId(v.id)}
                        className={`w-full text-left p-3 rounded border transition-colors cursor-pointer ${currentAssessmentId === v.id ? "bg-accent/10 border-accent/40" : "bg-secondary border-border hover:border-accent/20"}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[12px] text-foreground">
                            Assessment #{v.id}
                          </span>
                          <span className={`font-mono text-[10px] px-2 py-0.5 rounded ${v.status === "complete" ? "bg-green-500/10 text-green-400" : v.status === "processing" ? "bg-amber-500/10 text-amber-400" : "bg-red-500/10 text-red-400"}`}>
                            {v.status}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {new Date(v.createdAt).toLocaleDateString()}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}

// Helper component for metric bars
function MetricBar({ label, value }: { label: string; value?: number }) {
  const v = value ?? 0.5;
  return (
    <div>
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[10px] text-muted-foreground">{label}</span>
        <span className="font-mono text-[9px] text-accent">{Math.round(v * 100)}%</span>
      </div>
      <div className="h-1 bg-background rounded-full overflow-hidden">
        <div className="h-full rounded-full bg-accent/60" style={{ width: `${v * 100}%` }} />
      </div>
    </div>
  );
}
