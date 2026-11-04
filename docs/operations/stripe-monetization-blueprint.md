---
title: Stripe Monetization — Blueprint (post-thesis, W13+)
category: operations
status: blueprint
authored: 2026-05-19
target_implementation: post-thesis (W13+ business launch)
sources:
  - .claude/plans/codex-quizzical-shell.md (Phase 3 P2 — Week 13)
  - lib/cohort/entitlements.ts
  - app/api/auth/register/route.ts
---

# Stripe Monetization — Blueprint

> 现在写完整 production code = 10 周后大概率 stale (Stripe SDK / Next 都会迭代)。这份文档锁定**接口边界与实施顺序**, 论文交付当周 ~3h 即可实施。

## 产品决策 (CPO 视角, 已锁定)

| 决策          | 选择                                                     | 理由                                               |
| ------------- | -------------------------------------------------------- | -------------------------------------------------- |
| Pricing model | One-time purchase (per report) + Subscription (coaching) | 报告本身有"完成感", 一次买; 教练是持续陪伴, 月订阅 |
| Anchor price  | $29 报告 / $19 月教练 (or bundle $39)                    | Plan v2 项目愿景文件已锁; 待 WTP 调研后微调        |
| Free tier     | QD + 个人档案免费; DD 报告付费; 教练首条对话免费试用     | 漏斗设计: QD 钩 → 档案 hook → 报告付费             |
| Refund window | 14 天无理由退款 (EU 法定标准, 全球统一)                  | 简单 + 合规 + 信任建立                             |
| 货币          | USD only (v1), EUR / GBP v2 加                           | Stripe 自动汇率, 用户体验略损但维护简单            |
| 学生折扣      | 50% off via 邀请码 / .edu email                          | 学生市场是 deep dive 主要 segment, 必须留接口      |

## 技术架构

### 数据模型 (一张新表 + User 列扩展)

```sql
-- New table: 一份订单一行
CREATE TABLE "StripePurchase" (
  "id"                TEXT PRIMARY KEY,           -- our UUID
  "userId"            TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "stripeSessionId"   TEXT UNIQUE,                 -- cs_xxx
  "stripeCustomerId"  TEXT,                        -- cus_xxx
  "stripePaymentIntentId" TEXT,                    -- pi_xxx
  "productKey"        TEXT NOT NULL,               -- 'report' | 'coaching_monthly' | 'bundle'
  "amountCents"       INTEGER NOT NULL,
  "currency"          TEXT NOT NULL DEFAULT 'usd',
  "status"            TEXT NOT NULL,               -- 'pending'|'paid'|'refunded'|'failed'
  "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "paidAt"            TIMESTAMPTZ,
  "refundedAt"        TIMESTAMPTZ,
  "metaJson"          JSONB                        -- assessmentId / coupon / etc.
);
CREATE INDEX "idx_stripe_user_status" ON "StripePurchase"("userId", "status");
CREATE INDEX "idx_stripe_paid" ON "StripePurchase"("paidAt" DESC) WHERE "status" = 'paid';

-- User 列扩展
ALTER TABLE "User"
  ADD COLUMN "stripeCustomerId" TEXT UNIQUE,        -- 复用客户记录跨购买
  ADD COLUMN "coachingActiveUntil" TIMESTAMPTZ,     -- 订阅当前周期到期日
  ADD COLUMN "reportPurchasedAt" TIMESTAMPTZ;        -- 第一次报告付费时间
```

### 4 个新端点 + 1 个 cron

```
POST /api/stripe/checkout/report       — create checkout session for one-time
POST /api/stripe/checkout/coaching     — create checkout session for subscription
POST /api/stripe/webhook                — 处理 paid / refunded / subscription.*
GET  /api/stripe/portal                 — redirect 到 Stripe customer portal (取消订阅)
+ cron: subscription-sync (每天对账, 防 webhook 丢失)
```

### Entitlement 统一接入

复用现有 `lib/cohort/entitlements.ts` 的 `canAccess(user, feature)`:

