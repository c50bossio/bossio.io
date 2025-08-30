import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { shop, staff } from '@/lib/shop-schema';
import { user } from '@/lib/better-auth-schema';
import { eq } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ shopSlug: string }> }
) {
  try {
    const { shopSlug } = await params;
    // First get the shop by slug
    const shops = await db
      .select()
      .from(shop)
      .where(eq(shop.slug, shopSlug))
      .limit(1);

    if (!shops.length) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      );
    }

    // Get active staff members for this shop
    const barbers = await db
      .select({
        id: staff.id,  // Use staff.id instead of user.id for appointment references
        userId: user.id,
        name: user.name,
        image: user.image,
        role: staff.role,
      })
      .from(staff)
      .innerJoin(user, eq(staff.userId, user.id))
      .where(eq(staff.shopId, shops[0].id));

    // Format for public consumption
    const publicBarbers = barbers
      .filter(b => b.role === 'barber' || b.role === 'owner')
      .map(b => ({
        id: b.id,  // This will now be the staff.id
        name: b.name || 'Barber',
        image: b.image,
        bio: `Professional barber`, // You can add a bio field to the user table later
      }));

    return NextResponse.json(publicBarbers);
  } catch (error) {
    console.error('Error fetching barbers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch barbers' },
      { status: 500 }
    );
  }
}