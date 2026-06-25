import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { listRewards } from "@/lib/catalog/service";
import { CatalogItemCard } from "@/components/catalog/CatalogItemCard";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { ManageNav } from "@/components/manage/ManageNav";
import manage from "@/components/manage/manage.module.css";

export const metadata: Metadata = { title: "Rewards" };

export default async function RewardsPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (session.role !== "parent") redirect("/me");

  const rewards = await listRewards(getDb(), session.familyId);

  return (
    <main id="main" className={manage.main}>
      <ScreenHeader
        title="Rewards"
        intro="Things kids can spend their points on."
      />

      {rewards.length > 0 ? (
        <ul className={manage.list}>
          {rewards.map((r) => (
            <li key={r.id}>
              <CatalogItemCard
                kind="reward"
                item={{
                  id: r.id,
                  name: r.name,
                  emoji: r.emoji,
                  value: r.cost,
                  description: r.description,
                  isActive: r.isActive,
                  isTeam: r.isTeam,
                  minKids: r.minKids,
                  allowSolo: r.allowSolo,
                }}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className={manage.empty}>
          No rewards yet — tap “Add a reward” to create your first.
        </p>
      )}

      <ManageNav section="rewards" />
    </main>
  );
}
