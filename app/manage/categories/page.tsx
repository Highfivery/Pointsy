import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { listCategoriesWithCounts } from "@/lib/categories/service";
import { CategoryManager } from "@/components/manage/CategoryManager";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { ManageNav } from "@/components/manage/ManageNav";
import styles from "@/components/manage/manage.module.css";

export const metadata: Metadata = { title: "Categories" };

export default async function ManageCategoriesPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (session.role !== "parent") redirect("/me");

  const categories = await listCategoriesWithCounts(getDb(), session.familyId);

  return (
    <main id="main" className={styles.main}>
      <ScreenHeader
        title="Categories"
        intro="The groups your chores are organised into. Add, rename, reorder, or remove them."
      />

      <CategoryManager
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          icon: c.icon,
          choreCount: c.choreCount,
        }))}
      />

      <ManageNav section="categories" />
    </main>
  );
}
