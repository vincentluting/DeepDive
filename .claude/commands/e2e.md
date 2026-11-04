---
disable-model-invocation: true
---

跑 Playwright E2E 测试一次或多次，汇总结果。

默认 1 次。用户指定次数：`/e2e 3` 跑 3 次。用户传 suite 名称：`/e2e full` / `/e2e core` / `/e2e llm`（默认 core）。

## Pre-flight

按顺序检查，任一失败立即停止并向用户解释：

1. **`.env.local` 必备凭证**
   - `NEON_API_KEY` + `NEON_PROJECT_ID`（创建临时分支用）
   - 缺失 → 说明用户去 https://console.neon.tech/app/settings/api-keys 拿 key

2. **`GROQ_API_KEY` 强烈推荐**
   - 缺失 → 警告：本次会走 production LLM（烧 Anthropic/Gemini 配额、受 provider outage 影响、慢 5-10×）
   - 让用户决定：去 https://console.groq.com/keys 拿免费 key，或确认接受跑 production 路由
   - 不要默认替用户决定

3. **端口 3001 / 项目目录 dev server**
   - `lsof -i :3001` — `npm run test:e2e:*` 用 3001（不是 3000）
   - ⚠️ **runner 行为**：`scripts/e2e-with-branch.ts:107 stopExistingDevServer()` 会主动 SIGTERM 当前项目目录下的 `next dev` 进程（包括 3000 端口的本地 dev server）
   - 占用 3001 但**不是**项目自己的 next dev → 不会自动清，让用户先停
   - 占用 3001 **是**项目自己的 next dev → runner 会自己处理，不需提醒

4. **Playwright Chromium 已装**
   - `node_modules/@playwright/test/package.json` 存在即可
   - 缺失 → `npx playwright install chromium`

## Execution

**`test:e2e* | <任何 pipe>` 在任何形式下都被 `.claude/hooks/guard-e2e.sh` 拦死**——启发式检测无法可靠区分 echo/文件名/子 shell/引号/路径/`command tee`/`/usr/bin/tee`/`|& tee` 等等等。Hook 改用**白名单 wrapper 模式**，4 轮 cross-review 结论。三个合规执行方式：

```bash
# 选项 1：wrapper（最简单，内部已设 pipefail）
bash scripts/e2e-tee.sh ${SUITE}                  # 默认日志 /tmp/e2e-<suite>-<ts>.log
bash scripts/e2e-tee.sh ${SUITE} /tmp/my-run.log  # 自定义日志

# 选项 2：Bash 工具的 run_in_background（自动捕获 stdout 到文件）
# 由 Claude 调用 Bash tool 时设 run_in_background: true，无需 tee

# 选项 3：纯重定向（无 pipe → 无 pipefail 顾虑）
npm run test:e2e:${SUITE} > /tmp/log 2>&1
EXIT=$?
```

历史教训（参考用，**不要照抄**）：

- ❌ `npm run test:e2e:full | tee log` → 被 hook 拦
- ❌ `set -o pipefail; npm run ... | tee log` → 也被 hook 拦（hook 不再尝试检测 pipefail）
- ❌ `npm run ... |& tee log` → 一字符 bypass，也被拦
- ❌ `; echo EXIT=${PIPESTATUS[0]}` → zsh 没这个变量；bash 里也只是 echo 的副作用，对控制流没用

Suite 选项（来自 `scripts/e2e-with-branch.ts:393` 的 `CORE_PROJECTS` 数组 + `playwright.config.ts:34` 的 21 个 project）：

- `core`（默认）：14 个非 LLM-heavy 项目（不含 `coaching-flow / coaching-layout / report-rendering / report-stream-fallback / audit-features / research-survey-flow / mobile-visual-regression`）
- `full`：21 个项目全跑（含全部 LLM-heavy + 视觉回归）
- `llm`：仅 LLM-heavy（`coaching-flow / report-rendering / audit-features`）+ `core-journey` 做管道烟测

数字会随 `playwright.config.ts` 调整漂移，跑前可校验：`grep -cE 'name: "' playwright.config.ts`

每次 run 用 `run_in_background: true` 启动，避免 Bash 工具 10 分钟超时；通过通知机制等完成。

## 数据收集

每次 run 解析 log。**注意所有含方括号的字面字符串都用 `grep -F`**（fixed string），否则 `[model-router]` 会被当成字符类、`[report-gen]` 在 macOS BSD grep 上甚至会报 `invalid character range`（`t-g` 是反向区间）。

- 总 tests / passed / failed / skipped 数
- Per-project 通过/失败计数（`grep -E "^\s+[✓✘\-]\s+[0-9]+\s+\["`）
- Skip 原因（`-` 标记后的 spec 路径）
- 报告生成耗时：`grep -F '[report-gen] Pipeline completed in'`
- LLM provider 路由：`grep -F '[model-router]'`
  - banner（独立来源，不在 model-router 日志里）：`grep -F '🧪 E2E LLM:'` 或 `grep '⚠️  E2E LLM:'`
  - fallback 频率：`grep -F 'Primary provider unavailable'`
- 失败详情：`grep -E "^\s+✘.*spec\.ts"` + 捕获错误上下文

## LLM Cost / Provider 推断

按报告生成耗时推断（次要信号，banner 是首要信号）：

- < 5s → Groq（免费）
- 5-15s → Gemini（便宜）
- 25-45s → Anthropic + Gemini fallback 混合
- > 60s → Anthropic primary（贵）

Banner 出现 `production routing` 时务必在报告强调。

## 输出报告（中文）

```
🧪 E2E Test Report (N runs, suite: SUITE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: X tests × N runs · Duration: avg Tm

✅ Passed: A/X · ❌ Failed: B/X · ⏭️ Skipped: C/X

LLM provider: [Groq / production-with-fallback / production-anthropic]

Per-project breakdown:
  smoke:                     N/N ✓
  ...（按项目逐行，按通过率倒序）
  mobile-visual-regression:  3/8 ❌（5 baseline drift）

Report generation: avg Xs（N 次真实生成）

🔴 Failed tests:
  - [project] › [spec:line] › [test name]: [error 1 行摘要]

⏭️ Skipped tests（如有）:
  - [project] › [test name]: [skip reason if available]

🔁 Flaky tests (N>1)：
  - [test]: passed X/N, failed Y/N — [first failure excerpt]

💰 LLM cost: free（Groq）/ ~$X.XX（production，按 token 估算）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 失败处理

- 一致失败（N/N）→ 报错误信息 + 第一性原因猜测，让用户决定
- 间歇失败（X/N，X<N）→ 标 flaky，列出失败 run 的错误摘要
- 视觉回归失败 → 区分严重度：
  - ratio > 0.20 → "整页结构变化，需要看 diff 图判断是真改动还是渲染崩了"
  - ratio 0.05-0.20 → "中等差异，可能是 UI 改动"
  - ratio < 0.05 → "像素级抖动，可能是字体/抗锯齿"
- LLM 路由异常（banner 是 production，user 没显式 opt out）→ 提醒用户 Groq 没生效

**绝不**自动修复或 commit。仅报告。

## 不做的事

- ❌ 不自动 update-snapshots（视觉回归 baseline 是 review 步骤）
- ❌ 不重跑挂掉的测试试图复现（一次 run 数据已经够诊断）
- ❌ 不 silent retry flaky tests（`retries: 0` 是项目默认）
- ❌ 不修改 `playwright.config.ts` 或测试文件
