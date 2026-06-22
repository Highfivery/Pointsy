/**
 * Rasterize public/icon.svg into the PNG sizes the PWA manifest references.
 * Run with: npm run icons:generate
 *
 * The source SVG already includes maskable safe-zone padding, so the maskable
 * icon is the same artwork at 512px.
 */
import sharp from "sharp";
import { readFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const svg = await readFile(new URL("public/icon.svg", root));
const outDir = new URL("public/icons/", root);
await mkdir(outDir, { recursive: true });

const targets = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "maskable-512.png", size: 512 },
  { name: "apple-touch-icon.png", size: 180 },
];

for (const { name, size } of targets) {
  const dest = fileURLToPath(new URL(name, outDir));
  await sharp(svg).resize(size, size).png().toFile(dest);
  console.log(`✓ ${name} (${size}×${size})`);
}
