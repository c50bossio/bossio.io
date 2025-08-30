import { db } from './database';
import { appointments, clients, services, users, analytics } from './schema';
import { eq, and, gte, lte, sql, desc } from 'drizzle-orm';
import type { NewAppointment, Appointment, NewAnalytics } from './schema';

export interface AppointmentWithDetails extends Appointment {
  client: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
  };
  service: {
    id: string;
    name: string;
    price: string;
    duration: number;
    color: string;
  };
  barber: {
    id: string;
    name: string;
    email: string;
  };
}

export interface BookingSlot {
  startTime: string;
  endTime: string;
  available: boolean;
  barberId?: string;
}

/**
 * Create a new appointment with conflict detection
 */
export async function createAppointment(
  appointmentData: NewAppointment,
  options: { 
    checkConflicts?: boolean;
    sendConfirmation?: boolean;
  } = {}
): Promise<{ appointment: Appointment; hasConflicts?: boolean }> {
  const { checkConflicts = true, sendConfirmation = true } = options;

  // Check for scheduling conflicts if requested
  let hasConflicts = false;
  if (checkConflicts) {
    const conflicts = await checkAppointmentConflicts(
      appointmentData.barberId,
      appointmentData.startTime,
      appointmentData.endTime,
      appointmentData.shopId
    );
    hasConflicts = conflicts.length > 0;
  }

  // Create the appointment
  const [appointment] = await db
    .insert(appointments)
    .values(appointmentData)
    .returning();

  // Send confirmation if requested (placeholder for SMS/email integration)
  if (sendConfirmation) {
    await scheduleAppointmentReminders(appointment);
  }

  return { appointment, hasConflicts };
}

/**
 * Get appointments with full details for a date range
 */
