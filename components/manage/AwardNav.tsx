"use client";

import { House, ListChecks, Gift } from "lucide-react";
import { BottomNav, type BottomNavItem } from "@/components/ui/BottomNav";

const ITEMS: readonly BottomNavItem[] = [
  { href: "/dashboard", label: "Dashboard", Icon: House },
  { href: "/manage/chores", label: "Chores", Icon: ListChecks },
  { href: "/manage/rewards", label: "Rewards", Icon: Gift },
];

/** Bottom nav for the award screen — back to the hub plus the catalogs. */
export function AwardNav() {
  return <BottomNav items={ITEMS} label="Award" />;
}
