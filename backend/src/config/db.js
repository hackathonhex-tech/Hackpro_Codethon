import mongoose from 'mongoose';
import dns from 'dns';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

// Ensure DNS servers can resolve SRV records for MongoDB Atlas clusters
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore if custom dns servers cannot be set
}

let isConnected = false;
let activeUri = '';

export const connectDB = async () => {
  if (isConnected) return mongoose.connection;

  // 1. Try Primary URI (Atlas or configured MONGO_URI)
  try {
    logger.info(`Attempting to connect to Primary MongoDB: ${env.MONGO_URI.replace(/:([^@]+)@/, ':****@')}`);
    const conn = await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      maxPoolSize: 50,
      minPoolSize: 5,
      maxIdleTimeMS: 30000,
    });
    isConnected = true;
    activeUri = env.MONGO_URI;
    logger.info(`✅ MongoDB Connected Successfully: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    logger.warn(`Primary MongoDB connection failed (${err.message}).`);
    if (env.MONGO_URI.includes('mongodb+srv://')) {
      logger.warn(`💡 Tip for MongoDB Atlas: ensure your current IP (or 0.0.0.0/0) is whitelisted in Atlas Network Access.`);
    }

    // 2. Fallback to Local MongoDB if primary was Atlas
    const localUri = 'mongodb://localhost:27017/hackpro';
    if (env.MONGO_URI !== localUri) {
      try {
        logger.info(`Falling back to local MongoDB daemon: ${localUri}`);
        const localConn = await mongoose.connect(localUri, {
          serverSelectionTimeoutMS: 3000,
          connectTimeoutMS: 3000,
          maxPoolSize: 50,
          minPoolSize: 5,
        });
        isConnected = true;
        activeUri = localUri;
        logger.info(`✅ Local MongoDB Connected Successfully: ${localConn.connection.host}`);
        return localConn;
      } catch (localErr) {
        logger.warn(`Local MongoDB daemon also unavailable: ${localErr.message}`);
      }
    }

    isConnected = false;
    activeUri = 'in-memory-fallback';
    logger.warn(`Operating in In-Memory / Hybrid Mode.`);
    return null;
  }
};

export const getDbStatus = () => ({
  isConnected,
  uri: activeUri || env.MONGO_URI,
  mode: isConnected ? (activeUri.includes('cluster0') ? 'mongodb-atlas' : 'mongodb-local') : 'in-memory-fallback',
});
