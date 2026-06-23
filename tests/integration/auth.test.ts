import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  registerFamily,
  authenticateParent,
  EmailTakenError,
  CONSENT_VERSION,
} from "@/lib/auth/register";
import { getParentByEmail, listFamilyMembers } from "@/lib/db/queries";
import { createTestDb, type TestDb } from "../helpers/test-db";

describe("auth service", () => {
  let ctx: TestDb;

  beforeAll(async () => {
    ctx = await createTestDb();
  });

  afterAll(async () => {
    await ctx.close();
  });

  it("registers a family with a parent and records consent", async () => {
    const { db } = ctx;
    const result = await registerFamily(db, {
      familyName: "The Marshalls",
      parentName: "Ben",
      email: "Ben@Example.com",
      password: "supersecret1",
    });

    expect(result.familyId).toBeTruthy();
    expect(result.familyCode).toMatch(/^[A-Z0-9]+-[A-Z0-9]+$/);

    const parent = await getParentByEmail(db, "ben@example.com");
    expect(parent?.name).toBe("Ben");
    expect(parent?.email).toBe("ben@example.com"); // normalized to lowercase
    expect(parent?.role).toBe("parent");
    expect(parent?.passwordHash).toBeTruthy();
    expect(parent?.passwordHash).not.toContain("supersecret1"); // hashed
    expect(parent?.consentVersion).toBe(CONSENT_VERSION);
    expect(parent?.consentAt).toBeInstanceOf(Date);
  });

  it("rejects a duplicate email", async () => {
    const { db } = ctx;
    await registerFamily(db, {
      familyName: "First",
      parentName: "Dup",
      email: "dup@example.com",
      password: "supersecret1",
    });

    await expect(
      registerFamily(db, {
        familyName: "Second",
        parentName: "Dup2",
        email: "dup@example.com",
        password: "anotherpass1",
      }),
    ).rejects.toBeInstanceOf(EmailTakenError);
  });

  it("authenticates with the correct password and rejects otherwise", async () => {
    const { db } = ctx;
    await registerFamily(db, {
      familyName: "Auth Fam",
      parentName: "Alex",
      email: "alex@example.com",
      password: "correct-horse",
    });

    const ok = await authenticateParent(
      db,
      "alex@example.com",
      "correct-horse",
    );
    expect(ok?.name).toBe("Alex");

    expect(
      await authenticateParent(db, "alex@example.com", "wrong"),
    ).toBeNull();
    expect(await authenticateParent(db, "nobody@example.com", "x")).toBeNull();
  });

  it("keeps families isolated", async () => {
    const { db } = ctx;
    const a = await registerFamily(db, {
      familyName: "Isolated A",
      parentName: "Anna",
      email: "anna@example.com",
      password: "supersecret1",
    });
    const b = await registerFamily(db, {
      familyName: "Isolated B",
      parentName: "Bob",
      email: "bob@example.com",
      password: "supersecret1",
    });

    const membersA = await listFamilyMembers(db, a.familyId);
    const membersB = await listFamilyMembers(db, b.familyId);

    expect(membersA.map((m) => m.name)).toEqual(["Anna"]);
    expect(membersB.map((m) => m.name)).toEqual(["Bob"]);
    expect(membersA.every((m) => m.familyId === a.familyId)).toBe(true);
  });
});
