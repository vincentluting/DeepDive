"use client";

import { LegalPageLayout } from "@/components/layout/legal-page-layout";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import type { Locale } from "@/lib/i18n/config";

interface PrivacyPolicyContentProps {
  locale: string;
}

function EnContent() {
  return (
    <>
      <section>
        <h2>1. Data Controller</h2>
        <p>
          Deep Dive is the data controller for all personal data collected
          through this platform. For privacy-related inquiries, contact us at{" "}
          <a href="mailto:deepdivecareer@outlook.com">
            deepdivecareer@outlook.com
          </a>
          .
        </p>
      </section>

      <section>
        <h2>2. What Data We Collect</h2>

        <h3>Account Information</h3>
        <p>
          When you create an account, we collect your email address, a hashed
          version of your password (we never store your password in plain text),
          and a display name or nickname.
        </p>

        <h3>Assessment Data</h3>
        <p>
          We store your responses to our assessment instruments, including
          RIASEC interest questions, Big Five personality items (IPIP), Schwartz
          value questions (DDVQ-21), and situational judgment scenarios (SJT).
          We also record response timing metadata to assess answer quality and
          detect rushed completions.
        </p>

        <h3>Career Reports and Profile</h3>
        <p>
          We store the career reports and personal profile generated from your
          assessment, including your archetype, personality dimensions, value
          orientations, career direction recommendations, and any reality
          conditions you provide (location, industry experience, language
          skills, etc.).
        </p>

        <h3>AI Coaching Data</h3>
        <p>
          If you use the AI coaching feature, we store your conversation history
          and extracted memory entries (keywords, insights, and confidence
          scores) to maintain context across coaching sessions.
        </p>

        <h3>Resume Data</h3>
        <p>
          If you upload a resume, we extract and store relevant professional
          information (work history, skills, education, projects, languages)
          solely for the purpose of enhancing the accuracy of your career
          report. Resume data is not used for any other purpose.
        </p>

        <h3>Quick Dive Data</h3>
        <p>
          Responses to the Quick Dive interest survey and your resulting
          archetype are stored to power your profile and serve as a foundation
          for the full Deep Dive assessment.
        </p>

        <h3>Analytics and Technical Data</h3>
        <p>
          We collect anonymized technical data to improve the platform,
          including: <strong>hashed IP addresses</strong> (we hash IP addresses
          before storage — raw IP addresses are never retained), device type
          (mobile/desktop), pages visited, session duration, city-level
          geographic location, and UTM campaign parameters. This data cannot be
          used to identify you individually.
        </p>

        <h3>Cookies and Local Storage</h3>
        <p>We use a minimal set of cookies and browser storage:</p>
        <ul>
          <li>
            <strong>Session cookie</strong> — keeps you signed in during your
            browser session
          </li>
          <li>
            <strong>NEXT_LOCALE cookie</strong> — remembers your language
            preference (English or Chinese)
          </li>
          <li>
            <strong>CSRF token cookie</strong> — protects against cross-site
            request forgery attacks
          </li>
          <li>
            <strong>localStorage (questionnaire progress)</strong> — saves your
            in-progress questionnaire answers locally so you can resume if you
            close the tab
          </li>
        </ul>
        <p>
          <strong>
            We do not use third-party tracking cookies, advertising cookies, or
            any analytics cookies from external services.
          </strong>
        </p>
      </section>

      <section>
        <h2>3. How We Use Your Data</h2>
        <p>We use your data to:</p>
        <ul>
          <li>Provide and maintain our career exploration services</li>
          <li>Generate your career reports, personal profile, and archetype</li>
          <li>Power AI coaching conversations and maintain coaching memory</li>
          <li>Improve assessment accuracy using aggregated, anonymized data</li>
          <li>Detect and prevent quality issues (e.g., rushed responses)</li>
          <li>Provide customer support</li>
        </ul>
        <p>
          <strong>
            We do not use your data for advertising, we do not sell your data to
            any third party, and we do not build behavioral profiles for
            targeting purposes.
          </strong>
        </p>
      </section>

      <section>
        <h2>4. Legal Basis for Processing (GDPR)</h2>
        <p>
          For users in the European Economic Area (EEA), we process your
          personal data under the following legal bases:
        </p>
        <ul>
          <li>
            <strong>Contractual necessity (Article 6(1)(b))</strong> —
            processing required to deliver the services you signed up for,
            including generating reports and maintaining your account
          </li>
          <li>
            <strong>Legitimate interests (Article 6(1)(f))</strong> — anonymized
            analytics used to improve platform quality, security monitoring, and
            fraud prevention
          </li>
          <li>
            <strong>Consent (Article 6(1)(a))</strong> — optional features such
            as personalized AI coaching and conversation memory, which you can
            disable at any time from your Privacy Center
          </li>
          <li>
            <strong>
              Explicit consent for special category data (Article 9(2)(a))
            </strong>{" "}
            — career assessment responses may reveal psychological
            characteristics, which constitute special category data under GDPR.
            We process this data only with your explicit consent, provided when
            you begin the assessment. You may withdraw consent and request
            deletion of this data at any time via your Privacy Center or by
            contacting us directly.
          </li>
        </ul>
      </section>

      <section>
        <h2>5. AI Processing and Third-Party AI Providers</h2>
        <p>
          Deep Dive uses AI to generate narrative career reports and power
          coaching conversations. We work with two AI providers:
        </p>
        <ul>
          <li>
            <strong>OpenAI</strong> — used for structured data extraction tasks
            and certain report sections (Panel 3: career pathway)
          </li>
          <li>
            <strong>Anthropic (Claude)</strong> — used for narrative report
            content (career identity, personality narrative) and AI coaching
            conversations
          </li>
        </ul>
        <p>
          Both providers act as data sub-processors under commercial API
          agreements. Under these agreements,{" "}
          <strong>your data is not used to train their models</strong>.
        </p>
        <p>
          <strong>Important:</strong> Our core scoring pipeline — which
          calculates your RIASEC profile, Big Five personality dimensions, and
          Schwartz values from your questionnaire responses — is entirely a
          deterministic algorithm. No AI is involved in this step. AI is used
          only for generating narrative text and coaching dialogue.
        </p>
      </section>

      <section>
        <h2>6. Data Sharing</h2>
        <p>
          We do not sell, rent, or trade your personal data. We share data only
          in the following limited circumstances:
        </p>
        <ul>
          <li>
            <strong>AI providers</strong> (OpenAI, Anthropic, Google) — as
            described above, solely to generate report content and coaching
            responses via commercial API endpoints
          </li>
          <li>
            <strong>Hosting infrastructure</strong> (Vercel) — to serve the
            application
          </li>
          <li>
            <strong>Database provider</strong> (Neon) — to store your data
            securely
          </li>
          <li>
            <strong>Legal requirements</strong> — if required by law or to
            protect the rights and safety of users or the public
          </li>
        </ul>
      </section>

      <section>
        <h2>7. Data Storage and Security</h2>
        <p>
          Your data is stored in a Neon PostgreSQL database, hosted on
          infrastructure provided by Vercel. We implement the following security
          measures:
        </p>
        <ul>
          <li>Passwords are hashed using bcrypt before storage</li>
          <li>All data transmitted over HTTPS/TLS encryption</li>
          <li>Database connections use encrypted channels</li>
          <li>CSRF protection on all state-changing API requests</li>
          <li>
            IP addresses are hashed before storage (raw IPs are never retained)
          </li>
          <li>Admin access is restricted and separately authenticated</li>
        </ul>
        <p>
          <strong>Data retention:</strong>
        </p>
        <ul>
          <li>
            Account data is retained for as long as your account is active
          </li>
          <li>Anonymized analytics data is retained for 12 months</li>
          <li>
            After you request account deletion, there is a 30-day cooling-off
            period. After that period, all your data is permanently and
            irreversibly deleted from our systems.
          </li>
        </ul>
      </section>

      <section>
        <h2>8. Your Rights</h2>
        <p>
          You have the following rights regarding your personal data. You can
          exercise most of these directly from your{" "}
          <a href="#privacy-center">Privacy Center</a> (Settings → Privacy):
        </p>
        <ul>
          <li>
            <strong>Right of access</strong> — view a summary of all data we
            hold about you (available in the Privacy Center)
          </li>
          <li>
            <strong>Right to data portability</strong> — export all your data as
            a structured JSON file (available in the Privacy Center)
          </li>
          <li>
            <strong>Right to rectification</strong> — update your account
            information in Settings
          </li>
          <li>
            <strong>Right to erasure</strong> — delete your account and all
            associated data (subject to the 30-day cooling-off period)
          </li>
          <li>
            <strong>Right to restrict processing</strong> — disable
            personalization and conversation saving in the Privacy Center
          </li>
          <li>
            <strong>Right to object</strong> — object to processing based on
            legitimate interests by contacting us at{" "}
            <a href="mailto:deepdivecareer@outlook.com">
              deepdivecareer@outlook.com
            </a>
          </li>
          <li>
            <strong>Right to withdraw consent</strong> — withdraw consent for
            optional features at any time from the Privacy Center
          </li>
          <li>
            <strong>Right to lodge a complaint</strong> — you may lodge a
            complaint with the Dutch data protection authority, Autoriteit
            Persoonsgegevens (
            <a
              href="https://autoriteitpersoonsgegevens.nl"
              target="_blank"
              rel="noopener noreferrer"
            >
              autoriteitpersoonsgegevens.nl
            </a>
            ), or the supervisory authority in your country of residence
          </li>
        </ul>
      </section>

      <section>
        <h2>9. Children&apos;s Privacy</h2>
        <p>
          Deep Dive is not directed at individuals under the age of 18. We do
          not knowingly collect personal data from minors. If you believe we
          have inadvertently collected data from a child, please contact us at{" "}
          <a href="mailto:deepdivecareer@outlook.com">
            deepdivecareer@outlook.com
          </a>
          .
        </p>
      </section>

      <section>
        <h2>10. International Data Transfers</h2>
        <p>
          Your data may be processed in countries outside the European Economic
          Area (EEA), including the United States, where our AI providers and
          hosting infrastructure operate. Where such transfers occur, we rely on
          Standard Contractual Clauses (SCCs) approved by the European
          Commission to ensure an adequate level of data protection.
        </p>
      </section>

      <section>
        <h2>11. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. For significant
          changes, we will notify you by email (if you have an account) or by
          displaying a prominent notice on the platform. The date at the top of
          this page reflects the date of the most recent update. We encourage
          you to review this policy periodically.
        </p>
      </section>

      <section>
        <h2>12. Contact Us</h2>
        <p>
          For privacy-related questions, requests, or concerns, contact us at:{" "}
          <a href="mailto:deepdivecareer@outlook.com">
            deepdivecareer@outlook.com
          </a>
        </p>
      </section>
    </>
  );
}

