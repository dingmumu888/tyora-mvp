type EmailLayoutProps = {
  preheader: string;
  children: string;
};

export function EmailLayout({ preheader, children }: EmailLayoutProps) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <title>TYORA</title>
    <style>
      @media (prefers-color-scheme: dark) {
        .tyora-body { background: #0f1115 !important; }
        .tyora-shell, .tyora-card { background: #171a21 !important; border-color: #2a2f3a !important; }
        .tyora-text { color: #f4f7fb !important; }
        .tyora-muted { color: #a6afbd !important; }
        .tyora-divider { border-color: #2a2f3a !important; }
        .tyora-code { color: #ffffff !important; }
      }
      @media screen and (max-width: 640px) {
        .tyora-container { width: 100% !important; }
        .tyora-shell { border-radius: 0 !important; border-left: 0 !important; border-right: 0 !important; }
        .tyora-content { padding: 32px 22px !important; }
        .tyora-code { font-size: 40px !important; letter-spacing: 8px !important; }
      }
    </style>
  </head>
  <body class="tyora-body" style="margin:0;padding:0;background:#f5f7fb;-webkit-text-size-adjust:100%;text-size-adjust:100%;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;visibility:hidden;mso-hide:all;">
      ${preheader}
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;background:#f5f7fb;">
      <tr>
        <td align="center" style="padding:36px 16px;">
          <table class="tyora-container" role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:600px;max-width:600px;border-collapse:separate;">
            <tr>
              <td class="tyora-shell" style="background:#ffffff;border:1px solid #e7ebf0;border-radius:28px;overflow:hidden;box-shadow:0 24px 70px rgba(15,23,42,0.08);">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
                  <tr>
                    <td class="tyora-content" style="padding:44px 46px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                      ${children}
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
