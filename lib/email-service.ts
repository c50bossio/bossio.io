import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';

export interface BookingEmailData {
  // Guest information
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  
  // Appointment details
  serviceName: string;
  servicePrice: string;
  duration: number;
  appointmentDate: string;
  appointmentTime: string;
  
  // Shop information
  shopName: string;
  shopAddress?: string;
  shopPhone?: string;
  
  // Booking reference
  appointmentId: string;
}

export interface EmailTemplate {
  subject: string;
  htmlContent: string;
  textContent: string;
}

/**
 * Generate a professional booking confirmation email using AI
 */
export async function generateBookingConfirmationEmail(
  bookingData: BookingEmailData
): Promise<EmailTemplate> {
  try {
    // Use OpenAI to generate the email content
    const { text: emailContent } = await generateText({
      model: openai('gpt-4o-mini'), // Cost-effective model for email generation
      prompt: `Generate a professional booking confirmation email for a barbershop appointment.

BOOKING DETAILS:
- Customer: ${bookingData.guestName}
- Email: ${bookingData.guestEmail}
- Phone: ${bookingData.guestPhone || 'Not provided'}
- Service: ${bookingData.serviceName}
- Price: $${bookingData.servicePrice}
- Duration: ${bookingData.duration} minutes
- Date: ${bookingData.appointmentDate}
- Time: ${bookingData.appointmentTime}
- Shop: ${bookingData.shopName}
- Address: ${bookingData.shopAddress || 'See website for location'}
- Shop Phone: ${bookingData.shopPhone || 'Contact via booking system'}
- Booking Reference: ${bookingData.appointmentId}

REQUIREMENTS:
1. Professional, warm, and welcoming tone
2. Include all important details clearly
3. Add preparation instructions (arrive 5-10 minutes early)
4. Include cancellation/rescheduling information
5. Thank the customer for choosing the business
6. Include contact information for questions

FORMAT: Return JSON with "subject", "html", and "text" fields.
The HTML should be properly formatted with inline CSS for email clients.
The text should be clean plain text version.`,
      temperature: 0.3, // Low temperature for consistent, professional output
    });

    // Parse the AI-generated response
    let parsedContent;
    try {
      parsedContent = JSON.parse(emailContent);
    } catch (parseError) {
      // Fallback to basic template if AI response isn't valid JSON
      parsedContent = generateFallbackTemplate(bookingData);
    }

    return {
      subject: parsedContent.subject || `Appointment Confirmed - ${bookingData.shopName}`,
      htmlContent: parsedContent.html || generateFallbackHTML(bookingData),
      textContent: parsedContent.text || generateFallbackText(bookingData),
    };

  } catch (error) {
    console.error('Error generating email with AI:', error);
    // Return fallback template
    return generateFallbackTemplate(bookingData);
  }
}

/**
 * Send email using SendGrid service
 */
export async function sendBookingConfirmationEmail(
  emailTemplate: EmailTemplate,
  recipientEmail: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  
  try {
    // Check if we have SendGrid credentials
    if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
      console.log('📧 EMAIL NOTIFICATION (Development Mode)');
      console.log('============================');
      console.log(`To: ${recipientEmail}`);
      console.log(`Subject: ${emailTemplate.subject}`);
      console.log('\n--- HTML Content ---');
      console.log(emailTemplate.htmlContent);
      console.log('\n--- Text Content ---');
      console.log(emailTemplate.textContent);
      console.log('============================');
      console.log('⚠️ SendGrid credentials not found - simulating success');
      
      return {
        success: true,
        messageId: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };
    }

    // Production SendGrid Integration
    const sgMail = await import('@sendgrid/mail');
    sgMail.default.setApiKey(process.env.SENDGRID_API_KEY);

    const msg = {
      to: recipientEmail,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL,
        name: process.env.SENDGRID_FROM_NAME || 'BookedBarber',
      },
      subject: emailTemplate.subject,
      text: emailTemplate.textContent,
      html: emailTemplate.htmlContent,
    };

    console.log('📧 Sending email via SendGrid...');
    console.log(`To: ${recipientEmail}`);
    console.log(`From: ${process.env.SENDGRID_FROM_EMAIL}`);
    console.log(`Subject: ${emailTemplate.subject}`);

    const [response] = await sgMail.default.send(msg);

    console.log(`✅ Email sent successfully! Status: ${response.statusCode}`);

    return {
      success: true,
      messageId: response.headers['x-message-id'] || 'sendgrid_' + Date.now(),
    };

  } catch (error: any) {
    console.error('SendGrid email error:', error);
    
    // Handle SendGrid specific errors
    if (error.response) {
      console.error('SendGrid error response:', error.response.body);
      return {
        success: false,
        error: `SendGrid error: ${error.response.body?.errors?.[0]?.message || error.message}`,
      };
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Email service failed',
    };
  }
}

/**
 * Fallback email template if AI generation fails
 */
function generateFallbackTemplate(bookingData: BookingEmailData): EmailTemplate {
  return {
    subject: `Appointment Confirmed - ${bookingData.shopName}`,
    htmlContent: generateFallbackHTML(bookingData),
    textContent: generateFallbackText(bookingData),
  };
}

