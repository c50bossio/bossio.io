import { NextRequest, NextResponse } from 'next/server';
// Remove Upstash import - we'll use a custom implementation
import { redis, RedisClient, InMemoryStore } from './redis-client';

// Rate limiting configurations for different endpoint types
export const RATE_LIMITS = {
  // Authentication endpoints - 5 requests per minute
  auth: {
    requests: 5,
    window: 60, // seconds
    message: 'Too many authentication attempts. Please try again in a minute.',
  },
  
  // Booking-related endpoints - 10 requests per minute
  booking: {
    requests: 10,
    window: 60,
    message: 'Too many booking requests. Please slow down.',
  },
  
  // Analytics and read-only endpoints - 30 requests per minute
  analytics: {
    requests: 30,
    window: 60,
    message: 'Too many requests to analytics endpoints. Please slow down.',
  },
  
  // SMS/Email test endpoints - 2 requests per minute (very restrictive)
  testing: {
    requests: 2,
    window: 60,
    message: 'Too many test requests. Testing endpoints are limited to prevent abuse.',
  },
  
  // Generic API endpoints - 20 requests per minute
  default: {
    requests: 20,
    window: 60,
    message: 'Too many requests. Please slow down.',
  },
  
  // Public booking endpoints (used by customers) - 15 requests per minute
  public: {
    requests: 15,
    window: 60,
    message: 'Too many requests. Please wait a moment before trying again.',
  },
  
  // Webhook endpoints - higher limit for legitimate webhooks
  webhook: {
    requests: 100,
    window: 60,
    message: 'Webhook rate limit exceeded.',
  }
} as const;

export type RateLimitType = keyof typeof RATE_LIMITS;

// Simple Redis-based rate limiter using sliding window
class SimpleRateLimiter {
  private type: RateLimitType;
  
  constructor(type: RateLimitType) {
    this.type = type;
  }
  
  async limit(identifier: string) {
    const config = RATE_LIMITS[this.type];
    const key = `rl:${this.type}:${identifier}`;
    const now = Date.now();
    const window = config.window * 1000; // Convert to milliseconds
    const windowStart = now - window;
    
    try {
      // Use Redis for production-grade rate limiting
      const isRedisConnected = await RedisClient.isConnected();
      
      if (isRedisConnected) {
        // Use Redis sorted sets for sliding window
        const pipeline = redis.multi();
        
        // Remove expired entries
        pipeline.zremrangebyscore(key, '-inf', windowStart);
        
        // Count current requests in window
        pipeline.zcard(key);
        
        // Add current request
        pipeline.zadd(key, now, `${now}-${Math.random()}`);
        
        // Set expiration
        pipeline.expire(key, config.window);
        
        const results = await pipeline.exec();
        const count = (results?.[1]?.[1] as number) || 0;
        
        const success = count < config.requests;
        const remaining = Math.max(0, config.requests - count - 1);
        const reset = new Date(now + window);
        
        return {
          success,
          limit: config.requests,
          remaining,
          reset,
          pending: Promise.resolve(),
        };
      } else {
        // Fallback to in-memory store
        return this.fallbackLimit(identifier);
      }
    } catch (error) {
      console.error('Redis rate limiter error:', error);
      return this.fallbackLimit(identifier);
    }
  }
  
  private async fallbackLimit(identifier: string) {
    const key = `${this.type}:${identifier}`;
    const config = RATE_LIMITS[this.type];
    
    const count = await InMemoryStore.incr(key);
    await InMemoryStore.expire(key, config.window);
    
    const remaining = Math.max(0, config.requests - count);
    const success = count <= config.requests;
    const reset = new Date(Date.now() + config.window * 1000);
    
    return {
      success,
      limit: config.requests,
      remaining,
      reset,
      pending: Promise.resolve(),
    };
  }
}

// Rate limiter instances
const rateLimiters: { [K in RateLimitType]: SimpleRateLimiter } = {
  auth: new SimpleRateLimiter('auth'),
  booking: new SimpleRateLimiter('booking'),
  analytics: new SimpleRateLimiter('analytics'),
  testing: new SimpleRateLimiter('testing'),
  default: new SimpleRateLimiter('default'),
  public: new SimpleRateLimiter('public'),
  webhook: new SimpleRateLimiter('webhook'),
};


