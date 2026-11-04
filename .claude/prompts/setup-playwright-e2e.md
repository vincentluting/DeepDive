# Prompt: Setup Playwright E2E Smoke Test

> 粘贴此 prompt 给 Claude Code 执行。预计耗时 ~15 分钟。

## 目标

为核心用户旅程 Quick Dive → Register → Deep Dive 建立 Playwright E2E 冒烟测试。
这条路径历史上出过数据链路断裂 bug（见 memory.md），需要自动化保护。

## 步骤

### 1. 安装依赖

```bash
npm install -D @playwright/test
npx playwright install chromium  # 只装 chromium，节省 CI 时间
```

### 2. 创建 Playwright 配置

创建 `playwright.config.ts`:
- baseURL: `http://localhost:3000`
- 只用 chromium
- webServer 配置: `npm run dev` (port 3000, reuseExistingServer: true)
- timeout: 30s per test
- retries: 0 (冒烟测试不重试)

### 3. 创建冒烟测试

创建 `e2e/smoke.spec.ts`:

**Test 1: 首页可访问**
- 访问 `/en`
- 断言页面标题或关键元素存在

**Test 2: Quick Dive 流程可启动**
- 访问 `/en/quickdive`
- 断言问卷 UI 渲染（第一题可见）

**Test 3: Deep Dive 入口可达**
- 访问 `/en/deepdive`
- 断言页面加载（可能需要登录，如果需要则跳过并标记 TODO）

**Test 4: 报告页不崩溃**
- 访问 `/en/report/latest`
- 断言不出现 500 错误（可以是 redirect 到登录页，但不能白屏）

### 4. 添加 npm script

在 package.json 添加:
```json
"test:e2e": "playwright test"
```

### 5. 添加到 CI (可选)

在 `.github/workflows/ci.yml` 中添加 e2e job（需要 dev server，建议作为单独 job）。
注意: E2E 需要环境变量，如果 CI 没有 DB 连接串则标记为 optional。

### 6. 更新 CLAUDE.md

在命令列表中添加 `npm run test:e2e`。

## 约束

- 不要改已有文件的逻辑
- 测试只做可达性验证（页面加载 + 关键元素存在），不测业务逻辑
- 如果某个页面需要登录才能访问，用 `test.skip()` + TODO 注释标记
