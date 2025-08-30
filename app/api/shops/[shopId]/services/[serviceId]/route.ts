import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { service, staff } from '@/lib/shop-schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { eq, and } from 'drizzle-orm';

// Update a service
export async function PUT(
  req: NextRequest,
  { params }: { params: { shopId: string; serviceId: string } }
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
    
    // Update service
    const [updatedService] = await db
      .update(service)
      .set({
        name: data.name,
        description: data.description,
        category: data.category,
        price: data.price,
        duration: data.duration,
        isActive: data.isActive !== undefined ? data.isActive : true,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(service.id, params.serviceId),
          eq(service.shopId, params.shopId)
        )
      )
      .returning();
    
    if (!updatedService) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }
    
    return NextResponse.json(updatedService);
  } catch (error) {
    console.error('Error updating service:', error);
    return NextResponse.json(
      { error: 'Failed to update service' },
      { status: 500 }
    );
  }
}

// Delete a service
export async function DELETE(
  req: NextRequest,
  { params }: { params: { shopId: string; serviceId: string } }
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
    
    // Delete service
    const [deletedService] = await db
      .delete(service)
      .where(
        and(
          eq(service.id, params.serviceId),
          eq(service.shopId, params.shopId)
        )
      )
      .returning();
    
    if (!deletedService) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, deletedService });
  } catch (error) {
    console.error('Error deleting service:', error);
    return NextResponse.json(
      { error: 'Failed to delete service' },
      { status: 500 }
    );
  }
}

// Toggle service active status
export async function PATCH(
  req: NextRequest,
  { params }: { params: { shopId: string; serviceId: string } }
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
    
    // Toggle active status
    const [updatedService] = await db
      .update(service)
      .set({
        isActive: data.isActive,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(service.id, params.serviceId),
          eq(service.shopId, params.shopId)
        )
      )
      .returning();
    
    if (!updatedService) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }
    
    return NextResponse.json(updatedService);
  } catch (error) {
    console.error('Error toggling service status:', error);
    return NextResponse.json(
      { error: 'Failed to toggle service status' },
      { status: 500 }
    );
  }
}