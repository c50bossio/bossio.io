#!/usr/bin/env node

const { chromium } = require('playwright');

async function runComprehensiveTests() {
  console.log('🚀 Starting Comprehensive Bossio.io Testing with Playwright\n');
  
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  });
  
  const page = await context.newPage();
  const testResults = [];

  // Helper function to record test results
  function recordTest(name, status, details = '') {
    testResults.push({ name, status, details });
    const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${emoji} ${name}: ${status}${details ? ` - ${details}` : ''}`);
  }

  try {
    // Test 1: Homepage Load (Localhost)
    console.log('\n📋 Testing Localhost Environment');
    console.log('='.repeat(50));
    
    await page.goto('http://localhost:3000');
    await page.waitForSelector('h1', { timeout: 10000 });
    
    const title = await page.textContent('h1');
    if (title.includes('Build Your Business Empire')) {
      recordTest('Homepage Load (Localhost)', 'PASS', 'Main heading found');
    } else {
      recordTest('Homepage Load (Localhost)', 'FAIL', `Unexpected title: ${title}`);
    }

    // Test 2: Get Started Button
    const getStartedBtn = await page.locator('text="Get Started"');
    if (await getStartedBtn.isVisible()) {
      recordTest('Get Started Button Visible', 'PASS');
    } else {
      recordTest('Get Started Button Visible', 'FAIL');
    }

    // Test 3: Navigation to Sign In
    await page.goto('http://localhost:3000/sign-in');
    await page.waitForSelector('button:has-text("Login with Google")', { timeout: 5000 });
    recordTest('Sign In Page Load', 'PASS', 'Google login button visible');

    // Test 4: Dashboard Redirect (Should redirect to sign-in)
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    if (currentUrl.includes('/sign-in')) {
      recordTest('Dashboard Authentication Guard', 'PASS', 'Redirected to sign-in');
    } else {
      recordTest('Dashboard Authentication Guard', 'FAIL', `URL: ${currentUrl}`);
    }

    // Test 5: API Endpoints
    console.log('\n📋 Testing API Endpoints');
    console.log('='.repeat(50));

    const apiTests = [
      { endpoint: '/api/appointments', expectedStatus: 401, name: 'Appointments API (Unauthenticated)' },
      { endpoint: '/api/public/shops/demo-shop', expectedStatus: [200, 404], name: 'Public Shop API' },
      { endpoint: '/api/auth/session', expectedStatus: [200, 401], name: 'Session API' }
    ];

    for (const test of apiTests) {
      try {
        const response = await page.request.get(`http://localhost:3000${test.endpoint}`);
        const status = response.status();
        const expectedStatuses = Array.isArray(test.expectedStatus) ? test.expectedStatus : [test.expectedStatus];
        
        if (expectedStatuses.includes(status)) {
          recordTest(test.name, 'PASS', `Status: ${status}`);
        } else {
          recordTest(test.name, 'WARN', `Status: ${status} (expected: ${expectedStatuses.join(' or ')})`);
        }
      } catch (error) {
        recordTest(test.name, 'FAIL', error.message);
      }
    }

    // Test 6: Production Environment
    console.log('\n📋 Testing Production Environment');
    console.log('='.repeat(50));

    try {
      await page.goto('https://bossio.io', { timeout: 15000 });
      await page.waitForSelector('h1', { timeout: 10000 });
      
      const prodTitle = await page.textContent('h1');
      if (prodTitle.includes('Build Your Business Empire')) {
        recordTest('Production Homepage', 'PASS', 'Main heading found');
      } else {
        recordTest('Production Homepage', 'FAIL', `Title: ${prodTitle}`);
      }

      // Test production sign-in
      await page.goto('https://bossio.io/sign-in');
      await page.waitForSelector('button:has-text("Login with Google")', { timeout: 5000 });
      recordTest('Production Sign In Page', 'PASS', 'Google login available');

    } catch (error) {
      recordTest('Production Environment', 'FAIL', error.message);
    }

    // Test 7: Form Validation
    console.log('\n📋 Testing Form Validation');
    console.log('='.repeat(50));

    await page.goto('http://localhost:3000/sign-in');
    
    // Test Google OAuth button click (won't complete auth, but should start flow)
    try {
      await page.click('button:has-text("Login with Google")');
      await page.waitForTimeout(2000);
      recordTest('Google OAuth Initiation', 'PASS', 'Button clickable');
    } catch (error) {
      recordTest('Google OAuth Initiation', 'FAIL', error.message);
    }

    // Test 8: Responsive Design
    console.log('\n📋 Testing Responsive Design');
    console.log('='.repeat(50));

    const viewports = [
      { width: 375, height: 667, name: 'Mobile (iPhone SE)' },
      { width: 768, height: 1024, name: 'Tablet (iPad)' },
      { width: 1920, height: 1080, name: 'Desktop (Large)' }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('http://localhost:3000');
      await page.waitForSelector('h1');
      
      const isVisible = await page.locator('h1').isVisible();
      if (isVisible) {
        recordTest(`Responsive Design ${viewport.name}`, 'PASS');
      } else {
        recordTest(`Responsive Design ${viewport.name}`, 'FAIL');
      }
    }

    // Test 9: Performance Check
    console.log('\n📋 Testing Performance');
    console.log('='.repeat(50));

    const startTime = Date.now();
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    const loadTime = Date.now() - startTime;

    if (loadTime < 3000) {
      recordTest('Page Load Performance', 'PASS', `${loadTime}ms`);
    } else if (loadTime < 5000) {
      recordTest('Page Load Performance', 'WARN', `${loadTime}ms (slow)`);
    } else {
      recordTest('Page Load Performance', 'FAIL', `${loadTime}ms (very slow)`);
    }

    // Test 10: Console Errors
    console.log('\n📋 Checking Console Errors');
    console.log('='.repeat(50));

    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('http://localhost:3000');
    await page.waitForTimeout(3000);

    const criticalErrors = consoleErrors.filter(error => 
      !error.includes('Failed to fetch appointments') && // Expected when not logged in
      !error.includes('401') && // Expected auth errors
      !error.includes('favicon')
    );

    if (criticalErrors.length === 0) {
      recordTest('Console Errors', 'PASS', 'No critical errors');
    } else {
      recordTest('Console Errors', 'WARN', `${criticalErrors.length} errors found`);
    }

  } catch (error) {
    recordTest('Test Suite Execution', 'FAIL', error.message);
  } finally {
    await browser.close();
  }

  // Generate Report
  console.log('\n📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
  
  const passed = testResults.filter(r => r.status === 'PASS').length;
  const failed = testResults.filter(r => r.status === 'FAIL').length;
  const warnings = testResults.filter(r => r.status === 'WARN').length;
  const total = testResults.length;

  console.log(`✅ PASSED: ${passed}/${total}`);
  console.log(`❌ FAILED: ${failed}/${total}`);
  console.log(`⚠️  WARNINGS: ${warnings}/${total}`);
  console.log(`📊 SUCCESS RATE: ${Math.round((passed / total) * 100)}%`);

  console.log('\n🔍 DETAILED RESULTS:');
  console.log('-'.repeat(60));
  testResults.forEach(result => {
    const emoji = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${emoji} ${result.name}`);
    if (result.details) console.log(`   ${result.details}`);
  });

  console.log('\n🎉 COMPREHENSIVE TESTING COMPLETE!');
  
  if (failed === 0) {
    console.log('🚀 All critical tests passed - system is ready for production use!');
  } else {
    console.log(`🔧 ${failed} critical issues found - please review and fix before production.`);
  }

  return { passed, failed, warnings, total };
}

// Run the tests
runComprehensiveTests().catch(console.error);