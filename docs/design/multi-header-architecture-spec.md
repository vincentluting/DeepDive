---
title: 多页面多 Header 适配体系
category: design
sources:
  - components/layout/
  - app/[locale]/layout.tsx
sync_mode: manual
last_verified: 2026-03-20
verified_by: claude-code
---

# 多页面多 Header 适配体系 — 架构迁移方案

> ⚠️ **Meridian 设计系统上线后 (2026-06)**，权威设计源为 [`.claude/skills/deepdive-design/SKILL.md`](../../.claude/skills/deepdive-design/SKILL.md)。本文档保留为历史规范，如与 Meridian 冲突以 skill 为准。

> **状态**: ✅ 已完成 (2026-03-07)
> **作者**: Claude (Cowork) + Windson
> **日期**: 2026-03-07
> **目标**: 将单组件 Header 体系重构为 Route Group 嵌套布局 + 多 Header 变体体系

---

## 1. 现状诊断

### 1.1 当前布局层级

```
app/layout.tsx                    ← root: viewport config
app/[locale]/layout.tsx           ← 字体加载 + ThemeProvider + Analytics
  └── 所有 22 个页面目录           ← 无嵌套 layout，每页自己渲染 Header/TabBar
```

**问题**: Next.js App Router 最强大的能力（嵌套 layout）完全没用上。

### 1.2 当前 Header 使用矩阵

| 页面                    | Header      | variant | MobileTabBar          | 布局模式 |
| ----------------------- | ----------- | ------- | --------------------- | -------- |
| **Landing** (`/`)       | ✅          | `brand` | ❌                    | 营销页   |
| **Dashboard**           | ✅          | default | ✅                    | 标准 app |
| **Explore**             | ✅          | default | ✅                    | 标准 app |
| **Reports**             | ✅          | default | ✅                    | 标准 app |
| **Coaching**            | ✅ (client) | default | ✅ (隐藏于 chat 视图) | 条件布局 |
| **Companion**           | ✅          | default | ✅                    | 标准 app |
| **Action Hub**          | ✅          | default | ✅                    | 标准 app |
| **Profile/[id]**        | ✅ (client) | default | ✅                    | 条件布局 |
| **Settings**            | ✅          | default | ✅                    | 标准 app |
| **Login**               | ✅          | default | ❌                    | 认证页   |
| **Register**            | ✅          | default | ❌                    | 认证页   |
| **Admin**               | ✅          | default | ❌                    | 管理页   |
| **Legal/Privacy**       | ✅          | default | ❌                    | 法律页   |
| **QuickDive**           | ❌          | —       | ❌                    | 沉浸式   |
| **QuickDive/Narrative** | ❌          | —       | ❌                    | 沉浸式   |
| **DeepDive**            | ❌          | —       | ❌                    | 沉浸式   |
| **Report/[id]**         | ✅ (client) | default | ❌                    | 报告阅读 |
| **Share/[code]**        | ❌          | —       | ❌                    | 公开分享 |
| **Post-Assessment**     | ❌          | —       | ❌                    | 评估页   |

### 1.3 已拆分结果

原 786 行单体 `header.tsx` 已完成拆分，当前 `header.tsx` 为 221 行的 deprecated 包装，实际逻辑已分散至以下组件：

| 文件                                              | 职责                                                                      |
| ------------------------------------------------- | ------------------------------------------------------------------------- |
| `components/layout/_shared/use-header-user.ts`    | 用户状态 hook（fetch /api/auth/me, hasInProgressSession, latestReportId） |
| `components/layout/_shared/avatar-popover.tsx`    | 用户头像弹出菜单                                                          |
| `components/layout/_shared/prefs-popover.tsx`     | 语言/主题偏好切换                                                         |
| `components/layout/_shared/mobile-sheet-menu.tsx` | 移动端抽屉菜单                                                            |
| `components/layout/_shared/explore-cta.tsx`       | Explore CTA 子组件                                                        |

---

## 2. 已实施架构

### 2.1 Route Group 分层

当前结构为：

