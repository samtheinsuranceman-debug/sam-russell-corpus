import { useState, useCallback, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Eye, Ear, Hand, ArrowRight, ArrowLeft, CheckCircle, Mic, MicOff, Loader2, Camera } from "lucide-react";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";

const steps = [
  {
    id: "intro",
    icon: null,
    title: "Let's Map Your Decision Strategy",
    subtitle: "We're going to uncover the exact internal process your brain runs before you break an eating commitment. This takes 3 minutes and changes everything.\n\nYou can type your answers OR tap the microphone to speak them. Your voice will be transcribed automatically.",
  },
  {
    id: "visual",
    icon: <Eye className="w-8 h-8 text-primary" />,
    title: "Visual — What Do You See?",
    subtitle: "Think about the last time you broke an eating commitment. Right before you gave in...",
    fields: [
      { key: "visualTrigger", label: "What did you SEE that triggered the craving? (The food? A commercial? Someone else eating?)" },
      { key: "visualScene", label: "What movie or slideshow did your brain play? (Imagine yourself eating it? Saw yourself enjoying it?)" },
      { key: "visualFuture", label: "What did your future look like in that moment? (Did you picture consequences, or did the future disappear?)" },
    ],
  },
  {
    id: "auditory",
    icon: <Ear className="w-8 h-8 text-primary" />,
    title: "Auditory — What Do You Say?",
    subtitle: "Your internal voice is the permission-giver. Let's expose it.",
    fields: [
      { key: "auditoryDialog", label: "What did you say to yourself right before you gave in? (\"Just this once\"? \"I deserve this\"? \"I'll start tomorrow\"?)" },
      { key: "auditoryTone", label: "What was the TONE of that voice? (Seductive? Urgent? Dismissive? Whiny?)" },
      { key: "auditoryPermission", label: "What permission phrase did you use to justify it? (The exact words your brain used to say \"it's okay\")" },
    ],
  },
  {
    id: "kinesthetic",
    icon: <Hand className="w-8 h-8 text-primary" />,
    title: "Kinesthetic — What Do You Feel?",
    subtitle: "The feeling is what ultimately drives the action. Let's locate it.",
    fields: [
      { key: "kinestheticFeeling", label: "What feeling did you create before acting? (Excitement? Comfort? Rebellion? Numbness?)" },
      { key: "kinestheticLocation", label: "WHERE in your body did you feel it? (Stomach? Chest? Throat? Hands?)" },
      { key: "kinestheticIntensity", label: "How intense was it on a scale of 1-10, and how fast did it build?" },
    ],
  },
  {
    id: "sequence",
    icon: null,
    title: "Your Full Strategy",
    subtitle: "Now let's connect the dots. Describe the full sequence from trigger to action.",
    fields: [
      { key: "triggerSequence", label: "Describe the full chain: I saw [X], then I said [Y] to myself, which made me feel [Z], and then I [ate/gave in]. Write it as one flowing sentence." },
    ],
  },
  {
    id: "selfie",
    icon: <Camera className="w-8 h-8 text-primary" />,
    title: "Take Your Identity Photo",
    subtitle: "Take a selfie now. We'll use AI to create two versions of you:\n\n👑 Your VICTORY self — glowing, slim, crowned, radiant.\n😔 Your FAILURE self — grey, tired, aged, declining.\n\nYour avatar will change based on your Impulse Control Score. Make good choices, and you'll see yourself as royalty. Fall below the threshold, and you'll see the consequences on your own face.",
  },
];

function VoiceInput({ fieldKey, value, onChange }: { fieldKey: string; value: string; onChange: (val: string) => void }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const getSupportedMimeType = () => {
    const types = ["audio/webm", "audio/webm;codecs=opus", "audio/mp4", "audio/ogg", "audio/wav", ""];
    for (const type of types) {
      if (type === "" || MediaRecorder.isTypeSupported(type)) return type;
    }
    return "";
  };

  const startRecording = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error("Your browser doesn't support audio recording. Please use Chrome, Firefox, or Safari 14.5+.");
      return;
    }
    if (typeof MediaRecorder === "undefined") {
      toast.error("Audio recording is not supported in this browser. Please type your answer instead.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedMimeType();
      const options: MediaRecorderOptions = mimeType ? { mimeType } : {};
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const recordedType = mediaRecorder.mimeType || "audio/webm";
        const ext = recordedType.includes("mp4") ? "m4a" : recordedType.includes("ogg") ? "ogg" : "webm";
        const blob = new Blob(chunksRef.current, { type: recordedType });
        
        if (blob.size < 1000) {
          toast.error("Recording too short. Try again.");
          return;
        }

        setIsTranscribing(true);
        try {
          const formData = new FormData();
          formData.append("audio", blob, `recording.${ext}`);
          const res = await fetch("/api/transcribe", { method: "POST", body: formData });
          if (!res.ok) throw new Error("Transcription failed");
          const data = await res.json();
          if (data.text) {
            const newValue = value ? `${value} ${data.text}` : data.text;
            onChange(newValue);
            toast.success("Voice captured!");
          } else {
            toast.error("Couldn't understand the audio. Try again.");
          }
        } catch (err) {
          toast.error("Transcription failed. Please type your answer instead.");
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.info("Listening... Speak now.");
    } catch (err) {
      toast.error("Microphone access denied. Please allow microphone access in your browser settings.");
    }
  }, [value, onChange]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  return (
    <div className="space-y-2">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Tap the mic to speak, or type here..."
        className="min-h-[80px] bg-input border-border"
      />
      <div className="flex items-center gap-2">
        {isTranscribing ? (
          <Button variant="outline" size="sm" disabled className="gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Transcribing...
          </Button>
        ) : isRecording ? (
          <Button
            variant="destructive"
            size="sm"
            onClick={stopRecording}
            className="gap-2 animate-pulse"
          >
            <MicOff className="w-4 h-4" />
            Stop Recording
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={startRecording}
            className="gap-2 hover:bg-primary/10 hover:border-primary transition-colors"
          >
            <Mic className="w-4 h-4 text-primary" />
            Speak Your Answer
          </Button>
        )}
        {isRecording && (
          <span className="text-xs text-destructive font-medium flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
            Recording...
          </span>
        )}
      </div>
    </div>
  );
}

