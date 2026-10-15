import { escapeHtml } from './email';
import { SUPPORT_PHONE } from './magic-link-email';

/** Email de notification simple : un titre, une phrase, un bouton, le numéro d'aide */
export function renderNotificationEmail(params: {
  title: string;
  intro: string;
  buttonLabel?: string;
  url?: string;
}) {
  const { title, intro, buttonLabel, url } = params;
  const button =
    buttonLabel && url
      ? `<p style="text-align:center;margin:28px 0;"><a href="${escapeHtml(url)}" style="display:inline-block;background:#ebbb4f;color:#121110;font-size:19px;font-weight:bold;text-decoration:none;padding:16px 28px;border-radius:12px;">${escapeHtml(buttonLabel)}</a></p>`
      : '';

  const html = `<!doctype html><html lang="fr"><body style="margin:0;padding:0;background:#faf8f3;font-family:Arial,Helvetica,sans-serif;color:#121110;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#faf8f3;padding:24px 12px;"><tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;">
<tr><td style="background:#121110;padding:20px 28px;"><div style="color:#ebbb4f;font-size:13px;letter-spacing:1px;text-transform:uppercase;">Festival Films Courts de Dinan</div></td></tr>
<tr><td style="padding:28px;">
<h1 style="font-size:24px;margin:0 0 14px 0;">${escapeHtml(title)}</h1>
<p style="font-size:18px;line-height:1.5;margin:0;">${intro}</p>
${button}
<div style="background:#fdf7e8;border-radius:12px;padding:14px 16px;font-size:16px;margin-top:8px;">Un souci ? Appelez Jérôme au <strong>${SUPPORT_PHONE}</strong>.</div>
</td></tr></table></td></tr></table></body></html>`;

  const text = [title, '', intro.replace(/<[^>]+>/g, ''), url ? `\n${buttonLabel} : ${url}` : '', `\nUn souci ? Appelez Jérôme au ${SUPPORT_PHONE}.`].join('\n');
  return { html, text };
}
