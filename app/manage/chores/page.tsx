import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { listChores } from "@/lib/catalog/service";
import { getAssigneesByChore } from "@/lib/chores/assignment";
import { getKidBalances } from "@/lib/points/service";
import { groupByCategory } from "@/lib/catalog/category";
import { ChoreRow } from "@/components/catalog/ChoreRow";
import { IconByName } from "@/components/icons/registry";
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

  return (
    <main id="main" className={manage.main}>
      <Link href="/dashboard" className={manage.back}>
        <ArrowLeft size={18} aria-hidden="true" />
        Back to dashboard
      </Link>
      <h1 className={manage.title}>Chores</h1>

      <Link href="/manage/chores/new" className={manage.addBtn}>
        <Plus size={18} aria-hidden="true" />
        Add a chore
      </Link>

      {chores.length > 0 ? (
        groupByCategory(chores).map(({ meta, items }) => (
          <section
            key={meta.key}
            className={manage.section}
            aria-label={meta.label}
          >
            <h2 className={manage.sectionTitle}>
              <IconByName name={meta.icon} size={18} />
              {meta.label}
            </h2>
            <ul className={manage.list}>
              {items.map((c) => (
                <li key={c.id}>
                  <ChoreRow
                    item={{
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
                    }}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))
      ) : (
        <p className={manage.empty}>No chores yet — add your first.</p>
      )}
    </main>
  );
}