function ZhContent() {
  return (
    <>
      <section>
        <h2>1. 数据控制者</h2>
        <p>
          Deep Dive
          是本平台收集的所有个人数据的数据控制者。如有隐私相关问题，请通过以下邮箱联系我们：{" "}
          <a href="mailto:deepdivecareer@outlook.com">
            deepdivecareer@outlook.com
          </a>
          。
        </p>
      </section>

      <section>
        <h2>2. 我们收集哪些数据</h2>

        <h3>账户信息</h3>
        <p>
          当您创建账户时，我们会收集您的电子邮件地址、密码的哈希值（我们从不以明文形式存储密码），以及显示名称或昵称。
        </p>

        <h3>评估数据</h3>
        <p>
          我们存储您对各评估量表的回答，包括：RIASEC
          兴趣问题、大五人格条目（IPIP）、Schwartz
          价值观问题（DDVQ-21），以及情境判断场景（SJT）。我们还会记录作答时间元数据，用于评估答题质量并检测草率完成情况。
        </p>

        <h3>职业报告与档案</h3>
        <p>
          我们存储根据您的评估生成的职业报告和个人档案，包括您的原型类型、人格维度、价值取向、职业方向建议，以及您提供的现实条件（所在城市、行业经验、语言能力等）。
        </p>

        <h3>AI 教练数据</h3>
        <p>
          如果您使用 AI
          教练功能，我们会存储您的对话历史记录和提取的记忆条目（关键词、洞察与置信度），以在不同教练会话间保持上下文连续性。
        </p>

        <h3>简历数据</h3>
        <p>
          如果您上传简历，我们会提取并存储相关职业信息（工作经历、技能、教育背景、项目经历、语言能力），仅用于提升职业报告的准确性。简历数据不用于任何其他目的。
        </p>

        <h3>Quick Dive 数据</h3>
        <p>
          Quick Dive
          兴趣问卷的回答及您的原型结果会被存储，用于驱动您的个人档案，并作为完整深度探索评估的基础。
        </p>

        <h3>分析与技术数据</h3>
        <p>
          我们收集匿名化技术数据以改进平台，包括：
          <strong>哈希化的 IP 地址</strong>（我们在存储前对 IP
          地址进行哈希处理——从不保留原始 IP
          地址）、设备类型（移动/桌面）、访问页面、会话时长、城市级地理位置，以及
          UTM 广告系列参数。这些数据无法用于单独识别您的身份。
        </p>

        <h3>Cookie 与本地存储</h3>
        <p>我们仅使用以下最小化的 Cookie 和浏览器存储：</p>
        <ul>
          <li>
            <strong>Session Cookie</strong> — 在浏览器会话期间保持您的登录状态
          </li>
          <li>
            <strong>NEXT_LOCALE Cookie</strong> — 记住您的语言偏好（中文或英文）
          </li>
          <li>
            <strong>CSRF 令牌 Cookie</strong> — 防范跨站请求伪造攻击
          </li>
          <li>
            <strong>localStorage（问卷进度）</strong> —
            在本地保存您正在作答的问卷，以便关闭标签页后继续作答
          </li>
        </ul>
        <p>
          <strong>
            我们不使用任何第三方追踪 Cookie、广告 Cookie 或来自外部服务的分析
            Cookie。
          </strong>
        </p>
      </section>

      <section>
        <h2>3. 如何使用数据</h2>
        <p>我们使用您的数据用于：</p>
        <ul>
          <li>提供并维护职业探索服务</li>
          <li>生成您的职业报告、个人档案和原型类型</li>
          <li>驱动 AI 教练对话并维护教练记忆</li>
          <li>通过汇总匿名数据改进评估准确性</li>
          <li>检测和防止质量问题（如草率作答）</li>
          <li>提供客户支持</li>
        </ul>
        <p>
          <strong>
            我们不会将您的数据用于广告，不会向任何第三方出售您的数据，也不会构建用于定向的行为画像。
          </strong>
        </p>
      </section>

      <section>
        <h2>4. 处理数据的法律依据（GDPR）</h2>
        <p>
          对于欧洲经济区（EEA）的用户，我们依据以下法律依据处理您的个人数据：
        </p>
        <ul>
          <li>
            <strong>合同履行（第 6(1)(b) 条）</strong> —
            提供您注册的服务所必需的处理，包括生成报告和维护账户
          </li>
          <li>
            <strong>合法利益（第 6(1)(f) 条）</strong> —
            用于提升平台质量的匿名分析、安全监控和欺诈预防
          </li>
          <li>
            <strong>同意（第 6(1)(a) 条）</strong> — 个性化 AI
            教练和对话记忆等可选功能，您可随时在隐私中心停用
          </li>
          <li>
            <strong>特殊类别数据的明确同意（第 9(2)(a) 条）</strong> —
            职业评估回答可能揭示心理特征，这构成 GDPR
            下的特殊类别数据。我们仅在您开始评估时提供的明确同意下处理此类数据。您可随时通过隐私中心或直接联系我们撤回同意并要求删除此类数据。
          </li>
        </ul>
      </section>

      <section>
        <h2>5. AI 处理与第三方 AI 提供商</h2>
        <p>
          Deep Dive 使用 AI 生成叙事性职业报告并驱动教练对话。我们与两家 AI
          提供商合作：
        </p>
        <ul>
          <li>
            <strong>OpenAI</strong> —
            用于结构化数据提取任务和部分报告内容（板块三：职业路径）
          </li>
          <li>
            <strong>Anthropic (Claude)</strong> —
            用于叙事性报告内容（职业身份、人格叙事）和 AI 教练对话
          </li>
        </ul>
        <p>
          两家提供商均作为数据分处理方，受商业 API 协议约束。根据协议，
          <strong>您的数据不会被用于训练其模型</strong>。
        </p>
        <p>
          <strong>重要说明：</strong>
          我们的核心评分管道——根据您的问卷回答计算 RIASEC 档案、大五人格维度和
          Schwartz 价值观——完全是确定性算法。此步骤不涉及 AI。AI
          仅用于生成叙事文本和教练对话。
        </p>
      </section>

      <section>
        <h2>6. 数据共享</h2>
        <p>我们不出售、出租或交易您的个人数据。仅在以下有限情况下共享数据：</p>
        <ul>
          <li>
            <strong>AI 提供商</strong>（OpenAI、Anthropic、Google）—
            如上所述，仅通过商用 API 端点生成报告内容和教练回复
          </li>
          <li>
            <strong>托管基础设施</strong>（Vercel）— 用于提供应用服务
          </li>
          <li>
            <strong>数据库提供商</strong>（Neon）— 用于安全存储您的数据
          </li>
          <li>
            <strong>法律要求</strong> —
            若法律要求，或为保护用户或公众的权利与安全时
          </li>
        </ul>
      </section>

      <section>
        <h2>7. 数据存储与安全</h2>
        <p>
          您的数据存储在 Neon PostgreSQL 数据库中，托管于 Vercel
          提供的基础设施上。我们实施以下安全措施：
        </p>
        <ul>
          <li>密码在存储前使用 bcrypt 进行哈希处理</li>
          <li>所有数据传输均使用 HTTPS/TLS 加密</li>
          <li>数据库连接使用加密通道</li>
          <li>所有状态变更 API 请求均受 CSRF 保护</li>
          <li>IP 地址在存储前哈希处理（从不保留原始 IP）</li>
          <li>管理员访问受到限制，并单独进行身份验证</li>
        </ul>
        <p>
          <strong>数据保留：</strong>
        </p>
        <ul>
          <li>账户数据在账户有效期间保留</li>
          <li>匿名分析数据保留 12 个月</li>
          <li>
            您申请删除账户后，将有 30
            天冷静期。冷静期结束后，您的所有数据将从我们的系统中永久且不可恢复地删除。
          </li>
        </ul>
      </section>

      <section>
        <h2>8. 您的权利</h2>
        <p>
          您对个人数据享有以下权利。大多数权利可直接在{" "}
          <a href="#privacy-center">隐私中心</a>（设置 → 隐私）中行使：
        </p>
        <ul>
          <li>
            <strong>访问权</strong> —
            查看我们持有的您的所有数据摘要（可在隐私中心查看）
          </li>
          <li>
            <strong>数据可携权</strong> — 以结构化 JSON
            文件导出您的所有数据（可在隐私中心操作）
          </li>
          <li>
            <strong>更正权</strong> — 在设置中更新您的账户信息
          </li>
          <li>
            <strong>删除权</strong> — 删除账户及所有相关数据（须经历 30
            天冷静期）
          </li>
          <li>
            <strong>限制处理权</strong> — 在隐私中心停用个性化和对话存储功能
          </li>
          <li>
            <strong>反对权</strong> — 通过{" "}
            <a href="mailto:deepdivecareer@outlook.com">
              deepdivecareer@outlook.com
            </a>{" "}
            反对基于合法利益的数据处理
          </li>
          <li>
            <strong>撤回同意权</strong> — 随时在隐私中心撤回对可选功能的同意
          </li>
          <li>
            <strong>投诉权</strong> — 您可向荷兰数据保护局 Autoriteit
            Persoonsgegevens（
            <a
              href="https://autoriteitpersoonsgegevens.nl"
              target="_blank"
              rel="noopener noreferrer"
            >
              autoriteitpersoonsgegevens.nl
            </a>
            ）或您所在国家/地区的监管机构提出投诉
          </li>
        </ul>
      </section>

      <section>
        <h2>9. 儿童隐私</h2>
        <p>
          Deep Dive 不面向 18
          岁以下的未成年人。我们不会故意收集未成年人的个人数据。如果您认为我们无意中收集了儿童数据，请通过{" "}
          <a href="mailto:deepdivecareer@outlook.com">
            deepdivecareer@outlook.com
          </a>{" "}
          联系我们。
        </p>
      </section>

      <section>
        <h2>10. 国际数据传输</h2>
        <p>
          您的数据可能在欧洲经济区（EEA）以外的国家/地区处理，包括我们的 AI
          提供商和托管基础设施所在的美国。在此类传输发生时，我们依赖欧盟委员会批准的标准合同条款（SCCs）以确保充分的数据保护水平。
        </p>
      </section>

      <section>
        <h2>11. 政策变更</h2>
        <p>
          我们可能会不时更新本隐私政策。对于重大变更，我们将通过电子邮件（如果您有账户）或在平台上显示醒目通知的方式提前告知您。页面顶部的日期反映最近一次更新的日期。我们建议您定期查阅本政策。
        </p>
      </section>

      <section>
        <h2>12. 联系我们</h2>
        <p>
          如有隐私相关问题、请求或顾虑，请通过以下邮箱联系我们：{" "}
          <a href="mailto:deepdivecareer@outlook.com">
            deepdivecareer@outlook.com
          </a>
        </p>
      </section>
    </>
  );
}

export function PrivacyPolicyContent({ locale }: PrivacyPolicyContentProps) {
  const isZh = locale === "zh";
  const legalT = getDictionaryClient(locale as Locale).legal;

  return (
    <LegalPageLayout
      locale={locale}
      title={legalT.privacyTitle}
      lastUpdated={legalT.lastUpdated}
      backLabel={legalT.backToHome}
    >
      {isZh ? <ZhContent /> : <EnContent />}
    </LegalPageLayout>
  );
}
