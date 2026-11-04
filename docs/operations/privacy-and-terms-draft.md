---
title: Privacy Policy + Terms of Service — V1 Draft (商业化前)
category: operations
status: draft
authored: 2026-05-19
target_implementation: post-thesis (W13 商业化第一天前必须上线)
review_required:
  - 荷兰执业律师 (commercial / data protection)
  - 论文导师 (verify 不冲突论文 ethics)
---

# Privacy Policy + Terms of Service — V1 Draft

> 这是**起步草稿**, 不是法律意见。商业化前必须找荷兰律师 review (个人产品 ~€200-500 fixed-fee 可以买到 GDPR-compliant policy review)。本文档目的是把内容/结构锁定, 律师审阅时只需调措辞而不是从零起草。

## 为什么需要 (法律 vs 文化 vs 商业)

**法律**: GDPR Art 13/14 强制要求 controller 在收集前披露; Dutch Consumer Authority (ACM) 对网店 Terms 有最低要求; Vercel ToS 也要求商业化产品有 published privacy policy.

**文化**: 用户在做高度个人化的心理测量, "我的答案去哪了" 是基本信任问题. 一份诚实 + 简洁的 policy 是产品 credibility 信号.

**商业**: Stripe / Apple Pay / Google Pay 接入审核时都会扫 privacy policy URL; 没有 = 拒.

---

# Part A — Privacy Policy

## 1. Who we are

Deep Dive ("we", "us") is operated by [Founder Legal Name], a sole proprietorship registered in the Netherlands. Contact: [email]. Data controller under GDPR.

## 2. What data we collect

**Account data** (你提供):

- Email address (login + transactional emails)
- Name (display only)
- Optional: career stage, resume content (if you choose to upload)

**Assessment data** (你回答):

- Responses to the 86-question Deep Dive (Big Five, Schwartz values, RIASEC, SJT scenarios)
- Responses to the 38-question Quick Dive
- Optional: real-life constraints (location, salary, family) you choose to share

**Usage data** (自动收集):

- Pages visited, time on page, device type, IP-derived country (no exact location)
- Errors that occur (via Sentry, anonymized stack traces)
- AI interactions (which features you used; not the conversation content unless flagged for review)

**We do NOT collect**:

- Exact GPS location
- Contacts / camera / microphone
- Browsing history outside this site
- Social media activity unless you explicitly link an account

## 3. Why we collect (legal basis under GDPR)

| Purpose                   | Legal basis                       | Example                                       |
| ------------------------- | --------------------------------- | --------------------------------------------- |
| Run the assessment        | Contract (your purchase / signup) | Compute your archetype + report               |
| Send transactional emails | Contract                          | Welcome, password reset, receipt              |
| Diagnose bugs             | Legitimate interest               | Sentry error tracking                         |
| Improve the product       | Legitimate interest               | Aggregated usage analytics                    |
| Research (if you opt in)  | Explicit consent                  | Anonymized data used in academic publications |
| Comply with law           | Legal obligation                  | Tax records of purchases                      |

## 4. Who sees your data (sub-processors)

| Service                     | Purpose                     | Data shared                                           | Location           |
| --------------------------- | --------------------------- | ----------------------------------------------------- | ------------------ |
| Vercel (hosting)            | Run the platform            | All request data                                      | EU + US edge       |
| Neon (database)             | Store account + answers     | Account, assessment, report data                      | EU region          |
| Anthropic / OpenAI / Google | Generate reports + coaching | Aggregated profile + scenario prompts (no email/name) | US                 |
| Sentry                      | Error tracking              | Anonymized errors                                     | EU                 |
| Cloudflare R2               | Static assets               | None (no PII)                                         | Global edge        |
| Resend                      | Transactional email         | Email address + message                               | EU                 |
| Stripe                      | Payments                    | Email + payment details                               | US (DPF certified) |

**International transfers**: When data goes to US (LLM providers, Stripe, Sentry server-side), we rely on Standard Contractual Clauses (SCCs) and where applicable the EU-US Data Privacy Framework certification.

## 5. How long we keep your data

| Data type             | Retention                                                       |
| --------------------- | --------------------------------------------------------------- |
| Account (email/name)  | Until you delete (30-day grace period)                          |
| Assessment answers    | Until you delete OR 5 years from last activity, whichever first |
| Generated report      | Until you delete OR 5 years (so you can re-read)                |
| Coaching conversation | 90 days rolling (auto-deleted)                                  |
| Usage analytics       | 180 days                                                        |
| LLM call logs         | 90 days                                                         |
| Payment records       | 7 years (Dutch tax law)                                         |

## 6. Your rights (GDPR Art 15-22)

You can, free of charge, anytime:

- **Access** your data → in Settings → Export My Data (machine-readable JSON)
- **Correct** wrong info → in Settings or email us
- **Delete** all data → in Settings → Delete Account (30-day grace, then permanent)
- **Restrict** processing → email us
- **Object** to a specific use → email us
- **Data portability** → Export gives you all data in portable format
- **Withdraw consent** → for research opt-in, anytime
- **Lodge a complaint** → Dutch Data Protection Authority (Autoriteit Persoonsgegevens), https://autoriteitpersoonsgegevens.nl

