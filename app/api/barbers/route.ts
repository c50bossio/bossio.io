import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { user } from '@/lib/better-auth-schema';
import { shop, staff } from '@/lib/shop-schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const shopId = searchParams.get('shopId');
    
    if (!shopId) {
      return NextResponse.json(
        { error: 'Shop ID is required' },
        { status: 400 }
      );
    }

    // Fetch all active staff members (barbers) for the shop
    const barbers = await db
      .select({
        id: staff.id,
        name: user.name,
        email: user.email,
        role: staff.role,
        isActive: staff.isActive,
      })
      .from(staff)
      .leftJoin(user, eq(staff.userId, user.id))
      .where(eq(staff.shopId, shopId));

    return NextResponse.json({
      barbers: barbers.filter(b => b.isActive !== false).map(b => ({
        id: b.id,
        name: b.name || 'Staff Member',
        role: b.role
      }))
    });

  } catch (error) {
    console.error('Error fetching barbers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch barbers' },
      { status: 500 }
    );
  }
}