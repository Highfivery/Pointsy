import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { getKidBalances } from "@/lib/points/service";
import { listCategories } from "@/lib/categories/service";
import { ChoreEditor } from "@/components/catalog/ChoreEditor";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { ManageNav } from "@/components/manage/ManageNav";
import manage from "@/components/manage/manage.module.css";

export const metadata: Metadata = { title: "Add a chore" };

export default async function NewChorePage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (session.role !== "parent") redirect("/me");

  const db = getDb();
  const [kids, categories] = await Promise.all([
    getKidBalances(db, session.familyId),
    listCategories(db, session.familyId),
  ]);

  return (
    <main id="main" className={manage.main}>
      <ScreenHeader
        title="Add a chore"
        intro="Set the points, who it’s for, and how often it counts."
      />
      <ChoreEditor
        kids={kids.map((k) => ({
          id: k.id,
          name: k.name,
          avatar: k.avatar,
          color: k.color,
        }))}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      />
      <ManageNav section="chores" />
    </main>
  );
}
