import cors from 'cors';
import { env } from './env.js';

export const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    
    const allowed = env.CORS_ORIGINS.split(',').map((o) => o.trim());
    if (allowed.includes(origin) || allowed.includes('*')) {
      return callback(null, true);
    }
    // Allow localhost with any port in development
    if (env.NODE_ENV !== 'production' && origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-Id'],
};

export const corsMiddleware = cors(corsOptions);
