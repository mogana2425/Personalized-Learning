import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter;

const initTransporter = async () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const cleanPass = process.env.SMTP_PASS.replace(/\s+/g, '');
    const port = Number(process.env.SMTP_PORT) || 465;
    const isSecure = port === 465;

    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST.trim(),
      port: port,
      secure: isSecure,
      auth: {
        user: process.env.SMTP_USER.trim(),
        pass: cleanPass,
      },
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
  try {
    await initTransporter();

    const senderEmail = process.env.SMTP_USER ? `"PLIS Learning System" <${process.env.SMTP_USER}>` : '"PLIS Learning System" <no-reply@plis-learning.com>';

    const mailOptions = {
      from: senderEmail,
      to: toEmail,
      subject: `Your PLIS Verification OTP Code: ${otpCode}`,
      html: `
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
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL DISPATCH] Sent to: ${toEmail} | OTP Code: ${otpCode} | MessageId: ${info.messageId}`);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[EMAIL INBOX PREVIEW LINK]: ${previewUrl}`);
    }
    return true;
  } catch (error: any) {
    console.error('FAILED TO SEND OTP EMAIL:', error);
    return false;
  }
};