```
app/[locale]/
├── layout.tsx                      ← root: 字体 + ThemeProvider + Analytics
│
├── (marketing)/                    ← 营销页: BrandHeader
│   ├── layout.tsx                  ← BrandHeader (极简 logo + CTA)
│   └── page.tsx                    ← Landing
│
├── (auth)/                         ← 认证页: MinimalHeader
│   ├── layout.tsx                  ← MinimalHeader (仅 logo + 语言切换)
│   ├── login/page.tsx
│   └── register/page.tsx
│
├── (app)/                          ← 核心产品页: AppHeader + MobileTabBar
│   ├── layout.tsx                  ← AppHeader + MobileTabBar + page-content-offset
│   ├── dashboard/page.tsx
│   ├── explore/page.tsx
│   ├── reports/page.tsx
│   ├── coaching/page.tsx
│   ├── companion/...
│   ├── action-hub/...
│   ├── settings/...
│   ├── profile/...
│   └── admin/...                   ← admin 也属于 app group (需登录)
│
├── (immersive)/                    ← 沉浸式全屏: 无 Header
│   ├── layout.tsx                  ← 干净容器，无 Header/TabBar
│   ├── quickdive/...
│   ├── deepdive/...
│   └── post-assessment/...
│
├── (report)/                       ← 报告阅读: ReportHeader
│   ├── layout.tsx                  ← ReportHeader (返回 + 分享)
│   └── report/[id]/page.tsx
│
├── (public)/                       ← 公开页面: 无 Header 或极简
│   ├── layout.tsx                  ← 无 Header (独立页面)
│   ├── share/[code]/page.tsx
│   └── legal/...
│
├── error.tsx                       ← 保持在 [locale] 根级
├── not-found.tsx                   ← 保持在 [locale] 根级
└── template.tsx                    ← 保持在 [locale] 根级
```

**关键**: Route Group 使用括号 `()` 命名，**不影响 URL 结构**。`/en/dashboard` 仍然是 `/en/dashboard`。

### 2.2 Header 组件拆分（已实施）

```
components/layout/
├── header-shell.tsx                ← 共享基础层 (~80 行)
│   └── fixed 定位、z-index、滚动侦测、backdrop blur
│
├── brand-header.tsx                ← 营销变体 (~60 行)
│   └── Logo + 语言切换 + CTA 按钮
│
├── app-header.tsx                  ← 产品变体 (~250 行)
│   └── Logo + 完整导航 + 用户菜单 + 移动端抽屉
│   └── ExploreCTA 子组件
│   └── AvatarPopover 子组件
│
├── report-header.tsx               ← 报告变体 (~80 行)
│   └── 返回按钮 + 报告标题 + 分享按钮
│
├── minimal-header.tsx              ← 认证/极简变体 (~40 行)
│   └── Logo (居中) + 语言切换
│
├── mobile-tab-bar.tsx              ← 保持不变
│
├── header.tsx                      ← ⚠️ 已标记 @deprecated (221 行包装层)
│   └── 内部重定向到新组件
│
└── _shared/                        ← Header 内部共享（已从 header.tsx 抽出）
    ├── avatar-popover.tsx
    ├── explore-cta.tsx
    ├── prefs-popover.tsx
    ├── mobile-sheet-menu.tsx
    └── use-header-user.ts
```

### 2.3 HeaderShell 接口设计

```tsx
// components/layout/header-shell.tsx
interface HeaderShellProps {
  children: React.ReactNode;
  className?: string;
  /** 是否启用滚动透明度变化 */
  trackScroll?: boolean;
  /** 自定义高度 CSS 变量值 (默认 64px) */
  height?: string;
}

export function HeaderShell({
  children,
  className,
  trackScroll = true,
  height = "64px",
}: HeaderShellProps) {
  // 1. 管理 scrolled 状态 (现有逻辑)
  // 2. 渲染 fixed 容器 + backdrop
  // 3. 设置 CSS 变量 --header-height
  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-40",
        scrolled ? "header-backdrop-scrolled" : "header-backdrop",
        className,
      )}
      style={{ "--header-height": height } as React.CSSProperties}
    >
      <div className="max-w-7xl mx-auto h-16 flex items-center px-4 sm:px-6">
        {children}
      </div>
    </header>
  );
}
```

### 2.4 Route Group Layout 示例

