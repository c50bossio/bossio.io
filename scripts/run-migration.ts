import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config({ path: '.env.local' });

async function runMigration() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set');
  }

  const sql = neon(databaseUrl);
  
  try {
    console.log('🚀 Running migration: add guest fields to appointments table');
    
    // Run each migration statement separately using template literals
    console.log('Adding guest_name column...');
    await sql`ALTER TABLE appointments ADD COLUMN IF NOT EXISTS guest_name TEXT`;
    
    console.log('Adding guest_email column...');
    await sql`ALTER TABLE appointments ADD COLUMN IF NOT EXISTS guest_email TEXT`;
    
    console.log('Adding guest_phone column...');
    await sql`ALTER TABLE appointments ADD COLUMN IF NOT EXISTS guest_phone TEXT`;
    
    console.log('Making client_id nullable...');
    await sql`ALTER TABLE appointments ALTER COLUMN client_id DROP NOT NULL`;
    
    console.log('Creating index on guest_email...');
    await sql`CREATE INDEX IF NOT EXISTS idx_appointments_guest_email ON appointments(guest_email)`;
    
    // Skip the constraint for now as it might be too restrictive
    // We'll handle validation in the application layer
    
    console.log('✅ Migration completed successfully!');
    
    // Verify the changes
    const result = await sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'appointments' 
      AND column_name IN ('guest_name', 'guest_email', 'guest_phone', 'client_id')
      ORDER BY column_name;
    `;
    
    console.log('\n📊 Updated columns:');
    result.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run the migration
runMigration().catch(console.error);