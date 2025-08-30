import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { clients, appointments } from '@/lib/schema';
import { eq, and, sql, desc, ilike } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import type { NewClient } from '@/lib/schema';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = db
      .select({
        id: clients.id,
        firstName: clients.firstName,
        lastName: clients.lastName,
        email: clients.email,
        phone: clients.phone,
        totalVisits: clients.totalVisits,
        totalSpent: clients.totalSpent,
        lastVisit: clients.lastVisit,
        isActive: clients.isActive,
        createdAt: clients.createdAt,
        notes: clients.notes,
      })
      .from(clients)
      .where(
        and(
          eq(clients.shopId, shopId),
          eq(clients.isActive, true)
        )
      )
      .orderBy(desc(clients.createdAt))
      .limit(limit)
      .offset(offset);

    // Add search filter if provided
    if (search) {
      query = query.where(
        and(
          eq(clients.shopId, shopId),
          eq(clients.isActive, true),
          sql`(
            ${clients.firstName} ILIKE ${'%' + search + '%'} OR
            ${clients.lastName} ILIKE ${'%' + search + '%'} OR
            ${clients.email} ILIKE ${'%' + search + '%'} OR
            ${clients.phone} ILIKE ${'%' + search + '%'}
          )`
        )
      );
    }

    const clientsList = await query.execute();

    // Get total count for pagination
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(clients)
      .where(
        and(
          eq(clients.shopId, shopId),
          eq(clients.isActive, true)
        )
      );

    return NextResponse.json({
      clients: clientsList,
      pagination: {
        total: count,
        limit,
        offset,
        hasMore: offset + limit < count,
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

    // Check for existing client with same email or phone
    if (email || phone) {
      const existingClient = await db
        .select()
        .from(clients)
        .where(
          and(
            eq(clients.shopId, shopId),
            eq(clients.isActive, true),
            email ? eq(clients.email, email) : sql`1=0`,
            phone ? eq(clients.phone, phone) : sql`1=0`
          )
        )
        .limit(1);

      if (existingClient.length > 0) {
        return NextResponse.json(
          { error: 'Client with this email or phone already exists' },
          { status: 400 }
        );
      }
    }

    const clientData: NewClient = {
      shopId,
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
      totalSpent: '0',
    };

    const [newClient] = await db
      .insert(clients)
      .values(clientData)
      .returning();

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