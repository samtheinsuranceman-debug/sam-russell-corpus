import { useState, useRef, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface VoiceInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  minHeight?: string;
  label?: string;
}

function getSupportedMimeType() {
  if (typeof MediaRecorder === "undefined") return "";
  const types = ["audio/webm", "audio/webm;codecs=opus", "audio/mp4", "audio/ogg", "audio/wav", ""];
  for (const type of types) {
    if (type === "" || MediaRecorder.isTypeSupported(type)) return type;
  }
  return "";
}

export function VoiceInput({ value, onChange, placeholder, minHeight = "80px", label }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

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
      {label && (
        <label className="block text-sm font-medium mb-1 text-foreground">{label}</label>
      )}
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "Tap the mic to speak, or type here..."}
        style={{ minHeight }}
        className="bg-input border-border"
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
            Speak
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
