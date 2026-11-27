export class ApiError extends Error {
  constructor(statusCode, message, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad Request', code = 'BAD_REQUEST', details = null) {
    return new ApiError(400, message, code, details);
  }

  static unauthorized(message = 'Unauthorized', code = 'UNAUTHORIZED', details = null) {
    return new ApiError(401, message, code, details);
  }

  static forbidden(message = 'Forbidden: Insufficient permissions', code = 'FORBIDDEN', details = null) {
    return new ApiError(403, message, code, details);
  }

  static notFound(message = 'Resource not found', code = 'NOT_FOUND', details = null) {
    return new ApiError(404, message, code, details);
  }

  static conflict(message = 'Conflict', code = 'CONFLICT', details = null) {
    return new ApiError(409, message, code, details);
  }

  static attemptLocked(message = 'This attempt has already been submitted and is locked', code = 'ATTEMPT_LOCKED') {
    return new ApiError(403, message, code);
  }

  static tooManyRequests(message = 'Rate limit exceeded, please slow down', code = 'TOO_MANY_REQUESTS') {
    return new ApiError(429, message, code);
  }

  static internal(message = 'Internal Server Error', code = 'INTERNAL_ERROR', details = null) {
    return new ApiError(500, message, code, details);
  }
}
