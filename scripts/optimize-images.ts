/**
 * Image optimization script
 *
 * Compresses oversized PNG images used as logo, favicon, and Apple touch icon.
 *
 * Usage:
 *   npx tsx scripts/optimize-images.ts
 *
 * What it does:
 *   - public/logo.svg: resize to 512px, quantize to 256 colors (target <500KB)
 *   - app/apple-icon.png: resize to 180x180px (Apple standard), compress
 *   - app/icon.png: resize to 32x32px (favicon standard), compress
 */

import sharp from "sharp";
import { writeFileSync, statSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, "..");

interface ImageTask {
  path: string;
  description: string;
  width: number;
  height: number;
  /** Max file size in bytes (soft target) */
  maxBytes: number;
  /** Use palette quantization for smaller file size */
  usePalette: boolean;
  /** Number of colors for palette mode (default 256) */
  colors?: number;
}

const tasks: ImageTask[] = [
  {
    path: "public/logo.svg",
    description:
      "Logo (512px, used at 20px in UI — 512 is 25x display size for retina)",
    width: 512,
    height: 512,
    maxBytes: 500 * 1024,
    usePalette: true,
    colors: 256,
  },
  {
    path: "app/apple-icon.png",
    description: "Apple touch icon (180x180 per Apple HIG)",
    width: 180,
    height: 180,
    maxBytes: 200 * 1024,
    usePalette: false,
  },
  {
    path: "app/icon.png",
    description: "Favicon (32x32 standard)",
    width: 32,
    height: 32,
    maxBytes: 100 * 1024,
    usePalette: false,
  },
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

async function optimizeImage(task: ImageTask): Promise<{ before: number; after: number }> {
  const fullPath = resolve(ROOT, task.path);
  const originalSize = statSync(fullPath).size;

  console.log(`\n--- ${task.path} ---`);
  console.log(`  Description: ${task.description}`);
  console.log(`  Original size: ${formatBytes(originalSize)}`);

  const metadata = await sharp(fullPath).metadata();
  console.log(`  Original dimensions: ${metadata.width}x${metadata.height}`);

  const pngOptions: sharp.PngOptions = {
    compressionLevel: 9,
    effort: 10,
  };

  if (task.usePalette) {
    pngOptions.palette = true;
    pngOptions.colours = task.colors ?? 256;
  }

  const buffer = await sharp(fullPath)
    .resize(task.width, task.height, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png(pngOptions)
    .toBuffer();

  writeFileSync(fullPath, buffer);

  const newSize = buffer.length;
  console.log(`  New dimensions: ${task.width}x${task.height}`);
  console.log(`  New size: ${formatBytes(newSize)}`);
  console.log(
    `  Reduction: ${formatBytes(originalSize - newSize)} (${(((originalSize - newSize) / originalSize) * 100).toFixed(1)}%)`
  );

  if (newSize > task.maxBytes) {
    console.log(
      `  ⚠ Above target (${formatBytes(task.maxBytes)}) — consider reducing dimensions or color count`
    );
  } else {
    console.log(`  ✓ Under target (${formatBytes(task.maxBytes)})`);
  }

  return { before: originalSize, after: newSize };
}

async function main() {
  console.log("=== Image Optimization ===\n");

  let totalBefore = 0;
  let totalAfter = 0;

  for (const task of tasks) {
    const { before, after } = await optimizeImage(task);
    totalBefore += before;
    totalAfter += after;
  }

  console.log("\n=== Summary ===");
  console.log(`  Total before: ${formatBytes(totalBefore)}`);
  console.log(`  Total after:  ${formatBytes(totalAfter)}`);
  console.log(
    `  Total saved:  ${formatBytes(totalBefore - totalAfter)} (${(((totalBefore - totalAfter) / totalBefore) * 100).toFixed(1)}%)`
  );
}

main().catch((err) => {
  console.error("Optimization failed:", err);
  process.exit(1);
});