// Get client identifier for rate limiting
export function getClientIdentifier(request: NextRequest): string {
  // Try to get IP from various headers (for reverse proxies)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  // Use the most reliable IP source
  let ip = realIp || cfConnectingIp || forwarded?.split(',')[0]?.trim() || 
           request.ip || 'unknown';
  
  // For development, use a more specific identifier
  if (ip === '127.0.0.1' || ip === 'localhost' || ip === '::1') {
    const userAgent = request.headers.get('user-agent') || '';
    ip = `dev-${Buffer.from(userAgent).toString('base64').slice(0, 10)}`;
  }
  
  return ip;
}

// Main rate limiting function
export async function rateLimit(
  request: NextRequest,
  type: RateLimitType = 'default'
): Promise<{
  success: boolean;
  response?: NextResponse;
  headers: Headers;
}> {
  const identifier = getClientIdentifier(request);
  const config = RATE_LIMITS[type];
  
  try {
    // Use the appropriate rate limiter (handles Redis/fallback internally)
    const result = await rateLimiters[type].limit(identifier);
    
    // Create headers for rate limit info
    const headers = new Headers();
    headers.set('X-RateLimit-Limit', config.requests.toString());
    headers.set('X-RateLimit-Remaining', result.remaining.toString());
    headers.set('X-RateLimit-Reset', result.reset.getTime().toString());
    headers.set('X-RateLimit-Type', type);
    
    if (!result.success) {
      // Calculate retry after time
      const retryAfter = Math.ceil((result.reset.getTime() - Date.now()) / 1000);
      headers.set('Retry-After', retryAfter.toString());
      
      const errorResponse = NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: config.message,
          limit: config.requests,
          remaining: result.remaining,
          reset: result.reset.toISOString(),
          retryAfter,
        },
        { status: 429, headers }
      );
      
      return {
        success: false,
        response: errorResponse,
        headers,
      };
    }
    
    return {
      success: true,
      headers,
    };
  } catch (error) {
    console.error('Rate limiting error:', error);
    
    // Fail open - allow the request if rate limiting fails
    const headers = new Headers();
    headers.set('X-RateLimit-Error', 'true');
    
    return {
      success: true,
      headers,
    };
  }
}

// Middleware wrapper for easy use in API routes
export function withRateLimit(
  type: RateLimitType = 'default'
) {
  return async function rateLimitMiddleware(
    request: NextRequest,
    handler: (req: NextRequest) => Promise<NextResponse> | NextResponse
  ): Promise<NextResponse> {
    const rateLimitResult = await rateLimit(request, type);
    
    if (!rateLimitResult.success) {
      return rateLimitResult.response!;
    }
    
    // Execute the original handler
    const response = await handler(request);
    
    // Add rate limit headers to successful responses
    rateLimitResult.headers.forEach((value, key) => {
      response.headers.set(key, value);
    });
    
    return response;
  };
}

// Helper function to determine rate limit type based on URL pattern
export function getRateLimitTypeFromPath(pathname: string): RateLimitType {
  // Authentication endpoints
  if (pathname.includes('/api/auth/')) {
    return 'auth';
  }
  
  // Test endpoints (SMS, email testing)
  if (pathname.includes('/api/test/')) {
    return 'testing';
  }
  
  // Booking endpoints
  if (pathname.includes('/api/appointments') || 
      pathname.includes('/api/booking') ||
      pathname.includes('/api/public/appointments')) {
    return 'booking';
  }
  
  // Public endpoints (customer-facing)
  if (pathname.includes('/api/public/')) {
    return 'public';
  }
  
  // Analytics endpoints
  if (pathname.includes('/api/analytics') || 
      pathname.includes('/api/stats') ||
      pathname.includes('/api/reports')) {
    return 'analytics';
  }
  
  // Webhook endpoints
  if (pathname.includes('/api/webhook') || 
      pathname.includes('/api/payments/webhook')) {
    return 'webhook';
  }
  
  // Default for other API endpoints
  return 'default';
}

// Utility function to add rate limiting to any handler
export async function addRateLimit(
  request: NextRequest,
  response: NextResponse,
  type?: RateLimitType
): Promise<NextResponse> {
  const rateLimitType = type || getRateLimitTypeFromPath(request.nextUrl.pathname);
  const rateLimitResult = await rateLimit(request, rateLimitType);
  
  if (!rateLimitResult.success) {
    return rateLimitResult.response!;
  }
  
  // Add headers to existing response
  rateLimitResult.headers.forEach((value, key) => {
    response.headers.set(key, value);
  });
  
  return response;
}