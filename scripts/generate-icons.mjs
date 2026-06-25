/**
 * Rasterize public/icon.svg into the PNG sizes the PWA manifest references,
 * plus the browser favicon (app/favicon.ico).
 * Run with: npm run icons:generate
 *
 * The source SVG fills the canvas edge-to-edge, so the maskable icon is the
 * same artwork at 512px (its content sits well inside the maskable safe zone).
 */
import sharp from "sharp";
import { readFile, writeFile, mkdir } from "node:fs/promises";
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

/** Assemble a multi-resolution .ico whose entries are PNG-encoded images. */
async function buildIco(sizes, dest) {
  const pngs = await Promise.all(
    sizes.map((s) => sharp(svg).resize(s, s).png().toBuffer()),
  );
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(sizes.length, 4); // image count

  const entries = [];
  let offset = 6 + sizes.length * 16;
  pngs.forEach((png, i) => {
    const size = sizes[i];
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0); // width (0 ⇒ 256)
    e.writeUInt8(size >= 256 ? 0 : size, 1); // height
    e.writeUInt8(0, 2); // palette size
    e.writeUInt8(0, 3); // reserved
    e.writeUInt16LE(1, 4); // color planes
    e.writeUInt16LE(32, 6); // bits per pixel
    e.writeUInt32LE(png.length, 8); // image size
    e.writeUInt32LE(offset, 12); // image offset
    offset += png.length;
    entries.push(e);
  });

  await writeFile(dest, Buffer.concat([header, ...entries, ...pngs]));
}

const icoDest = fileURLToPath(new URL("app/favicon.ico", root));
await buildIco([16, 32, 48], icoDest);
console.log("✓ app/favicon.ico (16, 32, 48)");
