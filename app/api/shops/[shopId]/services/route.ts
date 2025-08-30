import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { service, staff } from '@/lib/shop-schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { eq, and } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  { params }: { params: { shopId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verify user has access to this shop
    const staffMember = await db
      .select()
      .from(staff)
      .where(
        and(
          eq(staff.shopId, params.shopId),
          eq(staff.userId, session.user.id)
        )
      );
    
    if (!staffMember.length) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    // Get services for this shop
    const services = await db
      .select()
      .from(service)
      .where(eq(service.shopId, params.shopId));
    
    return NextResponse.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { shopId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verify user has access to this shop
    const staffMember = await db
      .select()
      .from(staff)
      .where(
        and(
          eq(staff.shopId, params.shopId),
          eq(staff.userId, session.user.id)
        )
      );
    
    if (!staffMember.length) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    const data = await req.json();
    
    // Create service
    const [newService] = await db.insert(service).values({
      shopId: params.shopId,
      name: data.name,
      description: data.description || '',
      category: data.category,
      price: data.price,
      duration: data.duration,
      isActive: true,
    }).returning();
    
    return NextResponse.json(newService);
  } catch (error) {
    console.error('Error creating service:', error);
    return NextResponse.json(
      { error: 'Failed to create service' },
      { status: 500 }
    );
  }
}