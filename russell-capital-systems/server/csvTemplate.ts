/**
 * Russell Capital Systems™ — Bulk CSV Import Protocol
 *
 * This module defines the official CSV template and protocol for bulk client imports.
 * It is served via the /api/csv-template endpoint and used by the client-side CSV parser.
 */

export const CSV_PROTOCOL = {
  version: "1.0",
  maxRows: 500,
  requiredFields: ["name"],
  supportedFields: [
    { field: "name", type: "string", required: true, description: "Full client name", aliases: ["name", "full name", "client name", "client"], example: "Jane Smith" },
    { field: "email", type: "string", required: false, description: "Email address", aliases: ["email", "email address", "e-mail"], example: "jane@example.com" },
    { field: "phone", type: "string", required: false, description: "Phone number", aliases: ["phone", "phone number", "mobile", "cell"], example: "555-0100" },
    { field: "age", type: "number", required: false, description: "Client age in years", aliases: ["age"], example: "58" },
    { field: "income", type: "number", required: false, description: "Annual income in USD (no $ or commas needed)", aliases: ["income", "annual income", "salary", "earnings"], example: "250000" },
    { field: "iraBalance", type: "number", required: false, description: "Traditional IRA balance in USD", aliases: ["ira", "ira balance", "irabalance", "traditional ira"], example: "800000" },
    { field: "rothBalance", type: "number", required: false, description: "Roth IRA balance in USD", aliases: ["roth", "roth balance", "rothbalance", "roth ira"], example: "120000" },
    { field: "taxableAssets", type: "number", required: false, description: "Taxable brokerage/investment account balance in USD", aliases: ["taxable", "taxable assets", "taxableassets", "brokerage"], example: "300000" },
    { field: "realEstateEquity", type: "number", required: false, description: "Total real estate equity in USD", aliases: ["real estate", "real estate equity", "realestateequity", "property", "re equity"], example: "1200000" },
    { field: "lifeInsuranceCv", type: "number", required: false, description: "Life insurance cash value in USD", aliases: ["life insurance", "life insurance cv", "lifeinsurancecv", "cash value"], example: "50000" },
    { field: "filingStatus", type: "enum", required: false, description: "Tax filing status: single, joint, or hoh", aliases: ["filing status", "filingstatus", "filing", "tax status"], example: "joint", values: ["single", "joint", "hoh"] },
    { field: "notes", type: "string", required: false, description: "Free-text notes or comments", aliases: ["notes", "comments", "memo"], example: "High net worth client, interested in Roth conversion" },
  ],
  parsingRules: [
    "RFC 4180 compliant: fields containing commas, quotes, or newlines must be enclosed in double quotes",
    "Escaped quotes: use double-double-quotes inside quoted fields (e.g., \"\"Smith, Jr.\"\")",
    "Tab-separated files (TSV) are also accepted — auto-detected from first row",
    "Header row is required — column names are case-insensitive and alias-matched",
    "Dollar signs ($) and commas in numeric values are automatically stripped",
    "Empty rows and rows without a name field are silently skipped",
    "Maximum 500 rows per import batch",
    "Supported file extensions: .csv, .tsv, .txt",
  ],
} as const;

/** Generate the CSV template string with headers and sample rows */
export function generateCSVTemplate(): string {
  const headers = CSV_PROTOCOL.supportedFields.map(f => f.field);
  const sampleRows = [
    // Row 1: High net worth joint filer
    [
      "Heather Scenario", "heather@example.com", "555-0101", "64", "142000",
      "1200000", "350000", "500000", "1800000", "75000", "joint",
      "Roth conversion candidate with significant IRA balance",
    ],
    // Row 2: Young professional single filer
    [
      "David Mercer", "david.mercer@example.com", "555-0202", "38", "310000",
      "250000", "80000", "400000", "600000", "0", "single",
      "Tech executive interested in real estate diversification",
    ],
    // Row 3: Retiree head of household
    [
      "Lauren Hall", "lauren.hall@example.com", "555-0303", "72", "95000",
      "2100000", "0", "180000", "350000", "120000", "hoh",
      "RMD planning needed; life insurance review",
    ],
    // Row 4: Minimal data (only required field + a few extras)
    [
      "Marcus Webb", "", "", "45", "420000",
      "", "", "750000", "", "", "",
      "New prospect from referral",
    ],
    // Row 5: Full data joint filer
    [
      "Sandra Kim", "sandra.kim@example.com", "555-0505", "55", "175000",
      "900000", "200000", "300000", "1500000", "60000", "joint",
      "Interested in IUL and tax-efficient income strategies",
    ],
  ];

  const lines = [headers.join(",")];
  for (const row of sampleRows) {
    lines.push(row.map(v => {
      // Quote fields that contain commas, quotes, or newlines
      if (v.includes(",") || v.includes('"') || v.includes("\n")) {
        return `"${v.replace(/"/g, '""')}"`;
      }
      return v;
    }).join(","));
  }
  return lines.join("\n") + "\n";
}

/** Generate a JSON protocol document describing the CSV import format */
export function generateProtocolDoc(): object {
  return {
    protocol: "Russell Capital Systems™ — Bulk CSV Import Protocol",
    version: CSV_PROTOCOL.version,
    description: "This document describes the CSV format accepted by the Russell Capital Systems™ bulk client import feature.",
    endpoint: "POST /api/trpc/clients.bulkImport (via tRPC mutation)",
    templateEndpoint: "GET /api/csv-template (downloads .csv file)",
    protocolEndpoint: "GET /api/csv-protocol (returns this JSON document)",
    limits: {
      maxRowsPerBatch: CSV_PROTOCOL.maxRows,
      maxFileSizeMB: 16,
      supportedExtensions: [".csv", ".tsv", ".txt"],
    },
    fields: CSV_PROTOCOL.supportedFields.map(f => ({
      field: f.field,
      type: f.type,
      required: f.required,
      description: f.description,
      acceptedColumnHeaders: f.aliases,
      example: f.example,
      ...(f.type === "enum" ? { allowedValues: (f as any).values } : {}),
    })),
    parsingRules: CSV_PROTOCOL.parsingRules,
    responseFormat: {
      imported: "number — count of successfully imported clients",
      errors: "array — list of { row: number, name: string, error: string } for failed rows",
      total: "number — total rows submitted",
    },
    examples: {
      minimalRow: "Jane Smith",
      fullRow: '"Jane Smith",jane@example.com,555-0100,58,250000,800000,120000,300000,1200000,50000,joint,"High net worth client"',
      quotedField: '"Smith, Jr.",john@example.com,,65,180000,,,,,,,"Requires special attention"',
    },
  };
}
