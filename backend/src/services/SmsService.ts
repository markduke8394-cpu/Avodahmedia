import twilio from 'twilio';
import pool, { query } from '../config/database.js';

class SmsService {
  private twilioClient: any;
  private twilioPhoneNumber: string;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || '+1234567890';

    if (!accountSid || !authToken) {
      console.warn('⚠️ Twilio credentials not configured. SMS functionality disabled.');
    } else {
      this.twilioClient = twilio(accountSid, authToken);
    }
  }

  async sendSms(phoneNumber: string, message: string, leadId?: number): Promise<any> {
    if (!this.twilioClient) {
      console.error('Twilio client not initialized');
      throw new Error('SMS service not configured');
    }

    try {
      const result = await this.twilioClient.messages.create({
        body: message,
        from: this.twilioPhoneNumber,
        to: phoneNumber,
      });

      // Log SMS to database
      if (leadId) {
        await query(
          `INSERT INTO sms_log (lead_id, recipient_phone, message_body, message_sid, status, direction)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [leadId, phoneNumber, message, result.sid, 'sent', 'outbound']
        );
      }

      console.log(`✅ SMS sent to ${phoneNumber} (SID: ${result.sid})`);
      return result;
    } catch (error) {
      console.error('Error sending SMS:', error);
      if (leadId) {
        await query(
          `INSERT INTO sms_log (lead_id, recipient_phone, message_body, status, direction, error_message)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [leadId, phoneNumber, message, 'failed', 'outbound', (error as any).message]
        );
      }
      throw error;
    }
  }

  async sendLeadNotificationToOwner(leadId: number, leadName: string, platform: string, message?: string): Promise<void> {
    const ownerPhone = process.env.OWNER_PHONE_NUMBER;
    if (!ownerPhone) {
      console.warn('⚠️ OWNER_PHONE_NUMBER not configured');
      return;
    }

    const smsMessage = `🔔 New ${platform} lead: ${leadName}${message ? `\n${message.substring(0, 100)}...` : ''}`;

    try {
      await this.sendSms(ownerPhone, smsMessage, leadId);
    } catch (error) {
      console.error('Failed to send notification to owner:', error);
    }
  }

  async getSmsLog(leadId: number): Promise<any[]> {
    const result = await query(
      `SELECT * FROM sms_log WHERE lead_id = $1 ORDER BY created_at DESC`,
      [leadId]
    );
    return result.rows;
  }

  async updateSmsStatus(messageSid: string, status: string, deliveredAt?: Date): Promise<void> {
    await query(
      `UPDATE sms_log SET status = $1, delivered_at = $2, updated_at = CURRENT_TIMESTAMP
       WHERE message_sid = $3`,
      [status, deliveredAt || null, messageSid]
    );
  }
}

export default new SmsService();
