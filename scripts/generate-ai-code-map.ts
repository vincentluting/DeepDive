import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { pathToFileURL } from "node:url";

export interface TrackedFile {
  path: string;
  sizeBytes: number;
  lineCount: number;
}

const OUTPUT_PATH = "docs/architecture/ai-code-inventory.generated.md";

const CODE_EXTENSIONS = new Set([
  "css",
  "cjs",
  "js",
  "jsx",
  "mjs",
  "sql",
  "ts",
  "tsx",
]);

const TEXT_EXTENSIONS = new Set([
  ...CODE_EXTENSIONS,
  "json",
  "md",
  "mjs",
  "txt",
  "yaml",
  "yml",
]);

const BINARY_CONTEXT_EXTENSIONS = new Set([
  "csv",
  "doc",
  "docx",
  "jpeg",
  "jpg",
  "pdf",
  "png",
  "pptx",
  "webp",
  "xlsx",
]);

const PRIMARY_CODE_DIRS = [
  "app",
  "components",
  "lib",
  "store",
  "hooks",
  "scripts",
  "e2e",
];

function compareCountEntries(a: [string, number], b: [string, number]): number {
  return b[1] - a[1] || a[0].localeCompare(b[0]);
}

function compareFilesByLines(a: TrackedFile, b: TrackedFile): number {
  return b.lineCount - a.lineCount || b.sizeBytes - a.sizeBytes || a.path.localeCompare(b.path);
}

function compareFilesBySize(a: TrackedFile, b: TrackedFile): number {
  return b.sizeBytes - a.sizeBytes || b.lineCount - a.lineCount || a.path.localeCompare(b.path);
}

export function getExtension(filePath: string): string {
  const fileName = filePath.split("/").pop() ?? filePath;
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex <= 0 || dotIndex === fileName.length - 1) return "(none)";
  return fileName.slice(dotIndex + 1).toLowerCase();
}

function topLevelDir(filePath: string): string {
  return filePath.includes("/") ? filePath.split("/")[0] : ".";
}

export function countByTopLevel(files: TrackedFile[]): Array<[string, number]> {
  const counts = new Map<string, number>();
  for (const file of files) {
    const key = topLevelDir(file.path);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].sort(compareCountEntries);
}

function countByExtension(files: TrackedFile[]): Array<[string, number]> {
  const counts = new Map<string, number>();
  for (const file of files) {
    const ext = getExtension(file.path);
    counts.set(ext, (counts.get(ext) ?? 0) + 1);
  }
  return [...counts.entries()].sort(compareCountEntries);
}

export function isLikelyContextNoise(filePath: string): boolean {
  const ext = getExtension(filePath);
  if (filePath === "package-lock.json") return true;
  if (filePath.startsWith(".claude/quality/codex-redteam/output-")) return true;
  if (filePath.startsWith(".playwright-mcp/")) return true;
  if (filePath.startsWith(".journey-test-reports/")) return true;
  if (filePath.startsWith(".qa-reports/")) return true;
  if (filePath.startsWith("docs/Thesis/Reference/") && BINARY_CONTEXT_EXTENSIONS.has(ext)) {
    return true;
  }
  if (!filePath.includes("/") && BINARY_CONTEXT_EXTENSIONS.has(ext)) return true;
  if (filePath.startsWith("e2e/") && BINARY_CONTEXT_EXTENSIONS.has(ext)) return true;
  return false;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(kb >= 10 ? 0 : 1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(mb >= 10 ? 0 : 1)} MB`;
}

function markdownTable(headers: string[], rows: string[][]): string {
  const header = `| ${headers.join(" | ")} |`;
  const divider = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map((row) => `| ${row.join(" | ")} |`);
  return [header, divider, ...body].join("\n");
}

function codeFileCount(files: TrackedFile[]): number {
  return files.filter((file) => CODE_EXTENSIONS.has(getExtension(file.path))).length;
}

function sectionForTopLevels(files: TrackedFile[]): string {
  const rows = countByTopLevel(files).map(([dir, count]) => [`\`${dir}\``, String(count)]);
  return markdownTable(["Area", "Tracked files"], rows);
}

