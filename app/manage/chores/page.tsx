import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { listChores } from "@/lib/catalog/service";
import { groupByCategory } from "@/lib/catalog/category";
import { AddCatalogForm } from "@/components/catalog/AddCatalogForm";
import { CatalogItemCard } from "@/components/catalog/CatalogItemCard";
import { IconByName } from "@/components/icons/registry";
import manage from "@/components/manage/manage.module.css";

export const metadata: Metadata = { title: "Chores" };

export default async function ChoresPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (session.role !== "parent") redirect("/me");

  const chores = await listChores(getDb(), session.familyId);

  return (
    <main id="main" className={manage.main}>
      <Link href="/dashboard" className={manage.back}>
        <ArrowLeft size={18} aria-hidden="true" />
        Back to dashboard
      </Link>
      <h1 className={manage.title}>Chores</h1>

      <AddCatalogForm kind="chore" />

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
                  <CatalogItemCard
                    kind="chore"
                    item={{
                      id: c.id,
                      name: c.name,
                      emoji: c.emoji,
                      value: c.points,
                      description: c.description,
                      isActive: c.isActive,
                      category: c.category,
                      pinned: c.pinned,
                      limitPeriod: c.limitPeriod,
                      limitCount: c.limitCount,
                    }}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))
      ) : (
        <p className={manage.empty}>No chores yet — add your first above.</p>
      )}
    </main>
  );
}
