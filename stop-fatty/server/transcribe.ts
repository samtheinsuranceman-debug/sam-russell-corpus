import { Express, Request, Response } from "express";
import multer from "multer";
import { storagePut, storageGetSignedUrl } from "./storage";
import { transcribeAudio } from "./_core/voiceTranscription";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 16 * 1024 * 1024 }, // 16MB
});

export function registerTranscribeRoute(app: Express) {
  app.post("/api/transcribe", upload.single("audio"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No audio file provided" });
      }

      // Upload audio to S3
      const key = `transcriptions/${Date.now()}-${Math.random().toString(36).slice(2)}.webm`;
      const { key: storedKey } = await storagePut(key, req.file.buffer, req.file.mimetype || "audio/webm");

      // Get a signed URL for the transcription service to access
      const signedUrl = await storageGetSignedUrl(storedKey);

      // Transcribe
      const result = await transcribeAudio({
        audioUrl: signedUrl,
        language: "en",
        prompt: "Transcribe the user's spoken response about their eating habits and decision-making patterns.",
      });

      if ("error" in result) {
        return res.status(500).json({ error: result.error, details: result.details });
      }

      return res.json({ text: result.text, language: result.language });
    } catch (err) {
      console.error("[Transcribe] Error:", err);
      return res.status(500).json({ error: "Transcription failed" });
    }
  });
}
