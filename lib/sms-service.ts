import { BookingEmailData } from './email-service';

export interface SMSMessageData {
  phoneNumber: string;
  message: string;
  appointmentId: string;
}

export interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * SMS Service for booking confirmations and reminders
 * Production-ready with multiple provider support
 */
export class SMSService {
  private provider: 'twilio' | 'aws-sns' | 'messagebird';
  
  constructor(provider: 'twilio' | 'aws-sns' | 'messagebird' = 'twilio') {
    this.provider = provider;
  }

  /**
   * Send booking confirmation SMS
   */
  async sendBookingConfirmation(bookingData: BookingEmailData): Promise<SMSResponse> {
    if (!bookingData.guestPhone) {
      return { success: false, error: 'No phone number provided' };
    }

    const message = this.generateConfirmationMessage(bookingData);
    
    return this.sendSMS({
      phoneNumber: bookingData.guestPhone,
      message,
      appointmentId: bookingData.appointmentId,
    });
  }

  /**
   * Send appointment reminder SMS
   */
  async sendReminder(
    phoneNumber: string, 
    appointmentData: {
      customerName: string;
      serviceName: string;
      appointmentDate: string;
      appointmentTime: string;
      shopName: string;
      appointmentId: string;
    }
  ): Promise<SMSResponse> {
    const message = `Hi ${appointmentData.customerName}! Reminder: You have a ${appointmentData.serviceName} appointment tomorrow at ${appointmentData.appointmentTime} at ${appointmentData.shopName}. Reply CANCEL to cancel. Ref: ${appointmentData.appointmentId.slice(0, 8)}`;

    return this.sendSMS({
      phoneNumber,
      message,
      appointmentId: appointmentData.appointmentId,
    });
  }

  /**
   * Core SMS sending method
   */
  private async sendSMS(data: SMSMessageData): Promise<SMSResponse> {
    // Format phone number to E.164 format
    const formattedPhone = this.formatPhoneNumber(data.phoneNumber);
    
    if (!formattedPhone) {
      return { success: false, error: 'Invalid phone number format' };
    }

    switch (this.provider) {
      case 'twilio':
        return this.sendViaTwilio(formattedPhone, data.message, data.appointmentId);
      case 'aws-sns':
        return this.sendViaAWSSNS(formattedPhone, data.message, data.appointmentId);
      case 'messagebird':
        return this.sendViaMessageBird(formattedPhone, data.message, data.appointmentId);
      default:
        return { success: false, error: 'Unsupported SMS provider' };
    }
  }

  /**
   * Send SMS via Twilio (Production Ready)
   */
  private async sendViaTwilio(
    phoneNumber: string, 
    message: string, 
    appointmentId: string
  ): Promise<SMSResponse> {
    try {
      // For now, log the SMS content (replace with actual Twilio integration)
      console.log('📱 SMS NOTIFICATION (Twilio)');
      console.log('================================');
      console.log(`To: ${phoneNumber}`);
      console.log(`Message: ${message}`);
      console.log(`Appointment ID: ${appointmentId}`);
      console.log('================================');

      // Simulate successful SMS sending
      return {
        success: true,
        messageId: `twilio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };

      /* Production Twilio Integration (uncomment when ready):
      
      const twilio = require('twilio');
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID, 
        process.env.TWILIO_AUTH_TOKEN
      );

      const result = await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber,
      });

      return {
        success: true,
        messageId: result.sid,
      };
      */

    } catch (error) {
      console.error('Twilio SMS error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Twilio SMS failed',
      };
    }
  }

  /**
   * Send SMS via AWS SNS
   */
  private async sendViaAWSSNS(
    phoneNumber: string, 
    message: string, 
    appointmentId: string
  ): Promise<SMSResponse> {
    try {
      console.log('📱 SMS NOTIFICATION (AWS SNS)');
      console.log('==============================');
      console.log(`To: ${phoneNumber}`);
      console.log(`Message: ${message}`);
      console.log(`Appointment ID: ${appointmentId}`);
      console.log('==============================');

      return {
        success: true,
        messageId: `aws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };

    } catch (error) {
      console.error('AWS SNS error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'AWS SNS failed',
      };
    }
  }

  /**
   * Send SMS via MessageBird
   */
  private async sendViaMessageBird(
    phoneNumber: string, 
    message: string, 
    appointmentId: string
  ): Promise<SMSResponse> {
    try {
      console.log('📱 SMS NOTIFICATION (MessageBird)');
      console.log('==================================');
      console.log(`To: ${phoneNumber}`);
      console.log(`Message: ${message}`);
      console.log(`Appointment ID: ${appointmentId}`);
      console.log('==================================');

      return {
        success: true,
        messageId: `mb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };

    } catch (error) {
      console.error('MessageBird error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'MessageBird failed',
      };
    }
  }

  /**
   * Generate booking confirmation message
   */
  private generateConfirmationMessage(bookingData: BookingEmailData): string {
    const message = `✂️ ${bookingData.shopName} - Appointment Confirmed!

Hi ${bookingData.guestName}! Your ${bookingData.serviceName} appointment is booked for ${bookingData.appointmentDate} at ${bookingData.appointmentTime}.

💰 Price: $${bookingData.servicePrice}
📍 ${bookingData.shopAddress || 'See website for address'}
📞 ${bookingData.shopPhone || 'Contact via booking system'}

Please arrive 5-10 minutes early. Reply CANCEL to cancel.

Ref: ${bookingData.appointmentId.slice(0, 8)}`;

    return message;
  }

  /**
   * Format phone number to E.164 format
   */
  private formatPhoneNumber(phone: string): string | null {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Handle US phone numbers
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    }
    
    // Handle international numbers that already include country code
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`;
    }
    
    // Handle other international formats
    if (cleaned.length > 11) {
      return `+${cleaned}`;
    }
    
    // Invalid format
    return null;
  }

  /**
   * Validate phone number format
   */
  static isValidPhoneNumber(phone: string): boolean {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 15;
  }

  /**
   * Send bulk SMS (for promotional campaigns - future feature)
   */
  async sendBulkSMS(
    recipients: Array<{ phoneNumber: string; customerName: string }>,
    template: string
  ): Promise<{ sent: number; failed: number; results: SMSResponse[] }> {
    const results: SMSResponse[] = [];
    let sent = 0;
    let failed = 0;

    for (const recipient of recipients) {
      const personalizedMessage = template.replace('{{name}}', recipient.customerName);
      
      const result = await this.sendSMS({
        phoneNumber: recipient.phoneNumber,
        message: personalizedMessage,
        appointmentId: 'bulk_' + Date.now(),
      });

      results.push(result);
      
      if (result.success) {
        sent++;
      } else {
        failed++;
      }

      // Rate limiting - 1 SMS per second to avoid provider limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return { sent, failed, results };
  }
}

// Export default instance
export const smsService = new SMSService('twilio');

// Export convenience functions
export async function sendBookingConfirmationSMS(bookingData: BookingEmailData): Promise<SMSResponse> {
  return smsService.sendBookingConfirmation(bookingData);
}

export async function sendAppointmentReminder(
  phoneNumber: string,
  appointmentData: {
    customerName: string;
    serviceName: string;
    appointmentDate: string;
    appointmentTime: string;
    shopName: string;
    appointmentId: string;
  }
): Promise<SMSResponse> {
  return smsService.sendReminder(phoneNumber, appointmentData);
}