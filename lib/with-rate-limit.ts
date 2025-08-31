import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, RateLimitType, getRateLimitTypeFromPath } from './rate-limit';

// Handler type for Next.js API routes
type NextApiHandler = (request: NextRequest) => Promise<NextResponse> | NextResponse;

// Options for rate limiting
interface RateLimitOptions {
  type?: RateLimitType;
  skipSuccessful?: boolean; // Skip rate limiting for successful responses
  identifier?: (request: NextRequest) => string; // Custom identifier function
}

/**
 * Higher-order function to add rate limiting to Next.js API routes
 * 
 * Usage examples:
 * 
 * // Auto-detect rate limit type based on URL
 * export const POST = withRateLimit(async (request) => { ... });
 * 
 * // Specify explicit rate limit type
 * export const POST = withRateLimit(async (request) => { ... }, { type: 'auth' });
 * 
 * // Custom options
 * export const GET = withRateLimit(async (request) => { ... }, {
 *   type: 'analytics',
 *   skipSuccessful: true
 * });
 */
export function withRateLimit(
  handler: NextApiHandler,
  options: RateLimitOptions = {}
) {
  return async function rateLimitedHandler(request: NextRequest): Promise<NextResponse> {
    try {
      // Determine rate limit type
      const type = options.type || getRateLimitTypeFromPath(request.nextUrl.pathname);
      
      // Apply rate limiting
      const rateLimitResult = await rateLimit(request, type);
      
      if (!rateLimitResult.success && rateLimitResult.response) {
        return rateLimitResult.response;
      }
      
      // Execute the original handler
      let response: NextResponse;
      try {
        response = await handler(request);
      } catch (error) {
        console.error('API handler error:', error);
        response = NextResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        );
      }
      
      // Add rate limit headers to the response
      if (rateLimitResult.headers) {
        rateLimitResult.headers.forEach((value, key) => {
          response.headers.set(key, value);
        });
      }
      
      return response;
      
    } catch (error) {
      console.error('Rate limit middleware error:', error);
      
      // Fail open - execute handler if rate limiting fails
      try {
        return await handler(request);
      } catch (handlerError) {
        console.error('API handler error after rate limit failure:', handlerError);
        return NextResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        );
      }
    }
  };
}

/**
 * Middleware for multiple HTTP methods with different rate limits
 * 
 * Usage:
 * const { GET, POST } = createRateLimitedHandlers({
 *   GET: { handler: getHandler, type: 'analytics' },
 *   POST: { handler: postHandler, type: 'booking' }
 * });
 */
export function createRateLimitedHandlers(
  methods: {
    [method: string]: {
      handler: NextApiHandler;
      type?: RateLimitType;
      options?: RateLimitOptions;
    };
  }
) {
  const result: { [method: string]: NextApiHandler } = {};
  
  for (const [method, config] of Object.entries(methods)) {
    result[method] = withRateLimit(config.handler, {
      type: config.type,
      ...config.options,
    });
  }
  
  return result;
}

/**
 * Rate limit status endpoint - useful for debugging and monitoring
 */
export async function getRateLimitStatus(request: NextRequest, type?: RateLimitType) {
  const rateLimitType = type || getRateLimitTypeFromPath(request.nextUrl.pathname);
  const result = await rateLimit(request, rateLimitType);
  
  return {
    type: rateLimitType,
    success: result.success,
    headers: Object.fromEntries(result.headers.entries()),
  };
}

/**
 * Conditional rate limiting - only apply if condition is met
 */
export function withConditionalRateLimit(
  handler: NextApiHandler,
  condition: (request: NextRequest) => boolean | Promise<boolean>,
  options: RateLimitOptions = {}
) {
  return async function conditionalRateLimitedHandler(request: NextRequest): Promise<NextResponse> {
    const shouldRateLimit = await condition(request);
    
    if (shouldRateLimit) {
      return withRateLimit(handler, options)(request);
    } else {
      return handler(request);
    }
  };
}

/**
 * Batch rate limiting for multiple operations
 * Useful for endpoints that perform multiple rate-limited operations
 */
export async function batchRateLimit(
  request: NextRequest,
  operations: Array<{ type: RateLimitType; weight?: number }>
): Promise<{
  success: boolean;
  response?: NextResponse;
  results: Array<{ type: RateLimitType; success: boolean; headers: Headers }>;
}> {
  const results = [];
  
  for (const operation of operations) {
    const weight = operation.weight || 1;
    
    // Apply rate limit multiple times for weighted operations
    for (let i = 0; i < weight; i++) {
      const result = await rateLimit(request, operation.type);
      results.push({ type: operation.type, ...result });
      
      if (!result.success && result.response) {
        return {
          success: false,
          response: result.response,
          results,
        };
      }
    }
  }
  
  return {
    success: true,
    results,
  };
}

/**
 * Rate limit burst protection - allows burst but with cooldown
 */
export function withBurstRateLimit(
  handler: NextApiHandler,
  burstLimit: number = 5,
  burstWindow: number = 10, // seconds
  options: RateLimitOptions = {}
) {
  return async function burstRateLimitedHandler(request: NextRequest): Promise<NextResponse> {
    // First check normal rate limit
    const normalResult = await rateLimit(request, options.type || 'default');
    
    if (!normalResult.success && normalResult.response) {
      return normalResult.response;
    }
    
    // Then check burst rate limit
    const burstResult = await rateLimit(request, 'default'); // You could create a custom burst type
    
    if (!burstResult.success && burstResult.response) {
      // Modify the response to indicate burst limit
      const burstResponse = NextResponse.json(
        {
          error: 'Burst rate limit exceeded',
          message: `Too many requests in a short time. Please wait ${burstWindow} seconds.`,
          type: 'burst',
        },
        { status: 429 }
      );
      
      // Copy headers from burst result
      burstResult.headers.forEach((value, key) => {
        burstResponse.headers.set(key, value);
      });
      
      return burstResponse;
    }
    
    const response = await handler(request);
    
    // Add headers from both rate limit checks
    normalResult.headers.forEach((value, key) => {
      response.headers.set(key, value);
    });
    
    return response;
  };
}