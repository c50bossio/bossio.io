import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config({ path: '.env.local' });

async function testAppointmentsAPI() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set');
  }

  const sql = neon(databaseUrl);
  
  try {
    // First, let's check if we have any data in our tables
    console.log('🔍 Checking database state...\n');
    
    // Check shops
    const shops = await sql`SELECT id, name, slug FROM shop LIMIT 5`;
    console.log(`Shops (${shops.length}):`, shops);
    
    // Check services
    const services = await sql`SELECT id, name, price FROM service LIMIT 5`;
    console.log(`\nServices (${services.length}):`, services);
    
    // Check appointments
    const appointmentsCount = await sql`SELECT COUNT(*) as count FROM appointments`;
    console.log(`\nTotal appointments: ${appointmentsCount[0].count}`);
    
    // Check appointments with details
    const appointmentsList = await sql`
      SELECT 
        a.id,
        a.guest_name,
        a.guest_email,
        a.guest_phone,
        a.start_time,
        a.end_time,
        a.status,
        a.price,
        s.name as service_name,
        sh.name as shop_name
      FROM appointments a
      LEFT JOIN service s ON a.service_id = s.id
      LEFT JOIN shop sh ON a.shop_id = sh.id
      ORDER BY a.start_time DESC
      LIMIT 10
    `;
    
    console.log(`\nRecent appointments (${appointmentsList.length}):`);
    appointmentsList.forEach(apt => {
      console.log(`  - ${apt.guest_name || 'Unknown'} | ${apt.service_name || 'N/A'} | ${apt.start_time} | Status: ${apt.status}`);
    });
    
    // If no appointments, create a test one
    if (appointmentsCount[0].count === '0') {
      console.log('\n📝 No appointments found. Creating a test appointment...');
      
      // Get first shop and service
      const firstShop = shops[0];
      const firstService = services[0];
      
      if (firstShop && firstService) {
        const testAppointment = await sql`
          INSERT INTO appointments (
            shop_id,
            service_id,
            guest_name,
            guest_email,
            guest_phone,
            start_time,
            end_time,
            duration,
            price,
            status,
            payment_status
          ) VALUES (
            ${firstShop.id},
            ${firstService.id},
            'Test Customer',
            'test@example.com',
            '555-0123',
            NOW() + INTERVAL '1 hour',
            NOW() + INTERVAL '2 hours',
            60,
            ${firstService.price},
            'scheduled',
            'pending'
          )
          RETURNING id
        `;
        
        console.log('✅ Test appointment created:', testAppointment[0].id);
      } else {
        console.log('⚠️ No shops or services found. Need to set up test data first.');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// Run the test
testAppointmentsAPI().catch(console.error);