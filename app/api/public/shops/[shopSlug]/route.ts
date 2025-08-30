import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { shop } from '@/lib/shop-schema';
import { eq } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  { params }: { params: { shopSlug: string } }
) {
  try {
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

    const shopData = shops[0];
    
    // Don't expose sensitive data
    const publicShopData = {
      id: shopData.id,
      name: shopData.name,
      description: shopData.description,
      address: shopData.address,
      city: shopData.city,
      state: shopData.state,
      zipCode: shopData.zipCode,
      country: shopData.country,
      phone: shopData.phone,
      email: shopData.email,
      website: shopData.website,
      businessHours: shopData.businessHours,
      timezone: shopData.timezone,
    };

    return NextResponse.json(publicShopData);
  } catch (error) {
    console.error('Error fetching shop:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shop' },
      { status: 500 }
    );
  }
}