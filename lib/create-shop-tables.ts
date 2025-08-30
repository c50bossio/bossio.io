import { db } from './database';
import { sql } from 'drizzle-orm';

async function createShopTables() {
  console.log('Creating shop tables...');
  
  try {
    // Create shop table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS shop (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT,
        owner_id TEXT NOT NULL REFERENCES "user"(id),
        phone TEXT,
        email TEXT,
        website TEXT,
        address TEXT,
        city TEXT,
        state TEXT,
        zip_code TEXT,
        country TEXT DEFAULT 'US',
        timezone TEXT DEFAULT 'America/New_York',
        currency TEXT DEFAULT 'USD',
        business_hours JSONB DEFAULT '{"monday":{"open":"09:00","close":"18:00","closed":false},"tuesday":{"open":"09:00","close":"18:00","closed":false},"wednesday":{"open":"09:00","close":"18:00","closed":false},"thursday":{"open":"09:00","close":"18:00","closed":false},"friday":{"open":"09:00","close":"18:00","closed":false},"saturday":{"open":"09:00","close":"16:00","closed":false},"sunday":{"closed":true}}'::jsonb,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    
    // Create service table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS service (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        shop_id TEXT NOT NULL REFERENCES shop(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT,
        price DECIMAL(10, 2) NOT NULL,
        duration INTEGER NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    
    // Create staff table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS staff (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        shop_id TEXT NOT NULL REFERENCES shop(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        role TEXT DEFAULT 'barber',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        UNIQUE(shop_id, user_id)
      )
    `);
    
    console.log('✅ Shop tables created successfully!');
  } catch (error) {
    console.error('Error creating tables:', error);
    process.exit(1);
  }
}

createShopTables();