```ts
// 现状: 只看 cohort
// 改后: cohort OR purchase
function canAccessFeature(user: User, feature: Feature): boolean {
  // 1. cohort 内 → always 通过 (论文期免费用户)
  if (isCohortActive(user.cohort)) return true;
  // 2. report 类: 检查 StripePurchase.status = 'paid'
  if (feature === "report" && user.reportPurchasedAt) return true;
  // 3. coaching: 检查 user.coachingActiveUntil > NOW()
  if (
    feature === "coaching" &&
    user.coachingActiveUntil &&
    user.coachingActiveUntil > new Date()
  )
    return true;
  return false;
}
```

### Webhook handler 框架 (psuedo)

```ts
// app/api/stripe/webhook/route.ts
export const POST = async (request) => {
  const sig = request.headers.get('stripe-signature');
  const event = stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET);

  switch (event.type) {
    case 'checkout.session.completed':
      await markPurchasePaid(event.data.object.id);
      await updateUserEntitlement(event.data.object.client_reference_id);
      break;
    case 'invoice.payment_succeeded':
      await extendSubscription(event.data.object.subscription);
      break;
    case 'charge.refunded':
      await markPurchaseRefunded(event.data.object.payment_intent);
      await revokeEntitlement(...);
      break;
    case 'customer.subscription.deleted':
      await markSubscriptionCancelled(event.data.object.id);
      break;
  }
  return NextResponse.json({ received: true });
};
```

## 实施顺序 (W13 一周内)

| Day | Task                                                | Time |
| --- | --------------------------------------------------- | ---- |
| Mon | Stripe 账户 + product/price 创建 (dashboard)        | 30m  |
| Mon | Migration: `StripePurchase` + User 列               | 1h   |
| Tue | checkout endpoints (report + coaching)              | 2h   |
| Wed | webhook handler + signature 验证                    | 2h   |
| Wed | 接入 `canAccessFeature`                             | 1h   |
| Thu | 前端 paywall UI (report-client + coaching-chat)     | 3h   |
| Thu | 跑 Stripe CLI `stripe listen --forward-to` 本地测试 | 1h   |
| Fri | Production 部署 + 真实 $0.50 测试单                 | 30m  |
| Fri | subscription-sync cron + Sentry alerts              | 1h   |

**总: ~12h, 1 周一人**.

## Vercel Hobby → Pro 升级触发

- **必须在 production 商业化第一笔交易前 24h 升级** (Hobby ToS 禁止商业用途)
- $20/月起步, 论文采集结束时立即升 (即使首笔交易还没到)

## 前期可做的 (不在 W13+ 阻塞窗口)

我现在已经做完的 / 可以现在做的:

- ✅ Migration 编号已留 095+ (093/094 已被 P0 占用)
- ✅ 数据模型设计完毕 (本文档)
- ✅ Entitlement 函数已存在 (`lib/cohort/entitlements.ts`), 只需扩展逻辑
- ⏳ 可现在写: env var 占位 (STRIPE_SECRET_KEY 已经在 .env.example 里了)
- ⏳ 可现在写: paywall UI 草稿 (无 Stripe 依赖, 纯组件)

## 不做的事 (本文档刻意排除)

- ❌ **不写 production code 现在** — Stripe SDK 在 10 周内可能 minor 升级 (Stripe 平均 ~2/月发版); 现在写 = 10 周后 audit + 改
- ❌ **不预设三方支付** — Alipay / WeChat Pay 等待中国用户上线再加
- ❌ **不做 enterprise plan** — solo founder, 不卖 B2B
- ❌ **不做 affiliate / referral** — 论文期不需要; 商业化后看数据再决定

## 参考文档

- Stripe Checkout: https://stripe.com/docs/payments/checkout
- Stripe Webhooks: https://stripe.com/docs/webhooks
- Next.js Stripe example: https://github.com/vercel/nextjs-subscription-payments (作为参考, 别照搬, 那个用 Supabase)
