import twilio from 'twilio';
import dotenv from 'dotenv';
import { sendEmail } from './email';

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

export const twilioClient = accountSid && authToken 
  ? twilio(accountSid, authToken) 
  : null;

export const sendSMS = async (to: string, body: string, leadId?: string) => {
  if (!twilioClient || !fromNumber) {
    console.warn('Twilio not configured, using email fallback');
    if (leadId) {
      await sendEmail({
        to,
        subject: 'Sarofiem & Antoun - Case Update',
        text: body,
        leadId
      });
    }
    return {
      success: false,
      fallback: 'email',
      error: 'Twilio not configured'
    };
  }
  
  try {
    const message = await twilioClient.messages.create({
      body,
      from: fromNumber,
      to
    });
    
    return {
      success: true,
      sid: message.sid
    };
  } catch (error) {
    console.error('Failed to send SMS:', error);
    
    if (leadId) {
      await sendEmail({
        to,
        subject: 'Sarofiem & Antoun - Case Update',
        text: body,
        leadId
      });
    }
    
    return {
      success: false,
      fallback: 'email',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const createTouchpointMessage = (type: string, leadName: string, caseDetails: string) => {
  const templates: Record<string, string> = {
    '24h': `Hello ${leadName}, this is Sarofiem & Antoun following up on your case (${caseDetails}). Please call us at your earliest convenience to discuss next steps.`,
    '72h': `Hello ${leadName}, we haven't heard back regarding your case (${caseDetails}). Please contact us as soon as possible to avoid delays in your case.`,
    'post-signature': `Thank you ${leadName} for signing your documents. Your case (${caseDetails}) is now being processed. We'll be in touch with updates.`,
    'reminder': `Reminder: ${leadName}, we're still waiting for your signed documents for case (${caseDetails}). Please complete this step to move forward with your case.`
  };
  
  return templates[type] || `Hello ${leadName}, this is Sarofiem & Antoun regarding your case (${caseDetails}). Please contact us for more information.`;
};
