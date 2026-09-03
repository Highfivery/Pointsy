"use client";

import { useMemo, useState } from "react";
import { Search, Star, Users } from "lucide-react";
import { IconByName } from "@/components/icons/registry";
import { Chip } from "@/components/ui/Chip";
import { awardChoreAction } from "@/app/actions/points";
import { formatChoreLimit } from "@/lib/catalog/limit";
import type { CategoryMeta } from "@/lib/catalog/category";
import styles from "./points.module.css";

export interface AwardChore {
  id: string;
  name: string;
  emoji: string;
  points: number;
  categoryId: string;
  pinned: boolean;
  limitPeriod: "none" | "day" | "week";
  limitCount: number;
  limitScope: "per_kid" | "total";
  isCore: boolean;
}

/**
 * The parent chore board: search plus chores grouped into Most used →
 * Favourites → category sections. Tapping a chore awards it (instantly) to the
 * current kid plus any "also give to" picks made above (`alsoIds`).
 */
export function AwardBoard({
  kidId,
  chores,
  categories,
  mostUsedIds,
  alsoIds,
}: {
  kidId: string;
  chores: AwardChore[];
  categories: CategoryMeta[];
  mostUsedIds: string[];
  alsoIds: string[];
}) {
  const [query, setQuery] = useState("");

  const recipients = useMemo(() => [kidId, ...alsoIds], [kidId, alsoIds]);
  const byId = useMemo(() => new Map(chores.map((c) => [c.id, c])), [chores]);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? chores.filter((c) => c.name.toLowerCase().includes(q))
    : null;

  const mostUsed = mostUsedIds
    .map((id) => byId.get(id))
    .filter((c): c is AwardChore => Boolean(c))
    .slice(0, 6);
  const favourites = chores.filter((c) => c.pinned);

  function card(c: AwardChore) {
    const limit = formatChoreLimit(c.limitPeriod, c.limitCount);
    return (
      <form key={c.id} action={awardChoreAction} className={styles.choreForm}>
        <input type="hidden" name="choreId" value={c.id} />
        {recipients.map((r) => (
          <input key={r} type="hidden" name="kidId" value={r} />
        ))}
        <button type="submit" className={styles.choreBtn}>
          <span className={styles.choreIcon}>
            <IconByName name={c.emoji} size={24} />
          </span>
          <span className={styles.choreName}>{c.name}</span>
          {c.limitScope === "total" ? (
            <Chip variant="accent">
              <Users size={12} aria-hidden="true" />
              Shared
            </Chip>
          ) : c.isCore ? (
            <Chip variant="neutral">Core</Chip>
          ) : null}
          <span className={styles.chorePoints}>+{c.points}</span>
          <span className={styles.choreBadge}>{limit ?? "Anytime"}</span>
        </button>
      </form>
    );
  }

  return (
    <div className={styles.board}>
      <div className={styles.searchRow}>
        <Search size={18} aria-hidden="true" className={styles.searchIcon} />
        <input
          type="search"
          className={styles.search}
          placeholder="Search chores…"
          aria-label="Search chores"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {filtered ? (
        filtered.length > 0 ? (
          <div className={styles.choreGrid}>{filtered.map(card)}</div>
        ) : (
          <p className={styles.empty}>No chores match “{query}”.</p>
        )
      ) : (
        <>
          {mostUsed.length > 0 && (
            <section className={styles.group} aria-label="Most used chores">
              <h3 className={styles.groupTitle}>Most used</h3>
              <div className={styles.choreGrid}>{mostUsed.map(card)}</div>
            </section>
          )}
          {favourites.length > 0 && (
            <section className={styles.group} aria-label="Favourite chores">
              <h3 className={styles.groupTitle}>
                <Star size={16} aria-hidden="true" /> Favourites
              </h3>
              <div className={styles.choreGrid}>{favourites.map(card)}</div>
            </section>
          )}
          {categories.map((cat) => {
            const items = chores.filter((c) => c.categoryId === cat.id);
            if (items.length === 0) return null;
            return (
              <details key={cat.id} open className={styles.group}>
                <summary className={styles.groupSummary}>
                  <IconByName name={cat.icon} size={16} />
                  {cat.name}
                  <span className={styles.groupCount}>{items.length}</span>
                </summary>
                <div className={styles.choreGrid}>{items.map(card)}</div>
              </details>
            );
          })}
        </>
      )}
    </div>
  );
}
