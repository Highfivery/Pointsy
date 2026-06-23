import { describe, it, expect } from "vitest";
import { generateFamilyCode, familyCodePrefix } from "@/lib/auth/family-code";

describe("familyCodePrefix", () => {
  it("uppercases and strips non-alphanumerics", () => {
    expect(familyCodePrefix("The Marshalls!")).toBe("THEMA");
  });

  it("falls back to FAM for too-short names", () => {
    expect(familyCodePrefix("A")).toBe("FAM");
    expect(familyCodePrefix("")).toBe("FAM");
  });
});

describe("generateFamilyCode", () => {
  it("formats as PREFIX-SUFFIX", () => {
    const code = generateFamilyCode("Marshall");
    expect(code).toMatch(/^MARSH-[A-Z0-9]{3}$/);
  });

  it("avoids ambiguous characters (no 0,O,1,I,L) in the suffix", () => {
    for (let i = 0; i < 200; i++) {
      const suffix = generateFamilyCode("Test").split("-")[1];
      expect(suffix).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{3}$/);
    }
  });

  it("is reasonably unique across calls", () => {
    const codes = new Set(
      Array.from({ length: 100 }, () => generateFamilyCode("Smith")),
    );
    // With ~29k suffix combinations, 100 draws should rarely collide.
    expect(codes.size).toBeGreaterThan(90);
  });
});
