import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { clients, appointments } from '@/lib/shop-schema';
import { eq, and, sql, desc, ilike } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // For demo purposes, we'll return mock data when database isn't fully set up
    // This allows testing the UI while the database schema is being established
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Demo client data
    const demoClients = [
      {
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
        notes: 'Regular customer, prefers short cuts'
      },
      {
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
        notes: 'Likes beard trims'
      },
      {
        id: '3',
        firstName: 'Michael',
        lastName: 'Brown',
        email: 'm.brown@example.com',
        phone: '(555) 456-7890',
        totalVisits: 25,
        totalSpent: '2100.00',
        lastVisit: '2024-07-30T12:00:00Z',
        isActive: true,
        createdAt: '2023-08-10T09:15:00Z',
        notes: 'VIP client, monthly appointments'
      },
      {
        id: '4',
        firstName: 'Emily',
        lastName: 'Davis',
        email: 'emily.davis@example.com',
        phone: '(555) 321-0987',
        totalVisits: 3,
        totalSpent: '180.00',
        lastVisit: '2024-08-25T13:20:00Z',
        isActive: true,
        createdAt: '2024-08-01T15:45:00Z',
        notes: 'New client, prefers natural look'
      }
    ];

    // Filter by search if provided
    let filteredClients = demoClients;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredClients = demoClients.filter(client =>
        client.firstName.toLowerCase().includes(searchLower) ||
        client.lastName.toLowerCase().includes(searchLower) ||
        client.email.toLowerCase().includes(searchLower) ||
        client.phone.includes(search)
      );
    }

    // Apply pagination
    const paginatedClients = filteredClients.slice(offset, offset + limit);

    return NextResponse.json({
      clients: paginatedClients,
      pagination: {
        total: filteredClients.length,
        limit,
        offset,
        hasMore: offset + limit < filteredClients.length,
      },
    });

  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // For demo purposes, simulate creating a client
    // In production, this would save to the database
    
    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      notes,
      allergies,
      emailNotifications = true,
      smsNotifications = true,
    } = body;

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: 'First name and last name are required' },
        { status: 400 }
      );
    }

    // Create mock client response
    const newClient = {
      id: Math.random().toString(36).substr(2, 9),
      firstName,
      lastName,
      email: email || null,
      phone: phone || null,
      notes: notes || null,
      allergies: allergies || null,
      emailNotifications,
      smsNotifications,
      isActive: true,
      totalVisits: 0,
      totalSpent: '0.00',
      lastVisit: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({
      client: newClient,
      message: 'Client created successfully'
    });

  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    );
  }
}