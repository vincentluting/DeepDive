/* eslint-disable no-undef -- playwright page.evaluate runs in browser context; console is node */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), "..");
const galleryPath = path.join(
  repoRoot,
  "docs/design/page-templates/template-gallery-v2.html",
);
const outputDir = path.join(repoRoot, "docs/design/page-templates/images-v2");

await fs.mkdir(outputDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1600, height: 1000 },
  deviceScaleFactor: 1,
});

await page.goto(pathToFileURL(galleryPath).href, { waitUntil: "load" });
await page.waitForFunction(() => window.__TEMPLATE_READY__ === true);

const ids = await page.evaluate(() =>
  window.__TEMPLATES__.flatMap((template) => [
    `${template.slug}-light`,
    `${template.slug}-dark`,
  ]),
);

for (const id of ids) {
  const locator = page.locator(`#${id}`);
  await locator.screenshot({
    path: path.join(outputDir, `${id}.png`),
    animations: "disabled",
  });
}

await browser.close();

console.log(`Rendered ${ids.length} template images to ${outputDir}`);
