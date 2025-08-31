import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/lib/database';
import { appointments, staff } from '@/lib/shop-schema';
import { eq } from 'drizzle-orm';

// Update appointments status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: appointmentsId } = await params;
    
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      status, 
      notes, 
      paymentStatus,
      startTime,
      endTime,
      serviceId,
      barberId,
      duration
    } = body;

    // Verify staff member can update this appointments
    const staffMember = await db
      .select()
      .from(staff)
      .where(eq(staff.userId, session.user.id))
      .limit(1);

    if (!staffMember.length) {
      return NextResponse.json(
        { error: 'Not a staff member' },
        { status: 403 }
      );
    }

    // Get the appointments to verify shop
    const existingAppointment = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, appointmentsId))
      .limit(1);

    if (!existingAppointment.length) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Verify same shop
    if (existingAppointment[0].shopId !== staffMember[0].shopId) {
      return NextResponse.json(
        { error: 'Cannot update appointmentss from other shops' },
        { status: 403 }
      );
    }

    // Update appointments
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Handle different types of updates
    if (status !== undefined) {
      updateData.status = status;
      // If marking as completed, update payment status to paid
      if (status === 'completed' && !paymentStatus) {
        updateData.paymentStatus = 'paid';
      }
    }
    
    if (notes !== undefined) {
      updateData.notes = notes;
    }
    
    if (paymentStatus !== undefined) {
      updateData.paymentStatus = paymentStatus;
    }
    
    // Handle rescheduling
    if (startTime !== undefined) {
      updateData.startTime = new Date(startTime);
    }
    
    if (endTime !== undefined) {
      updateData.endTime = new Date(endTime);
    }
    
    // Handle service change
    if (serviceId !== undefined) {
      updateData.serviceId = serviceId;
    }
    
    // Handle barber reassignment
    if (barberId !== undefined) {
      updateData.barberId = barberId || null; // null for "any available"
    }
    
    // Handle duration update
    if (duration !== undefined) {
      updateData.duration = duration;
    }

    const updated = await db
      .update(appointments)
      .set(updateData)
      .where(eq(appointments.id, appointmentsId))
      .returning();

    return NextResponse.json({
      success: true,
      appointments: updated[0]
    });

  } catch (error) {
    console.error('Error updating appointments:', error);
    return NextResponse.json(
      { error: 'Failed to update appointments' },
      { status: 500 }
    );
  }
}

// Delete appointments
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: appointmentsId } = await params;
    
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify staff member
    const staffMember = await db
      .select()
      .from(staff)
      .where(eq(staff.userId, session.user.id))
      .limit(1);

    if (!staffMember.length) {
      return NextResponse.json(
        { error: 'Not a staff member' },
        { status: 403 }
      );
    }

    // Get the appointments to verify shop
    const existingAppointment = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, appointmentsId))
      .limit(1);

    if (!existingAppointment.length) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Verify same shop
    if (existingAppointment[0].shopId !== staffMember[0].shopId) {
      return NextResponse.json(
        { error: 'Cannot delete appointmentss from other shops' },
        { status: 403 }
      );
    }

    // Soft delete appointments by setting deletedAt timestamp
    const deleted = await db
      .update(appointments)
      .set({ 
        deletedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(appointments.id, appointmentsId))
      .returning();

    return NextResponse.json({
      success: true,
      message: 'Appointment deleted successfully',
      appointments: deleted[0]
    }, { status: 200 });

  } catch (error) {
    console.error('Error deleting appointments:', error);
    return NextResponse.json(
      { error: 'Failed to delete appointments' },
      { status: 500 }
    );
  }
}