function generateFallbackHTML(bookingData: BookingEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Appointment Confirmation</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="margin: 0; font-size: 28px; font-weight: 300;">✂️ Appointment Confirmed</h1>
  </div>
  
  <div style="background: #fff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <p style="font-size: 18px; margin-bottom: 25px;">Hi ${bookingData.guestName},</p>
    
    <p style="margin-bottom: 25px;">Thank you for booking with <strong>${bookingData.shopName}</strong>! Your appointment has been confirmed.</p>
    
    <div style="background: #f8f9fa; border-radius: 8px; padding: 25px; margin: 25px 0;">
      <h2 style="color: #667eea; margin-top: 0; margin-bottom: 20px; font-size: 20px;">📅 Appointment Details</h2>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr style="border-bottom: 1px solid #e9ecef;">
          <td style="padding: 10px 0; font-weight: 600; color: #495057;">Service:</td>
          <td style="padding: 10px 0; color: #495057;">${bookingData.serviceName}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e9ecef;">
          <td style="padding: 10px 0; font-weight: 600; color: #495057;">Price:</td>
          <td style="padding: 10px 0; color: #495057;">$${bookingData.servicePrice}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e9ecef;">
          <td style="padding: 10px 0; font-weight: 600; color: #495057;">Duration:</td>
          <td style="padding: 10px 0; color: #495057;">${bookingData.duration} minutes</td>
        </tr>
        <tr style="border-bottom: 1px solid #e9ecef;">
          <td style="padding: 10px 0; font-weight: 600; color: #495057;">Date:</td>
          <td style="padding: 10px 0; color: #495057;">${bookingData.appointmentDate}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e9ecef;">
          <td style="padding: 10px 0; font-weight: 600; color: #495057;">Time:</td>
          <td style="padding: 10px 0; color: #495057;">${bookingData.appointmentTime}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; font-weight: 600; color: #495057;">Booking ID:</td>
          <td style="padding: 10px 0; color: #6c757d; font-family: monospace;">${bookingData.appointmentId}</td>
        </tr>
      </table>
    </div>
    
    <div style="background: #e3f2fd; border-radius: 8px; padding: 20px; margin: 25px 0;">
      <h3 style="color: #1976d2; margin-top: 0; margin-bottom: 15px;">📍 Location</h3>
      <p style="margin: 0; color: #424242;">
        <strong>${bookingData.shopName}</strong><br>
        ${bookingData.shopAddress || 'Address available on our website'}<br>
        ${bookingData.shopPhone ? `Phone: ${bookingData.shopPhone}` : ''}
      </p>
    </div>
    
    <div style="background: #fff3e0; border-radius: 8px; padding: 20px; margin: 25px 0;">
      <h3 style="color: #f57c00; margin-top: 0; margin-bottom: 15px;">⏰ Important Reminders</h3>
      <ul style="color: #424242; padding-left: 20px; margin: 0;">
        <li>Please arrive 5-10 minutes early</li>
        <li>Bring a valid ID if this is your first visit</li>
        <li>Contact us if you need to reschedule or cancel</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #e9ecef;">
      <p style="color: #6c757d; margin-bottom: 10px;">Need to make changes?</p>
      <p style="color: #6c757d; font-size: 14px;">
        Contact us or visit our website to reschedule or cancel your appointment.
      </p>
    </div>
    
    <div style="text-align: center; margin-top: 30px;">
      <p style="color: #667eea; font-weight: 600; margin-bottom: 5px;">Thank you for choosing ${bookingData.shopName}!</p>
      <p style="color: #6c757d; font-size: 14px; margin: 0;">We look forward to seeing you.</p>
    </div>
  </div>
  
  <div style="text-align: center; margin-top: 20px; color: #6c757d; font-size: 12px;">
    <p>This email was sent to ${bookingData.guestEmail}</p>
  </div>

</body>
</html>`;
}

function generateFallbackText(bookingData: BookingEmailData): string {
  return `
APPOINTMENT CONFIRMED ✂️

Hi ${bookingData.guestName},

Thank you for booking with ${bookingData.shopName}! Your appointment has been confirmed.

APPOINTMENT DETAILS:
━━━━━━━━━━━━━━━━━━━━
Service: ${bookingData.serviceName}
Price: $${bookingData.servicePrice}
Duration: ${bookingData.duration} minutes
Date: ${bookingData.appointmentDate}
Time: ${bookingData.appointmentTime}
Booking ID: ${bookingData.appointmentId}

LOCATION:
━━━━━━━━━━━━━━━━━━━━
${bookingData.shopName}
${bookingData.shopAddress || 'Address available on our website'}
${bookingData.shopPhone ? `Phone: ${bookingData.shopPhone}` : ''}

IMPORTANT REMINDERS:
━━━━━━━━━━━━━━━━━━━━
• Please arrive 5-10 minutes early
• Bring a valid ID if this is your first visit
• Contact us if you need to reschedule or cancel

Need to make changes? Contact us or visit our website to reschedule or cancel your appointment.

Thank you for choosing ${bookingData.shopName}!
We look forward to seeing you.

━━━━━━━━━━━━━━━━━━━━
This email was sent to ${bookingData.guestEmail}
`.trim();
}

/**
 * Complete booking confirmation workflow
 */
export async function sendBookingConfirmation(bookingData: BookingEmailData): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    // Generate the email template using AI
    const emailTemplate = await generateBookingConfirmationEmail(bookingData);
    
    // Send the email
    const result = await sendBookingConfirmationEmail(emailTemplate, bookingData.guestEmail);
    
    return result;
  } catch (error) {
    console.error('Error in booking confirmation workflow:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}