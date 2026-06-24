import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { getKidBalances } from "@/lib/points/service";
import { ChoreEditor } from "@/components/catalog/ChoreEditor";
import manage from "@/components/manage/manage.module.css";

export const metadata: Metadata = { title: "New chore" };

export default async function NewChorePage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (session.role !== "parent") redirect("/me");

  const kids = await getKidBalances(getDb(), session.familyId);

  return (
    <main id="main" className={manage.main}>
      <Link href="/manage/chores" className={manage.back}>
        <ArrowLeft size={18} aria-hidden="true" />
        Back to chores
      </Link>
      <h1 className={manage.title}>New chore</h1>
      <ChoreEditor
        kids={kids.map((k) => ({
          id: k.id,
          name: k.name,
          avatar: k.avatar,
          color: k.color,
        }))}
      />
    </main>
  );
}
