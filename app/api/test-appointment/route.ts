import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { appointment } from '@/lib/shop-schema';

export async function POST(request: NextRequest) {
  try {
    // Create 6:00 PM appointment for today
    const startTime = new Date('2025-08-31T18:00:00-04:00'); // 6:00 PM EDT = 22:00 UTC
    const endTime = new Date('2025-08-31T18:45:00-04:00');   // 6:45 PM EDT
    
    const newAppointment = {
      shopId: '6ac05b41-85e2-4b3e-9985-e5c7ad813684',
      serviceId: 'cf7564f7-7a86-431f-89e1-15a7fcd3d15f',
      barberId: null, // Any available barber
      startTime: startTime,
      endTime: endTime,
      duration: 45,
      clientId: null,
      guestName: 'Test Customer 6PM',
      guestEmail: 'test6pm@example.com',
      guestPhone: '555-0106',
      price: '35.00',
      status: 'scheduled',
      paymentStatus: 'pending',
      notes: 'Test appointment at 6PM to verify availability blocking'
    };
    
    const result = await db.insert(appointment).values(newAppointment);
    
    return NextResponse.json({
      success: true,
      message: 'Test appointment created at 6:00 PM',
      appointment: {
        ...newAppointment,
        startTimeUTC: startTime.toISOString(),
        endTimeUTC: endTime.toISOString(),
        startTimeLocal: startTime.toLocaleString('en-US', { timeZone: 'America/New_York' }),
        endTimeLocal: endTime.toLocaleString('en-US', { timeZone: 'America/New_York' })
      }
    });
  } catch (error) {
    console.error('Error creating test appointment:', error);
    return NextResponse.json(
      { error: 'Failed to create test appointment' },
      { status: 500 }
    );
  }
}