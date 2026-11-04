import { expect, type Page } from "@playwright/test";
import type { TestContext } from "../fixtures/test-setup";

export const MOBILE_VIEWPORTS = [
  { name: "iphone-se", width: 375, height: 812 },
  { name: "iphone-13", width: 390, height: 844 },
  { name: "android", width: 412, height: 915 },
] as const;

export interface MobileHealthOptions {
  label: string;
  allowSmallTouchTargets?: number;
}

async function evaluateWithRetry<T>(
  page: Page,
  fn: () => T | Promise<T>,
): Promise<T> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await page.evaluate(fn);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const retryable =
        message.includes("Execution context was destroyed") ||
        message.includes("Cannot find context") ||
        message.includes("navigation") ||
        message.includes("frame was detached");
      if (!retryable || attempt === 3) throw err;
      await page.waitForLoadState("domcontentloaded", { timeout: 15_000 }).catch(() => {});
      await page.waitForTimeout(300);
    }
  }

  throw new Error("evaluateWithRetry exhausted unexpectedly");
}

export async function attachAuthCookies(
  page: Page,
  ctx: Pick<TestContext, "sessionCookie" | "csrfToken">,
): Promise<void> {
  await page.context().addCookies([
    {
      name: "session",
      value: ctx.sessionCookie.replace(/^session=/, ""),
      domain: "localhost",
      path: "/",
    },
    {
      name: "csrf-token",
      value: ctx.csrfToken,
      domain: "localhost",
      path: "/",
    },
  ]);
}

export async function gotoMobilePage(
  page: Page,
  path: string,
): Promise<void> {
  await page.addInitScript(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      /* private mode / quota — fall through */
    }
  });

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      await page.goto(path, { waitUntil: "domcontentloaded", timeout: 45_000 });
      break;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const retryable =
        message.includes("net::ERR_ABORTED") ||
        message.includes("net::ERR_NETWORK_IO_SUSPENDED") ||
        message.includes("Timeout 45000ms exceeded") ||
        message.includes("frame was detached");
      if (!retryable || attempt === 2) throw err;
      await page.waitForTimeout(500);
    }
  }

  await page.waitForLoadState("load", { timeout: 15_000 }).catch(() => {});
  await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
  await page.waitForTimeout(100);
}

export async function waitForVisiblePageShell(page: Page): Promise<void> {
  await page.waitForLoadState("domcontentloaded");
  const main = page.locator("main").first();
  try {
    await expect(main).toBeVisible({ timeout: 30_000 });
  } catch {
    await expect(page.locator("body")).toBeVisible({ timeout: 30_000 });
  }
}

export async function getHorizontalOverflow(page: Page): Promise<number> {
  return evaluateWithRetry(page, () => {
    const root = document.documentElement;
    return Math.max(0, root.scrollWidth - root.clientWidth);
  });
}

export async function assertNoHorizontalOverflow(
  page: Page,
  label: string,
): Promise<void> {
  await page.waitForTimeout(250);
  const overflow = await getHorizontalOverflow(page);
  expect(overflow, `${label} has horizontal overflow`).toBeLessThanOrEqual(1);
}

