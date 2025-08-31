// Test the appointment modal behavior
import puppeteer from 'puppeteer';

async function testAppointmentModal() {
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true 
  });
  const page = await browser.newPage();

  // Enable console logging
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Checking availability') || text.includes('Availability data received') || text.includes('useEffect triggered')) {
      console.log('Browser console:', text);
    }
  });

  // Monitor network requests
  page.on('request', request => {
    if (request.url().includes('/api/appointments/availability')) {
      console.log('🌐 Availability API called:', request.url());
    }
  });

  page.on('response', response => {
    if (response.url().includes('/api/appointments/availability')) {
      response.json().then(data => {
        console.log('📦 Availability API response:', {
          status: response.status(),
          totalSlots: data.summary?.totalSlots,
          availableSlots: data.summary?.availableSlots,
          bookedSlots: data.summary?.bookedSlots
        });
      }).catch(() => {});
    }
  });

  try {
    console.log('📍 Navigating to calendar page...');
    await page.goto('http://localhost:3000/dashboard/calendar', { 
      waitUntil: 'networkidle0' 
    });

    // Check if we need to login
    const loginButton = await page.$('[text*="Login with Google"]');
    if (loginButton) {
      console.log('❌ Login required - calendar requires authentication');
      console.log('Please login manually and then we can test the modal');
      
      // For testing purposes, let's try to directly test the API
      console.log('\n📝 Testing API directly without authentication...');
      
      // Test the availability API directly
      const response = await page.evaluate(async () => {
        const shopId = '6ac05b41-85e2-4b3e-9985-e5c7ad813684';
        const date = '2025-08-31';
        const serviceId = 'cf7564f7-7a86-431f-89e1-15a7fcd3d15f';
        
        const params = new URLSearchParams({
          date: date,
          shopId: shopId,
          serviceId: serviceId,
          barberId: 'any'
        });
        
        try {
          const response = await fetch(`/api/appointments/availability?${params}`);
          const data = await response.json();
          return {
            success: response.ok,
            status: response.status,
            data: data
          };
        } catch (error) {
          return {
            success: false,
            error: error.message
          };
        }
      });
      
      console.log('API Test Result:', response);
      
      if (response.success && response.data) {
        console.log('Available slots:', response.data.summary.availableSlots, 'of', response.data.summary.totalSlots);
        
        // Show which times are booked
        const bookedTimes = response.data.timeSlots
          .filter(slot => !slot.isAvailable)
          .map(slot => slot.time);
        
        console.log('Booked times:', bookedTimes);
      }
    } else {
      console.log('✅ Already logged in or modal is accessible');
      
      // Look for the New Appointment button
      const newAppointmentButton = await page.$('button:has-text("New Appointment")');
      if (newAppointmentButton) {
        console.log('📱 Opening appointment modal...');
        await newAppointmentButton.click();
        await page.waitForTimeout(1000);
        
        // Check if modal opened
        const modalTitle = await page.$('h2:has-text("New Appointment")');
        if (modalTitle) {
          console.log('✅ Modal opened successfully');
          
          // Get the current availability display
          const availabilityText = await page.$eval(
            'p.text-xs.text-muted-foreground',
            el => el.textContent
          ).catch(() => null);
          
          console.log('Current availability display:', availabilityText);
          
          // Now select a service
          console.log('🔄 Selecting a service...');
          
          // Click on service dropdown
          const serviceDropdown = await page.$('[role="combobox"]');
          if (serviceDropdown) {
            await serviceDropdown.click();
            await page.waitForTimeout(500);
            
            // Select first service
            const firstService = await page.$('[role="option"]');
            if (firstService) {
              await firstService.click();
              console.log('✅ Service selected');
              
              // Wait for availability to update
              await page.waitForTimeout(2000);
              
              // Check new availability
              const newAvailabilityText = await page.$eval(
                'p.text-xs.text-muted-foreground',
                el => el.textContent
              ).catch(() => null);
              
              console.log('Updated availability display:', newAvailabilityText);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error during test:', error);
  }

  // Keep browser open for manual inspection
  console.log('\n🔍 Browser will stay open for manual inspection. Press Ctrl+C to close.');
}

testAppointmentModal().catch(console.error);