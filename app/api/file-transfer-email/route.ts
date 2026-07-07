import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { recipientEmails, fileName, fileSize, downloadPageUrl, expiresAt } = await request.json();

    if (!recipientEmails || !downloadPageUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '465', 10);
    const smtpSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;

    if (!smtpUser || !smtpPass) {
      return NextResponse.json({ error: 'SMTP not configured' }, { status: 500 });
    }

    const emails: string[] = Array.isArray(recipientEmails)
      ? recipientEmails
      : String(recipientEmails).split(',').map((e: string) => e.trim()).filter(Boolean);

    if (emails.length === 0) {
      return NextResponse.json({ error: 'No valid email addresses' }, { status: 400 });
    }

    const formatBytes = (bytes: number) => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    };

    const expiryDate = expiresAt
      ? new Date(expiresAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : '7 days from now';

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>File Transfer - BishalCodes</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f4f6f9; margin: 0; padding: 0; color: #333; }
    .wrapper { padding: 40px 20px; background: #f4f6f9; }
    .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e0e4ea; }
    .header { background: #0f172a; padding: 28px 32px; }
    .logo { color: #fff; font-size: 18px; font-weight: 700; letter-spacing: 0.5px; margin: 0; }
    .logo span { color: #6366f1; }
    .badge { display: inline-block; background: rgba(99,102,241,0.15); color: #818cf8; font-size: 10px; font-weight: 700; padding: 3px 10px; border-radius: 20px; text-transform: uppercase; margin-top: 8px; letter-spacing: 0.5px; }
    .body { padding: 36px 32px; }
    .title { font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 8px 0; }
    .subtitle { font-size: 14px; color: #64748b; margin: 0 0 28px 0; }
    .file-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px 20px; margin-bottom: 28px; }
    .file-name { font-size: 15px; font-weight: 600; color: #1e293b; margin: 0 0 6px 0; word-break: break-all; }
    .file-meta { font-size: 12px; color: #64748b; margin: 0; }
    .download-btn { display: block; background: #6366f1; color: #ffffff !important; text-decoration: none; text-align: center; font-size: 15px; font-weight: 600; padding: 14px 28px; border-radius: 8px; margin: 0 0 20px 0; }
    .expiry { font-size: 12px; color: #94a3b8; text-align: center; }
    .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 32px; text-align: center; font-size: 11px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <p class="logo">Bishal<span>Codes</span></p>
        <div class="badge">File Transfer</div>
      </div>
      <div class="body">
        <h1 class="title">Someone sent you a file</h1>
        <p class="subtitle">Click the button below to download your file securely.</p>
        <div class="file-card">
          <p class="file-name">📦 ${fileName || 'transfer.zip'}</p>
          <p class="file-meta">Size: ${fileSize ? formatBytes(fileSize) : 'Unknown'} &bull; Expires: ${expiryDate}</p>
        </div>
        <a href="${downloadPageUrl}" class="download-btn">⬇ Download File</a>
        <p class="expiry">This link expires on ${expiryDate}. Download before it disappears.</p>
      </div>
      <div class="footer">
        BishalCodes &copy; ${new Date().getFullYear()} &bull; bishalcodes.com
      </div>
    </div>
  </div>
</body>
</html>`;

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: { user: smtpUser, pass: smtpPass },
    });

    await transporter.sendMail({
      from: `"BishalCodes Transfer" <${smtpUser}>`,
      to: emails.join(', '),
      subject: `📦 You have a file waiting — ${fileName || 'transfer.zip'}`,
      html: htmlContent,
      text: `Someone shared a file with you.\n\nFile: ${fileName}\nSize: ${fileSize ? formatBytes(fileSize) : 'Unknown'}\n\nDownload here: ${downloadPageUrl}\n\nExpires: ${expiryDate}`,
    });

    return NextResponse.json({ success: true, sent: emails.length });
  } catch (err: any) {
    console.error('file-transfer-email error:', err);
    return NextResponse.json({ error: err.message || 'Failed to send email' }, { status: 500 });
  }
}
