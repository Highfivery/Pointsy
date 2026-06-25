"use client";

import { Users, ListChecks, Gift, Trophy, UserPlus } from "lucide-react";
import { BottomNav, type BottomNavItem } from "@/components/ui/BottomNav";

const ITEMS: readonly BottomNavItem[] = [
  { href: "/manage/kids", label: "Kids", Icon: Users },
  { href: "/manage/chores", label: "Chores", Icon: ListChecks },
  { href: "/manage/rewards", label: "Rewards", Icon: Gift },
  { href: "/manage/challenges", label: "Challenges", Icon: Trophy },
  { href: "/manage/parents", label: "Parents", Icon: UserPlus },
];

/** Fixed bottom navigation for the parent dashboard — quick access to each
 *  management section. */
export function DashboardNav() {
  return <BottomNav items={ITEMS} label="Manage" />;
}
