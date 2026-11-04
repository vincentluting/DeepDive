# 页面配方 + 迁移状态表

> 做任何页面前:①查此表确认状态 ②打开对照稿 `docs/design/page-templates/images-v2/<page>-{light,dark}.png` ③查 `page-art.md` 拿背景配置。

## 1. 迁移状态表(living — 每完成一页更新此表)

| 页面                                    | Surface    | 状态                        | 对照稿           | 负责 token 岛        |
| --------------------------------------- | ---------- | --------------------------- | ---------------- | -------------------- |
| Landing                                 | dive       | 🔄 本会话                   | landing-\*       | Zone D 重写          |
| Login/Register/Forgot/Reset             | utility    | 🔄 本会话                   | login-\* 等      | —                    |
| Dashboard                               | utility    | 🔄 本会话                   | dashboard-\*     | —                    |
| Explore                                 | dive       | 🔄 本会话                   | explore-\*       | `.dd-explore`        |
| Settings                                | utility    | 🔄 骨架(本会话 rail)        | settings-\*      | —                    |
| Reports 列表                            | revelation | 🔄 骨架                     | reports-\*       | —                    |
| Report 详情                             | revelation | ✅ token 已迁(2026-06-11)   | report-detail-\* | `--report-*` 海图室双时辰 |
| Share / p/ / result                     | revelation | ✅ token 已迁(经 rev 桥)    | public-\*        | —                    |
| Quick Dive 问卷                         | dive       | ✅ token 已迁(正午→子夜)    | quickdive-\*     | `--qd-b0..b4`(注: 做题块被钉在 b0,见 classic-explore-question.tsx:117) |
| Deep Dive / Immersive / Post-assessment | dive       | ✅ token 已迁               | deepdive-\* 等   | `--qd-intro-*`       |
| Profile / Profile-reveal                | revelation | ⛔ 会话 B/C                 | profile-\*       | —                    |
| Coaching                                | sanctuary  | ✅ token 已迁               | coaching-\*      | `--exec-*` 海藻绿系  |
| Action Hub / Companions                 | sanctuary  | ✅ token 已迁               | action-hub-\*    | —                    |
| Processing / Pricing / Research         | —          | ✅ 紫色清零(2026-06-11)     | —                | —                    |

## 2. 页面配方

### Landing(对照 landing-light/dark.png)

1. PageArt hero(sunlit-day / hero-ocean,"center 7%")— 全幅
2. Hero: eyebrow `AI CAREER SELF-DISCOVERY` → Fraunces H1 → _italic 副题_ → 正文 → CTA 对(primary + ghost play)→ 右侧 DepthGauge + 统计栈(128K+ / 86% / 12)
3. Journey band: `STEP 1 Choose your depth` 介绍格 + 三路径卡(Quick ~5min / Deep ~30-40 / Immersive ~60+,orb+title+desc+箭头)+ 进度环(gold 弧)
4. 01-04 四列编号分区: Portrait(essence 条+指标)/ Report(方向列表+进度条)/ Action(today 焦点+里程碑)/ Coach(聊天预览)
5. MeridianFooter 三件套

- zh: 副题走 Noto Serif SC;全部文案 i18n

### Auth 四页(对照 login-\*)

PageArt(login=lighthouse "18% 42%")+ 居中 `.md-panel` 玻璃卡(顶部高光线)+ MinimalHeader;表单 hairline-strong;OAuth 按钮清硬编码 Tailwind 色。

### Dashboard(对照 dashboard-\*)

Rail(`UTILITY SURFACE` / "Your next clear step." / U 签名牌 / 锚点)+ 主区: content-head serif 开场 + 01 Continue(CTA 对)/ 02 Reports(Fraunces 大数字)/ 03 Identity snapshot(seal + essence 条)/ 04 Latest signals(信号列表+进度)+ 右上 Depth 指标卡(420m, gold 数字)。

### Explore(对照 explore-\*)

PageArt(sunlit 58%)+ 路径选择三卡(journey band 语法)+ DepthGauge 接旅程进度。

### 仪式页(揭晓/完成,会话 C)

全幅 PageArt + 无 rail + 居中舞台 + L4 动效;原型色用 -dive 档。

## 3. 新页面接入 checklist

1. `lib/design/surfaces.ts` 路由映射确认
2. `lib/design/page-art.ts` 加背景配置
3. layout 是否已挂 PageArtLayer/rail(route group 级)
4. 文案进 i18n 字典(en+zh 同步,`npm run lint:i18n`)
5. 对照稿比对 light+dark + 375px
6. 更新本文件状态表

## 4. AI 背景资产再生成(需要新画时)

Prompt 基调:

- Noon: "impressionist oil painting, Monet 'Woman with a Parasol' sky, cobalt blue and cloud white over sea surface, sunlit shimmer, soft brushwork, no people"
- Midnight: "moonlit deep ocean from underwater, ink blue gradient, golden moonbeam through water surface, painterly, quiet"
- 出图后: 转 webp 双档(2560w q78 + 1280w q74,目标 <300K),入 `public/brand/`,登记 `page-art.md` 资产池表
