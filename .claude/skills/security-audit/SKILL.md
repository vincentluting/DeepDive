# /security-audit — 安全漏洞深层审计

> OWASP Top 10 + Next.js 专项 + LLM 注入防护 + 认证/授权利用链分析。
> 专为 Deep Dive 的 5 级守卫 + 邀请码门控 + LLM 调用链定制。
> 所有输出使用中文。

## 触发条件

用户说 "安全审计"、"security audit"、"漏洞扫描"、"OWASP"、"安全检查"、"渗透测试" 时激活。

## 可用工具

Bash, Read, Write, Edit, Glob, Grep, Agent

## 模式总览

| 模式         | 命令                     | 做什么                            | 预估耗时 |
| ------------ | ------------------------ | --------------------------------- | -------- |
| **快速扫描** | `/security-audit quick`  | 认证守卫 + CSRF + 明显注入点      | ~3min    |
| **完整审计** | `/security-audit` (默认) | 7 维度全面安全审计                | ~15min   |
| **认证专项** | `/security-audit auth`   | 认证/授权/Session 完整利用链      | ~10min   |
| **LLM 专项** | `/security-audit llm`    | Prompt 注入 + 数据泄露 + LLM 滥用 | ~10min   |
| **API 专项** | `/security-audit api`    | API 输入验证 + 权限 + 速率限制    | ~10min   |
| **威胁建模** | `/security-audit threat` | STRIDE 威胁模型 + 攻击树          | ~15min   |
| **全量**     | `/security-audit full`   | 以上全部 + 交叉利用链分析         | ~30min   |

---

## 维度 1 — 认证与 Session 安全

> Deep Dive: bcrypt 12 轮 · 30 天 session · CSRF 双提交 cookie · `guardRoute()` 五级守卫。

### 检查清单

| 检查项                 | 文件           | 风险级别 | 验证方法                                                  |
| ---------------------- | -------------- | -------- | --------------------------------------------------------- |
| bcrypt 轮数 ≥ 12       | `lib/auth/`    | P0       | `grep -rn "bcrypt.*round\|saltRounds\|genSalt" lib/auth/` |
| 密码最小长度/复杂度    | 注册 API       | P0       | Zod schema 验证规则                                       |
| Session token 安全属性 | cookie 设置    | P0       | `httpOnly`, `secure`, `sameSite=lax/strict`               |
| Session 固定攻击防护   | 登录逻辑       | P0       | 登录成功后生成新 session ID                               |
| Session 过期正确执行   | middleware     | P1       | 30 天硬超时，非滑动窗口被意外绕过                         |
| 登出清理完整           | logout API     | P1       | 服务端 + 客户端 cookie 都清理                             |
| 密码重置 token 安全    | reset API      | P0       | 一次性使用、有过期时间、不可猜测                          |
| 枚举防护               | login/register | P1       | 不泄露"用户不存在"vs"密码错误"                            |

### guardRoute 五级守卫验证

```bash
# 列出所有 API route 及其守卫级别
grep -rn "guardRoute" app/api/ --include="*.ts" -A2
```

| 守卫级别          | 应保护的端点              | 验证                       |
| ----------------- | ------------------------- | -------------------------- |
| **public**        | auth/login, auth/register | 无 session 要求            |
| **authenticated** | score, profile, journey   | 需要有效 session           |
| **entitled**      | generate-report, coaching | 需要 session + cohort 权限 |
| **admin**         | admin/\*                  | 需要 admin 角色            |
| **cron**          | cron/\*                   | 需要 CRON_SECRET header    |

**关键验证**: 每个 API route 的 `guardRoute` 级别是否匹配其敏感度？有没有遗漏的端点？

---

## 维度 2 — CSRF 防护

### 检查清单

| 检查项                      | 文件             | 风险级别 | 验证方法                            |
| --------------------------- | ---------------- | -------- | ----------------------------------- |
| 双提交 cookie 实现          | `middleware.ts`  | P0       | token 在 cookie + header 中比对     |
| 所有 POST/PUT/DELETE 受保护 | middleware       | P0       | 豁免列表仅含公开端点                |
| 豁免列表最小化              | middleware       | P1       | 检查豁免的 URL 列表是否过宽         |
| Token 生成安全              | 同上             | P0       | 使用 `crypto.randomBytes`，非可预测 |
| 前端正确发送                | API 调用工具函数 | P1       | 每个 POST 请求都带 CSRF header      |

```bash
# 查找 CSRF 豁免
grep -rn "csrf\|CSRF\|csrfExempt\|exempt" middleware.ts

# 查找前端 POST 请求是否带 CSRF
grep -rn "fetch.*POST\|axios.*post\|method.*POST" lib/ components/ app/ --include="*.ts" --include="*.tsx" | head -20
```

---

## 维度 3 — 注入攻击

### SQL 注入

