// ============================================================
// Post-1Week Reminder Email — sent to thesis participants
// 7+ days after completing post-immediate assessment.
// ============================================================

import { escapeHtml } from "../html-escape";

interface Post1WeekReminderData {
  name: string | null;
  locale: string;
  appUrl: string;
}

const copy: Record<
  string,
  {
    subject: string;
    greeting: (name: string | null) => string;
    line1: string;
    line2: string;
    cta: string;
    footer: string;
  }
> = {
  en: {
    subject: "Deep Dive — Your follow-up reflection is ready",
    greeting: (name) => (name ? `Hi ${name},` : "Hi there,"),
    line1:
      "A week ago you completed your career exploration journey with Deep Dive. We'd love to hear how your perspective has evolved since then.",
    line2:
      "This 5-minute follow-up helps us understand the lasting impact of AI-powered career exploration. Your input is invaluable to our research.",
    cta: "Complete Follow-Up",
    footer:
      "You're receiving this because you're a research participant in the Deep Dive thesis study. Thank you for your contribution!",
  },
  zh: {
    subject: "Deep Dive — 你的跟踪反馈已就绪",
    greeting: (name) => (name ? `${name}，你好！` : "你好！"),
    line1:
      "一周前你完成了 Deep Dive 的职业探索旅程。我们很想了解这段时间以来你的想法有了怎样的变化。",
    line2:
      "这份 5 分钟的跟踪问卷帮助我们理解 AI 职业探索工具的持久影响。你的参与对我们的研究非常珍贵。",
    cta: "完成跟踪反馈",
    footer: "你收到此邮件是因为你是 Deep Dive 论文研究的参与者。感谢你的贡献！",
  },
};

export function buildPost1WeekReminderEmail({
  name,
  locale,
  appUrl,
}: Post1WeekReminderData) {
  const t = copy[locale] ?? copy.en;
  const safeName = escapeHtml(name);
  const surveyUrl = `${appUrl}/${locale}/post-assessment?type=post_1week`;

  const html = `
<!DOCTYPE html>
<html lang="${locale}">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f7f7f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;">
    <tr>
      <td style="padding:40px 32px 0;">
        <h1 style="margin:0 0 8px;font-size:24px;font-weight:600;color:#111;">Deep Dive</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 32px;">
        <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#333;">${t.greeting(safeName)}</p>
        <p style="margin:0 0 12px;font-size:16px;line-height:1.6;color:#333;">${t.line1}</p>
        <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#333;">${t.line2}</p>
        <a href="${surveyUrl}" style="display:inline-block;padding:12px 28px;background:#d97706;color:#fff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:500;">${t.cta}</a>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 32px;border-top:1px solid #eee;">
        <p style="margin:0;font-size:13px;color:#999;line-height:1.5;">${t.footer}</p>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

  return { subject: t.subject, html };
}
