---
description: "解除动态冻结，恢复全目录编辑权限"
disable-model-invocation: false
---

# /unfreeze — 解除动态冻结

移除 `/freeze` 设置的目录编辑限制。

## 执行步骤

1. 检查状态文件是否存在：

```bash
STATE_FILE="$CLAUDE_PROJECT_DIR/.claude/state/freeze-dir.txt"
if [ -f "$STATE_FILE" ]; then
  FROZEN_DIR=$(cat "$STATE_FILE")
  rm "$STATE_FILE"
fi
```

2. 输出结果（中文）：

如果有冻结：

```
🔓 动态冻结已解除
原限制范围: {目录路径}
现在可以编辑所有非静态冻结的文件。
```

如果没有冻结：

```
ℹ️ 当前没有活跃的动态冻结。
静态冻结区域（guard-frozen.sh）始终生效，不受此命令影响。
```

## 注意事项

- 只解除动态冻结，**不影响**静态冻结区域（lib/scoring/ 等）
- 静态冻结区域的修改仍需与用户讨论