function SelfieCapture({ onCapture }: { onCapture: (base64: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [captured, setCaptured] = useState<string | null>(null);
  const [inputKey, setInputKey] = useState(0);

  const processImage = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const size = Math.min(img.width, img.height);
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;
        ctx.drawImage(img, sx, sy, size, size, 0, 0, 512, 512);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        const base64 = dataUrl.split(",")[1];
        setCaptured(dataUrl);
        onCapture(base64);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, [onCapture]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImage(file);
    }
  };

  const retake = useCallback(() => {
    setCaptured(null);
    setInputKey(k => k + 1);
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      {captured ? (
        <>
          <div className="w-64 h-64 rounded-2xl overflow-hidden border-4 border-primary shadow-lg">
            <img src={captured} alt="Your selfie" className="w-full h-full object-cover" />
          </div>
          <p className="text-sm text-primary font-medium">Looking good! This is your identity photo.</p>
          <Button variant="outline" size="sm" onClick={retake}>
            <Camera className="w-4 h-4 mr-2" /> Retake
          </Button>
        </>
      ) : (
        <>
          <div className="w-64 h-64 rounded-2xl bg-secondary border-2 border-dashed border-border flex items-center justify-center">
            <Camera className="w-16 h-16 text-muted-foreground/40" />
          </div>
          {/* No capture attribute - iOS will show action sheet: Take Photo or Choose from Library */}
          <label className="inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-6 py-3 text-base font-medium cursor-pointer hover:bg-primary/90 active:scale-95 transition-all">
            <Camera className="w-5 h-5" /> Take or Choose Photo
            <input
              key={inputKey}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="sr-only"
            />
          </label>
          <p className="text-xs text-muted-foreground text-center max-w-xs">
            Your photo stays private and is only used to generate your personal avatars.
          </p>
        </>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

export default function Onboarding() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selfieBase64, setSelfieBase64] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const saveMutation = trpc.calibration.save.useMutation();
  const selfieMutation = trpc.calibration.uploadSelfie.useMutation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  const currentStep = steps[step];
  const isLastStep = step === steps.length - 1;
  const isIntro = step === 0;
  const isSelfieStep = currentStep.id === "selfie";

  const handleNext = async () => {
    if (isLastStep) {
      // Save calibration answers first
      await saveMutation.mutateAsync(answers as any);
      // Upload selfie and generate avatars if captured
      if (selfieBase64) {
        setIsGenerating(true);
        try {
          await selfieMutation.mutateAsync({ imageBase64: selfieBase64 });
          toast.success("Your identity avatars are being generated!");
        } catch (err) {
          toast.error("Avatar generation failed, but your profile is saved. You can retake your photo later.");
        } finally {
          setIsGenerating(false);
        }
      }
      navigate("/dashboard");
    } else {
      setStep(s => s + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(s => s - 1);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="flex gap-1 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                i <= step ? "bg-primary" : "bg-border"
              }`}
            />
          ))}
        </div>

        <Card className="bg-card border-border">
          <CardContent className="p-8">
            {currentStep.icon && (
              <div className="mb-6">{currentStep.icon}</div>
            )}
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">{currentStep.title}</h2>
            <p className="text-muted-foreground mb-8 whitespace-pre-line">{currentStep.subtitle}</p>

            {currentStep.fields && (
              <div className="space-y-6">
                {currentStep.fields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium mb-2 text-foreground">
                      {field.label}
                    </label>
                    <VoiceInput
                      fieldKey={field.key}
                      value={answers[field.key] || ""}
                      onChange={(val) => setAnswers(prev => ({ ...prev, [field.key]: val }))}
                    />
                  </div>
                ))}
              </div>
            )}

            {isSelfieStep && (
              <SelfieCapture onCapture={(base64) => setSelfieBase64(base64)} />
            )}

            <div className="flex justify-between mt-8">
              {step > 0 ? (
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
              ) : (
                <div />
              )}
              <Button
                onClick={handleNext}
                disabled={saveMutation.isPending || isGenerating || (isSelfieStep && !selfieBase64)}
              >
                {isGenerating ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating Avatars...</>
                ) : saveMutation.isPending ? "Saving..." : isLastStep ? (
                  <>Complete <CheckCircle className="w-4 h-4 ml-2" /></>
                ) : isIntro ? (
                  <>Begin Calibration <ArrowRight className="w-4 h-4 ml-2" /></>
                ) : (
                  <>Next <ArrowRight className="w-4 h-4 ml-2" /></>
                )}
              </Button>
            </div>
            {isSelfieStep && !selfieBase64 && (
              <p className="text-xs text-muted-foreground text-center mt-4">
                Take your photo to continue. This is required for the avatar system.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
