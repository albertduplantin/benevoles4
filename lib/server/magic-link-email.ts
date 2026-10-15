import { escapeHtml } from './email';

export const SUPPORT_PHONE = '06 87 56 34 40';

/**
 * Email de connexion : volontairement simple, très lisible et sans jargon.
 * Un seul gros bouton, des explications en une phrase, et le numéro à appeler en cas de souci.
 */
export function renderMagicLinkEmail({ url }: { url: string }) {
  const safeUrl = escapeHtml(url);

  const html = `<!doctype html>
<html lang="fr">
  <body style="margin:0;padding:0;background:#faf8f3;font-family:Arial,Helvetica,sans-serif;color:#121110;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#faf8f3;padding:24px 12px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;">
          <tr><td style="background:#121110;padding:24px 28px;">
            <div style="color:#ebbb4f;font-size:13px;letter-spacing:1px;text-transform:uppercase;">Espace des bénévoles</div>
            <div style="color:#ffffff;font-size:24px;font-weight:bold;margin-top:6px;">Festival Films Courts de Dinan</div>
          </td></tr>
          <tr><td style="padding:32px 28px;">
            <p style="font-size:20px;margin:0 0 16px 0;"><strong>Bonjour,</strong></p>
            <p style="font-size:18px;line-height:1.5;margin:0 0 28px 0;">
              Pour entrer dans votre espace bénévole, il suffit de cliquer sur le bouton ci-dessous.
              <strong>Il n'y a pas de mot de passe à retenir.</strong>
            </p>
            <p style="text-align:center;margin:0 0 28px 0;">
              <a href="${safeUrl}" style="display:inline-block;background:#ebbb4f;color:#121110;font-size:20px;font-weight:bold;text-decoration:none;padding:18px 32px;border-radius:12px;">
                Entrer dans mon espace
              </a>
            </p>
            <p style="font-size:16px;line-height:1.5;color:#555;margin:0 0 8px 0;">
              Ce bouton est valable 24 heures et ne sert qu'une fois.
            </p>
            <p style="font-size:16px;line-height:1.5;color:#555;margin:0 0 24px 0;">
              Si le bouton ne marche pas, copiez cette adresse dans votre navigateur :<br>
              <span style="word-break:break-all;font-size:14px;color:#8f6b17;">${safeUrl}</span>
            </p>
            <div style="background:#fdf7e8;border-radius:12px;padding:16px 18px;font-size:16px;line-height:1.5;">
              <strong>Un souci ?</strong> Appelez Jérôme au <strong>${SUPPORT_PHONE}</strong>, il vous aidera.
            </div>
            <p style="font-size:14px;color:#888;margin:24px 0 0 0;">
              Vous n'avez rien demandé ? Vous pouvez ignorer cet email, il ne se passera rien.
            </p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  const text = [
    'Bonjour,',
    '',
    'Pour entrer dans votre espace bénévole du Festival Films Courts de Dinan, ouvrez ce lien :',
    url,
    '',
    "Il n'y a pas de mot de passe à retenir. Ce lien est valable 24 heures et ne sert qu'une fois.",
    '',
    `Un souci ? Appelez Jérôme au ${SUPPORT_PHONE}.`,
    '',
    "Vous n'avez rien demandé ? Ignorez simplement cet email.",
  ].join('\n');

  return {
    subject: 'Votre lien pour entrer dans votre espace bénévole',
    html,
    text,
  };
}
