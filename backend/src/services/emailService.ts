import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter;

const initTransporter = async () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const cleanPass = process.env.SMTP_PASS.replace(/\s+/g, '');
    const isGmail = process.env.SMTP_HOST.includes('gmail');
    const port = isGmail ? 465 : (Number(process.env.SMTP_PORT) || 587);

    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST.trim(),
      port: port,
      secure: port === 465,
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
    console.log(`[Gmail Live SMTP Active] Configured sender: ${process.env.SMTP_USER} (Port ${port})`);
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

export const sendOtpEmail = async (toEmail: string, otpCode: string): Promise<boolean> => {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <h2 style="color: #4f46e5; text-align: center; margin-bottom: 24px;">Personalized Learning Intelligence System</h2>
      <p style="font-size: 16px; color: #334155;">Hello,</p>
      <p style="font-size: 16px; color: #334155;">Your 6-digit OTP verification code is:</p>
      <div style="background-color: #f1f5f9; padding: 18px; text-align: center; border-radius: 10px; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1e293b; margin: 24px 0;">
        ${otpCode}
      </div>
      <p style="font-size: 14px; color: #64748b;">This code is valid for 5 minutes. Please enter this 6-digit code on the registration page to complete your account setup.</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="font-size: 12px; color: #94a3b8; text-align: center;">If you did not request this code, please disregard this email.</p>
    </div>
  `;

  // 1. Try Brevo REST API if BREVO_API_KEY present (Delivers to ANY email address instantly)
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
          subject: `Your PLIS Verification OTP Code: ${otpCode}`,
          htmlContent: htmlContent
        })
      });
      const data: any = await res.json();
      if (res.ok) {
        console.log(`[Brevo API Dispatch Success] Delivered to: ${toEmail} | MessageId: ${data.messageId}`);
        return true;
      } else {
        console.warn('[Brevo API Error]:', data);
      }
    } catch (err: any) {
      console.warn('[Brevo API Exception]:', err.message);
    }
  }

  // 2. Try Resend REST API if RESEND_API_KEY present
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY.trim()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'PLIS Learning <onboarding@resend.dev>',
          to: [toEmail],
          subject: `Your PLIS Verification OTP Code: ${otpCode}`,
          html: htmlContent
        })
      });
      const data: any = await res.json();
      if (res.ok) {
        console.log(`[Resend API Dispatch Success] Delivered to: ${toEmail} | ID: ${data.id}`);
        return true;
      } else {
        console.warn('[Resend API Error]:', data);
      }
    } catch (err: any) {
      console.warn('[Resend API Exception]:', err.message);
    }
  }

  // 3. Fallback to Gmail SMTP
  try {
    await initTransporter();

    const senderEmail = process.env.SMTP_USER ? `"PLIS Learning System" <${process.env.SMTP_USER.trim()}>` : '"PLIS Learning System" <no-reply@plis-learning.com>';

    const mailOptions = {
      from: senderEmail,
      to: toEmail,
      subject: `Your PLIS Verification OTP Code: ${otpCode}`,
      html: htmlContent,
    };

    const sendPromise = transporter.sendMail(mailOptions);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Email dispatch timeout')), 10000)
    );

    const info: any = await Promise.race([sendPromise, timeoutPromise]);
    console.log(`[EMAIL DISPATCH] Sent to: ${toEmail} | OTP Code: ${otpCode} | MessageId: ${info.messageId}`);
    return true;
  } catch (error: any) {
    console.error(`[EMAIL DISPATCH WARNING] Could not send email to ${toEmail}:`, error.message || error);
    return false;
  }
};
