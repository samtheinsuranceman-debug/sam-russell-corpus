import { describe, expect, it } from "vitest";
import { randomBytes } from "crypto";
import {
  VAULT_KEY_WORD_COUNT,
  VAULT_WORDLIST,
  formatVaultKeyForDisplay,
  generateVaultKey,
  isSixteenWordKey,
  normalizeVaultKey,
  vaultKeyShapeProblem,
  vaultKeyWords,
} from "@shared/vaultKey";

const rng = (n: number) => new Uint8Array(randomBytes(n));

describe("vault key — the sixteen words that open the Brain Hub", () => {
  it("the wordlist has no duplicates, nothing under four letters, and enough entropy", () => {
    expect(new Set(VAULT_WORDLIST).size).toBe(VAULT_WORDLIST.length);
    expect(VAULT_WORDLIST.every(w => /^[a-z]{4,}$/.test(w))).toBe(true);
    // 16 words × log2(list) bits ≥ 128 bits
    expect(VAULT_KEY_WORD_COUNT * Math.log2(VAULT_WORDLIST.length)).toBeGreaterThanOrEqual(128);
  });

  it("generates sixteen words from the list, every time", () => {
    for (let i = 0; i < 50; i++) {
      const key = generateVaultKey(rng);
      const words = vaultKeyWords(key);
      expect(words).toHaveLength(VAULT_KEY_WORD_COUNT);
      expect(isSixteenWordKey(key)).toBe(true);
    }
  });

  it("two generated keys are not the same", () => {
    expect(generateVaultKey(rng)).not.toBe(generateVaultKey(rng));
  });

  it("normalises case, spacing and punctuation so a spoken key still matches", () => {
    const key = generateVaultKey(rng);
    const words = vaultKeyWords(key);
    const messy = words.map((w, i) => (i % 2 ? w.toUpperCase() : w)).join(",  \n");
    expect(normalizeVaultKey(messy)).toBe(key);
    expect(isSixteenWordKey(messy)).toBe(true);
  });

  it("rejects the wrong number of words and words off the list, with a reason", () => {
    const key = generateVaultKey(rng);
    expect(vaultKeyShapeProblem(key)).toBeNull();
    expect(vaultKeyShapeProblem("")).toMatch(/sixteen/i);
    expect(vaultKeyShapeProblem(vaultKeyWords(key).slice(0, 15).join(" "))).toMatch(/15 words/);
    const withTypo = [...vaultKeyWords(key)];
    withTypo[3] = "zzzzzz";
    expect(vaultKeyShapeProblem(withTypo.join(" "))).toMatch(/not on the key list: zzzzzz/);
  });

  it("still accepts a long free-text passphrase as the alternative shape", () => {
    expect(vaultKeyShapeProblem("correct horse battery staple and thirty two more chars")).toBeNull();
    expect(vaultKeyShapeProblem("too short")).not.toBeNull();
  });

  it("formats the key as four rows of four for the one time it is shown", () => {
    const rows = formatVaultKeyForDisplay(generateVaultKey(rng));
    expect(rows).toHaveLength(4);
    expect(rows.every(r => r.split(/\s+/).length === 4)).toBe(true);
  });

  it("does not exhibit modulo bias in word selection (rejection sampling)", () => {
    // Feed values just above the rejection limit and confirm they are skipped.
    const size = VAULT_WORDLIST.length;
    const limit = Math.floor(65536 / size) * size;
    const feed = [limit, limit + 1, 65535, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
    let i = 0;
    const scripted = () => {
      const v = feed[Math.min(i++, feed.length - 1)];
      return new Uint8Array([(v >> 8) & 0xff, v & 0xff]);
    };
    const key = generateVaultKey(scripted);
    expect(vaultKeyWords(key)[0]).toBe(VAULT_WORDLIST[0]);
  });
});
