import { describe, it, expect } from "vitest"
import enDict from "../dictionaries/en.json"
import zhDict from "../dictionaries/zh.json"
import { isValidLocale, locales, defaultLocale } from "../config"

describe("i18n configuration", () => {
  it("should have all supported locales", () => {
    expect(locales).toContain("en")
    expect(locales).toContain("zh")
    expect(locales).toContain("nl")
    expect(locales).toContain("de")
    expect(locales).toContain("fr")
    expect(locales).toContain("es")
    expect(locales).toContain("pt")
    expect(locales).toContain("it")
    expect(locales).toContain("ru")
    expect(locales).toContain("ja")
    expect(locales).toContain("ko")
  })

  it("should have en as default locale", () => {
    expect(defaultLocale).toBe("en")
  })

  it("should validate locales correctly", () => {
    expect(isValidLocale("en")).toBe(true)
    expect(isValidLocale("zh")).toBe(true)
    expect(isValidLocale("fr")).toBe(true)
    expect(isValidLocale("ar")).toBe(false)
    expect(isValidLocale("")).toBe(false)
  })
})

describe("dictionary completeness", () => {
  function getKeys(obj: Record<string, unknown>, prefix = ""): string[] {
    const keys: string[] = []
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        keys.push(...getKeys(value as Record<string, unknown>, fullKey))
      } else {
        keys.push(fullKey)
      }
    }
    return keys.sort()
  }

  it("should have matching keys between en and zh dictionaries", () => {
    const enKeys = getKeys(enDict)
    const zhKeys = getKeys(zhDict)

    const missingInZh = enKeys.filter((k) => !zhKeys.includes(k))
    const missingInEn = zhKeys.filter((k) => !enKeys.includes(k))

    expect(missingInZh).toEqual([])
    expect(missingInEn).toEqual([])
  })

  it("should have all required top-level sections in en dictionary", () => {
    const requiredSections = [
      "nav", "common", "narrativeExplore", "quickDive",
      "reportsPage", "loginForm", "registerForm",
      "reportCard", "profile",
      "actionPlan", "moduleTransition", "reportsList", "dashboardPage",
      "loginPage", "registerPage", "reportView",
      "questionnaireReviewPage", "landing", "depthMeter",
      "coachingChat", "logoutButton",
    ]

    for (const section of requiredSections) {
      expect(enDict).toHaveProperty(section)
      expect(zhDict).toHaveProperty(section)
    }
  })

  it("should not have empty string values in dictionaries", () => {
    // Keys that are intentionally empty in one locale
    // e.g., colorSuffix is "" in EN because English doesn't need a suffix, ZH uses "色"
    const allowedEmpty: Record<string, string[]> = {
      en: [],
      zh: [],
    }

    const enKeys = getKeys(enDict)
    const zhKeys = getKeys(zhDict)

    for (const key of enKeys) {
      if (allowedEmpty.en.includes(key)) continue
      const value = key.split(".").reduce((obj: any, k) => obj?.[k], enDict)
      expect(value, `en.${key} should not be empty`).not.toBe("")
    }

    for (const key of zhKeys) {
      if (allowedEmpty.zh.includes(key)) continue
      const value = key.split(".").reduce((obj: any, k) => obj?.[k], zhDict)
      expect(value, `zh.${key} should not be empty`).not.toBe("")
    }
  })
})

describe("template interpolation", () => {
  it("should have matching template variables between en and zh", () => {
    function findTemplateVars(obj: Record<string, unknown>, prefix = ""): Record<string, string[]> {
      const result: Record<string, string[]> = {}
      for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key
        if (typeof value === "string") {
          const matches = value.match(/\{\{(\w+)\}\}/g)
          if (matches) {
            result[fullKey] = matches.sort()
          }
        } else if (typeof value === "object" && value !== null) {
          Object.assign(result, findTemplateVars(value as Record<string, unknown>, fullKey))
        }
      }
      return result
    }

    const enVars = findTemplateVars(enDict)
    const zhVars = findTemplateVars(zhDict)

    for (const [key, vars] of Object.entries(enVars)) {
      expect(zhVars[key], `zh.${key} should have the same template variables as en`).toEqual(vars)
    }
  })
})
