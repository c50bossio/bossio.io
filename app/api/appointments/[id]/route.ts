import { NextRequest, NextResponse } from 'next/server';
import { updateAppointmentStatus } from '@/lib/appointment-service';
import { db } from '@/lib/database';
import { appointments } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get current user session
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { status, notes } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Update appointment status
    const updatedAppointment = await updateAppointmentStatus(id, status, {
      updateAnalytics: status === 'completed',
      sendNotification: ['confirmed', 'cancelled'].includes(status),
    });

    // Update notes if provided
    if (notes !== undefined) {
      await db
        .update(appointments)
        .set({ notes, updatedAt: new Date() })
        .where(eq(appointments.id, id));
    }

    return NextResponse.json({
      appointment: updatedAppointment,
      message: `Appointment ${status} successfully`
    });

  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json(
      { error: 'Failed to update appointment' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get current user session
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Soft delete - set status to cancelled and add deletion timestamp
    await db
      .update(appointments)
      .set({ 
        status: 'cancelled',
        deletedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(appointments.id, id));

    return NextResponse.json({
      message: 'Appointment cancelled successfully'
    });

  } catch (error) {
    console.error('Error deleting appointment:', error);
    return NextResponse.json(
      { error: 'Failed to cancel appointment' },
      { status: 500 }
    );
  }
}