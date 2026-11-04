import { spawn } from "child_process";
import { rmSync } from "fs";
import { resolve as resolvePath } from "path";

const PROJECT_ROOT = resolvePath(__dirname, "..");
const NEXT_DEV_DIR = resolvePath(PROJECT_ROOT, ".next", "dev");

function getPort(): string {
  const portArgIndex = process.argv.indexOf("--port");
  if (portArgIndex >= 0) {
    const port = process.argv[portArgIndex + 1];
    if (port) return port;
  }

  return process.env.PORT || "3000";
}

function main() {
  const port = getPort();

  // Force a clean dev build for browser E2E runs. A corrupted
  // prerender-manifest.json poisons subsequent route compiles.
  rmSync(NEXT_DEV_DIR, { recursive: true, force: true });

  const child = spawn("npx", ["next", "dev", "--port", port, "--webpack"], {
    cwd: PROJECT_ROOT,
    env: {
      ...process.env,
      PORT: port,
      NODE_ENV: "development",
    },
    stdio: "inherit",
  });

  const forwardSignal = (signal: NodeJS.Signals) => {
    if (!child.killed) {
      child.kill(signal);
    }
  };

  process.on("SIGINT", () => forwardSignal("SIGINT"));
  process.on("SIGTERM", () => forwardSignal("SIGTERM"));

  child.on("close", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 1);
  });
}

main();
