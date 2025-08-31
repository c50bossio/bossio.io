// Test the appointments API endpoint
async function testAPI() {
  try {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const params = new URLSearchParams({
      startDate: today.toISOString(),
      endDate: tomorrow.toISOString()
    });
    
    console.log('Testing API with params:', params.toString());
    
    const response = await fetch(`http://localhost:3000/api/appointments?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    const text = await response.text();
    console.log('Raw response:', text);
    
    if (response.ok) {
      try {
        const data = JSON.parse(text);
        console.log('\nParsed data:');
        console.log('- Appointments:', data.appointments?.length || 0);
        console.log('- Stats:', data.stats);
        
        if (data.appointments?.length > 0) {
          console.log('\nFirst appointment:', data.appointments[0]);
        }
      } catch (e) {
        console.log('Failed to parse as JSON:', e.message);
      }
    }
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testAPI();