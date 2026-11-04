// ============================================================
// Lightweight request timing helpers
//
// Used on critical API paths to expose phase-level durations through the
// Server-Timing header and optional structured logs.
// ============================================================

export interface TimingSpan {
  name: string;
  durationMs: number;
}

export interface RequestTimerOptions {
  route: string;
  slowMs?: number;
}

export interface TimingSummary {
  route: string;
  totalMs: number;
  spans: TimingSpan[];
}

const DEFAULT_SLOW_MS = 1500;
const SERVER_TIMING_MAX_SPANS = 12;

export class RequestTimer {
  private readonly route: string;
  private readonly slowMs: number;
  private readonly start = Date.now();
  private readonly spans: TimingSpan[] = [];

  constructor(options: RequestTimerOptions) {
    this.route = options.route;
    this.slowMs = options.slowMs ?? DEFAULT_SLOW_MS;
  }

  async time<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    try {
      return await fn();
    } finally {
      this.record(name, Date.now() - start);
    }
  }

  record(name: string, durationMs: number): void {
    this.spans.push({ name: normalizeTimingName(name), durationMs });
  }

  summary(): TimingSummary {
    return {
      route: this.route,
      totalMs: Date.now() - this.start,
      spans: [...this.spans],
    };
  }

  attach<T extends Response>(response: T): T {
    const summary = this.summary();
    const serverTiming = this.toServerTiming();
    if (serverTiming) response.headers.set("Server-Timing", serverTiming);

    if (shouldLogTimings() || summary.totalMs >= this.slowMs) {
      const payload = {
        level: summary.totalMs >= this.slowMs ? "warn" : "info",
        event: "api_timing",
        route: summary.route,
        status: response.status,
        totalMs: summary.totalMs,
        spans: summary.spans,
        ts: new Date().toISOString(),
      };
      const line = JSON.stringify(payload);
      if (summary.totalMs >= this.slowMs) {
        console.warn(line);
      } else if (process.env.NODE_ENV === "development") {
        console.log(line);
      }
    }

    return response;
  }

  private toServerTiming(): string {
    return this.spans
      .slice(0, SERVER_TIMING_MAX_SPANS)
      .map((span) => `${span.name};dur=${Math.max(0, Math.round(span.durationMs))}`)
      .join(", ");
  }
}

export function createRequestTimer(options: RequestTimerOptions): RequestTimer {
  return new RequestTimer(options);
}

function normalizeTimingName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "_")
    .slice(0, 48);
}

function shouldLogTimings(): boolean {
  return (
    process.env.API_TIMING_LOG === "true" ||
    process.env.NODE_ENV === "development"
  );
}
