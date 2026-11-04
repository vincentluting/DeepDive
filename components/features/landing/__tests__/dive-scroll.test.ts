import { describe, expect, it } from "vitest";

import {
  BAND_PROGRESS,
  buildVeilStops,
  oceanOpacityFor,
  resolveDepthSection,
  veilProgressFor,
} from "../use-dive-scroll";
import { segmentWords } from "../stagger-words";

describe("oceanOpacityFor", () => {
  it("starts fully opaque at the surface", () => {
    expect(oceanOpacityFor(0)).toBe(1);
  });

  it("fades as the visitor descends", () => {
    expect(oceanOpacityFor(800)).toBeCloseTo(1 - 0.5 * 0.86, 5);
  });

  it("clamps at the floor opacity for deep scrolls", () => {
    expect(oceanOpacityFor(1600)).toBeCloseTo(0.14, 5);
    expect(oceanOpacityFor(50_000)).toBeCloseTo(0.14, 5);
  });

  it("never goes below the 0.08 floor", () => {
    for (const y of [0, 400, 1200, 3200, 99_999]) {
      expect(oceanOpacityFor(y)).toBeGreaterThanOrEqual(0.08);
    }
  });
});

describe("resolveDepthSection", () => {
  it("maps narrative bands to rail stations", () => {
    expect(resolveDepthSection("surface")).toEqual({
      band: "surface",
      station: 0,
    });
    expect(resolveDepthSection("photic")).toEqual({
      band: "photic",
      station: 1,
    });
    expect(resolveDepthSection("twilight")).toEqual({
      band: "twilight",
      station: 2,
    });
    expect(resolveDepthSection("abyss")).toEqual({
      band: "abyss",
      station: 3,
    });
  });

  it("keeps the rail at the final station while surfacing (footer)", () => {
    expect(resolveDepthSection("surfacing")).toEqual({
      band: "photic",
      station: 3,
    });
  });

  it("returns null for unknown or missing markers", () => {
    expect(resolveDepthSection(undefined)).toBeNull();
    expect(resolveDepthSection("bathypelagic")).toBeNull();
  });
});

describe("BAND_PROGRESS", () => {
  it("lands on the original veil tiers when multiplied by the mode caps", () => {
    // Light cap .42 → 0 / .16 / .30 / .42; dark cap .8 → 0 / .30 / .57 / .80
    expect(BAND_PROGRESS).toEqual({
      surface: 0,
      photic: 0.38,
      twilight: 0.71,
      abyss: 1,
    });
    expect(BAND_PROGRESS.photic * 0.42).toBeCloseTo(0.16, 2);
    expect(BAND_PROGRESS.twilight * 0.42).toBeCloseTo(0.3, 2);
    expect(BAND_PROGRESS.abyss * 0.42).toBeCloseTo(0.42, 2);
  });
});

describe("buildVeilStops", () => {
  const sections = [
    { marker: "surface", top: 0 },
    { marker: "photic", top: 1000 },
    { marker: "twilight", top: 2400 },
    { marker: "abyss", top: 4000 },
    { marker: "surfacing", top: 5200 },
  ];

  it("offsets each anchor by the viewport lead and clamps at zero", () => {
    const stops = buildVeilStops(sections, 900);
    expect(stops[0]).toEqual({ y: 0, v: 0 }); // max(0, 0 - 315)
    expect(stops[1]).toEqual({ y: 1000 - 315, v: 0.38 });
    expect(stops[4]).toEqual({ y: 5200 - 315, v: 0.38 }); // surfacing recedes
  });

  it("skips unknown markers instead of throwing", () => {
    const stops = buildVeilStops(
      [...sections, { marker: "bathypelagic", top: 9999 }],
      900,
    );
    expect(stops).toHaveLength(5);
  });

  it("forms plateaus from consecutive same-band sections", () => {
    const stops = buildVeilStops(
      [
        { marker: "photic", top: 1000 },
        { marker: "photic", top: 1800 },
      ],
      900,
    );
    expect(stops[0].v).toBe(stops[1].v);
  });
});

describe("veilProgressFor", () => {
  const stops = buildVeilStops(
    [
      { marker: "surface", top: 0 },
      { marker: "photic", top: 1000 },
      { marker: "twilight", top: 2400 },
      { marker: "abyss", top: 4000 },
      { marker: "surfacing", top: 5200 },
    ],
    900,
  );

  it("returns 0 with no stops (SSR-safe default)", () => {
    expect(veilProgressFor(500, [])).toBe(0);
  });

  it("holds the first stop value before the descent begins", () => {
    expect(veilProgressFor(0, stops)).toBe(0);
  });

  it("interpolates linearly between anchors", () => {
    const y0 = stops[0].y;
    const y1 = stops[1].y;
    const mid = (y0 + y1) / 2;
    expect(veilProgressFor(mid, stops)).toBeCloseTo(0.19, 5);
  });

  it("holds plateaus between same-value anchors", () => {
    const plateau = buildVeilStops(
      [
        { marker: "photic", top: 1000 },
        { marker: "photic", top: 1800 },
      ],
      900,
    );
    expect(veilProgressFor(1200, plateau)).toBe(0.38);
  });

  it("recedes toward photic across the surfacing stretch", () => {
    const yAbyss = stops[3].y;
    const ySurfacing = stops[4].y;
    const mid = (yAbyss + ySurfacing) / 2;
    expect(veilProgressFor(mid, stops)).toBeCloseTo((1 + 0.38) / 2, 5);
  });

  it("clamps past the final anchor", () => {
    expect(veilProgressFor(99_999, stops)).toBe(0.38);
  });

  it("handles duplicate-y anchors without dividing by zero", () => {
    const dup = [
      { y: 100, v: 0 },
      { y: 100, v: 1 },
    ];
    expect(veilProgressFor(100, dup)).toBe(0);
    expect(veilProgressFor(101, dup)).toBe(1);
  });
});

describe("segmentWords", () => {
  it("splits latin headings into words and whitespace", () => {
    const segments = segmentWords("The world is accelerating.", "en");
    expect(segments.join("")).toBe("The world is accelerating.");
    expect(segments.filter((s) => /\S/.test(s)).length).toBeGreaterThanOrEqual(
      4,
    );
  });

  it("splits CJK headings into multiple segments (the v6 regression)", () => {
    const segments = segmentWords("世界正在加速。", "zh");
    expect(segments.join("")).toBe("世界正在加速。");
    // split(/\s+/) would return a single motionless block — Segmenter must not
    expect(segments.length).toBeGreaterThan(1);
  });

  it("reassembles to the exact original text for every locale shape", () => {
    for (const [text, locale] of [
      ["Vijf minuten tot je eerste spiegel", "nl"],
      ["5分で、最初の鏡に出会う", "ja"],
      ["Пять минут до первого зеркала", "ru"],
    ] as const) {
      expect(segmentWords(text, locale).join("")).toBe(text);
    }
  });
});
