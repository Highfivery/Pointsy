"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlsoGiveTo, type AwardKid } from "./AlsoGiveTo";
import { AwardBoard, type AwardChore } from "./AwardBoard";
import { AwardExtras } from "./AwardExtras";
import { formatNameList } from "@/lib/domain/names";
import type { CategoryMeta } from "@/lib/catalog/category";
import styles from "./points.module.css";

/**
 * Everything a parent can give on one kid's award screen, sharing a single set
 * of recipients: the "also give to" picks apply to the custom award/deduct
 * form *and* to one-tap chores (issue #159 — the picks used to be scoped to
 * the chore board, so points typed into the form above only reached one kid).
 */
export function AwardSurface({
  kidId,
  kidName,
  chores,
  categories,
  mostUsedIds,
  otherKids,
  initialMode,
}: {
  kidId: string;
  kidName: string;
  chores: AwardChore[];
  categories: CategoryMeta[];
  mostUsedIds: string[];
  otherKids: AwardKid[];
  initialMode: "award" | "deduct";
}) {
  const [also, setAlso] = useState<string[]>([]);

  // Keep the picks in the kids' display order, and drop any that no longer
  // exist (a kid removed in another tab).
  const alsoKids = useMemo(
    () => otherKids.filter((k) => also.includes(k.id)),
    [otherKids, also],
  );
  const recipients = useMemo(
    () => [
      { id: kidId, name: kidName },
      ...alsoKids.map((k) => ({ id: k.id, name: k.name })),
    ],
    [kidId, kidName, alsoKids],
  );
  const nameById = useMemo(() => {
    const map: Record<string, string> = { [kidId]: kidName };
    for (const k of otherKids) map[k.id] = k.name;
    return map;
  }, [kidId, kidName, otherKids]);

  function toggleAlso(id: string) {
    setAlso((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  return (
    <>
      {otherKids.length > 0 && (
        <AlsoGiveTo
          kids={otherKids}
          selected={alsoKids.map((k) => k.id)}
          onToggle={toggleAlso}
          hint={
            alsoKids.length > 0
              ? `Points and chores below apply to ${formatNameList(
                  recipients.map((r) => r.name),
                )}.`
              : undefined
          }
        />
      )}

      <AwardExtras
        recipients={recipients}
        nameById={nameById}
        initialMode={initialMode}
      />

      <section aria-labelledby="chores-title">
        <h2 id="chores-title" className={styles.sectionTitle}>
          Award a chore
        </h2>
        {chores.length > 0 ? (
          <AwardBoard
            kidId={kidId}
            chores={chores}
            categories={categories}
            mostUsedIds={mostUsedIds}
            alsoIds={alsoKids.map((k) => k.id)}
          />
        ) : (
          <p className={styles.empty}>
            No chores yet. <Link href="/manage/chores">Add some first</Link>.
          </p>
        )}
      </section>
    </>
  );
}
