import { NextRequest, NextResponse } from 'next/server';
import { sendBookingConfirmationSMS, sendAppointmentReminder, SMSService } from '@/lib/sms-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, phoneNumber, testData } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    let result;

    switch (type) {
      case 'booking-confirmation':
        // Test booking confirmation SMS
        const bookingData = testData || {
          guestName: 'John Doe',
          guestEmail: 'john@example.com',
          guestPhone: phoneNumber,
          serviceName: 'Haircut & Style',
          servicePrice: '25.00',
          duration: 30,
          appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          appointmentTime: '2:00 PM',
          shopName: 'Test Barbershop',
          shopAddress: '123 Main St, Tampa, FL 33601',
          shopPhone: '(813) 555-0123',
          appointmentId: 'test-' + Math.random().toString(36).substr(2, 9)
        };

        result = await sendBookingConfirmationSMS(bookingData);
        break;

      case 'reminder':
        // Test appointment reminder SMS
        const reminderData = testData || {
          customerName: 'John Doe',
          serviceName: 'Haircut & Style',
          appointmentDate: 'tomorrow',
          appointmentTime: '2:00 PM',
          shopName: 'Test Barbershop',
          appointmentId: 'test-' + Math.random().toString(36).substr(2, 9)
        };

        result = await sendAppointmentReminder(phoneNumber, reminderData);
        break;

      case 'validation':
        // Test phone number validation
        const isValid = SMSService.isValidPhoneNumber(phoneNumber);
        result = {
          success: true,
          phoneNumber,
          isValid,
          message: isValid ? 'Phone number is valid' : 'Phone number is invalid'
        };
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid test type. Use: booking-confirmation, reminder, or validation' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      type,
      phoneNumber,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('SMS test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'SMS test failed' 
      },
      { status: 500 }
    );
  }
}

// GET endpoint for SMS system status and testing guide
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'SMS Testing System',
    endpoints: {
      'POST with booking-confirmation': {
        description: 'Test booking confirmation SMS',
        body: {
          type: 'booking-confirmation',
          phoneNumber: '+1234567890',
          testData: '(optional) custom booking data'
        }
      },
      'POST with reminder': {
        description: 'Test appointment reminder SMS',
        body: {
          type: 'reminder',
          phoneNumber: '+1234567890',
          testData: '(optional) custom reminder data'
        }
      },
      'POST with validation': {
        description: 'Test phone number validation',
        body: {
          type: 'validation',
          phoneNumber: '+1234567890'
        }
      }
    },
    providers: ['twilio', 'aws-sns', 'messagebird'],
    status: 'Development mode - SMS messages are logged to console',
    timestamp: new Date().toISOString()
  });
}