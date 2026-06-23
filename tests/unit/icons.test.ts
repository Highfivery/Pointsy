import { describe, it, expect } from "vitest";
import { HelpCircle } from "lucide-react";
import { ALL_ICON_KEYS, isIconKey } from "@/lib/icons";
import { getIcon, iconLabel } from "@/components/icons/registry";

describe("icon registry", () => {
  it("has a labelled component for every icon key", () => {
    for (const key of ALL_ICON_KEYS) {
      expect(getIcon(key), `missing component for "${key}"`).not.toBe(
        HelpCircle,
      );
      expect(iconLabel(key), `missing label for "${key}"`).not.toBe("Icon");
    }
  });

  it("isIconKey validates membership", () => {
    expect(isIconKey("rocket")).toBe(true);
    expect(isIconKey("not-a-real-icon")).toBe(false);
    expect(isIconKey(42)).toBe(false);
  });
});
