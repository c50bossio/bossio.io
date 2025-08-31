#!/usr/bin/env node

/**
 * Rate Limiting Test Script for bossio.io
 * 
 * This script tests the rate limiting functionality across different endpoint types.
 * Run with: node test-rate-limiting.js
 */

const BASE_URL = 'http://localhost:3000';

// Test configuration for different endpoint types
const TESTS = {
  'Rate Limit Status': {
    url: `${BASE_URL}/api/rate-limit-status`,
    method: 'GET',
    expectedLimit: 20, // default rate limit
    testCount: 3,
  },
  'SMS Test Endpoint': {
    url: `${BASE_URL}/api/test/sms`,
    method: 'GET',
    expectedLimit: 20, // GET uses default, not testing
    testCount: 3,
  },
  'AI Stats Analytics': {
    url: `${BASE_URL}/api/ai/stats`,
    method: 'GET',
    expectedLimit: 30, // analytics rate limit
    testCount: 5,
  },
  'Auth Status': {
    url: `${BASE_URL}/api/auth/session`, // This would be handled by better-auth
    method: 'GET',
    expectedLimit: 5, // auth rate limit
    testCount: 7, // Should trigger rate limit
    skipIfNotFound: true,
  }
};

async function makeRequest(url, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'RateLimitTestBot/1.0'
    }
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  
  return {
    status: response.status,
    headers: {
      'x-ratelimit-limit': response.headers.get('x-ratelimit-limit'),
      'x-ratelimit-remaining': response.headers.get('x-ratelimit-remaining'),
      'x-ratelimit-reset': response.headers.get('x-ratelimit-reset'),
      'x-ratelimit-type': response.headers.get('x-ratelimit-type'),
      'retry-after': response.headers.get('retry-after'),
    },
    data: response.status < 500 ? await response.json().catch(() => null) : null,
  };
}

async function testEndpoint(name, config) {
  console.log(`\n🧪 Testing: ${name}`);
  console.log(`   URL: ${config.url}`);
  console.log(`   Expected Limit: ${config.expectedLimit}/min`);
  console.log(`   Test Requests: ${config.testCount}`);
  console.log('   ' + '─'.repeat(50));

  let rateLimitTriggered = false;
  let firstResponse = null;

  for (let i = 1; i <= config.testCount; i++) {
    try {
      const response = await makeRequest(config.url, config.method);
      
      if (i === 1) {
        firstResponse = response;
      }

      const remaining = parseInt(response.headers['x-ratelimit-remaining'] || '0');
      const limit = parseInt(response.headers['x-ratelimit-limit'] || '0');
      const type = response.headers['x-ratelimit-type'] || 'unknown';
      
      if (response.status === 429) {
        rateLimitTriggered = true;
        const retryAfter = response.headers['retry-after'];
        console.log(`   ${i}. ❌ RATE LIMITED (429) - Retry after ${retryAfter}s`);
        console.log(`      Message: ${response.data?.message || 'Rate limit exceeded'}`);
        break;
      } else if (response.status === 404 && config.skipIfNotFound) {
        console.log(`   ${i}. ⚠️  Endpoint not found (404) - Skipping test`);
        break;
      } else if (response.status >= 400) {
        console.log(`   ${i}. ❌ Error ${response.status}`);
        if (response.data?.error) {
          console.log(`      Error: ${response.data.error}`);
        }
        break;
      } else {
        console.log(`   ${i}. ✅ Success (${response.status}) - ${remaining}/${limit} remaining (${type})`);
      }

      // Small delay between requests
      if (i < config.testCount) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.log(`   ${i}. ❌ Request failed: ${error.message}`);
      break;
    }
  }

  // Summary
  if (firstResponse && firstResponse.headers['x-ratelimit-limit']) {
    const actualLimit = parseInt(firstResponse.headers['x-ratelimit-limit']);
    const expectedLimit = config.expectedLimit;
    
    if (actualLimit === expectedLimit) {
      console.log(`   ✅ Rate limit configuration correct: ${actualLimit}/min`);
    } else {
      console.log(`   ⚠️  Rate limit mismatch: expected ${expectedLimit}/min, got ${actualLimit}/min`);
    }
  } else if (!config.skipIfNotFound) {
    console.log(`   ⚠️  No rate limit headers found`);
  }

  if (rateLimitTriggered) {
    console.log(`   ✅ Rate limiting is working correctly`);
  } else if (config.testCount > config.expectedLimit) {
    console.log(`   ⚠️  Rate limiting not triggered (expected with ${config.testCount} requests)`);
  } else {
    console.log(`   ✅ No rate limit expected with ${config.testCount} requests`);
  }
}

async function testRateLimitStatus() {
  console.log('\n📊 Testing Rate Limit Status Endpoint');
  console.log('─'.repeat(60));

  try {
    const response = await makeRequest(`${BASE_URL}/api/rate-limit-status`);
    
    if (response.status === 200 && response.data) {
      console.log('✅ Rate limit status endpoint working');
      console.log(`   Redis connected: ${response.data.system?.redis?.connected ? 'Yes' : 'No'}`);
      console.log(`   Client ID: ${response.data.system?.client?.identifier || 'unknown'}`);
      
      if (response.data.configuration) {
        console.log('\n📋 Rate Limit Configuration:');
        response.data.configuration.forEach(config => {
          console.log(`   ${config.type.padEnd(10)}: ${config.requests}/${config.window}s - ${config.description}`);
        });
      }
    } else {
      console.log('❌ Rate limit status endpoint failed');
      console.log(`   Status: ${response.status}`);
      if (response.data?.error) {
        console.log(`   Error: ${response.data.error}`);
      }
    }
  } catch (error) {
    console.log(`❌ Failed to check rate limit status: ${error.message}`);
  }
}

async function main() {
  console.log('🚀 Rate Limiting Test Suite for bossio.io');
  console.log('════════════════════════════════════════════════════════════');

  // Check if server is running
  try {
    const healthCheck = await fetch(`${BASE_URL}/api/rate-limit-status`);
    if (!healthCheck.ok && healthCheck.status !== 429) {
      console.log('❌ Server not responding. Make sure the development server is running:');
      console.log('   npm run dev');
      return;
    }
  } catch (error) {
    console.log('❌ Cannot connect to server. Make sure the development server is running:');
    console.log('   npm run dev');
    console.log(`   Error: ${error.message}`);
    return;
  }

  // Test rate limit status endpoint first
  await testRateLimitStatus();

  // Test each endpoint type
  for (const [name, config] of Object.entries(TESTS)) {
    await testEndpoint(name, config);
    
    // Wait between different endpoint tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n🎉 Rate Limiting Test Complete!');
  console.log('════════════════════════════════════════════════════════════');
  console.log('');
  console.log('💡 Tips:');
  console.log('   - Check /api/rate-limit-status for real-time monitoring');
  console.log('   - Different endpoints have different rate limits');
  console.log('   - Rate limits are per IP address/client');
  console.log('   - Headers include X-RateLimit-* information');
}

// Run the tests
main().catch(console.error);