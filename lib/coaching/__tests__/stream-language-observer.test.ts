import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const captureMessage = vi.fn();

vi.mock("@sentry/nextjs", () => ({
  captureMessage: (...args: unknown[]) => captureMessage(...args),
}));

import { observeStreamLocale } from "../stream-language-observer";

const ENV_BACKUP = process.env.LANGUAGE_GUARD_DISABLED;

function makeStreamResponse(chunks: string[]): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
  return new Response(stream, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

async function readAll(response: Response): Promise<string> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let out = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    out += decoder.decode(value, { stream: true });
  }
  return out;
}

async function flushObservation(): Promise<void> {
  // Observation runs in a detached async task; give the microtask queue
  // time to run captureMessage before assertions.
  await new Promise((r) => setTimeout(r, 20));
}

beforeEach(() => {
  captureMessage.mockClear();
  delete process.env.LANGUAGE_GUARD_DISABLED;
});

afterEach(() => {
  if (ENV_BACKUP === undefined) {
    delete process.env.LANGUAGE_GUARD_DISABLED;
  } else {
    process.env.LANGUAGE_GUARD_DISABLED = ENV_BACKUP;
  }
});

describe("observeStreamLocale", () => {
  it("passes stream body through unchanged", async () => {
    const source = makeStreamResponse([
      "Hello there, ",
      "this is a valid English stream.",
    ]);
    const observed = observeStreamLocale(source, "en", {
      feature: "coaching",
      taskId: "coaching",
      routeName: "/api/coaching-chat",
    });

    const received = await readAll(observed);
    expect(received).toBe("Hello there, this is a valid English stream.");
  });

  it("does not fire Sentry when output matches locale", async () => {
    // 600+ chars of English content to trigger the sample check
    const englishLong =
      "In the current landscape of career exploration, we find that each person carries a unique combination of strengths and values. ".repeat(
        6,
      );
    const source = makeStreamResponse([englishLong]);
    const observed = observeStreamLocale(source, "en", {
      feature: "coaching",
      taskId: "coaching",
      routeName: "/api/coaching-chat",
    });

    await readAll(observed);
    await flushObservation();
    expect(captureMessage).not.toHaveBeenCalled();
  });

  it("fires Sentry warning when EN locale output drifts to Chinese", async () => {
    const chineseLong =
      "你好。在这次探索中，你展现出综合者的特质——天然地在分析与表达之间架桥，这让你在许多传统职业之外看到更多可能。".repeat(
        8,
      );
    const source = makeStreamResponse([chineseLong]);
    const observed = observeStreamLocale(source, "en", {
      feature: "coaching",
      taskId: "coaching-first",
      routeName: "/api/coaching-chat",
    });

    await readAll(observed);
    await flushObservation();

    expect(captureMessage).toHaveBeenCalledTimes(1);
    const [, meta] = captureMessage.mock.calls[0];
    expect(meta.level).toBe("warning");
    expect(meta.tags).toMatchObject({
      feature: "coaching",
      task: "coaching-first",
      targetLocale: "en",
      guardPhase: "stream-observe",
    });
  });

  it("is a no-op when LANGUAGE_GUARD_DISABLED is set", async () => {
    process.env.LANGUAGE_GUARD_DISABLED = "1";
    const chineseLong =
      "你好。在这次探索中，你展现出综合者的特质——天然地在分析与表达之间架桥。".repeat(
        10,
      );
    const source = makeStreamResponse([chineseLong]);

    const observed = observeStreamLocale(source, "en", {
      feature: "coaching",
      taskId: "coaching",
      routeName: "/api/coaching-chat",
    });

    // Guard-off returns the same reference
    expect(observed).toBe(source);
    await readAll(observed);
    await flushObservation();
    expect(captureMessage).not.toHaveBeenCalled();
  });

  it("handles empty streams without throwing or reporting", async () => {
    const source = makeStreamResponse([]);
    const observed = observeStreamLocale(source, "en", {
      feature: "coaching",
      taskId: "coaching",
      routeName: "/api/coaching-chat",
    });

    const received = await readAll(observed);
    await flushObservation();
    expect(received).toBe("");
    expect(captureMessage).not.toHaveBeenCalled();
  });

  it("catches late drift after a clean opening (runs late-window check at stream end)", async () => {
    // First 600 chars English, then switch to Chinese for the tail.
    const englishOpening =
      "In the current landscape of career exploration, we find that each person carries a unique combination of strengths and values. ".repeat(
        6,
      );
    const chineseTail =
      "不过，如果把整个故事再展开一点——你可能会发现自己其实在多种方向之间游走，这些方向彼此交织在一起。".repeat(
        8,
      );
    const source = makeStreamResponse([englishOpening, chineseTail]);
    const observed = observeStreamLocale(source, "en", {
      feature: "coaching",
      taskId: "coaching",
      routeName: "/api/coaching-chat",
    });

    const received = await readAll(observed);
    await flushObservation();

    // User still receives the full stream unchanged
    expect(received).toContain("career exploration");
    expect(received).toContain("交织");

    // One Sentry event tagged as the late phase
    expect(captureMessage).toHaveBeenCalledTimes(1);
    const [, meta] = captureMessage.mock.calls[0];
    expect(meta.tags.guardPhase).toBe("stream-observe-late");
  });

  it("does not fire a second event when early already flagged drift", async () => {
    // Opening already Chinese — early check fires.
    const chineseOpening =
      "你好，在这次深度对话中，你展现出独特的模式——天然地在分析与表达之间架桥。".repeat(
        10,
      );
    // Tail also Chinese; without suppression we'd risk a duplicate event.
    const chineseTail =
      "这种桥接带来的视角，会影响你如何看待未来的方向。".repeat(10);
    const source = makeStreamResponse([chineseOpening, chineseTail]);
    const observed = observeStreamLocale(source, "en", {
      feature: "coaching",
      taskId: "coaching",
      routeName: "/api/coaching-chat",
    });

    await readAll(observed);
    await flushObservation();

    expect(captureMessage).toHaveBeenCalledTimes(1);
    expect(captureMessage.mock.calls[0][1].tags.guardPhase).toBe(
      "stream-observe",
    );
  });
});
