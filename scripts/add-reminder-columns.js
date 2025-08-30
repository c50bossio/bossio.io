import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function addReminderColumns() {
  try {
    console.log('🔄 Adding reminder tracking columns to appointment table...');
    
    // Add reminder tracking columns
    await sql`
      ALTER TABLE appointment 
      ADD COLUMN IF NOT EXISTS reminder_sent TIMESTAMP,
      ADD COLUMN IF NOT EXISTS confirmation_sent TIMESTAMP
    `;
    
    console.log('✅ Successfully added reminder tracking columns:');
    console.log('   - reminder_sent (24-hour reminder timestamp)');
    console.log('   - confirmation_sent (2-hour reminder timestamp)');
    console.log('');
    
    // Verify the columns were added
    const tableInfo = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'appointment' 
      AND column_name IN ('reminder_sent', 'confirmation_sent')
      ORDER BY column_name
    `;
    
    console.log('📋 Verified columns:');
    tableInfo.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    console.log('');
    console.log('🎉 Reminder system database setup complete!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Test the SMS system by booking an appointment');
    console.log('2. Use /api/reminders/send?action=trigger to test reminders');
    console.log('3. Set up a cron job to run reminders automatically');

  } catch (error) {
    console.error('❌ Error adding reminder columns:', error);
    process.exit(1);
  }
}

addReminderColumns();