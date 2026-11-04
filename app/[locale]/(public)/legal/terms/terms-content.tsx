"use client"

import { LegalPageLayout } from "@/components/layout/legal-page-layout"
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client"
import type { Locale } from "@/lib/i18n/config"

interface TermsContentProps {
  locale: string
}

function EnContent() {
  return (
    <>
      <section>
        <h2>1. What Deep Dive Is</h2>
        <p>
          Deep Dive is a career exploration platform that helps you understand your professional
          identity through structured assessments, AI-generated career reports, and coaching
          conversations. It is designed for self-reflection and exploration — not as a replacement
          for professional career counseling, psychological assessment, or clinical advice.
        </p>
      </section>

      <section>
        <h2>2. Your Account</h2>
        <p>
          When you create an account, you are responsible for keeping your login credentials secure.
          You agree to provide accurate information during registration and to notify us if you
          believe your account has been compromised. Each account is for a single individual —
          sharing accounts is not permitted.
        </p>
      </section>

      <section>
        <h2>3. Your Data Belongs to You</h2>
        <p>
          All personal data you provide — assessment responses, career reports, coaching
          conversations, and profile information — belongs to you. You can export all your data
          at any time from the Privacy Center, and you can request permanent deletion of your
          account and all associated data.
        </p>
        <p>
          By using Deep Dive, you grant us a limited license to process your data solely for the
          purpose of delivering the service (generating reports, powering coaching conversations,
          and improving assessment accuracy through aggregated, anonymized analysis). We do not
          sell your data, use it for advertising, or share it beyond what is described in our{" "}
          <a href="/en/legal/privacy">Privacy Policy</a>.
        </p>
      </section>

      <section>
        <h2>4. AI-Generated Content</h2>
        <p>
          Deep Dive uses AI (from Anthropic and OpenAI) to generate narrative career reports and
          coaching responses. While we work hard to make these insightful and accurate, please
          understand that:
        </p>
        <ul>
          <li>
            AI-generated content is based on your assessment responses and should be treated as
            a starting point for reflection, not a definitive answer
          </li>
          <li>
            Reports and coaching suggestions do not constitute professional career advice,
            psychological diagnosis, or clinical assessment
          </li>
          <li>
            The core scoring algorithms (RIASEC, Big Five, Schwartz values) are deterministic
            and based on validated psychometric frameworks — AI is used only for narrative
            generation and coaching dialogue
          </li>
          <li>
            Results may vary if you retake the assessment, as your responses may change over time
          </li>
        </ul>
      </section>

      <section>
        <h2>5. Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use Deep Dive for any unlawful purpose</li>
          <li>Attempt to access other users&apos; accounts or data</li>
          <li>Interfere with or disrupt the platform&apos;s infrastructure</li>
          <li>Use automated tools to scrape content or overload our systems</li>
          <li>Misrepresent your identity or impersonate others</li>
        </ul>
      </section>

      <section>
        <h2>6. Intellectual Property</h2>
        <p>
          The Deep Dive platform — including its assessment instruments, scoring algorithms,
          archetype system, UI design, and brand identity — is the intellectual property of
          Deep Dive. You may not copy, reproduce, or distribute any part of the platform
          without written permission.
        </p>
        <p>
          Your personal data and generated reports are yours. You are free to share your own
          results as you see fit.
        </p>
      </section>

      <section>
        <h2>7. Service Availability</h2>
        <p>
          We strive to keep Deep Dive available and reliable, but we cannot guarantee
          uninterrupted service. We may occasionally need to perform maintenance, update
          features, or address technical issues. We will not be liable for any temporary
          unavailability of the service.
        </p>
      </section>

      <section>
        <h2>8. Account Termination</h2>
        <p>
          You may delete your account at any time from your Settings. After a 30-day
          cooling-off period, all your data will be permanently deleted.
        </p>
        <p>
          We reserve the right to suspend or terminate accounts that violate these terms or
          engage in abusive behavior. In such cases, we will provide notice and an explanation
          unless immediate action is necessary to protect the platform or other users.
        </p>
      </section>

      <section>
        <h2>9. Limitation of Liability</h2>
        <p>
          Deep Dive is provided &ldquo;as is&rdquo; without warranties of any kind, express or implied.
          To the maximum extent permitted by law, Deep Dive shall not be liable for any
          indirect, incidental, or consequential damages arising from your use of the platform,
          including but not limited to career decisions made based on assessment results or
          AI-generated recommendations.
        </p>
      </section>

      <section>
        <h2>10. Changes to These Terms</h2>
        <p>
          We may update these terms from time to time. For significant changes, we will notify
          you by email (if you have an account) or by displaying a notice on the platform.
          Continued use of Deep Dive after changes take effect constitutes acceptance of the
          updated terms.
        </p>
      </section>

      <section>
        <h2>11. Governing Law</h2>
        <p>
          These terms are governed by the laws of the Netherlands. Any disputes arising from
          these terms or your use of Deep Dive shall be subject to the exclusive jurisdiction
          of the courts of Amsterdam, the Netherlands.
        </p>
      </section>

      <section>
        <h2>12. Contact</h2>
        <p>
          Questions about these terms? Reach out to us at{" "}
          <a href="mailto:deepdivecareer@outlook.com">deepdivecareer@outlook.com</a>.
        </p>
      </section>
    </>
  )
}

