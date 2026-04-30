// Simple in-memory IP-based rate limiter.
// NOTE: This is per-instance — adequate as a first line of defense against
// naive abuse, but for distributed protection use Vercel KV / Upstash Redis.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function rateLimit(
  ip: string,
  limit: number,
  windowSec: number,
): { ok: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const windowMs = windowSec * 1000;
  const key = `${ip}`;
  const existing = buckets.get(key);

  if (!existing || existing.resetAt < now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { ok: true, remaining: limit - 1, resetAt };
  }

  existing.count += 1;
  const ok = existing.count <= limit;
  return { ok, remaining: Math.max(0, limit - existing.count), resetAt: existing.resetAt };
}

export function getClientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = request.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}
