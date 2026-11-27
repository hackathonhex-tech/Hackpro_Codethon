import { ApiError } from '../utils/ApiError.js';

export const validateBody = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse(req.body);
    req.body = parsed;
    next();
  } catch (err) {
    const details = err.errors ? err.errors.map((e) => ({ path: e.path.join('.'), message: e.message })) : err.message;
    next(ApiError.badRequest('Validation error', 'VALIDATION_ERROR', details));
  }
};

export const validateQuery = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse(req.query);
    req.query = parsed;
    next();
  } catch (err) {
    const details = err.errors ? err.errors.map((e) => ({ path: e.path.join('.'), message: e.message })) : err.message;
    next(ApiError.badRequest('Validation error in query parameters', 'VALIDATION_ERROR', details));
  }
};

export const validateParams = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse(req.params);
    req.params = parsed;
    next();
  } catch (err) {
    const details = err.errors ? err.errors.map((e) => ({ path: e.path.join('.'), message: e.message })) : err.message;
    next(ApiError.badRequest('Validation error in path parameters', 'VALIDATION_ERROR', details));
  }
};
