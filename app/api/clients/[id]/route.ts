import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { clients, appointments } from '@/lib/shop-schema';
import { eq, and, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // For demo purposes, return mock client details
    // In production, this would query the database
    
    const { id } = params;

    // Mock client data based on ID
    const demoClients: Record<string, any> = {
      '1': {
        id: '1',
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@example.com',
        phone: '(555) 123-4567',
        totalVisits: 15,
        totalSpent: '1250.00',
        lastVisit: '2024-08-15T14:30:00Z',
        isActive: true,
        createdAt: '2024-01-15T10:00:00Z',
        notes: 'Regular customer, prefers short cuts',
        allergies: null,
        emailNotifications: true,
        smsNotifications: true
      },
      '2': {
        id: '2',
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.j@example.com',
        phone: '(555) 987-6543',
        totalVisits: 8,
        totalSpent: '890.00',
        lastVisit: '2024-08-20T16:45:00Z',
        isActive: true,
        createdAt: '2024-03-20T11:30:00Z',
        notes: 'Likes beard trims',
        allergies: null,
        emailNotifications: true,
        smsNotifications: false
      }
    };

    const client = demoClients[id];
    
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Mock appointment history
    const appointmentHistory = [
      {
        id: 'apt-1',
        serviceId: 'service-1',
        startTime: '2024-08-15T14:30:00Z',
        endTime: '2024-08-15T15:30:00Z',
        status: 'completed',
        price: '45.00',
        notes: 'Regular haircut'
      },
      {
        id: 'apt-2',
        serviceId: 'service-2',
        startTime: '2024-07-20T16:00:00Z',
        endTime: '2024-07-20T17:00:00Z',
        status: 'completed',
        price: '65.00',
        notes: 'Haircut and beard trim'
      }
    ];

    return NextResponse.json({
      client,
      appointmentHistory,
      stats: {
        totalAppointments: client.totalVisits,
        completedAppointments: client.totalVisits,
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
    // For demo purposes, simulate updating a client
    // In production, this would update the database
    
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

    // Mock updated client response
    const updatedClient = {
      id,
      firstName: firstName || 'John',
      lastName: lastName || 'Smith',
      email: email !== undefined ? email : 'john.smith@example.com',
      phone: phone !== undefined ? phone : '(555) 123-4567',
      notes: notes !== undefined ? notes : 'Updated notes',
      allergies: allergies !== undefined ? allergies : null,
      emailNotifications: emailNotifications !== undefined ? emailNotifications : true,
      smsNotifications: smsNotifications !== undefined ? smsNotifications : true,
      isActive: true,
      totalVisits: 15,
      totalSpent: '1250.00',
      lastVisit: '2024-08-15T14:30:00Z',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: new Date().toISOString(),
    };

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
    // For demo purposes, simulate deleting a client
    // In production, this would soft delete in the database
    
    const { id } = params;

    // For demo, just return success
    // In production, this would mark the client as inactive
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