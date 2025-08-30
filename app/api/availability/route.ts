import { NextRequest, NextResponse } from 'next/server';
import { getAvailableSlots } from '@/lib/appointment-service';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Get current user session
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const barberId = searchParams.get('barberId') || session.user.id;
    const duration = parseInt(searchParams.get('duration') || '30');
    const shopId = session.user.shopId;

    if (!shopId) {
      return NextResponse.json({ error: 'Shop ID required' }, { status: 400 });
    }

    if (!date) {
      return NextResponse.json(
        { error: 'Date is required' },
        { status: 400 }
      );
    }

    const availableSlots = await getAvailableSlots(
      shopId,
      barberId,
      new Date(date),
      duration
    );

    return NextResponse.json({ 
      date,
      barberId,
      duration,
      slots: availableSlots
    });

  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json(
      { error: 'Failed to fetch availability' },
      { status: 500 }
    );
  }
}