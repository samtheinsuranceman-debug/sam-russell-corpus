/**
 * The four document readers, end to end through their tRPC procedures:
 * illustration comparison upload, mortgage statement, tax return upload and
 * tax return from a stored file. Each reads a PDF generated here with invented
 * data, extracts its text on the server and asks the Brain Hub chain, whose
 * provider call is stubbed. Storage and the database are stubbed too.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FAKE_ILLUSTRATION, FAKE_MORTGAGE_STATEMENT, FAKE_SENTINEL, FAKE_TAX_RETURN, scanLikePdf, textPdf } from "./testFixtures/fakePdf";

const completeChat = vi.fn();
vi.mock("./providerRegistry", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./providerRegistry")>()),
  completeChat: (...a: unknown[]) => completeChat(...a),
}));

const stored = new Map<string, Buffer>();
vi.mock("./storage", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./storage")>()),
  storagePut: vi.fn(async (key: string, data: Buffer) => { stored.set(key, Buffer.from(data)); return { key, url: `/files/${key}` }; }),
  storageGetBytes: vi.fn(async (key: string) => {
    const body = stored.get(key);
    if (!body) throw new Error("NoSuchKey");
    return { body, contentType: "application/pdf" };
  }),
}));

vi.mock("./hiveGround", () => ({ hiveGroundingMessages: vi.fn(async () => []) }));

const illustrationUpdates: Array<Record<string, unknown>> = [];
const fakeDb = {
  insert: () => ({ values: async () => [{ insertId: 501 }] }),
  update: () => ({ set: (v: Record<string, unknown>) => ({ where: async () => { illustrationUpdates.push(v); } }) }),
};
const uploadClientDocument = vi.fn(async () => ({ id: 1 }));
const logClientActivity = vi.fn(async () => null);
vi.mock("./db", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./db")>()),
  getDb: vi.fn(async () => fakeDb),
  getOrCreateWorkspace: vi.fn(async () => ({ id: 42 })),
  getWorkspaceByOwnerId: vi.fn(async () => ({ id: 42 })),
  ensureMembership: vi.fn(async () => undefined),
  uploadClientDocument: (...a: unknown[]) => uploadClientDocument(...(a as [])),
  logClientActivity: (...a: unknown[]) => logClientActivity(...(a as [])),
}));

const { appRouter } = await import("./routers");

const user = { id: 7, openId: "test-user", name: "Test Advisor", email: "advisor@example.test", role: "user" } as never;
const caller = () => appRouter.createCaller({ user, req: {} as never, res: {} as never });
const anon = () => appRouter.createCaller({ user: null, req: {} as never, res: {} as never });
const reply = (text: string) => ({ text, providerId: "stub-provider", model: "stub-model", attempted: [] });
const lastUserMessage = () => {
  const { messages } = completeChat.mock.calls.at(-1)![0] as { messages: Array<{ role: string; content: string }> };
  return messages[messages.length - 1]!.content;
};

let logs: string[];
beforeEach(() => {
  completeChat.mockReset();
  uploadClientDocument.mockClear();
  logClientActivity.mockClear();
  illustrationUpdates.length = 0;
  stored.clear();
  logs = [];
  for (const m of ["log", "info", "warn", "error", "debug"] as const) {
    vi.spyOn(console, m).mockImplementation((...a: unknown[]) => { logs.push(a.map(String).join(" ")); });
  }
});
afterEach(() => {
  // Whatever happened, the document's text never reached the console.
  expect(logs.join("\n")).not.toContain(FAKE_SENTINEL);
  vi.restoreAllMocks();
});

describe("illustration comparison upload", () => {
  it("reads the illustration's text through the chain and stores the extraction", async () => {
    completeChat.mockResolvedValue(reply(JSON.stringify({
      carrier: "Sample Life Insurance Company", productName: "Example Indexed UL", insuredAge: 45, annualPremium: 20000,
      deathBenefit: 1000000, illustratedRate: 0.06, yearByYear: [{ year: 1, age: 46, premium: 20000, cashValue: 15000, surrenderValue: 5000, deathBenefit: 1000000, annualLoan: 0 }],
    })));
    const pdf = await textPdf(FAKE_ILLUSTRATION);
    const res = await caller().illustrationCompare.upload({ fileName: "illustration.pdf", fileDataBase64: pdf.toString("base64") });
    expect(res).toEqual({ id: 501, status: "extracting" });
    await vi.waitFor(() => expect(illustrationUpdates.length).toBe(1));
    expect(illustrationUpdates[0]).toMatchObject({ status: "ready", carrier: "Sample Life Insurance Company", annualPremium: "20000", illustratedRate: "0.06" });
    expect(illustrationUpdates[0]!.yearByYear).toHaveLength(1);
    expect(lastUserMessage()).toContain("1 46 20,000 15,000 5,000 1,000,000 0");
    expect(lastUserMessage()).toContain("Please extract the structured data from this insurance illustration PDF:");
  });

  it("marks a scanned illustration as an error with the scan message, without calling a provider", async () => {
    const pdf = await scanLikePdf();
    await caller().illustrationCompare.upload({ fileName: "scan.pdf", fileDataBase64: pdf.toString("base64") });
    await vi.waitFor(() => expect(illustrationUpdates.length).toBe(1));
    expect(illustrationUpdates[0]).toMatchObject({ status: "error" });
    expect(String(illustrationUpdates[0]!.errorMessage)).toMatch(/scan.*upload a text PDF/i);
    expect(completeChat).not.toHaveBeenCalled();
  });

  it("refuses a file that is not a PDF before storing it, and keeps its auth", async () => {
    await expect(caller().illustrationCompare.upload({ fileName: "x.pdf", fileDataBase64: Buffer.from("hello").toString("base64") })).rejects.toThrow(/PDF/);
    expect(stored.size).toBe(0);
    await expect(anon().illustrationCompare.upload({ fileName: "x.pdf", fileDataBase64: "JVBERi0=" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});

describe("mortgage statement reader", () => {
  it("reads the user's uploaded statement and returns the extraction as before", async () => {
    const extraction = { mortgageBalance: 250000, mortgageRate: 0.06125, monthlyMortgagePayment: 1519.03, monthlyInterestOnlyPayment: 1276.04, totalInterestPayments: 0, mortgageTermMonths: 312, homeMarketValue: 0, lenderName: "Example Mortgage Servicing Co.", propertyAddress: "100 Sample Street", escrowBalance: 1200 };
    completeChat.mockResolvedValue(reply("```json\n" + JSON.stringify(extraction) + "\n```"));
    const pdf = await textPdf(FAKE_MORTGAGE_STATEMENT);
    const { url } = await caller().mortgageKiller.uploadStatement({ fileName: "statement.pdf", fileBase64: pdf.toString("base64") });
    expect(url).toMatch(/^\/files\/mortgage-statements\/7\//);
    const out = await caller().mortgageKiller.extractStatement({ fileUrl: url, fileName: "statement.pdf" });
    expect(out).toEqual(extraction);
    expect(lastUserMessage()).toContain("Interest rate: 6.125%");
    const { messages } = completeChat.mock.calls[0]![0] as { messages: Array<{ content: string }> };
    expect(messages[0]!.content).toContain('"mortgage_extraction"');
  });

  it("will not read another user's statement", async () => {
    stored.set("mortgage-statements/8/abc-statement.pdf", await textPdf(FAKE_MORTGAGE_STATEMENT));
    await expect(caller().mortgageKiller.extractStatement({ fileUrl: "/files/mortgage-statements/8/abc-statement.pdf", fileName: "s.pdf" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(completeChat).not.toHaveBeenCalled();
  });

  it("returns the scan message for a scanned statement", async () => {
    const { url } = await caller().mortgageKiller.uploadStatement({ fileName: "scan.pdf", fileBase64: (await scanLikePdf()).toString("base64") });
    await expect(caller().mortgageKiller.extractStatement({ fileUrl: url, fileName: "scan.pdf" })).rejects.toThrow(/scan.*upload a text PDF/i);
    expect(completeChat).not.toHaveBeenCalled();
  });

  it("keeps its auth", async () => {
    await expect(anon().mortgageKiller.extractStatement({ fileUrl: "/files/mortgage-statements/7/a.pdf", fileName: "a.pdf" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});

describe("tax return upload reader", () => {
  it("reads the return, stores it as a client document and returns { fileUrl, extracted }", async () => {
    completeChat.mockResolvedValue(reply(JSON.stringify({ filingStatus: "married_filing_jointly", taxYear: 2024, adjustedGrossIncome: 154600, dependents: 2 })));
    const pdf = await textPdf(FAKE_TAX_RETURN);
    const out = await caller().taxReturnOcr.uploadAndExtract({ clientId: 3, fileName: "return 2024.pdf", fileBase64: pdf.toString("base64") });
    expect(out.fileUrl).toMatch(/^\/files\/tax-returns\/42\/3\/[0-9a-f]+-return_2024\.pdf$/);
    expect(out.extracted).toMatchObject({ taxYear: 2024, adjustedGrossIncome: 154600 });
    expect(uploadClientDocument).toHaveBeenCalledTimes(1);
    expect(logClientActivity).toHaveBeenCalledTimes(1);
    expect(lastUserMessage()).toContain("Adjusted gross income: 154,600");
    expect(lastUserMessage()).toContain("--- Page 2 of 2 ---");
  });

  it("refuses a scan before storing anything", async () => {
    const pdf = await scanLikePdf();
    await expect(caller().taxReturnOcr.uploadAndExtract({ clientId: 3, fileName: "scan.pdf", fileBase64: pdf.toString("base64") })).rejects.toThrow(/scan.*upload a text PDF/i);
    expect(stored.size).toBe(0);
    expect(uploadClientDocument).not.toHaveBeenCalled();
    expect(completeChat).not.toHaveBeenCalled();
  });
});

describe("tax return reader for a stored file", () => {
  it("reads a return stored in this workspace", async () => {
    stored.set("tax-returns/42/3/abc-return.pdf", await textPdf(FAKE_TAX_RETURN));
    completeChat.mockResolvedValue(reply(JSON.stringify({ filingStatus: "married_filing_jointly", taxYear: 2024, adjustedGrossIncome: 154600 })));
    const out = await caller().taxReturnOcr.extractFromUrl({ fileUrl: "/files/tax-returns/42/3/abc-return.pdf", fileName: "return.pdf" });
    expect(out).toMatchObject({ taxYear: 2024, adjustedGrossIncome: 154600 });
    expect(lastUserMessage()).toContain("Wages, salaries, tips: 150,000");
  });

  it("refuses another workspace's file and any external URL", async () => {
    stored.set("tax-returns/99/3/abc-return.pdf", await textPdf(FAKE_TAX_RETURN));
    await expect(caller().taxReturnOcr.extractFromUrl({ fileUrl: "/files/tax-returns/99/3/abc-return.pdf", fileName: "r.pdf" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller().taxReturnOcr.extractFromUrl({ fileUrl: "https://files.example.org/r.pdf", fileName: "r.pdf" })).rejects.toThrow(/Only files uploaded/);
    expect(completeChat).not.toHaveBeenCalled();
  });
});
