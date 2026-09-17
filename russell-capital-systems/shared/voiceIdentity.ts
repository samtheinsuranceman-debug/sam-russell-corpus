// ============================================================
// THE SPOKEN VOICE — who Russell Capital Systems sounds like.
//
// The site already had a text-to-speech call. What it did not have was any
// notion of WHOSE voice it was loading: it took whatever id sat in
// ELEVENLABS_VOICE_ID and spoke. That is fine until the id is wrong, at which
// point the firm's advisory answers come out of a stranger in the founder's
// place and nothing anywhere says so.
//
// This file names the intended voice and gives the server a way to check that
// the voice actually loaded is the one intended, by asking the provider for
// the voice's own name and comparing. A mismatch is reported, never hidden.
//
// THE ID IS NOT IN THIS FILE AND MUST NEVER BE. ELEVENLABS_API_KEY and
// ELEVENLABS_VOICE_ID are set by the owner in the host's environment panel
// (Railway → russell-capital-systems → service `web` → Variables). Committing
// either to the repository would publish them. If the owner has not set them,
// the site falls back to the browser's own speech synthesis and says that it
// is doing so, rather than pretending the founder is speaking.
// ============================================================

export type VoiceProvenance = "heygen" | "russell-labs" | "elevenlabs-direct" | "unknown";

export type VoiceIdentity = {
  id: string;
  /** The name a listener would give this voice. Also what we verify against the provider. */
  displayName: string;
  /** Accepted spellings when matching the provider's stored voice name. Case-insensitive. */
  aliases: readonly string[];
  /** Where the clone was produced. Recorded because the two pipelines are tuned differently. */
  provenance: VoiceProvenance;
  /** Which environment variable carries the id. Never the id itself. */
  envKey: string;
  /** What this voice is allowed to say. */
  scope: string;
  settings: VoiceSettings;
};

/**
 * ElevenLabs voice settings. Chosen for an advisory voice rather than a
 * narrative one: high stability so the same sentence does not land differently
 * on two plays, high similarity so it stays recognisably the founder, low
 * style so it does not perform, and speaker boost on because most listening
 * happens on a phone speaker.
 */
export type VoiceSettings = {
  stability: number;
  similarity_boost: number;
  style: number;
  use_speaker_boost: boolean;
};

export const ADVISORY_VOICE_SETTINGS: VoiceSettings = {
  stability: 0.62,
  similarity_boost: 0.85,
  style: 0.15,
  use_speaker_boost: true,
};

/** Slightly looser for the homepage manifesto, which is a speech rather than an answer. */
export const MANIFESTO_VOICE_SETTINGS: VoiceSettings = {
  stability: 0.5,
  similarity_boost: 0.85,
  style: 0.35,
  use_speaker_boost: true,
};

export const MODEL_ID = "eleven_multilingual_v2";

export const FOUNDER_VOICE: VoiceIdentity = {
  id: "samuel-andrew-russell-v",
  displayName: "Samuel Andrew Russell V",
  aliases: [
    "samuel andrew russell v",
    "samuel andrew russell",
    "samuel a russell v",
    "samuel a. russell v",
    "sam russell",
    "samuel russell",
  ],
  provenance: "heygen",
  envKey: "ELEVENLABS_VOICE_ID",
  scope:
    "Everything the site says aloud to a person: the advisor's answers, the tape-recorder deck, " +
    "the librarian read back, and the founder's homepage message. Never a claim the text did not " +
    "already make — the voice reads what the language layer wrote, and adds nothing.",
  settings: ADVISORY_VOICE_SETTINGS,
};

export const VOICES: readonly VoiceIdentity[] = [FOUNDER_VOICE];

export function voice(id: string): VoiceIdentity | undefined {
  return VOICES.find((v) => v.id === id);
}

/** Does a name returned by the provider match the voice we intended to load? */
export function nameMatches(identity: VoiceIdentity, providerName: string | null | undefined): boolean {
  if (!providerName) return false;
  const norm = (s: string) => s.toLowerCase().replace(/[.,]/g, "").replace(/\s+/g, " ").trim();
  const got = norm(providerName);
  if (got === norm(identity.displayName)) return true;
  return identity.aliases.some((a) => norm(a) === got);
}

export type VoiceStatus = {
  configured: boolean;
  /** The name the provider reports for the loaded id. Null when unchecked or unreachable. */
  providerName: string | null;
  intendedName: string;
  provenance: VoiceProvenance;
  /** true only when the provider confirmed the loaded voice is the intended one. */
  verified: boolean;
  /** Plain-language state for the owner's health page. */
  message: string;
};

/** The status message for each state, so the owner sees the same words everywhere. */
export function statusMessage(s: Omit<VoiceStatus, "message">): string {
  if (!s.configured) {
    return `No voice configured. Set ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID in the host environment panel to speak as ${s.intendedName}. Until then the site uses the browser's own speech and says so.`;
  }
  if (s.verified) {
    return `Speaking as ${s.intendedName} (${s.provenance}), confirmed against the provider.`;
  }
  if (s.providerName) {
    return `MISMATCH: the configured voice id belongs to "${s.providerName}", not ${s.intendedName}. The site is speaking in the wrong voice. Correct ELEVENLABS_VOICE_ID in the host environment panel.`;
  }
  return `A voice id is configured but could not be confirmed with the provider just now. Audio will still play; the identity is unverified.`;
}
