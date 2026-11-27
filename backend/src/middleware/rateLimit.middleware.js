import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

const extractGlobalKey = (req) => {
  const authHeader = req.headers?.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token) {
      return 'tok:' + crypto.createHash('sha256').update(token).digest('hex').slice(0, 16);
    }
  }
  const cookieToken = req.cookies?.access_token;
  if (cookieToken) {
    return 'tok:' + crypto.createHash('sha256').update(String(cookieToken)).digest('hex').slice(0, 16);
  }
  return 'ip:' + (req.ip || 'unknown');
};

export const globalRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: env.GLOBAL_RATE_LIMIT_MAX, // 300 req/min per authenticated session or unauthenticated IP (NAT-safe)
  keyGenerator: extractGlobalKey,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests, please slow down.',
    },
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: env.AUTH_RATE_LIMIT_MAX, // 30 attempts per 15 mins per IP+identifier (campus NAT-safe)
  keyGenerator: (req) => {
    const identifier = String(req.body?.identifier || req.body?.email || '').trim().toLowerCase();
    return `${req.ip || 'unknown'}:${identifier}`;
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMIT',
      message: 'Too many authentication attempts, please try again later.',
    },
  },
});

export const codeRunRateLimiter = rateLimit({
  windowMs: 15 * 1000, // 15 seconds cooldown window
  max: 1, // 1 run per 15 seconds per student
  keyGenerator: (req) => req.user?.userId || req.ip || 'unknown',
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'EXECUTION_RATE_LIMIT',
      message: 'Code run cooldown active. Please wait 15 seconds between code runs to protect test stability.',
    },
  },
});
