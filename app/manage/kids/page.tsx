import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { listKids } from "@/lib/people/service";
import { AddKidForm } from "@/components/manage/AddKidForm";
import { KidCard } from "@/components/manage/KidCard";
import styles from "@/components/manage/manage.module.css";

export const metadata: Metadata = { title: "Manage kids" };

export default async function ManageKidsPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (session.role !== "parent") redirect("/me");

  const kids = await listKids(getDb(), session.familyId);

  return (
    <main id="main" className={styles.main}>
      <Link href="/dashboard" className={styles.back}>
        <ArrowLeft size={18} aria-hidden="true" />
        Back to dashboard
      </Link>
      <h1 className={styles.title}>Kids</h1>

      <AddKidForm />

      {kids.length > 0 ? (
        <ul className={styles.list}>
          {kids.map((kid) => (
            <li key={kid.id}>
              <KidCard
                kid={{
                  id: kid.id,
                  name: kid.name,
                  avatar: kid.avatar,
                  color: kid.color,
                  isActive: kid.isActive,
                }}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.empty}>No children yet — add your first above.</p>
      )}
    </main>
  );
}