```tsx
// app/[locale]/(app)/layout.tsx
import { AppHeader } from "@/components/layout/app-header";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import type { Locale } from "@/lib/i18n/config";

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <>
      <AppHeader locale={locale as Locale} />
      <main
        className="flex-1 min-h-screen"
        style={{ paddingTop: "var(--header-height, 68px)" }}
      >
        {children}
      </main>
      <MobileTabBar locale={locale as Locale} />
    </>
  );
}
```

**结果**: Dashboard、Reports、Settings 等页面不再需要自己渲染 Header 和 MobileTabBar，页面组件只关心自己的内容。

---

## 3. 分阶段迁移计划

> ✅ 以下步骤已全部完成，保留仅供历史参考

### Phase 1: 抽离沉浸式页面 (immersive)

**优先级最高，最独立，风险最低。**

这些页面本来就不渲染 Header/MobileTabBar，只需要移动文件目录。

#### 涉及文件

| 操作 | 文件                                                                          |
| ---- | ----------------------------------------------------------------------------- |
| 新建 | `app/[locale]/(immersive)/layout.tsx`                                         |
| 移动 | `app/[locale]/quickdive/` → `app/[locale]/(immersive)/quickdive/`             |
| 移动 | `app/[locale]/deepdive/` → `app/[locale]/(immersive)/deepdive/`               |
| 移动 | `app/[locale]/post-assessment/` → `app/[locale]/(immersive)/post-assessment/` |

#### (immersive) layout.tsx

```tsx
// app/[locale]/(immersive)/layout.tsx
export default function ImmersiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
```

#### Claude Code Prompt

```
## 任务: Phase 1 — 创建 (immersive) Route Group

### 背景
正在将项目迁移到 Route Group 嵌套布局体系。Phase 1 处理沉浸式全屏页面。
详见 docs/design/multi-header-architecture-spec.md Phase 1。

### 步骤

1. 创建目录 `app/[locale]/(immersive)/`
2. 创建 `app/[locale]/(immersive)/layout.tsx` — 空 layout，只透传 children
3. 移动 `app/[locale]/quickdive/` → `app/[locale]/(immersive)/quickdive/`
4. 移动 `app/[locale]/deepdive/` → `app/[locale]/(immersive)/deepdive/`
5. 移动 `app/[locale]/post-assessment/` → `app/[locale]/(immersive)/post-assessment/`

### 验证
- `npx tsc --noEmit` 无新增错误
- URL 不变: /en/quickdive, /en/deepdive, /en/post-assessment 仍正常路由
- 页面内所有 import 路径使用 `@/` 别名，不受目录移动影响

### 注意
- Route Group 括号目录不影响 URL
- 这些页面本来就不渲染 Header/MobileTabBar，行为不变
- proxy.ts 路由重定向规则不受影响 (quickexplore→quickdive 等按 URL 匹配)
```

#### 验证清单

- [ ] `npm run dev` → 访问 `/en/quickdive` 正常
- [ ] `npm run dev` → 访问 `/en/deepdive` 正常
- [ ] `npm run dev` → 访问 `/en/post-assessment` 正常 (需登录)
- [ ] `npx tsc --noEmit` 无新增错误
- [ ] `npm run test` 无失败

---

### Phase 2: 抽离营销和公开页面 (marketing + public)

#### 涉及文件

| 操作 | 文件                                                          |
| ---- | ------------------------------------------------------------- |
| 新建 | `app/[locale]/(marketing)/layout.tsx`                         |
| 移动 | `app/[locale]/page.tsx` → `app/[locale]/(marketing)/page.tsx` |
| 新建 | `app/[locale]/(public)/layout.tsx`                            |
| 移动 | `app/[locale]/share/` → `app/[locale]/(public)/share/`        |
| 移动 | `app/[locale]/legal/` → `app/[locale]/(public)/legal/`        |

#### (marketing) layout.tsx

```tsx
// app/[locale]/(marketing)/layout.tsx
import { BrandHeader } from "@/components/layout/brand-header";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function MarketingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);

  return (
    <>
      <BrandHeader locale={locale as Locale} dictionary={dict} />
      {children}
    </>
  );
}
```

#### ⚠️ 注意: Landing page.tsx 迁移要点

