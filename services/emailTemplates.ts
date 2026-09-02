export interface EmailTemplateData {
  title: string;
  preheader?: string;
  message: string;
  bannerUrl?: string;
  buttonText?: string;
  buttonUrl?: string;
  themeColor?: string;
}

export function generateHtmlEmailTemplate(data: EmailTemplateData): string {
  const {
    title,
    preheader = 'Latest announcement from Bishal Codes Studio',
    message,
    bannerUrl,
    buttonText = 'Explore Bishal Codes Now',
    buttonUrl = 'https://bishalcodes.com/',
    themeColor = '#e52521'
  } = data;

  // Format paragraphs in message body
  const formattedParagraphs = message
    .split('\n')
    .filter(p => p.trim().length > 0)
    .map(p => `<p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #334155;">${p.trim()}</p>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">

  <!-- Preview Text (Hidden Preheader) -->
  <div style="display: none; max-height: 0px; overflow: hidden;">
    ${preheader}
  </div>

  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 30px 10px;">
    <tr>
      <td align="center">
        
        <!-- Main Email Container -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
          
          <!-- Top Header Bar -->
          <tr>
            <td style="background-color: #0f172a; padding: 24px 32px; text-align: center; border-bottom: 3px solid ${themeColor};">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="https://bishalcodes.com/" target="_blank" style="text-decoration: none; display: inline-flex; align-items: center;">
                      <span style="font-size: 24px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px; font-family: sans-serif;">
                        Bishal<span style="color: ${themeColor};">Codes</span>
                      </span>
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${bannerUrl ? `
          <!-- Optional Banner Image -->
          <tr>
            <td style="padding: 0; background-color: #0f172a; text-align: center;">
              <img src="${bannerUrl}" alt="Banner" style="width: 100%; max-height: 300px; object-fit: cover; display: block; border: 0;" />
            </td>
          </tr>
          ` : ''}

          <!-- Email Content Body -->
          <tr>
            <td style="padding: 36px 32px 28px 32px; background-color: #ffffff;">
              <h1 style="margin: 0 0 20px 0; font-size: 22px; font-weight: 800; color: #0f172a; line-height: 1.3; letter-spacing: -0.3px;">
                ${title}
              </h1>

              <div style="font-size: 15px; color: #334155; line-height: 1.6;">
                ${formattedParagraphs}
              </div>

              ${buttonText && buttonUrl ? `
              <!-- Call To Action Button -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 28px; margin-bottom: 12px;">
                <tr>
                  <td align="center">
                    <a href="${buttonUrl}" target="_blank" style="display: inline-block; background-color: ${themeColor}; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 14px rgba(229, 37, 33, 0.3); text-transform: uppercase; letter-spacing: 0.5px;">
                      ${buttonText} &#8594;
                    </a>
                  </td>
                </tr>
              </table>
              ` : ''}

            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 32px;">
              <div style="border-top: 1px solid #e2e8f0;"></div>
            </td>
          </tr>

          <!-- Footer Section -->
          <tr>
            <td style="padding: 24px 32px 32px 32px; background-color: #ffffff; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">
                Bishal Codes Studio &bull; Full-Stack Software Engineering
              </p>
              <p style="margin: 0 0 16px 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
                Kathmandu, Nepal &bull; Built with Next.js, React & Cloud Serverless
              </p>
              
              <table role="presentation" align="center" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding: 0 8px;">
                    <a href="https://bishalcodes.com/projects" target="_blank" style="color: #64748b; text-decoration: none; font-size: 12px; font-weight: 600;">Projects</a>
                  </td>
                  <td style="color: #cbd5e1; font-size: 12px;">&bull;</td>
                  <td style="padding: 0 8px;">
                    <a href="https://bishalcodes.com/developers" target="_blank" style="color: #64748b; text-decoration: none; font-size: 12px; font-weight: 600;">APIs & Tools</a>
                  </td>
                  <td style="color: #cbd5e1; font-size: 12px;">&bull;</td>
                  <td style="padding: 0 8px;">
                    <a href="https://bishalcodes.com/contact" target="_blank" style="color: #64748b; text-decoration: none; font-size: 12px; font-weight: 600;">Contact</a>
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0 0 0; font-size: 11px; color: #cbd5e1;">
                You are receiving this official broadcast because you are a registered user or newsletter subscriber at bishalcodes.com.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
}