export async function getAppointmentsWithDetails(
  shopId: string,
  startDate: Date,
  endDate: Date,
  barberId?: string
): Promise<AppointmentWithDetails[]> {
  let query = db
    .select({
      id: appointments.id,
      shopId: appointments.shopId,
      clientId: appointments.clientId,
      barberId: appointments.barberId,
      serviceId: appointments.serviceId,
      startTime: appointments.startTime,
      endTime: appointments.endTime,
      status: appointments.status,
      price: appointments.price,
      paymentStatus: appointments.paymentStatus,
      paymentMethod: appointments.paymentMethod,
      notes: appointments.notes,
      reminderSent: appointments.reminderSent,
      confirmationSent: appointments.confirmationSent,
      createdAt: appointments.createdAt,
      updatedAt: appointments.updatedAt,
      // Client details
      client: {
        id: clients.id,
        firstName: clients.firstName,
        lastName: clients.lastName,
        email: clients.email,
        phone: clients.phone,
      },
      // Service details  
      service: {
        id: services.id,
        name: services.name,
        price: services.price,
        duration: services.duration,
        color: services.color,
      },
      // Barber details
      barber: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(appointments)
    .innerJoin(clients, eq(appointments.clientId, clients.id))
    .innerJoin(services, eq(appointments.serviceId, services.id))
    .innerJoin(users, eq(appointments.barberId, users.id))
    .where(
      and(
        eq(appointments.shopId, shopId),
        gte(appointments.startTime, startDate),
        lte(appointments.startTime, endDate)
      )
    );

  if (barberId) {
    query = query.where(
      and(
        eq(appointments.shopId, shopId),
        eq(appointments.barberId, barberId),
        gte(appointments.startTime, startDate),
        lte(appointments.startTime, endDate)
      )
    );
  }

  return query.execute() as Promise<AppointmentWithDetails[]>;
}

/**
 * Check for appointment conflicts for a barber
 */
export async function checkAppointmentConflicts(
  barberId: string,
  startTime: Date,
  endTime: Date,
  shopId: string,
  excludeAppointmentId?: string
): Promise<Appointment[]> {
  let query = db
    .select()
    .from(appointments)
    .where(
      and(
        eq(appointments.shopId, shopId),
        eq(appointments.barberId, barberId),
        // Check for time overlap
        sql`(
          (${appointments.startTime} <= ${startTime} AND ${appointments.endTime} > ${startTime}) OR
          (${appointments.startTime} < ${endTime} AND ${appointments.endTime} >= ${endTime}) OR
          (${appointments.startTime} >= ${startTime} AND ${appointments.endTime} <= ${endTime})
        )`
      )
    );

  if (excludeAppointmentId) {
    query = query.where(
      and(
        eq(appointments.shopId, shopId),
        eq(appointments.barberId, barberId),
        sql`${appointments.id} != ${excludeAppointmentId}`,
        sql`(
          (${appointments.startTime} <= ${startTime} AND ${appointments.endTime} > ${startTime}) OR
          (${appointments.startTime} < ${endTime} AND ${appointments.endTime} >= ${endTime}) OR
          (${appointments.startTime} >= ${startTime} AND ${appointments.endTime} <= ${endTime})
        )`
      )
    );
  }

  return query.execute();
}

/**
 * Generate available booking slots for a day
 */
export async function getAvailableSlots(
  shopId: string,
  barberId: string,
  date: Date,
  serviceDuration: number = 30
): Promise<BookingSlot[]> {
  // Get business hours (simplified - assumes 9 AM to 6 PM)
  const dayStart = new Date(date);
  dayStart.setHours(9, 0, 0, 0);
  
  const dayEnd = new Date(date);
  dayEnd.setHours(18, 0, 0, 0);

  // Get existing appointments for the day
  const existingAppointments = await db
    .select()
    .from(appointments)
    .where(
      and(
        eq(appointments.shopId, shopId),
        eq(appointments.barberId, barberId),
        gte(appointments.startTime, dayStart),
        lte(appointments.startTime, dayEnd)
      )
    )
    .orderBy(appointments.startTime);

  const slots: BookingSlot[] = [];
  const slotDuration = serviceDuration * 60 * 1000; // Convert to milliseconds

  for (let time = dayStart.getTime(); time < dayEnd.getTime(); time += slotDuration) {
    const slotStart = new Date(time);
    const slotEnd = new Date(time + slotDuration);

    // Check if this slot conflicts with any existing appointments
    const hasConflict = existingAppointments.some(appt => {
      const apptStart = new Date(appt.startTime).getTime();
      const apptEnd = new Date(appt.endTime).getTime();
      
      return (
        (slotStart.getTime() < apptEnd && slotEnd.getTime() > apptStart)
      );
    });

    slots.push({
      startTime: slotStart.toISOString(),
      endTime: slotEnd.toISOString(),
      available: !hasConflict,
      barberId,
    });
  }

  return slots;
}

/**
 * Update appointment status and handle side effects
 */
export async function updateAppointmentStatus(
  appointmentId: string,
  status: string,
  options: {
    updateAnalytics?: boolean;
    sendNotification?: boolean;
  } = {}
): Promise<Appointment> {
  const { updateAnalytics = true, sendNotification = true } = options;

  const [updatedAppointment] = await db
    .update(appointments)
    .set({ 
      status: status as any,
      updatedAt: new Date()
    })
    .where(eq(appointments.id, appointmentId))
    .returning();

  // Handle completion - update client stats and analytics
  if (status === 'completed' && updateAnalytics) {
    await handleAppointmentCompletion(updatedAppointment);
  }

  // Send notification if needed
  if (sendNotification && ['cancelled', 'confirmed'].includes(status)) {
    await sendAppointmentStatusNotification(updatedAppointment, status);
  }

  return updatedAppointment;
}

/**
 * Handle appointment completion - update client stats and daily analytics
 */
async function handleAppointmentCompletion(appointment: Appointment): Promise<void> {
  // Update client stats
  await db
    .update(clients)
    .set({
      totalVisits: sql`${clients.totalVisits} + 1`,
      totalSpent: sql`${clients.totalSpent} + ${appointment.price}`,
      lastVisit: appointment.endTime,
      updatedAt: new Date(),
    })
    .where(eq(clients.id, appointment.clientId));

  // Update daily analytics
  const appointmentDate = new Date(appointment.startTime);
  appointmentDate.setHours(0, 0, 0, 0);

  await db
    .insert(analytics)
    .values({
      shopId: appointment.shopId,
      date: appointmentDate,
      completedAppointments: 1,
      totalRevenue: appointment.price,
      totalAppointments: 1,
    } as NewAnalytics)
    .onConflictDoUpdate({
      target: [analytics.shopId, analytics.date],
      set: {
        completedAppointments: sql`${analytics.completedAppointments} + 1`,
        totalRevenue: sql`${analytics.totalRevenue} + ${appointment.price}`,
      },
    });
}

/**
 * Schedule appointment reminders (placeholder for SMS/email integration)
 */
async function scheduleAppointmentReminders(appointment: Appointment): Promise<void> {
  // This would integrate with your SMS/email service
  // For now, just log the reminder scheduling
  console.log(`Scheduled reminders for appointment ${appointment.id}`);
  
  // In production, you'd schedule:
  // - 24-hour reminder
  // - 2-hour reminder
  // - Confirmation request
}

/**
 * Send appointment status notification (placeholder)
 */
async function sendAppointmentStatusNotification(
  appointment: Appointment,
  status: string
): Promise<void> {
  console.log(`Sending ${status} notification for appointment ${appointment.id}`);
  
  // This would send actual SMS/email notifications
}