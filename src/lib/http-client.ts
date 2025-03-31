import { env } from "../config/env";

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface ApiRequestConfig {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: BodyInit;
  query?: Record<string, string>;
  cacheKey?: string;
  cacheTTL?: number;
  retries?: number;
}

interface ApiResponse<T> {
  data: T;
  status: number;
  headers: Headers;
}

class MemoryCache {
  private static instance: MemoryCache;
  private cache: Map<string, { value: any; expires: number }> = new Map();
  private cleaner: NodeJS.Timeout;

  private constructor() {
    this.cleaner = setInterval(() => this.cleanExpired(), 60_000);
  }

  static getInstance(): MemoryCache {
    if (!MemoryCache.instance) {
      MemoryCache.instance = new MemoryCache();
    }
    return MemoryCache.instance;
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    if (!entry || entry.expires < Date.now()) return null;
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    this.cache.set(key, {
      value,
      expires: Date.now() + ttl * 1000,
    });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  private cleanExpired(): void {
    const now = Date.now();
    this.cache.forEach((value, key) => {
      if (value.expires < now) this.cache.delete(key);
    });
  }

  destroy(): void {
    clearInterval(this.cleaner);
    this.cache.clear();
  }
}

class ApiClient {
  private cache = MemoryCache.getInstance();
  private rateLimiters = new Map<string, TokenBucket>();
  private defaultHeaders: HeadersInit;

  constructor(private apiKey: string) {
    this.defaultHeaders = {
      'apikey': this.apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'SecureAuthGuard/1.0.0',
    };
  }

  async request<T>(
    url: string,
    config: ApiRequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const { method = 'GET', headers = {}, body, query, cacheKey, cacheTTL } = config;
    
    try {
      // Check cache first
      if (cacheKey) {
        const cached = await this.cache.get<T>(cacheKey);
        if (cached) return { data: cached, status: 200, headers: new Headers() };
      }

      // Rate limiting
      await this.checkRateLimit(url);

      // Build request URL
      const finalUrl = this.buildUrl(url, query);

      // Make request
      const response = await fetch(finalUrl, {
        method,
        headers: { ...this.defaultHeaders, ...headers },
        body,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Cache response
      if (cacheKey && cacheTTL) {
        await this.cache.set(cacheKey, data, cacheTTL);
      }

      return {
        data: data as T,
        status: response.status,
        headers: response.headers,
      };
    } catch (error) {
      if (config.retries && config.retries > 0) {
        return this.request(url, { ...config, retries: config.retries - 1 });
      }
      throw error;
    }
  }

  private buildUrl(baseUrl: string, query?: Record<string, string>): string {
    const url = new URL(baseUrl);
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }
    return url.toString();
  }

  private async checkRateLimit(url: string): Promise<void> {
    const domain = new URL(url).hostname;
    if (!this.rateLimiters.has(domain)) {
      this.rateLimiters.set(domain, new TokenBucket(100, 10)); // 100 requests, 10 per second
    }
    const bucket = this.rateLimiters.get(domain)!;
    if (!bucket.take()) {
      throw new Error(`Rate limit exceeded for ${domain}`);
    }
  }

  // Convenience methods
  get<T>(url: string, config?: Omit<ApiRequestConfig, 'method'>) {
    return this.request<T>(url, { ...config, method: 'GET' });
  }

  post<T>(url: string, body: any, config?: ApiRequestConfig) {
    return this.request<T>(url, { ...config, method: 'POST', body: JSON.stringify(body) });
  }

  put<T>(url: string, body: any, config?: ApiRequestConfig) {
    return this.request<T>(url, { ...config, method: 'PUT', body: JSON.stringify(body) });
  }

  patch<T>(url: string, body: any, config?: ApiRequestConfig) {
    return this.request<T>(url, { ...config, method: 'PATCH', body: JSON.stringify(body) });
  }

  delete<T>(url: string, config?: ApiRequestConfig) {
    return this.request<T>(url, { ...config, method: 'DELETE' });
  }
}

// Token Bucket Rate Limiter
class TokenBucket {
  private tokens: number;
  private lastFilled: number;

  constructor(
    private capacity: number,
    private fillPerSecond: number
  ) {
    this.tokens = capacity;
    this.lastFilled = Date.now();
  }

  take(): boolean {
    this.refill();
    if (this.tokens > 0) {
      this.tokens--;
      return true;
    }
    return false;
  }

  private refill(): void {
    const now = Date.now();
    const delta = (now - this.lastFilled) / 1000;
    const newTokens = delta * this.fillPerSecond;
    
    if (newTokens > 0) {
      this.tokens = Math.min(this.capacity, this.tokens + newTokens);
      this.lastFilled = now;
    }
  }
}



export const api = new ApiClient(env.SEARCH_IP_LOCATION_API_KEY);

// // Usage Example
// const api = new ApiClient('ngPRkA9yUN3cGEiXK7zgf1sh718kWVLU');

// // GET request with caching
// api.get<{ ip: string }>('https://api.apilayer.com/ip_to_location/121.234.73.213', {
//   cacheKey: 'ip_location_121.234.73.213',
//   cacheTTL: 3600, // 1 hour
// })
//   .then(response => console.log('IP Data:', response.data))
//   .catch(error => console.error('Error:', error));

// // POST request example
// api.post<{ id: string }>('https://api.example.com/resources', {
//   name: 'New Resource',
//   type: 'example',
// }, {
//   headers: {
//     'X-Custom-Header': 'value'
//   },
//   retries: 2
// });

// // Rate-limited PUT request
// api.put<{ status: string }>('https://api.example.com/resources/123', {
//   status: 'updated'
// });