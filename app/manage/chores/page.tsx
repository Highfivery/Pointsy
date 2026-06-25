import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { listChores } from "@/lib/catalog/service";
import { getAssigneesByChore } from "@/lib/chores/assignment";
import { getKidBalances } from "@/lib/points/service";
import { groupByCategory } from "@/lib/catalog/category";
import {
  ChoreCatalog,
  type ChoreGroup,
} from "@/components/catalog/ChoreCatalog";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { ManageNav } from "@/components/manage/ManageNav";
import type { Chore } from "@/lib/db/schema";
import manage from "@/components/manage/manage.module.css";

export const metadata: Metadata = { title: "Chores" };

export default async function ChoresPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (session.role !== "parent") redirect("/me");

  const db = getDb();
  const chores = await listChores(db, session.familyId);
  const [assignees, kids] = await Promise.all([
    getAssigneesByChore(
      db,
      chores.map((c) => c.id),
    ),
    getKidBalances(db, session.familyId),
  ]);
  const nameById = new Map(kids.map((k) => [k.id, k.name]));
  const nameOf = (id: string) => nameById.get(id) ?? "A kid";

  function whoLabel(c: Chore): string | null {
    if (c.assignment === "everyone") return null;
    if (c.assignment === "rotating") {
      return c.currentTurnPersonId
        ? `${nameOf(c.currentTurnPersonId)}'s turn`
        : "Takes turns";
    }
    const names = (assignees.get(c.id) ?? []).map(nameOf);
    return names.length > 0 ? names.join(", ") : "No one yet";
  }

  const groups: ChoreGroup[] = groupByCategory(chores).map(
    ({ meta, items }) => ({
      meta,
      items: items.map((c) => ({
        id: c.id,
        name: c.name,
        emoji: c.emoji,
        points: c.points,
        isActive: c.isActive,
        pinned: c.pinned,
        isCore: c.isCore,
        limitPeriod: c.limitPeriod,
        limitCount: c.limitCount,
        whoLabel: whoLabel(c),
      })),
    }),
  );

  return (
    <main id="main" className={manage.main}>
      <ScreenHeader title="Chores" intro="Ways for kids to earn points." />

      {groups.length > 0 ? (
        <ChoreCatalog groups={groups} />
      ) : (
        <p className={manage.empty}>
          No chores yet — tap “Add a chore” to add your first.
        </p>
      )}

      <ManageNav section="chores" />
    </main>
  );
}
