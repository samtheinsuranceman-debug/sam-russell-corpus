import { describe, it, expect } from "vitest";
import {
  validateAttachment,
  ATTACHMENT_TTL_HOURS,
  checkUploadQuota,
  UPLOAD_WINDOW_HOURS,
  UPLOAD_QUOTA_BYTES,
  UPLOAD_QUOTA_FILES,
} from "./messaging";

const MB = 1024 * 1024;

describe("messaging attachment limits (schematic §4)", () => {
  it("attachment files are ephemeral — 72-hour purge", () => {
    expect(ATTACHMENT_TTL_HOURS).toBe(72);
  });

  it("images allowed to 10MB", () => {
    expect(validateAttachment("image/jpeg", 9 * MB).ok).toBe(true);
    expect(validateAttachment("image/png", 11 * MB).ok).toBe(false);
  });

  it("documents allowed to 25MB", () => {
    expect(validateAttachment("application/pdf", 24 * MB).ok).toBe(true);
    expect(validateAttachment("application/pdf", 26 * MB).ok).toBe(false);
  });

  it("voice notes allowed to 5MB", () => {
    expect(validateAttachment("audio/webm", 4 * MB).ok).toBe(true);
    expect(validateAttachment("audio/mpeg", 6 * MB).ok).toBe(false);
  });

  it("short videos allowed to 30MB (transport-limited until presigned uploads)", () => {
    expect(validateAttachment("video/mp4", 29 * MB).ok).toBe(true);
    expect(validateAttachment("video/mp4", 31 * MB).ok).toBe(false);
  });

  it("unsupported types are rejected", () => {
    expect(validateAttachment("application/x-msdownload", 1 * MB).ok).toBe(false);
    expect(validateAttachment("application/zip", 1 * MB).ok).toBe(false);
  });
});

describe("48-hour upload quota", () => {
  it("is 250MB and 50 files per rolling 48h window", () => {
    expect(UPLOAD_WINDOW_HOURS).toBe(48);
    expect(UPLOAD_QUOTA_BYTES).toBe(250 * MB);
    expect(UPLOAD_QUOTA_FILES).toBe(50);
  });

  it("allows uploads within the window allowance", () => {
    expect(checkUploadQuota(100 * MB, 10, 20 * MB).ok).toBe(true);
    expect(checkUploadQuota(0, 0, 30 * MB).ok).toBe(true);
  });

  it("rejects when the byte allowance would be exceeded", () => {
    const r = checkUploadQuota(240 * MB, 10, 20 * MB);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("48");
  });

  it("rejects the 51st file regardless of size", () => {
    expect(checkUploadQuota(1 * MB, 50, 1).ok).toBe(false);
  });
});
