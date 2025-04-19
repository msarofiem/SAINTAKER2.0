import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
  leadId?: string;
}

const transporter = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  if (!transporter) {
    console.warn('Email not configured, skipping email send');
    return false;
  }

  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@sarofiem.com',
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    
    if (options.leadId) {
      try {
        const { prisma } = require('../app');
        await prisma.clientTouchpoint.create({
          data: {
            leadId: options.leadId,
            type: 'Email',
            status: 'Sent',
            messageContent: options.text,
            scheduledFor: new Date(),
            sentAt: new Date(),
            deliveryMethod: 'Email'
          }
        });
      } catch (dbError) {
        console.error('Failed to log email in database:', dbError);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};
