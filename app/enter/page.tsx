import type { Metadata } from "next";
import { getKnownFamily } from "@/lib/auth/device";
import { PickerScreen } from "@/components/enter/PickerScreen";

export const metadata: Metadata = { title: "Sign in with your PIN" };

export default async function EnterPage() {
  const family = await getKnownFamily();
  return <PickerScreen initialFamily={family} />;
}