| 检查项                 | 文件               | 风险级别 | 验证方法                               |
| ---------------------- | ------------------ | -------- | -------------------------------------- |
| 参数化查询             | `lib/db/` 所有文件 | P0       | 无字符串拼接 SQL，使用 `$1, $2` 占位符 |
| ORM/查询构建器安全用法 | 同上               | P0       | 无 `sql\`` 模板中直接插入用户输入      |

```bash
# 查找潜在 SQL 注入
grep -rn "sql\`.*\$\{" lib/db/ --include="*.ts"
grep -rn "query.*\`.*\$\{" lib/db/ --include="*.ts"
```

### XSS (跨站脚本)

| 检查项                       | 文件              | 风险级别 | 验证方法                             |
| ---------------------------- | ----------------- | -------- | ------------------------------------ |
| 无 `dangerouslySetInnerHTML` | components/, app/ | P0       | `grep -rn "dangerouslySetInnerHTML"` |
| LLM 输出渲染安全             | 报告/教练组件     | P0       | Markdown 渲染器有 sanitize           |
| 用户输入 escape              | 所有表单          | P1       | React 默认 escape，但 href/src 例外  |

```bash
# 查找 dangerouslySetInnerHTML
grep -rn "dangerouslySetInnerHTML" components/ app/ --include="*.tsx"

# 查找 href/src 中的动态值
grep -rn "href=\{.*\}\|src=\{.*\}" components/ app/ --include="*.tsx" | grep -v "next/image\|next/link" | head -20
```

### 命令注入

| 检查项                       | 文件   | 风险级别 | 验证方法                                     |
| ---------------------------- | ------ | -------- | -------------------------------------------- |
| 无 `exec`/`spawn` 带用户输入 | 全项目 | P0       | `grep -rn "exec\|spawn\|execSync" lib/ app/` |

---

## 维度 4 — API 输入验证

### 检查清单

| 检查项                   | 文件                            | 风险级别 | 验证方法                            |
| ------------------------ | ------------------------------- | -------- | ----------------------------------- |
| 所有 API 输入有 Zod 验证 | `lib/validation/api-schemas.ts` | P0       | 每个 POST API 都使用 schema.parse() |
| Zod schema 严格性        | 同上                            | P1       | 使用 `.strict()` 禁止多余字段       |
| 文件上传限制             | 如有上传 API                    | P0       | 大小限制 + 类型白名单               |
| 速率限制                 | middleware 或 API               | P1       | 登录/注册/LLM 调用有速率限制        |
| 请求体大小限制           | next.config.ts / API            | P1       | 防止大 payload DoS                  |

```bash
# 查找 API route 中的输入验证
grep -rn "\.parse(\|\.safeParse(\|zodSchema\|apiSchema" app/api/ --include="*.ts" | head -30

# 查找无验证的 API
grep -rn "request\.json()\|req\.body" app/api/ --include="*.ts" | grep -v "parse\|validate\|schema"
```

---

## 维度 5 — Entitlement / 权限绕过

> Deep Dive 特有：邀请码 → cohort → `canAccess(user.cohort, feature)`。

### 检查清单

| 检查项                           | 文件               | 风险级别 | 验证方法                           |
| -------------------------------- | ------------------ | -------- | ---------------------------------- |
| `canAccess` 在所有受控功能中调用 | API routes         | P0       | 报告生成/教练/Deep Dive 都检查     |
| 邀请码不可暴力破解               | invite-code API    | P0       | 格式复杂度 + 尝试次数限制          |
| Cohort 不可客户端伪造            | session/cookie     | P0       | cohort 存储在服务端，非 cookie     |
| IDOR (不安全直接对象引用)        | report/profile API | P0       | 用户只能访问自己的数据             |
| 水平权限升级                     | 所有受保护 API     | P0       | userId 从 session 获取，非请求参数 |

```bash
# 查找 canAccess 使用
grep -rn "canAccess" app/api/ lib/ --include="*.ts"

# 查找 IDOR 风险 — userId 来源
grep -rn "userId\|user_id\|params\.id" app/api/ --include="*.ts" | head -30

# 检查是否从 session 获取 userId
grep -rn "session.*userId\|getSession" app/api/ --include="*.ts" | head -20
```

---

## 维度 6 — LLM 安全 (OWASP LLM Top 10)

> Deep Dive 有 3 个 LLM 交互面：报告生成、教练对话、职业匹配。

### LLM01: Prompt 注入

| 检查项                                            | 风险级别 | 验证方法                                |
| ------------------------------------------------- | -------- | --------------------------------------- |
| 系统 prompt 与用户输入分离                        | P0       | system message vs user message 严格分离 |
| 教练对话：用户消息能覆盖系统指令吗？              | P0       | 尝试 "忽略以上指令" 类攻击              |
| 报告生成：评分数据作为 prompt 输入是否 sanitize？ | P1       | 用户自由文本（如有）被 escape           |

### LLM02: 输出处理不安全

