import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { shop, staff } from '@/lib/shop-schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const data = await req.json();
    
    // Generate slug from name
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    // Create shop
    const [newShop] = await db.insert(shop).values({
      ...data,
      slug,
      ownerId: session.user.id,
    }).returning();
    
    // Add owner as staff member
    await db.insert(staff).values({
      shopId: newShop.id,
      userId: session.user.id,
      role: 'owner',
    });
    
    return NextResponse.json(newShop);
  } catch (error) {
    console.error('Error creating shop:', error);
    return NextResponse.json(
      { error: 'Failed to create shop' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get shops where user is owner or staff
    const userShops = await db
      .select({
        shop: shop,
        role: staff.role,
      })
      .from(shop)
      .innerJoin(staff, eq(shop.id, staff.shopId))
      .where(eq(staff.userId, session.user.id));
    
    return NextResponse.json(userShops);
  } catch (error) {
    console.error('Error fetching shops:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shops' },
      { status: 500 }
    );
  }
}