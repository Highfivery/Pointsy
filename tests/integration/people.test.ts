import { describe, it, expect, beforeEach } from "vitest";
import { registerFamily } from "@/lib/auth/register";
import {
  addKid,
  updateKid,
  setPin,
  setKidActive,
  listKids,
  lookupFamilyByCode,
  verifyPin,
  MAX_PIN_ATTEMPTS,
} from "@/lib/people/service";
import { createTestDb, type TestDb } from "../helpers/test-db";

async function newFamily(db: TestDb["db"], name = "Fam") {
  return registerFamily(db, {
    familyName: name,
    parentName: "Parent",
    email: `p.${name}.${Math.random()}@example.com`,
    password: "supersecret1",
  });
}

describe("people service", () => {
  let ctx: TestDb;
  beforeEach(async () => {
    ctx = await createTestDb();
  });

  it("adds kids with incrementing sort order and lists them", async () => {
    const { db } = ctx;
    const fam = await newFamily(db);
    const a = await addKid(db, fam.familyId, {
      name: "Ava",
      avatar: "🦊",
      color: "#4338ca",
      pin: "1234",
    });
    const b = await addKid(db, fam.familyId, {
      name: "Bo",
      avatar: "🐼",
      color: "#15803d",
      pin: "5678",
    });
    expect(a.role).toBe("kid");
    expect(a.pinHash).toBeTruthy();
    expect(a.pinHash).not.toContain("1234");
    expect(a.sortOrder).toBe(0);
    expect(b.sortOrder).toBe(1);

    const kids = await listKids(db, fam.familyId);
    expect(kids.map((k) => k.name)).toEqual(["Ava", "Bo"]);
  });

  it("updates a kid's profile", async () => {
    const { db } = ctx;
    const fam = await newFamily(db);
    const kid = await addKid(db, fam.familyId, {
      name: "Ava",
      avatar: "🦊",
      color: "#4338ca",
      pin: "1234",
    });
    await updateKid(db, fam.familyId, kid.id, {
      name: "Ava B.",
      avatar: "🐱",
      color: "#b91c1c",
    });
    const [updated] = await listKids(db, fam.familyId);
    expect(updated.name).toBe("Ava B.");
    expect(updated.avatar).toBe("🐱");
  });

  it("verifies PINs and locks out after too many failures", async () => {
    const { db } = ctx;
    const fam = await newFamily(db);
    const kid = await addKid(db, fam.familyId, {
      name: "Ava",
      avatar: "🦊",
      color: "#4338ca",
      pin: "1234",
    });

    const good = await verifyPin(db, fam.familyId, kid.id, "1234");
    expect(good.status).toBe("ok");

    // Wrong attempts decrement the remaining count...
    for (let i = 1; i < MAX_PIN_ATTEMPTS; i++) {
      const r = await verifyPin(db, fam.familyId, kid.id, "0000");
      expect(r).toEqual({ status: "invalid", remaining: MAX_PIN_ATTEMPTS - i });
    }
    // ...the final failure locks the account.
    const locked = await verifyPin(db, fam.familyId, kid.id, "0000");
    expect(locked.status).toBe("locked");

    // Even the correct PIN is rejected while locked.
    const stillLocked = await verifyPin(db, fam.familyId, kid.id, "1234");
    expect(stillLocked.status).toBe("locked");

    // After the lock expires, the correct PIN works again.
    const until = locked.status === "locked" ? locked.until : new Date();
    const afterExpiry = await verifyPin(
      db,
      fam.familyId,
      kid.id,
      "1234",
      new Date(until.getTime() + 1000),
    );
    expect(afterExpiry.status).toBe("ok");
  });

  it("setPin resets the lockout", async () => {
    const { db } = ctx;
    const fam = await newFamily(db);
    const kid = await addKid(db, fam.familyId, {
      name: "Ava",
      avatar: "🦊",
      color: "#4338ca",
      pin: "1234",
    });
    for (let i = 0; i < MAX_PIN_ATTEMPTS; i++) {
      await verifyPin(db, fam.familyId, kid.id, "0000");
    }
    await setPin(db, fam.familyId, kid.id, "9999");
    const r = await verifyPin(db, fam.familyId, kid.id, "9999");
    expect(r.status).toBe("ok");
  });

  it("lookupFamilyByCode returns only PIN-capable active members, scoped to the family", async () => {
    const { db } = ctx;
    const fam = await newFamily(db, "Marsh");
    const ava = await addKid(db, fam.familyId, {
      name: "Ava",
      avatar: "🦊",
      color: "#4338ca",
      pin: "1234",
    });
    const bo = await addKid(db, fam.familyId, {
      name: "Bo",
      avatar: "🐼",
      color: "#15803d",
      pin: "5678",
    });
    await setKidActive(db, fam.familyId, bo.id, false);

    // A different family must not leak in.
    const other = await newFamily(db, "Other");
    await addKid(db, other.familyId, {
      name: "Zed",
      avatar: "🐧",
      color: "#92400e",
      pin: "1111",
    });

    const lookup = await lookupFamilyByCode(db, fam.familyCode);
    expect(lookup?.familyName).toBe("Marsh");
    // Parent has no PIN → excluded; deactivated Bo → excluded; only Ava remains.
    expect(lookup?.members.map((m) => m.name)).toEqual(["Ava"]);
    expect(lookup?.members[0].id).toBe(ava.id);
    // No sensitive fields leak.
    expect(Object.keys(lookup!.members[0])).toEqual([
      "id",
      "name",
      "avatar",
      "color",
      "role",
    ]);
  });

  it("lookupFamilyByCode returns null for an unknown code", async () => {
    const { db } = ctx;
    expect(await lookupFamilyByCode(db, "NOPE-XYZ")).toBeNull();
  });
});
