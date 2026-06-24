import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { getChore } from "@/lib/catalog/service";
import { getAssigneeIds } from "@/lib/chores/assignment";
import { getSubtasks } from "@/lib/chores/subtasks";
import { getKidBalances } from "@/lib/points/service";
import { ChoreEditor } from "@/components/catalog/ChoreEditor";
import { ChoreDangerZone } from "@/components/catalog/ChoreDangerZone";
import manage from "@/components/manage/manage.module.css";

export const metadata: Metadata = { title: "Edit chore" };

export default async function EditChorePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (session.role !== "parent") redirect("/me");

  const db = getDb();
  const chore = await getChore(db, session.familyId, id);
  if (!chore) redirect("/manage/chores");

  const [assigneeIds, subtasks, kids] = await Promise.all([
    getAssigneeIds(db, chore.id),
    getSubtasks(db, chore.id),
    getKidBalances(db, session.familyId),
  ]);

  return (
    <main id="main" className={manage.main}>
      <Link href="/manage/chores" className={manage.back}>
        <ArrowLeft size={18} aria-hidden="true" />
        Back to chores
      </Link>
      <h1 className={manage.title}>Edit chore</h1>
      <ChoreEditor
        kids={kids.map((k) => ({
          id: k.id,
          name: k.name,
          avatar: k.avatar,
          color: k.color,
        }))}
        defaults={{
          id: chore.id,
          name: chore.name,
          emoji: chore.emoji,
          points: chore.points,
          category: chore.category,
          description: chore.description,
          isCore: chore.isCore,
          assignment: chore.assignment,
          kidIds: assigneeIds,
          subtasks,
          limitPeriod: chore.limitPeriod,
          limitCount: chore.limitCount,
        }}
      />
      <ChoreDangerZone
        id={chore.id}
        name={chore.name}
        isActive={chore.isActive}
      />
    </main>
  );
}