## 7. Security

- All data in transit: TLS 1.2+ (browser to server)
- All data at rest: AES-256 (Neon-managed)
- Passwords: bcrypt 12 rounds (never stored plaintext)
- Session tokens: HttpOnly + Secure + SameSite cookies
- Sensitive answers: session-scoped on your device (not persisted in browser storage)
- Annual security review (founder + automated)

## 8. Cookies

We use:

- **Essential** (always on): session login cookie, CSRF protection. No consent needed (functional).
- **Analytics** (optional): aggregated page-view counts. Anonymized. You can opt out.

We don't use advertising cookies. We don't sell data to third parties.

## 9. Changes to this policy

Material changes notified via email 14 days before taking effect.

## 10. Contact

- Privacy questions: [privacy@deepdive.app]
- Data export / deletion: Settings → Account → Data Controls

---

# Part B — Terms of Service

## 1. Who we are (same as privacy)

## 2. What you get

Deep Dive provides AI-assisted career self-discovery via psychometric assessments and AI coaching. **It is not** career counseling, therapy, or medical advice. Treat outputs as a starting point for reflection, not as professional guidance.

## 3. Your account

- One account per person. Don't share.
- Keep your password secure. We're not liable for losses from compromised accounts you control.
- Minimum age: 16 (younger users require guardian consent under GDPR Art 8).

## 4. Payment

- Prices shown in USD (EUR/GBP added later). VAT computed at checkout per Dutch tax law.
- **Reports**: one-time purchase, lifetime access to that report.
- **Coaching**: monthly subscription, cancel anytime via Settings → Subscription. Next billing skipped.
- **Refunds**: 14-day no-questions-asked refund (EU consumer law). Request via email.
- After refund, access to the purchased item is revoked.

## 5. Acceptable use

You agree not to:

- Submit deliberately false answers to corrupt the assessment
- Attempt to extract our prompts, models, or proprietary content
- Use automated tools to scrape or replay assessments
- Resell, redistribute, or sublicense reports or coaching sessions
- Use the service for purposes harmful to yourself or others

Violation may result in account suspension without refund.

## 6. AI disclosures

- Reports and coaching responses are generated by large language models (LLMs).
- LLMs sometimes make mistakes ("hallucinate"). You are responsible for evaluating advice critically.
- We don't guarantee specific career outcomes from following AI suggestions.
- LLM providers used: Anthropic Claude, OpenAI GPT, Google Gemini, Groq Llama. We route between them for reliability.

## 7. Intellectual property

- The platform, prompts, evaluation pipeline, and 12-archetype framework are our IP.
- Your assessment answers and any content you submit remain your IP.
- Generated reports: granted to you for personal, non-commercial use under a perpetual license.

## 8. Limitation of liability

- The service is provided "as is".
- We are not liable for indirect damages (lost income, missed opportunities) arising from acting on AI-generated content.
- Maximum aggregate liability: amount you paid us in the past 12 months.
- These limits don't apply to gross negligence or willful misconduct.

## 9. Termination

- You may close your account anytime (Settings → Delete Account).
- We may suspend / terminate for ToS violations, with notice where reasonable.

## 10. Governing law and disputes

- Governed by Dutch law.
- Disputes: first 30 days of good-faith negotiation; then Amsterdam courts.
- EU consumers retain the right to courts in their country of residence.

## 11. Changes

Material changes notified via email 14 days before taking effect. Continued use = acceptance.

---

# Implementation Checklist (W13 商业化前)

- [ ] 律师 review 这两份草稿 (~€200-500 fixed-fee)
- [ ] Replace [Founder Legal Name] / [email] / [privacy@] 占位符
- [ ] 创建 `/app/[locale]/(legal)/privacy/page.tsx` + `/terms/page.tsx`
- [ ] 注册页 + 付费页 footer 加链接
- [ ] i18n: en + zh (其他语言后加)
- [ ] Date of "Last updated" 自动注入 (build time)
- [ ] Settings → Data Controls: 链 "Export My Data" + "Delete Account" 到现有 endpoint (P0-7 已覆盖)
- [ ] 隐私政策 URL 配到 Stripe / Google OAuth / Apple Sign In 控制台

## 风险与边界

| 问题                                 | 答案                                                                       |
| ------------------------------------ | -------------------------------------------------------------------------- |
| 论文招募期需要这两份吗?              | **不需要** — 论文期是非商业研究, 当前 cookie banner + 简单 disclaimer 足够 |
| 律师 review 不能跳过吗?              | **不能跳** — GDPR 罚款上限 €20M / 4% revenue, 律师 €500 是保险费           |
| 我可以照抄 OpenAI / Notion 的政策吗? | **不能** — 法律文档 + 你的具体业务事实必须匹配, 抄会出现自相矛盾           |
| 不商业化也要做吗?                    | **不强制** — 但有 published policy 是产品诚信信号, 论文展示加分项          |
