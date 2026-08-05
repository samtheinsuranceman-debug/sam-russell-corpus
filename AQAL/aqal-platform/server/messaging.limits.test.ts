import { describe, it, expect } from "vitest";
import { validateAttachment, ATTACHMENT_TTL_HOURS } from "./messaging";

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