当前 `app/[locale]/page.tsx` (Landing) 自己渲染 `<Header variant="brand" />`。移入 `(marketing)` group 后：

- 从 page.tsx 中**移除** Header 渲染
- Header 由 (marketing)/layout.tsx 统一提供
- 确认 `page-content-offset` 或等效的顶部间距仍然正确

#### Claude Code Prompt

```
## 任务: Phase 2a — 创建 BrandHeader 组件

### 背景
从 header.tsx (786 行) 中抽取 brand variant 逻辑，创建独立的 BrandHeader。
详见 docs/design/multi-header-architecture-spec.md Phase 2。

### 步骤

1. 创建 `components/layout/header-shell.tsx`:
   - 从 header.tsx 中提取: fixed 定位、z-index、滚动状态追踪、backdrop blur
   - Props: children, className, trackScroll (default true)
   - 设置 CSS 变量 --header-height

2. 创建 `components/layout/brand-header.tsx`:
   - 使用 HeaderShell 包裹
   - 只包含: Logo + 语言切换 + CTA 按钮
   - 从 header.tsx 的 brand variant 逻辑中提取
   - Props: locale, dictionary (可选)

3. **不要修改现有 header.tsx** — 保持向后兼容

### 验证
- `npx tsc --noEmit` 无错误
- 新组件 import 路径正确
```

```
## 任务: Phase 2b — 创建 (marketing) 和 (public) Route Groups

### 前置条件
Phase 2a (BrandHeader 组件) 已完成。

### 步骤

1. 创建 `app/[locale]/(marketing)/layout.tsx` — 使用 BrandHeader
2. 移动 `app/[locale]/page.tsx` → `app/[locale]/(marketing)/page.tsx`
3. 从移入的 page.tsx 中移除 `<Header variant="brand" />` 渲染 (layout 已提供)
4. 创建 `app/[locale]/(public)/layout.tsx` — 空 layout (这些页面不需要 header)
5. 移动 `app/[locale]/share/` → `app/[locale]/(public)/share/`
6. 移动 `app/[locale]/legal/` → `app/[locale]/(public)/legal/`
   - 注意: legal/privacy/page.tsx 当前渲染自己的 Header，移入后需移除

### 验证
- Landing page `/en/` 仍有 brand header
- Share page `/en/share/xxx` 仍无 header
- Legal page `/en/legal/privacy` 布局正常
- `npx tsc --noEmit && npm run test`
```

---

### Phase 3: 抽离认证页面 (auth)

#### 涉及文件

| 操作 | 文件                                                       |
| ---- | ---------------------------------------------------------- |
| 新建 | `components/layout/minimal-header.tsx`                     |
| 新建 | `app/[locale]/(auth)/layout.tsx`                           |
| 移动 | `app/[locale]/login/` → `app/[locale]/(auth)/login/`       |
| 移动 | `app/[locale]/register/` → `app/[locale]/(auth)/register/` |

#### Claude Code Prompt

```
## 任务: Phase 3 — 创建 (auth) Route Group

### 步骤

1. 创建 `components/layout/minimal-header.tsx`:
   - 使用 HeaderShell 包裹
   - 仅包含: 居中 Logo + 语言切换按钮
   - Props: locale

2. 创建 `app/[locale]/(auth)/layout.tsx`:
   - 使用 MinimalHeader
   - 包含 page-content-offset 容器

3. 移动 login/ 和 register/ 到 (auth)/
4. 从 login/page.tsx 和 register/page.tsx 中移除 `<Header />` 渲染

### 验证
- `/en/login` 显示极简 header
- `/en/register` 显示极简 header
- `npx tsc --noEmit && npm run test`
```

---

### Phase 4: 抽离报告页面 (report)

#### 涉及文件

| 操作 | 文件                                                     |
| ---- | -------------------------------------------------------- |
| 新建 | `components/layout/report-header.tsx`                    |
| 新建 | `app/[locale]/(report)/layout.tsx`                       |
| 移动 | `app/[locale]/report/` → `app/[locale]/(report)/report/` |

#### ⚠️ 复杂度提醒

report-client.tsx 在多个条件分支中渲染 Header (加载态、错误态、正常态)。迁移时需要：

