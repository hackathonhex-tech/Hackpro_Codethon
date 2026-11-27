import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export const errorMiddleware = (err, req, res, next) => {
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'An unexpected error occurred';
  let details = null;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;
  } else if (err.type === 'entity.too.large' || err.status === 413 || err.statusCode === 413) {
    statusCode = 413;
    code = 'PAYLOAD_TOO_LARGE';
    message = 'Request payload exceeds maximum allowed size';
  } else if (err instanceof SyntaxError && (err.status === 400 || err.statusCode === 400) && 'body' in err) {
    statusCode = 400;
    code = 'INVALID_JSON';
    message = 'Malformed JSON request body';
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = err.message;
    details = err.errors;
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'AUTH_TOKEN_INVALID';
    message = 'Authentication token is invalid or expired';
  } else if (err.code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE_KEY';
    message = 'A resource with this identifier already exists';
    details = err.keyValue;
  } else if (err instanceof Error) {
    message = err.message;
  }

  if (statusCode >= 500) {
    logger.error(`[500 ERROR] ${req.method} ${req.originalUrl} - ${message}`, {
      stack: err.stack,
      requestId: req.id,
    });
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
      ...(env.NODE_ENV !== 'production' && statusCode >= 500 ? { stack: err.stack } : {}),
    },
  });
};
