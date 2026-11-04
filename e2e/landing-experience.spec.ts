// ============================================================
// Landing Experience — The Descent (v8.1)
//
// Guards the scroll-driven landing narrative:
//   1. CTA routing — new visitor → quickdive; returning visitor
//      (localStorage markers) → register with quickdive intent
//   2. intro_cta_clicked payload carries source/targetHref/surface
//   3. prefers-reduced-motion: first-screen copy fully visible
//      (reveal system must never gate content at opacity 0)
//   4. full descent: scroll to footer, depth band reaches the
//      narrative deep, continuous veil progressed and receded,
//      zero console errors
//   5. choice band side card: entry invitation for new visitors,
//      resume card for returning ones — never a fake percentage
// ============================================================

import { test, expect } from "@playwright/test";

const BASE = `http://localhost:${process.env.E2E_PORT || "3000"}`;

test.describe("Landing CTA routing", () => {
  test("new visitor hero CTA points to quickdive", async ({ page }) => {
    await page.goto(`${BASE}/en`, { waitUntil: "domcontentloaded" });
    const heroCta = page.locator(".dd-landing-actions a").first();
    await expect(heroCta).toHaveAttribute("href", "/en/quickdive");
  });

  test("returning logged-out visitor is routed to register with quickdive intent", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem("deep-dive-last-quickdive-id", "e2e-fake-id");
    });
    await page.goto(`${BASE}/en`, { waitUntil: "domcontentloaded" });
    const heroCta = page.locator(".dd-landing-actions a").first();
    await expect(heroCta).toHaveAttribute(
      "href",
      "/en/register?from=quickdive",
    );
  });

  test("intro_cta_clicked carries source, targetHref and surface", async ({
    page,
  }) => {
    const payloads: Array<Record<string, unknown>> = [];
    await page.route("**/api/analytics/event", async (route) => {
      if (route.request().method() === "POST") {
        try {
          const body = route.request().postDataJSON();
          if (body?.event === "intro_cta_clicked") payloads.push(body);
        } catch {
          /* ignore parse errors */
        }
      }
      await route.fulfill({ status: 200, body: "{}" });
    });

    await page.goto(`${BASE}/en`, { waitUntil: "domcontentloaded" });
    const heroCta = page.locator(".dd-landing-actions a").first();
    await heroCta.click();
    await page.waitForTimeout(800);

    expect(payloads.length, "intro_cta_clicked should fire").toBeGreaterThan(0);
    const meta = payloads[0].metadata as Record<string, unknown>;
    expect(meta.source).toBe("hero_cta");
    expect(meta.targetHref).toBe("/en/quickdive");
    expect(meta.surface).toBe("landing_v8");
  });
});

test.describe("Landing reduced motion", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" } });

  test("first-screen copy is fully visible with no reveal gating", async ({
    page,
  }) => {
    await page.goto(`${BASE}/en`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(600);

    const heading = page.locator("#landing-hero");
    await expect(heading).toBeVisible();
    const opacity = await heading.evaluate(
      (el) => getComputedStyle(el).opacity,
    );
    expect(Number(opacity)).toBe(1);

    // The reveal system must not arm under reduced motion — content
    // further down the page stays visible without scrolling.
    const armed = await page.locator(".dd-landing.dd-rev-armed").count();
    expect(armed).toBe(0);

    // Ambience must not mount: no particles canvas.
    expect(await page.locator(".dd-dive-particles").count()).toBe(0);
  });
});

test.describe("Landing full descent", () => {
  test("scrolling to the footer completes the dive without console errors", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() !== "error") return;
      // dev-only third-party noise: Speed Insights debug script vs CSP
      if (msg.text().includes("va.vercel-scripts.com")) return;
      errors.push(msg.text());
    });

    await page.goto(`${BASE}/en`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);

    // Descend in steps so IntersectionObserver bands fire like a real dive.
    const totalHeight = await page.evaluate(
      () => document.documentElement.scrollHeight,
    );
    let deepestVeil = 0;
    for (let y = 0; y <= totalHeight; y += 600) {
      // instant: the page sets scroll-behavior smooth — an animated
      // scrollTo would still be mid-flight when we sample the veil
      await page.evaluate(
        (top) => window.scrollTo({ top, behavior: "instant" }),
        y,
      );
      await page.waitForTimeout(120);
      const veil = await page.evaluate(() =>
        Number(
          document
            .querySelector<HTMLElement>(".dd-landing")
            ?.style.getPropertyValue("--landing-veil-progress") || "0",
        ),
      );
      deepestVeil = Math.max(deepestVeil, veil);
    }
    await page.waitForTimeout(800);

    await expect(page.locator(".dd-landing-footer")).toBeVisible();

    const band = await page.evaluate(
      () =>
        document.querySelector<HTMLElement>(".dd-landing")?.dataset.depthBand,
    );
    expect(
      ["twilight", "abyss", "photic"],
      "depth band should have descended past the surface",
    ).toContain(band);

    // Continuous veil: it must have deepened mid-dive and receded by the
    // footer (surfacing maps back toward photic).
    expect(
      deepestVeil,
      "veil progress should have deepened during the dive",
    ).toBeGreaterThan(0.7);
    const veilAtFooter = await page.evaluate(() =>
      Number(
        document
          .querySelector<HTMLElement>(".dd-landing")
          ?.style.getPropertyValue("--landing-veil-progress") || "0",
      ),
    );
    expect(
      veilAtFooter,
      "veil should recede while surfacing at the footer",
    ).toBeLessThan(0.9);

    expect(errors, `console errors: ${errors.join("\n")}`).toHaveLength(0);
  });
});

test.describe("Landing choice band side card", () => {
  test("new visitor sees the entry invitation, no percentage card", async ({
    page,
  }) => {
    await page.goto(`${BASE}/en`, { waitUntil: "domcontentloaded" });
    await expect(page.locator(".dd-showcase-entry-card")).toBeVisible();
    expect(await page.locator(".dd-showcase-progress-card").count()).toBe(0);
    const text = await page
      .locator(".dd-showcase-entry-card strong")
      .innerText();
    expect(text).not.toMatch(/%/);
  });

  test("returning visitor sees the resume card", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("deep-dive-last-quickdive-id", "e2e-fake-id");
    });
    await page.goto(`${BASE}/en`, { waitUntil: "domcontentloaded" });
    const card = page.locator(".dd-showcase-entry-card");
    await expect(card).toBeVisible();
    await expect(card).toHaveAttribute("href", "/en/explore");
  });
});
