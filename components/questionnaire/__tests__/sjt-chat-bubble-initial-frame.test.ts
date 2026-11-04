import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";

describe("SJT chat bubble initial frame", () => {
  const src = () =>
    readFileSync(join(__dirname, "../questions/sjt-chat-bubble.tsx"), "utf8");

  it("shows the first chat message immediately instead of rendering a blank card", () => {
    const component = src();

    expect(component).toContain("FIRST_VISIBLE_MESSAGES");
    expect(component).toMatch(/useState\(\s*FIRST_VISIBLE_MESSAGES\s*,?\s*\)/);
    expect(component).toMatch(/let count = FIRST_VISIBLE_MESSAGES/);
  });
});
