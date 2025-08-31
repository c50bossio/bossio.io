// Script to create a test appointment at 6:00 PM
import { db } from './lib/database.js';
import { appointment } from './lib/shop-schema.js';

async function create6PMAppointment() {
  const today = new Date('2025-08-31');
  
  // Create 6:00 PM appointment (in EDT, which is UTC-4)
  const startTime = new Date('2025-08-31T18:00:00-04:00'); // 6:00 PM EDT
  const endTime = new Date('2025-08-31T18:45:00-04:00');   // 6:45 PM EDT
  
  const newAppointment = {
    id: 'test-6pm-' + Date.now(),
    shopId: '6ac05b41-85e2-4b3e-9985-e5c7ad813684',
    serviceId: 'cf7564f7-7a86-431f-89e1-15a7fcd3d15f', // Basic Haircut
    barberId: '9ad8ac89-5432-4321-8765-abcdef123456',
    startTime: startTime,
    endTime: endTime,
    duration: 45,
    clientId: null,
    guestName: 'Test Customer 6PM',
    guestEmail: 'test6pm@example.com',
    guestPhone: '555-0106',
    price: '35.00',
    status: 'scheduled',
    paymentStatus: 'pending',
    paymentMethod: 'cash',
    notes: 'Test appointment to verify 6PM blocking',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  console.log('Creating appointment:', {
    time: '6:00 PM EDT',
    startTimeUTC: startTime.toISOString(),
    endTimeUTC: endTime.toISOString(),
    startTimeLocal: startTime.toLocaleString('en-US', { timeZone: 'America/New_York' }),
    endTimeLocal: endTime.toLocaleString('en-US', { timeZone: 'America/New_York' })
  });
  
  try {
    const result = await db.insert(appointment).values(newAppointment);
    console.log('✅ Appointment created successfully!');
    console.log('ID:', newAppointment.id);
    return result;
  } catch (error) {
    console.error('❌ Error creating appointment:', error);
  }
}

create6PMAppointment().then(() => process.exit(0));