function sectionForPrimaryDirs(files: TrackedFile[]): string {
  const rows = PRIMARY_CODE_DIRS.map((dir) => {
    const dirFiles = files.filter((file) => file.path.startsWith(`${dir}/`));
    const codeFiles = dirFiles.filter((file) => CODE_EXTENSIONS.has(getExtension(file.path)));
    const lines = codeFiles.reduce((total, file) => total + file.lineCount, 0);
    return [`\`${dir}/\``, String(codeFiles.length), String(lines)];
  }).filter((row) => row[1] !== "0");

  return markdownTable(["Directory", "Code files", "Approx. code lines"], rows);
}

function sectionForExtensions(files: TrackedFile[]): string {
  const rows = countByExtension(files)
    .slice(0, 20)
    .map(([ext, count]) => [`\`${ext}\``, String(count)]);
  return markdownTable(["Extension", "Tracked files"], rows);
}

function sectionForLargestFiles(files: TrackedFile[]): string {
  const rows = files
    .filter((file) => CODE_EXTENSIONS.has(getExtension(file.path)))
    .sort(compareFilesByLines)
    .slice(0, 25)
    .map((file) => [`\`${file.path}\``, String(file.lineCount), formatBytes(file.sizeBytes)]);

  return markdownTable(["File", "Lines", "Size"], rows);
}

function sectionForContextNoise(files: TrackedFile[]): string {
  const rows = files
    .filter((file) => isLikelyContextNoise(file.path))
    .sort(compareFilesBySize)
    .slice(0, 25)
    .map((file) => [`\`${file.path}\``, formatBytes(file.sizeBytes)]);

  if (rows.length === 0) return "_No likely context-noise files detected among tracked files._";
  return markdownTable(["File or artifact", "Size"], rows);
}

export function buildInventoryMarkdown(files: TrackedFile[]): string {
  const sortedFiles = [...files].sort((a, b) => a.path.localeCompare(b.path));
  const totalLines = sortedFiles.reduce((total, file) => total + file.lineCount, 0);

  return [
    "# AI Code Inventory",
    "",
    "> Generated by `npm run ai:map`. Do not edit this file by hand.",
    "",
    "## Summary",
    "",
    markdownTable(
      ["Metric", "Value"],
      [
        ["Tracked files", String(sortedFiles.length)],
        ["Tracked code files", String(codeFileCount(sortedFiles))],
        ["Approx. tracked text lines", String(totalLines)],
      ],
    ),
    "",
    "## Top-Level Areas",
    "",
    sectionForTopLevels(sortedFiles),
    "",
    "## Primary Code Directories",
    "",
    sectionForPrimaryDirs(sortedFiles),
    "",
    "## File Extensions",
    "",
    sectionForExtensions(sortedFiles),
    "",
    "## Largest Code Files",
    "",
    sectionForLargestFiles(sortedFiles),
    "",
    "## Likely Context Noise",
    "",
    "These files are tracked, but agents should avoid loading them unless the task specifically needs them.",
    "",
    sectionForContextNoise(sortedFiles),
    "",
  ].join("\n");
}

function countLinesIfText(filePath: string): number {
  const ext = getExtension(filePath);
  if (!TEXT_EXTENSIONS.has(ext)) return 0;

  const content = readFileSync(filePath, "utf8");
  if (content.length === 0) return 0;
  return content.endsWith("\n")
    ? content.split("\n").length - 1
    : content.split("\n").length;
}

function readTrackedFiles(): TrackedFile[] {
  const output = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" });
  return output
    .split("\0")
    .filter(Boolean)
    .filter((filePath) => existsSync(filePath))
    .map((filePath) => {
      const stat = statSync(filePath);
      return {
        path: filePath,
        sizeBytes: stat.size,
        lineCount: countLinesIfText(filePath),
      };
    })
    .sort((a, b) => a.path.localeCompare(b.path));
}

function writeInventory(markdown: string): void {
  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, markdown);
}

export function main(): void {
  const files = readTrackedFiles();
  writeInventory(buildInventoryMarkdown(files));
  console.log(`Wrote ${OUTPUT_PATH}`);
}

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (import.meta.url === invokedPath) {
  main();
}
