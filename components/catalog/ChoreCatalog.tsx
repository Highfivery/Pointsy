"use client";

import { useState } from "react";
import { IconByName } from "@/components/icons/registry";
import { ChoreRow, type ChoreRowItem } from "./ChoreRow";
import type { CategoryMeta } from "@/lib/catalog/category";
import manage from "@/components/manage/manage.module.css";
import styles from "./catalog.module.css";

export interface ChoreGroup {
  meta: CategoryMeta;
  items: ChoreRowItem[];
}

/**
 * Client wrapper for the chores overview: category filter chips above the
 * grouped, self-contained chore cards.
 */
export function ChoreCatalog({ groups }: { groups: ChoreGroup[] }) {
  const [active, setActive] = useState<string | null>(null);
  const shown = active ? groups.filter((g) => g.meta.id === active) : groups;
  const total = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <div className={styles.catalog}>
      {groups.length > 1 ? (
        <fieldset className={styles.filterRow}>
          <legend className="sr-only">Filter by category</legend>
          <button
            type="button"
            className={styles.filterChip}
            data-active={active === null}
            aria-pressed={active === null}
            onClick={() => setActive(null)}
          >
            All
            <span className={styles.filterCount}>{total}</span>
          </button>
          {groups.map((g) => (
            <button
              key={g.meta.id}
              type="button"
              className={styles.filterChip}
              data-active={active === g.meta.id}
              aria-pressed={active === g.meta.id}
              onClick={() => setActive(g.meta.id)}
            >
              <IconByName name={g.meta.icon} size={15} />
              {g.meta.name}
              <span className={styles.filterCount}>{g.items.length}</span>
            </button>
          ))}
        </fieldset>
      ) : null}

      {shown.map(({ meta, items }) => (
        <section
          key={meta.id}
          className={manage.section}
          aria-label={meta.name}
        >
          <h2 className={manage.sectionTitle}>
            <IconByName name={meta.icon} size={18} />
            {meta.name}
          </h2>
          <ul className={manage.list}>
            {items.map((c) => (
              <li key={c.id}>
                <ChoreRow item={c} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
