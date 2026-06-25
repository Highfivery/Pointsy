import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { listKids } from "@/lib/people/service";
import { KidCard } from "@/components/manage/KidCard";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { ManageNav } from "@/components/manage/ManageNav";
import styles from "@/components/manage/manage.module.css";

export const metadata: Metadata = { title: "Manage kids" };

export default async function ManageKidsPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (session.role !== "parent") redirect("/me");

  const kids = await listKids(getDb(), session.familyId);

  return (
    <main id="main" className={styles.main}>
      <ScreenHeader title="Kids" intro="Profiles, avatars, and sign-in PINs." />

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
        <p className={styles.empty}>
          No children yet — tap “Add a kid” to add your first.
        </p>
      )}

      <ManageNav section="kids" />
    </main>
  );
}
