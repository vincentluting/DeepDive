import { describe, expect, it } from "vitest";
import {
  buildPostAssessmentHref,
  getPostAssessmentCompletionDestination,
  getPostAssessmentDestination,
  normalizePrePostAssessmentType,
} from "../navigation";

describe("post-assessment navigation", () => {
  it("normalizes unsupported assessment types to post_immediate", () => {
    expect(normalizePrePostAssessmentType("pre")).toBe("pre");
    expect(normalizePrePostAssessmentType("post_1week")).toBe("post_1week");
    expect(normalizePrePostAssessmentType("unexpected")).toBe("post_immediate");
    expect(normalizePrePostAssessmentType(undefined)).toBe("post_immediate");
  });

  it("uses safe same-origin destinations and falls back to dashboard", () => {
    expect(getPostAssessmentDestination("/en/immersive-dive", "en")).toBe(
      "/en/immersive-dive",
    );
    expect(getPostAssessmentDestination("https://evil.test", "en")).toBe(
      "/en/dashboard",
    );
    expect(getPostAssessmentDestination("//evil.test", "zh")).toBe(
      "/zh/dashboard",
    );
  });

  it("builds a pre-assessment href that preserves the immersive return target", () => {
    expect(
      buildPostAssessmentHref({
        locale: "en",
        type: "pre",
        redirect: "/en/immersive-dive",
      }),
    ).toBe("/en/post-assessment?type=pre&redirect=%2Fen%2Fimmersive-dive");
  });

  it("ignores completion redirects for true post assessments", () => {
    expect(
      getPostAssessmentCompletionDestination({
        locale: "en",
        type: "post_immediate",
        redirect: "/en/immersive-dive",
      }),
    ).toBe("/en/dashboard");
    expect(
      buildPostAssessmentHref({
        locale: "en",
        type: "post_1week",
        redirect: "/en/immersive-dive",
      }),
    ).toBe("/en/post-assessment?type=post_1week");
  });

  it("omits the redirect parameter when the destination is the dashboard fallback", () => {
    expect(
      buildPostAssessmentHref({
        locale: "zh",
        type: "post_1week",
        redirect: "javascript:alert(1)",
      }),
    ).toBe("/zh/post-assessment?type=post_1week");
  });
});
