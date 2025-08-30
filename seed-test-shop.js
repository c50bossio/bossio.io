import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { config } from 'dotenv';

config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

async function seedTestShop() {
  try {
    console.log('🌱 Seeding test shop...');

    // First, create a test user (owner)
    const testUserId = 'test-owner-' + Date.now();
    await sql`
      INSERT INTO "user" (id, email, name, email_verified) 
      VALUES (${testUserId}, 'owner@testshop.com', 'Test Owner', true)
      ON CONFLICT (email) DO UPDATE SET id = ${testUserId}
    `;

    // Create test shop
    const shopId = 'test-shop-' + Date.now();
    await sql`
      INSERT INTO shop (id, name, slug, description, owner_id, phone, email, address, city, state, zip_code)
      VALUES (
        ${shopId},
        'Blackstone Barbershop',
        'blackstone-barbershop',
        'Premium barbershop with expert stylists',
        ${testUserId},
        '(555) 123-4567',
        'info@blackstonebarbershop.com',
        '123 Main Street',
        'New York',
        'NY',
        '10001'
      )
      ON CONFLICT (slug) DO UPDATE SET 
        name = 'Blackstone Barbershop',
        description = 'Premium barbershop with expert stylists'
    `;

    // Create test services
    await sql`
      INSERT INTO service (shop_id, name, description, category, price, duration)
      VALUES 
        (${shopId}, 'Classic Haircut', 'Traditional haircut with styling', 'haircut', 35.00, 45),
        (${shopId}, 'Beard Trim', 'Professional beard trimming and shaping', 'shave', 25.00, 30),
        (${shopId}, 'Hot Towel Shave', 'Traditional hot towel shave experience', 'shave', 45.00, 60),
        (${shopId}, 'Haircut + Beard', 'Complete grooming package', 'combo', 55.00, 75)
      ON CONFLICT DO NOTHING
    `;

    // Create test staff member (barber)
    const barberId = 'test-barber-' + Date.now();
    await sql`
      INSERT INTO "user" (id, email, name, email_verified) 
      VALUES (${barberId}, 'barber@testshop.com', 'Mike Johnson', true)
      ON CONFLICT (email) DO UPDATE SET id = ${barberId}
    `;

    await sql`
      INSERT INTO staff (shop_id, user_id, role, is_active)
      VALUES (${shopId}, ${barberId}, 'barber', true)
      ON CONFLICT DO NOTHING
    `;

    console.log('✅ Test shop "blackstone-barbershop" created successfully!');
    console.log('📍 You can now visit: https://bossio.io/book/blackstone-barbershop');
    console.log('');
    console.log('Test Data Created:');
    console.log('- Shop: Blackstone Barbershop');
    console.log('- Services: Classic Haircut ($35), Beard Trim ($25), Hot Towel Shave ($45), Haircut + Beard ($55)');
    console.log('- Staff: Mike Johnson (Barber)');
    
  } catch (error) {
    console.error('❌ Error seeding test shop:', error);
  }
}

seedTestShop();