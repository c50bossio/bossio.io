import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/lib/database';
import { appointments, service, shop, staff } from '@/lib/shop-schema';
import { user } from '@/lib/better-auth-schema';
import { eq, and, gte, lte, desc, asc, or, isNull, ne } from 'drizzle-orm';
import { withRateLimit } from '@/lib/with-rate-limit';

async function getHandler(request: NextRequest) {
  let session = null;
  let startDate, endDate, status, shopIdParam, barberIdParam, isPublicRequest;
  
  try {
    // Get authenticated user session
    session = await auth.api.getSession({
      headers: await headers(),
    });

    // For dashboard, require authentication. For public, allow without auth
    isPublicRequest = request.nextUrl.searchParams.get('public') === 'true';
    
    if (!isPublicRequest && !session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    startDate = searchParams.get('startDate');
    endDate = searchParams.get('endDate');
    status = searchParams.get('status');
    shopIdParam = searchParams.get('shopId');
    barberIdParam = searchParams.get('barberId');

    // Build query conditions
    const conditions = [];
    
    // Always exclude soft-deleted appointments
    conditions.push(isNull(appointments.deletedAt));

    // For authenticated requests, get staff member's shop
    if (session?.user && !isPublicRequest) {
      // Find staff member for this user
      const staffMember = await db
        .select()
        .from(staff)
        .where(eq(staff.userId, session.user.id))
        .limit(1);

      if (!staffMember.length) {
        // If not a staff member, return empty
        return NextResponse.json({
          appointments: [],
          stats: {
            total: 0,
            confirmed: 0,
            scheduled: 0,
            completed: 0,
            cancelled: 0,
            noShow: 0,
            totalRevenue: 0,
            totalDuration: 0,
          }
        });
      }

      const currentStaff = staffMember[0];
      conditions.push(eq(appointments.shopId, currentStaff.shopId));

      // If barber role, only show their appointments
      if (currentStaff.role === 'barber') {
        conditions.push(
          or(
            eq(appointments.barberId, currentStaff.id),
            isNull(appointments.barberId)
          )
        );
      }
    } else if (shopIdParam) {
      // For public requests, use provided shopId
      conditions.push(eq(appointments.shopId, shopIdParam));
    }

    // Add barberId filter if provided
    if (barberIdParam) {
      conditions.push(eq(appointments.barberId, barberIdParam));
    }

    // Date filtering
    if (startDate) {
      conditions.push(gte(appointments.startTime, new Date(startDate)));
    }
    if (endDate) {
      conditions.push(lte(appointments.startTime, new Date(endDate)));
    }

    // Status filtering
    if (status && status !== 'all') {
      conditions.push(eq(appointments.status, status));
    }

    // Fetch appointments with related data
    const appointmentsData = await db
      .select({
        id: appointments.id,
        startTime: appointments.startTime,
        endTime: appointments.endTime,
        status: appointments.status,
        paymentStatus: appointments.paymentStatus,
        price: appointments.price,
        notes: appointments.notes,
        duration: appointments.duration,
        // Client info
        clientId: appointments.clientId,
        clientName: appointments.guestName,
        clientEmail: appointments.guestEmail,
        clientPhone: appointments.guestPhone,
        // Service info
        serviceId: appointments.serviceId,
        serviceName: service.name,
        serviceCategory: service.category,
        // Barber info
        barberId: appointments.barberId,
        barberName: user.name,
        // Shop info
        shopId: appointments.shopId,
        shopName: shop.name,
      })
      .from(appointments)
      .leftJoin(service, eq(appointments.serviceId, service.id))
      .leftJoin(shop, eq(appointments.shopId, shop.id))
      .leftJoin(staff, eq(appointments.barberId, staff.id))
      .leftJoin(user, eq(staff.userId, user.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(appointments.startTime));

    // Validate appointmentsData
    if (!Array.isArray(appointmentsData)) {
      console.error('Invalid appointmentsData:', typeof appointmentsData, appointmentsData);
      return NextResponse.json({
        appointments: [],
        stats: {
          total: 0, confirmed: 0, scheduled: 0, completed: 0, 
          cancelled: 0, noShow: 0, totalRevenue: 0, totalDuration: 0
        }
      });
    }

    // Format appointments for frontend with null safety
    const formattedAppointments = appointmentsData.map(apt => ({
      id: apt.id,
      title: apt.serviceName || 'Appointment',
      client: apt.clientName || 'Guest Client',
      clientEmail: apt.clientEmail || '',
      clientPhone: apt.clientPhone || '',
      startTime: apt.startTime,
      endTime: apt.endTime,
      time: apt.startTime ? new Date(apt.startTime).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }) : '',
      duration: apt.duration || 0,
      status: apt.status || 'scheduled',
      paymentStatus: apt.paymentStatus || 'pending',
      price: apt.price || '0',
      type: apt.serviceCategory || 'Service',
      barber: apt.barberName || 'Unassigned',
      barberId: apt.barberId || null,
      serviceId: apt.serviceId || null,
      notes: apt.notes || '',
      isToday: apt.startTime ? new Date(apt.startTime).toDateString() === new Date().toDateString() : false,
      isPast: apt.endTime ? new Date(apt.endTime) < new Date() : false,
    }));

    // Calculate summary stats with null safety
    const stats = {
      total: formattedAppointments.length,
      confirmed: formattedAppointments.filter(a => a.status === 'confirmed').length,
      scheduled: formattedAppointments.filter(a => a.status === 'scheduled').length,
      completed: formattedAppointments.filter(a => a.status === 'completed').length,
      cancelled: formattedAppointments.filter(a => a.status === 'cancelled').length,
      noShow: formattedAppointments.filter(a => a.status === 'no_show').length,
      totalRevenue: formattedAppointments
        .filter(a => a.status !== 'cancelled' && a.status !== 'no_show')
        .reduce((sum, a) => {
          const price = a.price ? parseFloat(String(a.price)) : 0;
          return sum + (isNaN(price) ? 0 : price);
        }, 0),
      totalDuration: formattedAppointments
        .filter(a => a.status !== 'cancelled')
        .reduce((sum, a) => {
          const duration = a.duration ? Number(a.duration) : 0;
          return sum + (isNaN(duration) ? 0 : duration);
        }, 0),
    };

    return NextResponse.json({
      appointments: formattedAppointments,
      stats
    });

  } catch (error) {
    console.error('Error fetching appointments:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      sessionUser: session?.user?.id || 'No session',
      requestParams: {
        startDate,
        endDate,
        status,
        shopIdParam,
        barberIdParam,
        isPublicRequest
      }
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch appointments',
        details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined
      },
      { status: 500 }
    );
  }
}

