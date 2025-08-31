import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { service, shop } from '@/lib/shop-schema';
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

    // Fetch all active services for the shop
    const services = await db
      .select({
        id: service.id,
        name: service.name,
        description: service.description,
        category: service.category,
        price: service.price,
        duration: service.duration,
        isActive: service.isActive,
      })
      .from(service)
      .where(eq(service.shopId, shopId));

    return NextResponse.json({
      services: services.filter(s => s.isActive !== false)
    });

  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    );
  }
}