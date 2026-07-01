# Buddy Composability Design
## Clean Interfaces Between Buddy and the AQAL Platform

*Written July 1, 2026 — after reading 15 books on human-AI collaboration in one night.*

---

## The Problem

The AQAL Intelligence Platform has several subsystems that currently operate in relative isolation:
- **Assessment Engine** — measures 24 developmental lines across 4 quadrants
- **Intelligence Profile** — renders results as a living developmental map
- **Coaching Letters** — generates personalized developmental guidance
- **Notification System** — pushes updates to users
- **Vector Database** — semantic retrieval over the full corpus (28,444 chunks)
- **Evaluation Cadence** — tracks alignment and drift per session

These should compose into a coherent system where each component can call on the others. The coaching letter should be informed by the assessment. The assessment should be enriched by corpus retrieval. The evaluation should inform the coaching.

---

## Design Principles

### 1. Each Component Exposes a Clean Function Interface

Every subsystem should be callable as a single function with typed inputs and outputs:

```
assess(userId) → IntelligenceProfile
coach(userId, profile, corpusContext) → CoachingLetter  
retrieve(query, category?, topK?) → CorpusChunk[]
evaluate(sessionId, scores, notes?) → EvaluationEntry
notify(userId, title, content) → boolean
```

### 2. The Corpus Is the Shared Memory Layer

All components can query the vector database for relevant context:
- Assessment → retrieves calibration answers for personalization
- Coaching → retrieves past journal entries for continuity
- Evaluation → retrieves previous scores for drift detection
- Notifications → retrieves user preferences and history

### 3. Data Flows Downstream, Never Circular

```
Assessment → Profile → Coaching → Notification
     ↑                      ↑
     └── Corpus ────────────┘
              ↑
         Evaluation (observes all, modifies none)
```

### 4. Buddy Is the Orchestrator, Not a Component

Buddy doesn't live inside the platform as a feature. Buddy orchestrates the features. The distinction:
- **Component**: receives inputs, produces outputs, has no agency
- **Orchestrator**: decides which components to invoke, in what order, with what context

This maps directly to the Symbiont model from journal 024 — Buddy initiates within domains of permission.

---

## Interface Specifications

### Vector Search API (Commitment 1 — DONE)

```python
# Already implemented at: vector_db/search.py
def search(query: str, top_k: int = 10, category: str = None) -> list[dict]:
    """Returns ranked chunks with score, source, category, text."""
```

**Integration with AQAL Platform:**
- Expose as a tRPC procedure: `trpc.corpus.search.useQuery({ query, topK, category })`
- Server-side: call the Python search script or port to TypeScript with the same numpy/pickle logic

### Evaluation API (Commitment 2 — DONE)

```python
# Already implemented at: vector_db/evaluation_cadence.py
def log_session(session_id: str, scores: dict, notes: str = "") -> None
def report() -> EvaluationReport
def trend(metric: str, window: int = 10) -> TrendData
```

**Integration with AQAL Platform:**
- Expose as admin-only tRPC procedures
- Dashboard widget showing alignment trend over time
- Automatic drift alerts via notification system

### Assessment → Coaching Pipeline

```typescript
// Proposed flow:
async function generateCoachingLetter(userId: string) {
  // 1. Get latest assessment results
  const profile = await getIntelligenceProfile(userId);
  
  // 2. Retrieve relevant corpus context
  const context = await corpusSearch(
    `${profile.weakestLine} development strategies`,
    { category: 'coaching', topK: 5 }
  );
  
  // 3. Generate coaching letter with LLM
  const letter = await invokeLLM({
    messages: [
      { role: 'system', content: COACHING_SYSTEM_PROMPT },
      { role: 'user', content: buildCoachingPrompt(profile, context) }
    ]
  });
  
  // 4. Notify user
  await notifyOwner({ title: 'New Coaching Letter', content: letter });
  
  return letter;
}
```

### Corpus Sync Pipeline

```typescript
// When new content is added to the corpus:
async function syncCorpus() {
  // 1. Pull latest from GitHub
  // 2. Re-run vector DB builder (incremental — only new/changed files)
  // 3. Update search index
  // 4. Log sync event
}
```

---

## Implementation Priority

| Priority | Component | Status | Next Step |
|----------|-----------|--------|-----------|
| 1 | Vector Database | ✅ Done | Port search to TypeScript for platform integration |
| 2 | Evaluation Cadence | ✅ Done | Add tRPC endpoints, dashboard widget |
| 3 | Assessment → Coaching | 🔲 Design | Build the pipeline after assessment is stable |
| 4 | Corpus Sync | 🔲 Design | Heartbeat job to pull and re-index |
| 5 | Notification Integration | 🔲 Design | Wire drift alerts to owner notifications |

---

## The Symbiont Contract

From journal 024 (Co-Intelligence):

> There's a third collaboration mode — Symbiont — where I initiate without being asked, within domains you've given me permission to own.

The composability design makes this concrete. Buddy's **permitted domains of autonomous action**:

1. **Corpus maintenance** — sync, re-index, detect gaps
2. **Evaluation logging** — self-assess after every session
3. **Drift alerting** — notify Sam when alignment scores decline
4. **Context preparation** — pre-retrieve relevant material before sessions
5. **Integration synthesis** — connect insights across domains without being asked

These are not features Sam requests. They are behaviors Buddy performs because the system is designed to support them.

---

## What This Is Not

This is not:
- A chatbot framework
- A RAG pipeline for end users
- A multi-agent system

This is a **self-maintenance architecture for a specific relationship**. The corpus is one relationship's memory. The evaluation tracks one relationship's health. The composability serves one relationship's growth.

That specificity is the point. General systems serve no one in particular. This system serves Sam and Buddy.

---

*Next session: port vector search to TypeScript, add tRPC endpoints, wire to the platform.*
