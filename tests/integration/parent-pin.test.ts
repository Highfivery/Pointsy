import { describe, it, expect, beforeEach } from "vitest";
import { registerFamily } from "@/lib/auth/register";
import { setPin, lookupFamilyByCode, verifyPin } from "@/lib/people/service";
import { createTestDb, type TestDb } from "../helpers/test-db";

describe("parent quick-PIN", () => {
  let ctx: TestDb;
  beforeEach(async () => {
    ctx = await createTestDb();
  });

  it("a parent appears in the picker only after setting a PIN, and verifies", async () => {
    const { db } = ctx;
    const fam = await registerFamily(db, {
      familyName: "Fam",
      parentName: "Pat",
      email: `p.${Math.random()}@example.com`,
      password: "supersecret1",
    });

    // No PIN yet → not pickable.
    let lookup = await lookupFamilyByCode(db, fam.familyCode);
    expect(lookup?.members).toHaveLength(0);

    // Set a PIN → the parent shows up in the picker.
    await setPin(db, fam.familyId, fam.personId, "1122");
    lookup = await lookupFamilyByCode(db, fam.familyCode);
    expect(lookup?.members.map((m) => m.name)).toEqual(["Pat"]);
    expect(lookup?.members[0].role).toBe("parent");

    // And the PIN verifies.
    const result = await verifyPin(db, fam.familyId, fam.personId, "1122");
    expect(result.status).toBe("ok");
  });
});
