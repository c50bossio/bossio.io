// This script sets up demo data in production
// Run with: npx tsx scripts/setup-production-demo.ts

import { db } from '@/lib/database';
import { shop, service, staff } from '@/lib/shop-schema';
import { user } from '@/lib/better-auth-schema';
import { eq } from 'drizzle-orm';

async function setupProductionDemo() {
  console.log('🚀 Setting up production demo data...');
  
  try {
    // Check if demo shop already exists
    const existingShops = await db
      .select()
      .from(shop)
      .where(eq(shop.slug, 'demo-shop'))
      .limit(1);
    
    if (existingShops.length > 0) {
      console.log('✅ Demo shop already exists!');
      console.log('Shop ID:', existingShops[0].id);
      return existingShops[0];
    }

    // Create or find demo owner user
    let demoOwner;
    const existingUsers = await db
      .select()
      .from(user)
      .where(eq(user.email, 'demo@bossio.io'))
      .limit(1);
    
    if (existingUsers.length > 0) {
      demoOwner = existingUsers[0];
      console.log('Using existing demo user:', demoOwner.id);
    } else {
      const [newUser] = await db
        .insert(user)
        .values({
          name: 'Demo Owner',
          email: 'demo@bossio.io',
        })
        .returning();
      demoOwner = newUser;
      console.log('Created demo user:', demoOwner.id);
    }

    // Create demo shop
    const [demoShop] = await db
      .insert(shop)
      .values({
        name: 'Demo Barbershop',
        slug: 'demo-shop',
        description: 'Experience our premium booking system with this demo barbershop',
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

    console.log('✅ Created demo shop:', demoShop.id);

    // Create demo services
    const services = await db
      .insert(service)
      .values([
        {
          shopId: demoShop.id,
          name: 'Classic Haircut',
          description: 'Traditional barber haircut with precision styling',
          category: 'haircut',
          price: '35.00',
          duration: 30,
          isActive: true,
        },
        {
          shopId: demoShop.id,
          name: 'Beard Trim',
          description: 'Professional beard trimming and shaping',
          category: 'beard',
          price: '20.00',
          duration: 15,
          isActive: true,
        },
        {
          shopId: demoShop.id,
          name: 'Full Service',
          description: 'Haircut + beard trim + hot towel treatment',
          category: 'combo',
          price: '50.00',
          duration: 45,
          isActive: true,
        },
        {
          shopId: demoShop.id,
          name: 'Kids Haircut',
          description: 'Gentle haircut for children under 12',
          category: 'haircut',
          price: '25.00',
          duration: 20,
          isActive: true,
        }
      ])
      .returning();

    console.log('✅ Created', services.length, 'demo services');

    // Create demo barbers (optional - for "any available" we don't need specific barbers)
    // But let's create a few for demonstration
    const barber1 = await db
      .insert(user)
      .values({
        name: 'John Smith',
        email: 'john@demo.bossio.io',
      })
      .returning();

    const barber2 = await db
      .insert(user)
      .values({
        name: 'Mike Johnson',
        email: 'mike@demo.bossio.io',
      })
      .returning();

    // Add them as staff
    await db
      .insert(staff)
      .values([
        {
          shopId: demoShop.id,
          userId: barber1[0].id,
          role: 'barber',
        },
        {
          shopId: demoShop.id,
          userId: barber2[0].id,
          role: 'barber',
        }
      ]);

    console.log('✅ Created demo barbers');

    console.log('\n🎉 Production demo setup complete!');
    console.log('Demo shop available at: https://bossio.io/book/demo-shop');
    
    return demoShop;

  } catch (error) {
    console.error('❌ Error setting up demo data:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

// Run the setup
setupProductionDemo()
  .then(() => {
    console.log('✅ Setup completed successfully');
  })
  .catch((error) => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  });