---
title: i18n Style Guide
category: design
sources:
  - lib/i18n/dictionaries/en/*.json
  - lib/i18n/dictionaries/zh/*.json
  - proxy.ts
sync_mode: manual
last_verified: 2026-03-20
verified_by: claude-code
---

# Deep Dive i18n Style Guide

> ⚠️ **Meridian 设计系统上线后 (2026-06)**，权威设计源为 [`.claude/skills/deepdive-design/SKILL.md`](../../.claude/skills/deepdive-design/SKILL.md)。本文档保留为历史规范，如与 Meridian 冲突以 skill 为准。

## Supported Locales

| Locale | Language             | Default |
| ------ | -------------------- | ------- |
| `en`   | English              | Yes     |
| `zh`   | Chinese (Simplified) | No      |

## Core Terminology Table

| Concept                        | EN                | ZH           | Notes                                               |
| ------------------------------ | ----------------- | ------------ | --------------------------------------------------- |
| Product name                   | Deep Dive         | Deep Dive    | Never translate                                     |
| Assessment (full)              | Deep Dive         | 深潜测评     |                                                     |
| Quick Dive (pure questions)    | Quick Dive        | 快速探索     | ~3 min, 30 questions                                |
| Narrative Explore (story mode) | Narrative Explore | 叙事探索     | ~5 min, 30 camp scenarios                           |
| Daily check-in                 | Daily Check-in    | 每日1测      | Coaching frequency option, not standalone feature   |
| Dashboard                      | Dashboard         | 控制台       | Use "控制台" consistently, not "仪表盘"             |
| Report                         | Report            | 报告         |                                                     |
| Profile (personal archive)     | Profile           | 档案         |                                                     |
| Archetype (12-type)            | Deep Dive Type    | 深潜型号     | Use "型号" not "原型"                               |
| Archetype badge                | Deep Dive Type    | 深潜型号     | 12-type system (RIASEC × Enhancement/Transcendence) |
| Questionnaire                  | Questionnaire     | 问卷         |                                                     |
| Career direction               | Career Direction  | 职业方向     | Use "最值得你探索的方向" not "最适合你的方向"       |
| Match score                    | Match Score       | 匹配度       |                                                     |
| Confidence                     | Confidence        | 置信度       |                                                     |
| Value anchors                  | Value Anchors     | 价值锚       |                                                     |
| Work style                     | Work Style        | 工作风格     |                                                     |
| Career tensions                | Career Tensions   | 职业张力     |                                                     |
| Coaching                       | Coaching          | 教练         |                                                     |
| ~~Diary~~                      | ~~Career Diary~~  | ~~职业日记~~ | Removed (2026-03-09)                                |
| Job tracker                    | Job Tracker       | 求职追踪     |                                                     |

## UI Button & Action Verbs

| Action          | EN              | ZH       |
| --------------- | --------------- | -------- |
| Continue / Next | Continue        | 继续     |
| Back            | Back            | 返回     |
| Submit          | Submit          | 提交     |
| Save            | Save            | 保存     |
| Cancel          | Cancel          | 取消     |
| Delete          | Delete          | 删除     |
| Generate        | Generate        | 生成     |
| Retry           | Retry           | 重试     |
| Sign In         | Sign In         | 登录     |
| Sign Out        | Sign Out        | 退出     |
| Create Account  | Create Account  | 创建账户 |
| Start Exploring | Start Exploring | 开始探索 |
| View Report     | View Report     | 查看报告 |

## Tone & Person

- **Chinese**: Always use "你" (informal second person). Do NOT use "您" (formal).
- **English**: Use "you/your" directly. Avoid "we" unless referring to the product team.
- **Tone**: Encouraging but restrained. Avoid over-promising or marketing-speak.
  - Good: "最值得你探索的方向"
  - Bad: "最适合你的方向"
- **Low confidence**: Use hedging language ("你倾向于..." / "you tend to..."), not definitive statements.
- **Error messages**: Short, actionable, no blame. Tell the user what to do next.

## Punctuation & Formatting

### Chinese (ZH)

- Use **full-width** punctuation: `，` `。` `！` `？` `：` `；` `（）` `""` `——`
- No space before punctuation
- Use `——` (em dash) not `-` or `--`
- Numbers use half-width: `35%` not `３５％`
- Brand names stay in ASCII: `Deep Dive`, `RIASEC`

### English (EN)

- Use **half-width** punctuation: `,` `.` `!` `?` `:` `;` `()` `""` `—`
- Oxford comma in lists
- Sentence case for headings (capitalize first word only)
- Title Case for proper nouns and product names only

## i18n Implementation Rules

### Dictionary Structure

- Translations split into domain sub-files: `lib/i18n/dictionaries/{en,zh}/*.json` (11 domains: actionHub, admin, coaching, common, dashboard, deepdive, home, profile, quickdive, report, research)
- `get-dictionary.ts` merges sub-files at load time
- Key naming: `section.subsection.element` (camelCase)
- Template variables use `{{variableName}}` syntax

### Component Rules

1. **Never hardcode UI text** in components. Always use dictionary keys.
2. **Server components**: Use `getDictionary(locale)` (async)
3. **Client components**: Use `getDictionaryClient(locale)` (sync)
4. **No `isZh ? '...' : '...'` patterns** — always use dictionary keys
5. **Fallback patterns** like `t.key || "fallback"` are code smell — add the key to the dictionary instead
6. **Template interpolation**: Use `interpolate(t.template, { var: value })` for dynamic content

### Date & Number Formatting

- Use `toDateLocale(locale)` from `lib/i18n/config.ts` for date formatting
- Format dates with `Intl.DateTimeFormat` using the locale
- Format numbers with `Intl.NumberFormat` using the locale
- Percentages: Always use `%` (half-width), e.g., `35%`

### Adding New Translations

1. Add key to BOTH `en/<domain>.json` and `zh/<domain>.json` simultaneously
2. Update the `Dictionary` interface in `get-dictionary.ts` if adding a new section
3. Run `npm run lint:i18n` to verify key parity and check for hardcoded strings

## Accessibility (a11y) Text

- All interactive elements must have accessible labels
- Use `aria-label` for icon-only buttons
- Screen-reader-only text uses `sr-only` class
- Accessibility text should also be localized (use the `a11y` dictionary section)

## SEO / Metadata

- Page titles and descriptions must be localized using `generateMetadata` (not static `export const metadata`)
- OpenGraph tags should match page metadata
- Use the `metadata` dictionary section for page-level SEO text
