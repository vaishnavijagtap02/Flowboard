// src/lib/rateLimit.ts
// Lightweight, zero-dependency in-memory rate limiter for API route protection.
// Prevents LLM quota exhaustion and brute-force flooding.

interface RateLimitConfig {
  maxRequests?: number; // Maximum requests allowed within window (default: 30)
  windowMs?: number;    // Window duration in milliseconds (default: 60_000, 1 min)
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp in ms when window resets
}

interface ClientRecord {
  count: number;
  resetTime: number;
}

// In-memory store: IP -> ClientRecord
const ipStore = new Map<string, ClientRecord>();

// Periodically clean up expired entries every 5 minutes to avoid memory leaks
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function purgeExpiredRecords() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  for (const [ip, record] of ipStore.entries()) {
    if (now >= record.resetTime) {
      ipStore.delete(ip);
    }
  }
}

/**
 * Extracts the client IP from standard proxy and CDN request headers.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const firstIp = forwarded.split(",")[0].trim();
    if (firstIp) return firstIp;
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();

  return "127.0.0.1";
}

/**
 * Checks if the incoming request is within rate limits.
 *
 * @param req The incoming HTTP Request
 * @param config Optional configuration for window duration and max requests
 */
export function checkRateLimit(req: Request, config: RateLimitConfig = {}): RateLimitResult {
  purgeExpiredRecords();

  const maxRequests = config.maxRequests ?? 30;
  const windowMs = config.windowMs ?? 60_000;
  const now = Date.now();

  const ip = getClientIp(req);
  const record = ipStore.get(ip);

  if (!record || now >= record.resetTime) {
    // New window for this IP
    const newRecord: ClientRecord = {
      count: 1,
      resetTime: now + windowMs,
    };
    ipStore.set(ip, newRecord);

    return {
      success: true,
      limit: maxRequests,
      remaining: Math.max(0, maxRequests - 1),
      reset: newRecord.resetTime,
    };
  }

  // Existing window
  if (record.count >= maxRequests) {
    return {
      success: false,
      limit: maxRequests,
      remaining: 0,
      reset: record.resetTime,
    };
  }

  record.count += 1;
  return {
    success: true,
    limit: maxRequests,
    remaining: Math.max(0, maxRequests - record.count),
    reset: record.resetTime,
  };
}

/**
 * Creates a standardized 429 Too Many Requests response with standard RateLimit headers.
 */
export function createRateLimitResponse(result: RateLimitResult): Response {
  const retryAfterSeconds = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));

  return Response.json(
    {
      error: "Too many requests. Please slow down and try again shortly.",
      code: "RATE_LIMITED",
      retryAfter: retryAfterSeconds,
    },
    {
      status: 429,
      headers: {
        "Retry-After": retryAfterSeconds.toString(),
        "X-RateLimit-Limit": result.limit.toString(),
        "X-RateLimit-Remaining": result.remaining.toString(),
        "X-RateLimit-Reset": result.reset.toString(),
      },
    }
  );
}
