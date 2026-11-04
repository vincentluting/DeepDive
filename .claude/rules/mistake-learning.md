# 错误学习闭环 (Mistake Learning Loop)

> 基于 Reflexion Pattern + Google SRE Postmortem 实践。协议文件，每次会话自动加载。

## BEFORE — 任务前检查

开始涉及以下领域的任务时，先读 `.claude/memory/operational-playbook.md` 对应分类：

| 任务涉及          | 检查分类            |
| ----------------- | ------------------- |
| Neon DB 查询/迁移 | `## Neon DB`        |
| LLM 调用/prompt   | `## LLM 调用`       |
| Playwright E2E    | `## Playwright E2E` |
| 部署/Vercel       | `## 部署`           |
| npm/依赖/工具链   | `## 工具链`         |

## DURING — 执行中标记

遇到以下情况时，在心里标记"待记录"：

- 方法 A 失败 → 换方法 B 成功
- 报错信息误导 → 实际根因不同
- 文档/类型签名与运行时行为不一致

## AFTER — Phase 3 收尾时记录

在功能开发 Phase 3 或任务结束时，检查是否有新的操作经验需要追加到 `operational-playbook.md`。

**记录格式：**

```
### 简要标题 (YYYY-MM-DD)
- ❌ 失败：做了什么 → 什么报错/现象
- ✅ 解决：换成什么方法 → 成功
- 💡 根因：为什么 A 不行但 B 可以
```

## 定期清理

每月 memory 审计时（见 `ops-calendar.md`），清理已过时的 playbook 条目（如：依赖升级后旧 workaround 不再需要）。
