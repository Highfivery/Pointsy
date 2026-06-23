import { describe, it, expect, beforeEach } from "vitest";
import {
  registerFamily,
  authenticateParent,
  EmailTakenError,
} from "@/lib/auth/register";
import {
  createParentInvite,
  redeemParentInvite,
  listParents,
  listPendingInvites,
  removeParent,
  InviteInvalidError,
  NotOwnerError,
  CannotRemoveParentError,
  INVITE_TTL_MS,
} from "@/lib/parents/service";
import { getPersonById } from "@/lib/db/queries";
import { createTestDb, type TestDb } from "../helpers/test-db";

async function newFamily(db: TestDb["db"], name = "Fam", ownerEmail?: string) {
  return registerFamily(db, {
    familyName: name,
    parentName: "Owner",
    email: ownerEmail ?? `owner.${name}.${Math.random()}@example.com`,
    password: "supersecret1",
  });
}

describe("parents & invites", () => {
  let ctx: TestDb;
  beforeEach(async () => {
    ctx = await createTestDb();
  });

  it("redeems an invite to add a co-parent who can sign in", async () => {
    const { db } = ctx;
    const fam = await newFamily(db);
    const { code } = await createParentInvite(db, fam.familyId, fam.personId);

    const res = await redeemParentInvite(db, {
      code,
      name: "Robin",
      email: "co@example.com",
      password: "supersecret2",
    });
    expect(res.familyId).toBe(fam.familyId);

    const auth = await authenticateParent(db, "co@example.com", "supersecret2");
    expect(auth?.id).toBe(res.personId);

    const parents = await listParents(db, fam.familyId);
    expect(parents.map((p) => p.name).sort()).toEqual(["Owner", "Robin"]);
    expect(parents.find((p) => p.id === fam.personId)?.isOwner).toBe(true);
    expect(parents.find((p) => p.id === res.personId)?.isOwner).toBe(false);

    // Both parents default to the neutral person avatar.
    const owner = await getPersonById(db, fam.familyId, fam.personId);
    const coParent = await getPersonById(db, res.familyId, res.personId);
    expect(owner?.avatar).toBe("person");
    expect(coParent?.avatar).toBe("person");
  });

  it("invites are single-use", async () => {
    const { db } = ctx;
    const fam = await newFamily(db);
    const { code } = await createParentInvite(db, fam.familyId, fam.personId);
    await redeemParentInvite(db, {
      code,
      name: "A",
      email: "a@example.com",
      password: "supersecret2",
    });
    await expect(
      redeemParentInvite(db, {
        code,
        name: "B",
        email: "b@example.com",
        password: "supersecret2",
      }),
    ).rejects.toBeInstanceOf(InviteInvalidError);
  });

  it("rejects an expired invite", async () => {
    const { db } = ctx;
    const fam = await newFamily(db);
    const { code } = await createParentInvite(
      db,
      fam.familyId,
      fam.personId,
      new Date(0),
    );
    await expect(
      redeemParentInvite(
        db,
        { code, name: "A", email: "a@example.com", password: "supersecret2" },
        new Date(INVITE_TTL_MS + 1000),
      ),
    ).rejects.toBeInstanceOf(InviteInvalidError);
  });

  it("rejects a taken email", async () => {
    const { db } = ctx;
    const fam = await newFamily(db, "Fam", "owner@example.com");
    const { code } = await createParentInvite(db, fam.familyId, fam.personId);
    await expect(
      redeemParentInvite(db, {
        code,
        name: "A",
        email: "owner@example.com",
        password: "supersecret2",
      }),
    ).rejects.toBeInstanceOf(EmailTakenError);
  });

  it("keeps invites scoped to their own family", async () => {
    const { db } = ctx;
    const a = await newFamily(db, "A");
    const b = await newFamily(db, "B");
    const { code } = await createParentInvite(db, a.familyId, a.personId);
    const res = await redeemParentInvite(db, {
      code,
      name: "Co",
      email: "co@example.com",
      password: "supersecret2",
    });
    expect(res.familyId).toBe(a.familyId);
    expect((await listParents(db, b.familyId)).map((p) => p.name)).toEqual([
      "Owner",
    ]);
  });

  it("only the owner can remove, and the owner can't be removed", async () => {
    const { db } = ctx;
    const fam = await newFamily(db);
    const { code } = await createParentInvite(db, fam.familyId, fam.personId);
    const co = await redeemParentInvite(db, {
      code,
      name: "Co",
      email: "co@example.com",
      password: "supersecret2",
    });

    await expect(
      removeParent(db, fam.familyId, co.personId, fam.personId),
    ).rejects.toBeInstanceOf(NotOwnerError);
    await expect(
      removeParent(db, fam.familyId, fam.personId, fam.personId),
    ).rejects.toBeInstanceOf(CannotRemoveParentError);

    await removeParent(db, fam.familyId, fam.personId, co.personId);
    expect((await listParents(db, fam.familyId)).map((p) => p.name)).toEqual([
      "Owner",
    ]);
    expect(
      await authenticateParent(db, "co@example.com", "supersecret2"),
    ).toBeNull();
  });

  it("lists only pending (non-redeemed, non-expired) invites", async () => {
    const { db } = ctx;
    const fam = await newFamily(db);
    const { code } = await createParentInvite(db, fam.familyId, fam.personId);
    await createParentInvite(db, fam.familyId, fam.personId);
    expect((await listPendingInvites(db, fam.familyId)).length).toBe(2);
    await redeemParentInvite(db, {
      code,
      name: "Co",
      email: "co@example.com",
      password: "supersecret2",
    });
    expect((await listPendingInvites(db, fam.familyId)).length).toBe(1);
  });
});
