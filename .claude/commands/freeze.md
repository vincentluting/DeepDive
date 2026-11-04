---
description: "动态冻结：限制编辑范围到指定目录"
disable-model-invocation: false
---

# /freeze — 动态冻结

将编辑权限限制在用户指定的目录内。与静态冻结（guard-frozen.sh）叠加生效。

## 执行步骤

1. 询问用户要聚焦的目录路径（如果 `$ARGUMENTS` 已提供则直接使用）
2. 将路径解析为绝对路径
3. 验证目录存在
4. 写入状态文件：

```bash
mkdir -p "$CLAUDE_PROJECT_DIR/.claude/state"
echo "{绝对路径}" > "$CLAUDE_PROJECT_DIR/.claude/state/freeze-dir.txt"
```

5. 确认输出（中文）：

```
🔒 动态冻结已激活
允许编辑范围: {目录路径}
此限制叠加在静态冻结区域之上。
解除: /unfreeze
```

## 注意事项

- 动态冻结是 **session 级别**的，重启对话后自动失效
- 与 guard-frozen.sh 的静态冻结**叠加**：即使文件在允许目录内，如果属于静态冻结区域仍然会被拦截
- 仅限制 Edit/Write 操作，Read/Grep/Glob 不受影响
