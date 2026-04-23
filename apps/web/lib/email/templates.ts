interface EmailTemplateOptions {
  preheader?: string;
  title?: string;
  body: string;
  ctaText?: string;
  ctaUrl?: string;
  footer?: string;
}

export function buildEmailHtml(options: EmailTemplateOptions): string {
  const preheaderBlock = options.preheader
    ? `<span style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(options.preheader)}</span>`
    : '';

  const titleBlock = options.title
    ? `<tr><td style="padding:0 0 16px 0;"><h1 style="margin:0;font-size:24px;font-weight:700;color:#1a1a2e;line-height:1.3;">${escapeHtml(options.title)}</h1></td></tr>`
    : '';

  const ctaBlock = options.ctaText && options.ctaUrl
    ? `<tr><td style="padding:24px 0;" align="center"><table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td style="border-radius:8px;background-color:#3B82F6;"><a href="${escapeAttr(options.ctaUrl)}" target="_blank" style="display:inline-block;padding:14px 32px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">${escapeHtml(options.ctaText)}</a></td></tr></table></td></tr>`
    : '';

  const footerText = options.footer
    ? `<p style="margin:0 0 8px 0;">${escapeHtml(options.footer)}</p>`
    : '';

  return `<!DOCTYPE html>
<html lang="nl" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${escapeHtml(options.title || 'ZZP Platform')}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td { font-family: Arial, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">
  ${preheaderBlock}
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f4f4f7;">
    <tr>
      <td style="padding:24px 16px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin:0 auto;max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 24px 40px;border-bottom:1px solid #e5e7eb;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td>
                    <div style="display:inline-block;width:36px;height:36px;background-color:#1a1a2e;border-radius:8px;text-align:center;line-height:36px;color:#ffffff;font-weight:bold;font-size:14px;vertical-align:middle;">ZP</div>
                    <span style="margin-left:12px;font-size:18px;font-weight:700;color:#1a1a2e;vertical-align:middle;">ZZP Platform</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                ${titleBlock}
                <tr>
                  <td style="font-size:16px;line-height:1.6;color:#374151;">
                    ${options.body}
                  </td>
                </tr>
                ${ctaBlock}
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px 32px 40px;border-top:1px solid #e5e7eb;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="font-size:13px;line-height:1.5;color:#9ca3af;text-align:center;">
                    ${footerText}
                    <p style="margin:0;">Verzonden via ZZP Platform</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
