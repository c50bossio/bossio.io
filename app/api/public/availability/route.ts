import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { format, addMinutes, startOfDay, endOfDay } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId');
    const barberId = searchParams.get('barberId');
    const date = searchParams.get('date');
    const duration = parseInt(searchParams.get('duration') || '30');

    if (!shopId || !date) {
      return NextResponse.json(
        { error: 'Shop ID and date are required' },
        { status: 400 }
      );
    }

    // Parse the date
    const selectedDate = new Date(date);
    const dayStart = startOfDay(selectedDate);
    const dayEnd = endOfDay(selectedDate);

    // TODO: Get existing appointments from database
    // For now, we'll generate mock availability

    // Generate time slots based on business hours
    const slots = [];
    const startHour = 9; // 9 AM
    const endHour = 18; // 6 PM
    const slotInterval = 30; // 30 minutes

    const now = new Date();

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += slotInterval) {
        const slotTime = new Date(selectedDate);
        slotTime.setHours(hour, minute, 0, 0);
        
        // Don't show past time slots
        if (slotTime < now) {
          continue;
        }

        // Check if slot duration fits before closing time
        const slotEnd = addMinutes(slotTime, duration);
        const closingTime = new Date(selectedDate);
        closingTime.setHours(endHour, 0, 0, 0);
        
        if (slotEnd > closingTime) {
          continue;
        }

        // Mock availability (70% available)
        // In production, check against existing appointments
        const available = Math.random() > 0.3;

        slots.push({
          time: slotTime,
          available,
          barberId: barberId || null
        });
      }
    }

    return NextResponse.json({
      date: date,
      shopId,
      barberId,
      slots
    });

  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json(
      { error: 'Failed to fetch availability' },
      { status: 500 }
    );
  }
}