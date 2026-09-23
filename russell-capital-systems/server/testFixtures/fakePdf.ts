// Small PDFs generated at test time for the document-reader tests. Every value
// in them is invented: no real client, lender, carrier or tax data.
import PDFDocument from "pdfkit";

function render(draw: (doc: PDFKit.PDFDocument) => void): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "LETTER", margin: 50, info: { Title: "Test fixture", Producer: "test", Creator: "test" } });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    draw(doc);
    doc.end();
  });
}

/** A text PDF: one array of lines per page. */
export function textPdf(pages: string[][]): Promise<Buffer> {
  return render((doc) => {
    pages.forEach((lines, i) => {
      if (i > 0) doc.addPage();
      for (const line of lines) doc.text(line);
    });
  });
}

/** A PDF with pages but no text layer, as a scanner produces (shapes only). */
export function scanLikePdf(pageCount = 1): Promise<Buffer> {
  return render((doc) => {
    for (let i = 0; i < pageCount; i++) {
      if (i > 0) doc.addPage();
      doc.rect(60, 60, 480, 20).fill("#999999");
      doc.rect(60, 100, 400, 12).fill("#bbbbbb");
    }
  });
}

/** Sentinel strings the tests look for in logs; they must never appear there. */
export const FAKE_SENTINEL = "ZZFAKE-7731";

export const FAKE_MORTGAGE_STATEMENT = [[
  "Example Mortgage Servicing Co. (test fixture)",
  `Borrower: Pat Example ${FAKE_SENTINEL}`,
  "Property: 100 Sample Street, Testville, ZZ 00000",
  "Unpaid principal balance: $250,000.00",
  "Interest rate: 6.125%",
  "Monthly payment (principal and interest): $1,519.03",
  "Remaining term: 312 months",
  "Escrow balance: $1,200.00",
]];

export const FAKE_TAX_RETURN = [
  [
    "Form 1040 (test fixture, not a real return) Tax year 2024",
    `Filer: Jordan Sample ${FAKE_SENTINEL}   Spouse: Casey Sample`,
    "Filing status: Married filing jointly   Dependents: 2",
    "Wages, salaries, tips: 150,000",
    "Taxable interest: 1,200   Ordinary dividends: 3,400",
  ],
  [
    "Adjusted gross income: 154,600",
    "Standard deduction: 29,200   Taxable income: 125,400",
    "Total tax: 18,700   Refund: 1,300",
  ],
];

export const FAKE_ILLUSTRATION = [
  [
    "Sample Life Insurance Company (test fixture)",
    "Product: Example Indexed UL   Insured: Test Person, Male, age 45, ZZ",
    `Annual premium: $20,000   Death benefit: $1,000,000   Illustrated rate: 6.00% ${FAKE_SENTINEL}`,
  ],
  [
    "Year Age Premium CashValue SurrenderValue DeathBenefit Loan",
    "1 46 20,000 15,000 5,000 1,000,000 0",
    "2 47 20,000 31,000 22,000 1,000,000 0",
    "3 48 20,000 48,000 41,000 1,000,000 0",
  ],
];
