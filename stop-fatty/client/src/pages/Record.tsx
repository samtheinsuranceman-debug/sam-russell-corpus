import { useState, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { VoiceInput } from "@/components/VoiceInput";
import { trpc } from "@/lib/trpc";
import { useLocation, useParams } from "wouter";
import { getLoginUrl } from "@/const";
import { Mic, Square, ArrowLeft, CheckCircle, AlertTriangle, Trophy } from "lucide-react";
import { toast } from "sonner";

function getSupportedMimeType() {
  if (typeof MediaRecorder === "undefined") return "";
  const types = ["audio/webm", "audio/webm;codecs=opus", "audio/mp4", "audio/ogg", "audio/wav", ""];
  for (const type of types) {
    if (type === "" || MediaRecorder.isTypeSupported(type)) return type;
  }
  return "";
}

export default function Record() {
  const { type } = useParams<{ type: string }>();
  const recordingType = type === "victory" ? "victory" : "failure";
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [metadata, setMetadata] = useState({
    howTheyFeel: "",
    whatTheySaid: "",
    futureOutlook: "",
    prideDescription: "",
    reinforcement: "",
  });
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const uploadMutation = trpc.recordings.upload.useMutation();

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

  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error("Your browser doesn't support audio recording.");
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

      mediaRecorder.onstop = () => {
        const recordedType = mediaRecorder.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: recordedType });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.info("Recording... Speak now.");
    } catch (err) {
      toast.error("Microphone access denied. Please allow microphone permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSubmit = async () => {
    if (!audioBlob) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(",")[1];
      await uploadMutation.mutateAsync({
        type: recordingType,
        audioBase64: base64,
        duration: Math.round(audioBlob.size / 1000),
        ...(recordingType === "failure" ? {
          howTheyFeel: metadata.howTheyFeel,
          whatTheySaid: metadata.whatTheySaid,
          futureOutlook: metadata.futureOutlook,
        } : {
          prideDescription: metadata.prideDescription,
          reinforcement: metadata.reinforcement,
        }),
      });
      toast.success("Recording saved!");
      navigate("/dashboard");
    };
    reader.readAsDataURL(audioBlob);
  };

  const isFailure = recordingType === "failure";

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-lg mx-auto">
        <Button variant="ghost" className="mb-6" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Button>

        <Card className="bg-card border-border">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              {isFailure ? (
                <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
              ) : (
                <Trophy className="w-12 h-12 text-primary mx-auto mb-4" />
              )}
              <h2 className="text-2xl font-bold mb-2">
                {isFailure ? "Record Your Failure" : "Record Your Victory"}
              </h2>
              <p className="text-muted-foreground text-sm">
                {isFailure
                  ? "Be honest. Describe how you feel right now. This recording will play back next time you're tempted."
                  : "Celebrate! Capture this feeling of pride. This is who you're becoming."
                }
              </p>
              <p className="text-foreground text-sm mt-4 bg-secondary/50 rounded-lg p-3 border border-border">
                What did you <span className="font-bold">see</span>, <span className="font-bold">say/hear</span> &amp; <span className="font-bold">feel</span> right before you made the decision?
              </p>
            </div>

            {/* Recording Controls */}
            <div className="flex flex-col items-center gap-4 mb-8">
              {!audioUrl ? (
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 ${
                    isRecording
                      ? "bg-destructive animate-pulse"
                      : isFailure
                        ? "bg-destructive/20 hover:bg-destructive/30 border-2 border-destructive"
                        : "bg-primary/20 hover:bg-primary/30 border-2 border-primary"
                  }`}
                >
                  {isRecording ? (
                    <Square className="w-8 h-8 text-white" />
                  ) : (
                    <Mic className={`w-8 h-8 ${isFailure ? "text-destructive" : "text-primary"}`} />
                  )}
                </button>
              ) : (
                <div className="w-full">
                  <audio src={audioUrl} controls className="w-full mb-4" />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => { setAudioBlob(null); setAudioUrl(null); }}
                  >
                    Re-record
                  </Button>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {isRecording ? "Recording... Tap to stop" : audioUrl ? "Review your recording" : "Tap to start recording"}
              </p>
            </div>

            {/* Metadata Fields - ALL with Voice Input */}
            {audioUrl && (
              <div className="space-y-4 mb-6">
                {isFailure ? (
                  <>
                    <VoiceInput
                      label="How do you feel right now?"
                      value={metadata.howTheyFeel}
                      onChange={(val) => setMetadata(m => ({ ...m, howTheyFeel: val }))}
                      placeholder="Terrible, disappointed, angry at myself..."
                      minHeight="60px"
                    />
                    <VoiceInput
                      label="What did you say to yourself before giving in?"
                      value={metadata.whatTheySaid}
                      onChange={(val) => setMetadata(m => ({ ...m, whatTheySaid: val }))}
                      placeholder="'Just this once' or 'I deserve it'..."
                      minHeight="60px"
                    />
                    <VoiceInput
                      label="What does your future look like if you keep doing this?"
                      value={metadata.futureOutlook}
                      onChange={(val) => setMetadata(m => ({ ...m, futureOutlook: val }))}
                      placeholder="Heavier, less energy, clothes don't fit..."
                      minHeight="60px"
                    />
                  </>
                ) : (
                  <>
                    <VoiceInput
                      label="What are you proud of?"
                      value={metadata.prideDescription}
                      onChange={(val) => setMetadata(m => ({ ...m, prideDescription: val }))}
                      placeholder="I walked past the vending machine, I chose water..."
                      minHeight="60px"
                    />
                    <VoiceInput
                      label="Why did you make this choice?"
                      value={metadata.reinforcement}
                      onChange={(val) => setMetadata(m => ({ ...m, reinforcement: val }))}
                      placeholder="Because I want to be healthy for my family..."
                      minHeight="60px"
                    />
                  </>
                )}
              </div>
            )}

            {/* Submit */}
            {audioUrl && (
              <Button
                className="w-full py-6 text-lg font-semibold"
                onClick={handleSubmit}
                disabled={uploadMutation.isPending}
              >
                {uploadMutation.isPending ? "Saving..." : (
                  <>Save Recording <CheckCircle className="w-5 h-5 ml-2" /></>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
