// Simple in-memory rate limiting store
const rateLimitStore = new Map<string, { attempts: number; timestamp: number }>();

interface RateLimitOptions {
    maxAttempts: number;
    windowMs: number;
}

interface RateLimitResult {
    success: boolean;
    msBeforeNext: number;
}

export async function rateLimit(
    key: string,
    options: RateLimitOptions
): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = Math.floor(now / options.windowMs) * options.windowMs;
    const record = rateLimitStore.get(key);

    // Clean up old entries
    if (record && record.timestamp < windowStart) {
        rateLimitStore.delete(key);
    }

    // Get or create record
    const current = rateLimitStore.get(key) || { attempts: 0, timestamp: now };
    current.attempts++;
    rateLimitStore.set(key, current);

    if (current.attempts > options.maxAttempts) {
        const msBeforeNext = (windowStart + options.windowMs) - now;
        return {
            success: false,
            msBeforeNext
        };
    }

    return {
        success: true,
        msBeforeNext: 0
    };
} 