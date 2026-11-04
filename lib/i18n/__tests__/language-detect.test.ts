import { describe, it, expect } from "vitest";
import {
  countScripts,
  DEFAULT_SKIP_KEYS,
  detectLanguageMismatch,
  findMismatchedFields,
} from "../language-detect";

describe("countScripts", () => {
  it("counts pure ASCII", () => {
    const c = countScripts("Hello world");
    expect(c.latin).toBe(10);
    expect(c.cjkHan).toBe(0);
    expect(c.total).toBe(10);
  });

  it("counts pure Chinese", () => {
    const c = countScripts("你好世界");
    expect(c.cjkHan).toBe(4);
    expect(c.latin).toBe(0);
    expect(c.total).toBe(4);
  });

  it("counts mixed Japanese (hiragana + kanji)", () => {
    const c = countScripts("この役職は探索する価値があります");
    expect(c.hiragana).toBeGreaterThan(0);
    expect(c.cjkHan).toBeGreaterThan(0);
  });

  it("counts katakana separately from hiragana", () => {
    const c = countScripts("コーヒー");
    expect(c.katakana).toBeGreaterThan(0);
    expect(c.hiragana).toBe(0);
  });

  it("counts Hangul", () => {
    const c = countScripts("한국어");
    expect(c.hangul).toBe(3);
  });

  it("counts Cyrillic", () => {
    const c = countScripts("Привет мир");
    expect(c.cyrillic).toBe(9);
  });

  it("excludes whitespace, punctuation, digits", () => {
    const c = countScripts("Hi! 1 2 3, OK?");
    expect(c.total).toBe(4);
    expect(c.latin).toBe(4);
  });
});

describe("detectLanguageMismatch — en locale", () => {
  it("pure English passes", () => {
    const r = detectLanguageMismatch(
      "Make sure to search for roles that do not require visa sponsorship.",
      "en",
    );
    expect(r.isMismatch).toBe(false);
  });

  it("pure Chinese in EN fails (Jacky bug scenario)", () => {
    const r = detectLanguageMismatch(
      "签证策略 确保寻找的职位不需要签证赞助，并关注那些在您的目标城市中提供签证赞助的公司。",
      "en",
    );
    expect(r.isMismatch).toBe(true);
    expect(r.foreignScripts).toContain("cjkHan");
    expect(r.foreignRatio).toBeGreaterThan(0.9);
  });

  it("single proper noun reference stays under threshold", () => {
    const r = detectLanguageMismatch(
      "Search for roles in Beijing and New York that match your profile.",
      "en",
    );
    expect(r.isMismatch).toBe(false);
  });

  it("whitelisted city name is stripped before detection", () => {
    const r = detectLanguageMismatch(
      "Living in 北京 requires visa sponsorship for most tech roles.",
      "en",
      { whitelistPhrases: ["北京"] },
    );
    expect(r.isMismatch).toBe(false);
  });

  it("20% Chinese content without whitelist fails", () => {
    // Heavy Chinese mixed with English should trip the threshold
    const r = detectLanguageMismatch(
      "We recommend 教育科技 and 内容创作 fields.",
      "en",
    );
    expect(r.isMismatch).toBe(true);
  });

  it("Cyrillic leak in English fails", () => {
    const r = detectLanguageMismatch("Your role is Менеджер at Google", "en");
    expect(r.isMismatch).toBe(true);
    expect(r.foreignScripts).toContain("cyrillic");
  });

  it("empty string passes", () => {
    expect(detectLanguageMismatch("", "en").isMismatch).toBe(false);
    expect(detectLanguageMismatch("   ", "en").isMismatch).toBe(false);
  });
});

describe("detectLanguageMismatch — zh locale", () => {
  it("pure Chinese passes", () => {
    const r = detectLanguageMismatch(
      "我们建议你探索教育科技领域，关注头部公司的招聘趋势。",
      "zh",
    );
    expect(r.isMismatch).toBe(false);
  });

  it("English leak in Chinese fails", () => {
    const r = detectLanguageMismatch(
      "The role of product manager is a key direction worth exploring",
      "zh",
    );
    expect(r.isMismatch).toBe(true);
    expect(r.foreignScripts).toContain("latin");
  });

  it("brand name in Chinese passes", () => {
    const r = detectLanguageMismatch(
      "在LinkedIn上搜索相关岗位，关注头部科技公司的JD要求。",
      "zh",
    );
    expect(r.isMismatch).toBe(false);
  });

  it("enum-like identifier token passes by default", () => {
    expect(detectLanguageMismatch("coaching_insight", "zh").isMismatch).toBe(
      false,
    );
    expect(detectLanguageMismatch("LinkedIn", "zh").isMismatch).toBe(false);
  });

  it("long English sentence with spaces still fails in Chinese", () => {
    const r = detectLanguageMismatch(
      "Based in New York and looking for remote roles",
      "zh",
    );
    expect(r.isMismatch).toBe(true);
  });

  it("can disable enum-like token skipping explicitly", () => {
    const r = detectLanguageMismatch("exploring", "zh", {
      skipEnumLikeTokens: false,
    });
    expect(r.isMismatch).toBe(true);
  });
});

