import { describe, it, expect } from "vitest";
import {
  createSemaphore,
  createLimiter,
  getProviderLimiter,
  getProviderSemaphore,
} from "../concurrency";

describe("createSemaphore", () => {
  it("limits concurrent executions via run()", async () => {
    const sem = createSemaphore(2);
    let active = 0;
    let maxActive = 0;

    const task = () =>
      sem.run(async () => {
        active++;
        maxActive = Math.max(maxActive, active);
        await new Promise((r) => setTimeout(r, 50));
        active--;
      });

    await Promise.all([task(), task(), task(), task(), task()]);
    expect(maxActive).toBe(2);
  });

  it("acquire/release tracks slots correctly", async () => {
    const sem = createSemaphore(1);
    const order: string[] = [];

    const rel1 = await sem.acquire();
    order.push("acquired-1");

    // Second acquire should wait
    const p2 = sem.acquire().then((rel) => {
      order.push("acquired-2");
      return rel;
    });

    // Give microtask a chance — p2 should NOT have resolved
    await new Promise((r) => setTimeout(r, 10));
    expect(order).toEqual(["acquired-1"]);

    // Release first slot → second should acquire
    rel1();
    const rel2 = await p2;
    expect(order).toEqual(["acquired-1", "acquired-2"]);
    rel2();
  });

  it("release after stream end frees slot for next caller", async () => {
    const sem = createSemaphore(1);
    const events: string[] = [];

    // Simulate streaming: acquire, do async work, release later
    const rel = await sem.acquire();
    events.push("stream-start");

    // Queue another task that should wait
    const waitingTask = sem.run(async () => {
      events.push("next-task");
    });

    await new Promise((r) => setTimeout(r, 20));
    expect(events).toEqual(["stream-start"]); // next-task still blocked

    rel(); // simulate stream end
    await waitingTask;
    expect(events).toEqual(["stream-start", "next-task"]);
  });

  it("processes all items in queue order", async () => {
    const sem = createSemaphore(1);
    const results: number[] = [];
    await Promise.all(
      [1, 2, 3].map((n) => sem.run(async () => results.push(n))),
    );
    expect(results).toEqual([1, 2, 3]);
  });

  it("propagates errors from run()", async () => {
    const sem = createSemaphore(2);
    await expect(
      sem.run(async () => {
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
  });

  it("continues draining after error in run()", async () => {
    const sem = createSemaphore(1);
    const results: string[] = [];
    const p1 = sem
      .run(async () => {
        throw new Error("fail");
      })
      .catch(() => results.push("caught"));
    const p2 = sem.run(async () => results.push("ok"));
    await Promise.all([p1, p2]);
    expect(results).toContain("caught");
    expect(results).toContain("ok");
    expect(results).toHaveLength(2);
  });
});

describe("createLimiter (backwards compat)", () => {
  it("limits concurrency", async () => {
    const limiter = createLimiter(2);
    let active = 0;
    let maxActive = 0;
    const task = () =>
      limiter(async () => {
        active++;
        maxActive = Math.max(maxActive, active);
        await new Promise((r) => setTimeout(r, 30));
        active--;
      });
    await Promise.all([task(), task(), task()]);
    expect(maxActive).toBe(2);
  });
});

describe("provider singletons", () => {
  it("getProviderLimiter returns same fn for same provider", () => {
    expect(getProviderLimiter("anthropic")).toBe(
      getProviderLimiter("anthropic"),
    );
  });

  it("getProviderSemaphore returns same instance for same provider", () => {
    expect(getProviderSemaphore("openai")).toBe(getProviderSemaphore("openai"));
  });

  it("semaphore run and acquire share the same slot pool", async () => {
    const sem = createSemaphore(1);
    const events: string[] = [];

    const rel = await sem.acquire();
    events.push("acquired");

    const waiting = sem.run(async () => events.push("ran"));
    await new Promise((r) => setTimeout(r, 10));
    expect(events).toEqual(["acquired"]); // run() blocked by acquire()

    rel();
    await waiting;
    expect(events).toEqual(["acquired", "ran"]);
  });
});