- 将 report-client.tsx 中的 Header 渲染全部移除
- 确保 (report)/layout.tsx 中的 ReportHeader 能处理所有状态
- 或者: ReportHeader 只处理正常态，report-client.tsx 中的错误态 Header 保留为 fallback

#### Claude Code Prompt

```
## 任务: Phase 4 — 创建 (report) Route Group

### ⚠️ 这是最复杂的一步，需要仔细处理

### 步骤

1. 创建 `components/layout/report-header.tsx`:
   - 使用 HeaderShell 包裹
   - 包含: 返回按钮 (→ /reports) + 分享按钮
   - Props: locale
   - 考虑: 是否需要版块锚点导航 (CareerMatch / Profile / Pathway 快速跳转)

2. 创建 `app/[locale]/(report)/layout.tsx`:
   - 使用 ReportHeader
   - 不包含 MobileTabBar

3. 移动 `app/[locale]/report/` → `app/[locale]/(report)/report/`

4. 清理 report-client.tsx 中的 Header 渲染:
   - 移除正常态的 Header (由 layout 提供)
   - 错误态/加载态的 Header 渲染需要评估是否保留

### 验证
- `/en/report/xxx` 报告页正常渲染
- 滚动行为、面板切换正常
- 分享功能正常
- `npx tsc --noEmit && npm run test`
```

---

### Phase 5: 建立 (app) Group — 核心产品页

**这是最大的一步**，涉及最多页面。

#### 涉及文件

| 操作 | 文件                                                                                   |
| ---- | -------------------------------------------------------------------------------------- |
| 新建 | `components/layout/app-header.tsx`                                                     |
| 新建 | `components/layout/_shared/avatar-popover.tsx`                                         |
| 新建 | `components/layout/_shared/explore-cta.tsx`                                            |
| 新建 | `components/layout/_shared/prefs-popover.tsx`                                          |
| 新建 | `components/layout/_shared/mobile-sheet-menu.tsx`                                      |
| 新建 | `components/layout/_shared/use-header-user.ts`                                         |
| 新建 | `app/[locale]/(app)/layout.tsx`                                                        |
| 移动 | dashboard, explore, reports, coaching, companion, action-hub, settings, profile, admin |

#### ⚠️ 复杂度提醒

- **coaching-client.tsx** 有条件隐藏 MobileTabBar (`view !== 'chat'`)。迁移后需要解决：layout 统一渲染 MobileTabBar 但 chat 视图需隐藏。方案：通过 CSS `data-attribute` 或 Zustand store 控制。
- **profile/[id]/page.tsx** 在 4 种状态下渲染不同 Header。迁移后简化为统一 AppHeader。

#### 建议拆分为子任务

```
Phase 5a: 从 header.tsx 抽取子组件 → _shared/ (不改变现有行为)
Phase 5b: 组装 AppHeader (复用 _shared/ 子组件)
Phase 5c: 创建 (app) Route Group + layout.tsx
Phase 5d: 逐批移入页面 (每批 2-3 个):
  - Batch 1: dashboard, explore, reports
  - Batch 2: settings, admin
  - Batch 3: companion, action-hub
  - Batch 4: coaching (需处理条件 TabBar)
  - Batch 5: profile (需处理条件 Header)
Phase 5e: 从迁移完的页面中移除独立的 Header/MobileTabBar 渲染
```

#### Claude Code Prompt (Phase 5a)

```
## 任务: Phase 5a — 从 header.tsx 抽取子组件

### 背景
header.tsx 有 786 行。在创建 AppHeader 之前，先将可独立的子组件抽取到 _shared/ 目录。
此步骤**不改变现有行为**，header.tsx 改为从 _shared/ 导入。

### 步骤 (每步 1 个文件)

**Prompt 1**: 创建 `components/layout/_shared/use-header-user.ts`
- 从 header.tsx 抽取用户状态逻辑 (fetch /api/auth/me, hasInProgressSession, latestReportId)
- 返回 { user, isLoading, hasInProgressSession, latestReportId }

**Prompt 2**: 创建 `components/layout/_shared/avatar-popover.tsx`
- 从 header.tsx 抽取 AvatarPopover 组件 (整个 function AvatarPopover)
- Props: user, locale, getLocalizedPath, isActive

**Prompt 3**: 创建 `components/layout/_shared/explore-cta.tsx`
- 从 header.tsx 抽取 ExploreCTA 组件
- Props: locale, hasInProgressSession, hasReport

### 验证 (每步后)
- header.tsx 改为 import 新组件
- `npx tsc --noEmit` 无错误
- 视觉行为不变
```

