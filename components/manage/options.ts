/** Preset accent colors for kid profiles (distinct, AAA-friendly). */
export const COLOR_OPTIONS = [
  { name: "Indigo", value: "#4338ca" },
  { name: "Blue", value: "#1d4ed8" },
  { name: "Teal", value: "#0f766e" },
  { name: "Green", value: "#15803d" },
  { name: "Amber", value: "#92400e" },
  { name: "Red", value: "#b91c1c" },
  { name: "Purple", value: "#6b21a8" },
  { name: "Pink", value: "#be185d" },
] as const;

export const DEFAULT_COLOR = COLOR_OPTIONS[0].value;
export const DEFAULT_AVATAR = "🙂";
