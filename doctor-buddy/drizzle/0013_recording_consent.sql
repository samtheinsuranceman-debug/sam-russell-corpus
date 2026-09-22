-- Optional, separately recorded consent to analyse the person's voice and
-- camera during companion conversations. Both default to off; the consent
-- version moved to 4.1 so every earlier acknowledgement is re-presented with
-- the new disclosure.
ALTER TABLE `hipaa_consents`
  ADD COLUMN `agreedToAudioAnalysis` boolean NOT NULL DEFAULT false,
  ADD COLUMN `agreedToVideoAnalysis` boolean NOT NULL DEFAULT false;
