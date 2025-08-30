import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function getTestIds() {
  try {
    console.log('🔍 Getting test shop and service IDs...');

    // Get shop info
    const shops = await sql`
      SELECT id, name, slug FROM shop WHERE slug = 'blackstone-barbershop'
    `;
    
    if (shops.length === 0) {
      console.log('❌ No shop found with slug blackstone-barbershop');
      return;
    }

    const shop = shops[0];
    console.log(`\n📍 Shop: ${shop.name} (${shop.id})`);

    // Get services for this shop
    const services = await sql`
      SELECT id, name, price, duration FROM service WHERE shop_id = ${shop.id}
    `;

    console.log('\n🛠️ Services:');
    services.forEach(service => {
      console.log(`- ${service.name}: $${service.price} (${service.duration} min) - ID: ${service.id}`);
    });

    // Get staff for this shop
    const staff = await sql`
      SELECT s.id, u.name 
      FROM staff s 
      JOIN "user" u ON s.user_id = u.id 
      WHERE s.shop_id = ${shop.id}
    `;

    console.log('\n👥 Staff:');
    staff.forEach(member => {
      console.log(`- ${member.name} - ID: ${member.id}`);
    });

    // Return test data for API call
    const testData = {
      shopId: shop.id,
      serviceId: services[0]?.id,
      barberId: staff[0]?.id,
      serviceName: services[0]?.name
    };

    console.log('\n🧪 Test API Data:');
    console.log(JSON.stringify(testData, null, 2));

    return testData;
    
  } catch (error) {
    console.error('❌ Error getting test IDs:', error);
  }
}

getTestIds();