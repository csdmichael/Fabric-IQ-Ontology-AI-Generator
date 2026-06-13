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

  return (request: Request, response: Response, next: NextFunction): void => {
    const now = Date.now();
    const key = `${request.ip}:${request.method}:${request.path}`;
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
