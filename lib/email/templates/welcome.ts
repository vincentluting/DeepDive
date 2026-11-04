// ============================================================
// Welcome Email Template — sent after registration
// ============================================================

import { escapeHtml } from "../html-escape";

interface WelcomeEmailData {
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
    subject: "Welcome to Deep Dive",
    greeting: (name) => (name ? `Hi ${name},` : "Hi there,"),
    line1:
      "Welcome to Deep Dive — your AI-powered career self-discovery platform.",
    line2:
      "Start your journey by taking a quick 5-minute assessment to discover your career identity.",
    cta: "Start Exploring",
    footer:
      "If you didn't create this account, you can safely ignore this email.",
  },
  zh: {
    subject: "欢迎加入 Deep Dive",
    greeting: (name) => (name ? `${name}，你好！` : "你好！"),
    line1: "欢迎来到 Deep Dive —— 你的 AI 职业自我发现平台。",
    line2: "花 5 分钟完成一次快速测评，开启你的职业身份探索之旅。",
    cta: "开始探索",
    footer: "如果你没有创建此账号，可以忽略此邮件。",
  },
  nl: {
    subject: "Welkom bij Deep Dive",
    greeting: (name) => (name ? `Hallo ${name},` : "Hallo,"),
    line1:
      "Welkom bij Deep Dive — uw AI-aangedreven platform voor loopbaanontdekking.",
    line2:
      "Begin uw reis met een snelle 5-minuten assessment om uw loopbaanidentiteit te ontdekken.",
    cta: "Begin met Ontdekken",
    footer:
      "Als u dit account niet heeft aangemaakt, kunt u deze e-mail veilig negeren.",
  },
  de: {
    subject: "Willkommen bei Deep Dive",
    greeting: (name) => (name ? `Hallo ${name},` : "Hallo,"),
    line1:
      "Willkommen bei Deep Dive — Ihrer KI-gestützten Plattform zur Karriere-Selbstentdeckung.",
    line2:
      "Starten Sie Ihre Reise mit einem schnellen 5-Minuten-Assessment, um Ihre Karriereidentität zu entdecken.",
    cta: "Exploration starten",
    footer:
      "Wenn Sie dieses Konto nicht erstellt haben, können Sie diese E-Mail ignorieren.",
  },
  fr: {
    subject: "Bienvenue sur Deep Dive",
    greeting: (name) => (name ? `Bonjour ${name},` : "Bonjour,"),
    line1:
      "Bienvenue sur Deep Dive — votre plateforme de découverte de carrière propulsée par l'IA.",
    line2:
      "Commencez votre parcours avec une évaluation rapide de 5 minutes pour découvrir votre identité professionnelle.",
    cta: "Commencer l'exploration",
    footer:
      "Si vous n'avez pas créé ce compte, vous pouvez ignorer cet e-mail.",
  },
  es: {
    subject: "Bienvenido a Deep Dive",
    greeting: (name) => (name ? `Hola ${name},` : "Hola,"),
    line1:
      "Bienvenido a Deep Dive — su plataforma de autodescubrimiento profesional impulsada por IA.",
    line2:
      "Comience su viaje con una evaluación rápida de 5 minutos para descubrir su identidad profesional.",
    cta: "Comenzar a explorar",
    footer: "Si no creó esta cuenta, puede ignorar este correo.",
  },
  pt: {
    subject: "Bem-vindo(a) ao Deep Dive",
    greeting: (name) => (name ? `Olá ${name},` : "Olá,"),
    line1:
      "Bem-vindo(a) ao Deep Dive — sua plataforma de autodescoberta profissional com IA.",
    line2:
      "Comece sua jornada com uma avaliação rápida de 5 minutos para descobrir sua identidade profissional.",
    cta: "Começar a Explorar",
    footer:
      "Se você não criou esta conta, pode ignorar este e-mail com segurança.",
  },
  it: {
    subject: "Benvenuto/a in Deep Dive",
    greeting: (name) => (name ? `Ciao ${name},` : "Ciao,"),
    line1:
      "Benvenuto/a in Deep Dive — la Sua piattaforma di auto-scoperta professionale basata sull'IA.",
    line2:
      "Inizi il Suo percorso con un assessment rapido di 5 minuti per scoprire la Sua identità professionale.",
    cta: "Inizia a esplorare",
    footer: "Se non ha creato questo account, può ignorare questa email.",
  },
  ru: {
    subject: "Добро пожаловать в Deep Dive",
    greeting: (name) => (name ? `Здравствуйте, ${name}!` : "Здравствуйте!"),
    line1:
      "Добро пожаловать в Deep Dive — вашу ИИ-платформу для карьерного самопознания.",
    line2:
      "Начните свой путь с быстрой 5-минутной оценки, чтобы раскрыть свою карьерную идентичность.",
    cta: "Начать исследование",
    footer:
      "Если вы не создавали этот аккаунт, просто проигнорируйте это письмо.",
  },
  ja: {
    subject: "Deep Diveへようこそ",
    greeting: (name) => (name ? `${name}さん、こんにちは。` : "こんにちは。"),
    line1:
      "Deep Diveへようこそ — AIを活用したキャリア自己発見プラットフォームです。",
    line2:
      "5分間のクイックアセスメントでキャリアアイデンティティを発見し、旅を始めましょう。",
    cta: "探索を始める",
    footer:
      "このアカウントに心当たりがない場合は、このメールを無視してください。",
  },
  ko: {
    subject: "Deep Dive에 오신 것을 환영합니다",
    greeting: (name) => (name ? `안녕하세요 ${name}님,` : "안녕하세요,"),
    line1:
      "Deep Dive에 오신 것을 환영합니다 — AI 기반 커리어 자기발견 플랫폼입니다.",
    line2: "5분 퀵 평가로 커리어 정체성을 발견하며 여정을 시작하세요.",
    cta: "탐색 시작하기",
    footer: "이 계정을 만든 적이 없다면 이 이메일을 무시하셔도 됩니다.",
  },
};

export function buildWelcomeEmail({ name, locale, appUrl }: WelcomeEmailData) {
  const t = copy[locale] ?? copy.en;
  const safeName = escapeHtml(name);
  const dashboardUrl = `${appUrl}/${locale}/dashboard`;

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
        <a href="${dashboardUrl}" style="display:inline-block;padding:12px 28px;background:#111;color:#fff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:500;">${t.cta}</a>
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
