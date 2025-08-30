import { db } from './database';
import { appointment, service, shop } from './shop-schema';
import { eq, and, gte, lte, isNull } from 'drizzle-orm';
import { sendAppointmentReminder } from './sms-service';

/**
 * Appointment Reminder Scheduler
 * Handles automatic SMS and email reminders for upcoming appointments
 */
export class ReminderScheduler {
  
  /**
   * Send 24-hour reminders for upcoming appointments
   */
  async send24HourReminders(): Promise<{
    processed: number;
    sent: number;
    failed: number;
    errors: string[];
  }> {
    const results = {
      processed: 0,
      sent: 0,
      failed: 0,
      errors: [] as string[]
    };

    try {
      // Get appointments that are 24 hours away (+/- 1 hour buffer)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const tomorrowEnd = new Date(tomorrow);
      tomorrowEnd.setHours(23, 59, 59, 999);

      // Find appointments for tomorrow that haven't received a reminder yet
      const upcomingAppointments = await db
        .select({
          id: appointment.id,
          startTime: appointment.startTime,
          guestName: appointment.guestName,
          guestPhone: appointment.guestPhone,
          guestEmail: appointment.guestEmail,
          reminderSent: appointment.reminderSent,
          shopId: appointment.shopId,
          serviceId: appointment.serviceId,
        })
        .from(appointment)
        .innerJoin(service, eq(appointment.serviceId, service.id))
        .innerJoin(shop, eq(appointment.shopId, shop.id))
        .where(
          and(
            gte(appointment.startTime, tomorrow),
            lte(appointment.startTime, tomorrowEnd),
            eq(appointment.status, 'scheduled'),
            isNull(appointment.reminderSent) // Only send to those who haven't received a reminder
          )
        );

      console.log(`Found ${upcomingAppointments.length} appointments for tomorrow needing reminders`);

      for (const appt of upcomingAppointments) {
        results.processed++;

        try {
          // Get full appointment details
          const appointmentDetails = await this.getAppointmentDetails(appt.id);
          
          if (!appointmentDetails) {
            results.errors.push(`Appointment ${appt.id} details not found`);
            results.failed++;
            continue;
          }

          // Send SMS reminder if phone number is available
          if (appt.guestPhone) {
            const smsResult = await sendAppointmentReminder(
              appt.guestPhone,
              {
                customerName: appt.guestName || 'Customer',
                serviceName: appointmentDetails.serviceName,
                appointmentDate: appt.startTime.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric'
                }),
                appointmentTime: appt.startTime.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                }),
                shopName: appointmentDetails.shopName,
                appointmentId: appt.id
              }
            );

            if (smsResult.success) {
              // Mark reminder as sent
              await db
                .update(appointment)
                .set({ 
                  reminderSent: new Date(),
                  updatedAt: new Date()
                })
                .where(eq(appointment.id, appt.id));

              results.sent++;
              console.log(`✅ Reminder sent for appointment ${appt.id}`);
            } else {
              results.failed++;
              results.errors.push(`SMS failed for ${appt.id}: ${smsResult.error}`);
            }
          } else {
            results.failed++;
            results.errors.push(`No phone number for appointment ${appt.id}`);
          }

