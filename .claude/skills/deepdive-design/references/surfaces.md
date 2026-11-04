# 四深度带(Surface 系统)

> 路由映射的实现在 `lib/design/surfaces.ts`(`getSurfaceForPath`),容器是 `SurfaceBoundary`(渲染 `data-surface` 属性)。架构不变,语义重铸为**同一世界的四个深度带** — 区别只在色温、光线、材质比重,不再是四套独立色系。

## 1. 深度带定义

### dive — Open Water 远海

- **路由**: `/`, `/explore*`, `/quickdive*`, `/deepdive*`, `/immersive*`, `/post-assessment`
- **氛围**: 全幅海洋画布(Page-Art 主场),光线最戏剧化
- **材质**: 玻璃 panel 占比高,wash 罩最薄(让画透出来)
- **粒子**: 32 个磷光点 `118,212,232`(light 近隐 .5 / dark 显形 .75)
- **签名牌**: `D · Descent atlas`

### revelation — Chart Room 海图室

- **路由**: `/report*`, `/result*`, `/profile*`, `/profile-reveal*`, `/share*`, `/p/*`
- **氛围**: 纸面最纯,grain 最重(.26),serif 比重最高,细线最密
- **材质**: md-card 纸面为主,玻璃最少;wash 罩最厚(.62→.7)
- **粒子**: 无(纸面保持安静)
- **签名牌**: `R · Monograph plate`
- ⚠️ 报告内容区 token(`--report-*`)冻结中,会话 B 迁移

### sanctuary — Lantern Light 灯下

- **路由**: `/coaching*`, `/coach*`, `/reflect*`, `/diary*`, `/action-hub*`, `/companions*`
- **氛围**: 同一色彩宇宙,色温 +2: wash 用金斑(light `rgba(246,224,179,.52)` / dark `rgba(233,196,124,.2)`),面板可用 `--md-cream`
- **粒子**: 14 个暖金点 `216,180,106`
- **签名牌**: `S · Reflection room`
- 不再是独立的"沙金/珊瑚粉"色系 — 金光比重微升而已

### utility — Bridge 舰桥

- **路由**: `/dashboard*`, `/settings*`, `/admin*` 及其他
- **氛围**: 最克制,数据感,小型大写标签 + 细线网格
- **材质**: md-card 为主,wash 清透(.72→.68)
- **粒子**: 12 个 `110,147,171`
- **签名牌**: `U · Surface instrument`

## 2. 跨带过渡

`app/[locale]/template.tsx`(只动 opacity,铁律): 跨带 0.6s fade / 同带 0.2s。带间差异是"光线变化"而非"世界切换" — 过渡应感觉像潜到另一深度,不是换房间。

## 3. Ambient 配方(AmbientField,`components/design/ambient/`)

| Surface    | 粒子 RGB      | count | glow 来源           |
| ---------- | ------------- | ----- | ------------------- |
| dive       | `118,212,232` | 32    | `--primary` 16% mix |
| utility    | `110,147,171` | 12    | 同弱化              |
| sanctuary  | `216,180,106` | 14    | 金光                |
| revelation | —             | 0     | 无                  |

canvas 全局 CSS: light `opacity:.5` / `.dark opacity:.75`(正午粒子近隐、子夜磷光显形 — "两个时辰"的呼吸差)。

**铁律**: AmbientField 不全局挂;与 PageArtLayer 二选一或确认层级(PageArt 在最底,ambient glow 在 wash 之上)。

## 4. 何时用什么背景

| 场景                      | 方案                                        |
| ------------------------- | ------------------------------------------- |
| 页面有 Page-Art 配置      | `PageArtLayer`(查 `lib/design/page-art.ts`) |
| 旧页有 bespoke 伪元素背景 | 保留并让它引用 md token(不叠 PageArt)       |
| 弹层/浮窗                 | 玻璃 `.glass-*`(浮层专用)                   |
| 仪式场景(揭晓/完成)       | 全幅 Page-Art + 无 rail + 居中舞台          |
