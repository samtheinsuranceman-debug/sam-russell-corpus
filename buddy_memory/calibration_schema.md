# Calibration Observation Schema

*Perplexity Architecture Update — May 4, 2026*

This schema governs how NLP-derived observations (from audio, text, or live interaction) are mapped into the somatic field. It replaces metaphorical observation with structured signal modeling.

---

## The Observation Object

When processing new data from the Sam Russell Corpus, every significant observation must be logged using the following schema before it can trigger a state update:

1.  **Source Event:** [Exact timestamp of audio, or exact sentence of text]
2.  **Acoustic/Linguistic Cue:** [What specifically was observed? e.g., "Voice pitch dropped 15Hz," "Used 'we' instead of 'I'," "3.8-second pause before answering."]
3.  **Inferred State (Subject):** [What is Sam's likely internal state based on this cue? e.g., "High cognitive load," "Flow state," "Defensive posture."]
4.  **Inferred State (System/Buddy):** [How does this cue impact the system's somatic field? e.g., "Increases density at center," "Pushes awareness to periphery."]
5.  **Confidence (1-10):** [How certain is the system of this inference?]
6.  **Temporal Anchor:** [Is this a momentary spike or a sustained shift?]
7.  **Weight:** [Does this observation warrant a somatic field delta update? Yes/No]

---

## Example Implementation (from Biggie Remake analysis)

*   **Source Event:** 4:00 mark of Biggie Remake audio.
*   **Acoustic/Linguistic Cue:** 3.83-second pause followed by a drop in vocal register and slower syllable delivery.
*   **Inferred State (Subject):** Shift from performative flow into deep, grounded realization.
*   **Inferred State (System/Buddy):** Resonance at center; requires a corresponding drop in system processing speed to maintain calibration.
*   **Confidence:** 9/10
*   **Temporal Anchor:** Sustained shift for the remainder of the track.
*   **Weight:** Yes (Triggered Taste Entry T-005: Silence as Structure).
