"use client";

import { House, Gift, ListChecks, Trophy, Users, Plus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { BottomNav, type BottomNavItem } from "@/components/ui/BottomNav";

type Section = "rewards" | "chores" | "challenges" | "kids";

const SECTIONS: Record<
  Section,
  {
    href: string;
    label: string;
    Icon: LucideIcon;
    addHref: string;
    addLabel: string;
  }
> = {
  rewards: {
    href: "/manage/rewards",
    label: "Rewards",
    Icon: Gift,
    addHref: "/manage/rewards/new",
    addLabel: "Add a reward",
  },
  chores: {
    href: "/manage/chores",
    label: "Chores",
    Icon: ListChecks,
    addHref: "/manage/chores/new",
    addLabel: "Add a chore",
  },
  challenges: {
    href: "/manage/challenges",
    label: "Challenges",
    Icon: Trophy,
    addHref: "/manage/challenges/new",
    addLabel: "Add a challenge",
  },
  kids: {
    href: "/manage/kids",
    label: "Kids",
    Icon: Users,
    addHref: "/manage/kids/new",
    addLabel: "Add a kid",
  },
};

/** Contextual [Dashboard · Section · Add] bottom nav for the manage screens. */
export function ManageNav({ section }: { section: Section }) {
  const s = SECTIONS[section];
  const items: readonly BottomNavItem[] = [
    { href: "/dashboard", label: "Dashboard", Icon: House },
    { href: s.href, label: s.label, Icon: s.Icon },
    { href: s.addHref, label: s.addLabel, Icon: Plus, accent: true },
  ];
  return <BottomNav items={items} label="Manage" />;
}
