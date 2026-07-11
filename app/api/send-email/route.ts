import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { db } from '../../../services/firebase';
import { collection, getDocs } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

// Helper function to build human-designed responsive premium emails
const createEmailTemplate = (title: string, subtitle: string, badge: string, contentHtml: string, actionButtonHtml: string = '') => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
          background-color: #f1f5f9;
          color: #334155;
          margin: 0;
          padding: 0;
          -webkit-font-smoothing: antialiased;
        }
        .wrapper {
          width: 100%;
          table-layout: fixed;
          background-color: #f1f5f9;
          padding: 40px 0;
        }
        .container {
          max-width: 600px;
          background-color: #ffffff;
          border-radius: 16px;
          margin: 0 auto;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
          border: 1px solid #e2e8f0;
        }
        .header {
          background-color: #0f172a;
          padding: 32px;
          text-align: center;
          position: relative;
        }
        .logo {
          font-size: 20px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin: 0 0 8px 0;
        }
        .logo span {
          color: #6366f1;
        }
        .badge {
          display: inline-block;
          background-color: rgba(99, 102, 241, 0.15);
          color: #818cf8;
          font-size: 10px;
          font-weight: 700;
          padding: 4px 12px;
          border-radius: 9999px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .body {
          padding: 40px 32px;
        }
        .headline {
          font-size: 20px;
          font-weight: 700;
          color: #0f172a;
          margin-top: 0;
          margin-bottom: 12px;
          line-height: 1.3;
        }
        .sub-headline {
          font-size: 14px;
          color: #64748b;
          margin-bottom: 24px;
          margin-top: 0;
        }
        .content {
          font-size: 14px;
          line-height: 1.6;
          color: #475569;
          margin-bottom: 30px;
        }
        .field-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        .field-row {
          border-bottom: 1px solid #f1f5f9;
        }
        .field-label {
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          padding: 12px 0;
          width: 30%;
          vertical-align: top;
          letter-spacing: 0.05em;
        }
        .field-value {
          font-size: 13px;
          color: #1e293b;
          padding: 12px 0;
          vertical-align: top;
        }
        .field-box {
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
          font-size: 13px;
          color: #334155;
          line-height: 1.6;
          white-space: pre-wrap;
          margin-top: 8px;
        }
        .cta-btn {
          display: inline-block;
          background-color: #6366f1;
          color: #ffffff !important;
          font-weight: 600;
          font-size: 13px;
          text-decoration: none;
          padding: 12px 24px;
          border-radius: 8px;
          text-align: center;
          box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.2);
          transition: background-color 0.2s;
        }
        .footer {
          background-color: #f8fafc;
          padding: 32px;
          border-top: 1px solid #e2e8f0;
          text-align: center;
        }
        .socials {
          margin-bottom: 20px;
        }
        .social-link {
          display: inline-block;
          margin: 0 8px;
          color: #64748b;
          text-decoration: none;
          font-size: 12px;
          font-weight: 600;
        }
        .social-link:hover {
          color: #6366f1;
        }
        .contact-info {
          font-size: 11px;
          color: #94a3b8;
          line-height: 1.5;
        }
        .unsubscribe {
          margin-top: 16px;
          font-size: 10px;
          color: #cbd5e1;
        }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="header">
            <div class="logo">Bishal<span>Codes</span></div>
            <div class="badge">${badge}</div>
          </div>
          <div class="body">
            <h1 class="headline">${title}</h1>
            ${subtitle ? `<p class="sub-headline">${subtitle}</p>` : ''}
            <div class="content">
              ${contentHtml}
            </div>
            ${actionButtonHtml ? `<div style="text-align: center; margin-top: 30px;">${actionButtonHtml}</div>` : ''}
          </div>
          <div class="footer">
            <div class="socials">
              <a href="https://bishalcodes.com" class="social-link">Website</a>
              <a href="https://github.com/Bishalkumarmishra" class="social-link">GitHub</a>
              <a href="https://wa.me/9779828701575" class="social-link">WhatsApp</a>
              <a href="mailto:developer@bishalcodes.com" class="social-link">Contact Email</a>
            </div>
            <div class="contact-info">
              Bishal Codes &copy; ${new Date().getFullYear()} &bull; World-Class Web Engineering<br>
              Kathmandu, Nepal &bull; Phone: +977 9828701575
            </div>
            <div class="unsubscribe">
              You are receiving this because you contacted us or subscribed to updates.
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, data } = body;

    if (!type || !data) {
      return NextResponse.json({ success: false, error: 'Missing type or data' }, { status: 400 });
    }

    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '465', 10);
    const smtpSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpTo = process.env.SMTP_TO || 'bishalmishra9000@gmail.com';
    const googleScriptUrl = process.env.GOOGLE_SCRIPT_URL;

    let subject = '';
    let htmlContent = '';
    let textContent = '';
    let bccEmails: string[] = [];
    let singleTo = smtpTo;

    // Routing Logic for types
    if (type === 'contact') {
      const { name, email, mobile, requirements } = data;
      subject = `New Lead Inquiry: ${name}`;
      
      const whatsappLink = `https://wa.me/${mobile.replace(/[^0-9]/g, '')}`;
      const mailtoLink = email ? `mailto:${email}` : '';

      const tableContent = `
        <table class="field-table">
          <tr class="field-row">
            <td class="field-label">Full Name</td>
            <td class="field-value" style="font-weight: 600; color: #0f172a;">${name}</td>
          </tr>
          <tr class="field-row">
            <td class="field-label">Email</td>
            <td class="field-value">${email ? `<a href="${mailtoLink}" style="color: #6366f1; text-decoration: none;">${email}</a>` : 'Not provided'}</td>
          </tr>
          <tr class="field-row">
            <td class="field-label">Mobile</td>
            <td class="field-value">${mobile}</td>
          </tr>
        </table>
        <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.05em;">Project Requirements</div>
        <div class="field-box">${requirements}</div>
      `;

      htmlContent = createEmailTemplate(
        `New Inquiry from ${name}`,
        `A prospective client has submitted an inquiry request through your website.`,
        `Client Inquiry`,
        tableContent,
        `<a href="${whatsappLink}" target="_blank" class="cta-btn">Chat on WhatsApp</a>`
      );

      textContent = `Bishal Codes - New Lead Inquiry\n\nName: ${name}\nEmail: ${email || 'Not provided'}\nMobile: ${mobile}\nRequirements:\n${requirements}`;

    } else if (type === 'report') {
      const { name, email, problem } = data;
      subject = `New Bug Report: ${name}`;
      const mailtoLink = email ? `mailto:${email}` : '';

      const tableContent = `
        <table class="field-table">
          <tr class="field-row">
            <td class="field-label">Reporter</td>
            <td class="field-value" style="font-weight: 600; color: #0f172a;">${name}</td>
          </tr>
          <tr class="field-row">
            <td class="field-label">Email</td>
            <td class="field-value">${email ? `<a href="${mailtoLink}" style="color: #6366f1; text-decoration: none;">${email}</a>` : 'Not provided'}</td>
          </tr>
        </table>
        <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.05em;">Problem Details</div>
        <div class="field-box">${problem}</div>
      `;

      htmlContent = createEmailTemplate(
        `System Alert: New Bug Report`,
        `An issue has been reported by a user on your portfolio website.`,
        `Bug Report`,
        tableContent,
        email ? `<a href="${mailtoLink}" class="cta-btn">Reply to Reporter</a>` : ''
      );

      textContent = `Bishal Codes - System Bug Report\n\nName: ${name}\nEmail: ${email || 'Not provided'}\nProblem Description:\n${problem}`;

    } else if (type === 'welcome-app') {
      const { email } = data;
      subject = `Welcome to Nepali Calendar Desktop App!`;
      singleTo = email;

      const welcomeContent = `
        <p>Congratulations! You have successfully registered your account on the <strong>Nepali Calendar & Date Converter Desktop App</strong>.</p>
        <p>Your notes, reminders, and custom settings are now securely synchronized with your account in the cloud. You can access them from any desktop machine anytime.</p>
        <p><strong>App Features Enabled:</strong></p>
        <ul style="padding-left: 20px; margin: 16px 0;">
          <li style="margin-bottom: 8px;"><strong>Cloud Notes Sync:</strong> Create notes and scheduled events, and sync them automatically.</li>
          <li style="margin-bottom: 8px;"><strong>Tray Widget Mode:</strong> Toggle to a minimal floating calendar on your screen.</li>
          <li style="margin-bottom: 8px;"><strong>Instant Notifications:</strong> Native desktop announcements and holiday alerts.</li>
        </ul>
        <p style="margin-top: 24px;">Thank you for choosing Bishal Codes utilities! If you have any feedback or feature requests, feel free to contact us.</p>
      `;

      htmlContent = createEmailTemplate(
        `Welcome to Nepali Calendar!`,
        `Account registration successful for the desktop suite`,
        `Account Active`,
        welcomeContent,
        `<a href="https://bishalcodes.com" class="cta-btn">Visit Client Portal</a>`
      );

      textContent = `Welcome to Nepali Calendar Desktop App!\n\nAccount registration successful. Your notes are now synced to the cloud.\n\nVisit: https://bishalcodes.com`;

    } else if (type === 'newsletter-welcome') {
      const { email } = data;
      subject = `Welcome to Bishal Codes Newsletter!`;
      singleTo = email;

      const welcomeContent = `
        <p>Thanks for subscribing to the <strong>Bishal Codes Newsletter</strong>!</p>
        <p>You will now receive periodic updates about high-performance web engineering, modern server architectures, local and cloud AI integrations, and interactive 3D web design.</p>
        <p>Here is what you can look forward to:</p>
        <ul style="padding-left: 20px; margin: 16px 0;">
          <li style="margin-bottom: 8px;"><strong>Tech Deep Dives:</strong> Detailed walkthroughs of Next.js, React, and databases.</li>
          <li style="margin-bottom: 8px;"><strong>Digital Strategy:</strong> How to build high-converting landing pages and client portal tooling.</li>
          <li style="margin-bottom: 8px;"><strong>Product Releases:</strong> Announcements when new portfolio tools, templates, or articles are published.</li>
        </ul>
        <p style="margin-top: 24px;">If you ever have any design or web development project requirements, feel free to schedule a inquiry via the Client Portal or drop a message on WhatsApp.</p>
      `;

      htmlContent = createEmailTemplate(
        `Welcome to the Newsletter!`,
        `You've successfully subscribed to insights and updates from bishalcodes.com`,
        `Subscription Active`,
        welcomeContent,
        `<a href="https://bishalcodes.com/blog" class="cta-btn">Browse Our Articles</a>`
      );

      textContent = `Welcome to Bishal Codes Newsletter!\n\nThanks for subscribing to our newsletter! You will receive updates about high-performance web engineering, AI integrations, and interactive 3D design.\n\nBrowse articles: https://bishalcodes.com/blog`;

    } else if (type === 'blog-broadcast') {
      const { title, excerpt, link, imageUrl } = data;
      subject = `New Article Published: ${title}`;

      const broadcastContent = `
        <p>I just published a new article on <strong>Bishal Codes</strong> that I think you'll find interesting:</p>
        
        <div style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin: 24px 0; background-color: #ffffff;">
          ${imageUrl ? `<img src="${imageUrl}" alt="${title}" style="width: 100%; height: auto; display: block; max-height: 240px; object-fit: cover;">` : ''}
          <div style="padding: 20px;">
            <h3 style="margin-top: 0; margin-bottom: 8px; font-size: 16px; font-weight: 700; color: #0f172a;">${title}</h3>
            <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.5;">${excerpt}</p>
          </div>
        </div>
        
        <p>Click the button below to read the full article, see code snippets, and join the discussion.</p>
      `;

      htmlContent = createEmailTemplate(
        `New Article is Live!`,
        `Fresh insights are waiting for you at bishalcodes.com`,
        `New Publication`,
        broadcastContent,
        `<a href="${link}" class="cta-btn">Read Article</a>`
      );

      textContent = `New Article Published on Bishal Codes!\n\nTitle: ${title}\nExcerpt: ${excerpt}\nRead here: ${link}`;

      try {
        const subSnap = await getDocs(collection(db, 'newsletter'));
        bccEmails = subSnap.docs.map(doc => doc.data().email).filter(Boolean);
      } catch (dbErr) {
        console.error("Failed to fetch newsletter subscribers from DB:", dbErr);
      }

    } else if (type === 'project-broadcast') {
      const { title, excerpt, link, imageUrl } = data;
      subject = `New Project Showcase: ${title}`;

      const broadcastContent = `
        <p>I just added a new project to my digital portfolio showcase at <strong>Bishal Codes</strong>:</p>
        
        <div style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin: 24px 0; background-color: #ffffff;">
          ${imageUrl ? `<img src="${imageUrl}" alt="${title}" style="width: 100%; height: auto; display: block; max-height: 240px; object-fit: cover;">` : ''}
          <div style="padding: 20px;">
            <h3 style="margin-top: 0; margin-bottom: 8px; font-size: 16px; font-weight: 700; color: #0f172a;">${title}</h3>
            <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.5;">${excerpt}</p>
          </div>
        </div>
        
        <p>Check out the live deployment and read about the architecture by visiting the showcase link below.</p>
      `;

      htmlContent = createEmailTemplate(
        `New Project Showcase`,
        `Exploring new builds and tech stack systems at bishalcodes.com`,
        `New Portfolio Work`,
        broadcastContent,
        `<a href="${link}" class="cta-btn">View Project Details</a>`
      );

      textContent = `New Project Showcase on Bishal Codes!\n\nTitle: ${title}\nDescription: ${excerpt}\nView details: ${link}`;

      try {
        const subSnap = await getDocs(collection(db, 'newsletter'));
        bccEmails = subSnap.docs.map(doc => doc.data().email).filter(Boolean);
      } catch (dbErr) {
        console.error("Failed to fetch newsletter subscribers from DB:", dbErr);
      }

    } else if (type === 'calendar-note') {
      const { email, dateStr, noteText, noteColor } = data;
      subject = `Calendar Note Reminder: ${dateStr}`;
      singleTo = email;

      const colorLabel = noteColor.charAt(0).toUpperCase() + noteColor.slice(1);
      const noteContent = `
        <p>You have successfully added a personal note to your calendar on <strong>Bishal Codes</strong>.</p>
        
        <table class="field-table">
          <tr class="field-row">
            <td class="field-label">Calendar Date</td>
            <td class="field-value" style="font-weight: 600; color: #0f172a;">${dateStr}</td>
          </tr>
          <tr class="field-row">
            <td class="field-label">Tag Color</td>
            <td class="field-value"><span style="text-transform: capitalize; font-weight: 600;">${colorLabel}</span></td>
          </tr>
        </table>
        
        <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.05em;">Your Note</div>
        <div class="field-box" style="border-left: 4px solid ${
          noteColor === 'red' ? '#ef4444' : 
          noteColor === 'blue' ? '#3b82f6' : 
          noteColor === 'green' ? '#10b981' : 
          noteColor === 'yellow' ? '#f59e0b' : 
          noteColor === 'purple' ? '#8b5cf6' : '#94a3b8'
        };">${noteText}</div>
      `;

      htmlContent = createEmailTemplate(
        `Calendar Note Saved`,
        `Personal calendar reminder details`,
        `Personal Note`,
        noteContent,
        `<a href="https://bishalcodes.com/tools/date-converter" class="cta-btn">View Calendar</a>`
      );

      textContent = `Calendar Note Saved!\n\nDate: ${dateStr}\nColor: ${colorLabel}\nNote:\n${noteText}\n\nView Calendar: https://bishalcodes.com/tools/date-converter`;

    } else {
      return NextResponse.json({ success: false, error: 'Unknown notification type' }, { status: 400 });
    }

    // Attempt routing option 1: Google Apps Script Web App
    if (googleScriptUrl && googleScriptUrl.trim() !== '') {
      console.log('Sending email notification via Google Apps Script Web App...');
      try {
        const response = await fetch(googleScriptUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subject,
            body: htmlContent,
            textContent,
            to: singleTo,
            bcc: bccEmails
          })
        });

        const text = await response.text();
        let resData;
        try {
          resData = JSON.parse(text);
        } catch (e) {
          resData = { success: response.ok };
        }

        if (resData.success) {
          return NextResponse.json({ success: true, method: 'google_script' });
        } else {
          console.error('Google Apps Script responded with error:', resData.error || text);
        }
      } catch (err) {
        console.error('Failed to send email via Google Apps Script web app:', err);
      }
    }

    // Attempt routing option 2: SMTP server
    if (smtpUser && smtpPass) {
      console.log(`Sending email notification via SMTP from ${smtpUser}...`);
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      });

      const mailOptions: any = {
        from: `"${type.includes('broadcast') ? 'Bishal Codes Updates' : 'Bishal Codes'}" <${smtpUser}>`,
        subject,
        text: textContent,
        html: htmlContent
      };

      if (type === 'newsletter-welcome') {
        mailOptions.to = singleTo;
      } else if (type === 'blog-broadcast' || type === 'project-broadcast') {
        mailOptions.to = smtpTo;
        if (bccEmails.length > 0) {
          mailOptions.bcc = bccEmails;
        }
      } else {
        mailOptions.to = smtpTo;
      }

      await transporter.sendMail(mailOptions);

      return NextResponse.json({ success: true, method: 'smtp' });
    }

    return NextResponse.json({ 
      success: false, 
      error: 'SMTP configuration or Google Apps Script URL is missing.' 
    }, { status: 500 });

  } catch (error: any) {
    console.error('Error sending email notification:', error);
    return NextResponse.json({ success: false, error: error.message || String(error) }, { status: 500 });
  }
}
