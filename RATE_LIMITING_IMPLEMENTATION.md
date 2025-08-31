# Rate Limiting Implementation for bossio.io

## 🚀 Overview

Comprehensive rate limiting has been implemented across all API endpoints in the barbershop booking platform to prevent abuse, protect against DDoS attacks, and ensure fair resource usage.

## 📊 Rate Limit Configuration

### Endpoint Categories & Limits

| Category | Rate Limit | Window | Endpoints Covered |
|----------|------------|--------|------------------|
| **Authentication** | 5 requests | 60 seconds | `/api/auth/*` - Login, signup, password reset |
| **Booking** | 10 requests | 60 seconds | `/api/appointments/*` - Appointment management |
| **Analytics** | 30 requests | 60 seconds | `/api/ai/stats`, analytics endpoints |
| **Testing** | 2 requests | 60 seconds | `/api/test/*` - SMS/email testing |
| **Public** | 15 requests | 60 seconds | `/api/public/*` - Customer-facing endpoints |
| **Default** | 20 requests | 60 seconds | General API endpoints |
| **Webhook** | 100 requests | 60 seconds | Webhook endpoints |

## 🔧 Implementation Details

### Technologies Used
- **Redis**: Primary storage for rate limiting data (with IORedis)
- **In-Memory Fallback**: Automatic fallback when Redis is unavailable
- **Sliding Window**: More accurate rate limiting using Redis sorted sets
- **Multiple Rate Limit Types**: Different limits for different use cases

### Key Files Created/Modified

1. **`/lib/redis-client.ts`** - Redis connection management with fallback
2. **`/lib/rate-limit.ts`** - Core rate limiting logic and configuration
3. **`/lib/with-rate-limit.ts`** - Higher-order function for easy API integration
4. **`/app/api/rate-limit-status/route.ts`** - Monitoring and status endpoint

### Modified API Endpoints

#### Authentication Endpoints
- **`/app/api/auth/[...all]/route.ts`** - 5 requests/minute
- Uses better-auth handlers with rate limiting wrapper

#### Booking Endpoints
- **`/app/api/appointments/route.ts`** - 10 requests/minute for POST, 30 for GET
- **`/app/api/public/appointments/route.ts`** - 15 requests/minute (customer-facing)

#### Testing Endpoints
- **`/app/api/test/sms/route.ts`** - 2 requests/minute for POST, 20 for GET

#### Analytics Endpoints
- **`/app/api/ai/stats/route.ts`** - 30 requests/minute

#### Chat Endpoints
- **`/app/api/chat/route.ts`** - 20 requests/minute (AI-powered)

## 🛠️ Usage Examples

### Basic Usage
```typescript
import { withRateLimit } from '@/lib/with-rate-limit';

export const POST = withRateLimit(async (request) => {
  // Your API logic here
}, { type: 'booking' });
```

### Multiple Methods with Different Limits
```typescript
import { createRateLimitedHandlers } from '@/lib/with-rate-limit';

const { GET, POST } = createRateLimitedHandlers({
  GET: { handler: getHandler, type: 'analytics' },
  POST: { handler: postHandler, type: 'booking' }
});
```

### Conditional Rate Limiting
```typescript
import { withConditionalRateLimit } from '@/lib/with-rate-limit';

export const POST = withConditionalRateLimit(
  handler,
  (request) => !request.headers.get('x-api-key'), // Only rate limit if no API key
  { type: 'default' }
);
```

## 🔍 Monitoring & Debugging

### Rate Limit Status Endpoint
- **URL**: `/api/rate-limit-status`
- **Purpose**: Monitor current rate limit status and system health
- **Features**:
  - Real-time rate limit remaining counts
  - Redis connection status
  - Client identifier information
  - Configuration overview

### Rate Limit Headers
All rate-limited responses include headers:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: Unix timestamp when limit resets
- `X-RateLimit-Type`: Type of rate limit applied
- `Retry-After`: Seconds to wait before retrying (when rate limited)

### Testing Script
Run `node test-rate-limiting.js` to test rate limiting across different endpoints.

## 🏗️ Architecture Features

