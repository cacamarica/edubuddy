/**
 * Rate limiting and API call prevention utilities
 * Helps prevent excessive API calls and reduce token costs
 */

// Cache for storing previous API calls and their results
interface CacheEntry {
  timestamp: number;
  result: any;
  expiry: number;
}

// Configuration for rate limiting
interface RateLimitConfig {
  maxCallsPerMinute: number;
  maxCallsPerHour: number;
  cacheDurationMinutes: number;
}

// Default configuration values
const DEFAULT_CONFIG: RateLimitConfig = {
  maxCallsPerMinute: 10,
  maxCallsPerHour: 100,
  cacheDurationMinutes: 30
};

// Store API call history
class APICallTracker {
  private callHistory: number[] = [];
  private resultCache: Map<string, CacheEntry> = new Map();
  private config: RateLimitConfig;
  
  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  /**
   * Check if a new API call is allowed based on rate limits
   */
  canMakeCall(): boolean {
    const now = Date.now();
    
    // Clean up old call history
    this.callHistory = this.callHistory.filter(timestamp => {
      const age = now - timestamp;
      return age < 3600000; // Keep calls from the last hour
    });
    
    // Check minute limit
    const callsLastMinute = this.callHistory.filter(timestamp => {
      return now - timestamp < 60000; // Last minute
    }).length;
    
    if (callsLastMinute >= this.config.maxCallsPerMinute) {
      console.warn(`Rate limit exceeded: ${callsLastMinute} calls in the last minute`);
      return false;
    }
    
    // Check hour limit
    if (this.callHistory.length >= this.config.maxCallsPerHour) {
      console.warn(`Rate limit exceeded: ${this.callHistory.length} calls in the last hour`);
      return false;
    }
    
    return true;
  }
  
  /**
   * Record a new API call
   */
  recordCall(): void {
    this.callHistory.push(Date.now());
  }
  
  /**
   * Try to get a cached result for a request
   * @param cacheKey - Unique identifier for this request
   */
  getCachedResult(cacheKey: string): any | null {
    const cached = this.resultCache.get(cacheKey);
    
    if (!cached) return null;
    
    // Check if cache entry is expired
    if (Date.now() > cached.expiry) {
      this.resultCache.delete(cacheKey);
      return null;
    }
    
    return cached.result;
  }
  
  /**
   * Store a result in cache
   * @param cacheKey - Unique identifier for this request
   * @param result - The result to cache
   */
  cacheResult(cacheKey: string, result: any): void {
    const now = Date.now();
    const expiry = now + (this.config.cacheDurationMinutes * 60 * 1000);
    
    this.resultCache.set(cacheKey, {
      timestamp: now,
      result,
      expiry
    });
    
    // Clean up expired cache entries
    this.cleanupCache();
  }
  
  /**
   * Remove expired entries from the cache
   */
  private cleanupCache(): void {
    const now = Date.now();
    
    for (const [key, entry] of this.resultCache.entries()) {
      if (now > entry.expiry) {
        this.resultCache.delete(key);
      }
    }
  }
  
  /**
   * Generate a cache key from request parameters
   */
  static generateCacheKey(params: any): string {
    try {
      // Sort keys to ensure consistent key generation
      const sortedParams = Object.keys(params).sort().reduce((result: Record<string, any>, key) => {
        if (typeof params[key] !== 'function') {
          result[key] = params[key];
        }
        return result;
      }, {});
      
      return JSON.stringify(sortedParams);
    } catch (error) {
      console.error('Error generating cache key:', error);
      // Fallback to a timestamp-based key
      return `request-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    }
  }
}

// Create a singleton instance for the application
export const apiRateLimiter = new APICallTracker();

// Export the class for potential custom configurations
export { APICallTracker }; export type { RateLimitConfig };