---

### Phase 6: 清理与验证

#### 最终清理步骤

1. **标记旧 header.tsx 为 @deprecated**
   - 确认没有页面直接使用旧 header.tsx
   - 如果还有引用，逐个迁移到对应的新 Header 变体

2. **统一 page-content-offset**
   - 将硬编码的 `pt-32 sm:pt-36` 替换为 CSS 变量 `padding-top: var(--header-height, 68px)`
   - 在 HeaderShell 中设置该变量

3. **移除冗余代码**
   - 页面中不再需要的 Header/MobileTabBar import
   - 旧 header.tsx (确认无引用后)

4. **全量验证**

```bash
npx tsc --noEmit && npm run test && npm run lint && npm run lint:i18n
```

#### Claude Code Prompt

```
## 任务: Phase 6 — 清理与全量验证

### 步骤

1. 在项目中全局搜索 `from "@/components/layout/header"` 和 `from '@/components/layout/header'`
2. 确认所有引用已迁移到新 Header 变体
3. 如有残留引用，逐个替换
4. 将旧 header.tsx 标记为 @deprecated，加注释指向新组件
5. 运行完整验证: `npx tsc --noEmit && npm run test && npm run lint && npm run lint:i18n`
6. 手动检查所有 Route Group 页面的 URL 路由正确性

### 验证清单
- [ ] Landing `/en/` — BrandHeader 正常
- [ ] Login `/en/login` — MinimalHeader 正常
- [ ] Dashboard `/en/dashboard` — AppHeader + MobileTabBar 正常
- [ ] QuickDive `/en/quickdive` — 无 Header，全屏
- [ ] DeepDive `/en/deepdive` — 无 Header，全屏
- [ ] Report `/en/report/xxx` — ReportHeader 正常
- [ ] Coaching `/en/coaching` — AppHeader 正常，chat 视图隐藏 TabBar
- [ ] Profile `/en/profile/xxx` — AppHeader 正常
- [ ] Settings `/en/settings` — AppHeader + MobileTabBar 正常
- [ ] Share `/en/share/xxx` — 无 Header
- [ ] Legal `/en/legal/privacy` — 干净布局
- [ ] Build: `npm run build` 无错误
- [ ] TypeScript: `npx tsc --noEmit` 无错误
- [ ] 测试: `npm run test` 全通过
- [ ] Lint: `npm run lint` 无新增错误
```

---

## 4. 风险与缓解

### 4.1 proxy.ts 路由匹配

**风险**: proxy.ts 中的路由重定向和 CSRF 豁免路径是否受 Route Group 影响？

**缓解**: Route Group 只影响文件系统布局，**不影响 URL**。proxy.ts 中的所有路径匹配 (`/api/xxx`, `/en/quickdive` 等) 完全不受影响。无需修改 middleware。

### 4.2 Layout 切换时组件卸载

**风险**: 从 (app) group 导航到 (report) group 时，(app)/layout.tsx 会卸载，AppHeader 会短暂消失。

**缓解**:

- Header 切换是预期行为 (不同页面类型本来就该有不同 header)
- HeaderShell 共享相同的 fixed 定位和 backdrop，视觉过渡自然
- 如需更平滑过渡，可用 Framer Motion 的 `layout` 动画

### 4.3 Coaching 条件隐藏 TabBar

**风险**: (app)/layout.tsx 统一渲染 MobileTabBar，但 coaching chat 视图需要隐藏。

**缓解方案**:

```tsx
// 方案 A: CSS data-attribute (推荐)
// coaching-chat 视图渲染时设置 body data 属性
// layout 中 MobileTabBar 通过 CSS [data-hide-tabbar] 隐藏

// 方案 B: Zustand store
// 在 questionnaire-store 或新建 layout-store 中加 hideTabBar 状态
// MobileTabBar 组件内读取该状态决定是否渲染
```

