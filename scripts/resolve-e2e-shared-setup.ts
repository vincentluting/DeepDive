// Decide whether Playwright global-setup should build the expensive shared
// pipeline user. Public smoke projects do not need it, and skipping it keeps
// fast health checks independent from LLM/provider flakiness.

export type E2ESharedSetupMode = "full" | "skip";

const PROJECTS_REQUIRING_SHARED_CONTEXT = new Set([
  "analytics-pipeline",
  "audit-features",
  "coaching-flow",
  "coaching-layout",
  "mobile-responsive",
  "report-rendering",
  "ui-journey-quality",
]);

function selectedProjects(args: string[]): string[] {
  const projects: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--project=")) {
      projects.push(arg.slice("--project=".length));
    } else if (arg === "--project" && args[i + 1]) {
      projects.push(args[i + 1]);
      i++;
    }
  }
  return projects;
}

export function resolveE2ESharedSetupMode(
  playwrightArgs: string[],
): E2ESharedSetupMode {
  const projects = selectedProjects(playwrightArgs);

  // No explicit project filter means Playwright may run any configured project,
  // including shared-context consumers.
  if (projects.length === 0) return "full";

  return projects.some((project) => PROJECTS_REQUIRING_SHARED_CONTEXT.has(project))
    ? "full"
    : "skip";
}
