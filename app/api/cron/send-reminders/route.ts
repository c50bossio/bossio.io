import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { appointment } from '@/lib/shop-schema';
import { and, gte, lte, isNull, eq } from 'drizzle-orm';
import { sendAppointmentReminder } from '@/lib/sms-service';
import { sendBookingConfirmation, BookingEmailData } from '@/lib/email-service';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds timeout for cron job

export async function GET(request: NextRequest) {
  try {
    // Verify this is a Vercel Cron request
    const authHeader = request.headers.get('authorization');
    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const results = {
      processed: 0,
      sent24Hour: 0,
      sent2Hour: 0,
      errors: []
    };

    // Find appointments needing 24-hour reminders
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    try {
      // In production, query real database
      // For now, using mock data for demonstration
      const mockAppointments = [
        {
          id: 'apt-1',
          startTime: new Date(tomorrow.getTime() + 10 * 60 * 60 * 1000), // Tomorrow at 10am
          guestName: 'John Doe',
          guestEmail: 'john@example.com',
          guestPhone: '+1234567890',
          serviceName: 'Haircut',
          reminder24HourSent: null,
          reminder2HourSent: null
        }
      ];

      for (const apt of mockAppointments) {
        results.processed++;

        // Send 24-hour reminder if not sent
        const hoursTillAppointment = (apt.startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
        
        if (hoursTillAppointment <= 24 && hoursTillAppointment > 23 && !apt.reminder24HourSent) {
          try {
            // Send SMS reminder
            if (apt.guestPhone) {
              await sendAppointmentReminder(apt.guestPhone, {
                customerName: apt.guestName,
                serviceName: apt.serviceName,
                appointmentDate: apt.startTime.toLocaleDateString(),
                appointmentTime: apt.startTime.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                }),
                shopName: 'BookedBarber',
                appointmentId: apt.id
              });
            }

            // Send email reminder
            if (apt.guestEmail) {
              const emailData: BookingEmailData = {
                guestName: apt.guestName,
                guestEmail: apt.guestEmail,
                guestPhone: apt.guestPhone,
                serviceName: apt.serviceName,
                servicePrice: '0',
                duration: 30,
                appointmentDate: apt.startTime.toLocaleDateString(),
                appointmentTime: apt.startTime.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                }),
                shopName: 'BookedBarber',
                appointmentId: apt.id
              };
              
              await sendBookingConfirmation(emailData);
            }

            // Update reminder sent timestamp (in production)
            console.log(`✅ 24-hour reminder sent for appointment ${apt.id}`);
            results.sent24Hour++;
          } catch (error) {
            console.error(`Failed to send 24-hour reminder for ${apt.id}:`, error);
            results.errors.push(`24hr-${apt.id}: ${error.message}`);
          }
        }

        // Send 2-hour reminder if not sent
        if (hoursTillAppointment <= 2 && hoursTillAppointment > 1.5 && !apt.reminder2HourSent) {
          try {
            // Send SMS reminder
            if (apt.guestPhone) {
              await sendAppointmentReminder(apt.guestPhone, {
                customerName: apt.guestName,
                serviceName: apt.serviceName,
                appointmentDate: apt.startTime.toLocaleDateString(),
                appointmentTime: apt.startTime.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                }),
                shopName: 'BookedBarber',
                appointmentId: apt.id
              });
            }

            console.log(`✅ 2-hour reminder sent for appointment ${apt.id}`);
            results.sent2Hour++;
          } catch (error) {
            console.error(`Failed to send 2-hour reminder for ${apt.id}:`, error);
            results.errors.push(`2hr-${apt.id}: ${error.message}`);
          }
        }
      }

      // Log results
      console.log('🔔 Reminder Cron Job Results:', results);

      return NextResponse.json({
        success: true,
        timestamp: now.toISOString(),
        results
      });

    } catch (dbError) {
      console.error('Database error in reminder cron:', dbError);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        details: dbError.message
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Reminder cron job error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Also support POST for manual triggering
export async function POST(request: NextRequest) {
  return GET(request);
}