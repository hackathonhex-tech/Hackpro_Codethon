import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { corsMiddleware } from './config/cors.js';
import { env } from './config/env.js';
import { globalRateLimiter } from './middleware/rateLimit.middleware.js';
import { requestIdMiddleware } from './middleware/requestId.middleware.js';
import { notFoundMiddleware } from './middleware/notFound.middleware.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import { swaggerSpec } from './config/swagger.js';
import { getDbStatus } from './config/db.js';
import apiRoutes from './routes/index.js';

export const createApp = () => {
  const app = express();

  // Trust reverse proxy headers (Railway, Nginx, Vercel) for accurate client IP
  app.set('trust proxy', env.TRUST_PROXY);

  // Security & standard middlewares
  app.use(helmet());
  app.use(corsMiddleware);
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());
  app.use(requestIdMiddleware);
  app.use(globalRateLimiter);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    const dbStatus = getDbStatus();
    res.status(200).json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: dbStatus,
      uptime: process.uptime(),
    });
  });

  // Swagger docs
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Mount API routes (both /api/v1 and /api for compatibility)
  app.use('/api/v1', apiRoutes);
  app.use('/api', apiRoutes);

  // 404 & Error handlers
  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
};

export default createApp;
