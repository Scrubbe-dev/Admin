"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const env_1 = require("../config/env");
class MemoryCache {
    static instance;
    cache = new Map();
    cleaner;
    constructor() {
        this.cleaner = setInterval(() => this.cleanExpired(), 60_000);
    }
    static getInstance() {
        if (!MemoryCache.instance) {
            MemoryCache.instance = new MemoryCache();
        }
        return MemoryCache.instance;
    }
    async get(key) {
        const entry = this.cache.get(key);
        if (!entry || entry.expires < Date.now())
            return null;
        return entry.value;
    }
    async set(key, value, ttl) {
        this.cache.set(key, {
            value,
            expires: Date.now() + ttl * 1000,
        });
    }
    async delete(key) {
        this.cache.delete(key);
    }
    cleanExpired() {
        const now = Date.now();
        this.cache.forEach((value, key) => {
            if (value.expires < now)
                this.cache.delete(key);
        });
    }
    destroy() {
        clearInterval(this.cleaner);
        this.cache.clear();
    }
}
class ApiClient {
    apiKey;
    cache = MemoryCache.getInstance();
    rateLimiters = new Map();
    defaultHeaders;
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.defaultHeaders = {
            'apikey': this.apiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'SecureAuthGuard/1.0.0',
        };
    }
    async request(url, config = {}) {
        const { method = 'GET', headers = {}, body, query, cacheKey, cacheTTL } = config;
        try {
            // Check cache first
            if (cacheKey) {
                const cached = await this.cache.get(cacheKey);
                if (cached)
                    return { data: cached, status: 200, headers: new Headers() };
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
                data: data,
                status: response.status,
                headers: response.headers,
            };
        }
        catch (error) {
            if (config.retries && config.retries > 0) {
                return this.request(url, { ...config, retries: config.retries - 1 });
            }
            throw error;
        }
    }
    buildUrl(baseUrl, query) {
        const url = new URL(baseUrl);
        if (query) {
            Object.entries(query).forEach(([key, value]) => {
                url.searchParams.append(key, value);
            });
        }
        return url.toString();
    }
    async checkRateLimit(url) {
        const domain = new URL(url).hostname;
        if (!this.rateLimiters.has(domain)) {
            this.rateLimiters.set(domain, new TokenBucket(100, 10)); // 100 requests, 10 per second
        }
        const bucket = this.rateLimiters.get(domain);
        if (!bucket.take()) {
            throw new Error(`Rate limit exceeded for ${domain}`);
        }
    }
    // Convenience methods
    get(url, config) {
        return this.request(url, { ...config, method: 'GET' });
    }
    post(url, body, config) {
        return this.request(url, { ...config, method: 'POST', body: JSON.stringify(body) });
    }
    put(url, body, config) {
        return this.request(url, { ...config, method: 'PUT', body: JSON.stringify(body) });
    }
    patch(url, body, config) {
        return this.request(url, { ...config, method: 'PATCH', body: JSON.stringify(body) });
    }
    delete(url, config) {
        return this.request(url, { ...config, method: 'DELETE' });
    }
}
// Token Bucket Rate Limiter
class TokenBucket {
    capacity;
    fillPerSecond;
    tokens;
    lastFilled;
    constructor(capacity, fillPerSecond) {
        this.capacity = capacity;
        this.fillPerSecond = fillPerSecond;
        this.tokens = capacity;
        this.lastFilled = Date.now();
    }
    take() {
        this.refill();
        if (this.tokens > 0) {
            this.tokens--;
            return true;
        }
        return false;
    }
    refill() {
        const now = Date.now();
        const delta = (now - this.lastFilled) / 1000;
        const newTokens = delta * this.fillPerSecond;
        if (newTokens > 0) {
            this.tokens = Math.min(this.capacity, this.tokens + newTokens);
            this.lastFilled = now;
        }
    }
}
exports.api = new ApiClient(env_1.env.SEARCH_IP_LOCATION_API_KEY);
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
