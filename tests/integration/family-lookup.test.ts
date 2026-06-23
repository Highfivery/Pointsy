import { describe, it, expect, beforeEach } from "vitest";
import { registerFamily } from "@/lib/auth/register";
import {
  addKid,
  setPin,
  lookupFamilyById,
  lookupFamilyByCode,
} from "@/lib/people/service";
import { createTestDb, type TestDb } from "../helpers/test-db";

describe("lookupFamilyById (device-remembered family)", () => {
  let ctx: TestDb;
  beforeEach(async () => {
    ctx = await createTestDb();
  });

  it("matches lookupFamilyByCode and lists only PIN-capable members", async () => {
    const { db } = ctx;
    const fam = await registerFamily(db, {
      familyName: "Smiths",
      parentName: "Pat",
      email: "pat@example.com",
      password: "supersecret1",
    });
    await addKid(db, fam.familyId, {
      name: "Ava",
      avatar: "cat",
      color: "#4338ca",
      pin: "1234",
    });

    // Parent has no PIN yet → not in the picker.
    let byId = await lookupFamilyById(db, fam.familyId);
    expect(byId?.familyName).toBe("Smiths");
    expect(byId?.members.map((m) => m.name)).toEqual(["Ava"]);

    // Give the parent a PIN → they now appear, same as lookup-by-code.
    await setPin(db, fam.familyId, fam.personId, "1122");
    byId = await lookupFamilyById(db, fam.familyId);
    const byCode = await lookupFamilyByCode(db, fam.familyCode);
    expect(byId?.members.map((m) => m.name).sort()).toEqual(["Ava", "Pat"]);
    expect(byId).toEqual(byCode);
  });

  it("returns null for an unknown family id", async () => {
    const { db } = ctx;
    expect(
      await lookupFamilyById(db, "00000000-0000-0000-0000-000000000000"),
    ).toBeNull();
  });
});
