import Redis from 'ioredis';

// Redis client for rate limiting and caching
export class RedisClient {
  private static instance: Redis | null = null;

  public static getInstance(): Redis {
    if (!RedisClient.instance) {
      const redisUrl = process.env.REDIS_URL || process.env.KV_URL;
      
      if (redisUrl) {
        // Production Redis (Vercel KV, Railway Redis, etc.)
        RedisClient.instance = new Redis(redisUrl, {
          // Connection options
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 3,
          lazyConnect: true,
        });
      } else {
        // Development Redis (local Redis server)
        RedisClient.instance = new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          password: process.env.REDIS_PASSWORD,
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 3,
          lazyConnect: true,
        });
      }

      // Handle connection events
      RedisClient.instance.on('error', (error) => {
        console.error('Redis connection error:', error);
      });

      RedisClient.instance.on('connect', () => {
        console.log('Redis connected successfully');
      });
    }

    return RedisClient.instance;
  }

  public static async isConnected(): Promise<boolean> {
    try {
      const client = RedisClient.getInstance();
      await client.ping();
      return true;
    } catch (error) {
      console.error('Redis connection check failed:', error);
      return false;
    }
  }

  public static async disconnect(): Promise<void> {
    if (RedisClient.instance) {
      await RedisClient.instance.quit();
      RedisClient.instance = null;
    }
  }
}

// Export singleton instance
export const redis = RedisClient.getInstance();

// In-memory fallback for development when Redis is not available
export class InMemoryStore {
  private static store = new Map<string, { count: number; resetTime: number }>();

  public static async incr(key: string): Promise<number> {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now > entry.resetTime) {
      this.store.set(key, { count: 1, resetTime: now + 60000 }); // 1 minute window
      return 1;
    }

    entry.count++;
    return entry.count;
  }

  public static async expire(key: string, seconds: number): Promise<void> {
    const entry = this.store.get(key);
    if (entry) {
      entry.resetTime = Date.now() + (seconds * 1000);
    }
  }

  public static async ttl(key: string): Promise<number> {
    const entry = this.store.get(key);
    if (!entry) return -2; // Key doesn't exist

    const remaining = entry.resetTime - Date.now();
    return remaining > 0 ? Math.ceil(remaining / 1000) : -1; // Key expired
  }

  public static cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

// Cleanup in-memory store every 5 minutes
if (typeof window === 'undefined') {
  setInterval(() => {
    InMemoryStore.cleanup();
  }, 5 * 60 * 1000);
}