export async function findSmallTouchTargets(page: Page): Promise<string[]> {
  return evaluateWithRetry(page, () => {
    const MIN_SIZE = 40;
    const issues: string[] = [];
    const selectors = [
      "button",
      "a[href]",
      "input",
      "select",
      "textarea",
      '[role="button"]',
      '[role="tab"]',
      '[role="link"]',
    ].join(",");

    const isVisible = (el: HTMLElement, rect: DOMRect): boolean => {
      const style = window.getComputedStyle(el);
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        rect.bottom >= 0 &&
        rect.top <= window.innerHeight &&
        rect.right >= 0 &&
        rect.left <= window.innerWidth &&
        style.visibility !== "hidden" &&
        style.display !== "none" &&
        style.pointerEvents !== "none"
      );
    };

    const shouldSkip = (el: HTMLElement): boolean => {
      if (el.hasAttribute("disabled")) return true;
      if (el.getAttribute("aria-disabled") === "true") return true;
      if (el.closest("[hidden], [aria-hidden='true']")) return true;
      if (el.closest("[data-mobile-allow-small-target='true']")) return true;
      if (el.classList.contains("sr-only")) return true;

      const name =
        el.getAttribute("aria-label") ||
        el.getAttribute("title") ||
        (el.textContent || "").trim();
      if (/^skip to content$/i.test(name)) return true;
      const style = window.getComputedStyle(el);
      const isInlineLink =
        el.tagName.toLowerCase() === "a" &&
        style.display === "inline" &&
        !el.querySelector("svg, img");
      return isInlineLink;
    };

    const elements = Array.from(document.querySelectorAll<HTMLElement>(selectors));
    for (const el of elements) {
      if (shouldSkip(el)) continue;
      const rect = el.getBoundingClientRect();
      if (!isVisible(el, rect)) continue;
      if (rect.width < MIN_SIZE || rect.height < MIN_SIZE) {
        const tag = el.tagName.toLowerCase();
        const name =
          el.getAttribute("aria-label") ||
          el.getAttribute("title") ||
          (el.textContent || "").trim();
        issues.push(
          `${tag}[${Math.round(rect.width)}x${Math.round(rect.height)}] "${name.slice(0, 40)}"`,
        );
      }
    }
    return issues;
  });
}

export async function assertTouchTargets(
  page: Page,
  label: string,
  allowSmallTouchTargets = 0,
): Promise<void> {
  const issues = await findSmallTouchTargets(page);
  expect(
    issues.length,
    `${label} has undersized touch targets: ${issues.join(", ")}`,
  ).toBeLessThanOrEqual(allowSmallTouchTargets);
}

export async function findCoveredInteractiveElements(
  page: Page,
): Promise<string[]> {
  return evaluateWithRetry(page, () => {
    const issues: string[] = [];
    const selectors = [
      "button",
      "a[href]",
      "input",
      "select",
      "textarea",
      '[role="button"]',
      '[role="tab"]',
      '[role="link"]',
    ].join(",");

    const elements = Array.from(document.querySelectorAll<HTMLElement>(selectors));
    for (const el of elements) {
      const name =
        el.getAttribute("aria-label") ||
        el.getAttribute("title") ||
        (el.textContent || "").trim();
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      if (
        el.classList.contains("sr-only") ||
        /^skip to content$/i.test(name) ||
        rect.width <= 0 ||
        rect.height <= 0 ||
        rect.bottom < 0 ||
        rect.top > window.innerHeight ||
        rect.right < 0 ||
        rect.left > window.innerWidth ||
        style.visibility === "hidden" ||
        style.display === "none" ||
        style.pointerEvents === "none" ||
        el.hasAttribute("disabled") ||
        el.getAttribute("aria-disabled") === "true"
      ) {
        continue;
      }

      const rects = Array.from(el.getClientRects()).filter(
        (r) =>
          r.width > 0 &&
          r.height > 0 &&
          r.bottom >= 0 &&
          r.top <= window.innerHeight &&
          r.right >= 0 &&
          r.left <= window.innerWidth,
      );
      const sampleRects = rects.length > 0 ? rects : [rect];
      let uncoveredPointFound = false;
      let coveringTop: Element | null = null;
      let coveringRect: DOMRect | null = null;

      for (const sampleRect of sampleRects) {
        const x = Math.min(
          window.innerWidth - 1,
          Math.max(1, sampleRect.left + sampleRect.width / 2),
        );
        const y = Math.min(
          window.innerHeight - 1,
          Math.max(1, sampleRect.top + sampleRect.height / 2),
        );
        const scrollClip = el.closest<HTMLElement>(
          "[data-admin-tab-list], [data-slot='table-container'], .dd-mobile-scroll-x, .dd-mobile-chart-scroll",
        );
        if (scrollClip) {
          const clipRect = scrollClip.getBoundingClientRect();
          if (
            x < clipRect.left ||
            x > clipRect.right ||
            y < clipRect.top ||
            y > clipRect.bottom
          ) {
            uncoveredPointFound = true;
            break;
          }
        }

        const top = document.elementFromPoint(x, y);
        if (!top || top === el || el.contains(top)) {
          uncoveredPointFound = true;
          break;
        }
        if (top.closest("nextjs-portal")) {
          uncoveredPointFound = true;
          break;
        }
        if (top instanceof HTMLElement && top.contains(el)) {
          const hasScrollableAncestor = Boolean(
            el.closest<HTMLElement>(
              "[data-admin-tab-list], [data-slot='table-container'], .dd-mobile-scroll-x, .dd-mobile-chart-scroll",
            ),
          );
          if (hasScrollableAncestor) {
            uncoveredPointFound = true;
            break;
          }
        }

        const topInteractive = top.closest<HTMLElement>(selectors);
        if (topInteractive === el) {
          uncoveredPointFound = true;
          break;
        }
        coveringTop = top;
        coveringRect = sampleRect;
      }

      if (uncoveredPointFound || !coveringTop) continue;

      const mobileTabBar = coveringTop.closest<HTMLElement>(".mobile-tab-bar");
      if (mobileTabBar && coveringRect) {
        const root = document.scrollingElement || document.documentElement;
        const maxScrollY = Math.max(0, root.scrollHeight - window.innerHeight);
        const tabTop = mobileTabBar.getBoundingClientRect().top;
        const scrollNeeded = Math.max(0, coveringRect.bottom - tabTop + 8);
        const canScrollIntoSafeArea = window.scrollY + scrollNeeded <= maxScrollY + 1;
        if (canScrollIntoSafeArea) continue;
      }

      const topInteractive = coveringTop.closest<HTMLElement>(selectors);
      const topName =
        topInteractive?.getAttribute("aria-label") ||
        topInteractive?.getAttribute("title") ||
        topInteractive?.textContent?.trim() ||
        coveringTop.tagName.toLowerCase();
      issues.push(
        `${el.tagName.toLowerCase()} "${name.slice(0, 40)}" covered by ${coveringTop.tagName.toLowerCase()} "${topName.slice(0, 40)}"`,
      );
    }

    return issues;
  });
}

