// ============================================================
// Password Reset Email Template
// ============================================================

import { escapeHtml } from "../html-escape";

interface PasswordResetEmailData {
  name: string | null;
  resetUrl: string;
  locale: string;
}

const copy: Record<
  string,
  {
    subject: string;
    greeting: (name: string | null) => string;
    line1: string;
    line2: string;
    cta: string;
    ignore: string;
  }
> = {
  en: {
    subject: "Reset your Deep Dive password",
    greeting: (name) => (name ? `Hi ${name},` : "Hi there,"),
    line1: "We received a request to reset your password.",
    line2:
      "Click the button below to set a new password. This link will expire in 1 hour.",
    cta: "Reset Password",
    ignore:
      "If you didn't request this, you can safely ignore this email. Your password won't change.",
  },
  zh: {
    subject: "重置你的 Deep Dive 密码",
    greeting: (name) => (name ? `${name}，你好！` : "你好！"),
    line1: "我们收到了重置你密码的请求。",
    line2: "点击下方按钮设置新密码。此链接将在 1 小时后失效。",
    cta: "重置密码",
    ignore: "如果这不是你的操作，可以忽略此邮件。你的密码不会被更改。",
  },
  nl: {
    subject: "Reset uw Deep Dive wachtwoord",
    greeting: (name) => (name ? `Hallo ${name},` : "Hallo,"),
    line1: "We hebben een verzoek ontvangen om uw wachtwoord te resetten.",
    line2:
      "Klik op de knop hieronder om een nieuw wachtwoord in te stellen. Deze link verloopt over 1 uur.",
    cta: "Wachtwoord Resetten",
    ignore:
      "Als u dit niet heeft aangevraagd, kunt u deze e-mail veilig negeren. Uw wachtwoord wordt niet gewijzigd.",
  },
  de: {
    subject: "Setzen Sie Ihr Deep Dive Passwort zurück",
    greeting: (name) => (name ? `Hallo ${name},` : "Hallo,"),
    line1: "Wir haben eine Anfrage zum Zurücksetzen Ihres Passworts erhalten.",
    line2:
      "Klicken Sie auf den Button unten, um ein neues Passwort festzulegen. Dieser Link läuft in 1 Stunde ab.",
    cta: "Passwort zurücksetzen",
    ignore:
      "Wenn Sie dies nicht angefordert haben, können Sie diese E-Mail ignorieren. Ihr Passwort wird nicht geändert.",
  },
  fr: {
    subject: "Réinitialisez votre mot de passe Deep Dive",
    greeting: (name) => (name ? `Bonjour ${name},` : "Bonjour,"),
    line1:
      "Nous avons reçu une demande de réinitialisation de votre mot de passe.",
    line2:
      "Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe. Ce lien expirera dans 1 heure.",
    cta: "Réinitialiser le mot de passe",
    ignore:
      "Si vous n'avez pas fait cette demande, vous pouvez ignorer cet e-mail. Votre mot de passe ne sera pas modifié.",
  },
  es: {
    subject: "Restablezca su contraseña de Deep Dive",
    greeting: (name) => (name ? `Hola ${name},` : "Hola,"),
    line1: "Recibimos una solicitud para restablecer su contraseña.",
    line2:
      "Haga clic en el botón a continuación para establecer una nueva contraseña. Este enlace expirará en 1 hora.",
    cta: "Restablecer contraseña",
    ignore:
      "Si no solicitó esto, puede ignorar este correo. Su contraseña no será modificada.",
  },
  pt: {
    subject: "Redefina sua senha do Deep Dive",
    greeting: (name) => (name ? `Olá ${name},` : "Olá,"),
    line1: "Recebemos uma solicitação para redefinir sua senha.",
    line2:
      "Clique no botão abaixo para definir uma nova senha. Este link expirará em 1 hora.",
    cta: "Redefinir Senha",
    ignore:
      "Se você não solicitou isso, pode ignorar este e-mail com segurança. Sua senha não será alterada.",
  },
  it: {
    subject: "Reimposta la Sua password di Deep Dive",
    greeting: (name) => (name ? `Ciao ${name},` : "Ciao,"),
    line1:
      "Abbiamo ricevuto una richiesta di reimpostazione della Sua password.",
    line2:
      "Clicchi sul pulsante qui sotto per impostare una nuova password. Questo link scadrà tra 1 ora.",
    cta: "Reimposta Password",
    ignore:
      "Se non ha effettuato questa richiesta, può ignorare questa email. La Sua password non verrà modificata.",
  },
  ru: {
    subject: "Сбросьте пароль Deep Dive",
    greeting: (name) => (name ? `Здравствуйте, ${name}!` : "Здравствуйте!"),
    line1: "Мы получили запрос на сброс вашего пароля.",
    line2:
      "Нажмите на кнопку ниже, чтобы установить новый пароль. Ссылка действительна 1 час.",
    cta: "Сбросить пароль",
    ignore:
      "Если вы не запрашивали сброс, просто проигнорируйте это письмо. Ваш пароль не будет изменён.",
  },
  ja: {
    subject: "Deep Diveのパスワードをリセット",
    greeting: (name) => (name ? `${name}さん、こんにちは。` : "こんにちは。"),
    line1: "パスワードのリセットリクエストを受け付けました。",
    line2:
      "下のボタンをクリックして新しいパスワードを設定してください。このリンクは1時間で有効期限が切れます。",
    cta: "パスワードをリセット",
    ignore:
      "このリクエストに心当たりがない場合は、このメールを無視してください。パスワードは変更されません。",
  },
  ko: {
    subject: "Deep Dive 비밀번호 재설정",
    greeting: (name) => (name ? `안녕하세요 ${name}님,` : "안녕하세요,"),
    line1: "비밀번호 재설정 요청을 받았습니다.",
    line2:
      "아래 버튼을 클릭하여 새 비밀번호를 설정하세요. 이 링크는 1시간 후에 만료됩니다.",
    cta: "비밀번호 재설정",
    ignore:
      "본인이 요청하지 않았다면 이 이메일을 무시하셔도 됩니다. 비밀번호는 변경되지 않습니다.",
  },
};

export function buildPasswordResetEmail({
  name,
  resetUrl,
  locale,
}: PasswordResetEmailData) {
  const t = copy[locale] ?? copy.en;
  const safeName = escapeHtml(name);

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
        <a href="${resetUrl}" style="display:inline-block;padding:12px 28px;background:#111;color:#fff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:500;">${t.cta}</a>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 32px;border-top:1px solid #eee;">
        <p style="margin:0;font-size:13px;color:#999;line-height:1.5;">${t.ignore}</p>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

  return { subject: t.subject, html };
}
