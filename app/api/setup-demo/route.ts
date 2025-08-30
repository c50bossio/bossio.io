import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { shop, service, staff } from '@/lib/shop-schema';
import { user } from '@/lib/better-auth-schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  // Simple security check - only allow in development or with secret key
  const { searchParams } = new URL(request.url);
  const secretKey = searchParams.get('key');
  
  if (process.env.NODE_ENV === 'production' && secretKey !== 'setup-demo-2024') {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Check if demo shop already exists
    const existingShops = await db
      .select()
      .from(shop)
      .where(eq(shop.slug, 'demo-shop'))
      .limit(1);
    
    if (existingShops.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Demo shop already exists',
        shopId: existingShops[0].id,
        shopUrl: '/book/demo-shop'
      });
    }

    // Create demo owner
    let demoOwner;
    const existingUsers = await db
      .select()
      .from(user)
      .where(eq(user.email, 'demo@bossio.io'))
      .limit(1);
    
    if (existingUsers.length > 0) {
      demoOwner = existingUsers[0];
    } else {
      const [newUser] = await db
        .insert(user)
        .values({
          name: 'Demo Owner',
          email: 'demo@bossio.io',
        })
        .returning();
      demoOwner = newUser;
    }

    // Create demo shop
    const [demoShop] = await db
      .insert(shop)
      .values({
        name: 'Demo Barbershop',
        slug: 'demo-shop',
        description: 'Experience our premium booking system',
        ownerId: demoOwner.id,
        phone: '(555) 123-4567',
        email: 'demo@bossio.io',
        address: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94102',
        timezone: 'America/Los_Angeles',
        businessHours: {
          monday: { open: "09:00", close: "18:00", closed: false },
          tuesday: { open: "09:00", close: "18:00", closed: false },
          wednesday: { open: "09:00", close: "18:00", closed: false },
          thursday: { open: "09:00", close: "18:00", closed: false },
          friday: { open: "09:00", close: "18:00", closed: false },
          saturday: { open: "10:00", close: "16:00", closed: false },
          sunday: { closed: true }
        }
      })
      .returning();

    // Create services
    await db
      .insert(service)
      .values([
        {
          shopId: demoShop.id,
          name: 'Classic Haircut',
          description: 'Traditional barber haircut',
          category: 'haircut',
          price: '35.00',
          duration: 30,
          isActive: true,
        },
        {
          shopId: demoShop.id,
          name: 'Beard Trim',
          description: 'Professional beard shaping',
          category: 'beard',
          price: '20.00',
          duration: 15,
          isActive: true,
        },
        {
          shopId: demoShop.id,
          name: 'Full Service',
          description: 'Haircut + beard + hot towel',
          category: 'combo',
          price: '50.00',
          duration: 45,
          isActive: true,
        }
      ]);

    return NextResponse.json({
      success: true,
      message: 'Demo shop created successfully',
      shopId: demoShop.id,
      shopUrl: '/book/demo-shop'
    });

  } catch (error) {
    console.error('Setup demo error:', error);
    return NextResponse.json(
      { error: 'Failed to setup demo', details: error },
      { status: 500 }
    );
  }
}