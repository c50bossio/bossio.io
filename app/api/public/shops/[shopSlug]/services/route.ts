import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { shop, service } from '@/lib/shop-schema';
import { eq } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  { params }: { params: { shopSlug: string } }
) {
  try {
    // First get the shop by slug
    const shops = await db
      .select()
      .from(shop)
      .where(eq(shop.slug, params.shopSlug))
      .limit(1);

    if (!shops.length) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      );
    }

    // Get active services for this shop
    const services = await db
      .select()
      .from(service)
      .where(eq(service.shopId, shops[0].id));

    // Filter to only active services and format for public consumption
    const publicServices = services
      .filter(s => s.isActive)
      .map(s => ({
        id: s.id,
        name: s.name,
        description: s.description,
        category: s.category,
        price: s.price,
        duration: s.duration,
      }));

    return NextResponse.json(publicServices);
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    );
  }
}