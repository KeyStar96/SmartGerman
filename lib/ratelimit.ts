
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Define a return type for the rate limit check
export type RateLimitResult = {
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
};

// Allow for loose typing of the context to avoid strict dependency on Next.js types if not needed
// but typically we utilize the IP address.

const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

// Global cache for in-memory fallback (preserves state across hot-reloads in dev)
const globalForRateLimit = global as unknown as {
    rateLimitFallback: Map<string, { count: number; reset: number }>;
};

const memoryCache = globalForRateLimit.rateLimitFallback || new Map<string, { count: number; reset: number }>();

if (process.env.NODE_ENV !== "production") {
    globalForRateLimit.rateLimitFallback = memoryCache;
}

/**
 * Validates a request against a rate limit.
 * 
 * @param identifier Unique identifier for the client (usually IP address)
 * @param limit Max requests allowed
 * @param windowString Window size in human readable format (e.g. "60 s", "1 m") - Note: Fallback only supports "s" (seconds) and "m" (minutes) parsing simply.
 * @returns RateLimitResult
 */
export async function rateLimit(identifier: string, limit: number = 10, windowString: string = "60 s"): Promise<RateLimitResult> {
    // 1. Try Upstash Redis if configured
    if (UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN) {
        try {
            const redis = new Redis({
                url: UPSTASH_REDIS_REST_URL,
                token: UPSTASH_REDIS_REST_TOKEN,
            });

            // Parse window string for Upstash (it supports "10s", "10 s", "1 m", "1 h", "1 d")
            // We cast to any because the type definition might differ slightly across versions, 
            // but the library supports these strings.
            const ratelimit = new Ratelimit({
                redis: redis,
                limiter: Ratelimit.slidingWindow(limit, windowString as any),
                analytics: true,
                prefix: "@upstash/ratelimit",
            });

            const { success, remaining, reset } = await ratelimit.limit(identifier);

            return {
                success,
                limit,
                remaining,
                reset,
            };

        } catch (error) {
            console.error("RateLimit: Redis failed, falling back to memory.", error);
            // Fallback continues below
        }
    } else {
        // Log once (or occasionally) that we are running in memory mode?
        // console.log("RateLimit: Running in IN-MEMORY mode.");
    }

    // 2. In-Memory Fallback (Fixed Window)
    // Parse windowString to milliseconds
    const windowMs = parseWindowToMs(windowString);
    const now = Date.now();

    const record = memoryCache.get(identifier);

    if (!record) {
        // New record
        memoryCache.set(identifier, {
            count: 1,
            reset: now + windowMs
        });
        return {
            success: true,
            limit,
            remaining: limit - 1,
            reset: now + windowMs
        };
    }

    // Check if window has passed
    if (now > record.reset) {
        // Reset window
        record.count = 1;
        record.reset = now + windowMs;
        memoryCache.set(identifier, record);
        return {
            success: true,
            limit,
            remaining: limit - 1,
            reset: record.reset
        };
    }

    // Window is still active, check limit
    if (record.count >= limit) {
        return {
            success: false,
            limit,
            remaining: 0,
            reset: record.reset
        };
    }

    // Increment
    record.count += 1;
    memoryCache.set(identifier, record);

    return {
        success: true,
        limit,
        remaining: limit - record.count,
        reset: record.reset
    };
}

/**
 * Helper to parse simple window strings like "60 s", "1 m", "10 s" to milliseconds.
 * Defaults to 60000ms (1 minute) if parsing fails or unit unknown.
 */
function parseWindowToMs(windowString: string): number {
    const parts = windowString.split(" ");
    if (parts.length < 2) return 60000;

    const value = parseInt(parts[0]);
    const unit = parts[1].toLowerCase();

    if (isNaN(value)) return 60000;

    switch (unit) {
        case "s":
        case "sec":
        case "seconds":
            return value * 1000;
        case "m":
        case "min":
        case "minute":
        case "minutes":
            return value * 60 * 1000;
        case "h":
        case "hour":
        case "hours":
            return value * 60 * 60 * 1000;

        default:
            return value * 1000; // Assume seconds if unsure, or default logic
    }
}
