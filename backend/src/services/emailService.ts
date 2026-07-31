import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter;

const initTransporter = async () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const cleanPass = process.env.SMTP_PASS.replace(/\s+/g, '');
    const isGmail = process.env.SMTP_HOST.includes('gmail');

    if (isGmail) {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SMTP_USER.trim(),
          pass: cleanPass,
        },
      });
      console.log(`[Gmail Native Service Active] Sender: ${process.env.SMTP_USER}`);
    } else {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST.trim(),
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.SMTP_USER.trim(),
          pass: cleanPass,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000,
        tls: {
          rejectUnauthorized: false
        }
      });
      console.log(`[SMTP Active] Configured sender: ${process.env.SMTP_USER}`);
    }
  } else {
    // Generate test Ethereal SMTP account if no custom SMTP host provided
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log(`[Ethereal Test SMTP Ready] Created test user: ${testAccount.user}`);
  }
};

initTransporter().catch(err => console.log('Transporter init error:', err.message));

export const sendNotificationEmail = async (toEmail: string, subject: string, htmlContent: string): Promise<boolean> => {
  if (process.env.BREVO_API_KEY) {
    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': process.env.BREVO_API_KEY.trim(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: 'PLIS Learning System', email: process.env.SMTP_USER || 'no-reply@plis-learning.com' },
          to: [{ email: toEmail }],
          subject,
          htmlContent
        })
      });
      if (res.ok) {
        return true;
      }
    } catch (err: any) {
      console.warn('[Brevo API Exception]:', err.message);
    }
  }

  try {
    await initTransporter();
    const senderEmail = process.env.SMTP_USER ? `"PLIS Learning System" <${process.env.SMTP_USER.trim()}>` : '"PLIS Learning System" <no-reply@plis-learning.com>';
    await transporter.sendMail({
      from: senderEmail,
      to: toEmail,
      subject,
      html: htmlContent,
    });
    return true;
  } catch (error: any) {
    console.error(`[EMAIL DISPATCH WARNING] Could not send email to ${toEmail}:`, error.message || error);
    return false;
  }
};
