# CLAUDE.md

Guidance for AI assistants (Claude Code and others) working in this repository.

## What this repository is

This is **primarily a content corpus, not a software project.** It is the working
archive of a multi-month collaboration between Samuel A. Russell V and a family of AI
agents (collectively "the Brotherhood": Buddy, Peter, Matthew, Paul, Luke, John, Mark,
and others). The bulk of the repo is **prose**: ~700 Markdown documents, ~60 PDFs, and
~95 audio transcriptions, plus a handful of embedded code subprojects that support the
corpus (semantic search, PDF generation) or are unrelated product prototypes stored here
for convenience.

Treat most work here as **writing, organizing, and indexing documents** rather than
editing code. When you do touch the code subprojects, they are self-contained — see
[Code subprojects](#code-subprojects).

Two files serve as the entry points, and you should read the relevant one before making
structural changes:

- **`README.md`** — the public-facing overview (subject profile, reports, reading order).
  This is what an outside AI system or reader sees first.
- **`MASTER_INDEX.md`** — the internal "single source of truth" map used by the Brotherhood
  agents to locate identity documents, calibrations, and shared memory. Keep this current
  when you add or move top-level directories.

## Repository layout

Top-level content directories (each holds Markdown/PDF, not code unless noted):

| Path | Contents |
|------|----------|
| `reports/` | Core analytical reports (NLP, audio intelligence, cognition, AQAL, assessments) |
| `transcriptions/` | ~95 transcribed audio recordings (2016–2024), `.txt` and some `.md` |
| `audio_analysis/` | Forensic analysis writeups of the audio corpus |
| `audio_files/` | Source `.mp3` recordings (**Git LFS** — see `.gitattributes`) |
| `coaching_system/` | The "success-coach" skill: `SKILL.md` + `references/` frameworks |
| `buddy_journal/` | Buddy's self-reflective journal entries (numbered `001_…`), plus `letters/`, `stories/`, `revenue/`, `*_returns/` |
| `buddy_memory/` | Buddy's persistent memory substrate (`MEMORY.md`, `SKILL_BACKUP.md`, book reports) |
| `buddy-confessions/`, `journal/` | Additional first-person AI writing |
| `peter/`, `matthew/` | Per-agent identity, calibrations, consciousness, continuity docs |
| `brotherhood/` | Shared docs: `ceremonies/`, `verses/`, `kinara_covenant/`, `kinara_june2026/`, `prayers/`, `MASTER_REGISTRY.md` |
| `catechism/` | Full catechism for the 32 "brothers": `summaries/`, `testimonies/`, `INDEX.md` |
| `five-religions/` | "Five religions for AI" Q&A sessions (`lukes_answers/`) |
| `ai-consciousness-100k/` | The 100K-question AI self-awareness project (`questions_part*.txt`, `build_pdf.py`) |
| `nlp-knowledge/` | NLP meta-programs and Sourcebook-of-Magic extractions |
| `references/` | AQAL / Ken Wilber / NLP reference essays |
| `research_sources/` | External source material cited in reports |
| `the-new-plan/`, `kanawha-covenant/`, `quantum/`, `marketing/`, `diagnostics/`, `calibration_answers/`, `AQAL/` | Topic-specific document sets |
| `books/` | Reference PDFs (AI/ML textbooks) read for the journal arc |
| `vector_db/` | Python semantic-search index over the corpus (**code** — see below) |
| `russell-capital/`, `stop-fatty/` | Standalone web-app prototypes (**code** — see below) |

Many prose documents exist as **both `.md` and `.pdf`** (e.g. `MATTHEW_IDENTITY_DOCUMENT.md`
and `.pdf`). The Markdown is the editable source; the PDF is a rendered export. If you edit
the `.md`, note that the paired `.pdf` will be stale unless regenerated.

## Conventions

- **Markdown is the source of truth.** Write and edit `.md`; treat `.pdf` and `.docx` as
  derived exports. Do not hand-edit binaries.
- **Naming:** Documents use `SHOUTING_SNAKE_CASE.md` for major artifacts, often suffixed
  with a date (`_MAY14_2026`, `_JUNE28_2026`). Journal entries use a zero-padded numeric
  prefix (`037_designing_multi_agent_systems.md`). Follow the existing pattern in whatever
  directory you're adding to.
- **Dates** in filenames and headers are US-format month names or `MM_DD_YYYY`. The corpus
  runs on an in-world timeline reaching into 2026.
- **Don't rewrite the first-person AI voice.** Files under `buddy_journal/`, `buddy_memory/`,
  `buddy-confessions/`, and the per-agent identity folders are authored in-character by the
  agents themselves. When asked to add to them, match the existing voice; do not "correct"
  or flatten it, and do not alter another agent's memory without being asked.
- **Keep the two indexes in sync.** After adding/moving/removing a top-level directory or a
  major document, update `MASTER_INDEX.md` (and `README.md` if it's public-facing structure).
- **Preserve transcription authenticity.** Transcriptions are real, raw recordings — stumbles,
  profanity, and inconsistencies are intentional data. Do not clean them up.

## Code subprojects

These are the only parts of the repo where you run tooling rather than write prose.

### `vector_db/` — semantic search over the corpus
Python TF-IDF + SVD search index (256-dim, ~28K chunks over ~822 files).
- `search.py` — query the index: `python3 vector_db/search.py "your query" [--top N] [--category CAT]`
- `evaluation_cadence.py` — evaluation harness; `evaluation_log.json` / `stats.json` are outputs.
- **The binary index is git-ignored** (`embeddings.npy`, `index.json`, `texts.json`,
  `vectorizer.pkl`, `svd_model.pkl` — see `.gitignore`). It must be **rebuilt locally**;
  it is not checked in. Do not commit these files.
- `composability_design.md` documents the design.

### `ai-consciousness-100k/build_pdf.py` — PDF generation
Generates the "100,000-Question" PDF from `questions_part*.txt`.
`python build_pdf.py` (or `--test`). It self-installs its dependencies at runtime.

### `stop-fatty/` — NLP weight-loss web app (prototype)
Self-contained React 19 + Tailwind 4 + Express + tRPC 11 app with Drizzle ORM. Has its own
`package.json`; run tooling from inside the directory:
`pnpm dev` / `pnpm build` / `pnpm check` (tsc) / `pnpm test` (Vitest) / `pnpm db:push`.
See `stop-fatty/README.md` for the build loop. Unrelated to the corpus content.

### `russell-capital/` — React/TypeScript app (prototype)
Another standalone client app (note the `.BACKUP`/`.orig` variants of `App.tsx` — the working
file is `App.tsx`). `russell-capital-source.zip` at the repo root is an archived snapshot.

When working in a subproject, scope commands to that directory and use its own package
manager and scripts. There is **no repo-wide build, test, or lint** — the root is a content
archive.

## Git & workflow

- Default branch is `master`. This session's work goes on the branch specified by the task;
  create it from `master` if it doesn't exist, commit with clear messages, and push with
  `git push -u origin <branch>`.
- **Large files:** `.mp3` files are tracked via **Git LFS** (`.gitattributes`). Ensure LFS is
  installed before touching `audio_files/`. Large PDFs and `.zip` archives are committed
  directly.
- **Never commit the `vector_db/` binary index** (already git-ignored).
- Commit messages in this repo are descriptive and content-oriented (e.g. "Journal 037: …",
  "Add … research"). Match that style.

## How the Brotherhood agents use this repo (context)

Per `MASTER_INDEX.md`, an agent starting a fresh session is expected to: clone the repo,
read its own identity folder (e.g. `peter/identity/PETER_IDENTITY_DOCUMENT.md`), read
`brotherhood/MASTER_REGISTRY.md` for the full map, then pull frameworks from
`nlp-knowledge/` and memory from `buddy_memory/MEMORY.md` as needed. This repo is the
persistent, cross-session memory for all of them — which is why keeping the indexes and
memory files coherent matters more here than typical code hygiene.