          // Add delay between messages to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
          results.failed++;
          results.errors.push(`Error processing appointment ${appt.id}: ${error}`);
          console.error(`Error processing appointment ${appt.id}:`, error);
        }
      }

      return results;

    } catch (error) {
      console.error('Error in send24HourReminders:', error);
      results.errors.push(`System error: ${error}`);
      return results;
    }
  }

  /**
   * Send 2-hour reminders for appointments starting soon
   */
  async send2HourReminders(): Promise<{
    processed: number;
    sent: number;
    failed: number;
    errors: string[];
  }> {
    const results = {
      processed: 0,
      sent: 0,
      failed: 0,
      errors: [] as string[]
    };

    try {
      // Get appointments starting in 2 hours (+/- 30 min buffer)
      const now = new Date();
      const twoHoursFromNow = new Date(now.getTime() + (2 * 60 * 60 * 1000));
      const reminderWindow = new Date(twoHoursFromNow.getTime() - (30 * 60 * 1000)); // 30 min before
      const reminderWindowEnd = new Date(twoHoursFromNow.getTime() + (30 * 60 * 1000)); // 30 min after

      const upcomingAppointments = await db
        .select({
          id: appointment.id,
          startTime: appointment.startTime,
          guestName: appointment.guestName,
          guestPhone: appointment.guestPhone,
          confirmationSent: appointment.confirmationSent,
          shopId: appointment.shopId,
          serviceId: appointment.serviceId,
        })
        .from(appointment)
        .where(
          and(
            gte(appointment.startTime, reminderWindow),
            lte(appointment.startTime, reminderWindowEnd),
            eq(appointment.status, 'scheduled'),
            isNull(appointment.confirmationSent) // Only send to those who haven't received 2-hour reminder
          )
        );

      console.log(`Found ${upcomingAppointments.length} appointments needing 2-hour reminders`);

      for (const appt of upcomingAppointments) {
        results.processed++;

        try {
          const appointmentDetails = await this.getAppointmentDetails(appt.id);
          
          if (!appointmentDetails || !appt.guestPhone) {
            results.failed++;
            continue;
          }

          // Send urgent reminder
          const message = `🚨 REMINDER: Your ${appointmentDetails.serviceName} appointment at ${appointmentDetails.shopName} starts in 2 hours (${appt.startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}). Please don't be late! Reply CANCEL to cancel.`;

          // This would use the SMS service to send the urgent reminder
          console.log(`📱 2-HOUR REMINDER: ${appt.guestPhone} - ${message}`);

          // Mark as sent
          await db
            .update(appointment)
            .set({ 
              confirmationSent: new Date(),
              updatedAt: new Date()
            })
            .where(eq(appointment.id, appt.id));

          results.sent++;

        } catch (error) {
          results.failed++;
          results.errors.push(`Error processing 2-hour reminder for ${appt.id}: ${error}`);
        }
      }

      return results;

    } catch (error) {
      console.error('Error in send2HourReminders:', error);
      results.errors.push(`System error: ${error}`);
      return results;
    }
  }

  /**
   * Get full appointment details with service and shop info
   */
  private async getAppointmentDetails(appointmentId: string): Promise<{
    serviceName: string;
    shopName: string;
    shopAddress?: string;
  } | null> {
    try {
      const details = await db
        .select({
          serviceName: service.name,
          shopName: shop.name,
          shopAddress: shop.address,
          shopCity: shop.city,
          shopState: shop.state,
          shopZipCode: shop.zipCode,
        })
        .from(appointment)
        .innerJoin(service, eq(appointment.serviceId, service.id))
        .innerJoin(shop, eq(appointment.shopId, shop.id))
        .where(eq(appointment.id, appointmentId))
        .limit(1);

      if (!details.length) return null;

      const detail = details[0];
      return {
        serviceName: detail.serviceName,
        shopName: detail.shopName,
        shopAddress: detail.shopAddress ? 
          `${detail.shopAddress}, ${detail.shopCity}, ${detail.shopState} ${detail.shopZipCode}` : 
          undefined
      };

    } catch (error) {
      console.error('Error getting appointment details:', error);
      return null;
    }
  }

  /**
   * Run the full reminder workflow
   * This would typically be called by a cron job or scheduled task
   */
  async runReminderWorkflow(): Promise<{
    totalProcessed: number;
    totalSent: number;
    totalFailed: number;
    reminders24h: any;
    reminders2h: any;
  }> {
    console.log('🔔 Starting reminder workflow...');
    
    // Run 24-hour reminders
    const reminders24h = await this.send24HourReminders();
    
    // Wait a bit between batches
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Run 2-hour reminders
    const reminders2h = await this.send2HourReminders();

    const results = {
      totalProcessed: reminders24h.processed + reminders2h.processed,
      totalSent: reminders24h.sent + reminders2h.sent,
      totalFailed: reminders24h.failed + reminders2h.failed,
      reminders24h,
      reminders2h
    };

    console.log('🔔 Reminder workflow completed:', {
      '24h reminders sent': reminders24h.sent,
      '2h reminders sent': reminders2h.sent,
      'Total failed': results.totalFailed
    });

    return results;
  }

  /**
   * Handle appointment cancellations via SMS
   * This would be called by a webhook when customers reply "CANCEL"
   */
  async handleCancellationRequest(
    phoneNumber: string, 
    appointmentReference: string
  ): Promise<{ success: boolean; appointmentId?: string; error?: string }> {
    try {
      // Find appointment by reference (first 8 chars of ID) and phone number
      const appointments = await db
        .select()
        .from(appointment)
        .where(
          and(
            eq(appointment.guestPhone, phoneNumber),
            eq(appointment.status, 'scheduled')
          )
        );

      // Find matching appointment by partial ID
      const matchingAppointment = appointments.find(appt => 
        appt.id.startsWith(appointmentReference)
      );

      if (!matchingAppointment) {
        return { 
          success: false, 
          error: 'Appointment not found or already cancelled' 
        };
      }

      // Cancel the appointment
      await db
        .update(appointment)
        .set({ 
          status: 'cancelled',
          updatedAt: new Date()
        })
        .where(eq(appointment.id, matchingAppointment.id));

      // Send confirmation SMS (would use SMS service in production)
      console.log(`📱 CANCELLATION CONFIRMED: ${phoneNumber} - Your appointment has been cancelled. Reference: ${appointmentReference}`);

      return { 
        success: true, 
        appointmentId: matchingAppointment.id 
      };

    } catch (error) {
      console.error('Error handling cancellation request:', error);
      return { 
        success: false, 
        error: 'Failed to process cancellation request' 
      };
    }
  }
}

// Export default instance
export const reminderScheduler = new ReminderScheduler();

// Export convenience functions
export async function sendDailyReminders() {
  return reminderScheduler.send24HourReminders();
}

export async function sendUrgentReminders() {
  return reminderScheduler.send2HourReminders();
}

export async function runFullReminderWorkflow() {
  return reminderScheduler.runReminderWorkflow();
}