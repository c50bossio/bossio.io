import { db } from '@/lib/database';
import { shop, service } from '@/lib/shop-schema';
import { user } from '@/lib/better-auth-schema';
import { eq } from 'drizzle-orm';

async function createTestShop() {
  try {
    // Check if shop already exists
    const existingShops = await db.select().from(shop).where(eq(shop.slug, 'demo-shop')).limit(1);
    
    if (existingShops.length > 0) {
      console.log('Test shop already exists! Visit: http://localhost:3000/book/demo-shop');
      return;
    }

    // Check for existing user or create one
    let testUser;
    const existingUsers = await db.select().from(user).where(eq(user.email, 'owner@testshop.com')).limit(1);
    
    if (existingUsers.length > 0) {
      testUser = existingUsers[0];
      console.log('Using existing test user:', testUser.id);
    } else {
      const [newUser] = await db.insert(user).values({
        name: 'Test Owner',
        email: 'owner@testshop.com',
      }).returning();
      testUser = newUser;
      console.log('Created test user:', testUser.id);
    }

    // Create test shop
    const [testShop] = await db.insert(shop).values({
      name: 'Demo Barbershop',
      slug: 'demo-shop',
      description: 'A test barbershop for demonstration',
      ownerId: testUser.id,
      phone: '(555) 123-4567',
      email: 'demo@testshop.com',
      address: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      zipCode: '90210',
      timezone: 'America/Los_Angeles',
    }).returning();

    console.log('Created test shop:', testShop.id);

    // Create test services
    const services = await db.insert(service).values([
      {
        shopId: testShop.id,
        name: 'Classic Haircut',
        description: 'Traditional barber haircut',
        category: 'haircut',
        price: '25.00',
        duration: 30,
        isActive: true,
      },
      {
        shopId: testShop.id,
        name: 'Beard Trim',
        description: 'Professional beard trimming and styling',
        category: 'beard',
        price: '15.00',
        duration: 15,
        isActive: true,
      },
      {
        shopId: testShop.id,
        name: 'Full Service',
        description: 'Haircut + beard trim + hot towel',
        category: 'combo',
        price: '35.00',
        duration: 45,
        isActive: true,
      }
    ]).returning();

    console.log('Created services:', services.length);

    console.log('Test shop setup complete! Visit: http://localhost:3000/book/demo-shop');
  } catch (error) {
    console.error('Error creating test data:', error);
  }
}

createTestShop();