import { NextRequest, NextResponse } from 'next/server';
import { createAppointment, getAppointmentsWithDetails } from '@/lib/appointment-service';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Check database availability
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    // Get current user session
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const barberId = searchParams.get('barberId');
    const shopId = session.user.shopId;

    if (!shopId) {
      return NextResponse.json({ error: 'Shop ID required' }, { status: 400 });
    }

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      );
    }

    const appointments = await getAppointmentsWithDetails(
      shopId,
      new Date(startDate),
      new Date(endDate),
      barberId || undefined
    );

    return NextResponse.json({ appointments });

  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get current user session
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const shopId = session.user.shopId;
    if (!shopId) {
      return NextResponse.json({ error: 'Shop ID required' }, { status: 400 });
    }

    const body = await request.json();
    const {
      clientId,
      serviceId,
      startTime,
      duration, // in minutes
      notes,
      barberId = session.user.id, // Default to current user if not specified
    } = body;

    if (!clientId || !serviceId || !startTime || !duration) {
      return NextResponse.json(
        { error: 'Missing required fields: clientId, serviceId, startTime, duration' },
        { status: 400 }
      );
    }

    // Calculate end time
    const startDateTime = new Date(startTime);
    const endDateTime = new Date(startDateTime.getTime() + (duration * 60 * 1000));

    // Get service details for pricing
    // TODO: Fetch service details from database
    const servicePrice = '50.00'; // Placeholder

    const appointmentData = {
      shopId,
      clientId,
      barberId,
      serviceId,
      startTime: startDateTime,
      endTime: endDateTime,
      price: servicePrice,
      notes: notes || null,
      status: 'scheduled' as const,
      paymentStatus: 'pending' as const,
    };

    const { appointment, hasConflicts } = await createAppointment(appointmentData, {
      checkConflicts: true,
      sendConfirmation: true,
    });

    return NextResponse.json({
      appointment,
      hasConflicts,
      message: hasConflicts 
        ? 'Appointment created but conflicts detected'
        : 'Appointment created successfully'
    });

  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    );
  }
}