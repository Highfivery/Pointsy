"use client";

import { House, ListTodo, Gift } from "lucide-react";
import { BottomNav, type BottomNavItem } from "@/components/ui/BottomNav";

const TABS: readonly BottomNavItem[] = [
  { href: "/me", label: "Home", Icon: House },
  { href: "/submit", label: "Chores", Icon: ListTodo },
  { href: "/redeem", label: "Rewards", Icon: Gift },
];

/** Fixed bottom navigation for the kid's three screens. */
export function KidTabBar() {
  return <BottomNav items={TABS} />;
}
