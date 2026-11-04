#!/bin/bash
# UserPromptSubmit hook: detect keywords in user message and inject process reminders
# Reads JSON from stdin: { "prompt": "user message text", ... }

INPUT=$(cat)
PROMPT=$(echo "$INPUT" | jq -r '.prompt // empty' 2>/dev/null)

[ -z "$PROMPT" ] && exit 0

REMINDERS=""

# Feature/implementation keywords → task sizing reminder (not always Phase 0)
if echo "$PROMPT" | grep -qiE '(implement|add feature|create.*component|new.*api|build|develop|新增|实现|开发|添加)'; then
  REMINDERS="${REMINDERS}[Task Sizing] 先判断 S/M/L/R 分级: S=直接做, M=轻量计划, L=拆任务并行, R=先与用户确认。不要一律 Phase 0。\n"
fi

# i18n keywords → bilingual sync reminder
if echo "$PROMPT" | grep -qiE '(i18n|text|文案|label|title|button|placeholder|翻译|国际化|字典)'; then
  REMINDERS="${REMINDERS}[i18n] en/zh 字典必须同步修改，完成后跑 npm run lint:i18n。\n"
fi

# Database keywords → schema sync reminder
if echo "$PROMPT" | grep -qiE '(database|db|table|schema|migration|column|index|数据库|表|迁移|字段)'; then
  REMINDERS="${REMINDERS}[DB] 变更必须同步: schema.sql + 新建 migration 文件 (scripts/migrations/NNN_*.sql)。\n"
fi

# Scoring/archetype keywords → frozen zone reminder
if echo "$PROMPT" | grep -qiE '(scoring|archetype|评分|原型|lib/scoring|lib/content)'; then
  REMINDERS="${REMINDERS}[Frozen] lib/scoring/ 和 lib/content/ 是冻结区域，修改前必须与用户讨论。\n"
fi

# UI/design keywords → design spec + visual verify reminder
if echo "$PROMPT" | grep -qiE '(ui|ux|design|component|layout|animation|responsive|组件|界面|设计|动画|布局|page|页面|样式|style)'; then
  REMINDERS="${REMINDERS}[Design] 改前端前看 .claude/skills/deepdive-design/SKILL.md 设计规范。\n"
  REMINDERS="${REMINDERS}[Visual QA] 前端改完后用 /preview 快速截图验证，或跑 /qa browser 做完整测试。\n"
fi

if [ -n "$REMINDERS" ]; then
  ESCAPED=$(echo -e "$REMINDERS" | sed 's/"/\\"/g' | tr '\n' ' ')
  echo "{\"hookSpecificOutput\":{\"hookEventName\":\"UserPromptSubmit\",\"additionalContext\":\"$ESCAPED\"}}"
fi
