import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;

// Set env before imports
process.env.MEM0_API_KEY = "test_pcsk_fake_key_for_testing";

import {
  Mem0Bus,
  addMemory,
  searchMemory,
  getMemories,
  getMemory,
  updateMemory,
  deleteMemory,
  deleteAllMemories,
  getMemoryHistory,
  storeDrBuddyInsight,
  storeGenomeScore,
  storeMorphicAnchor,
  crossNamespaceSearch,
  validateApiKey,
  PROJECT_IDS,
} from "./mem0";

function mockResponse(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  };
}

describe("Mem0 Bus Core (X30 Standing Order)", () => {
  let bus: Mem0Bus;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    Mem0Bus.resetInstance();
    bus = Mem0Bus.getInstance();
  });

  afterEach(() => {
    Mem0Bus.resetInstance();
    vi.restoreAllMocks();
  });

  // ─── Singleton Pattern ──────────────────────────────────────────────────────
  describe("Singleton Pattern", () => {
    it("returns the same instance on multiple calls", () => {
      const a = Mem0Bus.getInstance();
      const b = Mem0Bus.getInstance();
      expect(a).toBe(b);
    });

    it("creates new instance after reset", () => {
      const a = Mem0Bus.getInstance();
      Mem0Bus.resetInstance();
      const b = Mem0Bus.getInstance();
      expect(a).not.toBe(b);
    });
  });

  // ─── PROJECT_IDS Namespace Mapping (8 namespaces including genome) ─────────
  describe("PROJECT_IDS", () => {
    it("has all 8 project namespaces defined", () => {
      expect(Object.keys(PROJECT_IDS)).toHaveLength(8);
      expect(PROJECT_IDS.root).toBe("samuel_a_2026");
      expect(PROJECT_IDS.dr_buddy).toBe("samuel_a_dr_buddy");
      expect(PROJECT_IDS.russell_capital).toBe("samuel_a_russell_capital");
      expect(PROJECT_IDS.church).toBe("samuel_a_church_morphic");
      expect(PROJECT_IDS.weight_loss).toBe("samuel_a_weight_loss_genome");
      expect(PROJECT_IDS.edu_genius).toBe("samuel_a_edu_genius");
      expect(PROJECT_IDS.med_freedom).toBe("samuel_a_med_freedom");
      expect(PROJECT_IDS.genome).toBe("samuel_a_genome_scoring");
    });
  });

  // ─── bus.add() ─────────────────────────────────────────────────────────────
  describe("bus.add()", () => {
    it("sends messages to correct namespace with metadata", async () => {
      const mockResult = {
        results: [{ id: "mem_123", memory: "User prefers morning routines", event: "ADD" }],
      };
      mockFetch.mockResolvedValueOnce(mockResponse(mockResult));

      const result = await bus.add(
        [{ role: "user", content: "I prefer morning routines for meditation" }],
        "church",
        { custom: "value" }
      );

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe("https://api.mem0.ai/v1/memories/");
      expect(options.method).toBe("POST");

      const body = JSON.parse(options.body);
      expect(body.user_id).toBe("samuel_a_church_morphic");
      expect(body.messages).toHaveLength(1);
      expect(body.messages[0].content).toContain("morning routines");
      expect(body.metadata.project).toBe("church");
      expect(body.metadata.source).toBe("russell_labs_platform");
      expect(body.metadata.custom).toBe("value");
      expect(body.metadata.timestamp).toBeDefined();

      expect(result.results[0].event).toBe("ADD");
    });

    it("uses root namespace by default", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ results: [] }));

      await bus.add([{ role: "user", content: "test" }]);

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.user_id).toBe("samuel_a_2026");
      expect(body.metadata.project).toBe("root");
    });

    it("routes to genome namespace correctly", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ results: [{ id: "g1", memory: "genome data", event: "ADD" }] }));

      await bus.add([{ role: "user", content: "genome score" }], "genome");

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.user_id).toBe("samuel_a_genome_scoring");
      expect(body.metadata.project).toBe("genome");
    });

    it("adds metadata even when none provided", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ results: [] }));

      await bus.add([{ role: "user", content: "test" }], "edu_genius");

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.metadata.project).toBe("edu_genius");
      expect(body.metadata.source).toBe("russell_labs_platform");
    });

    it("throws on API error", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ error: "Unauthorized" }, 401));

      await expect(bus.add([{ role: "user", content: "test" }])).rejects.toThrow("Mem0 API error 401");
    });

    it("tracks messages in session log", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ results: [{ id: "sl1", memory: "logged", event: "ADD" }] }));

      await bus.add([{ role: "user", content: "track this" }], "dr_buddy");

      const log = bus.getSessionLog();
      expect(log.size).toBeGreaterThan(0);
    });
  });

  // ─── bus.search() ──────────────────────────────────────────────────────────
  describe("bus.search()", () => {
    it("searches within correct namespace", async () => {
      const mockResults = {
        results: [
          { id: "mem_1", memory: "Prefers CBT techniques", score: 0.92, user_id: "samuel_a_dr_buddy" },
          { id: "mem_2", memory: "History of anxiety", score: 0.85, user_id: "samuel_a_dr_buddy" },
        ],
      };
      mockFetch.mockResolvedValueOnce(mockResponse(mockResults));

      const results = await bus.search("anxiety treatment preferences", "dr_buddy", 5);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe("https://api.mem0.ai/v1/memories/search/");
      expect(options.method).toBe("POST");

      const body = JSON.parse(options.body);
      expect(body.query).toBe("anxiety treatment preferences");
      expect(body.user_id).toBe("samuel_a_dr_buddy");
      expect(body.limit).toBe(5);

      expect(results).toHaveLength(2);
      expect(results[0].score).toBe(0.92);
    });

    it("returns empty array when no results", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ results: [] }));

      const results = await bus.search("nonexistent topic", "weight_loss");
      expect(results).toEqual([]);
    });

    it("handles missing results field gracefully", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({}));

      const results = await bus.search("test", "root");
      expect(results).toEqual([]);
    });
  });

  // ─── bus.getAll() ──────────────────────────────────────────────────────────
  describe("bus.getAll()", () => {
    it("fetches all memories for a namespace", async () => {
      const mockData = {
        results: [
          { id: "mem_a", memory: "Genome score: 78/100", user_id: "samuel_a_russell_capital" },
        ],
      };
      mockFetch.mockResolvedValueOnce(mockResponse(mockData));

      const results = await bus.getAll("russell_capital");

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.user_id).toBe("samuel_a_russell_capital");
      expect(results).toHaveLength(1);
      expect(results[0].memory).toContain("Genome score");
    });
  });

  // ─── bus.get() ─────────────────────────────────────────────────────────────
  describe("bus.get()", () => {
    it("fetches a specific memory by ID", async () => {
      const mockMem = { id: "mem_xyz", memory: "Important insight", user_id: "samuel_a_2026" };
      mockFetch.mockResolvedValueOnce(mockResponse(mockMem));

      const result = await bus.get("mem_xyz");

      expect(mockFetch.mock.calls[0][0]).toBe("https://api.mem0.ai/v1/memories/mem_xyz/");
      expect(result.memory).toBe("Important insight");
    });
  });

  // ─── bus.update() ──────────────────────────────────────────────────────────
  describe("bus.update()", () => {
    it("updates memory text via PUT", async () => {
      const updated = { id: "mem_xyz", memory: "Updated insight", user_id: "samuel_a_2026" };
      mockFetch.mockResolvedValueOnce(mockResponse(updated));

      const result = await bus.update("mem_xyz", "Updated insight");

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe("https://api.mem0.ai/v1/memories/mem_xyz/");
      expect(options.method).toBe("PUT");
      expect(JSON.parse(options.body).text).toBe("Updated insight");
      expect(result.memory).toBe("Updated insight");
    });
  });

  // ─── bus.delete() ──────────────────────────────────────────────────────────
  describe("bus.delete()", () => {
    it("deletes a memory by ID", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({}));

      await bus.delete("mem_to_delete");

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe("https://api.mem0.ai/v1/memories/mem_to_delete/");
      expect(options.method).toBe("DELETE");
    });
  });

  // ─── bus.deleteAll() ───────────────────────────────────────────────────────
  describe("bus.deleteAll()", () => {
    it("deletes all memories for a namespace", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({}));

      await bus.deleteAll("weight_loss");

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.user_id).toBe("samuel_a_weight_loss_genome");
    });
  });

  // ─── bus.getHistory() ──────────────────────────────────────────────────────
  describe("bus.getHistory()", () => {
    it("fetches history for a memory", async () => {
      const history = {
        results: [
          { id: "h1", memory: "Original", event: "ADD", timestamp: "2026-05-01T00:00:00Z" },
          { id: "h2", memory: "Updated", event: "UPDATE", timestamp: "2026-05-10T00:00:00Z" },
        ],
      };
      mockFetch.mockResolvedValueOnce(mockResponse(history));

      const result = await bus.getHistory("mem_xyz");

      expect(mockFetch.mock.calls[0][0]).toBe("https://api.mem0.ai/v1/memories/mem_xyz/history/");
      expect(result).toHaveLength(2);
      expect(result[1].event).toBe("UPDATE");
    });
  });

  // ─── Session-End Auto-Persist ──────────────────────────────────────────────
  describe("Session-End Auto-Persist", () => {
    it("endSession persists summary to correct namespace", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ results: [{ id: "es1", memory: "session end", event: "ADD" }] }));

      const result = await bus.endSession("dr_buddy", "Patient discussed anxiety management", ["Switch to CBT focus"]);

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.user_id).toBe("samuel_a_dr_buddy");
      expect(body.messages[0].content).toContain("Session ended");
      expect(body.messages[1].content).toContain("Switch to CBT focus");
      expect(body.metadata.type).toBe("session_end");
      expect(result.results[0].event).toBe("ADD");
    });

    it("endDrBuddySession includes clinical metadata", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ results: [{ id: "edb1", memory: "dr buddy end", event: "ADD" }] }));

      await bus.endDrBuddySession("Discussed CBT techniques", ["Try grounding"], "low", ["CBT", "mindfulness"]);

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.user_id).toBe("samuel_a_dr_buddy");
      expect(body.metadata.riskLevel).toBe("low");
      expect(body.metadata.techniques).toEqual(["CBT", "mindfulness"]);
    });

    it("endGenomeSession stores to genome namespace with scores", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ results: [{ id: "eg1", memory: "genome end", event: "ADD" }] }));

      await bus.endGenomeSession(2, { risk_tolerance: 85, growth_mindset: 72 }, 78, ["High risk tolerance"]);

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.user_id).toBe("samuel_a_genome_scoring");
      expect(body.metadata.sessionNumber).toBe(2);
      expect(body.metadata.totalScore).toBe(78);
    });

    it("endMedFreedomSession stores medications discussed", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ results: [{ id: "emf1", memory: "med end", event: "ADD" }] }));

      await bus.endMedFreedomSession("Discussed SSRI taper", ["sertraline", "buspirone"], ["Begin 10% taper"]);

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.user_id).toBe("samuel_a_med_freedom");
      expect(body.metadata.medications).toEqual(["sertraline", "buspirone"]);
    });

    it("endSession with no key decisions still persists", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ results: [{ id: "es2", memory: "no decisions", event: "ADD" }] }));

      await bus.endSession("church", "Explored consciousness thread");

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.messages[1].content).toContain("Session archived for continuity");
    });
  });

  // ─── Domain-Specific Operations ───────────────────────────────────────────
  describe("Domain-Specific Operations", () => {
    it("storeDrBuddyInsight routes to dr_buddy namespace", async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({ results: [{ id: "mem_clinical", memory: "CBT effective", event: "ADD" }] })
      );

      const result = await bus.storeDrBuddyInsight("CBT techniques showing positive response", {
        sessionId: "sess_42",
        riskLevel: "low",
        techniques: ["CBT", "mindfulness"],
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.user_id).toBe("samuel_a_dr_buddy");
      expect(body.messages).toHaveLength(2);
      expect(body.metadata.type).toBe("clinical_insight");
      expect(body.metadata.riskLevel).toBe("low");
      expect(result.results[0].event).toBe("ADD");
    });

    it("storeGenomeScore routes to genome namespace", async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({ results: [{ id: "gs1", memory: "genome score", event: "ADD" }] })
      );

      const dimensions = { openness: 82, conscientiousness: 71, resilience: 65 };
      const result = await bus.storeGenomeScore(dimensions, 2, 73);

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.user_id).toBe("samuel_a_genome_scoring");
      expect(body.messages[0].content).toContain("Session 2");
      expect(body.messages[0].content).toContain("73/100");
      expect(body.metadata.type).toBe("genome_score");
      expect(body.metadata.session).toBe(2);
      expect(body.metadata.totalScore).toBe(73);
      expect(result.results[0].event).toBe("ADD");
    });

    it("storeMorphicAnchor routes to church namespace", async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({ results: [{ id: "mem_morphic", memory: "Ancestral pattern", event: "ADD" }] })
      );

      const result = await bus.storeMorphicAnchor(
        "Family lineage of entrepreneurial risk-taking",
        "ancestral"
      );

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.user_id).toBe("samuel_a_church_morphic");
      expect(body.messages[0].content).toContain("ancestral");
      expect(body.metadata.type).toBe("morphic_anchor");
      expect(body.metadata.resonanceType).toBe("ancestral");
      expect(result.results[0].event).toBe("ADD");
    });

    it("storeMorphicAnchor handles all resonance types", async () => {
      const types = ["ancestral", "theological", "consciousness", "intention"] as const;
      for (const type of types) {
        mockFetch.mockResolvedValueOnce(mockResponse({ results: [{ id: `mem_${type}`, memory: "test", event: "ADD" }] }));
        await bus.storeMorphicAnchor(`Test ${type}`, type);
        const body = JSON.parse(mockFetch.mock.calls[mockFetch.mock.calls.length - 1][1].body);
        expect(body.metadata.resonanceType).toBe(type);
      }
    });

    it("storeTaperPlan routes to med_freedom namespace", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ results: [{ id: "tp1", memory: "taper", event: "ADD" }] }));

      await bus.storeTaperPlan(["sertraline"], "10% biweekly", "6 months");

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.user_id).toBe("samuel_a_med_freedom");
      expect(body.metadata.type).toBe("taper_plan");
      expect(body.metadata.medications).toEqual(["sertraline"]);
    });

    it("storeWeightLossData routes to weight_loss namespace", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ results: [{ id: "wl1", memory: "weight", event: "ADD" }] }));

      await bus.storeWeightLossData("Current weight 210 lbs, target 185 by Dec 2026", { currentWeight: 210 });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.user_id).toBe("samuel_a_weight_loss_genome");
      expect(body.metadata.type).toBe("metabolic_data");
      expect(body.metadata.currentWeight).toBe(210);
    });
  });

  // ─── Cross-Namespace Resonance Search ─────────────────────────────────────
  describe("Cross-Namespace Resonance Search", () => {
    it("searches all 8 namespaces in parallel", async () => {
      for (let i = 0; i < 8; i++) {
        mockFetch.mockResolvedValueOnce(
          mockResponse({
            results: [{ id: `mem_ns${i}`, memory: `Result from ns ${i}`, score: 0.8 - i * 0.05, user_id: "test" }],
          })
        );
      }

      const results = await bus.crossSearch("anxiety patterns", 3);

      expect(mockFetch).toHaveBeenCalledTimes(8);
      expect(Object.keys(results)).toHaveLength(8);
      expect(results.root).toBeDefined();
      expect(results.dr_buddy).toBeDefined();
      expect(results.russell_capital).toBeDefined();
      expect(results.church).toBeDefined();
      expect(results.weight_loss).toBeDefined();
      expect(results.edu_genius).toBeDefined();
      expect(results.med_freedom).toBeDefined();
      expect(results.genome).toBeDefined();
    });

    it("handles partial failures gracefully", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ results: [{ id: "m1", memory: "ok", score: 0.9, user_id: "t" }] }));
      mockFetch.mockRejectedValueOnce(new Error("Network error"));
      mockFetch.mockResolvedValueOnce(mockResponse({ results: [] }));
      mockFetch.mockRejectedValueOnce(new Error("Timeout"));
      mockFetch.mockResolvedValueOnce(mockResponse({ results: [{ id: "m2", memory: "ok2", score: 0.7, user_id: "t" }] }));
      mockFetch.mockResolvedValueOnce(mockResponse({ results: [] }));
      mockFetch.mockResolvedValueOnce(mockResponse({ results: [] }));
      mockFetch.mockResolvedValueOnce(mockResponse({ results: [] }));

      const results = await bus.crossSearch("test query");

      expect(Object.keys(results)).toHaveLength(8);
    });
  });

  // ─── Validate ─────────────────────────────────────────────────────────────
  describe("Validate", () => {
    it("returns true when API key is valid", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ results: [] }));

      const valid = await bus.validate();
      expect(valid).toBe(true);
    });

    it("returns false when API key is invalid", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ error: "Invalid token" }, 401));

      const valid = await bus.validate();
      expect(valid).toBe(false);
    });

    it("returns false on network error", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network unreachable"));

      const valid = await bus.validate();
      expect(valid).toBe(false);
    });
  });

  // ─── Authentication ───────────────────────────────────────────────────────
  describe("Authentication", () => {
    it("includes Token auth header in all requests", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ results: [] }));

      await bus.search("test", "root");

      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers.Authorization).toBe("Token test_pcsk_fake_key_for_testing");
      expect(headers["Content-Type"]).toBe("application/json");
    });

    it("throws when MEM0_API_KEY is not set", async () => {
      const originalKey = process.env.MEM0_API_KEY;
      delete process.env.MEM0_API_KEY;

      mockFetch.mockResolvedValueOnce(mockResponse({ results: [] }));

      await expect(bus.search("test", "root")).rejects.toThrow("MEM0_API_KEY not configured");

      process.env.MEM0_API_KEY = originalKey;
    });
  });

  // ─── Error Handling ───────────────────────────────────────────────────────
  describe("Error Handling", () => {
    it("throws descriptive error on 500 response", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse("Internal Server Error", 500));

      await expect(bus.add([{ role: "user", content: "test" }])).rejects.toThrow("Mem0 API error 500");
    });

    it("throws descriptive error on 429 rate limit", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse("Rate limited", 429));

      await expect(bus.search("test")).rejects.toThrow("Mem0 API error 429");
    });

    it("handles timeout via AbortController", async () => {
      mockFetch.mockImplementationOnce(
        () => new Promise((_, reject) => setTimeout(() => reject(new Error("aborted")), 100))
      );

      await expect(bus.search("slow query")).rejects.toThrow();
    });
  });

  // ─── Namespace Routing (all 8) ────────────────────────────────────────────
  describe("Namespace Routing", () => {
    it("routes add to correct user_id per namespace", async () => {
      const namespaces = Object.keys(PROJECT_IDS) as Array<keyof typeof PROJECT_IDS>;

      for (const ns of namespaces) {
        mockFetch.mockResolvedValueOnce(mockResponse({ results: [] }));
        await bus.add([{ role: "user", content: "test" }], ns);
        const body = JSON.parse(mockFetch.mock.calls[mockFetch.mock.calls.length - 1][1].body);
        expect(body.user_id).toBe(PROJECT_IDS[ns]);
      }
    });

    it("routes search to correct user_id per namespace", async () => {
      const namespaces = Object.keys(PROJECT_IDS) as Array<keyof typeof PROJECT_IDS>;

      for (const ns of namespaces) {
        mockFetch.mockResolvedValueOnce(mockResponse({ results: [] }));
        await bus.search("test", ns);
        const body = JSON.parse(mockFetch.mock.calls[mockFetch.mock.calls.length - 1][1].body);
        expect(body.user_id).toBe(PROJECT_IDS[ns]);
      }
    });
  });

  // ─── Session Log ──────────────────────────────────────────────────────────
  describe("Session Log", () => {
    it("clearSessionLog empties the log", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ results: [{ id: "sl1", memory: "log", event: "ADD" }] }));

      await bus.add([{ role: "user", content: "logged" }]);
      expect(bus.getSessionLog().size).toBeGreaterThan(0);

      bus.clearSessionLog();
      expect(bus.getSessionLog().size).toBe(0);
    });
  });

  // ─── Backward-Compatible Exports ──────────────────────────────────────────
  describe("Backward-Compatible Exports", () => {
    it("addMemory routes through singleton", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ results: [{ id: "bc1", memory: "compat", event: "ADD" }] }));

      const result = await addMemory([{ role: "user", content: "compat test" }], "genome");
      expect(result.results[0].id).toBe("bc1");
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.user_id).toBe("samuel_a_genome_scoring");
    });

    it("searchMemory routes through singleton", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ results: [{ id: "bc2", memory: "found", score: 0.9, user_id: "test" }] }));

      const results = await searchMemory("test", "dr_buddy", 5);
      expect(results[0].id).toBe("bc2");
    });

    it("getMemories routes through singleton", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ results: [{ id: "gm1", memory: "all", user_id: "test" }] }));

      const results = await getMemories("church");
      expect(results).toHaveLength(1);
    });

    it("getMemory routes through singleton", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ id: "gm2", memory: "single", user_id: "test" }));

      const result = await getMemory("gm2");
      expect(result.id).toBe("gm2");
    });

    it("updateMemory routes through singleton", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ id: "um1", memory: "updated", user_id: "test" }));

      const result = await updateMemory("um1", "updated");
      expect(result.memory).toBe("updated");
    });

    it("deleteMemory routes through singleton", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({}));

      await deleteMemory("dm1");
      expect(mockFetch.mock.calls[0][1].method).toBe("DELETE");
    });

    it("deleteAllMemories routes through singleton", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({}));

      await deleteAllMemories("weight_loss");
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.user_id).toBe("samuel_a_weight_loss_genome");
    });

    it("getMemoryHistory routes through singleton", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ results: [{ id: "h1", memory: "v1", event: "ADD", timestamp: "2026-01-01" }] }));

      const history = await getMemoryHistory("h1");
      expect(history[0].event).toBe("ADD");
    });

    it("crossNamespaceSearch routes through singleton", async () => {
      for (let i = 0; i < 8; i++) {
        mockFetch.mockResolvedValueOnce(mockResponse({ results: [] }));
      }

      const results = await crossNamespaceSearch("test");
      expect(Object.keys(results)).toHaveLength(8);
    });

    it("validateApiKey routes through singleton", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ results: [] }));

      const valid = await validateApiKey();
      expect(valid).toBe(true);
    });

    it("storeGenomeScore routes through singleton to genome namespace", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ results: [{ id: "sg1", memory: "genome", event: "ADD" }] }));

      await storeGenomeScore({ risk: 80 }, 1, 80);
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.user_id).toBe("samuel_a_genome_scoring");
    });

    it("storeDrBuddyInsight routes through singleton", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ results: [{ id: "sdb1", memory: "insight", event: "ADD" }] }));

      await storeDrBuddyInsight("Patient improving", { riskLevel: "low" });
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.user_id).toBe("samuel_a_dr_buddy");
    });

    it("storeMorphicAnchor routes through singleton", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ results: [{ id: "sma1", memory: "anchor", event: "ADD" }] }));

      await storeMorphicAnchor("Deep prayer resonance", "theological");
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.user_id).toBe("samuel_a_church_morphic");
    });
  });
});