export async function assertFixedLayersDoNotCoverControls(
  page: Page,
  label: string,
): Promise<void> {
  const issues = await findCoveredInteractiveElements(page);
  expect(
    issues,
    `${label} has covered interactive elements`,
  ).toEqual([]);
}

export async function assertPageCanReachScrollableContent(
  page: Page,
  label: string,
): Promise<void> {
  const result = await evaluateWithRetry(page, () => {
    const root = document.scrollingElement || document.documentElement;
    const scrollHeight = Math.max(
      root.scrollHeight,
      document.body.scrollHeight,
    );
    const pageScrollable = scrollHeight > window.innerHeight + 48;
    const scrollables = Array.from(document.querySelectorAll<HTMLElement>("*"))
      .filter((el) => {
        const style = window.getComputedStyle(el);
        const overflowY = style.overflowY;
        return (
          (overflowY === "auto" || overflowY === "scroll") &&
          el.scrollHeight > el.clientHeight + 4 &&
          el.getBoundingClientRect().height > 0
        );
      })
      .length;

    return { pageScrollable, scrollables };
  });

  if (!result.pageScrollable) return;

  const scrollCheck = await evaluateWithRetry(page, async () => {
    const original = window.scrollY;
    const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    window.scrollTo(0, 0);
    await wait(100);
    const before = window.scrollY;
    window.scrollTo(0, document.documentElement.scrollHeight);
    await wait(100);
    const after = window.scrollY;
    window.scrollTo(0, original);
    await wait(100);
    return { before, after };
  });

  expect(
    scrollCheck.after > scrollCheck.before || result.scrollables > 0,
    `${label} appears scroll-locked despite overflow content`,
  ).toBeTruthy();
}

export async function assertMobilePageHealth(
  page: Page,
  options: MobileHealthOptions,
): Promise<void> {
  await waitForVisiblePageShell(page);
  await assertNoHorizontalOverflow(page, options.label);
  await assertFixedLayersDoNotCoverControls(page, options.label);
  await assertTouchTargets(
    page,
    options.label,
    options.allowSmallTouchTargets ?? 0,
  );
  await assertPageCanReachScrollableContent(page, options.label);
}
