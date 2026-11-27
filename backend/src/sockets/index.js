import { Server } from 'socket.io';
import { logger } from '../utils/logger.js';
import { verifyAccessToken } from '../utils/jwt.js';
import { corsOptions } from '../config/cors.js';

let ioInstance = null;

const extractCookieToken = (cookieHeader, name) => {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const [k, ...rest] = part.trim().split('=');
    if (k === name) return decodeURIComponent(rest.join('='));
  }
  return null;
};

const isAdminMonitor = (user) => {
  if (!user) return false;
  const roleStr = String(user.role || '').toLowerCase();
  if (roleStr === 'super_admin' || roleStr === 'superadmin' || roleStr === 'admin' || user.isSuperAdmin === true) {
    return true;
  }
  const perms = Array.isArray(user.permissions) ? user.permissions : [];
  return (
    perms.includes('proctoring.view') ||
    perms.includes('leaderboard.view') ||
    perms.includes('submissions.view') ||
    perms.includes('attendance.view')
  );
};

export const initSocket = (httpServer) => {
  ioInstance = new Server(httpServer, {
    cors: corsOptions,
  });

  ioInstance.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.query?.token ||
      extractCookieToken(socket.handshake.headers?.cookie, 'access_token');

    if (!token) {
      return next(new Error('Authentication required'));
    }

    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return next(new Error('Invalid or expired authentication token'));
    }

    socket.user = decoded;
    next();
  });

  ioInstance.on('connection', (socket) => {
    logger.debug(`Socket connected: ${socket.id}`, { user: socket.user?.email });

    socket.on('join:contest', ({ contestId } = {}) => {
      if (contestId && socket.user) {
        socket.join(`contest:${contestId}`);
      }
    });

    socket.on('join:attempt', ({ attemptId } = {}) => {
      if (attemptId && socket.user) {
        socket.join(`attempt:${attemptId}`);
      }
    });

    socket.on('join:admin:contest', ({ contestId } = {}) => {
      if (!contestId || !isAdminMonitor(socket.user)) {
        logger.warn(`Unauthorized admin socket room join attempt by ${socket.user?.email || socket.id}`);
        socket.emit('error', { code: 'FORBIDDEN', message: 'Admin privileges required for monitor room' });
        return;
      }
      socket.join(`admin:contest:${contestId}`);
    });

    socket.on('disconnect', () => {
      logger.debug(`Socket disconnected: ${socket.id}`);
    });
  });

  return ioInstance;
};

export const getSocketServer = () => ioInstance;
