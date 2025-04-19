import nodemailer from 'nodemailer';
import config from '../config';

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    path: string;
  }>;
}

export async function sendEmail(options: EmailOptions) {
  let testAccount;
  if (!process.env.SMTP_HOST) {
    testAccount = await nodemailer.createTestAccount();
  }
  
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || testAccount?.smtp.host || 'smtp.ethereal.email',
    port: parseInt(process.env.SMTP_PORT || testAccount?.smtp.port.toString() || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || testAccount?.user || '',
      pass: process.env.SMTP_PASS || testAccount?.pass || ''
    }
  });
  
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"Sarofiem & Antoun" <noreply@sarofiem.com>',
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
    attachments: options.attachments
  });
  
  console.log(`Email sent: ${info.messageId}`);
  
  if (testAccount) {
    console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
  }
  
  return info;
}
