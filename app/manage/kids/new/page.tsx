import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { AddKidForm } from "@/components/manage/AddKidForm";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { ManageNav } from "@/components/manage/ManageNav";
import styles from "@/components/manage/manage.module.css";

export const metadata: Metadata = { title: "Add a kid" };

export default async function NewKidPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (session.role !== "parent") redirect("/me");

  return (
    <main id="main" className={styles.main}>
      <ScreenHeader
        title="Add a kid"
        intro="Name, avatar, and a 4-digit PIN they’ll use to sign in."
      />
      <AddKidForm />
      <ManageNav section="kids" />
    </main>
  );
}
