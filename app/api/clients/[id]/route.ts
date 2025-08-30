import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { clients, appointments } from '@/lib/schema';
import { eq, and, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(
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

    const shopId = session.user.shopId;
    if (!shopId) {
      return NextResponse.json({ error: 'Shop ID required' }, { status: 400 });
    }

    const { id } = params;

    // Get client details
    const [client] = await db
      .select()
      .from(clients)
      .where(
        and(
          eq(clients.id, id),
          eq(clients.shopId, shopId),
          eq(clients.isActive, true)
        )
      )
      .limit(1);

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Get client's appointment history
    const appointmentHistory = await db
      .select({
        id: appointments.id,
        serviceId: appointments.serviceId,
        startTime: appointments.startTime,
        endTime: appointments.endTime,
        status: appointments.status,
        price: appointments.price,
        notes: appointments.notes,
      })
      .from(appointments)
      .where(
        and(
          eq(appointments.clientId, id),
          eq(appointments.shopId, shopId)
        )
      )
      .orderBy(desc(appointments.startTime))
      .limit(20);

    return NextResponse.json({
      client,
      appointmentHistory,
      stats: {
        totalAppointments: appointmentHistory.length,
        completedAppointments: appointmentHistory.filter(apt => apt.status === 'completed').length,
        totalSpent: client.totalSpent,
        lastVisit: client.lastVisit,
      }
    });

  } catch (error) {
    console.error('Error fetching client:', error);
    return NextResponse.json(
      { error: 'Failed to fetch client' },
      { status: 500 }
    );
  }
}

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

    const shopId = session.user.shopId;
    if (!shopId) {
      return NextResponse.json({ error: 'Shop ID required' }, { status: 400 });
    }

    const { id } = params;
    const body = await request.json();

    const {
      firstName,
      lastName,
      email,
      phone,
      notes,
      allergies,
      emailNotifications,
      smsNotifications,
    } = body;

    // Update client
    const [updatedClient] = await db
      .update(clients)
      .set({
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(notes !== undefined && { notes }),
        ...(allergies !== undefined && { allergies }),
        ...(emailNotifications !== undefined && { emailNotifications }),
        ...(smsNotifications !== undefined && { smsNotifications }),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(clients.id, id),
          eq(clients.shopId, shopId)
        )
      )
      .returning();

    if (!updatedClient) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json({
      client: updatedClient,
      message: 'Client updated successfully'
    });

  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json(
      { error: 'Failed to update client' },
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

    const shopId = session.user.shopId;
    if (!shopId) {
      return NextResponse.json({ error: 'Shop ID required' }, { status: 400 });
    }

    const { id } = params;

    // Soft delete - mark as inactive
    const [deletedClient] = await db
      .update(clients)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(clients.id, id),
          eq(clients.shopId, shopId)
        )
      )
      .returning();

    if (!deletedClient) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Client deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json(
      { error: 'Failed to delete client' },
      { status: 500 }
    );
  }
}