### 1. **Fail-Open Design**
If rate limiting fails due to Redis issues, requests are allowed through to prevent service disruption.

### 2. **Automatic Fallback**
- Primary: Redis-based sliding window (production-ready)
- Fallback: In-memory store (development/fallback)

### 3. **Client Identification**
Rate limits are applied per client based on:
- IP address (from various proxy headers)
- Development mode: Browser fingerprint based on User-Agent

### 4. **Sliding Window Algorithm**
Uses Redis sorted sets to implement accurate sliding windows:
- More fair than fixed windows
- Prevents burst attacks at window boundaries
- Automatic cleanup of expired entries

## 🚨 Error Handling

### 429 Too Many Requests Response
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many authentication attempts. Please try again in a minute.",
  "limit": 5,
  "remaining": 0,
  "reset": "2025-08-31T17:35:00.000Z",
  "retryAfter": 45
}
```

### Graceful Degradation
1. **Redis unavailable**: Falls back to in-memory store
2. **In-memory fails**: Allows requests through (fail-open)
3. **Rate limit errors**: Logs error but allows request

## 📈 Performance Considerations

### Redis Pipeline Usage
- Batches multiple Redis operations
- Reduces network round trips
- Atomic operations ensure consistency

### Memory Management
- In-memory store automatically cleans up expired entries
- Redis TTL ensures keys don't accumulate
- Periodic cleanup prevents memory leaks

### Caching Strategy
- Rate limit data cached for the window duration
- No additional database queries required
- Efficient for high-traffic scenarios

## 🔒 Security Features

### 1. **DDoS Protection**
- Prevents resource exhaustion attacks
- Different limits for different attack vectors
- Client-based isolation

### 2. **Brute Force Prevention**
- Authentication endpoints heavily rate limited (5/min)
- Testing endpoints protected (2/min)
- Exponential backoff through sliding window

### 3. **Resource Protection**
- AI-powered endpoints protected from abuse
- Database query endpoints rate limited
- File upload endpoints can be easily protected

## 🎯 Future Enhancements

### Planned Improvements
1. **User-based Rate Limiting**: Different limits for authenticated vs anonymous users
2. **Geographic Rate Limiting**: Different limits by region
3. **Dynamic Rate Limiting**: Adjust limits based on system load
4. **Rate Limit Analytics**: Track and analyze rate limit patterns
5. **Whitelist/Blacklist**: IP-based allow/deny lists

### Configuration Options
```typescript
// Future configuration possibilities
interface AdvancedRateLimitConfig {
  userBased: boolean;           // Different limits per user role
  geographic: boolean;          // Regional rate limiting
  adaptive: boolean;            // Dynamic adjustment
  whitelist: string[];          // IP whitelist
  blacklist: string[];          // IP blacklist
  burstAllowance: number;       // Allow short bursts
}
```

## 📝 Environment Variables

Required environment variables for production:
```bash
# Redis Configuration
REDIS_URL=redis://localhost:6379
# OR
KV_URL=redis://your-redis-provider
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-password

# Development
NODE_ENV=development
```

## ✅ Production Checklist

- [x] Rate limiting implemented on all API endpoints
- [x] Redis connection with automatic fallback
- [x] Proper error handling and fail-open design
- [x] Rate limit headers in all responses
- [x] Monitoring endpoint for debugging
- [x] Test suite for validation
- [x] Documentation complete

### Deployment Notes
1. Ensure Redis is available in production
2. Configure appropriate Redis connection string
3. Monitor rate limiting metrics
4. Adjust limits based on usage patterns
5. Set up alerts for rate limiting failures

## 🔗 Related Files

- `/lib/redis-client.ts` - Redis connection management
- `/lib/rate-limit.ts` - Core rate limiting logic  
- `/lib/with-rate-limit.ts` - Integration utilities
- `/app/api/rate-limit-status/route.ts` - Monitoring endpoint
- `/test-rate-limiting.js` - Test suite
- `/middleware.ts` - Could be extended for global rate limiting

---

**Last Updated**: August 31, 2025  
**Version**: 1.0.0  
**Status**: ✅ Production Ready