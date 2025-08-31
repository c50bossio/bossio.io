import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config({ path: '.env.local' });

async function createAppointmentsTable() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set');
  }

  const sql = neon(databaseUrl);
  
  try {
    // First check if table exists
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    
    console.log('Existing tables:', tables.map(t => t.table_name));
    
    // Create shop table if not exists (required for foreign key)
    console.log('Creating shop table if not exists...');
    await sql`
      CREATE TABLE IF NOT EXISTS shop (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT,
        owner_id TEXT REFERENCES "user"(id),
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
        business_hours JSONB DEFAULT '{"monday":{"open":"09:00","close":"18:00","closed":false},"tuesday":{"open":"09:00","close":"18:00","closed":false},"wednesday":{"open":"09:00","close":"18:00","closed":false},"thursday":{"open":"09:00","close":"18:00","closed":false},"friday":{"open":"09:00","close":"18:00","closed":false},"saturday":{"open":"09:00","close":"16:00","closed":false},"sunday":{"closed":true}}',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    
    // Create service table if not exists
    console.log('Creating service table if not exists...');
    await sql`
      CREATE TABLE IF NOT EXISTS service (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        shop_id TEXT NOT NULL REFERENCES shop(id),
        name TEXT NOT NULL,
        description TEXT,
        category TEXT,
        price DECIMAL(10, 2) NOT NULL,
        duration INTEGER NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    
    // Create staff table if not exists
    console.log('Creating staff table if not exists...');
    await sql`
      CREATE TABLE IF NOT EXISTS staff (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        shop_id TEXT NOT NULL REFERENCES shop(id),
        user_id TEXT NOT NULL REFERENCES "user"(id),
        role TEXT DEFAULT 'barber',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    
    // Create clients table if not exists
    console.log('Creating clients table if not exists...');
    await sql`
      CREATE TABLE IF NOT EXISTS clients (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        shop_id TEXT NOT NULL REFERENCES shop(id),
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        preferred_barber_id TEXT REFERENCES "user"(id),
        notes TEXT,
        allergies TEXT,
        email_notifications BOOLEAN DEFAULT true,
        sms_notifications BOOLEAN DEFAULT true,
        is_active BOOLEAN DEFAULT true,
        total_visits INTEGER DEFAULT 0,
        total_spent DECIMAL(10, 2) DEFAULT 0,
        last_visit TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    
    // Create appointments table with guest fields
    console.log('Creating appointments table with guest fields...');
    await sql`
      CREATE TABLE IF NOT EXISTS appointments (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        shop_id TEXT NOT NULL REFERENCES shop(id),
        service_id TEXT NOT NULL REFERENCES service(id),
        barber_id TEXT REFERENCES staff(id),
        client_id TEXT REFERENCES clients(id),
        
        -- Guest booking fields
        guest_name TEXT,
        guest_email TEXT,
        guest_phone TEXT,
        
        -- Scheduling
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL,
        duration INTEGER NOT NULL,
        
        -- Booking details
        price DECIMAL(10, 2) NOT NULL,
        status TEXT DEFAULT 'scheduled' NOT NULL,
        payment_status TEXT DEFAULT 'pending' NOT NULL,
        payment_method TEXT,
        
        notes TEXT,
        internal_notes TEXT,
        
        -- Reminder tracking
        reminder_sent TIMESTAMP,
        confirmation_sent TIMESTAMP,
        
        -- Soft delete support
        deleted_at TIMESTAMP,
        
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    
    // Create index on guest_email
    console.log('Creating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_appointments_guest_email ON appointments(guest_email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_appointments_shop_id ON appointments(shop_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_appointments_start_time ON appointments(start_time)`;
    
    console.log('✅ All tables created successfully!');
    
    // Verify the appointments table structure
    const columns = await sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'appointments'
      ORDER BY ordinal_position;
    `;
    
    console.log('\n📊 Appointments table columns:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
  } catch (error) {
    console.error('❌ Table creation failed:', error);
    throw error;
  }
}

// Run the script
createAppointmentsTable().catch(console.error);