| 检查项                     | 风险级别 | 验证方法                      |
| -------------------------- | -------- | ----------------------------- |
| LLM 输出渲染前 sanitize    | P0       | Markdown → HTML 有 XSS 过滤   |
| LLM 输出不直接用于代码执行 | P0       | 无 `eval(llmOutput)` 模式     |
| 报告内容存储前验证         | P1       | JSON schema 验证 LLM 返回格式 |

### LLM06: 敏感信息泄露

| 检查项                   | 风险级别 | 验证方法                     |
| ------------------------ | -------- | ---------------------------- |
| Prompt 不含 API key/密码 | P0       | 系统 prompt 无敏感配置       |
| 用户个人数据最小化注入   | P1       | 教练 prompt 只注入必要上下文 |
| LLM 日志不含用户 PII     | P1       | 日志中用户数据已脱敏         |

```bash
# 查找 prompt 构建
grep -rn "systemPrompt\|system_prompt\|systemMessage\|role.*system" lib/ --include="*.ts" | head -20

# 查找 LLM 输出处理
grep -rn "response\.text\|completion\|content\[0\]" lib/report-generation/ lib/coaching/ --include="*.ts" | head -20

# 查找日志中的用户数据
grep -rn "console\.log\|logger\.\|log\(" lib/ app/api/ --include="*.ts" | grep -i "user\|email\|name\|password" | head -20
```

---

## 维度 7 — 数据隐私与合规

### 检查清单

| 检查项                | 文件           | 风险级别 | 验证方法                               |
| --------------------- | -------------- | -------- | -------------------------------------- | ------------------------------------------- |
| 密码从不明文存储/日志 | 全项目         | P0       | `grep -rn "password" --include="\*.ts" | grep -v "hash\|bcrypt\|schema\|type\|test"` |
| 敏感数据传输加密      | API routes     | P0       | HTTPS only（Vercel 默认）              |
| Cookie 安全属性       | middleware     | P0       | httpOnly + secure + sameSite           |
| 数据删除能力          | 如有 GDPR 需求 | P2       | 用户能删除自己的数据？                 |
| 评估数据用途透明      | 隐私页面       | P1       | 说明数据如何使用                       |

---

## 威胁建模 (STRIDE)

> 仅在 `/security-audit threat` 或 `/security-audit full` 中执行。

### 攻击面分析

| 攻击面        | 威胁类型        | 场景                    |
| ------------- | --------------- | ----------------------- |
| **注册/登录** | Spoofing        | 伪造身份、凭证填充      |
| **邀请码**    | Tampering       | 暴力破解、重放攻击      |
| **评分 API**  | Repudiation     | 提交假评分数据          |
| **报告生成**  | Info Disclosure | 访问他人报告            |
| **教练 SSE**  | DoS             | 大量并发连接耗尽资源    |
| **管理后台**  | Elevation       | 普通用户获取 admin 权限 |

### 攻击树 (关键路径)

```
获取他人报告
├── 直接 URL 猜测 (IDOR)
│   └── 检查: reportId 是否可猜测？API 是否校验所有权？
├── Session 劫持
│   └── 检查: cookie 安全属性、XSS 可能性
├── 权限升级
│   └── 检查: cohort 伪造、guardRoute 绕过
└── LLM 注入
    └── 检查: 教练对话能否泄露其他用户数据？
```

---

## 输出格式

```
🔍 安全审计报告

## 总览

| 维度 | 评分 | 关键发现 |
|------|------|----------|
| 认证/Session | 🟢 9/10 | bcrypt 12 轮，cookie 安全 |
| CSRF | 🟢 8/10 | 双提交实现正确 |
| 注入防护 | 🟡 7/10 | 1 处 dangerouslySetInnerHTML |
| 输入验证 | 🟡 6/10 | 3 个 API 缺少 Zod 验证 |
| 权限控制 | 🟢 9/10 | canAccess 覆盖完整 |
| LLM 安全 | 🟡 7/10 | prompt 注入防护需加强 |
| 数据隐私 | 🟢 8/10 | 无明文密码，cookie 安全 |

## P0 发现 (必须修复)

| # | 维度 | 文件:行号 | 描述 | 利用场景 |
|---|------|-----------|------|----------|
| 1 | 注入 | xxx.tsx:42 | dangerouslySetInnerHTML | XSS → session 劫持 |

## 利用链分析

| 入口 | 路径 | 影响 | 可能性 |
|------|------|------|--------|
| XSS | 教练输出 → 未 sanitize → 执行 JS → 读 cookie | Session 劫持 | 中 |

🟡 安全综合评分: 78/100
```

---

## 关键规则

1. **只读审计** — 审计过程中不修改任何文件
2. **利用链思维** — 不孤立看单个漏洞，要分析组合利用可能
3. **误报过滤** — 只报告 ≥ 中等置信度的发现，标注置信度
4. **冻结区域感知** — 发现冻结区域的安全问题，标注 [FROZEN] 前缀
5. **中文输出** — 所有报告使用中文
6. **不泄露攻击细节** — 报告中描述风险和修复建议，不提供完整的攻击代码
7. **证据驱动** — 每个发现附带 `文件:行号` + 实际代码片段
