# 质量保障协议 — Adversarial Red Team 3 ✅ Sign-Off

> 论文数据采集前的 bug 清零协议。源于 2026-05-22 用户明确指出：之前 Claude 多次说"零 bug"但用户实测一堆，根因是 self-sign-off 盲区。
> 本协议为 `feedback_auto-cross-review` 的强化版（不是替代）。

## 核心原则

**Claude 和 Codex 不是 reviewer，是 red team — 互相挑战找漏洞。谁都不能 self-sign-off。**

每个 bug 必须 3 个 ✅ 才能 close：

1. **Claude ✅** — 修代码 + 跑相关验证（tsc/test/lint/lint:i18n + UI 截图）
2. **Codex ✅** — `codex exec -s read-only` 独立审同一份代码，给 PASS 才填
3. **User ✅** — 用户实测确认（ground truth，必须等用户）

## 为什么是 3 个，不是 2 个

| 单方        | 已知盲区                                                                  |
| ----------- | ------------------------------------------------------------------------- |
| Claude 自审 | 同模型同视角，CI 绿灯 ≠ 用户可用（历史多次踩坑）                          |
| Codex       | 基于 grep 的结论历史误报率高（见 `operational_audit-agent-verification`） |
| User 实测   | Ground truth 但成本高，不能用它当主审；只用来 final verify                |

三方互为对冲：Claude 修代码 + Codex 独立反驳 + User 用真实输入验证。

## Bug 发现阶段

### Claude 主轨 (Phase 2)

按 5 维度跑现成 skill / 工具：

| 维度     | 工具                                                         |
| -------- | ------------------------------------------------------------ |
| Journey  | Playwright MCP 跑全链路 thesis/beta × en/zh + admin          |
| Edge     | `.claude/skills/edge-audit/SKILL.md` (`/edge-audit full`)    |
| Biz      | `.claude/skills/biz-audit/SKILL.md` (`/biz-audit full`)      |
| UX       | `.claude/skills/ux-audit/SKILL.md` (`/ux-audit`)             |
| Security | `.claude/skills/security-audit/SKILL.md` (`/security-audit`) |

每发现一个 bug → 立即追加到 `.claude/quality/bug-log.md`，编号 #001+。

### Codex 红队 (Phase 3)

5 个独立 `codex exec -s read-only` 任务，每个对应一个维度。

**关键原则：不告诉 codex Claude 找到了什么。**

Prompt 模板：

```
你是 Deep Dive 项目的独立 QA red team。当前项目准备启动论文数据采集，
要求 0 bug。请独立审计以下维度，输出 bug 列表，不要给修复建议。

任务: <Journey / Edge / Biz / UX / Security 之一>
范围: <api routes / lib / components / 主路径>
排除: founder/, .claude/, docs/, scripts/migrations/（除非证明 schema bug）

输出 markdown 表格，每行一个 bug：
| 严重度 | 模块 | 复现步骤 | 影响路径 | 根因假设 |
```

Codex 输出合并到 bug-log，发现人 = `codex`。

### 对比 Diff (Phase 3 后)

- Claude vs Codex 不重叠的部分是重点（说明有一方漏了）
- 必须实测复现确认才算真 bug，不准两方都信
- 误报标 deferred + 写明误报原因

## Bug 修复阶段 (Phase 4)

每个 bug 单独走流程：

1. **Triage** — 用户审 P0/P1/P2/P3 list，决定本会话修哪些
2. **读相关文件** — 不准跳过，避免想当然
3. **改代码** — 按 CLAUDE.md S/M/L/R 分级；R 类（冻结区/auth/payment/DB schema/LLM router）先停下与用户对齐
4. **Claude 自验**:
   - `npx tsc --noEmit`
   - 相关单测
   - `npm run lint`
   - `npm run lint:i18n`（涉及 i18n 时）
   - UI 改动用 Playwright MCP 截图验证（zero-water 原则，不准用 mock）
   - 影响矩阵 `.claude/rules/impact-matrix.md` 逐项确认
5. **填 Claude ✅** + 修复 commit hash
6. **Codex 交差**:
   ```
   codex exec -s read-only "审 bug #NNN 的修复。
   bug 描述: <原 bug>
   改动文件: <列表>
   验收标准: <清单>
   特别审查: <边界点>
   请独立判定 PASS/FAIL 并给理由。"
   ```

   - codex PASS → 填 Codex ✅
   - codex FAIL → 消化建议或反驳，重修，重审
7. **不准 Claude 代填 User ✅**

## Close 条件

| 状态                          | 含义                                     |
| ----------------------------- | ---------------------------------------- |
| 3 ✅ 齐 + close 日期 + commit | 正式 closed，移到 Closed 区              |
| 2 ✅ (Claude+Codex)，等 User  | 修完待用户实测；Phase 5 给用户实测清单   |
| Deferred                      | 用户决定不修，移到 Deferred 区，写明原因 |

## 退出条件

满足以下任一：

- ✅ bug-log 里所有 P0 close (3 ✅) + 所有 P1 至少 Claude+Codex ✅ → 论文采集 unblock 信号
- ⏸️ 本会话 token 不够，stash bug-log 状态 + Phase 进度，下个会话从 bug-log 继续
- 🔴 发现冻结区/红灯级 bug 必须立即停下与用户对齐

## 禁忌

| ❌ 不准                              | ✅ 应该                                   |
| ------------------------------------ | ----------------------------------------- |
| 说"已修复" / "已 verify" / "全部 OK" | 说"我这边过了 Claude+Codex 验证，等 User" |
| 测试通过 = 没 bug                    | 测试通过 = 这条 case 没 bug，可能漏其他   |
| 跳过 codex cross-review              | 每个 bug 修完立即 codex                   |
| Claude 代填 Codex ✅ / User ✅       | 留空，等真正的 sign-off                   |
| 用 mock HTML 验证替代真实路径        | 用 seed API 走真实路径                    |
| 把小缺陷标"可接受"绕过               | 修完，或显式 deferred 写明原因            |
| 改了 i18n 只改 en/zh                 | 全 11 语言同步                            |

## 持续机制

- bug-log.md 是 living document
- 每次大改动后跑一次本协议
- 本次踩到的新坑沉淀到 `operational_*.md` / `pitfalls_*.md`

## 与其他规则的关系

- `feedback_honesty-first` → 本协议的精神基础
- `feedback_zero-water` → 本协议的执行细节
- `feedback_thorough-verification` → 本协议的验收清单
- `feedback_auto-cross-review` → 本协议的 Codex 步骤
- `rules/anti-rationalization.md` → 本协议的捷径警戒
- `rules/impact-matrix.md` → 本协议的修复影响检查
