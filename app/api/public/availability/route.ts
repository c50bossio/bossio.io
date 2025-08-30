import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { appointment } from '@/lib/shop-schema';
import { format, addMinutes, startOfDay, endOfDay } from 'date-fns';
import { and, eq, gte, lte, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId');
    const barberId = searchParams.get('barberId');
    const date = searchParams.get('date');
    const duration = parseInt(searchParams.get('duration') || '30');

    if (!shopId || !date) {
      return NextResponse.json(
        { error: 'Shop ID and date are required' },
        { status: 400 }
      );
    }

    // Parse the date
    const selectedDate = new Date(date);
    const dayStart = startOfDay(selectedDate);
    const dayEnd = endOfDay(selectedDate);

    if (!db) {
      throw new Error('Database connection not available');
    }

    // Get existing appointments for the day and barber (if specified)
    let appointmentQuery = db
      .select()
      .from(appointment)
      .where(
        and(
          eq(appointment.shopId, shopId),
          gte(appointment.startTime, dayStart),
          lte(appointment.startTime, dayEnd),
          // Only include scheduled and confirmed appointments
          sql`${appointment.status} IN ('scheduled', 'confirmed')`
        )
      );

    // If specific barber requested, filter by barber
    if (barberId && barberId !== 'null') {
      appointmentQuery = appointmentQuery.where(
        and(
          eq(appointment.shopId, shopId),
          eq(appointment.barberId, barberId),
          gte(appointment.startTime, dayStart),
          lte(appointment.startTime, dayEnd),
          sql`${appointment.status} IN ('scheduled', 'confirmed')`
        )
      );
    }

    const existingAppointments = await appointmentQuery;

    console.log(`Found ${existingAppointments.length} existing appointments for ${date} (barber: ${barberId})`);

    // Generate time slots based on business hours
    const slots = [];
    const startHour = 9; // 9 AM
    const endHour = 18; // 6 PM
    const slotInterval = 30; // 30 minutes

    const now = new Date();

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += slotInterval) {
        const slotTime = new Date(selectedDate);
        slotTime.setHours(hour, minute, 0, 0);
        
        // Don't show past time slots
        if (slotTime < now) {
          continue;
        }

        // Check if slot duration fits before closing time
        const slotEnd = addMinutes(slotTime, duration);
        const closingTime = new Date(selectedDate);
        closingTime.setHours(endHour, 0, 0, 0);
        
        if (slotEnd > closingTime) {
          continue;
        }

        // Check for conflicts with existing appointments
        const hasConflict = existingAppointments.some(appt => {
          const apptStart = new Date(appt.startTime);
          const apptEnd = new Date(appt.endTime);
          
          // Check if the slot overlaps with an existing appointment
          return (
            (slotTime < apptEnd && slotEnd > apptStart) ||
            // Also check if specific barber conflict (for "any barber" bookings)
            (barberId === null && appt.barberId !== null)
          );
        });

        slots.push({
          time: slotTime,
          available: !hasConflict,
          barberId: barberId || null
        });
      }
    }

    return NextResponse.json({
      date: date,
      shopId,
      barberId,
      slots
    });

  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json(
      { error: 'Failed to fetch availability' },
      { status: 500 }
    );
  }
}