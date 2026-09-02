import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { db } from '@/services/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, query, orderBy, limit } from 'firebase/firestore';
import { generateHtmlEmailTemplate, EmailTemplateData } from '@/services/emailTemplates';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const q = query(collection(db, 'email_broadcasts'), orderBy('timestamp', 'desc'), limit(50));
    const snapshot = await getDocs(q);
    const history = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    return NextResponse.json({
      success: true,
      broadcasts: history
    });
  } catch (err: any) {
    console.warn('Error fetching email broadcast history:', err);
    return NextResponse.json({ success: true, broadcasts: [] });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      subject,
      title,
      preheader,
      message,
      bannerUrl,
      buttonText,
      buttonUrl,
      themeColor,
      recipientType,
      specificEmails,
      apiKey
    } = body;

    if (apiKey !== 'BISHALCODES_API_KEY_LIVE_99812') {
      return NextResponse.json({ error: 'Unauthorized Admin API Key' }, { status: 401 });
    }

    if (!subject || !title || !message) {
      return NextResponse.json({ error: 'Subject, Title, and Message content are required' }, { status: 400 });
    }

    // 1. Gather Recipient Emails
    const emailSet = new Set<string>();

    if (recipientType === 'specific' && specificEmails) {
      const parsed = specificEmails
        .split(/[\n,;]+/)
        .map((e: string) => e.trim())
        .filter((e: string) => e.includes('@'));
      parsed.forEach((e: string) => emailSet.add(e.toLowerCase()));
    } else {
      // Gather from Firestore users and newsletter subscribers
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        usersSnap.forEach(d => {
          const u = d.data();
          if (u.email && u.email.includes('@')) {
            emailSet.add(u.email.toLowerCase());
          }
        });
      } catch (e) {
        console.warn('Notice querying users for email dispatch:', e);
      }

      try {
        const subSnap = await getDocs(collection(db, 'newsletter_subscribers'));
        subSnap.forEach(d => {
          const s = d.data();
          if (s.email && s.email.includes('@')) {
            emailSet.add(s.email.toLowerCase());
          }
        });
      } catch (e) {
        console.warn('Notice querying subscribers for email dispatch:', e);
      }

      // Add primary fallback contact email if set
      emailSet.add('bishalkumarmishra99@gmail.com');
    }

    const recipients = Array.from(emailSet);

    if (recipients.length === 0) {
      return NextResponse.json({ error: 'No valid recipient email addresses found' }, { status: 400 });
    }

    // 2. Generate HTML Email Body
    const templateData: EmailTemplateData = {
      title,
      preheader,
      message,
      bannerUrl,
      buttonText,
      buttonUrl,
      themeColor
    };

    const htmlContent = generateHtmlEmailTemplate(templateData);

    // 3. Configure Nodemailer Transporter
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER || process.env.EMAIL_SERVER_USER || '';
    const pass = process.env.SMTP_PASS || process.env.EMAIL_SERVER_PASSWORD || '';

    let successCount = 0;
    let failCount = 0;

    if (user && pass) {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass }
      });

      // Send to recipients
      for (const toEmail of recipients) {
        try {
          await transporter.sendMail({
            from: `"Bishal Codes Studio" <${user}>`,
            to: toEmail,
            subject,
            html: htmlContent
          });
          successCount++;
        } catch (mailErr) {
          console.warn(`Failed sending email to ${toEmail}:`, mailErr);
          failCount++;
        }
      }
    } else {
      // Mock / Development simulated dispatch
      console.log(`📧 [Bulk Mailer Dev Mode] Simulating HTML broadcast to ${recipients.length} recipients...`);
      successCount = recipients.length;
    }

    // 4. Save Campaign Record in Firestore
    const broadcastRecord = {
      id: 'email-' + Date.now(),
      subject,
      title,
      preheader: preheader || '',
      message,
      bannerUrl: bannerUrl || '',
      buttonText: buttonText || '',
      buttonUrl: buttonUrl || '',
      themeColor: themeColor || '#e52521',
      recipientType: recipientType || 'all',
      recipientCount: recipients.length,
      recipientsList: recipients,
      timestamp: Date.now(),
      status: 'sent',
      successCount,
      failCount
    };

    try {
      await setDoc(doc(db, 'email_broadcasts', broadcastRecord.id), broadcastRecord);
    } catch (dbErr) {
      console.warn('Firestore write email_broadcasts notice:', dbErr);
    }

    return NextResponse.json({
      success: true,
      message: `Bulk email broadcast completed! (${successCount} delivered to recipients).`,
      count: recipients.length,
      recipients,
      broadcast: broadcastRecord
    });
  } catch (error: any) {
    console.error('Error sending bulk email:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const apiKey = searchParams.get('apiKey');

    if (apiKey !== 'BISHALCODES_API_KEY_LIVE_99812') {
      return NextResponse.json({ error: 'Unauthorized API Key' }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ error: 'Broadcast ID is required' }, { status: 400 });
    }

    try {
      await deleteDoc(doc(db, 'email_broadcasts', id));
    } catch (e) {
      console.warn('Firestore delete email_broadcasts notice:', e);
    }

    return NextResponse.json({
      success: true,
      message: `Email campaign ${id} deleted from database.`
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