async function postHandler(request: NextRequest) {
  try {
    // Get current user session
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get staff member info to determine shop
    const staffMember = await db
      .select()
      .from(staff)
      .where(eq(staff.userId, session.user.id))
      .limit(1);

    if (!staffMember.length) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 403 });
    }

    const currentStaff = staffMember[0];
    const shopId = currentStaff.shopId;

    const body = await request.json();
    const {
      clientId,
      guestName,
      guestEmail,
      guestPhone,
      serviceId,
      startTime,
      endTime,
      duration,
      notes,
      barberId,
      price,
      status = 'scheduled',
      paymentStatus = 'pending',
    } = body;

    // Validate required fields
    if (!serviceId || !startTime || !duration) {
      return NextResponse.json(
        { error: 'Missing required fields: serviceId, startTime, duration' },
        { status: 400 }
      );
    }

    // If no clientId, must have guest info
    if (!clientId && !guestName) {
      return NextResponse.json(
        { error: 'Either clientId or guestName is required' },
        { status: 400 }
      );
    }

    // Calculate end time if not provided
    const startDateTime = new Date(startTime);
    const endDateTime = endTime ? new Date(endTime) : new Date(startDateTime.getTime() + (duration * 60 * 1000));

    // Check for conflicts before creating appointment
    const conflictConditions = [
      eq(appointments.shopId, shopId),
      ne(appointments.status, 'cancelled'),
    ];

    // If specific barber requested, check their schedule
    if (barberId) {
      conflictConditions.push(
        or(
          eq(appointments.barberId, barberId),
          isNull(appointments.barberId) // Also check unassigned appointments
        )
      );
    }

    // Find overlapping appointments
    const existingAppointments = await db
      .select({
        id: appointments.id,
        startTime: appointments.startTime,
        endTime: appointments.endTime,
        barberId: appointments.barberId,
        clientName: appointments.guestName,
      })
      .from(appointments)
      .where(and(...conflictConditions));

    // Check for time conflicts
    const conflicts = existingAppointments.filter(apt => {
      const aptStart = new Date(apt.startTime);
      const aptEnd = new Date(apt.endTime);

      return (
        (startDateTime >= aptStart && startDateTime < aptEnd) ||
        (endDateTime > aptStart && endDateTime <= aptEnd) ||
        (startDateTime <= aptStart && endDateTime >= aptEnd)
      );
    });

    // For now, we don't allow any conflicts (maxConcurrentBookings = 1)
    // In the future, this can be configurable per barber/shop
    const maxConcurrentBookings = 1;
    
    if (conflicts.length >= maxConcurrentBookings) {
      return NextResponse.json(
        { 
          error: 'Time slot is not available',
          conflicts: conflicts.map(c => ({
            id: c.id,
            startTime: c.startTime,
            endTime: c.endTime,
            clientName: c.clientName,
          })),
          message: `This time slot already has ${conflicts.length} booking(s)`,
        },
        { status: 409 } // Conflict status code
      );
    }

    // Get service details for pricing if not provided
    let servicePrice = price;
    if (!servicePrice && serviceId) {
      const serviceData = await db
        .select()
        .from(service)
        .where(eq(service.id, serviceId))
        .limit(1);
      
      if (serviceData.length) {
        servicePrice = serviceData[0].price;
      }
    }

    // Create appointment - no conflicts found
    const [newAppointment] = await db.insert(appointments).values({
      shopId,
      clientId: clientId || null,
      guestName: guestName || null,
      guestEmail: guestEmail || null,
      guestPhone: guestPhone || null,
      barberId: barberId || null,
      serviceId,
      startTime: startDateTime,
      endTime: endDateTime,
      duration,
      price: servicePrice || '0',
      notes: notes || null,
      status: status,
      paymentStatus: paymentStatus,
    }).returning();

    return NextResponse.json({
      appointment: newAppointment,
      message: 'Appointment created successfully'
    });

  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    );
  }
}

// Apply rate limiting to appointment endpoints
// GET: Analytics rate limit (30/min) since it's mostly read operations
// POST: Booking rate limit (10/min) since it's creating appointments
export const GET = withRateLimit(getHandler, { type: 'analytics' });
export const POST = withRateLimit(postHandler, { type: 'booking' });