### 4.4 Profile 条件 Header

**风险**: profile/[id] 在 locked/error 状态渲染不同内容。

**缓解**: AppHeader 本身不需要知道页面状态。locked/error 是页面**内容**的差异，不是 header 的差异。迁移后 profile 页面只需处理自己的内容区域，header 一律是 AppHeader。

### 4.5 generateStaticParams 与 Route Group

**风险**: Next.js 静态生成是否受影响？

**缓解**: `generateStaticParams` 在 `[locale]/layout.tsx` 中定义，Route Group 不影响。每个 Route Group 的页面仍然继承上层 `[locale]` 的 params。

---

## 5. 迁移顺序总结

| Phase | 内容                                               | 涉及文件数    | 风险 | 预计工作量 |
| ----- | -------------------------------------------------- | ------------- | ---- | ---------- |
| 1     | (immersive) — quickdive/deepdive/post-assessment   | 4 (1新+3移)   | 极低 | 10 min     |
| 2     | (marketing) + (public) + BrandHeader + HeaderShell | 8 (4新+4移)   | 低   | 30 min     |
| 3     | (auth) + MinimalHeader                             | 4 (2新+2移)   | 低   | 15 min     |
| 4     | (report) + ReportHeader                            | 3 (2新+1移)   | 中   | 30 min     |
| 5     | (app) + AppHeader + 子组件抽取                     | 15+ (6新+9移) | 中高 | 2-3 hr     |
| 6     | 清理 + 全量验证                                    | ~5            | 低   | 30 min     |

**总计**: 约 4-5 小时 Claude Code 工作量，建议分 2-3 个 session 完成。

---

## 6. 长期收益

### 可维护性

- Header 变体各自独立，修改一种不影响其他
- 新增页面类型只需新建 Route Group + 选择/新建 Header 变体
- Layout 逻辑集中在 layout.tsx，页面组件只关心自己的内容

### 性能

- Route Group 内导航时 layout 不重新挂载
- 更小的 Header 组件 = 更少的 JavaScript 传输
- App Group 内页面导航时 AppHeader + MobileTabBar 完全不重渲染

### 可扩展性

- Ultra Deep Dive 可以直接放入 (immersive) group
- 未来如有 onboarding 流程，新建 (onboarding) group 即可
- Coaching Companion 如需独立布局，可以独立为 (coaching) group

### 设计系统一致性

- HeaderShell 确保所有 header 变体共享定位、间距、backdrop 行为
- 修改全局 header 行为只改 HeaderShell 一处

---

## 7. 与 CLAUDE.md 规范的兼容性

| CLAUDE.md 规则      | 本方案的处理                                 |
| ------------------- | -------------------------------------------- |
| 每次最多改 3 个文件 | ✅ 每个 Claude Code prompt 控制在 1-3 个文件 |
| 修改前输出影响分析  | ✅ 本文档即为 Phase 0 影响分析               |
| 冻结区域不碰        | ✅ 不涉及 scoring/content/model-router       |
| 编辑后报告变更      | ✅ 每个 prompt 有明确验证步骤                |
| i18n 硬规则         | ✅ Header 组件均通过 dict 获取文本           |
| 变更影响矩阵        | ✅ 新增组件 → i18n + 响应式 + 设计规范       |

---

## 附录: 当前 header.tsx 主要功能区块

供 Phase 5 拆分时参考:

| 行范围 (约) | 功能                        | 目标组件                        |
| ----------- | --------------------------- | ------------------------------- |
| 1-50        | imports + types             | 按需分配                        |
| 52-80       | ExploreCTA                  | `_shared/explore-cta.tsx`       |
| 82-120      | PrefsPopover (语言/主题)    | `_shared/prefs-popover.tsx`     |
| 122-280     | AvatarPopover               | `_shared/avatar-popover.tsx`    |
| 282-380     | Header 主组件: 状态 + hooks | `_shared/use-header-user.ts`    |
| 382-500     | Desktop 左侧导航            | `app-header.tsx`                |
| 502-740     | Mobile Sheet 菜单           | `_shared/mobile-sheet-menu.tsx` |
| 742-786     | Desktop 右侧操作区          | `app-header.tsx`                |
