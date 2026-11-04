import { describe, expect, it } from "vitest";
import { createRequestTimer } from "@/lib/observability/timing";

describe("RequestTimer", () => {
  it("attaches Server-Timing for recorded spans", async () => {
    const timer = createRequestTimer({ route: "/api/test", slowMs: 999_999 });
    await timer.time("DB lookup", async () => "ok");

    const response = timer.attach(new Response("{}"));
    expect(response.headers.get("Server-Timing")).toContain("db_lookup;dur=");
  });
});