function ZhContent() {
  return (
    <>
      <section>
        <h2>1. Deep Dive 是什么</h2>
        <p>
          Deep Dive
          是一个职业探索平台，通过结构化测评、AI生成的职业报告和教练对话，帮助你了解自己的职业身份。它旨在帮助你自我反思和探索——而非替代专业的职业咨询、心理评估或临床建议。
        </p>
      </section>

      <section>
        <h2>2. 你的账户</h2>
        <p>
          创建账户时，你有责任保管好登录凭证。你同意在注册时提供准确信息，并在认为账户被盗用时及时通知我们。每个账户供个人使用，不得共享。
        </p>
      </section>

      <section>
        <h2>3. 你的数据归你所有</h2>
        <p>
          你提供的所有个人数据——测评回答、职业报告、教练对话和个人档案——均属于你。你可以随时在隐私中心导出所有数据，也可以申请永久删除账户及所有关联数据。
        </p>
        <p>
          使用 Deep Dive 即表示你授予我们有限的许可，仅用于提供服务（生成报告、驱动教练对话、通过汇总匿名分析改进评估准确性）。我们不出售你的数据，不将其用于广告，也不会超出{" "}
          <a href="/zh/legal/privacy">隐私政策</a>所述范围进行共享。
        </p>
      </section>

      <section>
        <h2>4. AI 生成内容</h2>
        <p>
          Deep Dive 使用 AI（来自 Anthropic 和 OpenAI）生成叙事性职业报告和教练回复。虽然我们努力使其具有洞察力和准确性，但请理解：
        </p>
        <ul>
          <li>AI 生成的内容基于你的测评回答，应作为反思的起点，而非最终答案</li>
          <li>报告和教练建议不构成专业职业建议、心理诊断或临床评估</li>
          <li>
            核心评分算法（RIASEC、大五人格、Schwartz 价值观）是确定性的，基于经过验证的心理测量框架——AI
            仅用于叙事生成和教练对话
          </li>
          <li>如果你重新进行测评，结果可能会有所不同，因为你的回答可能随时间变化</li>
        </ul>
      </section>

      <section>
        <h2>5. 合理使用</h2>
        <p>你同意不会：</p>
        <ul>
          <li>将 Deep Dive 用于任何非法目的</li>
          <li>尝试访问其他用户的账户或数据</li>
          <li>干扰或破坏平台基础设施</li>
          <li>使用自动化工具抓取内容或过载我们的系统</li>
          <li>冒充他人身份</li>
        </ul>
      </section>

      <section>
        <h2>6. 知识产权</h2>
        <p>
          Deep Dive 平台——包括其评估工具、评分算法、原型系统、界面设计和品牌标识——是 Deep Dive
          的知识产权。未经书面许可，不得复制、转载或分发平台的任何部分。
        </p>
        <p>你的个人数据和生成的报告归你所有。你可以自由分享自己的结果。</p>
      </section>

      <section>
        <h2>7. 服务可用性</h2>
        <p>
          我们努力保持 Deep Dive
          的可用性和稳定性，但无法保证服务不中断。我们可能偶尔需要进行维护、更新功能或处理技术问题。我们不对服务的临时不可用承担责任。
        </p>
      </section>

      <section>
        <h2>8. 账户终止</h2>
        <p>你可以随时在设置中删除账户。经过 30 天冷静期后，你的所有数据将被永久删除。</p>
        <p>
          我们保留暂停或终止违反本条款或存在滥用行为的账户的权利。在此情况下，除非为保护平台或其他用户而需立即采取行动，否则我们会提供通知和说明。
        </p>
      </section>

      <section>
        <h2>9. 责任限制</h2>
        <p>
          Deep Dive 按&ldquo;现状&rdquo;提供，不附带任何明示或暗示的保证。在法律允许的最大范围内，Deep Dive
          不对因使用平台而产生的任何间接、附带或后果性损害承担责任，包括但不限于基于测评结果或 AI
          生成建议所做的职业决策。
        </p>
      </section>

      <section>
        <h2>10. 条款变更</h2>
        <p>
          我们可能会不时更新本条款。对于重大变更，我们将通过电子邮件（如果你有账户）或在平台上显示通知的方式告知你。变更生效后继续使用
          Deep Dive 即表示接受更新后的条款。
        </p>
      </section>

      <section>
        <h2>11. 适用法律</h2>
        <p>
          本条款受荷兰法律管辖。因本条款或你使用 Deep Dive
          而产生的任何争议，应由荷兰阿姆斯特丹的法院专属管辖。
        </p>
      </section>

      <section>
        <h2>12. 联系我们</h2>
        <p>
          对本条款有疑问？请通过以下邮箱联系我们：{" "}
          <a href="mailto:deepdivecareer@outlook.com">deepdivecareer@outlook.com</a>
        </p>
      </section>
    </>
  )
}

export function TermsContent({ locale }: TermsContentProps) {
  const isZh = locale === "zh"
  const legalT = getDictionaryClient(locale as Locale).legal

  return (
    <LegalPageLayout
      locale={locale}
      title={legalT.termsOfService}
      lastUpdated={legalT.termsLastUpdated}
      backLabel={legalT.backToHome}
    >
      {isZh ? <ZhContent /> : <EnContent />}
    </LegalPageLayout>
  )
}
