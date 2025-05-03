/**
 * Simple rate limiting service using in-memory storage
 * For production use, consider using Redis or another distributed cache
 */
export class RateLimiterService {
    private store: Map<string, { count: number; resetTime: Date }>;
    
    constructor() {
      this.store = new Map();
      
      
      setInterval(() => this.cleanup(), 60 * 60 * 1000);
    }
    
    /**
     * Checks if a request can proceed under the rate limit
     * @param key Unique identifier for the rate limit (e.g., ip:email:action)
     * @param limit Maximum number of requests allowed in the time window
     * @param windowHours Time window in hours
     * @returns Object with rate limit status
     */
    async checkRateLimit(key: string, limit: number, windowHours: number): Promise<{
      canProceed: boolean;
      remaining: number;
      resetTime: Date;
    }> {
      const now = new Date();
      const entry = this.store.get(key);
      
      
      if (!entry || entry.resetTime < now) {
        const resetTime = new Date(now.getTime() + windowHours * 60 * 60 * 1000);
        this.store.set(key, { count: 1, resetTime });
        
        return {
          canProceed: true,
          remaining: limit - 1,
          resetTime
        };
      }
      
      
      if (entry.count >= limit) {
        return {
          canProceed: false,
          remaining: 0,
          resetTime: entry.resetTime
        };
      }
      
      
      entry.count += 1;
      this.store.set(key, entry);
      
      return {
        canProceed: true,
        remaining: limit - entry.count,
        resetTime: entry.resetTime
      };
    }
    
    /**
     * Reset rate limit for a specific key
     * @param key The key to reset
     */
    async resetLimit(key: string): Promise<void> {
      this.store.delete(key);
    }
    
    /**
     * Cleanup expired entries to prevent memory leaks
     */
    private cleanup(): void {
      const now = new Date();
      
      for (const [key, entry] of this.store.entries()) {
        if (entry.resetTime < now) {
          this.store.delete(key);
        }
      }
    }
  }