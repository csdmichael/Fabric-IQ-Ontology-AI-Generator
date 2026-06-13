import { NextFunction, Request, Response } from 'express';

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
}

interface RateLimitEntry {
  count: number;
  expiresAt: number;
}

export const createRateLimit = ({ windowMs, maxRequests }: RateLimitOptions) => {
  const entries = new Map<string, RateLimitEntry>();
  const cleanup = (now = Date.now()): void => {
    for (const [key, entry] of entries) {
      if (entry.expiresAt <= now) {
        entries.delete(key);
      }
    }
  };
  const cleanupTimer = setInterval(() => cleanup(), windowMs);
  cleanupTimer.unref?.();

  return (request: Request, response: Response, next: NextFunction): void => {
    const now = Date.now();
    cleanup(now);

    const forwardedFor = request.header('x-forwarded-for')?.split(',')[0]?.trim();
    const clientAddress = forwardedFor || request.ip || 'unknown';
    const key = `${clientAddress}:${request.method}:${request.path}`;
    const current = entries.get(key);

    if (!current || current.expiresAt <= now) {
      entries.set(key, { count: 1, expiresAt: now + windowMs });
      next();
      return;
    }

    if (current.count >= maxRequests) {
      response.status(429).json({ message: 'Too many authentication attempts. Please try again shortly.' });
      return;
    }

    current.count += 1;
    entries.set(key, current);
    next();
  };
};
