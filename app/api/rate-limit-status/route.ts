import { NextRequest, NextResponse } from 'next/server';
import { RATE_LIMITS, RateLimitType, getClientIdentifier, rateLimit } from '@/lib/rate-limit';
import { RedisClient } from '@/lib/redis-client';
import { withRateLimit } from '@/lib/with-rate-limit';

async function getHandler(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request);
    const searchParams = request.nextUrl.searchParams;
    const checkType = searchParams.get('type') as RateLimitType | null;
    
    // Basic Redis connection status
    const isRedisConnected = await RedisClient.isConnected();
    
    // Get current status for all rate limit types or specific type
    const rateLimitStatuses: { [key: string]: any } = {};
    const typesToCheck = checkType ? [checkType] : Object.keys(RATE_LIMITS) as RateLimitType[];
    
    for (const type of typesToCheck) {
      try {
        const result = await rateLimit(request, type);
        const config = RATE_LIMITS[type];
        
        rateLimitStatuses[type] = {
          limit: config.requests,
          window: config.window,
          remaining: result.success ? parseInt(result.headers.get('X-RateLimit-Remaining') || '0') : 0,
          reset: result.headers.get('X-RateLimit-Reset') ? 
            new Date(parseInt(result.headers.get('X-RateLimit-Reset')!)).toISOString() : null,
          success: result.success,
          message: config.message,
        };
      } catch (error) {
        rateLimitStatuses[type] = {
          error: error instanceof Error ? error.message : 'Unknown error',
          limit: RATE_LIMITS[type].requests,
          window: RATE_LIMITS[type].window,
        };
      }
    }
    
    // System information
    const systemInfo = {
      redis: {
        connected: isRedisConnected,
        fallback: !isRedisConnected ? 'Using in-memory store' : null,
      },
      client: {
        identifier: clientId,
        timestamp: new Date().toISOString(),
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasRedisUrl: !!(process.env.REDIS_URL || process.env.KV_URL),
      }
    };
    
    // Rate limit configuration overview
    const configuration = Object.entries(RATE_LIMITS).map(([type, config]) => ({
      type,
      requests: config.requests,
      window: config.window,
      description: getEndpointDescription(type as RateLimitType),
    }));
    
    return NextResponse.json({
      success: true,
      system: systemInfo,
      rateLimits: rateLimitStatuses,
      configuration,
      endpoints: {
        auth: '/api/auth/* - Authentication endpoints',
        booking: '/api/appointments, /api/public/appointments - Booking endpoints',
        analytics: '/api/ai/stats, /api/analytics/* - Read-heavy endpoints',
        testing: '/api/test/* - Testing endpoints (SMS, email)',
        public: '/api/public/* - Customer-facing endpoints',
        default: 'Other API endpoints',
        webhook: '/api/webhook*, /api/payments/webhook* - Webhook endpoints'
      }
    });
    
  } catch (error) {
    console.error('Rate limit status error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

// Helper function to describe what each rate limit type covers
function getEndpointDescription(type: RateLimitType): string {
  switch (type) {
    case 'auth': return 'Authentication endpoints (login, signup, password reset)';
    case 'booking': return 'Appointment creation and management';
    case 'analytics': return 'Read-heavy endpoints (stats, reports, analytics)';
    case 'testing': return 'Testing endpoints (SMS test, email test)';
    case 'public': return 'Customer-facing public endpoints';
    case 'webhook': return 'Webhook endpoints from external services';
    case 'default': return 'General API endpoints';
    default: return 'Unknown endpoint type';
  }
}

// Rate limit this endpoint with default limits (it's monitoring, so not too restrictive)
export const GET = withRateLimit(getHandler, { type: 'default' });

// Also provide a POST endpoint for testing specific rate limit types
async function postHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const { testType, count = 1 } = body;
    
    if (!testType || !RATE_LIMITS[testType as RateLimitType]) {
      return NextResponse.json({
        error: 'Invalid or missing testType',
        validTypes: Object.keys(RATE_LIMITS),
      }, { status: 400 });
    }
    
    const results = [];
    
    // Test multiple requests to demonstrate rate limiting
    for (let i = 0; i < count; i++) {
      const result = await rateLimit(request, testType as RateLimitType);
      results.push({
        attempt: i + 1,
        success: result.success,
        remaining: result.headers.get('X-RateLimit-Remaining'),
        reset: result.headers.get('X-RateLimit-Reset'),
        rateLimitType: testType,
      });
      
      // If rate limited, break early
      if (!result.success) {
        break;
      }
    }
    
    return NextResponse.json({
      success: true,
      testType,
      requestCount: count,
      results,
      message: `Tested ${testType} rate limiting with ${count} request(s)`,
    });
    
  } catch (error) {
    console.error('Rate limit test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

export const POST = withRateLimit(postHandler, { type: 'testing' });