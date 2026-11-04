// ============================================================
// Test: MessageBubble React.memo in coaching-chat.tsx
// Verifies the component file exports correctly and
// MessageBubble is wrapped with React.memo.
// ============================================================

import { describe, it, expect } from "vitest";
import * as _React from "react";

describe("coaching-chat MessageBubble", () => {
  it("MessageBubble is defined as a React.memo component in the source", async () => {
    // MessageBubble is not a named export — it is file-scoped inside coaching-chat.tsx.
    // We verify the pattern by reading the source and checking for React.memo usage.
    // This is an import-level smoke test for the component module.
    const fs = await import("fs");
    const path = await import("path");
    const src = fs.readFileSync(
      path.resolve(__dirname, "../../features/coaching-chat.tsx"),
      "utf-8",
    );

    // Verify React.memo wraps MessageBubble
    expect(src).toContain("React.memo(function MessageBubble");
  });

  it("MessageBubble accepts message, isFirstInBlock, and showCursor props", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const src = fs.readFileSync(
      path.resolve(__dirname, "../../features/coaching-chat.tsx"),
      "utf-8",
    );

    // Verify prop types are declared
    expect(src).toContain("message: Message");
    expect(src).toContain("isFirstInBlock: boolean");
    expect(src).toContain("showCursor: boolean");
  });

  it("renders different layouts for assistant and user roles", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const src = fs.readFileSync(
      path.resolve(__dirname, "../../features/coaching-chat.tsx"),
      "utf-8",
    );

    // Assistant branch is explicit; user branch is the else/fallback
    expect(src).toContain('message.role === "assistant"');
    // User messages use a different CSS class
    expect(src).toContain("chat-bubble-assistant");
    expect(src).toContain("chat-bubble-user");
  });

  it("does not automatically end full-access sessions at ten rounds", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const src = fs.readFileSync(
      path.resolve(__dirname, "../../features/coaching-chat.tsx"),
      "utf-8",
    );

    expect(src).not.toContain("newRound >= MAX_ROUNDS");
    expect(src).toContain('response.headers.get("X-Coaching-Session-Id")');
    expect(src).toContain("sessionId={sessionId");
  });

  it("explains the job-description action beyond an icon-only control", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const src = fs.readFileSync(
      path.resolve(__dirname, "../../features/coaching-chat.tsx"),
      "utf-8",
    );

    expect(src).toContain("title={ct.pasteJd}");
    expect(src).toContain("{ct.analyzeJob}");
  });

  it("offers lightweight correction controls after assistant replies", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const src = fs.readFileSync(
      path.resolve(__dirname, "../../features/coaching-chat.tsx"),
      "utf-8",
    );

    expect(src).toContain("ct.correctionMissedPoint");
    expect(src).toContain("ct.correctionBeDirect");
    expect(src).toContain("ct.correctionRecommend");
    expect(src).toContain("ct.correctionNotPractical");
  });

  it("wires the immersive Meridian coaching frame into chat and lobby source", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const chatSrc = fs.readFileSync(
      path.resolve(__dirname, "../../features/coaching-chat.tsx"),
      "utf-8",
    );
    const clientSrc = fs.readFileSync(
      path.resolve(
        __dirname,
        "../../../app/[locale]/(app)/coaching/coaching-client.tsx",
      ),
      "utf-8",
    );

    expect(chatSrc).toContain("dd-coach-chat-frame");
    expect(chatSrc).toContain("dd-coach-age-gate");
    expect(chatSrc).toContain("dd-coach-signal-strip");
    expect(chatSrc).toContain("dd-coach-message-stage");
    expect(chatSrc).toContain("dd-coach-composer");
    expect(chatSrc).toContain("dd-coach-side-panel");

    expect(clientSrc).toContain("dd-coach-stage");
    expect(clientSrc).toContain("dd-coach-chat-toolbar");
    expect(clientSrc).toContain("dd-coach-lobby-map");
    expect(clientSrc).toContain("dd-coach-setup-panel");
  });

  it("defines paired light chart-table and dark lantern-room coaching tokens", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const css = fs.readFileSync(
      path.resolve(__dirname, "../../../app/globals.css"),
      "utf-8",
    );

    expect(css).toContain("--coach-chart-line");
    expect(css).toContain("--coach-lantern-glow");
    expect(css).toContain(".dark .dd-coaching-page");
    expect(css).toContain(".dd-coach-age-gate");
    expect(css).toContain(".dd-coach-signal-strip");
  });

  it("locks the restrained observatory shell for the AI coach lobby and chat", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const clientSrc = fs.readFileSync(
      path.resolve(
        __dirname,
        "../../../app/[locale]/(app)/coaching/coaching-client.tsx",
      ),
      "utf-8",
    );
    const chatSrc = fs.readFileSync(
      path.resolve(__dirname, "../../features/coaching-chat.tsx"),
      "utf-8",
    );
    const css = fs.readFileSync(
      path.resolve(__dirname, "../../../app/globals.css"),
      "utf-8",
    );
    const en = JSON.parse(
      fs.readFileSync(
        path.resolve(__dirname, "../../../lib/i18n/dictionaries/en/coaching.json"),
        "utf-8",
      ),
    );
    const zh = JSON.parse(
      fs.readFileSync(
        path.resolve(__dirname, "../../../lib/i18n/dictionaries/zh/coaching.json"),
        "utf-8",
      ),
    );

    expect(clientSrc).toContain("dd-coach-observatory");
    expect(clientSrc).toContain("dd-coach-profile-rail");
    expect(clientSrc).toContain("dd-coach-session-panel");
    expect(clientSrc).toContain("dd-coach-action-lab");
    expect(chatSrc).toContain("dd-coach-chat-context-rail");
    expect(chatSrc).toContain("dd-coach-chat-action-rail");
    expect(css).toContain(".dd-coach-observatory");
    expect(css).toContain(".dd-coach-profile-rail");
    expect(css).toContain(".dd-coach-action-lab");
    expect(css).toContain(".dd-coach-chat-context-rail");
    expect(en.coaching.observatoryTitle).toBe("Make the next choice clearer.");
    expect(zh.coaching.observatoryTitle).toBe("让下一步选择更清晰。");
  });
});
