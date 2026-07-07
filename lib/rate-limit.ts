// A small in-memory sliding-window rate limiter.
//
// This lives in module memory, so it's per-instance: on a single long-lived
// server (local `next start`) it's a hard limit, and on serverless it throttles
// bursts that land on the same warm instance. That's enough to blunt the worst
// abuse of the eClass login action (each call launches a headless browser and a
// Duo push against Passport York) without pulling in a Redis dependency. For a
// strict global limit across all instances, back this with a shared store.

interface Bucket {
  timestamps: number[];
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

/**
 * Record a hit for `key` and report whether it's within `limit` requests per
 * `windowMs`. Old timestamps are pruned on each call so the map stays bounded
 * for active keys.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);

  if (bucket.timestamps.length >= limit) {
    const oldest = bucket.timestamps[0];
    const retryAfterSeconds = Math.ceil((windowMs - (now - oldest)) / 1000);
    buckets.set(key, bucket);
    return { allowed: false, retryAfterSeconds };
  }

  bucket.timestamps.push(now);
  buckets.set(key, bucket);
  return { allowed: true, retryAfterSeconds: 0 };
}
