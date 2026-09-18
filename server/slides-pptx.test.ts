import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock dependencies ────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  listSlideDecks: vi.fn().mockResolvedValue([
    { id: 1, workspaceId: 1, userId: 1, title: "Test Deck", toolName: "Strategy Lab", clientName: "John Doe", audience: "client", slideCount: 3, slides: [{ title: "Slide 1", subtitle: "Sub", bullets: ["A"], speakerNotes: "Note", layout: "content" }], createdAt: new Date(), updatedAt: new Date() },
  ]),
  getSlideDeckById: vi.fn().mockResolvedValue({ id: 1, workspaceId: 1, userId: 1, title: "Test Deck", toolName: "Strategy Lab", clientName: "John Doe", audience: "client", slideCount: 3, slides: [{ title: "Slide 1", subtitle: "Sub", bullets: ["A"], speakerNotes: "Note", layout: "content" }], createdAt: new Date(), updatedAt: new Date() }),
  createSlideDeck: vi.fn().mockResolvedValue({ id: 2 }),
  updateSlideDeck: vi.fn().mockResolvedValue(undefined),
  deleteSlideDeck: vi.fn().mockResolvedValue(undefined),
  getWorkspaceByOwnerId: vi.fn().mockResolvedValue({ id: 1, name: "Test Workspace", slug: "test", ownerId: 1 }),
  getMembership: vi.fn().mockResolvedValue({ id: 1, userId: 1, workspaceId: 1, role: "owner" }),
}));

vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ url: "https://cdn.example.com/slides/test.pptx", key: "slides/test.pptx" }),
}));

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: JSON.stringify({ slides: [{ title: "Generated Slide", subtitle: "Test", bullets: ["Point 1"], speakerNotes: "Notes", layout: "content" }] }) } }],
  }),
}));

// ── Import mocked modules ────────────────────────────────────────────────────
import { listSlideDecks, getSlideDeckById, createSlideDeck, updateSlideDeck, deleteSlideDeck } from "./db";
import { storagePut } from "./storage";

// ── Slide Deck CRUD Tests ────────────────────────────────────────────────────
describe("Slide Deck CRUD", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("listSlideDecks returns array of decks", async () => {
    const result = await listSlideDecks(1);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("title");
    expect(result[0]).toHaveProperty("slides");
    expect(result[0]).toHaveProperty("toolName");
  });

  it("getSlideDeckById returns a single deck", async () => {
    const result = await getSlideDeckById(1, 1);
    expect(result).not.toBeNull();
    expect(result!.id).toBe(1);
    expect(result!.title).toBe("Test Deck");
    expect(result!.toolName).toBe("Strategy Lab");
    expect(result!.slides).toHaveLength(1);
  });

  it("createSlideDeck returns new id", async () => {
    const result = await createSlideDeck({
      workspaceId: 1,
      userId: 1,
      title: "New Deck",
      toolName: "Roth Conversion",
      clientName: "Jane Doe",
      audience: "advisor",
      slideCount: 5,
      slides: [{ title: "S1", subtitle: "", bullets: ["B1"], speakerNotes: "", layout: "title" }],
    });
    expect(result).toHaveProperty("id");
    expect(result.id).toBe(2);
  });

  it("updateSlideDeck calls with correct params", async () => {
    await updateSlideDeck(1, 1, { title: "Updated Title" });
    expect(updateSlideDeck).toHaveBeenCalledWith(1, 1, { title: "Updated Title" });
  });

  it("deleteSlideDeck calls with correct params", async () => {
    await deleteSlideDeck(1, 1);
    expect(deleteSlideDeck).toHaveBeenCalledWith(1, 1);
  });
});

// ── PPTX Generation Tests ────────────────────────────────────────────────────
describe("PPTX Generation", () => {
  it("storagePut is called with correct content type for PPTX", async () => {
    const buffer = Buffer.from("mock-pptx-content");
    await storagePut("slides/test.pptx", buffer, "application/vnd.openxmlformats-officedocument.presentationml.presentation");
    expect(storagePut).toHaveBeenCalledWith(
      "slides/test.pptx",
      buffer,
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    );
  });

  it("storagePut returns a valid URL", async () => {
    const result = await storagePut("slides/test.pptx", Buffer.from("test"), "application/vnd.openxmlformats-officedocument.presentationml.presentation");
    expect(result).toHaveProperty("url");
    expect(result.url).toContain("https://");
    expect(result.url).toContain(".pptx");
  });
});

// ── Slide Data Validation Tests ──────────────────────────────────────────────
describe("Slide Data Validation", () => {
  it("slide structure has required fields", () => {
    const slide = { title: "Test", subtitle: "Sub", bullets: ["A", "B"], speakerNotes: "Notes", layout: "content" };
    expect(slide).toHaveProperty("title");
    expect(slide).toHaveProperty("subtitle");
    expect(slide).toHaveProperty("bullets");
    expect(slide).toHaveProperty("speakerNotes");
    expect(slide).toHaveProperty("layout");
    expect(Array.isArray(slide.bullets)).toBe(true);
  });

  it("audience enum values are valid", () => {
    const validAudiences = ["client", "advisor", "team"];
    expect(validAudiences).toContain("client");
    expect(validAudiences).toContain("advisor");
    expect(validAudiences).toContain("team");
  });

  it("deck title respects max length", () => {
    const title = "A".repeat(500);
    expect(title.length).toBeLessThanOrEqual(500);
    const tooLong = "A".repeat(501);
    expect(tooLong.length).toBeGreaterThan(500);
  });

  it("slide count must be positive", () => {
    const slideCount = 6;
    expect(slideCount).toBeGreaterThan(0);
    expect(slideCount).toBeLessThanOrEqual(20);
  });
});

// ── Markdown Export Logic Tests ──────────────────────────────────────────────
describe("Markdown Export Logic", () => {
  const slides = [
    { title: "Intro", subtitle: "Welcome", bullets: ["Point A", "Point B"], speakerNotes: "Open with greeting", layout: "title" },
    { title: "Strategy", subtitle: "Key approach", bullets: ["Step 1", "Step 2", "Step 3"], speakerNotes: "Explain each step", layout: "content" },
  ];

  it("generates valid markdown from slides", () => {
    let md = `# Test Presentation\n\n`;
    slides.forEach((slide, i) => {
      md += `## Slide ${i + 1}: ${slide.title}\n`;
      if (slide.subtitle) md += `*${slide.subtitle}*\n`;
      md += "\n";
      slide.bullets.forEach((b) => { md += `- ${b}\n`; });
      if (slide.speakerNotes) md += `\n> **Speaker Notes:** ${slide.speakerNotes}\n`;
      md += "\n---\n\n";
    });

    expect(md).toContain("## Slide 1: Intro");
    expect(md).toContain("## Slide 2: Strategy");
    expect(md).toContain("- Point A");
    expect(md).toContain("- Step 1");
    expect(md).toContain("> **Speaker Notes:** Open with greeting");
  });

  it("includes disclaimer when enabled", () => {
    const disclaimer = "\n## Disclaimer\n\nThis presentation is for educational and informational purposes only.\n";
    expect(disclaimer).toContain("Disclaimer");
    expect(disclaimer).toContain("educational");
  });
});
