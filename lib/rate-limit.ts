type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitBucket>();

export function consumeRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, {
      count: 1,
      resetAt: now + windowMs
    });

    return {
      allowed: true,
      remaining: limit - 1,
      retryAfterSeconds: 0
    };
  }

  current.count += 1;
  buckets.set(key, current);

  const retryAfterSeconds = Math.ceil((current.resetAt - now) / 1000);

  return {
    allowed: current.count <= limit,
    remaining: Math.max(limit - current.count, 0),
    retryAfterSeconds
  };
}

export function clearRateLimit(key: string) {
  buckets.delete(key);
}
