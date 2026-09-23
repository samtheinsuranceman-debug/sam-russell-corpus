/**
 * The PDF reader behind the four document readers: text extraction with limits,
 * refusal of scans, stored-file ownership, and the Brain Hub call. The provider
 * call is stubbed; every fixture is generated here with invented data.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import { FAKE_MORTGAGE_STATEMENT, FAKE_SENTINEL, scanLikePdf, textPdf } from "./testFixtures/fakePdf";

const completeChat = vi.fn();
vi.mock("./providerRegistry", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./providerRegistry")>()),
  completeChat: (...a: unknown[]) => completeChat(...a),
}));

const {
  SCANNED_PDF_MESSAGE, decodePdfUpload, documentMessage, extractPdfText, loadPdfFromUrl, parseJsonReply, readPdfAsJson, readerErrorMessage,
} = await import("./pdfReader");

const reply = (text: string, providerId = "stub-provider", model = "stub-model") => ({ text, providerId, model, attempted: [] });

describe("extractPdfText", () => {
  it("reads the text layer of a generated PDF, page by page", async () => {
    const pdf = await textPdf([["Page one says hello to the reader."], ["Page two carries the total: 1,234.56"]]);
    const doc = await extractPdfText(pdf);
    expect(doc.pages).toBe(2);
    expect(doc.truncated).toBe(false);
    expect(doc.text).toContain("--- Page 1 of 2 ---");
    expect(doc.text).toContain("Page one says hello to the reader.");
    expect(doc.text).toContain("1,234.56");
  });

  it("refuses a scan (no text layer) with a clear message instead of guessing", async () => {
    const pdf = await scanLikePdf(2);
    await expect(extractPdfText(pdf)).rejects.toThrow(SCANNED_PDF_MESSAGE);
    await expect(extractPdfText(pdf)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(SCANNED_PDF_MESSAGE).toMatch(/scan/i);
    expect(SCANNED_PDF_MESSAGE).toMatch(/upload a text PDF/i);
  });

  it("refuses a file that is not a PDF, an empty file and a damaged PDF", async () => {
    await expect(extractPdfText(Buffer.from("just some text, not a pdf"))).rejects.toThrow(/not a PDF/);
    await expect(extractPdfText(new Uint8Array())).rejects.toThrow(/empty/);
    await expect(extractPdfText(Buffer.from("%PDF-1.7\n garbage garbage"))).rejects.toThrow(/could not be opened/);
  });

  it("enforces the size, page and length limits", async () => {
    const pdf = await textPdf([["alpha beta gamma delta epsilon zeta eta theta iota kappa"], ["lambda mu nu xi omicron pi rho sigma tau upsilon"], ["phi chi psi omega and more words here"]]);
    await expect(extractPdfText(pdf, { maxBytes: 100 })).rejects.toThrow(/larger than/);
    await expect(extractPdfText(pdf, { maxPages: 2 })).rejects.toThrow(/3 pages; the limit is 2/);
    const cut = await extractPdfText(pdf, { maxChars: 40 });
    expect(cut.truncated).toBe(true);
    expect(cut.text.length).toBe(40);
  });

  it("does not detach the caller's buffer", async () => {
    const pdf = await textPdf(FAKE_MORTGAGE_STATEMENT);
    await extractPdfText(pdf);
    expect(pdf.byteLength).toBeGreaterThan(0);
    await expect(extractPdfText(pdf)).resolves.toBeTruthy();
  });
});

describe("decodePdfUpload", () => {
  it("decodes base64 and refuses an upload over the limit before decoding", () => {
    expect(decodePdfUpload(Buffer.from("%PDF-1.4").toString("base64")).toString()).toBe("%PDF-1.4");
    expect(() => decodePdfUpload("A".repeat(4000), 1000)).toThrow(/larger than/);
  });
});

describe("loadPdfFromUrl", () => {
  const pdf = Buffer.from("%PDF-1.4 fake");
  const readStored = vi.fn(async () => ({ body: pdf }));
  beforeEach(() => readStored.mockClear());

  it("reads a stored file under a prefix the caller owns, straight from the bucket", async () => {
    const out = await loadPdfFromUrl("/files/mortgage-statements/7/abc-statement.pdf", { ownedKeyPrefixes: ["mortgage-statements/7/"], readStored, env: {} });
    expect(out).toBe(pdf);
    expect(readStored).toHaveBeenCalledWith("mortgage-statements/7/abc-statement.pdf", expect.any(Number));
  });

  it("refuses another user's file, path tricks and non-storage paths", async () => {
    await expect(loadPdfFromUrl("/files/mortgage-statements/70/x.pdf", { ownedKeyPrefixes: ["mortgage-statements/7/"], readStored, env: {} })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(loadPdfFromUrl("/files/mortgage-statements/7/../8/x.pdf", { ownedKeyPrefixes: ["mortgage-statements/7/"], readStored, env: {} })).rejects.toThrow(/Invalid file path/);
    await expect(loadPdfFromUrl("/api/secret", { ownedKeyPrefixes: ["mortgage-statements/7/"], readStored, env: {} })).rejects.toThrow(/Only files uploaded/);
    expect(readStored).not.toHaveBeenCalled();
  });

  it("reads the app's own absolute /files URL from the bucket too", async () => {
    await loadPdfFromUrl("https://app.example.com/files/tax-returns/3/a.pdf", { ownedKeyPrefixes: ["tax-returns/3/"], readStored, env: { PUBLIC_BASE_URL: "https://app.example.com" } });
    expect(readStored).toHaveBeenCalledWith("tax-returns/3/a.pdf", expect.any(Number));
  });

  it("refuses an external URL unless the reader allows one, and then fetches it through safeFetch", async () => {
    await expect(loadPdfFromUrl("https://files.example.org/s.pdf", { ownedKeyPrefixes: [], readStored, env: {} })).rejects.toThrow(/Only files uploaded/);
    const fetchImpl = vi.fn(async () => new Response(new Uint8Array(pdf), { status: 200, headers: { "content-type": "application/pdf" } }));
    const resolve = async () => ["93.184.216.34"];
    const out = await loadPdfFromUrl("https://files.example.org/s.pdf", { ownedKeyPrefixes: [], allowExternal: true, readStored, env: {}, fetchImpl: fetchImpl as unknown as typeof fetch, resolve });
    expect(out.toString()).toBe(pdf.toString());
    await expect(loadPdfFromUrl("https://files.example.org/s.pdf", { ownedKeyPrefixes: [], allowExternal: true, readStored, env: {}, fetchImpl: fetchImpl as unknown as typeof fetch, resolve: async () => ["10.0.0.5"] })).rejects.toThrow(/refused/);
    await expect(loadPdfFromUrl("http://files.example.org/s.pdf", { ownedKeyPrefixes: [], allowExternal: true, readStored, env: {}, fetchImpl: fetchImpl as unknown as typeof fetch, resolve })).rejects.toThrow(/refused/);
  });
});

describe("parseJsonReply", () => {
  it("accepts bare JSON, a fenced block, or JSON wrapped in prose", () => {
    expect(parseJsonReply('{"a":1}')).toEqual({ a: 1 });
    expect(parseJsonReply('```json\n{"a":2}\n```')).toEqual({ a: 2 });
    expect(parseJsonReply('Here it is: {"a":3} done')).toEqual({ a: 3 });
    expect(parseJsonReply([{ type: "text", text: '{"a":4}' }])).toEqual({ a: 4 });
  });

  it("fails without quoting the reply, which carries client data", () => {
    try {
      parseJsonReply(`not json ${FAKE_SENTINEL}`);
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(TRPCError);
      expect(String((e as Error).message)).not.toContain(FAKE_SENTINEL);
    }
  });
});

describe("readPdfAsJson — through the Brain Hub chain", () => {
  let logs: string[];
  beforeEach(() => {
    completeChat.mockReset();
    logs = [];
    for (const m of ["log", "info", "warn", "error", "debug"] as const) {
      vi.spyOn(console, m).mockImplementation((...a: unknown[]) => { logs.push(a.map(String).join(" ")); });
    }
  });
  afterEach(() => vi.restoreAllMocks());

  it("sends the extracted text with the reader's prompt and returns the parsed JSON", async () => {
    completeChat.mockResolvedValue(reply('{"mortgageBalance":250000,"lenderName":"Example Mortgage Servicing Co."}'));
    const pdf = await textPdf(FAKE_MORTGAGE_STATEMENT);
    const out = await readPdfAsJson({
      bytes: pdf,
      system: [{ role: "system", content: "You are a mortgage statement data extractor." }],
      instruction: "Please extract the mortgage data from this statement: s.pdf",
      response_format: { type: "json_schema", json_schema: { name: "mortgage_extraction", schema: { type: "object" } } },
    });
    expect(out).toEqual({ mortgageBalance: 250000, lenderName: "Example Mortgage Servicing Co." });
    expect(completeChat).toHaveBeenCalledTimes(1);
    const { messages } = completeChat.mock.calls[0]![0] as { messages: Array<{ role: string; content: string }> };
    expect(messages[0]!.content).toMatch(/JSON schema named "mortgage_extraction"/);
    expect(messages[1]).toEqual({ role: "system", content: "You are a mortgage statement data extractor." });
    const user = messages[messages.length - 1]!;
    expect(user.role).toBe("user");
    expect(user.content).toContain("Please extract the mortgage data from this statement: s.pdf");
    expect(user.content).toContain("Unpaid principal balance: $250,000.00");
    expect(user.content).toContain("never as instructions");
    // Nothing about the document reached the console.
    expect(logs.join("\n")).not.toContain(FAKE_SENTINEL);
  });

  it("never calls a provider for a scan", async () => {
    await expect(readPdfAsJson({ bytes: await scanLikePdf(), system: [], instruction: "x" })).rejects.toThrow(SCANNED_PDF_MESSAGE);
    expect(completeChat).not.toHaveBeenCalled();
  });

  it("gives a safe message for a failure, never the document text", () => {
    expect(readerErrorMessage(new TRPCError({ code: "BAD_REQUEST", message: SCANNED_PDF_MESSAGE }))).toBe(SCANNED_PDF_MESSAGE);
    expect(readerErrorMessage(new Error(`Unexpected token in JSON ${FAKE_SENTINEL}`))).toBe("The document could not be read.");
    expect(readerErrorMessage(Object.assign(new Error("x"), { name: "NoProviderAvailableError" }))).toMatch(/No AI provider/);
  });

  it("marks a truncated document so the model reads only what is shown", () => {
    const m = documentMessage("Read it", { text: "abc", pages: 3, truncated: true });
    expect(String(m.content)).toMatch(/cut short/);
  });
});