describe("detectLanguageMismatch — ja locale", () => {
  it("valid Japanese with kana passes", () => {
    const r = detectLanguageMismatch("この役職は探索する価値があります", "ja");
    expect(r.isMismatch).toBe(false);
  });

  it("pure Han without kana fails (Chinese leak)", () => {
    const r = detectLanguageMismatch("这个职位值得探索", "ja");
    expect(r.isMismatch).toBe(true);
    expect(r.foreignScripts).toContain("cjkHan");
  });
});

describe("detectLanguageMismatch — ru locale", () => {
  it("valid Russian passes", () => {
    const r = detectLanguageMismatch(
      "Стоит исследовать эту роль подробнее в следующем месяце",
      "ru",
    );
    expect(r.isMismatch).toBe(false);
  });

  it("English in Russian fails", () => {
    const r = detectLanguageMismatch(
      "We strongly recommend exploring this role next month",
      "ru",
    );
    expect(r.isMismatch).toBe(true);
  });
});

describe("detectLanguageMismatch — Latin-script locales", () => {
  it("Dutch passes", () => {
    const r = detectLanguageMismatch(
      "We raden je aan om deze rol verder te verkennen.",
      "nl",
    );
    expect(r.isMismatch).toBe(false);
  });

  it("whole English paragraph in Dutch fails", () => {
    const r = detectLanguageMismatch(
      "We recommend that you explore this career direction because your values show autonomy and growth.",
      "nl",
    );
    expect(r.isMismatch).toBe(true);
    expect(r.foreignScripts).toContain("latin");
  });

  it("Chinese leak in Dutch fails", () => {
    const r = detectLanguageMismatch(
      "We raden 教育科技 aan voor je volgende stap in je carrière.",
      "nl",
    );
    expect(r.isMismatch).toBe(true);
  });
});

describe("findMismatchedFields", () => {
  it("scans nested objects", () => {
    const obj = {
      jobSearchStrategy: {
        positioning: "Position yourself strategically.",
        constraintStrategies: [
          { constraint: "签证策略", strategy: "确保寻找的职位不需要签证赞助" },
          { constraint: "Salary floor", strategy: "Target $80k minimum" },
        ],
        resumeHighlights: ["Highlight X", "突出重点"],
      },
    };
    const results = findMismatchedFields(obj, "en");
    expect(results.length).toBeGreaterThan(0);
    const paths = results.map((r) => r.path);
    expect(paths).toContain(
      "jobSearchStrategy.constraintStrategies[0].constraint",
    );
    expect(paths).toContain(
      "jobSearchStrategy.constraintStrategies[0].strategy",
    );
    expect(paths).toContain("jobSearchStrategy.resumeHighlights[1]");
    // Valid English should not appear
    expect(paths).not.toContain("jobSearchStrategy.positioning");
    expect(paths).not.toContain(
      "jobSearchStrategy.constraintStrategies[1].constraint",
    );
  });

  it("returns empty array for fully valid output", () => {
    const obj = {
      title: "Your career direction",
      tips: ["Tip one", "Tip two"],
    };
    expect(findMismatchedFields(obj, "en")).toEqual([]);
  });

  it("handles null/undefined leaves", () => {
    const obj = { a: null, b: undefined, c: "valid english text" };
    expect(findMismatchedFields(obj, "en")).toEqual([]);
  });

  it("handles nested arrays correctly", () => {
    const obj = {
      weeks: [
        { tasks: ["Search LinkedIn", "阅读行业报告"] },
        { tasks: ["Join a community"] },
      ],
    };
    const results = findMismatchedFields(obj, "en");
    expect(results.map((r) => r.path)).toEqual(["weeks[0].tasks[1]"]);
  });

  it("applies whitelist phrases to all fields", () => {
    const obj = {
      location: "Based in 北京",
      direction: "Product Manager in 北京",
    };
    expect(
      findMismatchedFields(obj, "en", { whitelistPhrases: ["北京"] }),
    ).toEqual([]);
  });

  it("DEFAULT_SKIP_KEYS automatically skips enum / timestamp fields", () => {
    const obj = {
      memories: [
        {
          category: "coaching_insight",
          source: "coaching",
          createdAt: "2026-04-22T10:00:00Z",
          method: "llm",
          keyword: "探索方向",
          insight: "你倾向于在多个方向之间游走，而不是立刻锁定一个。",
        },
      ],
    };
    expect(DEFAULT_SKIP_KEYS).toContain("createdAt");
    expect(DEFAULT_SKIP_KEYS).toContain("method");
    expect(findMismatchedFields(obj, "zh")).toEqual([]);
  });

  it("unions DEFAULT_SKIP_KEYS with caller-provided skipKeys", () => {
    const obj = {
      data: {
        source: "coaching",
        customKey: "linkedin_post",
        keyword: "探索方向",
      },
    };

    expect(
      findMismatchedFields(obj, "zh", {
        skipKeys: ["customKey"],
      }),
    ).toEqual([]);
  });
});
