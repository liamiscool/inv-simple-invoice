/**
 * Simple in-memory rate limiter for public endpoints
 * Uses IP address as the key
 *
 * Note: This is a simple implementation suitable for low-medium traffic.
 * For high traffic, consider Redis-based rate limiting.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Store rate limit data in memory
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Check if a request should be rate limited
 *
 * @param key - Unique identifier (usually IP address)
 * @param namespace - Namespace for the rate limit (e.g., 'invoice-pdf')
 * @param maxRequests - Maximum requests allowed in the window
 * @param windowSeconds - Time window in seconds
 * @returns true if request is allowed, false if rate limited
 */
export function checkRateLimit(
  key: string,
  namespace: string,
  maxRequests: number,
  windowSeconds: number
): boolean {
  const rateLimitKey = `${namespace}:${key}`;
  const now = Date.now();

  const entry = rateLimitStore.get(rateLimitKey);

  if (!entry) {
    // First request - create new entry
    rateLimitStore.set(rateLimitKey, {
      count: 1,
      resetAt: now + windowSeconds * 1000
    });
    return true;
  }

  // Check if window has expired
  if (entry.resetAt < now) {
    // Reset the counter
    rateLimitStore.set(rateLimitKey, {
      count: 1,
      resetAt: now + windowSeconds * 1000
    });
    return true;
  }

  // Increment counter and check limit
  if (entry.count >= maxRequests) {
    return false; // Rate limited
  }

  entry.count++;
  return true;
}

/**
 * Get current rate limit status for a key
 * Useful for adding rate limit headers to responses
 */
export function getRateLimitStatus(
  key: string,
  namespace: string,
  maxRequests: number
): {
  remaining: number;
  resetAt: number | null;
} {
  const rateLimitKey = `${namespace}:${key}`;
  const entry = rateLimitStore.get(rateLimitKey);

  if (!entry) {
    return {
      remaining: maxRequests,
      resetAt: null
    };
  }

  const now = Date.now();
  if (entry.resetAt < now) {
    return {
      remaining: maxRequests,
      resetAt: null
    };
  }

  return {
    remaining: Math.max(0, maxRequests - entry.count),
    resetAt: entry.resetAt
  };
}
