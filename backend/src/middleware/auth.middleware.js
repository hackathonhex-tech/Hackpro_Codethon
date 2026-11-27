import { verifyAccessToken } from '../utils/jwt.js';
import { ApiError } from '../utils/ApiError.js';

export const authMiddleware = (req, res, next) => {
  let token = req.cookies?.access_token;

  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  if (!token) {
    return next(ApiError.unauthorized('Authentication token missing. Please log in.', 'AUTH_REQUIRED'));
  }

  const decoded = verifyAccessToken(token);
  if (!decoded) {
    return next(ApiError.unauthorized('Session expired or invalid token. Please refresh or log in again.', 'TOKEN_EXPIRED'));
  }

  req.user = decoded;
  next();
};
