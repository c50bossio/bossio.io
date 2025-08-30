#!/usr/bin/env node

// Test booking with correct production IDs
const testBooking = async () => {
  const bookingData = {
    shopId: "test-shop-1756568379170",
    barberId: "925cdca8-857a-4711-80d7-68517996dde8", 
    serviceId: "752cd15e-bc87-4afd-a9df-74d27acce8c8", // Classic Haircut
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    duration: 45,
    clientName: "Test Customer",
    clientEmail: "test@example.com",
    clientPhone: "+1234567890"
  };

  console.log('📋 Testing booking with data:');
  console.log(JSON.stringify(bookingData, null, 2));
  console.log('\n🚀 Sending request to production...\n');

  try {
    const response = await fetch('https://bossio.io/api/public/appointments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingData)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Booking successful!');
      console.log('Appointment ID:', result.appointment?.id);
    } else {
      console.error('❌ Booking failed:', response.status);
      console.error('Error:', result.error || result.message || 'Unknown error');
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
};

testBooking();