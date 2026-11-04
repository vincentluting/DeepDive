import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { RevReadingProgress } from "@/components/profile-panels/editorial/rev-reading-progress";

describe("RevReadingProgress", () => {
  it("maps percent to a left-origin scaleX fill", () => {
    const html = renderToStaticMarkup(<RevReadingProgress percent={0.42} />);
    expect(html).toContain("scaleX(0.42)");
    expect(html).toContain("origin-left");
  });

  it("clamps out-of-range percent to [0,1]", () => {
    expect(renderToStaticMarkup(<RevReadingProgress percent={-3} />)).toContain(
      "scaleX(0)",
    );
    expect(renderToStaticMarkup(<RevReadingProgress percent={5} />)).toContain(
      "scaleX(1)",
    );
  });

  it("hides on desktop by default (spine nav takes over there)", () => {
    const html = renderToStaticMarkup(<RevReadingProgress percent={0.5} />);
    expect(html).toContain("lg:hidden");
  });

  it("forwards an inline top offset so it clears the fixed app header", () => {
    // ProfileDashboard passes style={{ top: "var(--header-height)" }} to push
    // the 2px bar below the fixed header — verify the passthrough survives.
    const html = renderToStaticMarkup(
      <RevReadingProgress
        percent={0.5}
        style={{ top: "var(--header-height, 64px)" }}
      />,
    );
    expect(html).toContain("var(--header-height");
  });
});
