import { and, eq } from "drizzle-orm";
import type { Database } from "./types";
import { families, people, type Family, type Person } from "./schema";

/** All queries take an explicit `db` so they're testable against PGlite. */

export async function getFamilyByCode(
  db: Database,
  code: string,
): Promise<Family | undefined> {
  const [row] = await db
    .select()
    .from(families)
    .where(eq(families.code, code.toUpperCase()))
    .limit(1);
  return row;
}

export async function getParentByEmail(
  db: Database,
  email: string,
): Promise<Person | undefined> {
  const [row] = await db
    .select()
    .from(people)
    .where(
      and(eq(people.email, email.toLowerCase()), eq(people.role, "parent")),
    )
    .limit(1);
  return row;
}

export async function getPersonById(
  db: Database,
  familyId: string,
  id: string,
): Promise<Person | undefined> {
  const [row] = await db
    .select()
    .from(people)
    .where(and(eq(people.familyId, familyId), eq(people.id, id)))
    .limit(1);
  return row;
}

/** Active members of a family, ordered for the profile picker. */
export async function listFamilyMembers(
  db: Database,
  familyId: string,
): Promise<Person[]> {
  return db
    .select()
    .from(people)
    .where(and(eq(people.familyId, familyId), eq(people.isActive, true)))
    .orderBy(people.sortOrder, people.createdAt);
}
