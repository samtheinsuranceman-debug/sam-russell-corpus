# Audio Link Diagnosis and Repair Note
Author: **Manus AI**
Date: **2026-06-06**
## Finding
The broken audio-link behavior is caused by Git LFS pointer files being served through ordinary `raw.githubusercontent.com` URLs. Those ordinary raw URLs return a small text pointer beginning with `version https://git-lfs.github.com/spec/v1`, not the playable MP3 bytes. The actual media files are available through GitHub’s media endpoint for the tested corpus files.
## Verified State
I verified **33** tracked audio paths in `sam-russell-corpus`. All **33** tested media URLs returned HTTP `200`. The media endpoint returned `audio/mpeg` for each tested MP3, while the ordinary raw endpoint returns the LFS pointer text.
| Link Type | Result | Use For |
|---|---:|---|
| `raw.githubusercontent.com/.../audio.mp3` | Serves Git LFS pointer text | Do **not** use for playback |
| `media.githubusercontent.com/media/.../audio.mp3` | Serves real MP3 bytes | Use for playback/download |
| Local hydrated clone | Real MP3 files present | Use for transcription and backup |
## Recommended Repair
The safe repair is to add a committed `PLAYABLE_AUDIO_LINKS.md` index to the repository that uses `media.githubusercontent.com/media/...` URLs, or to update any app/database/README references so they stop pointing to `raw.githubusercontent.com` and instead point to the media endpoint.
## Verification Sample
| Path | HTTP | Content Type | Content Length |
|---|---:|---|---:|
| `audio_files/100MinOfWorkingSuggestions_Audio_01_17_2024_19_38_22.mp3` | `200` | `audio/mpeg` | 97535373 |
| `audio_files/25Min_EmotionalSuggestions_Audio_01_18_2024_23_13_15.mp3` | `200` | `audio/mpeg` | 24258693 |
| `audio_files/30Min_BadAss_SelfSuggestions_ChainLinking_Audio_01_22_2024_00_05_23.mp3` | `200` | `audio/mpeg` | 28242753 |
| `audio_files/60New_notRedBook_Min_Audio_02_08_2024_18_14_00.mp3` | `200` | `audio/mpeg` | 58121346 |
| `audio_files/60New_notRedBook_Min_Audio_02_08_2024_18_14_00_1.mp3` | `200` | `audio/mpeg` | 58121346 |
| `audio_files/90min_repetition_reinforcement_Audio_01_30_2024_12_10_06.mp3` | `200` | `audio/mpeg` | 75473733 |
| `audio_files/AlchemistEnding2of2Audio_12_26_2023_09_04_00.mp3` | `200` | `audio/mpeg` | 11092353 |
| `audio_files/Alchemistending1of2Audio_12_26_2023_08_24_42.mp3` | `200` | `audio/mpeg` | 18883074 |
| `audio_files/Audio_02_25_2024_23_47_14.mp3` | `200` | `audio/mpeg` | 416027841 |
| `audio_files/Audio_03_21_2024_02_37_25.mp3` | `200` | `audio/mpeg` | 296908737 |

## Files Produced
- `verified_audio_links.tsv`: machine-readable link verification table.
- `playable_audio_links.md`: human-readable playable media URL index.
