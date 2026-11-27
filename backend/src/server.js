import http from 'http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { connectRedis } from './config/redis.js';
import { initSocket } from './sockets/index.js';
import { logger } from './utils/logger.js';
import { seedSuperAdmin } from '../scripts/seed-super-admin.js';
import { seedSampleContest } from '../scripts/seed-sample-contest.js';

const app = createApp();
const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

const startServer = async () => {
  try {
    // Connect Database & Cache
    await connectDB();
    connectRedis();

    // Seed Super Admin & sample contest
    await seedSuperAdmin();
    await seedSampleContest();

    const PORT = env.PORT || 5000;
    server.listen(PORT, () => {
      logger.info(`🚀 HACKPRO Backend API listening on port ${PORT} [${env.NODE_ENV}]`);
      logger.info(`📖 Swagger documentation available at http://localhost:${PORT}/api/docs`);
      logger.info(`🩺 Health endpoint available at http://localhost:${PORT}/api/health`);
    });
  } catch (err) {
    logger.error('Failed to start server:', { error: err.message });
    process.exit(1);
  }
};

// Graceful shutdown
const handleShutdown = (signal) => {
  logger.info(`Received ${signal}. Gracefully shutting down server...`);
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export { app, server };
