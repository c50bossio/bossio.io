import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { appointments, staff, service } from '@/lib/shop-schema';
import { eq, and, gte, lte, or, ne, isNull } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');
    const shopId = searchParams.get('shopId');
    const barberId = searchParams.get('barberId');
    const serviceId = searchParams.get('serviceId');
    const excludeAppointmentId = searchParams.get('excludeId'); // For editing existing appointmentss
    
    if (!date || !shopId) {
      return NextResponse.json(
        { error: 'Date and shopId are required' },
        { status: 400 }
      );
    }

    // Parse the date and get start/end of day in local timezone
    const selectedDate = new Date(date + 'T00:00:00');
    const startOfDay = new Date(date + 'T00:00:00');
    const endOfDay = new Date(date + 'T23:59:59.999');
    
    console.log('🔎 Availability Check Parameters:', {
      requestedDate: date,
      shopId,
      barberId,
      serviceId,
      startOfDay: startOfDay.toISOString(),
      endOfDay: endOfDay.toISOString(),
      startOfDayMs: startOfDay.getTime(),
      endOfDayMs: endOfDay.getTime()
    });

    // Build query conditions
    const conditions = [
      eq(appointments.shopId, shopId),
      gte(appointments.startTime, startOfDay),
      lte(appointments.startTime, endOfDay),
      ne(appointments.status, 'cancelled'), // Don't count cancelled appointmentss
      isNull(appointments.deletedAt), // Don't count soft-deleted appointmentss
    ];

    // If checking for a specific barber
    if (barberId && barberId !== 'any') {
      conditions.push(
        or(
          eq(appointments.barberId, barberId),
          eq(appointments.barberId, null) // Include unassigned appointmentss
        )
      );
    }

    // Exclude a specific appointments (for editing)
    if (excludeAppointmentId) {
      conditions.push(ne(appointments.id, excludeAppointmentId));
    }

    // Fetch all appointmentss for the day
    const existingAppointments = await db
      .select({
        id: appointments.id,
        startTime: appointments.startTime,
        endTime: appointments.endTime,
        barberId: appointments.barberId,
        status: appointments.status,
      })
      .from(appointments)
      .where(and(...conditions));
    
    console.log('📊 Query Results:', {
      appointmentssFound: existingAppointments.length,
      appointmentss: existingAppointments.map(apt => ({
        id: apt.id.substring(0, 8) + '...',
        startTime: new Date(apt.startTime).toISOString(),
        endTime: new Date(apt.endTime).toISOString(),
        localStart: new Date(apt.startTime).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true,
          timeZone: 'America/New_York'
        }),
        localEnd: new Date(apt.endTime).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true,
          timeZone: 'America/New_York'
        }),
        barberId: apt.barberId?.substring(0, 8),
        status: apt.status
      }))
    });

    // Get service duration if provided
    let serviceDuration = 30; // Default 30 minutes
    if (serviceId) {
      const [serviceData] = await db
        .select({ duration: service.duration })
        .from(service)
        .where(eq(service.id, serviceId))
        .limit(1);
      
      if (serviceData) {
        serviceDuration = serviceData.duration;
      }
    }

    // Generate all possible time slots for the day (8 AM to 8 PM)
    const timeSlots = [];
    for (let hour = 8; hour <= 20; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        // Create slot times in UTC to match database storage
        // Use the date string and append the time in UTC format
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
        const slotStart = new Date(`${date}T${timeString}`);
        
        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotEnd.getMinutes() + serviceDuration);
        
        // Debug logging for 6pm slot
        if (hour === 18 && minute === 0) {
          console.log('🕰️ Checking 6:00 PM slot:', {
            slotStart: slotStart.toISOString(),
            slotEnd: slotEnd.toISOString(),
            slotStartTime: slotStart.getTime(),
            slotEndTime: slotEnd.getTime()
          });
        }
        
        // Skip if slot extends past closing time (8 PM)
        if (slotEnd.getHours() >= 20 && slotEnd.getMinutes() > 0) {
          continue;
        }

        // Check for conflicts with existing appointmentss
        let isAvailable = true;
        let conflictCount = 0;
        const conflicts = [];

        for (const apt of existingAppointments) {
          const aptStart = new Date(apt.startTime);
          const aptEnd = new Date(apt.endTime);
          
          // Debug for 6pm slot
          if (hour === 18 && minute === 0) {
            console.log('  📌 Comparing with appointments:', {
              aptStart: aptStart.toISOString(),
              aptEnd: aptEnd.toISOString(),
              aptStartTime: aptStart.getTime(),
              aptEndTime: aptEnd.getTime()
            });
          }

          // Check if there's an overlap
          const overlaps = 
            (slotStart >= aptStart && slotStart < aptEnd) || // Slot starts during appointments
            (slotEnd > aptStart && slotEnd <= aptEnd) || // Slot ends during appointments
            (slotStart <= aptStart && slotEnd >= aptEnd); // Slot encompasses appointments
          
          if (hour === 18 && minute === 0) {
            console.log('    🔍 Overlap check:', {
              overlaps,
              condition1: slotStart >= aptStart && slotStart < aptEnd,
              condition2: slotEnd > aptStart && slotEnd <= aptEnd,
              condition3: slotStart <= aptStart && slotEnd >= aptEnd
            });
          }
          
          if (overlaps) {
            conflictCount++;
            conflicts.push({
              id: apt.id,
              barberId: apt.barberId,
            });
            
            // For now, any conflict makes it unavailable
            // Later, we can check against maxConcurrentBookings
            isAvailable = false;
          }
        }

        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        timeSlots.push({
          time,
          startTime: slotStart.toISOString(),
          endTime: slotEnd.toISOString(),
          isAvailable,
          conflictCount,
          conflicts,
          // Future: compare conflictCount against maxConcurrentBookings
          maxConcurrentBookings: 1, // Default to 1 for now
        });
      }
    }

    // Calculate summary statistics
    const totalSlots = timeSlots.length;
    const availableSlots = timeSlots.filter(s => s.isAvailable).length;
    const bookedSlots = totalSlots - availableSlots;
    const utilizationRate = totalSlots > 0 ? (bookedSlots / totalSlots) * 100 : 0;
    
    // Log which slots are marked as unavailable
    const unavailableSlots = timeSlots.filter(s => !s.isAvailable);
    console.log('🚫 Unavailable Slots:', {
      count: unavailableSlots.length,
      times: unavailableSlots.map(s => s.time).join(', ')
    });

    return NextResponse.json({
      date: selectedDate.toISOString(),
      shopId,
      barberId: barberId || 'any',
      serviceDuration,
      timeSlots,
      summary: {
        totalSlots,
        availableSlots,
        bookedSlots,
        utilizationRate: Math.round(utilizationRate),
      },
    });

  } catch (error) {
    console.error('Error checking availability:', error);
    return NextResponse.json(
      { error: 'Failed to check availability' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // This endpoint checks if a specific time slot is available
    const body = await request.json();
    const {
      shopId,
      barberId,
      startTime,
      endTime,
      excludeAppointmentId, // For editing
      maxConcurrentBookings = 1, // Future feature
    } = body;

    if (!shopId || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const slotStart = new Date(startTime);
    const slotEnd = new Date(endTime);

    // Build query to find conflicting appointmentss
    const conditions = [
      eq(appointments.shopId, shopId),
      ne(appointments.status, 'cancelled'),
      isNull(appointments.deletedAt), // Don't count soft-deleted appointmentss
    ];

    // If checking for a specific barber
    if (barberId && barberId !== 'any') {
      conditions.push(
        or(
          eq(appointments.barberId, barberId),
          eq(appointments.barberId, null)
        )
      );
    }

    // Exclude appointments if editing
    if (excludeAppointmentId) {
      conditions.push(ne(appointments.id, excludeAppointmentId));
    }

    // Find overlapping appointmentss
    const conflicts = await db
      .select({
        id: appointments.id,
        startTime: appointments.startTime,
        endTime: appointments.endTime,
        barberId: appointments.barberId,
        clientName: appointments.guestName,
        status: appointments.status,
      })
      .from(appointments)
      .where(and(...conditions));

    // Check each appointments for overlap
    const overlappingAppointments = conflicts.filter(apt => {
      const aptStart = new Date(apt.startTime);
      const aptEnd = new Date(apt.endTime);

      return (
        (slotStart >= aptStart && slotStart < aptEnd) ||
        (slotEnd > aptStart && slotEnd <= aptEnd) ||
        (slotStart <= aptStart && slotEnd >= aptEnd)
      );
    });

    const isAvailable = overlappingAppointments.length < maxConcurrentBookings;

    return NextResponse.json({
      isAvailable,
      conflictCount: overlappingAppointments.length,
      maxConcurrentBookings,
      conflicts: overlappingAppointments.map(apt => ({
        id: apt.id,
        startTime: apt.startTime,
        endTime: apt.endTime,
        barberId: apt.barberId,
        clientName: apt.clientName,
      })),
      message: isAvailable 
        ? 'Time slot is available' 
        : `Time slot has ${overlappingAppointments.length} conflict(s)`,
    });

  } catch (error) {
    console.error('Error checking slot availability:', error);
    return NextResponse.json(
      { error: 'Failed to check availability' },
      { status: 500 }
    );
  }
}